import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { Video } from '../models/video.model.js'
import { createUserAndLogin, createTestVideo } from './helpers.js'

// vi.mock() replaces cloudinary.js with a fake version
// Every function in cloudinary.js returns instantly with fake data
// This means:
//   - No real Cloudinary API calls
//   - No API key needed in tests
//   - Tests run in milliseconds instead of seconds
vi.mock('../utils/cloudinary.js', () => ({
    uploadOnCloudinary: vi.fn().mockResolvedValue({
        url: 'https://res.cloudinary.com/test/image/upload/thumb.jpg',
        public_id: 'test_thumb',
    }),
    uploadVideoOnCloudinary: vi.fn().mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/video/upload/video.mp4',
        public_id: 'test_video',
        duration: 30,
        streamUrl: 'https://res.cloudinary.com/test/video/upload/sp_hd/test_video.m3u8',
    }),
    deleteFromCloudinary: vi.fn().mockResolvedValue({ result: 'ok' }),
    generateUploadSignature: vi.fn().mockReturnValue({
        signature: 'fake_signature_abc123',
        timestamp: 1234567890,
        folder: 'flick/videos',
        cloudName: 'testcloud',
        apiKey: 'fake_api_key',
    }),
}))

describe('Videos — public routes', () => {

    it('GET /videos returns empty list when no videos exist', async () => {
        const res = await request(app).get('/api/v1/videos')

        expect(res.status).toBe(200)
        // aggregatePaginate returns a { docs, totalDocs, ... } shape
        expect(Array.isArray(res.body.data.docs)).toBe(true)
        expect(res.body.data.docs).toHaveLength(0)
    })

    it('GET /videos returns videos when they exist', async () => {
        const { user } = await createUserAndLogin()
        await createTestVideo(user._id, { title: 'My First Video' })

        const res = await request(app).get('/api/v1/videos')

        expect(res.status).toBe(200)
        expect(res.body.data.docs).toHaveLength(1)
        expect(res.body.data.docs[0].title).toBe('My First Video')
    })

    it('GET /videos does not return unpublished videos', async () => {
        const { user } = await createUserAndLogin()
        // isPublished: false — should be hidden from the public feed
        await createTestVideo(user._id, { isPublished: false })

        const res = await request(app).get('/api/v1/videos')

        expect(res.status).toBe(200)
        expect(res.body.data.docs).toHaveLength(0)
    })

    it('GET /videos/:id returns 400 for an invalid ID format', async () => {
        // "notanid" is not a valid MongoDB ObjectId — should fail validation
        const res = await request(app).get('/api/v1/videos/notanid')
        expect(res.status).toBe(400)
    })

    it('GET /videos/:id returns 404 for a valid but non-existent ID', async () => {
        // Valid ObjectId format but no video with this ID exists
        const res = await request(app).get('/api/v1/videos/507f1f77bcf86cd799439011')
        expect(res.status).toBe(404)
    })

    it('GET /videos/:id returns video with likesCount and subscribersCount', async () => {
        const { user, token } = await createUserAndLogin()
        const video = await createTestVideo(user._id)

        const res = await request(app)
            .get(`/api/v1/videos/${video._id}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        // These fields are added by the Promise.all in getVideoById
        // not part of the Video schema — they're computed on the fly
        expect(res.body.data.likesCount).toBe(0)
        expect(res.body.data.subscribersCount).toBe(0)
        expect(res.body.data.isLiked).toBe(false)
    })
})

describe('Videos — view recording', () => {

    it('POST /videos/:id/view increments view count by 1', async () => {
        const { user } = await createUserAndLogin()
        const video = await createTestVideo(user._id, { views: 0 })

        await request(app).post(`/api/v1/videos/${video._id}/view`)

        // read directly from DB to confirm the $inc worked
        const updated = await Video.findById(video._id)
        expect(updated.views).toBe(1)
    })

    it('POST /videos/:id/view can be called multiple times', async () => {
        const { user } = await createUserAndLogin()
        const video = await createTestVideo(user._id, { views: 0 })

        // The frontend only calls this once per visit using viewedRef
        // but the endpoint itself has no restriction — each call increments
        await request(app).post(`/api/v1/videos/${video._id}/view`)
        await request(app).post(`/api/v1/videos/${video._id}/view`)

        const updated = await Video.findById(video._id)
        expect(updated.views).toBe(2)
    })
})

describe('Videos — signed upload', () => {

    it('GET /videos/upload-signature returns signature for logged-in user', async () => {
        const { token } = await createUserAndLogin()

        const res = await request(app)
            .get('/api/v1/videos/upload-signature')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        // both video and thumbnail signatures are returned
        expect(res.body.data.video.signature).toBeDefined()
        expect(res.body.data.thumbnail.signature).toBeDefined()
        expect(res.body.data.video.cloudName).toBeDefined()
    })

    it('GET /videos/upload-signature returns 401 without token', async () => {
        const res = await request(app).get('/api/v1/videos/upload-signature')
        expect(res.status).toBe(401)
    })
})

describe('Videos — save (after direct Cloudinary upload)', () => {

    it('POST /videos/save creates a video in the DB', async () => {
        const { user, token } = await createUserAndLogin()

        const res = await request(app)
            .post('/api/v1/videos/save')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'My Uploaded Video',
                description: 'A great video',
                videoFile: 'https://res.cloudinary.com/test/video/upload/video.mp4',
                thumbnail: 'https://res.cloudinary.com/test/image/upload/thumb.jpg',
                duration: 45,
                publicId: 'test_public_id',
            })

        expect(res.status).toBe(201)
        expect(res.body.data.title).toBe('My Uploaded Video')
        // owner should be set to the logged-in user's ID
        expect(res.body.data.owner.toString()).toBe(user._id.toString())
        // video should be published by default
        expect(res.body.data.isPublished).toBe(true)
    })

    it('POST /videos/save returns 400 when title is missing', async () => {
        const { token } = await createUserAndLogin()

        const res = await request(app)
            .post('/api/v1/videos/save')
            .set('Authorization', `Bearer ${token}`)
            .send({
                // no title
                videoFile: 'https://cloudinary.com/video.mp4',
                thumbnail: 'https://cloudinary.com/thumb.jpg',
            })

        expect(res.status).toBe(400)
    })

    it('POST /videos/save returns 401 without token', async () => {
        const res = await request(app)
            .post('/api/v1/videos/save')
            .send({ title: 'test', videoFile: 'url', thumbnail: 'url' })

        expect(res.status).toBe(401)
    })
})

describe('Videos — delete', () => {

    it('DELETE /videos/:id deletes your own video', async () => {
        const { user, token } = await createUserAndLogin()
        const video = await createTestVideo(user._id)

        const res = await request(app)
            .delete(`/api/v1/videos/${video._id}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        // confirm it's actually gone from the DB
        const gone = await Video.findById(video._id)
        expect(gone).toBeNull()
    })

    it("DELETE /videos/:id returns 403 when deleting someone else's video", async () => {
        // user1 creates a video
        const { user: user1 } = await createUserAndLogin({
            userName: 'user1', email: 'user1@test.com'
        })
        const video = await createTestVideo(user1._id)

        // user2 tries to delete it
        const { token: token2 } = await createUserAndLogin({
            userName: 'user2', email: 'user2@test.com'
        })

        const res = await request(app)
            .delete(`/api/v1/videos/${video._id}`)
            .set('Authorization', `Bearer ${token2}`)

        // 403 = Forbidden — you're logged in but not the owner
        expect(res.status).toBe(403)
        // video should still be in the DB
        const stillThere = await Video.findById(video._id)
        expect(stillThere).not.toBeNull()
    })
})
