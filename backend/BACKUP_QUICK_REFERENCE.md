# Database Backup Quick Reference

Quick reference guide for common backup and recovery operations.

## Quick Commands

### Create Backup
```bash
node scripts/backup-database.js
```

### Verify Backup
```bash
# Verify specific backup
node scripts/verify-backup.js backups/cards-backup-2025-11-17.db.gz

# Verify all backups
node scripts/verify-backup.js
```

### List Backups
```bash
ls -lht backups/
```

### Restore Database
```bash
# List available backups
node scripts/restore-database.js

# Restore from backup
node scripts/restore-database.js backups/cards-backup-2025-11-17.db.gz
```

## Setup Automated Backups

### Interactive Setup
```bash
chmod +x scripts/setup-backup-cron.sh
./scripts/setup-backup-cron.sh
```

### Manual Cron Setup
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/backend && /usr/bin/node scripts/backup-database.js >> logs/backup.log 2>&1
```

## Emergency Recovery

### Quick Recovery Steps
1. Stop backend server
2. List available backups: `node scripts/restore-database.js`
3. Restore: `node scripts/restore-database.js backups/latest-backup.db.gz`
4. Verify: `node scripts/verify-backup.js data/cards.db`
5. Restart backend server

### Verify Database Integrity
```bash
sqlite3 data/cards.db "PRAGMA integrity_check;"
```

## Common Scenarios

### Before Major Update
```bash
# Create backup before update
node scripts/backup-database.js

# Note the backup filename for rollback if needed
```

### After Accidental Deletion
```bash
# Find backup from before deletion
ls -lht backups/

# Restore appropriate backup
node scripts/restore-database.js backups/cards-backup-YYYY-MM-DD.db.gz
```

### Test Restoration (Staging)
```bash
# Copy backup to staging
scp backups/latest.db.gz user@staging:/path/to/backend/backups/

# Restore on staging
ssh user@staging
cd /path/to/backend
node scripts/restore-database.js backups/latest.db.gz
```

## Monitoring

### Check Backup Status
```bash
# View recent backups
ls -lht backups/ | head -10

# Check backup log
tail -f logs/backup.log

# Verify latest backup
node scripts/verify-backup.js backups/$(ls -t backups/ | head -1)
```

### Check Disk Space
```bash
# Check backup directory size
du -sh backups/

# Check available disk space
df -h .
```

## Configuration

### Environment Variables
```bash
# Database location
export DATABASE_PATH=./data/cards.db

# Backup directory
export BACKUP_DIR=./backups

# Retention period (days)
export BACKUP_RETENTION_DAYS=30

# Enable/disable compression
export BACKUP_COMPRESS=true
```

## Troubleshooting

### Backup Fails
```bash
# Check database exists
ls -lh data/cards.db

# Check disk space
df -h .

# Check permissions
ls -ld backups/
```

### Restore Fails
```bash
# Verify backup first
node scripts/verify-backup.js backups/backup-file.db.gz

# Check backup file exists
ls -lh backups/backup-file.db.gz

# Ensure backend is stopped
pm2 stop gorweld-backend
```

### Verification Fails
```bash
# Check backup file
file backups/backup-file.db.gz

# Try decompressing manually
gunzip -c backups/backup-file.db.gz > /tmp/test.db

# Check decompressed file
sqlite3 /tmp/test.db "SELECT COUNT(*) FROM cards;"
```

## Best Practices

1. **Test regularly**: Monthly restoration tests
2. **Verify backups**: Always verify after creation
3. **Multiple locations**: Store backups off-site
4. **Before updates**: Always backup before major changes
5. **Monitor space**: Keep eye on backup directory size
6. **Document**: Log all recovery operations

## Support

For detailed documentation, see:
- [Backup and Recovery Procedures](docs/BACKUP_AND_RECOVERY.md)
- [Scripts README](scripts/README.md)

## Emergency Contacts

- System Administrator: [contact info]
- Database Administrator: [contact info]
- On-call Support: [contact info]
