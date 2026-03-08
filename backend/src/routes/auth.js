/**
 * Authentication Routes
 * Enterprise Village Issue Tracking System
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const { User } = require('../models');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errorHandler');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new citizen
 */
router.post('/register', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errorCode: 'VALIDATION_ERR',
            message: 'Validation failed',
            errors: errors.array(),
            correlationId: req.correlationId
        });
    }

    const { email, password, name, phone, village, district, state, address } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            errorCode: 'REG_001',
            message: 'An account with this email already exists.',
            correlationId: req.correlationId
        });
    }

    // Create user
    const user = await User.create({
        email,
        password,
        name,
        phone,
        role: 'CITIZEN',
        address,
        village,
        district,
        state
    });

    // Generate token
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        }
    });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errorCode: 'VALIDATION_ERR',
            message: 'Validation failed',
            errors: errors.array(),
            correlationId: req.correlationId
        });
    }

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return res.status(401).json({
            success: false,
            errorCode: 'AUTH_001',
            message: 'Invalid email or password.',
            correlationId: req.correlationId
        });
    }

    // Check if user is active
    if (!user.isActive) {
        return res.status(401).json({
            success: false,
            errorCode: 'AUTH_002',
            message: 'Your account has been deactivated. Please contact administrator.',
            correlationId: req.correlationId
        });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            errorCode: 'AUTH_001',
            message: 'Invalid email or password.',
            correlationId: req.correlationId
        });
    }

    // Generate token
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                village: user.village
            },
            token
        }
    });
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            errorCode: 'USER_001',
            message: 'User not found.',
            correlationId: req.correlationId
        });
    }

    res.json({
        success: true,
        data: { user }
    });
}));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 */
router.put('/profile', authenticate, [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errorCode: 'VALIDATION_ERR',
            message: 'Validation failed',
            errors: errors.array(),
            correlationId: req.correlationId
        });
    }

    const { name, phone, address, village, district, state } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (village !== undefined) updateData.village = village;
    if (district !== undefined) updateData.district = district;
    if (state !== undefined) updateData.state = state;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
            success: false,
            errorCode: 'UPDATE_001',
            message: 'No fields to update.',
            correlationId: req.correlationId
        });
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true }
    );

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
    });
}));

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 */
router.put('/change-password', authenticate, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errorCode: 'VALIDATION_ERR',
            message: 'Validation failed',
            errors: errors.array(),
            correlationId: req.correlationId
        });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        return res.status(400).json({
            success: false,
            errorCode: 'AUTH_003',
            message: 'Current password is incorrect.',
            correlationId: req.correlationId
        });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
        success: true,
        message: 'Password changed successfully'
    });
}));

module.exports = router;
