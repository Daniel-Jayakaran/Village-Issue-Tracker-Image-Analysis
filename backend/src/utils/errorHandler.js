/**
 * Error Handler Utility
 * Enterprise Village Issue Tracking System
 * 
 * Centralized error handling with logging
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Create error log entry (console based for now)
 */
function createErrorLog(errorData) {
    console.error('Error Log:', {
        timestamp: new Date().toISOString(),
        ...errorData
    });
}

/**
 * Express error handler middleware
 */
function errorMiddleware(err, req, res, next) {
    const correlationId = req.correlationId || uuidv4();

    // Log error
    createErrorLog({
        errorCode: err.code || 'SERVER_ERR',
        message: err.message,
        stackTrace: err.stack,
        userId: req.user?.id,
        endpoint: req.originalUrl,
        method: req.method,
        correlationId
    });

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
        
        return res.status(400).json({
            success: false,
            errorCode: 'VALIDATION_ERR',
            message: 'Validation failed',
            errors,
            correlationId
        });
    }

    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            success: false,
            errorCode: 'DUPLICATE_ERR',
            message: `${field} already exists`,
            correlationId
        });
    }

    // Handle Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            errorCode: 'INVALID_ID',
            message: 'Invalid ID format',
            correlationId
        });
    }

    // Send response
    res.status(statusCode).json({
        success: false,
        errorCode: err.code || 'SERVER_ERR',
        message: statusCode === 500 
            ? 'An internal server error occurred. Please try again later.'
            : err.message,
        correlationId,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

/**
 * Create custom application error
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'APP_ERR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async handler wrapper
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    createErrorLog,
    errorMiddleware,
    AppError,
    asyncHandler
};
