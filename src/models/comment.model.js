import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    content:{
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 500
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: 'Video',
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
},{
    timestamps: true,
})

// indexing to quickly fetch comments for video, ordered by newest first
commentSchema.index({video:1, createdAt: -1}); 

// indexing to quickly find all comments made by a specific user.for showing a user's comment history.
commentSchema.index({owner:1, createdAt: -1}); 

commentSchema.pre('save', function(next) {
    this.content = this.content.replace(/<\/?[^>]+(>|$)/g, "") // Remove HTML tags
    next();
});

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);