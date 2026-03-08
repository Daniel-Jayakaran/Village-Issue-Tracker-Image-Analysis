/**
 * SLA (Service Level Agreement) Utility
 * Enterprise Village Issue Tracking System
 * 
 * Calculate and manage SLA deadlines
 */

const { Ticket, User } = require('../models');
const config = require('../config');
const { createAuditLog, AUDIT_ACTIONS } = require('./auditLog');
const { createNotification, NOTIFICATION_TYPES } = require('./notifications');

/**
 * Calculate SLA deadline based on priority
 */
function calculateSLADeadline(priority) {
    const hours = config.sla[priority] || config.sla.P3;
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hours);
    return deadline;
}

/**
 * Check if ticket has breached SLA
 */
function checkSLABreach(ticket) {
    if (!ticket.slaDeadline) return false;
    
    const deadline = new Date(ticket.slaDeadline);
    const now = new Date();
    
    return now > deadline;
}

/**
 * Get SLA status
 */
function getSLAStatus(ticket) {
    if (!ticket.slaDeadline) {
        return { status: 'NOT_SET', message: 'SLA not configured' };
    }

    const deadline = new Date(ticket.slaDeadline);
    const now = new Date();
    const diffMs = deadline - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMs < 0) {
        const breachHours = Math.abs(diffHours).toFixed(1);
        return {
            status: 'BREACHED',
            message: `SLA breached by ${breachHours} hours`,
            breachHours: parseFloat(breachHours)
        };
    }

    if (diffHours <= 4) {
        return {
            status: 'CRITICAL',
            message: `Only ${diffHours.toFixed(1)} hours remaining`,
            hoursRemaining: parseFloat(diffHours.toFixed(1))
        };
    }

    if (diffHours <= 12) {
        return {
            status: 'WARNING',
            message: `${diffHours.toFixed(1)} hours remaining`,
            hoursRemaining: parseFloat(diffHours.toFixed(1))
        };
    }

    return {
        status: 'ON_TRACK',
        message: `${diffHours.toFixed(1)} hours remaining`,
        hoursRemaining: parseFloat(diffHours.toFixed(1))
    };
}

/**
 * Process SLA breaches (called periodically)
 */
async function processSLABreaches() {
    const now = new Date();
    
    // Find tickets that have breached SLA but not yet marked
    const breachedTickets = await Ticket.find({
        slaDeadline: { $lt: now },
        slaBreach: false,
        status: { $nin: ['CLOSED', 'REJECTED', 'RESOLVED', 'UNDER_REVIEW'] }
    }).populate('assignedTo', '_id');

    for (const ticket of breachedTickets) {
        // Mark as breached
        ticket.slaBreach = true;
        await ticket.save();

        // Create audit log
        await createAuditLog({
            ticketId: ticket._id,
            action: AUDIT_ACTIONS.SLA_BREACH,
            performedBy: ticket.assignedTo?._id || ticket.createdBy,
            performedByRole: 'SYSTEM',
            oldStatus: ticket.status,
            newStatus: ticket.status,
            remarks: 'Automatic SLA breach detection'
        });

        // Notify assigned worker if exists
        if (ticket.assignedTo) {
            await createNotification({
                userId: ticket.assignedTo._id,
                ticketId: ticket._id,
                type: NOTIFICATION_TYPES.SLA_BREACH,
                title: 'SLA Breach Alert',
                message: `Issue ${ticket.ticketNumber} has breached its SLA deadline.`
            });
        }

        // Notify all admins
        const admins = await User.find({ role: 'ADMIN', isActive: true }).select('_id');
        for (const admin of admins) {
            await createNotification({
                userId: admin._id,
                ticketId: ticket._id,
                type: NOTIFICATION_TYPES.SLA_BREACH,
                title: 'SLA Breach Alert',
                message: `Issue ${ticket.ticketNumber} has breached its SLA deadline.`
            });
        }
    }

    return breachedTickets.length;
}

/**
 * Get SLA metrics for dashboard
 */
async function getSLAMetrics() {
    const now = new Date();
    const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const [totalActive, breached, critical, warning] = await Promise.all([
        Ticket.countDocuments({ status: { $nin: ['CLOSED', 'REJECTED'] } }),
        Ticket.countDocuments({ slaBreach: true, status: { $nin: ['CLOSED', 'REJECTED'] } }),
        Ticket.countDocuments({
            slaDeadline: { $lt: fourHoursLater, $gt: now },
            slaBreach: false,
            status: { $nin: ['CLOSED', 'REJECTED'] }
        }),
        Ticket.countDocuments({
            slaDeadline: { $gte: fourHoursLater, $lt: twelveHoursLater },
            status: { $nin: ['CLOSED', 'REJECTED'] }
        })
    ]);

    return {
        total: totalActive,
        breached,
        critical,
        warning,
        onTrack: totalActive - breached - critical - warning
    };
}

module.exports = {
    calculateSLADeadline,
    checkSLABreach,
    getSLAStatus,
    processSLABreaches,
    getSLAMetrics
};
