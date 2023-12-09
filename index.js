import { MongoClient } from "mongodb";
import validator from "validator";

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

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
    const sanitizedInput = validator.escape(q);
    const isValid = /^[a-zA-Z0-9 ]+$/.test(sanitizedInput);
    return isValid ? sanitizedInput : null;
}

async function runQuery(postcode) {
    try {
        console.log("Running query for postcode: " + postcode);
        const database = client.db("postcodesToLatLng");
        const collection = database.collection("postcodes");
        const result = await collection.findOne({ postcode });
        return { lat: result.latitude, lng: result.longitude };
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

export const handler = async (event) => {
    try {
        // Extract the payload from the Lambda event
        const { body } = event;
        const { q } = JSON.parse(body);
        console.log(q);
        // Sanitize and validate the input
        const sanitizedInput = sanitizeAndValidateInput(q);

        // Check if the input is invalid
        if (sanitizedInput === null) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid input" }),
            };
        }

        // Run the query
        const result = await runQuery(sanitizedInput);

        return {
            statusCode: 200,
            body: JSON.stringify({ result }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};
