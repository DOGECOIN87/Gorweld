# Logging and Monitoring Implementation Summary

## Overview

Task 7 "Enhance error logging and monitoring" has been successfully implemented with comprehensive structured logging, request tracing, performance monitoring, and alerting capabilities.

## What Was Implemented

### 1. Structured Logging System (Task 7.1)

#### Core Logger (`backend/utils/logger.js`)
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Structured Output**: JSON format in production, human-readable in development
- **Sensitive Data Protection**: Automatically redacts passwords, private keys, secrets, tokens
- **Child Loggers**: Request-scoped loggers with context inheritance
- **Performance Timers**: Built-in timing for slow operation detection

#### Request ID Middleware (`backend/middleware/requestId.js`)
- **Unique Request IDs**: Generated for each request or accepted from `X-Request-ID` header
- **Request Tracing**: All log entries include requestId for end-to-end tracing
- **Automatic Logging**: Logs incoming requests and completed responses with duration
- **Response Headers**: Returns request ID in `X-Request-ID` response header

#### Updated Components
All backend components now use structured logging:
- ✅ `server/index.js` - Server startup, shutdown, and health checks
- ✅ `services/transactionVerifier.js` - Transaction verification with detailed logging
- ✅ `controllers/cardController.js` - Card operations with performance tracking
- ✅ `middleware/errorHandler.js` - Centralized error logging
- ✅ `models/database.js` - Database operations logging

### 2. Log Aggregation and Monitoring (Task 7.2)

#### Documentation (`backend/docs/LOGGING_AND_MONITORING.md`)
Comprehensive guide covering:
- Log configuration and levels
- Request tracing methodology
- Log rotation setup (logrotate, PM2, manual)
- Log analysis techniques
- Monitoring and alerting strategies
- Integration with log aggregation services (PM2 Plus, Datadog, Logtail, ELK)
- Troubleshooting guide
- Best practices

#### Log Analysis Script (`backend/scripts/analyze-logs.js`)
Features:
- Filter by log level, error code, time range
- Generate summary statistics
- Identify slow operations (>1000ms)
- Count errors by type and endpoint
- Export reports to JSON
- Support for duration-based queries (e.g., "last 24h")

Usage examples:
```bash
node scripts/analyze-logs.js --level ERROR --last 24h
node scripts/analyze-logs.js --code DUPLICATE_SIGNATURE --last 7d
node scripts/analyze-logs.js --level ERROR --last 24h --output report.json
```

#### Critical Error Monitor (`backend/scripts/check-critical-errors.js`)
Features:
- Continuous monitoring or one-time checks
- Detects database connection failures
- Detects Solana RPC failures
- Monitors high error rates
- Sends webhook alerts (Slack, Discord, custom)
- Configurable thresholds and time windows

Usage examples:
```bash
node scripts/check-critical-errors.js --once
node scripts/check-critical-errors.js  # continuous monitoring
```

#### Log Rotation Script (`backend/scripts/rotate-logs.sh`)
Features:
- Rotates and compresses log files
- Configurable retention period
- Automatic cleanup of old archives
- Disk usage reporting
- PM2 log reload integration
- Safe for cron automation

Usage:
```bash
./scripts/rotate-logs.sh
```

#### Scripts Documentation (`backend/scripts/README.md`)
Complete guide for:
- Using all monitoring scripts
- Setting up automated log rotation
- Configuring continuous monitoring
- Webhook integration
- Troubleshooting

## Key Features

### Request Tracing
Every request gets a unique ID that appears in all related log entries:
```json
{
  "requestId": "a1b2c3d4e5f6...",
  "timestamp": "2025-11-17T12:00:00.000Z",
  "level": "INFO",
  "message": "Transaction verification successful"
}
```

### Performance Monitoring
Automatic timing for operations with warnings for slow operations:
```json
{
  "operation": "transaction_verification",
  "duration_ms": 1250,
  "level": "WARN"
}
```

### Sensitive Data Protection
Automatically redacts sensitive information:
- Passwords
- Private keys
- API keys
- Tokens
- Secrets

### Production-Ready JSON Logs
Structured JSON format for easy parsing by log aggregation tools:
```json
{
  "timestamp": "2025-11-17T12:00:00.000Z",
  "level": "ERROR",
  "environment": "production",
  "message": "Transaction verification failed",
  "requestId": "abc123",
  "code": "DUPLICATE_SIGNATURE",
  "signature": "5x..."
}
```

## Configuration

### Environment Variables

Added to `.env.example`:
```bash
# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=/var/log/gorweld-backend/app.log

# Monitoring Configuration
ALERT_WEBHOOK_URL=
ERROR_THRESHOLD=10
TIME_WINDOW=300
CHECK_INTERVAL=60
```

### Log Levels
- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning conditions to review
- **INFO**: General informational messages (default)
- **DEBUG**: Detailed debugging information

## Monitoring Capabilities

### What Gets Logged

1. **All HTTP Requests**
   - Method, path, query parameters
   - Request ID, IP address, user agent
   - Response status code and duration

2. **Transaction Verification**
   - Verification attempts with signature
   - Success/failure with detailed reasons
   - RPC call timing
   - All validation checks

3. **Database Operations**
   - Connection status
   - Query execution
   - Errors with context

4. **Card Operations**
   - Submissions with validation results
   - Updates with permission checks
   - Performance timing

5. **System Events**
   - Server startup/shutdown
   - Graceful shutdown signals
   - Health check results

### Alert Triggers

The monitoring system alerts on:
- High error rates (>10 errors in 5 minutes)
- Database connection failures
- Solana RPC connection failures
- Any critical error patterns

## Usage Examples

### View Recent Errors
```bash
node scripts/analyze-logs.js --level ERROR --last 1h
```

### Generate Daily Report
```bash
node scripts/analyze-logs.js --level ERROR --last 24h --output daily-report.json
```

### Monitor for Critical Errors
```bash
ALERT_WEBHOOK_URL=https://hooks.slack.com/... node scripts/check-critical-errors.js
```

### Rotate Logs
```bash
./scripts/rotate-logs.sh
```

### Track Specific Request
```bash
grep '"requestId":"abc123"' /var/log/gorweld-backend/app.log | jq '.'
```

### Find Slow Operations
```bash
grep '"duration_ms"' /var/log/gorweld-backend/app.log | jq 'select(.duration_ms > 1000)'
```

## Benefits

1. **Production Debugging**: Structured logs with request IDs enable tracing issues across the entire request lifecycle
2. **Performance Monitoring**: Automatic timing helps identify slow operations
3. **Security**: Sensitive data is automatically redacted from logs
4. **Alerting**: Proactive monitoring catches critical errors before they impact users
5. **Analysis**: Rich log data enables trend analysis and capacity planning
6. **Compliance**: Comprehensive audit trail of all operations

## Next Steps

To enable monitoring in production:

1. Set up log rotation (cron or PM2)
2. Configure alert webhook URL
3. Start critical error monitor
4. Set up daily report generation
5. Integrate with log aggregation service (optional)

See `backend/docs/LOGGING_AND_MONITORING.md` for detailed setup instructions.
