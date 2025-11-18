require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Connection } = require('@solana/web3.js');
const Database = require('../models/database');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');
const { requestIdMiddleware } = require('../middleware/requestId');
const { logger } = require('../utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_START_TIME = Date.now();

// Initialize database
const db = new Database(process.env.DATABASE_PATH);

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID and logging middleware
app.use(requestIdMiddleware);

// Attach database to request object
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check endpoint with comprehensive system status
app.get('/health', async (req, res) => {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor((Date.now() - SERVER_START_TIME) / 1000); // uptime in seconds
    const environment = process.env.NODE_ENV || 'development';
    
    const health = {
        status: 'ok',
        timestamp,
        uptime,
        environment,
        checks: {
            database: { status: 'unknown' },
            solanaRpc: { status: 'unknown' }
        }
    };

    let isHealthy = true;

    // Check database connection
    try {
        await req.db.get('SELECT 1 as test');
        health.checks.database = {
            status: 'healthy',
            message: 'Database connection successful'
        };
    } catch (error) {
        isHealthy = false;
        health.checks.database = {
            status: 'unhealthy',
            message: 'Database connection failed',
            error: error.message
        };
    }

    // Check Solana RPC connection
    try {
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        const connection = new Connection(rpcUrl, 'confirmed');
        
        // Try to get the current slot as a health check
        const slot = await connection.getSlot();
        
        health.checks.solanaRpc = {
            status: 'healthy',
            message: 'Solana RPC connection successful',
            endpoint: rpcUrl,
            currentSlot: slot
        };
    } catch (error) {
        isHealthy = false;
        health.checks.solanaRpc = {
            status: 'unhealthy',
            message: 'Solana RPC connection failed',
            endpoint: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
            error: error.message
        };
    }

    // Set overall status and HTTP status code
    if (!isHealthy) {
        health.status = 'degraded';
        return res.status(503).json(health);
    }

    res.status(200).json(health);
});

// API routes
const cardRoutes = require('../routes/cards');
const uploadRoutes = require('../routes/upload');
app.use('/api/cards', cardRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
    try {
        await db.initialize();
        logger.info('Database initialized successfully');
        
        app.listen(PORT, () => {
            logger.info('Server started', {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                healthCheck: `http://localhost:${PORT}/health`
            });
        });
    } catch (error) {
        logger.error('Failed to start server', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Received SIGINT signal, shutting down gracefully...');
    await db.close();
    logger.info('Database connection closed');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM signal, shutting down gracefully...');
    await db.close();
    logger.info('Database connection closed');
    process.exit(0);
});

// Start the server
startServer();

// Export for testing purposes
module.exports = { app, db };
