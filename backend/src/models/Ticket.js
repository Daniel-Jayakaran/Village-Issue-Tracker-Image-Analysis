/**
 * Ticket Model
 * Enterprise Village Issue Tracking System
 */

const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketNumber: {
        type: String,
        unique: true,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Issue Details
    category: {
        type: String,
        required: true,
        enum: [
            'ROAD_DAMAGE', 'WATER_SUPPLY', 'ELECTRICITY', 'SANITATION',
            'STREET_LIGHTS', 'DRAINAGE', 'PUBLIC_PROPERTY', 'ENVIRONMENTAL', 'OTHER'
        ]
    },
    description: {
        type: String,
        required: true,
        minlength: 20,
        maxlength: 2000
    },
    severity: {
        type: String,
        required: true,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    priority: {
        type: String,
        enum: ['P1', 'P2', 'P3']
    },
    
    // Location
    location: {
        type: String,
        required: true
    },
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    landmark: String,
    
    // Status Tracking
    status: {
        type: String,
        required: true,
        default: 'NEW',
        enum: [
            'NEW', 'VERIFIED', 'REJECTED', 'ASSIGNED',
            'IN_PROGRESS', 'RESOLVED', 'UNDER_REVIEW', 'CLOSED', 'REOPENED'
        ]
    },
    
    // Admin Fields
    verificationRemarks: String,
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date,
    rejectionReason: String,
    
    // Worker Fields
    resolutionNotes: String,
    workStartedAt: Date,
    resolvedAt: Date,
    
    // SLA Tracking
    slaDeadline: Date,
    slaBreach: {
        type: Boolean,
        default: false
    },
    
    // Reopen tracking
    reopenCount: {
        type: Number,
        default: 0
    },
    reopenReason: String,
    
    // Timestamps
    closedAt: Date
}, {
    timestamps: true
});

// Indexes for common queries
ticketSchema.index({ status: 1 });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ slaDeadline: 1 });
ticketSchema.index({ ticketNumber: 1 });

// Virtual for images
ticketSchema.virtual('images', {
    ref: 'TicketImage',
    localField: '_id',
    foreignField: 'ticket'
});

// Virtual for comments
ticketSchema.virtual('comments', {
    ref: 'TicketComment',
    localField: '_id',
    foreignField: 'ticket'
});

// Virtual for audit logs
ticketSchema.virtual('auditLogs', {
    ref: 'AuditLog',
    localField: '_id',
    foreignField: 'ticket'
});

// Include virtuals in JSON
ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
