import mongoose from "mongoose";
import { Db_name } from "../constants.js";
import dns from 'dns'
dns.setServers(['1.1.1.1'])

export const connectDb = async () => {
    try {
        const uri = process.env.MONGODB_URI.replace(/\/$/, '')
        const dbInstance = await mongoose.connect(`${uri}/${Db_name}`, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        })
        console.log(`MongoDB connected to host: ${dbInstance.connection.host}`)
    } catch (error) {
        console.log("MongoDB connection error:", error)
        process.exit(1)
    }
}
