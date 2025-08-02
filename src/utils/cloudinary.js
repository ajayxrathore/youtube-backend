import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";

dotenv.config({
    path:"./.env",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
}); 

const uploadOnCloudinary = async (filePath,folder) => {
  try {

    if (!filePath) return null; 
    const options = {
      resource_type: "auto",
    }
    if (folder) {
      options.folder = folder;
    }
    const result = await cloudinary.uploader.upload(filePath,options); 

    console.log("Image uploaded to Cloudinary");  

    fs.unlinkSync(filePath); 
    return result; 

  } catch (error) {

    console.error("Error while uploading image to Cloudinary", error);

    fs.unlinkSync(filePath);
    return null;

  }
};
const deleteFromCloudinary = async (publicId)=>{
  try {
    if(!publicId){
      throw new ApiError(400,"Public ID is required to delete image");
    }
    const result = await cloudinary.uploader.destroy(publicId);
    if(result.result !== "ok"){
      throw new ApiError(500,"Image couldn't be deleted from Cloudinary");
    }
    console.log("Image deleted from Cloudinary");
    return result;
  } catch (error) {
    console.error("Error while deleting image from Cloudinary", error);
    throw new ApiError(500,"Error while deleting image from Cloudinary");
  }
}
export {
    uploadOnCloudinary,
    deleteFromCloudinary
}