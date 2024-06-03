const mongoose = require('mongoose');
require('dotenv').config();


const connectDB = async () => { 
    try {
        const mongoUri = process.env.MONGODB_URI; // Ensure this matches the .env file
        if (!mongoUri) {
            throw new Error('MongoDB URI is not defined in the environment variables');
        }
        await mongoose.connect(mongoUri);
        // console.log("MongoDB connected successfully");
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1); // Exit process with failure
    }
}

module.exports = connectDB;