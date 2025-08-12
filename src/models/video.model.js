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

// Optimizes fetching a user's videos in reverse chronological order (e.g., channel page)
videoSchema.index({owner: 1, createdAt: -1}); 

 // Enables full-text search across video titles and descriptions (e.g., search bar queries)
videoSchema.index({title: 'text', description: 'text'});

// Speeds up sorting/filtering videos by view count (e.g., trending or most-viewed pages)
videoSchema.index({views: -1});

 // Optimizes queries for published videos sorted by newest first (e.g., public feed)
videoSchema.index({isPublished: 1, createdAt: -1});

// Improves filtering videos by length (e.g., "short" vs. "long" duration filters)
videoSchema.index({duration: 1}); 

videoSchema.pre('save', function(next) {
    this.title = this.title.replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
    this.description = this.description.replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
    next();
});

videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoSchema);