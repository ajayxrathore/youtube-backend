import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"


export const verifyJWT = asyncHandler(async (req, _, next) => {
    const headerToken = req.header("Authorization").replace("Bearer ","")
    const cookieToken = req.cookies?.("accessToken")
    const token = cookieToken || headerToken
    if(!token){
        throw new ApiError(401,"Access token missing: Unauthorized")
    }
    let decodedToken;
    try {
        decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    } catch (error) {
        throw new ApiError(401,"Invalid or expired access token")
    }
    const user = await User.findById(decodedToken._id).select("-password -refreshToken")
    if(!user){
        throw new ApiError(401,"User does not exists")
    }
    req.user= user
    next()
})