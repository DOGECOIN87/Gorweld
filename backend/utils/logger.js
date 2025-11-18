/**
 * Structured logging utility for production debugging
 * Provides log levels, request tracing, and performance monitoring
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const LOG_LEVEL_NAMES = {
    0: 'ERROR',
    1: 'WARN',
    2: 'INFO',
    3: 'DEBUG'
};

class Logger {
    constructor() {
        // Set log level from environment or default to INFO
        const envLevel = process.env.LOG_LEVEL || 'INFO';
        this.level = LOG_LEVELS[envLevel.toUpperCase()] ?? LOG_LEVELS.INFO;
        this.environment = process.env.NODE_ENV || 'development';
    }

    /**
     * Format log entry with structured data
     */
    formatLog(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: LOG_LEVEL_NAMES[level],
            environment: this.environment,
            message,
            ...meta
        };

        // Filter out sensitive data
        this.sanitizeSensitiveData(logEntry);

        return logEntry;
    }

    /**
     * Remove sensitive data from logs
     */
    sanitizeSensitiveData(logEntry) {
        const sensitiveKeys = [
            'password',
            'privateKey',
            'private_key',
            'secret',
            'token',
            'apiKey',
            'api_key'
        ];

        const sanitize = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            for (const key in obj) {
                if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                    obj[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object') {
                    sanitize(obj[key]);
                }
            }
        };

        sanitize(logEntry);
    }

    /**
     * Write log to console
     */
    write(level, message, meta = {}) {
        if (level > this.level) return;

        const logEntry = this.formatLog(level, message, meta);

        // Use JSON format in production for log aggregation
        if (this.environment === 'production') {
            console.log(JSON.stringify(logEntry));
        } else {
            // Human-readable format in development
            const levelName = LOG_LEVEL_NAMES[level];
            const metaStr = Object.keys(meta).length > 0 
                ? '\n' + JSON.stringify(meta, null, 2) 
                : '';
            console.log(`[${logEntry.timestamp}] ${levelName}: ${message}${metaStr}`);
        }
    }

    /**
     * Log error message
     */
    error(message, meta = {}) {
        this.write(LOG_LEVELS.ERROR, message, meta);
    }

    /**
     * Log warning message
     */
    warn(message, meta = {}) {
        this.write(LOG_LEVELS.WARN, message, meta);
    }

    /**
     * Log info message
     */
    info(message, meta = {}) {
        this.write(LOG_LEVELS.INFO, message, meta);
    }

    /**
     * Log debug message
     */
    debug(message, meta = {}) {
        this.write(LOG_LEVELS.DEBUG, message, meta);
    }

    /**
     * Create a child logger with additional context
     */
    child(context = {}) {
        return new ChildLogger(this, context);
    }
}

/**
 * Child logger that inherits from parent and adds context
 */
class ChildLogger {
    constructor(parent, context) {
        this.parent = parent;
        this.context = context;
    }

    error(message, meta = {}) {
        this.parent.error(message, { ...this.context, ...meta });
    }

    warn(message, meta = {}) {
        this.parent.warn(message, { ...this.context, ...meta });
    }

    info(message, meta = {}) {
        this.parent.info(message, { ...this.context, ...meta });
    }

    debug(message, meta = {}) {
        this.parent.debug(message, { ...this.context, ...meta });
    }
}

/**
 * Performance timer for measuring operation duration
 */
class PerformanceTimer {
    constructor(logger, operation) {
        this.logger = logger;
        this.operation = operation;
        this.startTime = Date.now();
    }

    /**
     * End timer and log duration
     */
    end(meta = {}) {
        const duration = Date.now() - this.startTime;
        const level = duration > 1000 ? 'warn' : 'info';
        
        this.logger[level](`Operation completed: ${this.operation}`, {
            operation: this.operation,
            duration_ms: duration,
            ...meta
        });

        return duration;
    }
}

// Create singleton logger instance
const logger = new Logger();

/**
 * Create a performance timer
 */
function startTimer(operation) {
    return new PerformanceTimer(logger, operation);
}

module.exports = {
    logger,
    startTimer,
    Logger,
    PerformanceTimer
};
