#!/bin/bash

# Gorweld Backend Deployment Script
# This script automates the deployment process for the backend API

set -e  # Exit on error

echo "🚀 Starting Gorweld Backend Deployment..."

# Configuration
DEPLOY_DIR="/var/www/gorweld-backend"
BACKUP_DIR="/var/backups/gorweld-backend"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run with sudo"
    exit 1
fi

# Create deployment directory if it doesn't exist
if [ ! -d "$DEPLOY_DIR" ]; then
    print_status "Creating deployment directory..."
    mkdir -p "$DEPLOY_DIR"
fi

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    print_status "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
fi

# Backup existing deployment
if [ -d "$DEPLOY_DIR/server" ]; then
    print_status "Backing up existing deployment..."
    tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$DEPLOY_DIR" . 2>/dev/null || true
    print_status "Backup created: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
fi

# Copy files to deployment directory
print_status "Copying files to deployment directory..."
rsync -av --exclude='node_modules' --exclude='data' --exclude='logs' --exclude='.git' \
    ./ "$DEPLOY_DIR/"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p "$DEPLOY_DIR/data"
mkdir -p "$DEPLOY_DIR/logs"
mkdir -p "$DEPLOY_DIR/uploads"

# Set proper permissions
print_status "Setting permissions..."
chown -R www-data:www-data "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"
chmod 644 "$DEPLOY_DIR/.env.production"

# Install dependencies
print_status "Installing dependencies..."
cd "$DEPLOY_DIR"
npm install --production

# Copy production environment file
if [ -f "$DEPLOY_DIR/.env.production" ]; then
    print_status "Setting up production environment..."
    cp "$DEPLOY_DIR/.env.production" "$DEPLOY_DIR/.env"
else
    print_warning "No .env.production file found. Please configure manually."
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
fi

# Stop existing PM2 process
print_status "Stopping existing PM2 process..."
pm2 stop gorweld-backend 2>/dev/null || true
pm2 delete gorweld-backend 2>/dev/null || true

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup systemd -u www-data --hp /var/www

# Configure Nginx if not already done
if [ ! -f "/etc/nginx/sites-available/gorweld-backend" ]; then
    print_status "Setting up Nginx configuration..."
    cp "$DEPLOY_DIR/nginx.conf" /etc/nginx/sites-available/gorweld-backend
    ln -sf /etc/nginx/sites-available/gorweld-backend /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    print_status "Nginx configured and reloaded"
else
    print_warning "Nginx configuration already exists. Skipping..."
fi

# Display status
print_status "Deployment completed successfully!"
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "🔗 API Endpoints:"
echo "   Health Check: https://api.gorweld.com/health"
echo "   Cards API: https://api.gorweld.com/api/cards"
echo ""
echo "📝 Logs:"
echo "   PM2 Logs: pm2 logs gorweld-backend"
echo "   Nginx Access: /var/log/nginx/gorweld-backend-access.log"
echo "   Nginx Error: /var/log/nginx/gorweld-backend-error.log"
echo ""
print_warning "Don't forget to:"
echo "   1. Update .env with your actual treasury wallet address"
echo "   2. Set up SSL certificate with certbot"
echo "   3. Configure database backups"
