/**
 * Request ID middleware for request tracing
 * Generates unique ID for each request and attaches logger with request context
 */

const crypto = require('crypto');
const { logger } = require('../utils/logger');

/**
 * Generate a unique request ID
 */
function generateRequestId() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Request ID middleware
 * Adds unique request ID to each request and creates request-scoped logger
 */
function requestIdMiddleware(req, res, next) {
    // Generate or use existing request ID from header
    const requestId = req.headers['x-request-id'] || generateRequestId();
    
    // Attach request ID to request object
    req.requestId = requestId;
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);
    
    // Create request-scoped logger with request context
    req.logger = logger.child({
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress
    });
    
    // Log incoming request
    req.logger.info('Incoming request', {
        query: req.query,
        userAgent: req.headers['user-agent']
    });
    
    // Track request start time
    req.startTime = Date.now();
    
    // Log response when finished
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - req.startTime;
        const level = res.statusCode >= 500 ? 'error' : 
                     res.statusCode >= 400 ? 'warn' : 'info';
        
        req.logger[level]('Request completed', {
            statusCode: res.statusCode,
            duration_ms: duration
        });
        
        return originalSend.call(this, data);
    };
    
    next();
}

module.exports = {
    requestIdMiddleware,
    generateRequestId
};
