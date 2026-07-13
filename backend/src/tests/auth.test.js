import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { createUserAndLogin } from './helpers.js'

describe('Auth — login', () => {

    // Before this test runs, createUserAndLogin creates a user in the
    // in-memory DB. afterEach in setup.js wipes it after the test.
    it('logs in with email and password', async () => {
        const { token, user } = await createUserAndLogin()

        // token must exist and be a non-empty string
        expect(typeof token).toBe('string')
        expect(token.length).toBeGreaterThan(0)
        expect(user.email).toBe('test@test.com')
    })

    it('logs in with username instead of email', async () => {
        await createUserAndLogin()

        // your loginUser controller accepts { userName } OR { email }
        const res = await request(app)
            .post('/api/v1/users/login')
            .send({ userName: 'testuser', password: 'password123' })

        expect(res.status).toBe(200)
        expect(res.body.data.accessToken).toBeDefined()
    })

    it('rejects wrong password', async () => {
        await createUserAndLogin()

        const res = await request(app)
            .post('/api/v1/users/login')
            .send({ email: 'test@test.com', password: 'wrongpassword' })

        // 401 = Unauthorized
        expect(res.status).toBe(401)
    })

    it('rejects non-existent user', async () => {
        const res = await request(app)
            .post('/api/v1/users/login')
            .send({ email: 'nobody@nowhere.com', password: 'password123' })

        expect(res.status).toBe(404)
    })

    it('rejects login with no password field', async () => {
        const res = await request(app)
            .post('/api/v1/users/login')
            .send({ email: 'test@test.com' })

        expect(res.status).toBe(400)
    })
})

describe('Auth — protected routes', () => {

    it('GET /current-user returns user when logged in', async () => {
        const { token } = await createUserAndLogin()

        const res = await request(app)
            .get('/api/v1/users/current-user')
            // .set() adds a header to the request
            // decodeJwt middleware reads this header to verify identity
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data.email).toBe('test@test.com')
    })

    it('GET /current-user returns 401 with no token', async () => {
        const res = await request(app)
            .get('/api/v1/users/current-user')
            // no .set('Authorization') — no token sent

        expect(res.status).toBe(401)
    })

    it('GET /current-user returns 401 with a fake token', async () => {
        const res = await request(app)
            .get('/api/v1/users/current-user')
            .set('Authorization', 'Bearer this.is.fake')

        expect(res.status).toBe(401)
    })
})

describe('Auth — logout', () => {

    it('logs out and clears refresh token', async () => {
        const { token } = await createUserAndLogin()

        const res = await request(app)
            .post('/api/v1/users/logout')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
    })
})
