#!/bin/bash

# SSL Certificate Setup Script using Let's Encrypt
# This script automates SSL certificate installation for the Gorweld Backend API

set -e

# Configuration
DOMAIN="api.gorweld.com"
EMAIL="admin@gorweld.com"  # Change this to your email

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run with sudo"
    exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    print_status "Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    print_error "Nginx is not installed. Please install Nginx first."
    exit 1
fi

# Create directory for Let's Encrypt challenges
mkdir -p /var/www/certbot

# Obtain SSL certificate
print_status "Obtaining SSL certificate for $DOMAIN..."
certbot certonly --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --quiet

# Check if certificate was obtained successfully
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    print_status "SSL certificate obtained successfully!"
    
    # Test Nginx configuration
    print_status "Testing Nginx configuration..."
    nginx -t
    
    # Reload Nginx
    print_status "Reloading Nginx..."
    systemctl reload nginx
    
    print_status "SSL setup completed!"
    echo ""
    echo "📜 Certificate Details:"
    certbot certificates -d "$DOMAIN"
    echo ""
    print_warning "Certificate will auto-renew. Certbot renewal timer is active."
    
else
    print_error "Failed to obtain SSL certificate"
    exit 1
fi

# Setup auto-renewal (certbot usually does this automatically)
print_status "Verifying certbot renewal timer..."
systemctl status certbot.timer --no-pager || print_warning "Certbot timer not found. Manual renewal may be required."

echo ""
echo "✅ SSL setup completed successfully!"
echo ""
echo "🔒 Your API is now accessible at: https://$DOMAIN"
