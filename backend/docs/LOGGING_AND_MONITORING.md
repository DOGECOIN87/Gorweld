# Logging and Monitoring Guide

## Overview

The Gorweld backend uses a structured logging system that provides comprehensive debugging capabilities for production environments. This guide covers log configuration, rotation, analysis, and monitoring best practices.

## Log Configuration

### Log Levels

The application supports four log levels (set via `LOG_LEVEL` environment variable):

- **ERROR** (0): Critical errors that require immediate attention
- **WARN** (1): Warning conditions that should be reviewed
- **INFO** (2): General informational messages (default)
- **DEBUG** (3): Detailed debugging information

### Environment Variables

```bash
# Set log level (ERROR, WARN, INFO, DEBUG)
LOG_LEVEL=INFO

# Set environment mode
NODE_ENV=production
```

### Log Format

**Production Mode** (JSON format for log aggregation):
```json
{
  "timestamp": "2025-11-17T12:00:00.000Z",
  "level": "INFO",
  "environment": "production",
  "message": "Transaction verification successful",
  "requestId": "a1b2c3d4e5f6...",
  "method": "POST",
  "path": "/api/cards/submit",
  "signature": "5x...",
  "duration_ms": 245
}
```

**Development Mode** (human-readable format):
```
[2025-11-17T12:00:00.000Z] INFO: Transaction verification successful
{
  "requestId": "a1b2c3d4e5f6...",
  "signature": "5x...",
  "duration_ms": 245
}
```

## Request Tracing

Every request is assigned a unique `requestId` that appears in all related log entries. This enables tracing a single request through the entire system.

**Request ID Header**: Clients can provide `X-Request-ID` header, or one will be generated automatically.

**Response Header**: The request ID is returned in the `X-Request-ID` response header.

## Log Rotation Setup

### Using logrotate (Recommended for Linux)

Create `/etc/logrotate.d/gorweld-backend`:

```
/var/log/gorweld-backend/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Using PM2 Log Rotation

Install PM2 log rotation module:

```bash
pm2 install pm2-logrotate
```

Configure rotation:

```bash
# Set max log file size (default: 10MB)
pm2 set pm2-logrotate:max_size 50M

# Set number of rotated logs to keep (default: 10)
pm2 set pm2-logrotate:retain 30

# Enable compression
pm2 set pm2-logrotate:compress true

# Set rotation interval (default: daily)
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

### Manual Log Rotation Script

Create `backend/scripts/rotate-logs.sh`:

```bash
#!/bin/bash

LOG_DIR="/var/log/gorweld-backend"
ARCHIVE_DIR="$LOG_DIR/archive"
RETENTION_DAYS=30

# Create archive directory
mkdir -p "$ARCHIVE_DIR"

# Rotate logs
for log in "$LOG_DIR"/*.log; do
    if [ -f "$log" ]; then
        timestamp=$(date +%Y%m%d-%H%M%S)
        filename=$(basename "$log" .log)
        
        # Compress and move to archive
        gzip -c "$log" > "$ARCHIVE_DIR/${filename}-${timestamp}.log.gz"
        
        # Truncate original log
        > "$log"
    fi
done

# Delete old archives
find "$ARCHIVE_DIR" -name "*.log.gz" -mtime +$RETENTION_DAYS -delete

echo "Log rotation completed at $(date)"
```

Add to crontab:

```bash
# Run daily at midnight
0 0 * * * /path/to/backend/scripts/rotate-logs.sh
```

## Log Analysis

### Analyzing Error Logs

Use the provided log analysis script:

```bash
node backend/scripts/analyze-logs.js --level ERROR --last 24h
```

### Common Log Queries

**Find all errors in the last hour:**
```bash
grep '"level":"ERROR"' /var/log/gorweld-backend/app.log | \
  jq 'select(.timestamp > (now - 3600 | strftime("%Y-%m-%dT%H:%M:%S")))'
```

**Track a specific request:**
```bash
grep '"requestId":"abc123"' /var/log/gorweld-backend/app.log | jq '.'
```

**Find slow operations (>1000ms):**
```bash
grep '"duration_ms"' /var/log/gorweld-backend/app.log | \
  jq 'select(.duration_ms > 1000)'
```

**Count errors by type:**
```bash
grep '"level":"ERROR"' /var/log/gorweld-backend/app.log | \
  jq -r '.code' | sort | uniq -c | sort -rn
```

**Transaction verification failures:**
```bash
grep 'Transaction verification failed' /var/log/gorweld-backend/app.log | \
  jq '{timestamp, code, signature}'
```

## Monitoring and Alerts

### Critical Errors to Monitor

1. **Database Connection Failures**
   - Pattern: `"error":"Error opening database"`
   - Action: Check database file permissions and disk space

2. **RPC Connection Failures**
   - Pattern: `"code":"VERIFICATION_ERROR"` or `"Solana RPC connection failed"`
   - Action: Check RPC endpoint availability and rate limits

3. **High Error Rate**
   - Threshold: >10 errors per minute
   - Action: Investigate recent deployments or infrastructure changes

4. **Slow Operations**
   - Threshold: Operations taking >5 seconds
   - Action: Check RPC latency and database performance

### Setting Up Alerts

#### Using PM2 Plus (Recommended)

