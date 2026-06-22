import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asynchHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400, "Invalid video ID")

    const { page = 1, limit = 10 } = req.query

    const pipeline = [
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { _id: 1, userName: 1, avatar: 1, fullName: 1 } }]
            }
        },
        { $unwind: "$owner" }
    ]

    const options = { page: Number(page), limit: Number(limit) }
    const comments = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options)
    res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body
    if (!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400, "Invalid video ID")
    if (!content?.trim()) throw new ApiError(400, "Comment content is required")

    const comment = await Comment.create({
        content: content.trim(),
        owner: req.user._id,
        video: videoId
    })

    const populated = await Comment.findById(comment._id).populate("owner", "userName avatar fullName")
    res.status(201).json(new ApiResponse(201, populated, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body
    if (!content?.trim()) throw new ApiError(400, "Comment content is required")

    // req.comment is set by verifyCommentOwnership middleware
    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        { content: content.trim() },
        { new: true }
    ).populate("owner", "userName avatar fullName")

    res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    await Comment.findByIdAndDelete(commentId)
    res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

export { getVideoComments, addComment, updateComment, deleteComment }
