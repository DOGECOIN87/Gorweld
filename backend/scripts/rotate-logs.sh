#!/bin/bash

###############################################################################
# Log Rotation Script for Gorweld Backend
# 
# This script rotates application logs, compresses old logs, and removes
# logs older than the retention period.
#
# Usage: ./rotate-logs.sh
#
# Environment Variables:
#   LOG_DIR          - Directory containing log files (default: /var/log/gorweld-backend)
#   ARCHIVE_DIR      - Directory for archived logs (default: $LOG_DIR/archive)
#   RETENTION_DAYS   - Number of days to keep archived logs (default: 30)
###############################################################################

set -e

# Configuration
LOG_DIR="${LOG_DIR:-/var/log/gorweld-backend}"
ARCHIVE_DIR="${ARCHIVE_DIR:-$LOG_DIR/archive}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if log directory exists
if [ ! -d "$LOG_DIR" ]; then
    log_error "Log directory not found: $LOG_DIR"
    exit 1
fi

# Create archive directory if it doesn't exist
if [ ! -d "$ARCHIVE_DIR" ]; then
    log_info "Creating archive directory: $ARCHIVE_DIR"
    mkdir -p "$ARCHIVE_DIR"
fi

log_info "Starting log rotation at $(date)"
log_info "Log directory: $LOG_DIR"
log_info "Archive directory: $ARCHIVE_DIR"
log_info "Retention period: $RETENTION_DAYS days"

# Rotate logs
rotated_count=0
for log_file in "$LOG_DIR"/*.log; do
    if [ -f "$log_file" ]; then
        filename=$(basename "$log_file" .log)
        archive_name="${filename}-${TIMESTAMP}.log.gz"
        archive_path="$ARCHIVE_DIR/$archive_name"
        
        # Check if log file is not empty
        if [ -s "$log_file" ]; then
            log_info "Rotating: $filename.log"
            
            # Compress and move to archive
            gzip -c "$log_file" > "$archive_path"
            
            if [ $? -eq 0 ]; then
                # Truncate original log file
                > "$log_file"
                log_info "  Archived to: $archive_name"
                rotated_count=$((rotated_count + 1))
            else
                log_error "  Failed to compress $log_file"
            fi
        else
            log_info "Skipping empty log: $filename.log"
        fi
    fi
done

log_info "Rotated $rotated_count log file(s)"

# Delete old archives
log_info "Removing archives older than $RETENTION_DAYS days"
deleted_count=$(find "$ARCHIVE_DIR" -name "*.log.gz" -mtime +$RETENTION_DAYS -type f | wc -l)

if [ "$deleted_count" -gt 0 ]; then
    find "$ARCHIVE_DIR" -name "*.log.gz" -mtime +$RETENTION_DAYS -type f -delete
    log_info "Deleted $deleted_count old archive(s)"
else
    log_info "No old archives to delete"
fi

# Calculate disk usage
log_dir_size=$(du -sh "$LOG_DIR" 2>/dev/null | cut -f1)
archive_dir_size=$(du -sh "$ARCHIVE_DIR" 2>/dev/null | cut -f1)

log_info "Current disk usage:"
log_info "  Log directory: $log_dir_size"
log_info "  Archive directory: $archive_dir_size"

# Reload PM2 logs if PM2 is running
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "gorweld-backend"; then
        log_info "Reloading PM2 logs"
        pm2 reloadLogs
    fi
fi

log_info "Log rotation completed at $(date)"

exit 0
