import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchHandler.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!mongoose.Types.ObjectId.isValid(channelId)) throw new ApiError(400, "Invalid channel ID")

    const userId = req.user._id
    if (userId.toString() === channelId) throw new ApiError(400, "You cannot subscribe to your own channel")

    const existing = await Subscription.findOne({ channel: channelId, subscriber: userId })
    if (existing) {
        await Subscription.findByIdAndDelete(existing._id)
        return res.status(200).json(new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully"))
    }

    await Subscription.create({ subscriber: userId, channel: channelId })
    res.status(200).json(new ApiResponse(200, { subscribed: true }, "Subscribed successfully"))
})

const getChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!mongoose.Types.ObjectId.isValid(channelId)) throw new ApiError(400, "Invalid channel ID")

    const subscribers = await Subscription.aggregate([
        { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [{ $project: { userName: 1, fullName: 1, avatar: 1 } }]
            }
        },
        { $unwind: "$subscriber" },
        { $replaceRoot: { newRoot: "$subscriber" } }
    ])

    res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!mongoose.Types.ObjectId.isValid(subscriberId)) throw new ApiError(400, "Invalid subscriber ID")

    const channels = await Subscription.aggregate([
        { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [{ $project: { userName: 1, fullName: 1, avatar: 1 } }]
            }
        },
        { $unwind: "$channel" },
        { $replaceRoot: { newRoot: "$channel" } }
    ])

    res.status(200).json(new ApiResponse(200, channels, "Subscribed channels fetched successfully"))
})

export { toggleSubscription, getChannelSubscribers, getSubscribedChannels }
