import { Router } from "express";
import {
    createPlaylist, getUserPlaylists, getPlaylistById,
    addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist
} from "../controllers/playlist.controller.js";
import { decodeJwt } from "../middlewares/auth.middleware.js";
import { verifyPlaylistOwnership } from "../middlewares/ownership.middleware.js";

const router = Router()
router.use(decodeJwt)

router.route("/").post(createPlaylist)
router.route("/user").get(getUserPlaylists)
router.route("/:playlistId").get(getPlaylistById)
router.route("/:playlistId").patch(verifyPlaylistOwnership, updatePlaylist)
router.route("/:playlistId").delete(verifyPlaylistOwnership, deletePlaylist)
router.route("/:playlistId/video/:videoId").post(verifyPlaylistOwnership, addVideoToPlaylist)
router.route("/:playlistId/video/:videoId").delete(verifyPlaylistOwnership, removeVideoFromPlaylist)

export default router
