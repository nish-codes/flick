import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400, "Invalid video ID")

    const userId = req.user._id
    const existingLike = await Like.findOne({ likedBy: userId, video: videoId })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Video unliked"))
    }

    const newLike = await Like.create({ likedBy: userId, video: videoId })
    res.status(200).json(new ApiResponse(200, { liked: true, like: newLike }, "Video liked"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!mongoose.Types.ObjectId.isValid(commentId)) throw new ApiError(400, "Invalid comment ID")

    const userId = req.user._id
    const existingLike = await Like.findOne({ likedBy: userId, comment: commentId })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Comment unliked"))
    }

    const newLike = await Like.create({ likedBy: userId, comment: commentId })
    res.status(200).json(new ApiResponse(200, { liked: true, like: newLike }, "Comment liked"))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const liked = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [{ $project: { userName: 1, avatar: 1 } }]
                        }
                    },
                    { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } }
                ]
            }
        },
        { $unwind: "$videoDetails" },
        { $replaceRoot: { newRoot: "$videoDetails" } }
    ])

    res.status(200).json(new ApiResponse(200, liked, "Liked videos fetched successfully"))
})

export { toggleVideoLike, toggleCommentLike, getLikedVideos }
