/**
 * Ticket Routes
 * Enterprise Village Issue Tracking System
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const { Ticket, TicketImage, User } = require('../models');
const config = require('../config');
const { authenticate, authorize, validateTicketOwnership } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errorHandler');
const { createAuditLog, AUDIT_ACTIONS, getTicketAuditLogs } = require('../utils/auditLog');
const { generateTicketNumber } = require('../utils/ticketGenerator');
const { calculateSLADeadline, getSLAStatus } = require('../utils/sla');
const { notifyAdminsNewTicket, notifyWorkerAssignment, notifyCitizenStatusChange } = require('../utils/notifications');
const { uploadTicketImages, uploadProofImages, setUploadType, handleUploadError } = require('../utils/fileUpload');

// =========================================
// CITIZEN ENDPOINTS
// =========================================

/**
 * @route   POST /api/tickets
 * @desc    Create a new ticket (Citizen)
 */
router.post('/', 
    authenticate, 
    authorize(config.roles.CITIZEN),
    setUploadType('tickets'),
    uploadTicketImages.array('images', 5),
    handleUploadError,
    [
        body('category').isIn(config.categories).withMessage('Invalid category'),
        body('description').trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
        body('severity').isIn(config.severities).withMessage('Invalid severity'),
        body('location').trim().notEmpty().withMessage('Location is required')
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

        const { category, description, severity, location, latitude, longitude, landmark } = req.body;

        // Generate ticket number
        const ticketNumber = await generateTicketNumber();

        // Create ticket
        const ticket = await Ticket.create({
            ticketNumber,
            createdBy: req.user.id,
            category,
            description,
            severity,
            location,
            coordinates: { latitude, longitude },
            landmark,
            status: 'NEW'
        });

        // Save uploaded images
        if (req.files && req.files.length > 0) {
            const images = req.files.map(file => ({
                ticket: ticket._id,
                imageType: 'PROOF_BEFORE',
                fileName: file.originalname,
                filePath: `tickets/${file.filename}`,
                fileSize: file.size,
                mimeType: file.mimetype,
                uploadedBy: req.user.id
            }));

            await TicketImage.insertMany(images);
        }

        // Create audit log
        await createAuditLog({
            ticketId: ticket._id,
            action: AUDIT_ACTIONS.CREATE_TICKET,
            performedBy: req.user.id,
            performedByRole: req.user.role,
            oldStatus: null,
            newStatus: 'NEW',
            newData: { category, description, severity, location },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            correlationId: req.correlationId
        });

        // Notify admins
        notifyAdminsNewTicket(ticket._id, ticketNumber);

        res.status(201).json({
            success: true,
            message: 'Issue reported successfully',
            data: {
                ticket: {
                    id: ticket._id,
                    ticketNumber: ticket.ticketNumber,
                    category: ticket.category,
                    description: ticket.description,
                    severity: ticket.severity,
                    status: ticket.status,
                    location: ticket.location,
                    createdAt: ticket.createdAt
                }
            }
        });
    })
);

/**
 * @route   GET /api/tickets/my
 * @desc    Get citizen's own tickets
 */
