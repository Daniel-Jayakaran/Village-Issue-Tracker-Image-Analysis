/**
 * User Management Routes
 * Enterprise Village Issue Tracking System
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const { User, Ticket } = require('../models');
const config = require('../config');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errorHandler');

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin)
 */
router.get('/',
    authenticate,
    authorize(config.roles.ADMIN),
    asyncHandler(async (req, res) => {
        const { role, isActive, page = 1, limit = 20 } = req.query;

        const query = {};
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        // Transform users to include id field for frontend compatibility
        const usersWithId = users.map(u => ({
            ...u.toObject(),
            id: u._id.toString()
        }));

        res.json({
            success: true,
            data: {
                users: usersWithId,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    })
);

/**
 * @route   GET /api/users/workers
 * @desc    Get all active workers (Admin)
 */
router.get('/workers',
    authenticate,
    authorize(config.roles.ADMIN),
    asyncHandler(async (req, res) => {
        const workers = await User.aggregate([
            { $match: { role: 'WORKER', isActive: true } },
            {
                $lookup: {
                    from: 'tickets',
                    localField: '_id',
                    foreignField: 'assignedTo',
                    as: 'tickets'
                }
            },
            {
                $project: {
                    id: { $toString: '$_id' },
                    name: 1,
                    phone: 1,
                    email: 1,
                    totalAssigned: { $size: '$tickets' },
                    activeTickets: {
                        $size: {
                            $filter: {
                                input: '$tickets',
                                as: 't',
                                cond: { $in: ['$$t.status', ['ASSIGNED', 'IN_PROGRESS']] }
                            }
                        }
                    }
                }
            },
            { $sort: { activeTickets: 1 } }
        ]);

        res.json({
            success: true,
            data: { workers }
        });
    })
);

/**
 * @route   POST /api/users
 * @desc    Create new user (Admin)
 */
router.post('/',
    authenticate,
    authorize(config.roles.ADMIN),
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('role').isIn(['CITIZEN', 'ADMIN', 'WORKER']).withMessage('Invalid role'),
        body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number')
    ],
    asyncHandler(async (req, res) => {
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

        const { email, password, name, role, phone, village, district, state } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                errorCode: 'USER_001',
                message: 'An account with this email already exists.',
                correlationId: req.correlationId
            });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            name,
            role,
            phone,
            village,
            district,
            state
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            }
        });
    })
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (Admin)
 */
router.put('/:id',
    authenticate,
    authorize(config.roles.ADMIN),
    [
        body('name').optional().trim().notEmpty(),
        body('phone').optional().isMobilePhone('any'),
        body('role').optional().isIn(['CITIZEN', 'ADMIN', 'WORKER']),
        body('isActive').optional().isBoolean()
    ],
    asyncHandler(async (req, res) => {
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

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                errorCode: 'USER_002',
                message: 'User not found.',
                correlationId: req.correlationId
            });
        }

        const { name, phone, role, isActive, village, district, state } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (role) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
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

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json({
            success: true,
            message: 'User updated successfully',
            data: { user: updatedUser }
        });
    })
);

/**
 * @route   PUT /api/users/:id/toggle-status
 * @desc    Activate/Deactivate user (Admin)
 */
router.put('/:id/toggle-status',
    authenticate,
    authorize(config.roles.ADMIN),
    asyncHandler(async (req, res) => {
        // Prevent self-deactivation
        if (req.params.id === req.user.id.toString()) {
            return res.status(400).json({
                success: false,
                errorCode: 'USER_003',
                message: 'You cannot deactivate your own account.',
                correlationId: req.correlationId
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                errorCode: 'USER_002',
                message: 'User not found.',
                correlationId: req.correlationId
            });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            data: { isActive: user.isActive }
        });
    })
);

module.exports = router;
