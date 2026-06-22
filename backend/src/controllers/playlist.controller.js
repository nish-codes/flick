import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    if (!name || !description) throw new ApiError(400, "Name and description are required")

    const userId = req.user._id
    const newPlaylist = await Playlist.create({ name, description, owner: userId })
    res.status(201).json(new ApiResponse(201, newPlaylist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const playlists = await Playlist.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $addFields: {
                videoCount: { $size: "$videoDetails" },
                thumbnail: { $first: "$videoDetails.thumbnail" }
            }
        },
        {
            $project: {
                name: 1, description: 1, videoCount: 1, thumbnail: 1, createdAt: 1
            }
        }
    ])

    res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!mongoose.Types.ObjectId.isValid(playlistId)) throw new ApiError(400, "Invalid playlist ID")

    const playlist = await Playlist.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(playlistId) } },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
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
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerInfo",
                pipeline: [{ $project: { userName: 1, avatar: 1 } }]
            }
        },
        { $unwind: { path: "$ownerInfo", preserveNullAndEmptyArrays: true } }
    ])

    if (!playlist.length) throw new ApiError(404, "Playlist not found")
    res.status(200).json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { videoId, playlistId } = req.params
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        { $addToSet: { videos: new mongoose.Types.ObjectId(videoId) } },
        { new: true }
    )
    if (!updatedPlaylist) throw new ApiError(404, "Playlist not found")
    res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video added to playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { videoId, playlistId } = req.params
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        { $pull: { videos: new mongoose.Types.ObjectId(videoId) } },
        { new: true }
    )
    if (!updatedPlaylist) throw new ApiError(404, "Playlist not found")
    res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const deleted = await Playlist.findByIdAndDelete(playlistId)
    if (!deleted) throw new ApiError(404, "Playlist not found")
    res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    if (!name && !description) throw new ApiError(400, "At least one field (name or description) is required")

    const update = {}
    if (name) update.name = name
    if (description) update.description = description

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, update, { new: true })
    if (!updatedPlaylist) throw new ApiError(404, "Playlist not found")
    res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))
})

export { createPlaylist, updatePlaylist, addVideoToPlaylist, deletePlaylist, getUserPlaylists, getPlaylistById, removeVideoFromPlaylist }
