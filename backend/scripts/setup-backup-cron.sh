#!/bin/bash

# Setup Backup Cron Job Script
# Configures automated database backups using cron

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database.js"

echo "=== Setup Backup Cron Job ==="
echo ""
echo "This script will help you configure automated database backups."
echo ""

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "✗ Backup script not found: $BACKUP_SCRIPT"
    exit 1
fi

echo "Backup script: $BACKUP_SCRIPT"
echo ""
echo "Available schedules:"
echo "  1. Daily at 2:00 AM"
echo "  2. Every 12 hours"
echo "  3. Every 6 hours"
echo "  4. Custom schedule"
echo ""

read -p "Select schedule (1-4): " choice

case $choice in
    1)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="Daily at 2:00 AM"
        ;;
    2)
        CRON_SCHEDULE="0 */12 * * *"
        DESCRIPTION="Every 12 hours"
        ;;
    3)
        CRON_SCHEDULE="0 */6 * * *"
        DESCRIPTION="Every 6 hours"
        ;;
    4)
        echo ""
        echo "Enter cron schedule (e.g., '0 2 * * *' for daily at 2 AM):"
        read -p "Schedule: " CRON_SCHEDULE
        DESCRIPTION="Custom: $CRON_SCHEDULE"
        ;;
    *)
        echo "✗ Invalid choice"
        exit 1
        ;;
esac

# Create cron job entry
CRON_JOB="$CRON_SCHEDULE cd $(dirname $SCRIPT_DIR) && /usr/bin/node $BACKUP_SCRIPT >> logs/backup.log 2>&1"

echo ""
echo "Cron job to be added:"
echo "  Schedule: $DESCRIPTION"
echo "  Command: $CRON_JOB"
echo ""

read -p "Add this cron job? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Setup cancelled"
    exit 0
fi

# Add to crontab
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo ""
echo "✓ Cron job added successfully"
echo ""
echo "To view your cron jobs: crontab -l"
echo "To remove this job: crontab -e"
echo ""
