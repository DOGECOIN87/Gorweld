#!/usr/bin/env node

/**
 * Log Analysis Script
 * Analyzes application logs and generates reports
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    level: null,
    start: null,
    end: null,
    last: null,
    logFile: process.env.LOG_FILE || '/var/log/gorweld-backend/app.log',
    output: null,
    code: null
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '--level':
            options.level = args[++i];
            break;
        case '--start':
            options.start = new Date(args[++i]);
            break;
        case '--end':
            options.end = new Date(args[++i]);
            break;
        case '--last':
            options.last = args[++i];
            break;
        case '--log-file':
            options.logFile = args[++i];
            break;
        case '--output':
            options.output = args[++i];
            break;
        case '--code':
            options.code = args[++i];
            break;
        case '--help':
            printHelp();
            process.exit(0);
    }
}

function printHelp() {
    console.log(`
Log Analysis Script

Usage: node analyze-logs.js [options]

Options:
  --level <LEVEL>       Filter by log level (ERROR, WARN, INFO, DEBUG)
  --start <DATETIME>    Start datetime (e.g., "2025-11-17 00:00:00")
  --end <DATETIME>      End datetime (e.g., "2025-11-17 23:59:59")
  --last <DURATION>     Last duration (e.g., "1h", "24h", "7d")
  --code <CODE>         Filter by error code
  --log-file <PATH>     Path to log file (default: /var/log/gorweld-backend/app.log)
  --output <PATH>       Output file path (JSON format)
  --help                Show this help message

Examples:
  # Analyze errors in the last 24 hours
  node analyze-logs.js --level ERROR --last 24h

  # Analyze specific date range
  node analyze-logs.js --start "2025-11-17 00:00:00" --end "2025-11-17 23:59:59"

  # Find specific error code
  node analyze-logs.js --code DUPLICATE_SIGNATURE --last 7d

  # Generate JSON report
  node analyze-logs.js --level ERROR --last 24h --output report.json
`);
}

function parseDuration(duration) {
    const match = duration.match(/^(\d+)(h|d|m)$/);
    if (!match) {
        throw new Error('Invalid duration format. Use format like: 1h, 24h, 7d, 30m');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const now = new Date();
    switch (unit) {
        case 'm':
            return new Date(now.getTime() - value * 60 * 1000);
        case 'h':
            return new Date(now.getTime() - value * 60 * 60 * 1000);
        case 'd':
            return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
        default:
            throw new Error('Invalid duration unit');
    }
}

function matchesFilters(logEntry, options) {
    // Filter by level
    if (options.level && logEntry.level !== options.level) {
        return false;
    }

    // Filter by error code
    if (options.code && logEntry.code !== options.code) {
        return false;
    }

    // Filter by time range
    const timestamp = new Date(logEntry.timestamp);
    
    if (options.start && timestamp < options.start) {
        return false;
    }

    if (options.end && timestamp > options.end) {
        return false;
    }

    return true;
}

async function analyzeLogs() {
    // Calculate time range if --last is specified
    if (options.last) {
        options.start = parseDuration(options.last);
        options.end = new Date();
    }

    // Check if log file exists
    if (!fs.existsSync(options.logFile)) {
        console.error(`Error: Log file not found: ${options.logFile}`);
        process.exit(1);
    }

    console.log('Analyzing logs...');
    console.log(`Log file: ${options.logFile}`);
    if (options.level) console.log(`Level: ${options.level}`);
    if (options.code) console.log(`Code: ${options.code}`);
    if (options.start) console.log(`Start: ${options.start.toISOString()}`);
    if (options.end) console.log(`End: ${options.end.toISOString()}`);
    console.log('');

    const results = {
        summary: {
            totalEntries: 0,
            matchedEntries: 0,
            byLevel: {},
            byCode: {},
            byPath: {},
            slowOperations: [],
            timeRange: {
                start: options.start?.toISOString(),
                end: options.end?.toISOString()
            }
        },
        entries: []
    };

    // Read log file line by line
    const fileStream = fs.createReadStream(options.logFile);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (!line.trim()) continue;

        try {
            const logEntry = JSON.parse(line);
            results.summary.totalEntries++;

            if (matchesFilters(logEntry, options)) {
                results.summary.matchedEntries++;
                results.entries.push(logEntry);

                // Count by level
                results.summary.byLevel[logEntry.level] = 
                    (results.summary.byLevel[logEntry.level] || 0) + 1;

                // Count by code
                if (logEntry.code) {
                    results.summary.byCode[logEntry.code] = 
                        (results.summary.byCode[logEntry.code] || 0) + 1;
                }

                // Count by path
                if (logEntry.path) {
                    results.summary.byPath[logEntry.path] = 
                        (results.summary.byPath[logEntry.path] || 0) + 1;
                }

                // Track slow operations
                if (logEntry.duration_ms && logEntry.duration_ms > 1000) {
                    results.summary.slowOperations.push({
                        timestamp: logEntry.timestamp,
                        operation: logEntry.operation || logEntry.message,
                        duration_ms: logEntry.duration_ms,
                        path: logEntry.path
                    });
                }
            }
        } catch (err) {
            // Skip non-JSON lines (development mode logs)
            continue;
        }
    }

    // Sort slow operations by duration
    results.summary.slowOperations.sort((a, b) => b.duration_ms - a.duration_ms);
    results.summary.slowOperations = results.summary.slowOperations.slice(0, 10);

    // Print summary
    console.log('=== Analysis Summary ===\n');
    console.log(`Total log entries: ${results.summary.totalEntries}`);
    console.log(`Matched entries: ${results.summary.matchedEntries}\n`);

    if (Object.keys(results.summary.byLevel).length > 0) {
        console.log('By Level:');
        Object.entries(results.summary.byLevel)
            .sort((a, b) => b[1] - a[1])
            .forEach(([level, count]) => {
                console.log(`  ${level}: ${count}`);
            });
        console.log('');
    }

    if (Object.keys(results.summary.byCode).length > 0) {
        console.log('By Error Code:');
        Object.entries(results.summary.byCode)
            .sort((a, b) => b[1] - a[1])
            .forEach(([code, count]) => {
                console.log(`  ${code}: ${count}`);
            });
        console.log('');
    }

    if (Object.keys(results.summary.byPath).length > 0) {
        console.log('By Path (Top 10):');
        Object.entries(results.summary.byPath)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([path, count]) => {
                console.log(`  ${path}: ${count}`);
            });
        console.log('');
    }

    if (results.summary.slowOperations.length > 0) {
        console.log('Slow Operations (>1000ms):');
        results.summary.slowOperations.forEach(op => {
            console.log(`  ${op.duration_ms}ms - ${op.operation} (${op.timestamp})`);
        });
        console.log('');
    }

    // Show recent entries
    if (results.entries.length > 0) {
        console.log('Recent Entries (last 5):');
        results.entries.slice(-5).forEach(entry => {
            console.log(`  [${entry.timestamp}] ${entry.level}: ${entry.message}`);
            if (entry.code) console.log(`    Code: ${entry.code}`);
            if (entry.requestId) console.log(`    Request ID: ${entry.requestId}`);
        });
        console.log('');
    }

    // Save to file if requested
    if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(results, null, 2));
        console.log(`Report saved to: ${options.output}`);
    }

    return results;
}

// Run analysis
analyzeLogs()
    .then(() => {
        console.log('Analysis complete');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error analyzing logs:', err.message);
        process.exit(1);
    });
