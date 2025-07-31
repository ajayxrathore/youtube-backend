import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    channel:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }, // The channel that the user is subscribing to
    subscriber:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    } // The user who is subscribed to the channel
}
    ,{timestamps: true}
);
export const Subscription = mongoose.model("Subscription", subscriptionSchema);