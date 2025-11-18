#!/usr/bin/env node

/**
 * Critical Error Monitoring Script
 * Checks for critical errors and sends alerts
 */

const fs = require('fs');
const readline = require('readline');
const https = require('https');

// Configuration
const config = {
    logFile: process.env.LOG_FILE || '/var/log/gorweld-backend/app.log',
    timeWindow: parseInt(process.env.TIME_WINDOW || '300'), // 5 minutes in seconds
    errorThreshold: parseInt(process.env.ERROR_THRESHOLD || '10'),
    webhookUrl: process.env.ALERT_WEBHOOK_URL,
    checkInterval: parseInt(process.env.CHECK_INTERVAL || '60') // seconds
};

// Critical error patterns to monitor
const criticalPatterns = {
    databaseFailure: {
        pattern: /Error opening database|Database connection failed/,
        severity: 'CRITICAL',
        description: 'Database connection failure'
    },
    rpcFailure: {
        pattern: /Solana RPC connection failed|VERIFICATION_ERROR/,
        severity: 'HIGH',
        description: 'Solana RPC connection failure'
    },
    highErrorRate: {
        threshold: config.errorThreshold,
        severity: 'HIGH',
        description: 'High error rate detected'
    }
};

/**
 * Send alert notification
 */
function sendAlert(alert) {
    console.log(`ALERT: ${alert.severity} - ${alert.description}`);
    console.log(`Details: ${JSON.stringify(alert.details, null, 2)}`);

    if (!config.webhookUrl) {
        console.log('No webhook URL configured. Set ALERT_WEBHOOK_URL environment variable.');
        return;
    }

    const payload = JSON.stringify({
        text: `🚨 ${alert.severity}: ${alert.description}`,
        details: alert.details,
        timestamp: new Date().toISOString()
    });

    const url = new URL(config.webhookUrl);
    const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const req = https.request(options, (res) => {
        console.log(`Alert sent. Status: ${res.statusCode}`);
    });

    req.on('error', (err) => {
        console.error('Error sending alert:', err.message);
    });

    req.write(payload);
    req.end();
}

/**
 * Check for critical errors in logs
 */
async function checkLogs() {
    if (!fs.existsSync(config.logFile)) {
        console.error(`Log file not found: ${config.logFile}`);
        return;
    }

    const cutoffTime = new Date(Date.now() - config.timeWindow * 1000);
    const errors = {
        total: 0,
        byCode: {},
        byPattern: {},
        recentErrors: []
    };

    // Read log file
    const fileStream = fs.createReadStream(config.logFile);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (!line.trim()) continue;

        try {
            const logEntry = JSON.parse(line);
            const timestamp = new Date(logEntry.timestamp);

            // Only check recent logs
            if (timestamp < cutoffTime) continue;

            // Count errors
            if (logEntry.level === 'ERROR') {
                errors.total++;
                errors.recentErrors.push({
                    timestamp: logEntry.timestamp,
                    message: logEntry.message,
                    code: logEntry.code,
                    requestId: logEntry.requestId
                });

                // Count by code
                if (logEntry.code) {
                    errors.byCode[logEntry.code] = (errors.byCode[logEntry.code] || 0) + 1;
                }

                // Check critical patterns
                const message = logEntry.message + ' ' + (logEntry.error || '');
                for (const [key, pattern] of Object.entries(criticalPatterns)) {
                    if (pattern.pattern && pattern.pattern.test(message)) {
                        errors.byPattern[key] = (errors.byPattern[key] || 0) + 1;
                    }
                }
            }
        } catch (err) {
            // Skip non-JSON lines
            continue;
        }
    }

    // Check for alerts
    const alerts = [];

    // High error rate
    if (errors.total > config.errorThreshold) {
        alerts.push({
            severity: 'HIGH',
            description: `High error rate: ${errors.total} errors in ${config.timeWindow}s`,
            details: {
                errorCount: errors.total,
                timeWindow: config.timeWindow,
                threshold: config.errorThreshold,
                topErrors: Object.entries(errors.byCode)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([code, count]) => ({ code, count })),
                recentErrors: errors.recentErrors.slice(-3)
            }
        });
    }

    // Critical pattern matches
    for (const [key, pattern] of Object.entries(criticalPatterns)) {
        if (pattern.pattern && errors.byPattern[key] > 0) {
            alerts.push({
                severity: pattern.severity,
                description: `${pattern.description}: ${errors.byPattern[key]} occurrences`,
                details: {
                    pattern: key,
                    count: errors.byPattern[key],
                    timeWindow: config.timeWindow,
                    recentErrors: errors.recentErrors
                        .filter(e => pattern.pattern.test(e.message))
                        .slice(-3)
                }
            });
        }
    }

    // Send alerts
    if (alerts.length > 0) {
        alerts.forEach(alert => sendAlert(alert));
        return alerts;
    } else {
        console.log(`[${new Date().toISOString()}] No critical errors detected. Total errors: ${errors.total}`);
        return null;
    }
}

/**
 * Run continuous monitoring
 */
async function monitor() {
    console.log('Starting critical error monitoring...');
    console.log(`Log file: ${config.logFile}`);
    console.log(`Time window: ${config.timeWindow}s`);
    console.log(`Error threshold: ${config.errorThreshold}`);
    console.log(`Check interval: ${config.checkInterval}s`);
    console.log('');

    // Run initial check
    await checkLogs();

    // Schedule periodic checks
    setInterval(async () => {
        try {
            await checkLogs();
        } catch (err) {
            console.error('Error checking logs:', err.message);
        }
    }, config.checkInterval * 1000);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help')) {
    console.log(`
Critical Error Monitoring Script

Usage: node check-critical-errors.js [--once]

Options:
  --once    Run once and exit (default: continuous monitoring)
  --help    Show this help message

Environment Variables:
  LOG_FILE            Path to log file (default: /var/log/gorweld-backend/app.log)
  TIME_WINDOW         Time window in seconds (default: 300)
  ERROR_THRESHOLD     Error count threshold (default: 10)
  CHECK_INTERVAL      Check interval in seconds (default: 60)
  ALERT_WEBHOOK_URL   Webhook URL for alerts (optional)

Examples:
  # Run once
  node check-critical-errors.js --once

  # Continuous monitoring
  node check-critical-errors.js

  # With custom configuration
  LOG_FILE=/var/log/app.log ERROR_THRESHOLD=5 node check-critical-errors.js
`);
    process.exit(0);
}

// Run
if (args.includes('--once')) {
    checkLogs()
        .then((alerts) => {
            process.exit(alerts ? 1 : 0);
        })
        .catch(err => {
            console.error('Error:', err.message);
            process.exit(1);
        });
} else {
    monitor().catch(err => {
        console.error('Fatal error:', err.message);
        process.exit(1);
    });
}
