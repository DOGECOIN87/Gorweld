# Database Backup and Recovery Procedures

This document outlines the backup and recovery procedures for the Gorweld backend database.

## Overview

The Gorweld platform uses SQLite for data persistence, storing project cards and transaction records. Regular backups are essential to prevent data loss and ensure business continuity.

## Backup Strategy

### Backup Schedule

**Recommended Schedule:**
- **Production**: Daily backups at 2:00 AM (low-traffic period)
- **High-traffic periods**: Every 6-12 hours
- **Before major updates**: Manual backup

### Retention Policy

**Default Retention:**
- Keep backups for 30 days
- Configurable via `BACKUP_RETENTION_DAYS` environment variable

**Recommended Retention by Environment:**
- **Production**: 30-90 days
- **Staging**: 14-30 days
- **Development**: 7 days

### Backup Location

**Default**: `./backups/` directory relative to backend root

**Production Recommendations:**
- Store backups on separate disk/volume from database
- Use network-attached storage (NAS) or cloud storage
- Implement off-site backup replication
- Ensure backup directory has adequate disk space

## Backup Scripts

### 1. Create Backup (`backup-database.js`)

Creates a timestamped backup of the database with optional compression.

**Usage:**
```bash
# Basic backup
node scripts/backup-database.js

# With custom configuration
DATABASE_PATH=./data/cards.db \
BACKUP_DIR=./backups \
BACKUP_RETENTION_DAYS=30 \
BACKUP_COMPRESS=true \
node scripts/backup-database.js
```

**Features:**
- Timestamped backup files
- Gzip compression (reduces size by ~70%)
- Automatic cleanup of old backups
- Lists existing backups after completion

**Output:**
- Uncompressed: `cards-backup-YYYY-MM-DDTHH-MM-SS.db`
- Compressed: `cards-backup-YYYY-MM-DDTHH-MM-SS.db.gz`

### 2. Verify Backup (`verify-backup.js`)

Verifies backup integrity and completeness.

**Usage:**
```bash
# Verify single backup
node scripts/verify-backup.js backups/cards-backup-2025-11-17.db.gz

# Verify all backups in directory
node scripts/verify-backup.js
```

**Verification Checks:**
- File exists and is not empty
- Valid SQLite database format
- Required tables present (cards, transactions)
- Correct table schema
- Data integrity (no orphaned records)
- Index verification

**Exit Codes:**
- `0`: Verification passed
- `1`: Verification failed

### 3. Restore Database (`restore-database.js`)

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

**Restoration Process:**
1. Verifies backup file integrity
2. Creates backup of current database
3. Asks for user confirmation
4. Restores database from backup
5. Cleans up temporary files

## Automated Backups

### Using Cron (Linux/macOS)

**Setup Script:**
```bash
chmod +x scripts/setup-backup-cron.sh
./scripts/setup-backup-cron.sh
```

**Manual Cron Configuration:**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/backend && /usr/bin/node scripts/backup-database.js >> logs/backup.log 2>&1

# Add backup every 6 hours
0 */6 * * * cd /path/to/backend && /usr/bin/node scripts/backup-database.js >> logs/backup.log 2>&1
```

### Using systemd Timer (Linux)

**Create service file** (`/etc/systemd/system/gorweld-backup.service`):
```ini
[Unit]
Description=Gorweld Database Backup
After=network.target

[Service]
Type=oneshot
User=gorweld
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/node /path/to/backend/scripts/backup-database.js
StandardOutput=append:/path/to/backend/logs/backup.log
StandardError=append:/path/to/backend/logs/backup.log
```

**Create timer file** (`/etc/systemd/system/gorweld-backup.timer`):
```ini
[Unit]
Description=Gorweld Database Backup Timer
Requires=gorweld-backup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

**Enable and start:**
```bash
sudo systemctl enable gorweld-backup.timer
sudo systemctl start gorweld-backup.timer
sudo systemctl status gorweld-backup.timer
```

### Using PM2 (Node.js Process Manager)

**Create PM2 ecosystem file** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'gorweld-backup',
    script: './scripts/backup-database.js',
    cron_restart: '0 2 * * *',
    autorestart: false,
    watch: false
  }]
};
```

**Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
```

