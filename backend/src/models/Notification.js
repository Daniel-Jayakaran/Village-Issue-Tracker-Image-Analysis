/**
 * Notification Model
 * Enterprise Village Issue Tracking System
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    },
    type: {
        type: String,
        required: true,
        enum: [
            'TICKET_CREATED',
            'TICKET_VERIFIED',
            'TICKET_REJECTED',
            'TICKET_ASSIGNED',
            'WORK_STARTED',
            'TICKET_RESOLVED',
            'RESOLUTION_APPROVED',
            'RESOLUTION_REJECTED',
            'TICKET_CLOSED',
            'TICKET_REOPENED',
            'SLA_WARNING',
            'SLA_BREACH',
            'NEW_COMMENT'
        ]
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date
}, {
    timestamps: true
});

// Indexes
notificationSchema.index({ user: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
