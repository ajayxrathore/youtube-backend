import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

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
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Failed to generate tokens: " + error.message);
    }
}
const updateImage = async(req, res, fieldName, folder)=>{
    const localFilePath = req.file?.path
    if (!localFilePath){
        throw new ApiError(400,"File path is missing")
    }
    const file = await uploadOnCloudinary(localFilePath,folder)
    if(!file || !file.secure_url || !file.public_id){
        throw new ApiError(500,"File couldn't be uploaded")
    }
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(404,"User not found")
    }
    const oldImagePublicId = user[fieldName]?.public_id
    const updatedUser=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            [`${fieldName}.url`]:file.secure_url,
            [`${fieldName}.public_id`]:file.public_id
        }
    },{
        new:true
    }).select("-password")
    if(oldImagePublicId){
        await deleteFromCloudinary(oldImagePublicId)
    }
    
    return res.status(200).json(
        new ApiResponse(200,
            "User Image updated successfully",
            updatedUser
        )
    )
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
    const avatar = await uploadOnCloudinary(avatarLocalPath,"avatars")
    const coverImage = coverLocalPath ? await uploadOnCloudinary(coverLocalPath,"coverImages") :null
    if(!avatar){
        throw new ApiError(500,"Failed to Upload avatar")
    }
    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        email,
        password,
        avatar:{
            url: avatar.secure_url,
            public_id: avatar.public_id
        },
        coverImage:{
            url: coverImage ? coverImage.secure_url : "",
            public_id: coverImage ? coverImage.public_id : ""
        }
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
const deleteUser = asyncHandler( async(req,res)=>{
    if (!req.user?._id){
        throw new ApiError(401,"User not authenticated")
    }
    const user = await User.findById(req.user._id)
    if(!user){
        throw new ApiError(404,"User not found")
    }
    const avatarPubblicId = user.avatar?.public_id
    const coverImagePublicId = user.coverImage?.public_id
    await User.findByIdAndDelete(req.user._id)
    if(avatarPubblicId){
        await deleteFromCloudinary(avatarPubblicId)
    }
    if(coverImagePublicId){
        await deleteFromCloudinary(coverImagePublicId)
    }
     const options = {
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,
            "User deleted successfully",
            {}
        )
    )
})
const refreshAccessToken = asyncHandler( async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken){
        throw new ApiError(401,"Refresh token is required to refresh access token")
    }
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken._id)
    if(!user || incomingRefreshToken!==user.refreshToken){
        throw new ApiError(401,"Refresh token is invalid or expired")
    }
    const {newRefreshToken,accessToken}= await generateAccessAndRefreshToken(user._id)
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
        new ApiResponse(
            200,
            "Access token & refresh token refreshed successfully",
            {
            accessToken,
            refreshToken:newRefreshToken
            }
        ),

    )
     
})
const updatePassword = asyncHandler( async (req,res)=>{
    const {currentPassword, newPassword} = req.body
    if (!currentPassword || !newPassword){
        throw new ApiError(400,"Current password and new password are required")
    }
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(404,"User not found")
    }
    const isPasswordValid  = await user.isPasswordCorrect(currentPassword)
    if(!isPasswordValid){
        throw new ApiError(401,"Current password is incorrect")
    }
    user.password = newPassword
    await user.save()
    return res.status(200).json(
        new ApiResponse(
            200,
            "Password updated successfully",
            {}
        )
    )
})
const currentUser = asyncHandler( async (req,res)=>{
    return res.status(200).json(
        new ApiResponse(
            200,
            "Current user fetched successfully",
            req.user
        )
    )
})
const updateUser = asyncHandler( async (req,res)=>{
    const {fullName, email} = req.body
    if(!fullName || !email){
        throw new ApiError(400,"Full Name and Email are required!")
    }
    const updatedUser= await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {
            new:true
        }).select("-password")
    return res.status(200).json(
        new ApiResponse(200,
            "User updated successfully",
            updatedUser
        )
    )
  

    
})
const updateAvatar = asyncHandler(async(req,res)=>{
    await updateImage(req, res, "avatar","avatars")
})
const updateCoverImage = asyncHandler(async(req,res)=>{
    await updateImage(req, res, "coverImage","coverImages")
})
const getUserChannel = asyncHandler( async(req,res)=>{
    const {username} = req.params
    if(!username){
        throw new ApiError(400, "Username is missing")
    }
    const channel = await User.aggregate([
        {
            $match:{
                username:username.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                username:1,
                email:1,
                fullName:1,
                avatar:1,
                coverImage:1,
                subscribersCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404,"Channel not found")
    }
    return res.status(200).json(
        new ApiResponse(
            200,
            "Channel fetched successfully",
            channel[0]
        )
    )
})
const getWatchHistory = asyncHandler( async(req,res)=>{
    if(!req.user?._id){
        throw new ApiError(401,"User not authenticated")
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit)|| 10;
    const skip = (page -1)*limit;
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $cond:{
                                    if:{
                                        $gt:[{$size:"$owner"},0]
                                    },
                                    then:{
                                        $first:"$owner"
                                    },
                                    else:null
                                }
                            }
                        }
                    },
                    {
                        $skip: skip
                    },
                    {
                        $limit: limit
                    }
                ],
            }
        }
    ])
    if(!user?.length){
        throw new ApiError(404,"User not found")
    }
    return res.status(200).json(
        new ApiResponse(200,
            "User watch history fetched successfully",
            user[0].watchHistory
        )
    )
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    deleteUser,
    refreshAccessToken,
    updatePassword,
    currentUser,
    updateUser,
    updateAvatar,
    updateCoverImage,
    getUserChannel,
    getWatchHistory
};