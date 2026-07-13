import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { Comment } from '../models/comment.model.js'
import { createUserAndLogin, createTestVideo } from './helpers.js'

describe('Comments — add comment', () => {

    it('POST /comments/:videoId adds a comment to a video', async () => {
        const { user, token } = await createUserAndLogin()
        const video = await createTestVideo(user._id)

        const res = await request(app)
            .post(`/api/v1/comments/${video._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Great video!' })

        expect(res.status).toBe(201)
        expect(res.body.data.content).toBe('Great video!')
        // owner is populated — check userName, not raw ID
        expect(res.body.data.owner.userName).toBe('testuser')
    })

    it('POST /comments/:videoId returns 400 when content is empty', async () => {
        const { user, token } = await createUserAndLogin()
        const video = await createTestVideo(user._id)

        const res = await request(app)
            .post(`/api/v1/comments/${video._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: '' })  // empty string

        expect(res.status).toBe(400)
    })

    it('POST /comments/:videoId returns 401 without token', async () => {
        const { user } = await createUserAndLogin()
        const video = await createTestVideo(user._id)

        const res = await request(app)
            .post(`/api/v1/comments/${video._id}`)
            .send({ content: 'A comment' })

        expect(res.status).toBe(401)
    })
})

describe('Comments — get comments for a video', () => {

    it('GET /comments/:videoId returns all comments for the video', async () => {
        const { user, token } = await createUserAndLogin()
        const video = await createTestVideo(user._id)

        // Add two comments
        await request(app)
            .post(`/api/v1/comments/${video._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'First comment' })

        await request(app)
            .post(`/api/v1/comments/${video._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Second comment' })

        const res = await request(app)
            .get(`/api/v1/comments/${video._id}`)

        expect(res.status).toBe(200)
        // aggregatePaginate returns { docs: [...], totalDocs: N }
        expect(res.body.data.docs).toHaveLength(2)
    })

    it('GET /comments/:videoId returns empty list for video with no comments', async () => {
        const { user } = await createUserAndLogin()
        const video = await createTestVideo(user._id)

        const res = await request(app)
            .get(`/api/v1/comments/${video._id}`)

        expect(res.status).toBe(200)
        expect(res.body.data.docs).toHaveLength(0)
    })
})

describe('Comments — delete comment', () => {

    it('DELETE /comments/:commentId deletes your own comment', async () => {
        const { user, token } = await createUserAndLogin()
        const video = await createTestVideo(user._id)

        // Create a comment
        const createRes = await request(app)
            .post(`/api/v1/comments/${video._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Delete me' })

        const commentId = createRes.body.data._id

        const res = await request(app)
            .delete(`/api/v1/comments/c/${commentId}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)

        // Confirm it's gone from the DB
        const gone = await Comment.findById(commentId)
        expect(gone).toBeNull()
    })

    it("DELETE /comments/:commentId returns 403 when deleting someone else's comment", async () => {
        // user1 adds a comment
        const { user: user1, token: token1 } = await createUserAndLogin({
            userName: 'user1', email: 'user1@test.com'
        })
        const video = await createTestVideo(user1._id)

        const createRes = await request(app)
            .post(`/api/v1/comments/${video._id}`)
            .set('Authorization', `Bearer ${token1}`)
            .send({ content: "User1's comment" })

        const commentId = createRes.body.data._id

        // user2 tries to delete user1's comment
        const { token: token2 } = await createUserAndLogin({
            userName: 'user2', email: 'user2@test.com'
        })

        const res = await request(app)
            .delete(`/api/v1/comments/c/${commentId}`)
            .set('Authorization', `Bearer ${token2}`)

        // 403 = Forbidden
        expect(res.status).toBe(403)

        // Comment should still be in the DB
        const stillThere = await Comment.findById(commentId)
        expect(stillThere).not.toBeNull()
    })
})

describe('Comments — update comment', () => {

    it('PATCH /comments/:commentId updates content of your own comment', async () => {
        const { user, token } = await createUserAndLogin()
        const video = await createTestVideo(user._id)

        const createRes = await request(app)
            .post(`/api/v1/comments/${video._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Original content' })

        const commentId = createRes.body.data._id

        const res = await request(app)
            .patch(`/api/v1/comments/c/${commentId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Updated content' })

        expect(res.status).toBe(200)

        // Confirm the update in the DB
        const updated = await Comment.findById(commentId)
        expect(updated.content).toBe('Updated content')
    })
})
