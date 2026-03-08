/**
 * Models Index
 * Enterprise Village Issue Tracking System
 */

const User = require('./User');
const Ticket = require('./Ticket');
const TicketImage = require('./TicketImage');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');
const TicketComment = require('./TicketComment');
const Counter = require('./Counter');

module.exports = {
    User,
    Ticket,
    TicketImage,
    AuditLog,
    Notification,
    TicketComment,
    Counter
};
