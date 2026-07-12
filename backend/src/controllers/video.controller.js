import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynchHandler.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, uploadVideoOnCloudinary, deleteFromCloudinary, generateUploadSignature } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Subscription } from "../models/subscription.model.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query

    const matchStage = { isPublished: true }
    if (query) {
        matchStage.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }
    if (userId) matchStage.owner = new mongoose.Types.ObjectId(userId)

    const pipeline = [
        { $match: matchStage },
        { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerInfo",
                pipeline: [{ $project: { _id: 1, userName: 1, avatar: 1, fullName: 1 } }]
            }
        },
        { $unwind: "$ownerInfo" }
    ]

    const options = { page: Number(page), limit: Number(limit) }
    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options)
    res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400, "Invalid video ID")

    const video = await Video.findById(videoId)
        .populate("owner", "_id userName avatar fullName")

    if (!video) throw new ApiError(404, "Video not found")

    const [likesCount, isLikedDoc, subscribersCount] = await Promise.all([
        Like.countDocuments({ video: videoId }),
        req.user ? Like.findOne({ video: videoId, likedBy: req.user._id }) : null,
        Subscription.countDocuments({ channel: video.owner._id }),
        req.user ? User.findByIdAndUpdate(req.user._id, { $addToSet: { watchHistory: videoId } }) : null
    ])

    res.status(200).json(new ApiResponse(200, {
        ...video.toObject(),
        likesCount,
        isLiked: !!isLikedDoc,
        subscribersCount
    }, "Video fetched successfully"))
})

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    const userId = req.user._id
    if (!title || !description) throw new ApiError(400, "Title and description are required")

    const videoPath = req.files?.video?.[0]?.path
    const thumbnailPath = req.files?.thumbnail?.[0]?.path
    if (!videoPath || !thumbnailPath) throw new ApiError(400, "Video file and thumbnail are required")

    const [videoUpload, thumbnailUpload] = await Promise.all([
        uploadVideoOnCloudinary(videoPath),
        uploadOnCloudinary(thumbnailPath)
    ])
    if (!videoUpload || !thumbnailUpload) throw new ApiError(500, "Failed to upload video or thumbnail")

    const newVideo = await Video.create({
        title,
        description,
        thumbnail: thumbnailUpload.url,
        videoFile: videoUpload.secure_url,
        streamUrl: videoUpload.streamUrl,
        duration: videoUpload.duration,
        owner: userId,
        isPublished: true
    })

    res.status(201).json(new ApiResponse(201, newVideo, "Video published successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnailPath = req.file?.path
    const update = {}

    if (title) update.title = title
    if (description) update.description = description
    if (thumbnailPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailPath)
        if (!thumbnail) throw new ApiError(500, "Failed to upload thumbnail")
        await deleteFromCloudinary(req.video.thumbnail)
        update.thumbnail = thumbnail.url
    }
    if (!Object.keys(update).length) throw new ApiError(400, "No fields provided for update")

    const updatedVideo = await Video.findByIdAndUpdate(videoId, update, { new: true })
    res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findByIdAndDelete(videoId)
    if (!video) throw new ApiError(404, "Video not found")

    await Promise.all([
        deleteFromCloudinary(video.videoFile),
        deleteFromCloudinary(video.thumbnail)
    ])

    res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findByIdAndUpdate(videoId,
        [{ $set: { isPublished: { $not: "$isPublished" } } }],
        { new: true }
    )
    if (!video) throw new ApiError(404, "Video not found")
    res.status(200).json(new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"} successfully`))
})

const recordView = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400, "Invalid video ID")
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } })
    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, { $addToSet: { watchHistory: videoId } })
    }
    res.status(200).json(new ApiResponse(200, {}, "View recorded"))
})

const getUploadSignature = asyncHandler(async (req, res) => {
    const videoSig = generateUploadSignature("flick/videos", "video")
    const thumbSig = generateUploadSignature("flick/thumbnails", "image")
    res.status(200).json(new ApiResponse(200, { video: videoSig, thumbnail: thumbSig }, "Signatures generated"))
})

const saveVideo = asyncHandler(async (req, res) => {
    const { title, description, videoFile, thumbnail, duration, publicId } = req.body
    if (!title || !videoFile || !thumbnail) throw new ApiError(400, "Title, video and thumbnail are required")

    const newVideo = await Video.create({
        title,
        description: description || "",
        thumbnail,
        videoFile,
        streamUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/sp_hd/${publicId}.m3u8`,
        duration: duration || 0,
        owner: req.user._id,
        isPublished: true
    })

    res.status(201).json(new ApiResponse(201, newVideo, "Video published successfully"))
})

export { getAllVideos, getVideoById, publishVideo, updateVideo, deleteVideo, togglePublishStatus, recordView, getUploadSignature, saveVideo }
