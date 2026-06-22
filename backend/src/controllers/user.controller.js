import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

const generateTokens = async (id) => {
    try {
        const user = await User.findById(id)
        if (!user) throw new ApiError(400, "User not found")
        const accessToken = user.getAccessToken()
        const refreshToken = user.getRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { refreshToken, accessToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, userName, email, password } = req.body
    if ([fullName, userName, email, password].some(v => !v || v.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ApiError(400, "Invalid email format")
    }

    const existing = await User.findOne({ $or: [{ email }, { userName }] })
    if (existing) throw new ApiError(409, "User with this email or username already exists")

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    let coverLocalPath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath) throw new ApiError(400, "Avatar image is required")

    const avatarLink = await uploadOnCloudinary(avatarLocalPath)
    const coverLink = await uploadOnCloudinary(coverLocalPath)
    if (!avatarLink) throw new ApiError(500, "Failed to upload avatar image")

    const user = await User.create({
        fullName,
        email,
        password,
        avatar: avatarLink.url,
        coverImage: coverLink?.url || "",
        userName: userName.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body
    if (!userName && !email) throw new ApiError(400, "Username or email is required")
    if (!password) throw new ApiError(400, "Password is required")

    const existingUser = await User.findOne({ $or: [{ userName }, { email }] })
    if (!existingUser) throw new ApiError(404, "User does not exist")

    const isPasswordValid = await existingUser.isPasswordCorrect(password)
    if (!isPasswordValid) throw new ApiError(401, "Invalid credentials")

    const { accessToken, refreshToken } = await generateTokens(existingUser._id)
    const loggedInUser = await User.findById(existingUser._id).select("-password -refreshToken")

    const cookieOptions = { httpOnly: true, secure: true }
    res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Logged in successfully"))
})

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true })
    const options = { httpOnly: true, secure: true }
    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) throw new ApiError(401, "Refresh token is required")
    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decoded._id)
        if (!user) throw new ApiError(401, "Invalid refresh token")
        if (incomingRefreshToken !== user.refreshToken) throw new ApiError(401, "Refresh token is expired or used")

        const options = { httpOnly: true, secure: true }
        const { accessToken, refreshToken } = await generateTokens(decoded._id)
        res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken }, "Tokens refreshed successfully"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confPassword } = req.body
    if (!oldPassword || !newPassword || !confPassword) throw new ApiError(400, "All fields are required")
    if (newPassword !== confPassword) throw new ApiError(400, "New password and confirm password do not match")

    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) throw new ApiError(401, "Old password is incorrect")

    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName || !email) throw new ApiError(400, "Full name and email are required")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, "Invalid email format")

    const user = await User.findByIdAndUpdate(req.user._id,
        { $set: { email, fullName } },
        { new: true }
    ).select("-password -refreshToken")

    res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarPath = req.file?.path
    if (!avatarPath) throw new ApiError(400, "Avatar file is required")

    const avatar = await uploadOnCloudinary(avatarPath)
    if (!avatar?.url) throw new ApiError(500, "Failed to upload avatar")

    const oldUser = await User.findById(req.user._id)
    await deleteFromCloudinary(oldUser.avatar)

    const user = await User.findByIdAndUpdate(req.user._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password -refreshToken")

    res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"))
})

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImagePath = req.file?.path
    if (!coverImagePath) throw new ApiError(400, "Cover image file is required")

    const coverImage = await uploadOnCloudinary(coverImagePath)
    if (!coverImage?.url) throw new ApiError(500, "Failed to upload cover image")

    const oldUser = await User.findById(req.user._id)
    await deleteFromCloudinary(oldUser.coverImage)

    const user = await User.findByIdAndUpdate(req.user._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password -refreshToken")

    res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"))
})

const getChannel = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) throw new ApiError(400, "Username is missing")

    const channel = await User.aggregate([
        { $match: { userName: username.toLowerCase() } },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: { $size: "$subscribers" },
                channelSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                email: 1,
                userName: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                coverImage: 1,
                avatar: 1
            }
        }
    ])

    if (!channel.length) throw new ApiError(404, "Channel does not exist")
    res.status(200).json(new ApiResponse(200, channel[0], "Channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [{ $project: { userName: 1, fullName: 1, avatar: 1 } }]
                        }
                    },
                    { $addFields: { owner: { $first: "$owner" } } }
                ]
            }
        }
    ])

    if (!user.length) throw new ApiError(404, "User not found")
    res.status(200).json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"))
})

export {
    registerUser, loginUser, logOutUser, refreshAccessToken,
    changePassword, getCurrentUser, updateAccountDetails,
    updateAvatar, updateCoverImage, getChannel, getWatchHistory
}
