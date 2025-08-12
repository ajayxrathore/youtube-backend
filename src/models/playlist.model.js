import mongoose, {Schema} from "mongoose";
import ApiError from "../utils/ApiError.js";

const playlistSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 30
    },
    description: {
        type: String,
        maxlength: 500,
        trim: true,
    },
    videos:[
        {
            type: Schema.Types.ObjectId,
            ref: 'Video',
        }
    ],
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
},{timestamps: true});

// index to efficiently retrieve playlists belonging to a specific owner
playlistSchema.index({owner: 1, createdAt: -1}); 

// index to quickly find playlists by name or description, useful for search functionality.
playlistSchema.index({name: 'text', description: 'text'}); 

playlistSchema.pre('save',function(next) {
    if (!this.videos || this.videos.length === 0) {
        return next(new ApiError(400, "Playlist must contain at least one video"));
    }
    next();
})

export const Playlist = mongoose.model("Playlist", playlistSchema);