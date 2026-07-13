import 'dotenv/config'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

// This runs once before ALL tests start
// Starts a real MongoDB in memory — no network, no Atlas, completely isolated
let mongoServer

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    await mongoose.connect(uri)
})

// This runs after EVERY single test
// Wipes all collections so each test starts with a clean empty database
// Without this, data created in test 1 would leak into test 2
afterEach(async () => {
    const collections = mongoose.connection.collections
    for (const key in collections) {
        await collections[key].deleteMany({})
    }
})

// This runs once after ALL tests finish
// Disconnects mongoose and shuts down the in-memory MongoDB
afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
})
