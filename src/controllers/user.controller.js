import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const registerUser = asyncHandler( async (req,res)=>{
    const {username, email, fullName, password} = req.body
    if (!username || !email || !fullName || !password){
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
    const {avatar, coverImage} = await Promise.all([
        uploadOnCloudinary(avatarLocalPath),
        coverLocalPath ? uploadOnCloudinary(coverLocalPath) : Promise.resolve(null)
    ])
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

export { 
    registerUser,
};