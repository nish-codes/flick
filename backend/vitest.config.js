import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./src/tests/setup.js'],
        // Run test files sequentially — one MongoMemoryServer instance for all tests
        // Without this, each test file gets its own worker → 6 mongod processes at once → crash
        fileParallelism: false,
        testTimeout: 30000,
        hookTimeout: 30000,
    },
})
