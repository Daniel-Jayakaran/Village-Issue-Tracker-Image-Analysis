/**
 * Enterprise Village Issue Tracking System
 * Main Server Entry Point (MERN Stack)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const { connectDatabase } = require('./database/connection');
const { errorMiddleware } = require('./utils/errorHandler');
const { processSLABreaches } = require('./utils/sla');

// Import routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');

// Initialize Express app
const app = express();

// =============================================
// MIDDLEWARE
// =============================================

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request correlation ID
app.use((req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] || uuidv4();
    res.setHeader('X-Correlation-ID', req.correlationId);
    next();
});

// Request logging (development)
if (config.nodeEnv === 'development') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
    });
}

// Static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// =============================================
// ROUTES
// =============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Village Issue Tracking System API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        stack: 'MERN'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        errorCode: 'NOT_FOUND',
        message: 'The requested endpoint does not exist.',
        correlationId: req.correlationId
    });
});

// Error handler
app.use(errorMiddleware);

// =============================================
// SERVER STARTUP
// =============================================

async function startServer() {
    try {
        // Connect to MongoDB
        console.log('📦 Connecting to MongoDB...');
        await connectDatabase();

        // Start SLA monitoring (check every 5 minutes)
        setInterval(async () => {
            try {
                const breaches = await processSLABreaches();
                if (breaches > 0) {
                    console.log(`⚠️  Detected ${breaches} SLA breach(es)`);
                }
            } catch (error) {
                console.error('SLA processing error:', error);
            }
        }, 5 * 60 * 1000);

        // Start server
        app.listen(config.port, () => {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🏘️  Village Issue Tracking System                        ║
║     MERN Stack - Enterprise Government Platform              ║
║                                                              ║
║     Server running on: http://localhost:${config.port}       ║
║     Environment: ${config.nodeEnv.padEnd(12)}                ║
║     Database: MongoDB                                        ║
║                                                              ║
║     API Endpoints:                                           ║
║     • Health: GET  /api/health                               ║
║     • Auth:   POST /api/auth/login                           ║
║     • Auth:   POST /api/auth/register                        ║
║     • Tickets: /api/tickets                                  ║
║     • Dashboard: /api/dashboard                              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
