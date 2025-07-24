import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}); // Configure Cloudinary with environment variables

export const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) return null; // Check if filePath is provided
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    }); // Upload the file to Cloudinary
    console.log("Image uploaded to Cloudinary:", result);  
    fs.unlinkSync(filePath); // Delete the file after upload
    return result; 
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    fs.unlinkSync(filePath); // Ensure the file is deleted even if upload fails
    return null;
  }
};
