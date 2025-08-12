import mongoose, {Schema} from "mongoose";
import ApiError from "../utils/ApiError.js";

const likeSchema = new Schema({
    comment:{
        type: Schema.Types.ObjectId,
        ref: 'Comment',
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: 'Video',
    },
    likedBy:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref: 'Tweet',
    }
},{
    timestamps: true,
})

likeSchema.pre("save",function(next){
    if (!this.comment && !this.video && !this.tweet){
        return next(new ApiError(400, "Like must be associated with a comment, video, or tweet"));
    }
    next();
})

// Ensures a user can only like a specific comment,video or tweet once to prevent duplicate likes.
likeSchema.index({comment:1, likedBy:1},{unique: true});
likeSchema.index({video:1, likedBy:1},{unique: true});
likeSchema.index({tweet:1, likedBy:1},{unique: true});

// index to quickly fetch likes sorted by newest first, useful for "recent likes" feeds.
likeSchema.index({createdAt: -1});

// indexing for fast retrieval of all likes on a particular video, comment or tweet. 
likeSchema.index({video:1})
likeSchema.index({comment:1});
likeSchema.index({tweet:1});

export const Like = mongoose.model("Like", likeSchema);