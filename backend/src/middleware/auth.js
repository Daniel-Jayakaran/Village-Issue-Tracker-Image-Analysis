/**
 * Authentication Middleware
 * Enterprise Village Issue Tracking System
 * 
 * JWT validation and role-based access control
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, Ticket } = require('../models');
const { createErrorLog } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

/**
 * Verify JWT token and attach user to request
 */
async function authenticate(req, res, next) {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    req.correlationId = correlationId;

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                errorCode: 'AUTH_001',
                message: 'Authentication required. Please provide a valid token.',
                correlationId
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            
            // Verify user still exists and is active
            const user = await User.findOne({ _id: decoded.userId, isActive: true });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    errorCode: 'AUTH_002',
                    message: 'User account not found or deactivated.',
                    correlationId
                });
            }

            // Attach user info to request
            req.user = {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                village: user.village
            };

            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    errorCode: 'AUTH_003',
                    message: 'Session expired. Please login again.',
                    correlationId
                });
            }

            return res.status(401).json({
                success: false,
                errorCode: 'AUTH_004',
                message: 'Invalid authentication token.',
                correlationId
            });
        }
    } catch (error) {
        createErrorLog({
            errorCode: 'AUTH_ERR',
            message: error.message,
            stackTrace: error.stack,
            userId: null,
            endpoint: req.originalUrl,
            method: req.method,
            correlationId
        });

        return res.status(500).json({
            success: false,
            errorCode: 'AUTH_500',
            message: 'Authentication service error.',
            correlationId
        });
    }
}

/**
 * Role-based access control middleware
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                errorCode: 'AUTHZ_001',
                message: 'Authentication required.',
                correlationId: req.correlationId
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            createErrorLog({
                errorCode: 'AUTHZ_DENIED',
                message: `Unauthorized access attempt by ${req.user.role} to ${req.originalUrl}`,
                userId: req.user.id,
                endpoint: req.originalUrl,
                method: req.method,
                correlationId: req.correlationId
            });

            return res.status(403).json({
                success: false,
                errorCode: 'AUTHZ_002',
                message: 'You do not have permission to perform this action.',
                correlationId: req.correlationId
            });
        }

        next();
    };
}

/**
 * Validate ticket ownership
 */
async function validateTicketOwnership(req, res, next) {
    const ticketId = req.params.ticketId || req.params.id;
    
    if (!ticketId) {
        return res.status(400).json({
            success: false,
            errorCode: 'TICKET_001',
            message: 'Ticket ID is required.',
            correlationId: req.correlationId
        });
    }

    try {
        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                errorCode: 'TICKET_002',
                message: 'Ticket not found.',
                correlationId: req.correlationId
            });
        }

        // Attach ticket to request
        req.ticket = ticket;

        // Role-based ownership validation
        const { role, id: userId } = req.user;

        switch (role) {
            case config.roles.CITIZEN:
                if (ticket.createdBy.toString() !== userId.toString()) {
                    return res.status(403).json({
                        success: false,
                        errorCode: 'TICKET_003',
                        message: 'You can only access your own tickets.',
                        correlationId: req.correlationId
                    });
                }
                break;

            case config.roles.WORKER:
                if (!ticket.assignedTo || ticket.assignedTo.toString() !== userId.toString()) {
                    return res.status(403).json({
                        success: false,
                        errorCode: 'TICKET_004',
                        message: 'This ticket is not assigned to you.',
                        correlationId: req.correlationId
                    });
                }
                break;

            case config.roles.ADMIN:
                // Admins can access all tickets
                break;

            default:
                return res.status(403).json({
                    success: false,
                    errorCode: 'TICKET_005',
                    message: 'Invalid role.',
                    correlationId: req.correlationId
                });
        }

        next();
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                errorCode: 'TICKET_006',
                message: 'Invalid ticket ID format.',
                correlationId: req.correlationId
            });
        }
        next(error);
    }
}

/**
 * Validate status transition
 */
function validateStatusTransition(requiredCurrentStatus, newStatus) {
    return (req, res, next) => {
        const ticket = req.ticket;

        const allowedStatuses = Array.isArray(requiredCurrentStatus) 
            ? requiredCurrentStatus 
            : [requiredCurrentStatus];

        if (!allowedStatuses.includes(ticket.status)) {
            return res.status(400).json({
                success: false,
                errorCode: 'STATUS_001',
                message: `Invalid ticket status. Expected: ${allowedStatuses.join(' or ')}, Current: ${ticket.status}`,
                correlationId: req.correlationId
            });
        }

        const allowedTransitions = config.statusTransitions[ticket.status] || [];
        if (!allowedTransitions.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                errorCode: 'STATUS_002',
                message: `Cannot transition from ${ticket.status} to ${newStatus}.`,
                correlationId: req.correlationId
            });
        }

        req.statusTransition = {
            from: ticket.status,
            to: newStatus
        };

        next();
    };
}

module.exports = {
    authenticate,
    authorize,
    validateTicketOwnership,
    validateStatusTransition
};
