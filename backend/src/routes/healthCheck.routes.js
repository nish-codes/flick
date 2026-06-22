import { Router } from "express";
import { heatlthCheck } from "../controllers/healthCheck.controller.js";

const router = Router()
router.route("/").get(heatlthCheck)

export default router
