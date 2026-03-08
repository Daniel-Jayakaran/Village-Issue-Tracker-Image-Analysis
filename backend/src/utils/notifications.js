/**
 * Notification Utility
 * Enterprise Village Issue Tracking System
 * 
 * Create and manage user notifications
 */

const { Notification, User } = require('../models');

// Notification types
const NOTIFICATION_TYPES = {
    TICKET_CREATED: 'TICKET_CREATED',
    TICKET_VERIFIED: 'TICKET_VERIFIED',
    TICKET_REJECTED: 'TICKET_REJECTED',
    TICKET_ASSIGNED: 'TICKET_ASSIGNED',
    WORK_STARTED: 'WORK_STARTED',
    TICKET_RESOLVED: 'TICKET_RESOLVED',
    RESOLUTION_APPROVED: 'RESOLUTION_APPROVED',
    RESOLUTION_REJECTED: 'RESOLUTION_REJECTED',
    TICKET_CLOSED: 'TICKET_CLOSED',
    TICKET_REOPENED: 'TICKET_REOPENED',
    SLA_WARNING: 'SLA_WARNING',
    SLA_BREACH: 'SLA_BREACH',
    NEW_COMMENT: 'NEW_COMMENT'
};

/**
 * Create a notification
 */
async function createNotification(params) {
    const notification = await Notification.create({
        user: params.userId,
        ticket: params.ticketId,
        type: params.type,
        title: params.title,
        message: params.message
    });

    return notification._id;
}

/**
 * Create notifications for multiple users
 */
async function createBulkNotifications(userIds, params) {
    const notifications = userIds.map(userId => ({
        user: userId,
        ticket: params.ticketId,
        type: params.type,
        title: params.title,
        message: params.message
    }));

    await Notification.insertMany(notifications);
}

/**
 * Get notifications for a user
 */
async function getUserNotifications(userId, options = {}) {
    const query = { user: userId };
    
    if (options.unreadOnly) {
        query.isRead = false;
    }

    let notifQuery = Notification.find(query)
        .populate('ticket', 'ticketNumber')
        .sort({ createdAt: -1 });

    if (options.limit) {
        notifQuery = notifQuery.limit(options.limit);
    }

    const notifications = await notifQuery;

    return notifications.map(n => ({
        id: n._id,
        ticketId: n.ticket?._id,
        ticketNumber: n.ticket?.ticketNumber,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt
    }));
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId, userId) {
    const result = await Notification.updateOne(
        { _id: notificationId, user: userId },
        { isRead: true, readAt: new Date() }
    );

    return result;
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead(userId) {
    const result = await Notification.updateMany(
        { user: userId, isRead: false },
        { isRead: true, readAt: new Date() }
    );

    return result;
}

/**
 * Get unread count
 */
async function getUnreadCount(userId) {
    const count = await Notification.countDocuments({ user: userId, isRead: false });
    return count;
}

/**
 * Notify admins about a new ticket
 */
async function notifyAdminsNewTicket(ticketId, ticketNumber) {
    const admins = await User.find({ role: 'ADMIN', isActive: true }).select('_id');
    
    if (admins.length > 0) {
        await createBulkNotifications(
            admins.map(a => a._id),
            {
                ticketId,
                type: NOTIFICATION_TYPES.TICKET_CREATED,
                title: 'New Issue Reported',
                message: `A new issue (${ticketNumber}) has been submitted and requires verification.`
            }
        );
    }
}

/**
 * Notify worker about assignment
 */
async function notifyWorkerAssignment(workerId, ticketId, ticketNumber, priority) {
    await createNotification({
        userId: workerId,
        ticketId,
        type: NOTIFICATION_TYPES.TICKET_ASSIGNED,
        title: 'New Issue Assigned',
        message: `Issue ${ticketNumber} (Priority: ${priority}) has been assigned to you.`
    });
}

/**
 * Notify citizen about ticket status change
 */
async function notifyCitizenStatusChange(citizenId, ticketId, ticketNumber, status, message) {
    await createNotification({
        userId: citizenId,
        ticketId,
        type: `TICKET_${status}`,
        title: `Issue ${status}`,
        message: message || `Your issue ${ticketNumber} has been updated to ${status}.`
    });
}

module.exports = {
    NOTIFICATION_TYPES,
    createNotification,
    createBulkNotifications,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    notifyAdminsNewTicket,
    notifyWorkerAssignment,
    notifyCitizenStatusChange
};
