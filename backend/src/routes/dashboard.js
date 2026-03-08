/**
 * Dashboard Routes
 * Enterprise Village Issue Tracking System
 */

const express = require('express');
const router = express.Router();

const { Ticket, User, AuditLog } = require('../models');
const config = require('../config');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errorHandler');
const { getSLAMetrics } = require('../utils/sla');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics (Admin)
 */
router.get('/stats',
    authenticate,
    authorize(config.roles.ADMIN),
    asyncHandler(async (req, res) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Status counts
        const statusCounts = await Ticket.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const byStatus = {};
        statusCounts.forEach(s => { byStatus[s._id] = s.count; });

        const totalTickets = statusCounts.reduce((sum, s) => sum + s.count, 0);

        // Today's stats
        const todayStats = await Ticket.aggregate([
            {
                $facet: {
                    created: [
                        { $match: { createdAt: { $gte: today } } },
                        { $count: 'count' }
                    ],
                    closed: [
                        { $match: { closedAt: { $gte: today } } },
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        // Category breakdown
        const byCategory = await Ticket.aggregate([
            { $match: { status: { $ne: 'REJECTED' } } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Severity breakdown
        const bySeverity = await Ticket.aggregate([
            { $match: { status: { $nin: ['CLOSED', 'REJECTED'] } } },
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);

        // SLA metrics
        const slaMetrics = await getSLAMetrics();

        // Worker performance
        const workerStats = await User.aggregate([
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
                    name: 1,
                    assignedCount: { $size: '$tickets' },
                    completedCount: {
                        $size: {
                            $filter: {
                                input: '$tickets',
                                as: 't',
                                cond: { $eq: ['$$t.status', 'CLOSED'] }
                            }
                        }
                    },
                    activeCount: {
                        $size: {
                            $filter: {
                                input: '$tickets',
                                as: 't',
                                cond: { $in: ['$$t.status', ['ASSIGNED', 'IN_PROGRESS']] }
                            }
                        }
                    }
                }
            }
        ]);

        // Recent activity
        const recentActivity = await AuditLog.find()
            .populate('performedBy', 'name')
            .populate('ticket', 'ticketNumber')
            .sort({ createdAt: -1 })
            .limit(10);

        // Weekly trend
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const weeklyTrend = await Ticket.aggregate([
            { $match: { createdAt: { $gte: weekAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    total: totalTickets,
                    pending: (byStatus.NEW || 0) + (byStatus.REOPENED || 0),
                    inProgress: (byStatus.VERIFIED || 0) + (byStatus.ASSIGNED || 0) + (byStatus.IN_PROGRESS || 0),
                    resolved: byStatus.RESOLVED || 0,
                    closed: byStatus.CLOSED || 0,
                    rejected: byStatus.REJECTED || 0
                },
                today: {
                    created: todayStats[0]?.created[0]?.count || 0,
                    closed: todayStats[0]?.closed[0]?.count || 0
                },
                byStatus,
                byCategory: byCategory.map(c => ({ category: c._id, count: c.count })),
                bySeverity: bySeverity.map(s => ({ severity: s._id, count: s.count })),
                slaMetrics,
                workerStats: workerStats.map(w => ({
                    id: w._id,
                    name: w.name,
                    assignedCount: w.assignedCount,
                    completedCount: w.completedCount,
                    activeCount: w.activeCount
                })),
                recentActivity: recentActivity.map(a => ({
                    action: a.action,
                    createdAt: a.createdAt,
                    ticketNumber: a.ticket?.ticketNumber,
                    performedByName: a.performedBy?.name
                })),
                weeklyTrend: weeklyTrend.map(w => ({ date: w._id, count: w.count }))
            }
        });
    })
);

/**
 * @route   GET /api/dashboard/worker-stats
 * @desc    Get worker's own statistics
 */
router.get('/worker-stats',
    authenticate,
    authorize(config.roles.WORKER),
    asyncHandler(async (req, res) => {
        const now = new Date();
        const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);

        // Worker's ticket statistics
        const stats = await Ticket.aggregate([
            { $match: { assignedTo: req.user.id } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'ASSIGNED'] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
                    slaBreached: { $sum: { $cond: ['$slaBreach', 1, 0] } }
                }
            }
        ]);

        // Urgent tickets
        const urgentTickets = await Ticket.find({
            assignedTo: req.user.id,
            status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
            slaDeadline: { $lt: twelveHoursLater }
        })
        .select('ticketNumber category priority slaDeadline')
        .sort({ slaDeadline: 1 });

        // Today's assigned
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayAssigned = await Ticket.countDocuments({
            assignedTo: req.user.id,
            status: 'ASSIGNED',
            updatedAt: { $gte: today }
        });

        res.json({
            success: true,
            data: {
                stats: stats[0] || { total: 0, pending: 0, inProgress: 0, resolved: 0, completed: 0, slaBreached: 0 },
                urgentTickets: urgentTickets.map(t => ({
                    id: t._id,
                    ticketNumber: t.ticketNumber,
                    category: t.category,
                    priority: t.priority,
                    slaDeadline: t.slaDeadline
                })),
                todayAssigned
            }
        });
    })
);

/**
 * @route   GET /api/dashboard/citizen-stats
 * @desc    Get citizen's own statistics
 */
router.get('/citizen-stats',
    authenticate,
    authorize(config.roles.CITIZEN),
    asyncHandler(async (req, res) => {
        // Citizen's ticket statistics
        const stats = await Ticket.aggregate([
            { $match: { createdBy: req.user.id } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'NEW'] }, 1, 0] } },
                    inProgress: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'UNDER_REVIEW']] },
                                1, 0
                            ]
                        }
                    },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } }
                }
            }
        ]);

        // Recent tickets
        const recentTickets = await Ticket.find({ createdBy: req.user.id })
            .select('ticketNumber category status createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                stats: stats[0] || { total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0 },
                recentTickets: recentTickets.map(t => ({
                    id: t._id,
                    ticketNumber: t.ticketNumber,
                    category: t.category,
                    status: t.status,
                    createdAt: t.createdAt
                }))
            }
        });
    })
);

module.exports = router;
