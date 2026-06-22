import { Router } from "express";
import { getVideoComments, addComment, updateComment, deleteComment } from "../controllers/comment.controller.js";
import { decodeJwt } from "../middlewares/auth.middleware.js";
import { verifyCommentOwnership } from "../middlewares/ownership.middleware.js";

const router = Router()

router.route("/:videoId").get(getVideoComments)
router.route("/:videoId").post(decodeJwt, addComment)
router.route("/c/:commentId").patch(decodeJwt, verifyCommentOwnership, updateComment)
router.route("/c/:commentId").delete(decodeJwt, verifyCommentOwnership, deleteComment)

export default router
