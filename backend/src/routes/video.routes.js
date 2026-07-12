import { Router } from "express";
import {
    getAllVideos, getVideoById, publishVideo,
    updateVideo, deleteVideo, togglePublishStatus, recordView,
    getUploadSignature, saveVideo
} from "../controllers/video.controller.js";
import { decodeJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyVideoOwnership } from "../middlewares/ownership.middleware.js";

const router = Router()

router.route("/").get(getAllVideos)
router.route("/upload-signature").get(decodeJwt, getUploadSignature)
router.route("/save").post(decodeJwt, saveVideo)
router.route("/:videoId").get(getVideoById)
router.route("/:videoId/view").post(recordView)

// Protected routes
router.route("/").post(
    decodeJwt,
    upload.fields([{ name: "video", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]),
    publishVideo
)
router.route("/:videoId").patch(decodeJwt, verifyVideoOwnership, upload.single("thumbnail"), updateVideo)
router.route("/:videoId").delete(decodeJwt, verifyVideoOwnership, deleteVideo)
router.route("/toggle/:videoId").patch(decodeJwt, verifyVideoOwnership, togglePublishStatus)

export default router
