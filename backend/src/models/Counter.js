/**
 * Counter Model
 * Enterprise Village Issue Tracking System
 * 
 * For auto-incrementing ticket numbers
 */

const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    sequence: {
        type: Number,
        default: 0
    }
});

// Static method to get next sequence
counterSchema.statics.getNextSequence = async function(name) {
    const counter = await this.findByIdAndUpdate(
        name,
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
    );
    return counter.sequence;
};

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
