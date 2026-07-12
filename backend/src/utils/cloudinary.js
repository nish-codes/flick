import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key    : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (filepath) => {
    try {
        if (!filepath) return null
        const response = await cloudinary.uploader.upload(filepath, { resource_type: "auto" })
        fs.unlinkSync(filepath)
        return response
    } catch (err) {
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
        console.error("Cloudinary upload error:", err.message)
        return null
    }
}

const uploadVideoOnCloudinary = async (filepath) => {
    try {
        if (!filepath) return null
        const response = await cloudinary.uploader.upload(filepath, {
            resource_type: "video",
            eager_async: true
        })
        fs.unlinkSync(filepath)

        // Derive HLS stream URL from public_id — Cloudinary transcodes lazily on first request
        const streamUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/sp_hd/${response.public_id}.m3u8`

        return { ...response, streamUrl }
    } catch (err) {
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
        console.error("Cloudinary video upload error:", err.message)
        return null
    }
}

const deleteFromCloudinary = async (url) => {
    if (!url) return null
    try {
        // Extract public_id from the URL (works for images and video)
        const parts = url.split("/")
        const filename = parts[parts.length - 1]
        const publicId = filename.split(".")[0]
        const result = await cloudinary.uploader.destroy(publicId)
        return result
    } catch (err) {
        console.error("Cloudinary delete error:", err.message)
        return null
    }
}

const generateUploadSignature = (folder = "flick", resourceType = "auto") => {
    const timestamp = Math.round(Date.now() / 1000)
    const params = { timestamp, folder }
    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET)
    return {
        signature,
        timestamp,
        folder,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
    }
}

export { uploadOnCloudinary, uploadVideoOnCloudinary, deleteFromCloudinary, generateUploadSignature }