router.get('/my',
    authenticate,
    authorize(config.roles.CITIZEN),
    asyncHandler(async (req, res) => {
        const { status, page = 1, limit = 10 } = req.query;

        const query = { createdBy: req.user.id };
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [tickets, total] = await Promise.all([
            Ticket.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Ticket.countDocuments(query)
        ]);

        // Add SLA status and image count
        const ticketsWithSla = await Promise.all(tickets.map(async (t) => {
            const imageCount = await TicketImage.countDocuments({ ticket: t._id });
            return {
                ...t.toObject(),
                imageCount,
                slaStatus: getSLAStatus(t)
            };
        }));

        res.json({
            success: true,
            data: {
                tickets: ticketsWithSla,
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
 * @route   PUT /api/tickets/:id
 * @desc    Edit ticket (Citizen - only if status is NEW)
 */
router.put('/:id',
    authenticate,
    authorize(config.roles.CITIZEN),
    validateTicketOwnership,
    [
        body('description').optional().trim().isLength({ min: 20, max: 2000 }),
        body('category').optional().isIn(config.categories),
        body('severity').optional().isIn(config.severities)
    ],
    asyncHandler(async (req, res) => {
        if (req.ticket.status !== 'NEW') {
            return res.status(403).json({
                success: false,
                errorCode: 'TICKET_EDIT_001',
                message: 'Tickets can only be edited when in NEW status.',
                correlationId: req.correlationId
            });
        }

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

        const { description, category, severity } = req.body;
        const oldData = {
            description: req.ticket.description,
            category: req.ticket.category,
            severity: req.ticket.severity
        };

        const updateData = {};
        const newData = {};

        if (description) { updateData.description = description; newData.description = description; }
        if (category) { updateData.category = category; newData.category = category; }
        if (severity) { updateData.severity = severity; newData.severity = severity; }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                errorCode: 'UPDATE_001',
                message: 'No fields to update.',
                correlationId: req.correlationId
            });
        }

        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        await createAuditLog({
            ticketId: req.params.id,
            action: AUDIT_ACTIONS.EDIT_TICKET,
            performedBy: req.user.id,
            performedByRole: req.user.role,
            oldStatus: 'NEW',
            newStatus: 'NEW',
            oldData,
            newData,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            correlationId: req.correlationId
        });

        res.json({
            success: true,
            message: 'Ticket updated successfully',
            data: { ticket }
        });
    })
);

/**
 * @route   POST /api/tickets/:id/reopen
 * @desc    Reopen a closed ticket (Citizen)
 */
router.post('/:id/reopen',
    authenticate,
    authorize(config.roles.CITIZEN),
    validateTicketOwnership,
    [
        body('reason').trim().isLength({ min: 10, max: 500 }).withMessage('Reopen reason is required (10-500 characters)')
    ],
    asyncHandler(async (req, res) => {
        if (req.ticket.status !== 'CLOSED') {
            return res.status(403).json({
                success: false,
                errorCode: 'REOPEN_001',
                message: 'Only closed tickets can be reopened.',
                correlationId: req.correlationId
            });
        }

        const maxReopens = 3;
        if (req.ticket.reopenCount >= maxReopens) {
            return res.status(403).json({
                success: false,
                errorCode: 'REOPEN_002',
                message: `Maximum reopen limit (${maxReopens}) reached. Please create a new ticket.`,
                correlationId: req.correlationId
            });
        }

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

        const { reason } = req.body;

        await Ticket.findByIdAndUpdate(req.params.id, {
            status: 'REOPENED',
            $inc: { reopenCount: 1 },
            reopenReason: reason
        });

        await createAuditLog({
            ticketId: req.params.id,
            action: AUDIT_ACTIONS.REOPEN_TICKET,
            performedBy: req.user.id,
            performedByRole: req.user.role,
            oldStatus: 'CLOSED',
            newStatus: 'REOPENED',
            newData: { reopenReason: reason },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            correlationId: req.correlationId
        });

        notifyAdminsNewTicket(req.params.id, req.ticket.ticketNumber);

        res.json({
            success: true,
            message: 'Ticket reopened successfully.',
            data: { ticketId: req.params.id, newStatus: 'REOPENED' }
        });
    })
);

/**
 * @route   GET /api/tickets/:id
 * @desc    Get ticket details
 */
router.get('/:id',
    authenticate,
    asyncHandler(async (req, res) => {
        const ticket = await Ticket.findById(req.params.id)
            .populate('createdBy', 'name phone')
            .populate('assignedTo', 'name')
            .populate('verifiedBy', 'name');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                errorCode: 'TICKET_001',
                message: 'Ticket not found.',
                correlationId: req.correlationId
            });
        }

        // Role-based access check
        const { role, id: userId } = req.user;
        if (role === config.roles.CITIZEN && ticket.createdBy._id.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                errorCode: 'TICKET_002',
                message: 'You can only view your own tickets.',
                correlationId: req.correlationId
            });
        }
        if (role === config.roles.WORKER && (!ticket.assignedTo || ticket.assignedTo._id.toString() !== userId.toString())) {
            return res.status(403).json({
                success: false,
                errorCode: 'TICKET_003',
                message: 'This ticket is not assigned to you.',
                correlationId: req.correlationId
            });
        }

        // Get images
        const images = await TicketImage.find({ ticket: ticket._id });

        // Get audit logs (only for Admin)
        let auditLogs = [];
        if (role === config.roles.ADMIN) {
            auditLogs = await getTicketAuditLogs(ticket._id);
        }

        // Calculate allowed actions
        const allowedActions = getTicketAllowedActions(ticket, req.user);

        res.json({
            success: true,
            data: {
                ticket: {
                    ...ticket.toObject(),
                    createdByName: ticket.createdBy?.name,
                    createdByPhone: ticket.createdBy?.phone,
                    assignedToName: ticket.assignedTo?.name,
                    verifiedByName: ticket.verifiedBy?.name,
                    slaStatus: getSLAStatus(ticket)
                },
                images,
                comments: [],
                auditLogs,
                allowedActions
            }
        });
    })
);

