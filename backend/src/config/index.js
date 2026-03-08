/**
 * Configuration Module
 * Enterprise Village Issue Tracking System
 * 
 * All configuration values with sensible defaults
 * Environment variables take precedence when available
 */

const path = require('path');

const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'village-issue-tracking-system-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/village_issue_tracking'
  },
  
  // File Upload
  upload: {
    dir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  
  // SLA Defaults (in hours)
  sla: {
    P1: parseInt(process.env.SLA_P1) || 24,  // Critical - 24 hours
    P2: parseInt(process.env.SLA_P2) || 48,  // High - 48 hours
    P3: parseInt(process.env.SLA_P3) || 72   // Normal - 72 hours
  },
  
  // Ticket ID Format
  ticketIdPrefix: 'VIL',
  
  // Roles
  roles: {
    CITIZEN: 'CITIZEN',
    ADMIN: 'ADMIN',
    WORKER: 'WORKER'
  },
  
  // Ticket Statuses
  statuses: {
    NEW: 'NEW',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    RESOLVED: 'RESOLVED',
    UNDER_REVIEW: 'UNDER_REVIEW',
    CLOSED: 'CLOSED',
    REOPENED: 'REOPENED'
  },
  
  // Priority Levels
  priorities: {
    P1: 'P1', // Critical
    P2: 'P2', // High
    P3: 'P3'  // Normal
  },
  
  // Valid Status Transitions
  statusTransitions: {
    NEW: ['VERIFIED', 'REJECTED'],
    VERIFIED: ['ASSIGNED'],
    REJECTED: [], // Terminal state
    ASSIGNED: ['IN_PROGRESS'],
    IN_PROGRESS: ['RESOLVED'],
    RESOLVED: ['UNDER_REVIEW', 'IN_PROGRESS'], // Admin can approve or reject
    UNDER_REVIEW: ['CLOSED'],
    CLOSED: ['REOPENED'],
    REOPENED: ['VERIFIED', 'REJECTED']
  },
  
  // Categories
  categories: [
    'ROAD_DAMAGE',
    'WATER_SUPPLY',
    'ELECTRICITY',
    'SANITATION',
    'STREET_LIGHTS',
    'DRAINAGE',
    'PUBLIC_PROPERTY',
    'ENVIRONMENTAL',
    'OTHER'
  ],
  
  // Severity Levels
  severities: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
};

module.exports = config;
