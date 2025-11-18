# Backend Scripts

This directory contains utility scripts for database backup/recovery, log management, monitoring, and maintenance.

## Database Backup and Recovery

### backup-database.js

Creates timestamped backups of the SQLite database with compression.

**Usage:**
```bash
node scripts/backup-database.js
```

**Features:**
- Timestamped backup files
- Gzip compression (reduces size by ~70%)
- Automatic cleanup of old backups
- Lists existing backups after completion

**Environment Variables:**
- `DATABASE_PATH`: Database file location (default: `./data/cards.db`)
- `BACKUP_DIR`: Backup directory (default: `./backups`)
- `BACKUP_RETENTION_DAYS`: Days to keep backups (default: 30)
- `BACKUP_COMPRESS`: Enable compression (default: `true`)

### verify-backup.js

Verifies backup integrity and completeness.

**Usage:**
```bash
# Verify single backup
node scripts/verify-backup.js backups/cards-backup-2025-11-17.db.gz

# Verify all backups
node scripts/verify-backup.js
```

**Verification Checks:**
- File exists and is not empty
- Valid SQLite database format
- Required tables present (cards, transactions)
- Correct table schema
- Data integrity (no orphaned records)
- Index verification

### restore-database.js

Restores database from a backup file with safety checks.

**Usage:**
```bash
# List available backups
node scripts/restore-database.js

# Restore from specific backup
node scripts/restore-database.js backups/cards-backup-2025-11-17.db.gz
```

**Safety Features:**
- Automatic backup of current database before restoration
- Backup integrity verification before restoration
- User confirmation required
- Automatic decompression of gzipped backups

### setup-backup-cron.sh

Interactive script to configure automated backups using cron.

**Usage:**
```bash
chmod +x scripts/setup-backup-cron.sh
./scripts/setup-backup-cron.sh
```

**Available Schedules:**
- Daily at 2:00 AM
- Every 12 hours
- Every 6 hours
- Custom schedule

## Log Analysis

### analyze-logs.js

Analyzes application logs and generates reports.

**Usage:**
```bash
# Analyze errors in the last 24 hours
node scripts/analyze-logs.js --level ERROR --last 24h

# Analyze specific date range
node scripts/analyze-logs.js --start "2025-11-17 00:00:00" --end "2025-11-17 23:59:59"

# Find specific error code
node scripts/analyze-logs.js --code DUPLICATE_SIGNATURE --last 7d

# Generate JSON report
node scripts/analyze-logs.js --level ERROR --last 24h --output report.json
```

**Options:**
- `--level <LEVEL>`: Filter by log level (ERROR, WARN, INFO, DEBUG)
- `--start <DATETIME>`: Start datetime
- `--end <DATETIME>`: End datetime
- `--last <DURATION>`: Last duration (e.g., "1h", "24h", "7d")
- `--code <CODE>`: Filter by error code
- `--log-file <PATH>`: Path to log file
- `--output <PATH>`: Output file path (JSON format)

## Critical Error Monitoring

### check-critical-errors.js

Monitors logs for critical errors and sends alerts.

**Usage:**
```bash
# Run once
node scripts/check-critical-errors.js --once

# Continuous monitoring
node scripts/check-critical-errors.js

# With custom configuration
LOG_FILE=/var/log/app.log ERROR_THRESHOLD=5 node scripts/check-critical-errors.js
```

**Environment Variables:**
- `LOG_FILE`: Path to log file (default: /var/log/gorweld-backend/app.log)
- `TIME_WINDOW`: Time window in seconds (default: 300)
- `ERROR_THRESHOLD`: Error count threshold (default: 10)
- `CHECK_INTERVAL`: Check interval in seconds (default: 60)
- `ALERT_WEBHOOK_URL`: Webhook URL for alerts (optional)

**Monitored Patterns:**
- Database connection failures
- Solana RPC connection failures
- High error rates

## Log Rotation

### rotate-logs.sh

Rotates application logs, compresses old logs, and removes logs older than the retention period.

**Usage:**
```bash
# Run manually
./scripts/rotate-logs.sh

# With custom configuration
LOG_DIR=/var/log/app RETENTION_DAYS=60 ./scripts/rotate-logs.sh
```

**Environment Variables:**
- `LOG_DIR`: Directory containing log files (default: /var/log/gorweld-backend)
- `ARCHIVE_DIR`: Directory for archived logs (default: $LOG_DIR/archive)
- `RETENTION_DAYS`: Number of days to keep archived logs (default: 30)

## Setting Up Automation

### 1. Automated Database Backups

**Using the setup script:**
```bash
./scripts/setup-backup-cron.sh
```

**Manual cron configuration:**
```bash
# Edit crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /path/to/backend && /usr/bin/node scripts/backup-database.js >> logs/backup.log 2>&1

# Backup every 6 hours
0 */6 * * * cd /path/to/backend && /usr/bin/node scripts/backup-database.js >> logs/backup.log 2>&1
```

### 2. Log Rotation (Automated)

**Option A: Using cron**
```bash
# Add to crontab
0 0 * * * /path/to/backend/scripts/rotate-logs.sh
```

**Option B: Using PM2 log rotation**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 3. Critical Error Monitoring

**Run as a service:**
```bash
# Using PM2
pm2 start scripts/check-critical-errors.js --name "error-monitor"

# Or using systemd (create /etc/systemd/system/gorweld-monitor.service)
[Unit]
Description=Gorweld Error Monitor
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/node /path/to/backend/scripts/check-critical-errors.js
Restart=always
Environment=LOG_FILE=/var/log/gorweld-backend/app.log
Environment=ALERT_WEBHOOK_URL=https://your-webhook-url

[Install]
WantedBy=multi-user.target
```

### 4. Daily Reports

**Generate daily error reports:**
```bash
# Add to crontab
0 8 * * * node /path/to/backend/scripts/analyze-logs.js --level ERROR --last 24h --output /var/log/gorweld-backend/daily-report-$(date +\%Y\%m\%d).json
```

## Testing

### Test Backup and Recovery

Run the comprehensive test suite:
```bash
node test-backup-recovery.js
```

**Tests:**
- Backup creation
- Backup verification
- Database restoration
- Data consistency
- Backup retention

## Webhook Integration

### Slack Webhook

Set up a Slack incoming webhook and configure:
```bash
export ALERT_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### Discord Webhook

For Discord, use:
```bash
export ALERT_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"
```

### Custom Webhook

The scripts send JSON payloads in this format:
```json
{
  "text": "🚨 HIGH: High error rate detected",
  "details": {
    "errorCount": 15,
    "timeWindow": 300,
    "threshold": 10
  },
  "timestamp": "2025-11-17T12:00:00.000Z"
}
```

## Troubleshooting

### Scripts not executable
```bash
chmod +x scripts/*.sh scripts/*.js
```

### Log file not found
Check the LOG_FILE environment variable or specify with --log-file option.

### Permission denied
Ensure the user running the scripts has read access to log files and write access to archive directory.

### Backup fails with "Database locked"
Stop the backend server before creating manual backups, or ensure no other processes are accessing the database.

### Restoration fails
Verify backup integrity first using `verify-backup.js` before attempting restoration.

## Additional Resources

- [Backup and Recovery Procedures](../docs/BACKUP_AND_RECOVERY.md) - Comprehensive backup/recovery guide
- [Logging and Monitoring](../docs/LOGGING_AND_MONITORING.md) - Logging and monitoring documentation
- [Production Deployment Guide](../../PRODUCTION_DEPLOYMENT_GUIDE.md) - Production deployment procedures
