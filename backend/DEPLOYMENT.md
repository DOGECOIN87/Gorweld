# Gorweld Backend Deployment Guide

This guide provides step-by-step instructions for deploying the Gorweld backend API to a production server.

## Prerequisites

- Ubuntu/Debian VPS or cloud server (minimum 1GB RAM)
- Domain name pointing to your server (e.g., api.gorweld.com)
- Root or sudo access
- Node.js 16+ installed
- Git installed

## Quick Start

For automated deployment, run:

```bash
sudo ./deploy.sh
```

This will handle most of the setup automatically. Then follow the manual steps below for SSL and backups.

## Manual Deployment Steps

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install SQLite3
sudo apt install -y sqlite3

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Clone and Setup Application

```bash
# Create deployment directory
sudo mkdir -p /var/www/gorweld-backend
cd /var/www/gorweld-backend

# Clone repository (or copy files)
# git clone <your-repo-url> .

# Install dependencies
npm install --production

# Create necessary directories
mkdir -p data logs uploads

# Set permissions
sudo chown -R www-data:www-data /var/www/gorweld-backend
sudo chmod -R 755 /var/www/gorweld-backend
```

### 3. Configure Environment

```bash
# Copy production environment file
cp .env.production .env

# Edit environment variables
nano .env
```

Update the following in `.env`:
- `TREASURY_WALLET_ADDRESS`: Your actual Solana wallet address
- `BASE_URL`: Your production API URL
- `ALLOWED_ORIGINS`: Your frontend domain(s)

### 4. Configure Nginx

```bash
# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/gorweld-backend

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/gorweld-backend /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5. Setup SSL Certificate

```bash
# Run SSL setup script
sudo ./ssl-setup.sh
```

Or manually with certbot:

```bash
sudo certbot --nginx -d api.gorweld.com
```

### 6. Start Application with PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
```

### 7. Configure Database Backups

```bash
# Test backup script
sudo ./backup-db.sh

# Add to crontab for daily backups at 2 AM
sudo crontab -e
```

Add this line:
```
0 2 * * * /var/www/gorweld-backend/backup-db.sh >> /var/log/gorweld-backup.log 2>&1
```

## Verification

### Check Application Status

```bash
# PM2 status
pm2 status

# View logs
pm2 logs gorweld-backend

# Check Nginx status
sudo systemctl status nginx

# Test health endpoint
curl https://api.gorweld.com/health
```

### Test API Endpoints

```bash
# Health check
curl https://api.gorweld.com/health

# Get cards
curl https://api.gorweld.com/api/cards

# Check uploads directory
curl https://api.gorweld.com/uploads/
```

## Monitoring and Maintenance

### View Logs

```bash
# PM2 logs
pm2 logs gorweld-backend

# Nginx access logs
sudo tail -f /var/log/nginx/gorweld-backend-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/gorweld-backend-error.log

# Application logs
tail -f /var/www/gorweld-backend/logs/app.log
```

### PM2 Commands

```bash
# Restart application
pm2 restart gorweld-backend

# Stop application
pm2 stop gorweld-backend

# View detailed info
pm2 info gorweld-backend

# Monitor resources
pm2 monit
```

### Database Management

```bash
# Manual backup
sudo ./backup-db.sh

# Restore from backup
gunzip -c /var/backups/gorweld-backend/database/cards_db_TIMESTAMP.db.gz > /var/www/gorweld-backend/data/cards.db

# View database
sqlite3 /var/www/gorweld-backend/data/cards.db
```

## Updating the Application

```bash
# Pull latest changes
cd /var/www/gorweld-backend
git pull

# Install new dependencies
npm install --production

# Restart application
pm2 restart gorweld-backend
```

Or use the deployment script:

```bash
sudo ./deploy.sh
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs gorweld-backend --lines 100

# Check environment variables
cat .env

# Verify database exists
ls -la data/cards.db

# Check permissions
ls -la /var/www/gorweld-backend
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Database Issues

```bash
# Check database integrity
sqlite3 /var/www/gorweld-backend/data/cards.db "PRAGMA integrity_check;"

# Restore from backup
sudo ./backup-db.sh
```

## Security Checklist

- [ ] Firewall configured (allow only 80, 443, 22)
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] SSL certificate installed and auto-renewal configured
- [ ] Environment variables secured (proper file permissions)
- [ ] Database backups automated
- [ ] PM2 startup script configured
- [ ] Nginx security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting implemented (if needed)

## Performance Optimization

### Enable Nginx Caching

Add to Nginx configuration:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

location /api/cards {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
}
```

### PM2 Cluster Mode

The ecosystem.config.js is already configured for cluster mode with 2 instances. Adjust based on your server resources.

## Support

For issues or questions:
- Check logs first
- Review this documentation
- Contact system administrator

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
