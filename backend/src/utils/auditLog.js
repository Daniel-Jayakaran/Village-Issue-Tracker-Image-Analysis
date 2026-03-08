/**
 * Audit Logging Utility
 * Enterprise Village Issue Tracking System
 * 
 * Immutable audit trail for all ticket actions
 */

const { AuditLog } = require('../models');

// Audit action types
const AUDIT_ACTIONS = {
    CREATE_TICKET: 'CREATE_TICKET',
    EDIT_TICKET: 'EDIT_TICKET',
    VERIFY_TICKET: 'VERIFY_TICKET',
    REJECT_TICKET: 'REJECT_TICKET',
    ASSIGN_WORKER: 'ASSIGN_WORKER',
    START_WORK: 'START_WORK',
    UPLOAD_PROOF: 'UPLOAD_PROOF',
    RESOLVE_TICKET: 'RESOLVE_TICKET',
    APPROVE_RESOLUTION: 'APPROVE_RESOLUTION',
    REJECT_RESOLUTION: 'REJECT_RESOLUTION',
    CLOSE_TICKET: 'CLOSE_TICKET',
    REOPEN_TICKET: 'REOPEN_TICKET',
    ADD_COMMENT: 'ADD_COMMENT',
    UPLOAD_IMAGE: 'UPLOAD_IMAGE',
    SLA_BREACH: 'SLA_BREACH'
};

/**
 * Create audit log entry
 */
async function createAuditLog(params) {
    try {
        const auditLog = await AuditLog.create({
            ticket: params.ticketId,
            action: params.action,
            performedBy: params.performedBy,
            performedByRole: params.performedByRole,
            oldStatus: params.oldStatus,
            newStatus: params.newStatus,
            oldData: params.oldData,
            newData: params.newData,
            remarks: params.remarks,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
            correlationId: params.correlationId
        });

        return auditLog._id;
    } catch (error) {
        console.error('Failed to create audit log:', error);
        throw error;
    }
}

/**
 * Get audit logs for a ticket
 */
async function getTicketAuditLogs(ticketId) {
    const logs = await AuditLog.find({ ticket: ticketId })
        .populate('performedBy', 'name')
        .sort({ createdAt: -1 });

    return logs.map(log => ({
        id: log._id,
        action: log.action,
        performedByName: log.performedBy?.name || 'System',
        performedByRole: log.performedByRole,
        oldStatus: log.oldStatus,
        newStatus: log.newStatus,
        oldData: log.oldData,
        newData: log.newData,
        remarks: log.remarks,
        createdAt: log.createdAt
    }));
}

/**
 * Get all audit logs with filtering
 */
async function getAuditLogs(filters = {}) {
    const query = {};

    if (filters.ticketId) query.ticket = filters.ticketId;
    if (filters.action) query.action = filters.action;
    if (filters.performedBy) query.performedBy = filters.performedBy;
    if (filters.startDate) query.createdAt = { $gte: new Date(filters.startDate) };
    if (filters.endDate) {
        query.createdAt = { ...query.createdAt, $lte: new Date(filters.endDate) };
    }

    let logsQuery = AuditLog.find(query)
        .populate('performedBy', 'name')
        .populate('ticket', 'ticketNumber')
        .sort({ createdAt: -1 });

    if (filters.limit) {
        logsQuery = logsQuery.limit(filters.limit);
    }

    return logsQuery;
}

module.exports = {
    AUDIT_ACTIONS,
    createAuditLog,
    getTicketAuditLogs,
    getAuditLogs
};
