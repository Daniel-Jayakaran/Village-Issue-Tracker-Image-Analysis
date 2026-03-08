/**
 * Audit Log Model
 * Enterprise Village Issue Tracking System
 * 
 * Immutable audit trail for all ticket actions
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'CREATE_TICKET',
            'EDIT_TICKET',
            'VERIFY_TICKET',
            'REJECT_TICKET',
            'ASSIGN_WORKER',
            'START_WORK',
            'UPLOAD_PROOF',
            'RESOLVE_TICKET',
            'APPROVE_RESOLUTION',
            'REJECT_RESOLUTION',
            'CLOSE_TICKET',
            'REOPEN_TICKET',
            'ADD_COMMENT',
            'UPLOAD_IMAGE',
            'SLA_BREACH'
        ]
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    performedByRole: {
        type: String,
        required: true
    },
    oldStatus: String,
    newStatus: String,
    oldData: mongoose.Schema.Types.Mixed,
    newData: mongoose.Schema.Types.Mixed,
    remarks: String,
    ipAddress: String,
    userAgent: String,
    correlationId: String
}, {
    timestamps: true
});

// Indexes
auditLogSchema.index({ ticket: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

// Make the collection append-only (no updates or deletes in application)
// This is enforced at application level, not database level

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
