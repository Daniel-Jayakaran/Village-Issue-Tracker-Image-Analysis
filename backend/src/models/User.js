/**
 * User Model
 * Enterprise Village Issue Tracking System
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false // Don't include password by default in queries
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['CITIZEN', 'ADMIN', 'WORKER'],
        default: 'CITIZEN'
    },
    address: {
        type: String,
        trim: true
    },
    village: {
        type: String,
        trim: true
    },
    district: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Transform output
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
