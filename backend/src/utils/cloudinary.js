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

export { uploadOnCloudinary, deleteFromCloudinary }
