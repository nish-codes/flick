import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

// The simplest test — just confirms the server responds
// This is also what Railway/Render uses to check if your app is alive
describe('Health check', () => {
    it('GET /api/v1/health returns 200', async () => {
        const res = await request(app).get('/api/v1/health')
        expect(res.status).toBe(200)
    })
})
