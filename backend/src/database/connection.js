/**
 * MongoDB Connection Module
 * Enterprise Village Issue Tracking System
 */

const mongoose = require('mongoose');
const config = require('../config');

/**
 * Connect to MongoDB
 */
async function connectDatabase() {
    try {
        await mongoose.connect(config.mongodb.uri, {
            // Mongoose 8 uses these by default, but being explicit
        });

        console.log('✅ MongoDB connected successfully');

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        return mongoose.connection;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

/**
 * Close database connection
 */
async function closeDatabase() {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
}

module.exports = {
    connectDatabase,
    closeDatabase,
    mongoose
};
