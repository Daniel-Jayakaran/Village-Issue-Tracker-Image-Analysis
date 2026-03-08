/**
 * Ticket ID Generator
 * Enterprise Village Issue Tracking System
 * 
 * Generates unique ticket numbers in format: VIL-YYYY-XXXX
 */

const { Counter } = require('../models');
const config = require('../config');

/**
 * Generate unique ticket number
 * Format: VIL-2024-0001
 */
async function generateTicketNumber() {
    const year = new Date().getFullYear();
    const prefix = config.ticketIdPrefix;
    const counterName = `ticket_${year}`;

    const sequence = await Counter.getNextSequence(counterName);
    const ticketNumber = `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`;

    return ticketNumber;
}

/**
 * Validate ticket number format
 */
function isValidTicketNumber(ticketNumber) {
    const pattern = /^[A-Z]{3}-\d{4}-\d{4}$/;
    return pattern.test(ticketNumber);
}

module.exports = {
    generateTicketNumber,
    isValidTicketNumber
};
