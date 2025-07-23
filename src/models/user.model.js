import mongoose, {Schema} from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        minlength:3,
        maxlength:20,
        index:true,
        match:/^[a-zA-Z0-9]+$/,    
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        match:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,    
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        minlength:3,
        maxlength:50,
    },
    password:{
        type:String,
        required:[true,"Password is required"],
        minlength:4,
        maxlength:24,
    },
    avatar:{
        type:String,
        required:true,    
    },
    coverImage:{
        type:String,    
    },
    refreshToken:{
        type:String,    
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video",
        }
    ]
},{timestamps:true});
userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,10);
    }
    next();
})
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {id:this._id,username:this.username},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn:"1d"}
    );
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {id:this._id,username:this.username},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn:"7d"}
    );
}
export const User = mongoose.model("User", userSchema);