```bash
# Link to PM2 Plus
pm2 link <secret_key> <public_key>

# Configure alerts
pm2 set pm2:autodump true
```

PM2 Plus provides:
- Real-time error tracking
- Performance monitoring
- Custom alert rules
- Log streaming

#### Using Custom Alert Script

Create `backend/scripts/check-errors.sh`:

```bash
#!/bin/bash

LOG_FILE="/var/log/gorweld-backend/app.log"
ERROR_THRESHOLD=10
TIME_WINDOW=60  # seconds

# Count errors in last minute
error_count=$(grep '"level":"ERROR"' "$LOG_FILE" | \
  jq -r 'select(.timestamp > (now - '$TIME_WINDOW' | strftime("%Y-%m-%dT%H:%M:%S")))' | \
  wc -l)

if [ "$error_count" -gt "$ERROR_THRESHOLD" ]; then
    echo "ALERT: $error_count errors in last $TIME_WINDOW seconds"
    
    # Send notification (customize based on your setup)
    # curl -X POST https://your-webhook-url \
    #   -d "text=High error rate detected: $error_count errors"
    
    exit 1
fi

exit 0
```

Add to crontab:

```bash
# Check every minute
* * * * * /path/to/backend/scripts/check-errors.sh
```

### Health Check Monitoring

Monitor the `/health` endpoint:

```bash
#!/bin/bash

HEALTH_URL="https://api.gorweld.com/health"
ALERT_WEBHOOK="https://your-webhook-url"

response=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" != "200" ]; then
    echo "ALERT: Health check failed with status $http_code"
    
    # Parse response for details
    status=$(echo "$body" | jq -r '.status')
    db_status=$(echo "$body" | jq -r '.checks.database.status')
    rpc_status=$(echo "$body" | jq -r '.checks.solanaRpc.status')
    
    message="Health check failed: status=$status, db=$db_status, rpc=$rpc_status"
    
    # Send alert
    curl -X POST "$ALERT_WEBHOOK" -d "text=$message"
fi
```

## Monitoring Best Practices

### 1. Regular Log Review

- Review ERROR logs daily
- Review WARN logs weekly
- Monitor transaction verification failure patterns
- Track API response times

### 2. Disk Space Management

- Monitor log directory disk usage
- Set up alerts for >80% disk usage
- Ensure log rotation is working correctly

### 3. Performance Monitoring

Track these metrics:
- Average request duration
- RPC call latency
- Database query performance
- Error rate trends

### 4. Security Monitoring

- Monitor for unusual transaction patterns
- Track failed authentication attempts
- Watch for suspicious wallet addresses
- Monitor rate limit violations

### 5. Capacity Planning

- Track request volume trends
- Monitor database growth
- Plan for RPC rate limit increases
- Scale infrastructure proactively

## Log Aggregation Services

### Recommended Services

1. **PM2 Plus** (Easiest)
   - Built-in PM2 integration
   - Real-time monitoring
   - Error tracking
   - Free tier available

2. **Datadog**
   - Comprehensive monitoring
   - Custom dashboards
   - Advanced alerting
   - Log aggregation

3. **Logtail** (formerly Timber)
   - Simple setup
   - SQL-like queries
   - Affordable pricing
   - Good for small teams

4. **ELK Stack** (Self-hosted)
   - Elasticsearch + Logstash + Kibana
   - Full control
   - Requires infrastructure
   - Best for large deployments

### Integration Example (Logtail)

```javascript
// Add to backend/utils/logger.js
const https = require('https');

function sendToLogtail(logEntry) {
    if (process.env.LOGTAIL_TOKEN) {
        const data = JSON.stringify(logEntry);
        
        const options = {
            hostname: 'in.logtail.com',
            port: 443,
            path: '/',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.LOGTAIL_TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        
        const req = https.request(options);
        req.write(data);
        req.end();
    }
}
```

## Troubleshooting

### Logs Not Appearing

1. Check log level configuration
2. Verify LOG_LEVEL environment variable
3. Check file permissions
4. Ensure PM2 is capturing logs

### High Log Volume

1. Increase log level (INFO → WARN → ERROR)
2. Implement log sampling for high-traffic endpoints
3. Increase log rotation frequency
4. Add log filtering

### Missing Request IDs

1. Ensure requestIdMiddleware is loaded before routes
2. Check that req.logger is being used instead of console.log
3. Verify middleware order in server/index.js

## Example Queries

### Generate Daily Error Report

```bash
node backend/scripts/analyze-logs.js \
  --level ERROR \
  --start "2025-11-17 00:00:00" \
  --end "2025-11-17 23:59:59" \
  --output report.json
```

### Monitor Transaction Success Rate

```bash
# Count successful transactions
success=$(grep 'Transaction verification successful' app.log | wc -l)

# Count failed transactions
failed=$(grep 'Transaction verification failed' app.log | wc -l)

# Calculate success rate
total=$((success + failed))
rate=$(echo "scale=2; $success * 100 / $total" | bc)

echo "Transaction success rate: $rate%"
```

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/log-management/)
- [Logrotate Manual](https://linux.die.net/man/8/logrotate)
- [jq Manual](https://stedolan.github.io/jq/manual/)
- [Node.js Logging Best Practices](https://nodejs.org/en/docs/guides/diagnostics/logging/)
