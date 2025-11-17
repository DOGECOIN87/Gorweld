/**
 * Centralized error handling middleware
 */

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
    constructor(message, statusCode = 500, code = null, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'ApiError';
    }
}

/**
 * Error handler middleware
 * This should be the last middleware in the chain
 */
function errorHandler(err, req, res, next) {
    // Log error for debugging
    console.error('Error occurred:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    // Default error response
    let statusCode = err.statusCode || 500;
    let response = {
        success: false,
        error: err.message || 'Internal server error',
        timestamp: new Date().toISOString()
    };

    // Add error code if available
    if (err.code) {
        response.code = err.code;
    }

    // Add details if available
    if (err.details) {
        response.details = err.details;
    }

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        response.error = 'Validation failed';
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        response.error = 'Unauthorized';
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        response.error = 'Forbidden';
    } else if (err.name === 'NotFoundError') {
        statusCode = 404;
        response.error = 'Resource not found';
    }

    // Include stack trace in development mode
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

/**
 * 404 handler for undefined routes
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    ApiError,
    errorHandler,
    notFoundHandler,
    asyncHandler
};
