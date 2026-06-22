import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchHandler.js";

const verifyVideoOwnership = asyncHandler(async (req, _, next) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action")
    }
    req.video = video
    next()
})

const verifyCommentOwnership = asyncHandler(async (req, _, next) => {
    const { commentId } = req.params
    const comment = await Comment.findById(commentId)
    if (!comment) throw new ApiError(404, "Comment not found")
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action")
    }
    req.comment = comment
    next()
})

const verifyPlaylistOwnership = asyncHandler(async (req, _, next) => {
    const { playlistId } = req.params
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action")
    }
    req.playlist = playlist
    next()
})

export { verifyVideoOwnership, verifyCommentOwnership, verifyPlaylistOwnership }
