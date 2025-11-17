#!/bin/bash

# Monitoring and Logging Setup Script
# This script configures monitoring and logging for the Gorweld backend

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

echo "📊 Setting up monitoring and logging for Gorweld Backend..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run with sudo"
    exit 1
fi

# 1. Setup log rotation
print_status "Configuring log rotation..."
cat > /etc/logrotate.d/gorweld-backend << 'EOF'
/var/www/gorweld-backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/gorweld-backend-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1
    endscript
}
EOF

print_status "Log rotation configured"

# 2. Setup PM2 monitoring
print_status "Configuring PM2 monitoring..."
pm2 install pm2-logrotate 2>/dev/null || print_warning "pm2-logrotate already installed"

# Configure pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

print_status "PM2 monitoring configured"

# 3. Create monitoring script
print_status "Creating health check monitoring script..."
cat > /usr/local/bin/gorweld-health-check.sh << 'EOF'
#!/bin/bash

# Health check script for monitoring
API_URL="https://api.gorweld.com"
LOG_FILE="/var/log/gorweld-health-check.log"

# Check health endpoint
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>&1)

if [ "$RESPONSE" != "200" ]; then
    echo "$(date): Health check failed - HTTP $RESPONSE" >> "$LOG_FILE"
    
    # Attempt to restart if unhealthy
    pm2 restart gorweld-backend
    echo "$(date): Attempted restart of gorweld-backend" >> "$LOG_FILE"
    
    # Optional: Send alert (configure with your notification service)
    # curl -X POST "https://your-notification-service.com/alert" \
    #     -d "message=Gorweld backend health check failed"
else
    echo "$(date): Health check passed" >> "$LOG_FILE"
fi
EOF

chmod +x /usr/local/bin/gorweld-health-check.sh
print_status "Health check script created"

# 4. Setup cron jobs
print_status "Setting up cron jobs..."

# Create cron file
cat > /tmp/gorweld-cron << 'EOF'
# Database backup - Daily at 2 AM
0 2 * * * /var/www/gorweld-backend/backup-db.sh >> /var/log/gorweld-backup.log 2>&1

# Health check - Every 5 minutes
*/5 * * * * /usr/local/bin/gorweld-health-check.sh

# Clean old logs - Weekly on Sunday at 3 AM
0 3 * * 0 find /var/www/gorweld-backend/logs -name "*.log" -mtime +30 -delete

# Clean old backups - Weekly on Sunday at 4 AM
0 4 * * 0 find /var/backups/gorweld-backend -name "*.db.gz" -mtime +30 -delete
EOF

# Install cron jobs
crontab -u root /tmp/gorweld-cron
rm /tmp/gorweld-cron

print_status "Cron jobs configured"

# 5. Create monitoring dashboard script
print_status "Creating monitoring dashboard script..."
cat > /usr/local/bin/gorweld-status.sh << 'EOF'
#!/bin/bash

# Gorweld Backend Status Dashboard

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Gorweld Backend Status Dashboard                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# PM2 Status
echo "📊 PM2 Process Status:"
pm2 list | grep gorweld-backend || echo "   Process not found"
echo ""

# System Resources
echo "💻 System Resources:"
echo "   CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')% used"
echo "   Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "   Disk: $(df -h /var/www/gorweld-backend | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')"
echo ""

# API Health
echo "🏥 API Health:"
HEALTH=$(curl -s https://api.gorweld.com/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   Status: ✓ Healthy"
    echo "   Response: $HEALTH"
else
    echo "   Status: ✗ Unhealthy"
fi
echo ""

# Database
echo "💾 Database:"
DB_PATH="/var/www/gorweld-backend/data/cards.db"
if [ -f "$DB_PATH" ]; then
    DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
    CARD_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM cards;" 2>/dev/null || echo "N/A")
    echo "   Size: $DB_SIZE"
    echo "   Cards: $CARD_COUNT"
else
    echo "   Status: ✗ Not found"
fi
echo ""

# Recent Logs
echo "📝 Recent Errors (last 10):"
tail -n 10 /var/www/gorweld-backend/logs/pm2-error.log 2>/dev/null | grep -i error || echo "   No recent errors"
echo ""

# Backups
echo "💾 Latest Backup:"
LATEST_BACKUP=$(find /var/backups/gorweld-backend/database -name "*.db.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
if [ -n "$LATEST_BACKUP" ]; then
    echo "   File: $(basename "$LATEST_BACKUP")"
    echo "   Date: $(stat -c %y "$LATEST_BACKUP" | cut -d'.' -f1)"
else
    echo "   No backups found"
fi
echo ""

# Uptime
echo "⏱️  Uptime:"
uptime -p
echo ""
EOF

chmod +x /usr/local/bin/gorweld-status.sh
print_status "Monitoring dashboard created"

# 6. Test monitoring setup
print_status "Testing monitoring setup..."

# Test log rotation
logrotate -f /etc/logrotate.d/gorweld-backend 2>/dev/null || print_warning "Log rotation test skipped"

# Test health check
/usr/local/bin/gorweld-health-check.sh 2>/dev/null || print_warning "Health check test skipped"

print_status "Monitoring setup completed!"

echo ""
echo "✅ Monitoring and logging configured successfully!"
echo ""
echo "📊 Available commands:"
echo "   gorweld-status.sh          - View status dashboard"
echo "   gorweld-health-check.sh    - Run manual health check"
echo "   pm2 logs gorweld-backend   - View application logs"
echo "   pm2 monit                  - Monitor resources"
echo ""
echo "📝 Log locations:"
echo "   Application: /var/www/gorweld-backend/logs/"
echo "   Nginx: /var/log/nginx/gorweld-backend-*.log"
echo "   Health checks: /var/log/gorweld-health-check.log"
echo "   Backups: /var/log/gorweld-backup.log"
