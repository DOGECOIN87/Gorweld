#!/bin/bash

# Database Backup Script for Gorweld Backend
# This script creates automated backups of the SQLite database

set -e

# Configuration
DB_PATH="/var/www/gorweld-backend/data/cards.db"
BACKUP_DIR="/var/backups/gorweld-backend/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cards_db_$TIMESTAMP.db"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    print_error "Database file not found: $DB_PATH"
    exit 1
fi

# Create backup
print_status "Creating database backup..."
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# Compress backup
print_status "Compressing backup..."
gzip "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

# Verify backup was created
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_status "Backup created successfully: $BACKUP_FILE ($BACKUP_SIZE)"
else
    print_error "Backup failed!"
    exit 1
fi

# Remove old backups (older than RETENTION_DAYS)
print_status "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "cards_db_*.db.gz" -type f -mtime +$RETENTION_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "cards_db_*.db.gz" -type f | wc -l)
print_status "Total backups: $BACKUP_COUNT"

# Optional: Upload to remote storage (uncomment and configure as needed)
# print_status "Uploading to remote storage..."
# aws s3 cp "$BACKUP_FILE" s3://your-bucket/gorweld-backups/
# rclone copy "$BACKUP_FILE" remote:gorweld-backups/

echo ""
echo "✅ Database backup completed successfully!"
