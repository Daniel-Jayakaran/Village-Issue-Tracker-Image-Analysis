/**
 * File Upload Utility
 * Enterprise Village Issue Tracking System
 * 
 * Secure file upload handling with multer
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// Ensure upload directory exists
const ensureUploadDir = () => {
    if (!fs.existsSync(config.upload.dir)) {
        fs.mkdirSync(config.upload.dir, { recursive: true });
    }
    
    // Create subdirectories
    const subDirs = ['tickets', 'proofs', 'temp'];
    for (const dir of subDirs) {
        const fullPath = path.join(config.upload.dir, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    }
};

// Initialize directories
ensureUploadDir();

// Allowed file types
const ALLOWED_TYPES = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp'
};

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const subDir = req.uploadType || 'tickets';
        const destPath = path.join(config.upload.dir, subDir);
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const ext = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname);
        const filename = `${uniqueId}${ext}`;
        cb(null, filename);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
};

// Multer upload configurations
const uploadTicketImages = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize,
        files: 5 // Maximum 5 files per upload
    }
});

const uploadProofImages = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize,
        files: 5
    }
});

/**
 * Middleware to set upload type
 */
const setUploadType = (type) => {
    return (req, res, next) => {
        req.uploadType = type;
        next();
    };
};

/**
 * Delete uploaded file
 */
const deleteFile = (filePath) => {
    const fullPath = path.join(config.upload.dir, filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
    }
    return false;
};

/**
 * Get file URL
 */
const getFileUrl = (filePath) => {
    return `/uploads/${filePath}`;
};

/**
 * Handle multer errors
 */
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                errorCode: 'UPLOAD_001',
                message: 'File size exceeds the maximum limit of 10MB.',
                correlationId: req.correlationId
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                errorCode: 'UPLOAD_002',
                message: 'Maximum 5 files can be uploaded at once.',
                correlationId: req.correlationId
            });
        }
        return res.status(400).json({
            success: false,
            errorCode: 'UPLOAD_003',
            message: 'File upload error: ' + err.message,
            correlationId: req.correlationId
        });
    }
    
    if (err) {
        return res.status(400).json({
            success: false,
            errorCode: 'UPLOAD_004',
            message: err.message,
            correlationId: req.correlationId
        });
    }
    
    next();
};

module.exports = {
    uploadTicketImages,
    uploadProofImages,
    setUploadType,
    deleteFile,
    getFileUrl,
    handleUploadError,
    ALLOWED_TYPES
};
