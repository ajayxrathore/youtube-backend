import mongoose, {Schema} from "mongoose";

const tweetSchema = new Schema({
    content:{
        type: String,
        required: true, 
        trim: true,
        minlength: 1,
        maxlength: 280
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
},{timestamps: true});

// Compound index to quickly fetch tweets by a specific owner, sorted by newest first (e.g., showing a user's latest tweets on their profile)
tweetSchema.index({owner: 1, createdAt: -1}); 

export const Tweet = mongoose.model("Tweet", tweetSchema);