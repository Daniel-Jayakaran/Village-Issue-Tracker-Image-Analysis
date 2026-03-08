/**
 * Ticket Comment Model
 * Enterprise Village Issue Tracking System
 */

const mongoose = require('mongoose');

const ticketCommentSchema = new mongoose.Schema({
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    isInternal: {
        type: Boolean,
        default: false // Internal notes visible only to Admin/Worker
    }
}, {
    timestamps: true
});

// Index
ticketCommentSchema.index({ ticket: 1 });

const TicketComment = mongoose.model('TicketComment', ticketCommentSchema);

module.exports = TicketComment;