## Recovery Procedures

### Scenario 1: Database Corruption

**Symptoms:**
- Database errors on startup
- SQLite integrity check failures
- Corrupted data or missing records

**Recovery Steps:**
1. Stop the backend server
2. Verify latest backup:
   ```bash
   node scripts/verify-backup.js backups/latest-backup.db.gz
   ```
3. Restore from backup:
   ```bash
   node scripts/restore-database.js backups/latest-backup.db.gz
   ```
4. Verify restoration:
   ```bash
   sqlite3 data/cards.db "PRAGMA integrity_check;"
   ```
5. Restart backend server
6. Test functionality

### Scenario 2: Accidental Data Deletion

**Recovery Steps:**
1. Identify when data was deleted (check logs)
2. Find backup from before deletion:
   ```bash
   ls -lh backups/
   ```
3. Restore from appropriate backup:
   ```bash
   node scripts/restore-database.js backups/cards-backup-YYYY-MM-DD.db.gz
   ```
4. Verify restored data
5. Resume operations

### Scenario 3: Complete Data Loss

**Recovery Steps:**
1. Ensure backend server is stopped
2. List available backups:
   ```bash
   node scripts/restore-database.js
   ```
3. Restore from most recent valid backup:
   ```bash
   node scripts/restore-database.js backups/cards-backup-latest.db.gz
   ```
4. If primary backups unavailable, check off-site backups
5. Verify database integrity:
   ```bash
   node scripts/verify-backup.js data/cards.db
   ```
6. Restart backend server
7. Monitor logs for errors

### Scenario 4: Rollback After Failed Update

**Recovery Steps:**
1. Stop backend server
2. Locate pre-update backup (automatically created):
   ```bash
   ls -lh backups/cards-pre-restore-*.db
   ```
3. Restore previous version:
   ```bash
   node scripts/restore-database.js backups/cards-pre-restore-YYYY-MM-DD.db
   ```
4. Restart backend with previous version
5. Investigate update failure

## Testing Backup and Recovery

### Regular Testing Schedule

**Monthly:**
- Verify all backups in backup directory
- Test restoration to staging environment
- Verify data integrity after restoration

**Quarterly:**
- Full disaster recovery drill
- Test off-site backup retrieval
- Document recovery time

### Test Procedure

1. **Create test backup:**
   ```bash
   node scripts/backup-database.js
   ```

2. **Verify backup:**
   ```bash
   node scripts/verify-backup.js backups/latest-backup.db.gz
   ```

3. **Test restoration (staging):**
   ```bash
   # Copy production backup to staging
   cp backups/latest-backup.db.gz /staging/backups/
   
   # Restore on staging
   cd /staging/backend
   node scripts/restore-database.js backups/latest-backup.db.gz
   ```

4. **Verify restored data:**
   ```bash
   # Check record counts
   sqlite3 data/cards.db "SELECT COUNT(*) FROM cards;"
   sqlite3 data/cards.db "SELECT COUNT(*) FROM transactions;"
   
   # Verify latest records
   sqlite3 data/cards.db "SELECT * FROM cards ORDER BY created_at DESC LIMIT 5;"
   ```

5. **Test application functionality:**
   - Start backend server
   - Test API endpoints
   - Verify card retrieval
   - Check transaction verification

## Monitoring and Alerts

### Backup Monitoring

**Check backup status:**
```bash
# List recent backups
ls -lht backups/ | head -10

# Check backup log
tail -f logs/backup.log

# Verify latest backup
node scripts/verify-backup.js backups/$(ls -t backups/ | head -1)
```

**Automated Monitoring:**
- Monitor backup log for errors
- Alert if backup fails
- Alert if no backup in 24 hours
- Alert if backup verification fails
- Monitor backup directory disk space

### Recommended Alerts

1. **Backup Failure**: Email/SMS when backup script exits with error
2. **Missing Backup**: Alert if no backup created in 24 hours
3. **Verification Failure**: Alert if backup verification fails
4. **Disk Space**: Alert when backup directory >80% full
5. **Old Backups**: Alert if retention cleanup fails

## Best Practices

### Backup Best Practices

