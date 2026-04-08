require('dotenv').config(); // טעינת המשתנים מהקובץ .env
const { MongoClient } = require('mongodb');

async function testConnection() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        // connect to MongoDB
        await client.connect();
        console.log("✅ Connected to MongoDB via Node.js!");
        // database and collection references
        const database = client.db("smart_home_db");
        const collection = database.collection("devices");
        // fetch one device document to verify connection and data access
        const device = await collection.findOne({});

        if (device) {
            console.log("👀 Node.js found a device :");
            console.log(device);
        } else {
            console.log("🤷‍♂️ Connected, but no devices found.");
        }

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await client.close();
    }
}

testConnection();