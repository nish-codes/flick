import mongoose ,{Schema}from "mongoose";


const subscriptionSchma = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId,
        ref:"User"
    },
    channel : {
        type : Schema.Types.ObjectId,
        ref:"User"
    }
}
)

subscriptionSchma.index({ subscriber: 1, channel: 1 }, { unique: true })

export const Subscription = mongoose.model("Subscription",subscriptionSchma)