function getTicketAllowedActions(ticket, user) {
    const actions = [];
    const { role, id: userId } = user;
    const { status, createdBy, assignedTo } = ticket;

    switch (role) {
        case config.roles.CITIZEN:
            if (status === 'NEW' && createdBy._id.toString() === userId.toString()) actions.push('EDIT');
            if (status === 'CLOSED' && createdBy._id.toString() === userId.toString()) actions.push('REOPEN');
            break;
        case config.roles.ADMIN:
            if (['NEW', 'REOPENED'].includes(status)) actions.push('VERIFY', 'REJECT');
            if (status === 'VERIFIED') actions.push('ASSIGN');
            if (status === 'RESOLVED') actions.push('APPROVE_RESOLUTION', 'REJECT_RESOLUTION');
            if (status === 'UNDER_REVIEW') actions.push('CLOSE');
            break;
        case config.roles.WORKER:
            if (status === 'ASSIGNED' && assignedTo?._id.toString() === userId.toString()) actions.push('START_WORK');
            if (status === 'IN_PROGRESS' && assignedTo?._id.toString() === userId.toString()) actions.push('RESOLVE');
            break;
    }
    return actions;
}

// =========================================
// ADMIN ENDPOINTS
// =========================================

/**
 * @route   GET /api/tickets
 * @desc    Get all tickets (Admin/Worker)
 */
