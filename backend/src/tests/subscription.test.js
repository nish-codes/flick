import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { Subscription } from '../models/subscription.model.js'
import { createUserAndLogin } from './helpers.js'

describe('Subscriptions — toggle', () => {

    it('subscribing to a channel creates a Subscription in the DB', async () => {
        // channel and subscriber must be different users
        const { user: channel } = await createUserAndLogin({
            userName: 'channel1', email: 'channel1@test.com'
        })
        const { user: subscriber, token } = await createUserAndLogin({
            userName: 'subscriber1', email: 'subscriber1@test.com'
        })

        const res = await request(app)
            .post(`/api/v1/subscriptions/toggle/${channel._id}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data.subscribed).toBe(true)

        // Confirm in DB
        const sub = await Subscription.findOne({
            subscriber: subscriber._id,
            channel: channel._id,
        })
        expect(sub).not.toBeNull()
    })

    it('toggling again removes the subscription (unsubscribe)', async () => {
        const { user: channel } = await createUserAndLogin({
            userName: 'channel1', email: 'channel1@test.com'
        })
        const { user: subscriber, token } = await createUserAndLogin({
            userName: 'subscriber1', email: 'subscriber1@test.com'
        })

        // Subscribe
        await request(app)
            .post(`/api/v1/subscriptions/toggle/${channel._id}`)
            .set('Authorization', `Bearer ${token}`)

        // Unsubscribe (toggle)
        const res = await request(app)
            .post(`/api/v1/subscriptions/toggle/${channel._id}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data.subscribed).toBe(false)

        // Subscription record should be gone
        const sub = await Subscription.findOne({
            subscriber: subscriber._id,
            channel: channel._id,
        })
        expect(sub).toBeNull()
    })

    it('returns 400 when trying to subscribe to yourself', async () => {
        const { user, token } = await createUserAndLogin()

        // toggleSubscription has a self-subscription guard
        const res = await request(app)
            .post(`/api/v1/subscriptions/toggle/${user._id}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(400)
    })

    it('returns 401 without token', async () => {
        const { user: channel } = await createUserAndLogin({
            userName: 'channel1', email: 'channel1@test.com'
        })

        const res = await request(app)
            .post(`/api/v1/subscriptions/toggle/${channel._id}`)
            // no Authorization header

        expect(res.status).toBe(401)
    })
})

describe('Subscriptions — channel subscribers list', () => {

    it('GET /channel/:channelId returns list of subscribers', async () => {
        const { user: channel } = await createUserAndLogin({
            userName: 'channel1', email: 'channel1@test.com'
        })
        const { token: token1 } = await createUserAndLogin({
            userName: 'sub1', email: 'sub1@test.com'
        })
        const { token: token2 } = await createUserAndLogin({
            userName: 'sub2', email: 'sub2@test.com'
        })

        // Both users subscribe
        await request(app)
            .post(`/api/v1/subscriptions/toggle/${channel._id}`)
            .set('Authorization', `Bearer ${token1}`)
        await request(app)
            .post(`/api/v1/subscriptions/toggle/${channel._id}`)
            .set('Authorization', `Bearer ${token2}`)

        const res = await request(app)
            .get(`/api/v1/subscriptions/channel/${channel._id}`)

        expect(res.status).toBe(200)
        // Returns an array of subscriber user objects
        expect(Array.isArray(res.body.data)).toBe(true)
        expect(res.body.data).toHaveLength(2)
    })

    it('returns empty list when channel has no subscribers', async () => {
        const { user: channel } = await createUserAndLogin()

        const res = await request(app)
            .get(`/api/v1/subscriptions/channel/${channel._id}`)

        expect(res.status).toBe(200)
        expect(res.body.data).toHaveLength(0)
    })
})

describe('Subscriptions — subscribed channels list', () => {

    it('GET /user/:subscriberId returns channels the user subscribed to', async () => {
        const { user: channel1 } = await createUserAndLogin({
            userName: 'channel1', email: 'channel1@test.com'
        })
        const { user: channel2 } = await createUserAndLogin({
            userName: 'channel2', email: 'channel2@test.com'
        })
        const { user: me, token } = await createUserAndLogin({
            userName: 'me', email: 'me@test.com'
        })

        // Subscribe to both channels
        await request(app)
            .post(`/api/v1/subscriptions/toggle/${channel1._id}`)
            .set('Authorization', `Bearer ${token}`)
        await request(app)
            .post(`/api/v1/subscriptions/toggle/${channel2._id}`)
            .set('Authorization', `Bearer ${token}`)

        const res = await request(app)
            .get(`/api/v1/subscriptions/user/${me._id}`)

        expect(res.status).toBe(200)
        // Returns an array of channel user objects
        expect(Array.isArray(res.body.data)).toBe(true)
        expect(res.body.data).toHaveLength(2)
    })

    it('returns empty list when user has not subscribed to anyone', async () => {
        const { user: me } = await createUserAndLogin()

        const res = await request(app)
            .get(`/api/v1/subscriptions/user/${me._id}`)

        expect(res.status).toBe(200)
        expect(res.body.data).toHaveLength(0)
    })
})
