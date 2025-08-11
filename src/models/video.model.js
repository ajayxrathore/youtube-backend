import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema({
    title:{
        type:String,
        required:[true,"Title is required"],
        trim:true,
        minlength:3,
        maxlength:100,    
    },
    description:{
        type:String,
        required:true,
        trim:true,
        minlength:10,
        maxlength:500,    
    },
    duration:{
        type:Number,
        required:true,
        min:1, // duration in seconds
        max:36000, // maximum duration in seconds (10 hours)
    },
    views:{
        type:Number,
        default:0,
    },
    videoFile:{
        type:String,
        required:true,
    },
    thumbnail:{
        type:String,
        required:true,
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    isPublished:{
        type:Boolean,
        default:true,
    },

},{timestamps:true})
videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoSchema);