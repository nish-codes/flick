import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { Like } from '../models/like.model.js'
import { createUserAndLogin, createTestVideo } from './helpers.js'

describe('Likes — toggle video like', () => {

    it('liking a video creates a Like document in the DB', async () => {
        const { user, token } = await createUserAndLogin()
        const video = await createTestVideo(user._id)

        await request(app)
            .post(`/api/v1/likes/toggle/video/${video._id}`)
            .set('Authorization', `Bearer ${token}`)

        // Check the DB directly — a Like record should now exist
        const like = await Like.findOne({ video: video._id, likedBy: user._id })
        expect(like).not.toBeNull()
    })

    it('liking again (toggle) removes the Like — unlike', async () => {
        const { user, token } = await createUserAndLogin()
        const video = await createTestVideo(user._id)

        // First request: like
        await request(app)
            .post(`/api/v1/likes/toggle/video/${video._id}`)
            .set('Authorization', `Bearer ${token}`)

        // Second request: unlike (toggle removes the existing like)
        await request(app)
            .post(`/api/v1/likes/toggle/video/${video._id}`)
            .set('Authorization', `Bearer ${token}`)

        // The Like document should be gone now
        const like = await Like.findOne({ video: video._id, likedBy: user._id })
        expect(like).toBeNull()
    })

    it('toggle like returns 401 without token', async () => {
        const { user } = await createUserAndLogin()
        const video = await createTestVideo(user._id)

        const res = await request(app)
            .post(`/api/v1/likes/toggle/video/${video._id}`)
            // no Authorization header

        expect(res.status).toBe(401)
    })

    it('two different users can both like the same video', async () => {
        // user1 creates and likes a video
        const { user: user1, token: token1 } = await createUserAndLogin({
            userName: 'user1', email: 'user1@test.com'
        })
        const video = await createTestVideo(user1._id)

        await request(app)
            .post(`/api/v1/likes/toggle/video/${video._id}`)
            .set('Authorization', `Bearer ${token1}`)

        // user2 also likes the same video
        const { token: token2 } = await createUserAndLogin({
            userName: 'user2', email: 'user2@test.com'
        })

        const res = await request(app)
            .post(`/api/v1/likes/toggle/video/${video._id}`)
            .set('Authorization', `Bearer ${token2}`)

        expect(res.status).toBe(200)

        // Both Like records should exist
        const count = await Like.countDocuments({ video: video._id })
        expect(count).toBe(2)
    })
})

describe('Likes — get liked videos', () => {

    it('GET /likes/videos returns videos the user liked', async () => {
        const { user, token } = await createUserAndLogin()
        const video = await createTestVideo(user._id, { title: 'Liked Video' })

        // Like it first
        await request(app)
            .post(`/api/v1/likes/toggle/video/${video._id}`)
            .set('Authorization', `Bearer ${token}`)

        const res = await request(app)
            .get('/api/v1/likes/videos')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(Array.isArray(res.body.data)).toBe(true)
        expect(res.body.data).toHaveLength(1)
        expect(res.body.data[0].title).toBe('Liked Video')
    })

    it('GET /likes/videos returns empty list when user has not liked anything', async () => {
        const { token } = await createUserAndLogin()

        const res = await request(app)
            .get('/api/v1/likes/videos')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data).toHaveLength(0)
    })

    it('GET /likes/videos returns 401 without token', async () => {
        const res = await request(app).get('/api/v1/likes/videos')
        expect(res.status).toBe(401)
    })
})
