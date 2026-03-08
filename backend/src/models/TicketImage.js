/**
 * Ticket Image Model
 * Enterprise Village Issue Tracking System
 */

const mongoose = require('mongoose');

const ticketImageSchema = new mongoose.Schema({
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true
    },
    imageType: {
        type: String,
        required: true,
        enum: ['PROOF_BEFORE', 'PROOF_AFTER', 'ADDITIONAL']
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: Number,
    mimeType: String,
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index
ticketImageSchema.index({ ticket: 1 });

const TicketImage = mongoose.model('TicketImage', ticketImageSchema);

module.exports = TicketImage;
