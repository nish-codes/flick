import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchHandler.js";
import { Subscription } from "../models/subscription.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id

    const [videoCount, subscribers, likeAgg, viewAgg] = await Promise.all([
        Video.countDocuments({ owner: channelId }),
        Subscription.countDocuments({ channel: channelId }),
        Like.aggregate([
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videoDetails"
                }
            },
            { $unwind: "$videoDetails" },
            { $match: { "videoDetails.owner": new mongoose.Types.ObjectId(channelId) } },
            { $group: { _id: null, totalLikes: { $sum: 1 } } }
        ]),
        Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
            { $group: { _id: null, totalViews: { $sum: "$views" } } }
        ])
    ])

    const stats = {
        videoCount,
        subscribers,
        totalLikes: likeAgg[0]?.totalLikes || 0,
        totalViews: viewAgg[0]?.totalViews || 0
    }

    res.status(200).json(new ApiResponse(200, stats, "Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id
    const videos = await Video.find({ owner: channelId })
        .sort({ createdAt: -1 })
        .select("title thumbnail views isPublished duration createdAt")

    res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export { getChannelStats, getChannelVideos }
