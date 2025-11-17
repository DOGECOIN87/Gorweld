#!/bin/bash

# Deployment Verification Script
# This script verifies that the backend API is properly deployed and functioning

set -e

# Configuration
API_URL="${1:-https://api.gorweld.com}"
HEALTH_ENDPOINT="$API_URL/health"
CARDS_ENDPOINT="$API_URL/api/cards"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

ERRORS=0

echo "🔍 Verifying Gorweld Backend Deployment"
echo "API URL: $API_URL"
echo ""

# 1. Check if server is running (PM2)
print_header "PM2 Process Status"
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "gorweld-backend"; then
        print_status "PM2 process is running"
        pm2 info gorweld-backend | grep -E "status|uptime|restarts"
    else
        print_error "PM2 process not found"
        ((ERRORS++))
    fi
else
    print_warning "PM2 not installed or not in PATH"
fi

# 2. Check Nginx status
print_header "Nginx Status"
if command -v nginx &> /dev/null; then
    if systemctl is-active --quiet nginx; then
        print_status "Nginx is running"
    else
        print_error "Nginx is not running"
        ((ERRORS++))
    fi
    
    # Check Nginx configuration
    if nginx -t 2>&1 | grep -q "successful"; then
        print_status "Nginx configuration is valid"
    else
        print_error "Nginx configuration has errors"
        ((ERRORS++))
    fi
else
    print_warning "Nginx not installed or not in PATH"
fi

# 3. Check SSL certificate
print_header "SSL Certificate"
if command -v openssl &> /dev/null; then
    DOMAIN=$(echo "$API_URL" | sed -e 's|^https://||' -e 's|/.*||')
    if echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | grep -q "Verify return code: 0"; then
        print_status "SSL certificate is valid"
        
        # Check expiration
        EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
        echo "   Expires: $EXPIRY"
    else
        print_warning "SSL certificate verification failed or not using HTTPS"
    fi
else
    print_warning "OpenSSL not available for certificate check"
fi

# 4. Test health endpoint
print_header "Health Endpoint"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_ENDPOINT" 2>/dev/null || echo "000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_status "Health endpoint responding (HTTP $HTTP_CODE)"
    echo "   Response: $RESPONSE_BODY"
else
    print_error "Health endpoint failed (HTTP $HTTP_CODE)"
    ((ERRORS++))
fi

# 5. Test cards endpoint
print_header "Cards API Endpoint"
CARDS_RESPONSE=$(curl -s -w "\n%{http_code}" "$CARDS_ENDPOINT" 2>/dev/null || echo "000")
HTTP_CODE=$(echo "$CARDS_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    print_status "Cards endpoint responding (HTTP $HTTP_CODE)"
    CARD_COUNT=$(echo "$CARDS_RESPONSE" | head -n-1 | grep -o '\[' | wc -l)
    echo "   Cards returned: $CARD_COUNT"
else
    print_error "Cards endpoint failed (HTTP $HTTP_CODE)"
    ((ERRORS++))
fi

# 6. Check database
print_header "Database"
DB_PATH="/var/www/gorweld-backend/data/cards.db"
if [ -f "$DB_PATH" ]; then
    print_status "Database file exists"
    DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
    echo "   Size: $DB_SIZE"
    
    # Check database integrity
    if sqlite3 "$DB_PATH" "PRAGMA integrity_check;" 2>/dev/null | grep -q "ok"; then
        print_status "Database integrity check passed"
    else
        print_error "Database integrity check failed"
        ((ERRORS++))
    fi
else
    print_error "Database file not found at $DB_PATH"
    ((ERRORS++))
fi

# 7. Check logs
print_header "Logs"
LOG_DIR="/var/www/gorweld-backend/logs"
if [ -d "$LOG_DIR" ]; then
    print_status "Log directory exists"
    
    # Check for recent errors
    if [ -f "$LOG_DIR/pm2-error.log" ]; then
        ERROR_COUNT=$(tail -n 100 "$LOG_DIR/pm2-error.log" 2>/dev/null | grep -i error | wc -l)
        if [ "$ERROR_COUNT" -gt 0 ]; then
            print_warning "Found $ERROR_COUNT recent errors in logs"
        else
            print_status "No recent errors in logs"
        fi
    fi
else
    print_warning "Log directory not found"
fi

# 8. Check backups
print_header "Database Backups"
BACKUP_DIR="/var/backups/gorweld-backend/database"
if [ -d "$BACKUP_DIR" ]; then
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "*.db.gz" -type f | wc -l)
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        print_status "Found $BACKUP_COUNT database backups"
        LATEST_BACKUP=$(find "$BACKUP_DIR" -name "*.db.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        BACKUP_AGE=$(find "$LATEST_BACKUP" -mtime +1 2>/dev/null && echo "older than 1 day" || echo "recent")
        echo "   Latest backup: $(basename "$LATEST_BACKUP") ($BACKUP_AGE)"
    else
        print_warning "No database backups found"
    fi
else
    print_warning "Backup directory not found"
fi

# 9. Check environment configuration
print_header "Environment Configuration"
ENV_FILE="/var/www/gorweld-backend/.env"
if [ -f "$ENV_FILE" ]; then
    print_status "Environment file exists"
    
    # Check critical variables (without exposing values)
    if grep -q "TREASURY_WALLET_ADDRESS=YOUR_" "$ENV_FILE"; then
        print_error "Treasury wallet address not configured!"
        ((ERRORS++))
    else
        print_status "Treasury wallet address configured"
    fi
    
    if grep -q "NODE_ENV=production" "$ENV_FILE"; then
        print_status "Running in production mode"
    else
        print_warning "Not running in production mode"
    fi
else
    print_error "Environment file not found"
    ((ERRORS++))
fi

# 10. Check uploads directory
print_header "Uploads Directory"
UPLOADS_DIR="/var/www/gorweld-backend/uploads"
if [ -d "$UPLOADS_DIR" ]; then
    print_status "Uploads directory exists"
    UPLOAD_COUNT=$(find "$UPLOADS_DIR" -type f | wc -l)
    echo "   Files: $UPLOAD_COUNT"
    
    # Check permissions
    if [ -w "$UPLOADS_DIR" ]; then
        print_status "Uploads directory is writable"
    else
        print_error "Uploads directory is not writable"
        ((ERRORS++))
    fi
else
    print_error "Uploads directory not found"
    ((ERRORS++))
fi

# Summary
echo ""
print_header "Verification Summary"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Deployment is healthy.${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS error(s). Please review the issues above.${NC}"
    exit 1
fi