router.get('/',
    authenticate,
    authorize(config.roles.ADMIN, config.roles.WORKER),
    asyncHandler(async (req, res) => {
        const { status, category, priority, page = 1, limit = 20, search } = req.query;

        const query = {};

        if (req.user.role === config.roles.WORKER) {
            query.assignedTo = req.user.id;
        }

        if (status) query.status = status;
        if (category) query.category = category;
        if (priority) query.priority = priority;
        if (search) {
            query.$or = [
                { ticketNumber: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [tickets, total] = await Promise.all([
            Ticket.find(query)
                .populate('createdBy', 'name')
                .populate('assignedTo', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Ticket.countDocuments(query)
        ]);

        const ticketsWithSla = tickets.map(t => ({
            ...t.toObject(),
            createdByName: t.createdBy?.name,
            assignedToName: t.assignedTo?.name,
            slaStatus: getSLAStatus(t)
        }));

        res.json({
            success: true,
            data: {
                tickets: ticketsWithSla,
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
 * @route   POST /api/tickets/:id/verify
 * @desc    Verify a ticket (Admin)
 */
router.post('/:id/verify',
    authenticate,
    authorize(config.roles.ADMIN),
    validateTicketOwnership,
    [
        body('decision').isIn(['VALID', 'INVALID', 'DUPLICATE']).withMessage('Invalid decision'),
        body('remarks').optional().trim()
    ],
    asyncHandler(async (req, res) => {
        if (!['NEW', 'REOPENED'].includes(req.ticket.status)) {
            return res.status(403).json({
                success: false,
                errorCode: 'VERIFY_001',
                message: 'Only NEW or REOPENED tickets can be verified.',
                correlationId: req.correlationId
            });
        }

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

        const { decision, remarks } = req.body;
        const oldStatus = req.ticket.status;
        const newStatus = decision === 'VALID' ? 'VERIFIED' : 'REJECTED';
        const action = decision === 'VALID' ? AUDIT_ACTIONS.VERIFY_TICKET : AUDIT_ACTIONS.REJECT_TICKET;

        await Ticket.findByIdAndUpdate(req.params.id, {
            status: newStatus,
            verificationRemarks: remarks,
            verifiedBy: req.user.id,
            verifiedAt: new Date(),
            rejectionReason: decision !== 'VALID' ? `${decision}: ${remarks || 'No reason provided'}` : null
        });

        await createAuditLog({
            ticketId: req.params.id,
            action,
            performedBy: req.user.id,
            performedByRole: req.user.role,
            oldStatus,
            newStatus,
            newData: { decision, remarks },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            correlationId: req.correlationId
        });

        notifyCitizenStatusChange(
            req.ticket.createdBy,
            req.params.id,
            req.ticket.ticketNumber,
            newStatus,
            newStatus === 'VERIFIED' 
                ? `Your issue ${req.ticket.ticketNumber} has been verified.`
                : `Your issue ${req.ticket.ticketNumber} has been rejected. Reason: ${remarks || 'Not specified'}`
        );

        res.json({
            success: true,
            message: `Ticket ${newStatus.toLowerCase()} successfully`,
            data: { ticketId: req.params.id, newStatus }
        });
    })
);

/**
 * @route   POST /api/tickets/:id/assign
 * @desc    Assign worker to ticket (Admin)
 */
router.post('/:id/assign',
    authenticate,
    authorize(config.roles.ADMIN),
    validateTicketOwnership,
    [
        body('workerId').notEmpty().withMessage('Worker ID is required'),
        body('priority').isIn(['P1', 'P2', 'P3']).withMessage('Invalid priority'),
        body('remarks').optional().trim()
    ],
    asyncHandler(async (req, res) => {
        if (req.ticket.status !== 'VERIFIED') {
            return res.status(403).json({
                success: false,
                errorCode: 'ASSIGN_001',
                message: 'Only VERIFIED tickets can be assigned.',
                correlationId: req.correlationId
            });
        }

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

        const { workerId, priority, remarks } = req.body;

        const worker = await User.findOne({ _id: workerId, role: 'WORKER', isActive: true });
        if (!worker) {
            return res.status(404).json({
                success: false,
                errorCode: 'ASSIGN_002',
                message: 'Worker not found or inactive.',
                correlationId: req.correlationId
            });
        }

        const slaDeadline = calculateSLADeadline(priority);

        await Ticket.findByIdAndUpdate(req.params.id, {
            status: 'ASSIGNED',
            assignedTo: workerId,
            priority,
            slaDeadline
        });

        await createAuditLog({
            ticketId: req.params.id,
            action: AUDIT_ACTIONS.ASSIGN_WORKER,
            performedBy: req.user.id,
            performedByRole: req.user.role,
            oldStatus: 'VERIFIED',
            newStatus: 'ASSIGNED',
            newData: { workerId, workerName: worker.name, priority, slaDeadline },
            remarks,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            correlationId: req.correlationId
        });

        notifyWorkerAssignment(workerId, req.params.id, req.ticket.ticketNumber, priority);

        res.json({
            success: true,
            message: 'Worker assigned successfully',
            data: { ticketId: req.params.id, assignedTo: worker.name, priority, slaDeadline }
        });
    })
);

/**
 * @route   POST /api/tickets/:id/review
 * @desc    Review resolution (Admin)
 */
router.post('/:id/review',
    authenticate,
    authorize(config.roles.ADMIN),
    validateTicketOwnership,
    [
        body('decision').isIn(['APPROVE', 'REJECT']).withMessage('Invalid decision'),
        body('remarks').optional().trim()
    ],
    asyncHandler(async (req, res) => {
        if (req.ticket.status !== 'RESOLVED') {
            return res.status(403).json({
                success: false,
                errorCode: 'REVIEW_001',
                message: 'Only RESOLVED tickets can be reviewed.',
                correlationId: req.correlationId
            });
        }

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

        const { decision, remarks } = req.body;
        const newStatus = decision === 'APPROVE' ? 'UNDER_REVIEW' : 'IN_PROGRESS';
        const action = decision === 'APPROVE' ? AUDIT_ACTIONS.APPROVE_RESOLUTION : AUDIT_ACTIONS.REJECT_RESOLUTION;

        await Ticket.findByIdAndUpdate(req.params.id, { status: newStatus });

        await createAuditLog({
            ticketId: req.params.id,
            action,
            performedBy: req.user.id,
            performedByRole: req.user.role,
            oldStatus: 'RESOLVED',
            newStatus,
            newData: { decision, remarks },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            correlationId: req.correlationId
        });

        if (decision === 'REJECT' && req.ticket.assignedTo) {
            notifyCitizenStatusChange(
                req.ticket.assignedTo,
                req.params.id,
                req.ticket.ticketNumber,
                'RESOLUTION_REJECTED',
                `Resolution for ${req.ticket.ticketNumber} was rejected. Please review and resubmit.`
            );
        }

        res.json({
            success: true,
            message: decision === 'APPROVE' ? 'Resolution approved.' : 'Resolution rejected.',
            data: { ticketId: req.params.id, newStatus }
        });
    })
);

/**
 * @route   POST /api/tickets/:id/close
 * @desc    Close ticket (Admin)
 */
router.post('/:id/close',
    authenticate,
    authorize(config.roles.ADMIN),
    validateTicketOwnership,
    asyncHandler(async (req, res) => {
        if (req.ticket.status !== 'UNDER_REVIEW') {
            return res.status(403).json({
                success: false,
                errorCode: 'CLOSE_001',
                message: 'Only tickets in UNDER_REVIEW status can be closed.',
                correlationId: req.correlationId
            });
        }

        const { remarks } = req.body;

        await Ticket.findByIdAndUpdate(req.params.id, {
            status: 'CLOSED',
            closedAt: new Date()
        });

        await createAuditLog({
            ticketId: req.params.id,
            action: AUDIT_ACTIONS.CLOSE_TICKET,
            performedBy: req.user.id,
            performedByRole: req.user.role,
            oldStatus: 'UNDER_REVIEW',
            newStatus: 'CLOSED',
            remarks,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            correlationId: req.correlationId
        });

        notifyCitizenStatusChange(
            req.ticket.createdBy,
            req.params.id,
            req.ticket.ticketNumber,
            'CLOSED',
            `Your issue ${req.ticket.ticketNumber} has been resolved and closed.`
        );

        res.json({
            success: true,
            message: 'Ticket closed successfully',
            data: { ticketId: req.params.id, newStatus: 'CLOSED' }
        });
    })
);

// =========================================
// WORKER ENDPOINTS
// =========================================

/**
 * @route   POST /api/tickets/:id/start
 * @desc    Start work on ticket (Worker)
 */
router.post('/:id/start',
    authenticate,
    authorize(config.roles.WORKER),
    validateTicketOwnership,
    asyncHandler(async (req, res) => {
        if (req.ticket.status !== 'ASSIGNED') {
            return res.status(403).json({
                success: false,
                errorCode: 'START_001',
                message: 'Only ASSIGNED tickets can be started.',
                correlationId: req.correlationId
            });
        }

        await Ticket.findByIdAndUpdate(req.params.id, {
            status: 'IN_PROGRESS',
            workStartedAt: new Date()
        });

        await createAuditLog({
            ticketId: req.params.id,
            action: AUDIT_ACTIONS.START_WORK,
            performedBy: req.user.id,
            performedByRole: req.user.role,
            oldStatus: 'ASSIGNED',
            newStatus: 'IN_PROGRESS',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            correlationId: req.correlationId
        });

        res.json({
            success: true,
            message: 'Work started on ticket',
            data: { ticketId: req.params.id, newStatus: 'IN_PROGRESS' }
        });
    })
);

/**
 * @route   POST /api/tickets/:id/resolve
 * @desc    Resolve ticket with proof (Worker)
 */
router.post('/:id/resolve',
    authenticate,
    authorize(config.roles.WORKER),
    setUploadType('proofs'),
    uploadProofImages.array('proofImages', 5),
    handleUploadError,
    validateTicketOwnership,
    [
        body('resolutionNotes').trim().isLength({ min: 10, max: 1000 }).withMessage('Resolution notes required (10-1000 characters)')
    ],
    asyncHandler(async (req, res) => {
        if (req.ticket.status !== 'IN_PROGRESS') {
            return res.status(403).json({
                success: false,
                errorCode: 'RESOLVE_001',
                message: 'Only IN_PROGRESS tickets can be resolved.',
                correlationId: req.correlationId
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                errorCode: 'RESOLVE_002',
                message: 'At least one proof image is required.',
                correlationId: req.correlationId
            });
        }

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

        const { resolutionNotes } = req.body;

        await Ticket.findByIdAndUpdate(req.params.id, {
            status: 'RESOLVED',
            resolutionNotes,
            resolvedAt: new Date()
        });

        // Save proof images
        const images = req.files.map(file => ({
            ticket: req.params.id,
            imageType: 'PROOF_AFTER',
            fileName: file.originalname,
            filePath: `proofs/${file.filename}`,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedBy: req.user.id
        }));

        await TicketImage.insertMany(images);

        await createAuditLog({
            ticketId: req.params.id,
            action: AUDIT_ACTIONS.RESOLVE_TICKET,
            performedBy: req.user.id,
            performedByRole: req.user.role,
            oldStatus: 'IN_PROGRESS',
            newStatus: 'RESOLVED',
            newData: { resolutionNotes, proofCount: req.files.length },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            correlationId: req.correlationId
        });

        notifyAdminsNewTicket(req.params.id, req.ticket.ticketNumber);

        res.json({
            success: true,
            message: 'Ticket resolved successfully. Awaiting admin review.',
            data: { ticketId: req.params.id, newStatus: 'RESOLVED' }
        });
    })
);

/**
 * @route   GET /api/tickets/:id/audit
 * @desc    Get audit logs for a ticket (Admin only)
 */
router.get('/:id/audit',
    authenticate,
    authorize(config.roles.ADMIN),
    asyncHandler(async (req, res) => {
        const auditLogs = await getTicketAuditLogs(req.params.id);
        res.json({ success: true, data: { auditLogs } });
    })
);

module.exports = router;