1. **3-2-1 Rule**: 3 copies, 2 different media, 1 off-site
2. **Test Regularly**: Monthly restoration tests
3. **Automate**: Use cron/systemd for scheduled backups
4. **Verify**: Always verify backup integrity
5. **Monitor**: Set up alerts for backup failures
6. **Document**: Keep recovery procedures updated
7. **Secure**: Encrypt backups containing sensitive data
8. **Separate Storage**: Store backups on different disk/server

### Recovery Best Practices

1. **Stop First**: Always stop backend before restoration
2. **Backup Current**: Create backup before restoration
3. **Verify Backup**: Verify backup integrity before restoring
4. **Test Staging**: Test restoration on staging first if possible
5. **Verify After**: Verify data integrity after restoration
6. **Document**: Log all recovery actions
7. **Post-Mortem**: Analyze what caused data loss

## Troubleshooting

### Backup Issues

**Issue: Backup script fails with "Database locked"**
- Solution: Ensure no other processes accessing database
- Stop backend server before manual backup

**Issue: Backup directory full**
- Solution: Increase retention policy or add more disk space
- Manually delete old backups: `rm backups/cards-backup-2024-*.db.gz`

**Issue: Compression fails**
- Solution: Ensure gzip installed: `which gzip`
- Disable compression: `BACKUP_COMPRESS=false node scripts/backup-database.js`

### Restoration Issues

**Issue: "Backup file not found"**
- Solution: Verify backup path is correct
- Use absolute path or relative to backend directory

**Issue: "Invalid SQLite database"**
- Solution: Backup file may be corrupted
- Try previous backup
- Check backup verification logs

**Issue: Restoration succeeds but data missing**
- Solution: Backup may be from before data was created
- Check backup timestamp
- Restore from more recent backup

## Environment Variables

```bash
# Database location
DATABASE_PATH=./data/cards.db

# Backup directory
BACKUP_DIR=./backups

# Retention period (days)
BACKUP_RETENTION_DAYS=30

# Enable/disable compression
BACKUP_COMPRESS=true
```

## Security Considerations

### Backup Security

1. **Access Control**: Restrict backup directory permissions
   ```bash
   chmod 700 backups/
   ```

2. **Encryption**: Encrypt backups for off-site storage
   ```bash
   gpg --encrypt --recipient admin@gorweld.fun backup.db.gz
   ```

3. **Secure Transfer**: Use SCP/SFTP for off-site transfers
   ```bash
   scp backups/latest.db.gz user@backup-server:/backups/
   ```

4. **Audit Logs**: Log all backup and restoration operations

### Data Privacy

- Backups contain user wallet addresses and transaction data
- Ensure compliance with data protection regulations
- Implement secure deletion of old backups
- Document data retention policies

## Support and Maintenance

### Regular Maintenance Tasks

**Daily:**
- Verify automated backup completed
- Check backup logs for errors

**Weekly:**
- Review backup disk space usage
- Verify backup retention cleanup working

**Monthly:**
- Test backup restoration
- Review and update procedures
- Audit backup security

### Getting Help

For issues with backup and recovery:
1. Check logs: `logs/backup.log`
2. Verify configuration: environment variables
3. Test scripts manually
4. Review this documentation
5. Contact system administrator

## Appendix

### Quick Reference Commands

```bash
# Create backup
node scripts/backup-database.js

# Verify backup
node scripts/verify-backup.js backups/backup-file.db.gz

# List backups
node scripts/restore-database.js

# Restore backup
node scripts/restore-database.js backups/backup-file.db.gz

# Check database integrity
sqlite3 data/cards.db "PRAGMA integrity_check;"

# View backup logs
tail -f logs/backup.log

# Manual cleanup old backups
find backups/ -name "*.db.gz" -mtime +30 -delete
```

### Database Schema Reference

**cards table:**
- id, wallet_address, transaction_signature
- name, subtitle, description, url, icon
- media_urls (JSON array)
- created_at, updated_at, published

**transactions table:**
- id, signature, wallet_address
- amount, verified_at, card_id

### Related Documentation

- [Logging and Monitoring](./LOGGING_AND_MONITORING.md)
- [Production Deployment Guide](../../PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Backend README](../README.md)
