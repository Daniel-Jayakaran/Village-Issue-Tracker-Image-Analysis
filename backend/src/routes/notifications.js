/**
 * Notification Routes
 * Enterprise Village Issue Tracking System
 */

const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errorHandler');
const { 
    getUserNotifications, 
    markAsRead, 
    markAllAsRead, 
    getUnreadCount 
} = require('../utils/notifications');

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 */
router.get('/',
    authenticate,
    asyncHandler(async (req, res) => {
        const { unreadOnly, limit = 20 } = req.query;

        const notifications = await getUserNotifications(req.user.id, {
            unreadOnly: unreadOnly === 'true',
            limit: parseInt(limit)
        });

        const unreadCount = await getUnreadCount(req.user.id);

        res.json({
            success: true,
            data: { notifications, unreadCount }
        });
    })
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 */
router.get('/unread-count',
    authenticate,
    asyncHandler(async (req, res) => {
        const count = await getUnreadCount(req.user.id);
        res.json({ success: true, data: { count } });
    })
);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 */
router.put('/:id/read',
    authenticate,
    asyncHandler(async (req, res) => {
        const result = await markAsRead(req.params.id, req.user.id);

        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                errorCode: 'NOTIF_001',
                message: 'Notification not found.',
                correlationId: req.correlationId
            });
        }

        res.json({ success: true, message: 'Notification marked as read' });
    })
);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 */
router.put('/read-all',
    authenticate,
    asyncHandler(async (req, res) => {
        await markAllAsRead(req.user.id);
        res.json({ success: true, message: 'All notifications marked as read' });
    })
);

module.exports = router;
