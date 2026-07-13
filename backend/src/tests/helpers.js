import request from 'supertest'
import { app } from '../app.js'
import { User } from '../models/user.model.js'
import { Video } from '../models/video.model.js'

// Creates a user directly in the DB and logs in to get a real JWT
// Returns { user, token } so any test can make authenticated requests
export async function createUserAndLogin(overrides = {}) {
    const defaults = {
        userName: 'testuser',
        fullName: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        // avatar is required by the schema — we use a placeholder URL
        // in real life this is a Cloudinary URL; in tests we skip the upload
        avatar: 'https://placeholder.com/avatar.jpg',
    }

    const data = { ...defaults, ...overrides }

    // Create the user directly — bypasses the register endpoint
    // so we don't need to deal with file uploads in setup
    await User.create(data)

    // Log in through the real endpoint to get a real signed JWT
    const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: data.email, password: data.password })

    return {
        user: res.body.data.user,
        token: res.body.data.accessToken,
    }
}

// Creates a video directly in the DB — no Cloudinary upload needed
// owner must be a valid MongoDB ObjectId (from createUserAndLogin)
export async function createTestVideo(ownerId, overrides = {}) {
    const defaults = {
        title: 'Test Video',
        description: 'A test video',
        videoFile: 'https://res.cloudinary.com/test/video/upload/test.mp4',
        thumbnail: 'https://res.cloudinary.com/test/image/upload/thumb.jpg',
        duration: 30,
        owner: ownerId,
        isPublished: true,
        views: 0,
    }

    return await Video.create({ ...defaults, ...overrides })
}
