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
    const isValid = /^[a-zA-Z0-9 \[\]]+$/.test(sanitizedInput);
    return isValid ? sanitizedInput : null;
}

async function runQuery(input) {
    try {
        console.log("Running query for postcodes...");
        const database = client.db("postcodesToLatLng");
        const collection = database.collection("postcodes");
        let postcodesUpperCase = input.map((postcode) =>
            postcode.toUpperCase()
        );
        // Array of values to match
        const valuesToMatch = postcodesUpperCase; // Replace with your actual values

        // Use the $in operator to find documents with a field matching any value in the array
        const result = await collection
            .find({ postcode: { $in: valuesToMatch } })
            .toArray();
        return result;
    } catch (e) {
        console.error(e);
    } finally {
        // await client.close();
    }
}

export const handler = async (event) => {
    const checkValidInput = (postcode) => {
        let sanitizedInput = sanitizeAndValidateInput(postcode);
        // Check if the input is invalid
        if (sanitizedInput === null) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid input" }),
            };
        } else {
            return sanitizedInput;
        }
    };
    try {
        // Extract the payload from the Lambda event
        const { body } = event;
        const { q } = JSON.parse(body);
        console.log(q);
        // Sanitize and validate the input
        let sanitizedInput = q.map((postcode) => checkValidInput(postcode));

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
