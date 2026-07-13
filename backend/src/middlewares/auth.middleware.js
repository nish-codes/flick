import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchHandler.js";
import jwt from "jsonwebtoken"

const decodeJwt = asyncHandler(async (req, _, next) => {
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    if (!accessToken) {
        throw new ApiError(401, "Unauthorized request")
    }
    let decoded
    try {
        decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
    } catch {
        throw new ApiError(401, "Invalid or expired access token")
    }
    const user = await User.findById(decoded?._id).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(401, "Invalid access token")
    }
    req.user = user
    next()
})

export { decodeJwt }
