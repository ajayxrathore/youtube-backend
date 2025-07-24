import multer from "multer";

const storage = multer.diskStorage({
    destination: function(req, file, cb){ 
        cb(null, "./public"); // Set the destination for uploaded files
    },
    filename: function(req,file,cb){
        cb(null,file.originalname); // Use the original file name for the uploaded file
    }
})
 
export const upload = multer({
    storage, // Use the defined storage configuration
})