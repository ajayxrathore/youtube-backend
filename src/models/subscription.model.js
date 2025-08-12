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
subscriptionSchema.index({channel: 1, subscriber: 1}, {unique: true}); // Ensures a user can only subscribe to a channel once

// For quick lookup of subscribers by channel
subscriptionSchema.index({channel:1})

// For quick lookup of subscriptions by subscriber
subscriptionSchema.index({subscriber:1});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);