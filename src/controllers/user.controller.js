import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        if(!userId){
            throw new ApiError(400,"User ID is required to generate tokens")
        }
        const user = await User.findById(userId)
        if(!user){
            throw new ApiError(404,"User not found")
        }
        const accessToken =  user.generateAccessToken()
        const refreshToken =  user.generateRefreshToken()
         
        await User.updateOne({_id:user._id},{refreshToken}, {timestamps:false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500, "Failed to generate tokens: " + error.message);
    }
}

const registerUser = asyncHandler( async (req,res)=>{
    const {username, email, fullName, password} = req.body
    if ([username, email, password, fullName].some(field=> field?.trim() === "")){
        throw new ApiError(400,"All fields are required")
    }
    const existingUser = await User.findOne({
        $or : [{username},{email}]
    })
    if (existingUser){
        throw new ApiError(409,"User with this email or username already exists")
    }
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverLocalPath = req.files?.coverImage?.[0]?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = coverLocalPath ? await uploadOnCloudinary(coverLocalPath) :null
    if(!avatar){
        throw new ApiError(500,"Failed to Upload avatar")
    }
    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        email,
        password,
        avatar:avatar?.url,
        coverImage:coverImage?.url || ""
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser){
        throw new ApiError(500," failed to create User")
    }
    return res.status(201).json(
        new ApiResponse(
            201,
            "User created successfully",
            createdUser
        )
    )
})
const loginUser = asyncHandler( async (req,res)=>{
    const {email, username, password} = req.body
    if (!password || !(email || username)){
        throw new ApiError(400, "Username/email and password are required")
    }
    const user = await User.findOne({
        $or:[{email},{username}]
    })
    if(!user){
        throw new ApiError(404, "User does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials")
    }
    const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {user:loggedInUser, accessToken, refreshToken},
            "User Logged In")
    )
})
const logoutUser =  asyncHandler( async (req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $unset:{
            refreshToken:1
        }
    })
    const options = {
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,
            "User logged out successfully",
            {}
        )
    )
})
export { 
    registerUser,
    loginUser,
    logoutUser
};