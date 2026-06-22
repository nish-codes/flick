import { Router } from "express";
import { toggleSubscription, getChannelSubscribers, getSubscribedChannels } from "../controllers/subscription.controller.js";
import { decodeJwt } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/toggle/:channelId").post(decodeJwt, toggleSubscription)
router.route("/channel/:channelId").get(getChannelSubscribers)
router.route("/user/:subscriberId").get(getSubscribedChannels)

export default router
