import { MongoClient } from 'mongodb';
import 'dotenv/config';
// Load environment variables from .env file
const uri = process.env.MONGO_URI;
// Create a new MongoClient
const client = new MongoClient(uri);
// Connect to the database
let db;

// Function to connect to the database
export async function connectDB() {
    if (!db) {
        try {
            // Connect to MongoDB and set the database instance
            await client.connect();
            console.log("✅ Connected to MongoDB");
            db = client.db("SmartHomeDB");
        } catch (error) {
            // Handle connection errors
            console.error("❌ Failed to connect to MongoDB", error);
            process.exit(1);
        }
    }
    return db;
}
// Get the database instance
export function getDB() {
    if (!db) {
        throw new Error("Database not connected. Call connectDB() first.");
    }
    // Return the connected database instance
    return db;
}




