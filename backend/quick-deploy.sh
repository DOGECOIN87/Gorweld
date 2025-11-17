#!/bin/bash

# Quick Deploy Script for Gorweld Backend
# This script provides an interactive deployment wizard

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
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

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run with sudo"
    exit 1
fi

print_header "Gorweld Backend Quick Deploy Wizard"

echo "This script will guide you through deploying the Gorweld backend API."
echo ""

# Gather configuration
read -p "Enter your domain name (e.g., api.gorweld.com): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL
read -p "Enter your Solana treasury wallet address: " TREASURY_ADDRESS
read -p "Enter frontend domain for CORS (e.g., https://gorweld.com): " FRONTEND_DOMAIN

echo ""
print_header "Configuration Summary"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Treasury: $TREASURY_ADDRESS"
echo "Frontend: $FRONTEND_DOMAIN"
echo ""

read -p "Is this correct? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Start deployment
print_header "Starting Deployment"

# 1. Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# 2. Install dependencies
print_status "Installing dependencies..."
apt install -y curl git nginx sqlite3

# 3. Install Node.js if not installed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
else
    print_status "Node.js already installed ($(node -v))"
fi

# 4. Install PM2
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
else
    print_status "PM2 already installed"
fi

# 5. Create deployment directory
DEPLOY_DIR="/var/www/gorweld-backend"
print_status "Creating deployment directory..."
mkdir -p "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/data"
mkdir -p "$DEPLOY_DIR/logs"
mkdir -p "$DEPLOY_DIR/uploads"

# 6. Copy files
print_status "Copying application files..."
rsync -av --exclude='node_modules' --exclude='data' --exclude='logs' --exclude='.git' \
    ./ "$DEPLOY_DIR/"

# 7. Install dependencies
print_status "Installing Node.js dependencies..."
cd "$DEPLOY_DIR"
npm install --production

# 8. Configure environment
print_status "Configuring environment..."
cat > "$DEPLOY_DIR/.env" << EOF
# Production Environment Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
TREASURY_WALLET_ADDRESS=$TREASURY_ADDRESS
PORT=3000
NODE_ENV=production
BASE_URL=https://$DOMAIN
DATABASE_PATH=/var/www/gorweld-backend/data/cards.db
ALLOWED_ORIGINS=$FRONTEND_DOMAIN
LOG_LEVEL=info
LOG_FILE=/var/www/gorweld-backend/logs/app.log
EOF

# 9. Set permissions
print_status "Setting permissions..."
chown -R www-data:www-data "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"
chmod 644 "$DEPLOY_DIR/.env"

# 10. Configure Nginx
print_status "Configuring Nginx..."
sed "s/api.gorweld.com/$DOMAIN/g" "$DEPLOY_DIR/nginx.conf" > /etc/nginx/sites-available/gorweld-backend
ln -sf /etc/nginx/sites-available/gorweld-backend /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# 11. Install SSL certificate
print_status "Installing SSL certificate..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

mkdir -p /var/www/certbot

# Reload Nginx first
systemctl reload nginx

# Get certificate
certbot certonly --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive || print_warning "SSL certificate installation failed. You may need to configure DNS first."

# 12. Start application
print_status "Starting application..."
cd "$DEPLOY_DIR"
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u www-data --hp /var/www

# 13. Reload Nginx with SSL
systemctl reload nginx

# 14. Setup monitoring
print_status "Setting up monitoring..."
./monitoring-setup.sh

# 15. Create initial backup
print_status "Creating initial backup..."
./backup-db.sh

# Deployment complete
print_header "Deployment Complete!"

echo ""
echo "✅ Your Gorweld backend is now deployed!"
echo ""
echo "🔗 API URL: https://$DOMAIN"
echo "🏥 Health Check: https://$DOMAIN/health"
echo "📊 Cards API: https://$DOMAIN/api/cards"
echo ""
echo "📝 Next Steps:"
echo "   1. Test the API: curl https://$DOMAIN/health"
echo "   2. Check status: gorweld-status.sh"
echo "   3. View logs: pm2 logs gorweld-backend"
echo "   4. Update frontend with API URL: https://$DOMAIN"
echo ""
echo "📚 Documentation:"
echo "   - Deployment Guide: $DEPLOY_DIR/DEPLOYMENT.md"
echo "   - Deployment Checklist: $DEPLOY_DIR/DEPLOYMENT_CHECKLIST.md"
echo ""

# Run verification
print_status "Running deployment verification..."
sleep 5
./verify-deployment.sh "https://$DOMAIN" || print_warning "Some verification checks failed. Please review."

echo ""
echo "🎉 Deployment wizard completed!"
