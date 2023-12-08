import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import validator from "validator";
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const uri = process.env.MONGO_URI;
// Create a MongoClient instance
const client = new MongoClient(uri);
// Connect to MongoDB outside of request handlers
async function connectToMongo() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

// Call the function to connect to MongoDB
await connectToMongo();

// Function to sanitize and validate input
function sanitizeAndValidateInput(q) {
    // Use the validator library for input validation and sanitization
    const sanitizedInput = validator.escape(q); // HTML escape to prevent XSS
    const isValid = /^[a-zA-Z0-9 ]+$/.test(sanitizedInput); // Check if it contains only alphanumeric characters and spaces

    return isValid ? sanitizedInput : null;
}
async function runQuery(postcode) {
    try {
        console.log("Running query for postcode: " + postcode);

        // Select the database and collection
        const database = client.db("postcodesToLatLng");
        const collection = database.collection("postcodes");

        // Query for a single document
        const result = await collection.findOne({ postcode });

        return { lat: result.latitude, lng: result.longitude };
    } catch (e) {
        console.error(e);
    } finally {
        // Ensure the client is closed after each request
        await client.close();
    }
}

app.get("/coords", async (req, res) => {
    let { q } = req.query;
    // Sanitize and validate the input
    const sanitizedInput = sanitizeAndValidateInput(q);

    if (sanitizedInput === null) {
        return res.status(400).json({ error: "Invalid input" });
    }

    try {
        const result = await runQuery(sanitizedInput);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
