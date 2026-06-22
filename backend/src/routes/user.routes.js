import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
    registerUser, loginUser, logOutUser, refreshAccessToken,
    changePassword, getCurrentUser, updateAccountDetails,
    updateAvatar, updateCoverImage, getChannel, getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { decodeJwt } from "../middlewares/auth.middleware.js";

const router = Router()

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: "Too many requests, please try again after 15 minutes" }
})

router.route("/register").post(
    authLimiter,
    upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]),
    registerUser
)
router.route("/login").post(authLimiter, loginUser)
router.route("/refresh-token").post(refreshAccessToken)

// Protected routes
router.route("/logout").post(decodeJwt, logOutUser)
router.route("/change-password").post(decodeJwt, changePassword)
router.route("/current-user").get(decodeJwt, getCurrentUser)
router.route("/update-account").patch(decodeJwt, updateAccountDetails)
router.route("/avatar").patch(decodeJwt, upload.single("avatar"), updateAvatar)
router.route("/cover-image").patch(decodeJwt, upload.single("coverImage"), updateCoverImage)
router.route("/channel/:username").get(decodeJwt, getChannel)
router.route("/watch-history").get(decodeJwt, getWatchHistory)

export default router
