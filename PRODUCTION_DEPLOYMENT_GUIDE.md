# Gorweld Production Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [DNS Configuration](#dns-configuration)
9. [Verification](#verification)
10. [Troubleshooting](#troubleshooting)
11. [Rollback Procedures](#rollback-procedures)
12. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Overview

This guide provides step-by-step instructions for deploying the Gorweld platform to production. The system consists of:

- **Frontend**: React application deployed to GitHub Pages (https://gorweld.fun)
- **Backend**: Node.js/Express API server (https://api.gorweld.com)
- **Blockchain**: Solana Mainnet-Beta for payment verification

**Architecture**:
```
User Browser → Frontend (GitHub Pages) → Backend API → Solana Mainnet
```

## Prerequisites

Before starting deployment, ensure you have:

### Required Access
- [ ] GitHub repository access with push permissions
- [ ] Production server SSH access (for backend)
- [ ] Domain registrar access (for DNS configuration)
- [ ] SSL certificate provider access (Let's Encrypt or commercial CA)

### Required Software
- [ ] Node.js 18.x or higher
- [ ] npm 9.x or higher
- [ ] Git
- [ ] PM2 or systemd (for process management)
- [ ] Nginx or Apache (for reverse proxy)

### Required Information
- [ ] Solana treasury wallet addresses (2 wallets)
- [ ] Production server IP address
- [ ] Domain names (gorweld.fun, api.gorweld.com)
- [ ] Solana RPC endpoint (mainnet-beta)

---

## Backend Deployment

### Step 1: Prepare Production Server

1. **Connect to your production server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Update system packages**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install Node.js 18.x**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

4. **Verify installation**:
   ```bash
   node --version  # Should show v18.x.x
   npm --version   # Should show 9.x.x
   ```

5. **Install PM2 globally** (for process management):
   ```bash
   sudo npm install -g pm2
   ```

6. **Install Nginx** (for reverse proxy):
   ```bash
   sudo apt install -y nginx
   ```

### Step 2: Clone Repository

1. **Create application directory**:
   ```bash
   sudo mkdir -p /var/www/gorweld
   sudo chown $USER:$USER /var/www/gorweld
   cd /var/www/gorweld
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/DOGECOIN87/Gorweld.git .
   ```

3. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

### Step 3: Install Dependencies

```bash
npm install --production
```

**Note**: The `--production` flag skips devDependencies, reducing installation size.

### Step 4: Configure Environment Variables

1. **Create production `.env` file**:
   ```bash
   nano .env
   ```

2. **Add the following configuration** (replace with your actual values):
   ```env
   # Server Configuration
   NODE_ENV=production
   PORT=3000
   
   # Solana Configuration
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   WALLET_1_ADDRESS=BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt
   WALLET_2_ADDRESS=Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo
   
   # Database Configuration
   DATABASE_PATH=./data/gorweld.db
   
   # CORS Configuration
   ALLOWED_ORIGINS=https://gorweld.fun,https://www.gorweld.fun
   
   # Upload Configuration
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=20971520
   ```

3. **Save and exit** (Ctrl+X, then Y, then Enter)

4. **Verify configuration**:
   ```bash
   node verify-env-config.js
   ```

   Expected output:
   ```
   ✓ All required environment variables are present
   ✓ WALLET_1_ADDRESS is valid
   ✓ WALLET_2_ADDRESS is valid
   ✓ SOLANA_RPC_URL is accessible
   ✓ DATABASE_PATH directory exists and is writable
   ```

### Step 5: Initialize Database

1. **Create data directory**:
   ```bash
   mkdir -p data
   ```

2. **Set proper permissions**:
   ```bash
   chmod 755 data
   ```

3. **Initialize database** (automatic on first start):
   ```bash
   node server/index.js
   ```

   You should see:
   ```
   Database initialized successfully
   Server running on port 3000
   ```

4. **Stop the server** (Ctrl+C)

### Step 6: Start Application with PM2

1. **Create PM2 ecosystem file**:
   ```bash
   nano ecosystem.config.js
   ```

2. **Add configuration**:
   ```javascript
   module.exports = {
     apps: [{
       name: 'gorweld-api',
       script: './server/index.js',
       instances: 1,
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production'
       },
       error_file: './logs/pm2-error.log',
       out_file: './logs/pm2-out.log',
       log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
       merge_logs: true,
       autorestart: true,
       max_restarts: 10,
       min_uptime: '10s'
     }]
   };
   ```

3. **Create logs directory**:
   ```bash
   mkdir -p logs
   ```

4. **Start application**:
   ```bash
   pm2 start ecosystem.config.js
   ```

5. **Verify application is running**:
   ```bash
   pm2 status
   ```

   Expected output:
   ```
   ┌─────┬──────────────┬─────────┬─────────┬─────────┬──────────┐
   │ id  │ name         │ mode    │ ↺      │ status  │ cpu      │
   ├─────┼──────────────┼─────────┼─────────┼─────────┼──────────┤
   │ 0   │ gorweld-api  │ cluster │ 0       │ online  │ 0%       │
   └─────┴──────────────┴─────────┴─────────┴─────────┴──────────┘
   ```

6. **Save PM2 configuration** (auto-start on reboot):
   ```bash
   pm2 save
   pm2 startup
   ```

   Follow the instructions provided by the `pm2 startup` command.

7. **Test health endpoint**:
   ```bash
   curl http://localhost:3000/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-11-17T12:00:00.000Z",
     "environment": "production",
     "database": "connected",
     "solana": "connected",
     "uptime": 123
   }
   ```

### Step 7: Configure Nginx Reverse Proxy

1. **Create Nginx configuration**:
   ```bash
   sudo nano /etc/nginx/sites-available/gorweld-api
   ```

2. **Add configuration**:
   ```nginx
   server {
       listen 80;
       server_name api.gorweld.com;
   
       # Redirect HTTP to HTTPS (after SSL setup)
       # return 301 https://$server_name$request_uri;
   
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           
           # Timeouts
           proxy_connect_timeout 60s;
           proxy_send_timeout 60s;
           proxy_read_timeout 60s;
           
           # File upload size
           client_max_body_size 25M;
       }
   
       # Health check endpoint (no auth required)
       location /health {
           proxy_pass http://localhost:3000/health;
           access_log off;
       }
   }
   ```

3. **Enable the site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/gorweld-api /etc/nginx/sites-enabled/
   ```

4. **Test Nginx configuration**:
   ```bash
   sudo nginx -t
   ```

   Expected output:
   ```
   nginx: configuration file /etc/nginx/nginx.conf test is successful
   ```

5. **Restart Nginx**:
   ```bash
   sudo systemctl restart nginx
   ```

6. **Enable Nginx on boot**:
   ```bash
   sudo systemctl enable nginx
   ```

---

## Frontend Deployment

The frontend is automatically deployed via GitHub Actions when you push to the main branch.

### Step 1: Verify Production Configuration

1. **Check `Gorweld/config.production.js`**:
   ```bash
   cat Gorweld/config.production.js
   ```

   Verify it contains:
   ```javascript
   export default {
     api: {
       production: 'https://api.gorweld.com/api'
     },
     solana: {
       network: 'mainnet-beta',
       rpcUrl: 'https://api.mainnet-beta.solana.com',
       wallet1Address: 'BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt',
       wallet2Address: 'Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo',
       paymentAmount: 1
     }
   };
   ```

### Step 2: Verify GitHub Actions Workflow

1. **Check `.github/workflows/deploy.yml`** exists and is configured correctly

2. **Verify GitHub Pages settings**:
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: gh-pages / (root)
   - Custom domain: gorweld.fun

### Step 3: Deploy Frontend

1. **Commit any pending changes**:
   ```bash
   git add .
   git commit -m "Production deployment"
   ```

2. **Push to main branch**:
   ```bash
   git push origin main
   ```

3. **Monitor deployment**:
   - Go to GitHub repository → Actions tab
   - Watch the "Deploy to GitHub Pages" workflow
   - Wait for green checkmark (successful deployment)

4. **Verify deployment** (wait 2-3 minutes for DNS propagation):
   ```bash
   curl -I https://gorweld.fun
   ```

   Expected: `HTTP/2 200`

---

## Environment Configuration

### Backend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | Yes | Server port | `3000` |
| `SOLANA_RPC_URL` | Yes | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `WALLET_1_ADDRESS` | Yes | First treasury wallet | `BwwXgbiH...` |
| `WALLET_2_ADDRESS` | Yes | Second treasury wallet | `Hn1i7bLb...` |
| `DATABASE_PATH` | Yes | SQLite database path | `./data/gorweld.db` |
| `ALLOWED_ORIGINS` | Yes | CORS allowed origins | `https://gorweld.fun` |
| `UPLOAD_DIR` | Yes | Upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Yes | Max upload size (bytes) | `20971520` (20MB) |

### Environment Variable Validation

Run the validation script to ensure all variables are correctly configured:

```bash
cd backend
node verify-env-config.js
```

**Troubleshooting**:
- If validation fails, check `.env` file for typos
- Ensure no extra spaces around `=` signs
- Verify wallet addresses are valid Solana addresses (base58, 32-44 chars)
- Test RPC URL accessibility: `curl https://api.mainnet-beta.solana.com`

---

## Database Setup

### Database Schema

The application uses SQLite with two main tables:

**cards table**:
- Stores project card information
- Indexed on `wallet_address` and `created_at`
- Enforces unique `transaction_signature`

**transactions table**:
- Records verified Solana transactions
- Links to cards via foreign key
- Prevents duplicate transaction usage

### Initialization Process

The database is automatically initialized on first application start:

1. **Automatic initialization**:
   - Database file created at `DATABASE_PATH`
   - Tables created with proper schema
   - Indexes created for performance

2. **Verify database**:
   ```bash
   sqlite3 data/gorweld.db ".schema"
   ```

   Should show complete schema with tables and indexes.

### Database Migrations

Currently, the application uses a simple initialization approach. For future schema changes:

1. **Backup existing database** (see Backup section below)
2. **Update schema in `models/database.js`**
3. **Test migration on staging environment**
4. **Apply to production**

### Database Backup

**Manual backup**:
```bash
# Create backup directory
mkdir -p backups

# Backup with timestamp
cp data/gorweld.db backups/gorweld-$(date +%Y%m%d-%H%M%S).db
```

**Automated backup script** (add to crontab):
```bash
#!/bin/bash
# Save as: /var/www/gorweld/backend/scripts/backup-db.sh

BACKUP_DIR="/var/www/gorweld/backend/backups"
DB_PATH="/var/www/gorweld/backend/data/gorweld.db"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gorweld-$TIMESTAMP.db"

# Create backup
cp "$DB_PATH" "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "gorweld-*.db.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Schedule daily backups**:
```bash
chmod +x scripts/backup-db.sh
crontab -e
```

Add line:
```
0 2 * * * /var/www/gorweld/backend/scripts/backup-db.sh >> /var/www/gorweld/backend/logs/backup.log 2>&1
```

### Database Recovery

**Restore from backup**:
```bash
# Stop application
pm2 stop gorweld-api

# Backup current database (just in case)
cp data/gorweld.db data/gorweld-before-restore.db

# Restore from backup
gunzip -c backups/gorweld-20251117-020000.db.gz > data/gorweld.db

# Restart application
pm2 start gorweld-api

# Verify
curl http://localhost:3000/health
```

---

## SSL Certificate Setup

### Option 1: Let's Encrypt (Free, Recommended)

1. **Install Certbot**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Obtain certificate**:
   ```bash
   sudo certbot --nginx -d api.gorweld.com
   ```

3. **Follow prompts**:
   - Enter email address
   - Agree to Terms of Service
   - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

4. **Verify certificate**:
   ```bash
   sudo certbot certificates
   ```

5. **Test auto-renewal**:
   ```bash
   sudo certbot renew --dry-run
   ```

6. **Certificate auto-renewal** (already configured by Certbot):
   - Certificates automatically renewed before expiration
   - Check renewal timer: `sudo systemctl status certbot.timer`

### Option 2: Commercial SSL Certificate

1. **Generate CSR**:
   ```bash
   openssl req -new -newkey rsa:2048 -nodes \
     -keyout api.gorweld.com.key \
     -out api.gorweld.com.csr
   ```

2. **Submit CSR to certificate authority**

3. **Download certificate files**:
   - `api.gorweld.com.crt` (certificate)
   - `ca-bundle.crt` (intermediate certificates)

4. **Install certificate**:
   ```bash
   sudo mkdir -p /etc/ssl/gorweld
   sudo cp api.gorweld.com.key /etc/ssl/gorweld/
   sudo cp api.gorweld.com.crt /etc/ssl/gorweld/
   sudo cp ca-bundle.crt /etc/ssl/gorweld/
   sudo chmod 600 /etc/ssl/gorweld/*.key
   ```

5. **Update Nginx configuration**:
   ```bash
   sudo nano /etc/nginx/sites-available/gorweld-api
   ```

   Add SSL configuration:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name api.gorweld.com;
   
       ssl_certificate /etc/ssl/gorweld/api.gorweld.com.crt;
       ssl_certificate_key /etc/ssl/gorweld/api.gorweld.com.key;
       ssl_trusted_certificate /etc/ssl/gorweld/ca-bundle.crt;
   
       # SSL configuration
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
       ssl_prefer_server_ciphers on;
   
       # ... rest of configuration
   }
   
   server {
       listen 80;
       server_name api.gorweld.com;
       return 301 https://$server_name$request_uri;
   }
   ```

6. **Restart Nginx**:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Verify SSL Configuration

```bash
# Test SSL certificate
curl -I https://api.gorweld.com/health

# Check SSL details
openssl s_client -connect api.gorweld.com:443 -servername api.gorweld.com
```

---

## DNS Configuration

### Backend API (api.gorweld.com)

1. **Log in to your domain registrar** (e.g., Namecheap, GoDaddy, Cloudflare)

2. **Add A record**:
   ```
   Type: A
   Host: api
   Value: YOUR_SERVER_IP_ADDRESS
   TTL: 3600 (or Auto)
   ```

3. **Wait for DNS propagation** (5-30 minutes):
   ```bash
   # Check DNS resolution
   nslookup api.gorweld.com
   
   # Or use dig
   dig api.gorweld.com
   ```

4. **Verify resolution**:
   ```bash
   ping api.gorweld.com
   ```

   Should show your server IP address.

### Frontend (gorweld.fun)

1. **Configure GitHub Pages custom domain**:
   - Go to repository Settings → Pages
   - Enter custom domain: `gorweld.fun`
   - Check "Enforce HTTPS"

2. **Add DNS records at your registrar**:

   **Option A: Apex domain with A records** (recommended):
   ```
   Type: A
   Host: @
   Value: 185.199.108.153
   TTL: 3600
   
   Type: A
   Host: @
   Value: 185.199.109.153
   TTL: 3600
   
   Type: A
   Host: @
   Value: 185.199.110.153
   TTL: 3600
   
   Type: A
   Host: @
   Value: 185.199.111.153
   TTL: 3600
   ```

   **Option B: CNAME record** (if using www subdomain):
   ```
   Type: CNAME
   Host: www
   Value: DOGECOIN87.github.io
   TTL: 3600
   ```

3. **Verify CNAME file in repository**:
   ```bash
   cat Gorweld/CNAME
   ```

   Should contain: `gorweld.fun`

4. **Wait for DNS propagation and SSL provisioning** (up to 24 hours)

5. **Verify**:
   ```bash
   curl -I https://gorweld.fun
   ```

### DNS Troubleshooting

**Issue**: DNS not resolving
- **Solution**: Wait longer (up to 48 hours for full propagation)
- **Check**: Use `dig +trace gorweld.fun` to see propagation path

**Issue**: SSL certificate error on GitHub Pages
- **Solution**: Remove and re-add custom domain in GitHub settings
- **Wait**: 24 hours for GitHub to provision certificate

**Issue**: Mixed content warnings
- **Solution**: Ensure all resources use HTTPS URLs

---

## Verification

### Backend Verification

1. **Health check**:
   ```bash
   curl https://api.gorweld.com/health
   ```

   Expected:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-11-17T12:00:00.000Z",
     "environment": "production",
     "database": "connected",
     "solana": "connected"
   }
   ```

2. **CORS headers**:
   ```bash
   curl -I -X OPTIONS https://api.gorweld.com/api/cards \
     -H "Origin: https://gorweld.fun" \
     -H "Access-Control-Request-Method: GET"
   ```

   Should include:
   ```
   Access-Control-Allow-Origin: https://gorweld.fun
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   ```

3. **Get cards endpoint**:
   ```bash
   curl https://api.gorweld.com/api/cards
   ```

   Expected: JSON array of cards (may be empty initially)

4. **Run verification script**:
   ```bash
   node verify-deployment.js
   ```

### Frontend Verification

1. **Access website**:
   ```bash
   curl -I https://gorweld.fun
   ```

   Expected: `HTTP/2 200`

2. **Check SSL certificate**:
   - Visit https://gorweld.fun in browser
   - Click padlock icon
   - Verify certificate is valid

3. **Test API connectivity**:
   - Open browser console (F12)
   - Visit https://gorweld.fun
   - Check for API calls to https://api.gorweld.com
   - Verify no CORS errors

4. **Run frontend verification**:
   ```bash
   node verify-frontend-deployment.js
   ```

### End-to-End Verification

1. **Test complete flow**:
   - Visit https://gorweld.fun
   - Connect Solana wallet
   - Fill out project form
   - Upload media
   - Make payment (1 SOL to two wallets)
   - Submit card
   - Verify card appears on homepage

2. **Test transaction verification**:
   ```bash
   cd backend
   node test-transaction-verification.js YOUR_TRANSACTION_SIGNATURE
   ```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Backend not starting

**Symptoms**:
- PM2 shows status "errored" or "stopped"
- Application crashes immediately after start

**Diagnosis**:
```bash
pm2 logs gorweld-api --lines 50
```

**Common causes**:

1. **Missing environment variables**:
   ```bash
   node verify-env-config.js
   ```
   Fix: Add missing variables to `.env`

2. **Port already in use**:
   ```bash
   sudo lsof -i :3000
   ```
   Fix: Kill process or change PORT in `.env`

3. **Database permission error**:
   ```bash
   ls -la data/
   ```
   Fix: `chmod 755 data && chmod 644 data/gorweld.db`

4. **Node modules missing**:
   ```bash
   npm install
   ```

#### Issue: Cannot connect to Solana RPC

**Symptoms**:
- Transaction verification fails
- Health check shows "solana": "disconnected"

**Diagnosis**:
```bash
curl https://api.mainnet-beta.solana.com -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

**Solutions**:

1. **RPC endpoint down**:
   - Use alternative RPC: `https://solana-api.projectserum.com`
   - Consider paid RPC service (QuickNode, Alchemy)

2. **Rate limiting**:
   - Implement request caching
   - Use paid RPC tier with higher limits

3. **Firewall blocking**:
   ```bash
   sudo ufw allow out 443/tcp
   ```

#### Issue: Transaction verification fails

**Symptoms**:
- Valid transactions rejected
- Error: "TRANSACTION_NOT_FOUND"

**Diagnosis**:
```bash
cd backend
node test-transaction-verification.js YOUR_SIGNATURE
```

**Solutions**:

1. **Transaction not confirmed yet**:
   - Wait 30-60 seconds
   - Retry verification

2. **Wrong network**:
   - Verify transaction on correct network (mainnet-beta)
   - Check Solana Explorer: https://explorer.solana.com

3. **Incorrect wallet addresses**:
   - Verify WALLET_1_ADDRESS and WALLET_2_ADDRESS in `.env`
   - Check transaction recipients match treasury wallets

#### Issue: CORS errors in browser

**Symptoms**:
- Browser console shows CORS errors
- API requests fail from frontend

**Diagnosis**:
```bash
curl -I -X OPTIONS https://api.gorweld.com/api/cards \
  -H "Origin: https://gorweld.fun"
```

**Solutions**:

1. **Wrong origin in ALLOWED_ORIGINS**:
   - Update `.env`: `ALLOWED_ORIGINS=https://gorweld.fun`
   - Restart: `pm2 restart gorweld-api`

2. **Nginx not forwarding headers**:
   - Check Nginx config includes proxy headers
   - Restart: `sudo systemctl restart nginx`

#### Issue: File uploads failing

**Symptoms**:
- Upload returns 413 error
- Large files rejected

**Solutions**:

1. **Nginx client_max_body_size too small**:
   ```bash
   sudo nano /etc/nginx/sites-available/gorweld-api
   ```
   Add: `client_max_body_size 25M;`
   ```bash
   sudo systemctl restart nginx
   ```

2. **Upload directory not writable**:
   ```bash
   chmod 755 uploads
   ```

3. **Disk space full**:
   ```bash
   df -h
   ```
   Fix: Clean up old files or expand disk

#### Issue: Database locked error

**Symptoms**:
- Error: "database is locked"
- Writes fail intermittently

**Solutions**:

1. **Multiple processes accessing database**:
   ```bash
   pm2 list
   ```
   Ensure only one instance running

2. **Increase timeout**:
   - Edit `models/database.js`
   - Increase `busyTimeout` value

3. **Switch to PostgreSQL** (for high traffic):
   - Consider migration for production scale

#### Issue: SSL certificate errors

**Symptoms**:
- Browser shows "Not Secure"
- Certificate expired or invalid

**Solutions**:

1. **Let's Encrypt certificate expired**:
   ```bash
   sudo certbot renew
   sudo systemctl restart nginx
   ```

2. **Certificate not trusted**:
   - Verify intermediate certificates installed
   - Check certificate chain

3. **Wrong domain in certificate**:
   - Reissue certificate with correct domain
   ```bash
   sudo certbot --nginx -d api.gorweld.com
   ```

### Logging and Debugging

**View application logs**:
```bash
# PM2 logs
pm2 logs gorweld-api

# Application logs
tail -f logs/app.log

# Error logs only
tail -f logs/error.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**Enable debug logging**:
```bash
# Add to .env
DEBUG=*

# Restart
pm2 restart gorweld-api
```

**Check system resources**:
```bash
# CPU and memory
htop

# Disk space
df -h

# Disk I/O
iostat

# Network connections
netstat -tulpn
```

---

## Rollback Procedures

### Backend Rollback

#### Quick Rollback (Previous Version)

1. **Stop current application**:
   ```bash
   pm2 stop gorweld-api
   ```

2. **Checkout previous version**:
   ```bash
   cd /var/www/gorweld
   git log --oneline -10  # Find previous commit
   git checkout PREVIOUS_COMMIT_HASH
   ```

3. **Restore database backup** (if schema changed):
   ```bash
   cp backups/gorweld-TIMESTAMP.db data/gorweld.db
   ```

4. **Reinstall dependencies** (if package.json changed):
   ```bash
   cd backend
   npm install
   ```

5. **Restart application**:
   ```bash
   pm2 start gorweld-api
   ```

6. **Verify**:
   ```bash
   curl https://api.gorweld.com/health
   pm2 logs gorweld-api
   ```

#### Full Rollback (Clean State)

1. **Stop application**:
   ```bash
   pm2 stop gorweld-api
   pm2 delete gorweld-api
   ```

2. **Backup current state**:
   ```bash
   cd /var/www
   mv gorweld gorweld-backup-$(date +%Y%m%d-%H%M%S)
   ```

3. **Clone fresh repository**:
   ```bash
   git clone https://github.com/DOGECOIN87/Gorweld.git gorweld
   cd gorweld/backend
   ```

4. **Checkout stable version**:
   ```bash
   git checkout STABLE_TAG_OR_COMMIT
   ```

5. **Restore configuration**:
   ```bash
   cp /var/www/gorweld-backup-*/backend/.env .env
   ```

6. **Restore database**:
   ```bash
   mkdir -p data
   cp /var/www/gorweld-backup-*/backend/data/gorweld.db data/
   ```

7. **Install and start**:
   ```bash
   npm install --production
   pm2 start ecosystem.config.js
   ```

### Frontend Rollback

#### Rollback via GitHub

1. **Find previous working commit**:
   ```bash
   git log --oneline
   ```

2. **Revert to previous commit**:
   ```bash
   git revert COMMIT_HASH
   # Or
   git reset --hard PREVIOUS_COMMIT_HASH
   ```

3. **Force push** (triggers redeployment):
   ```bash
   git push origin main --force
   ```

4. **Monitor GitHub Actions** for redeployment

#### Manual Rollback

1. **Download previous build artifact** from GitHub Actions

2. **Extract and push to gh-pages branch**:
   ```bash
   git checkout gh-pages
   # Replace files with previous version
   git add .
   git commit -m "Rollback to previous version"
   git push origin gh-pages
   ```

### Rollback Checklist

- [ ] Identify issue and decide rollback is necessary
- [ ] Notify team/users of rollback
- [ ] Stop current application
- [ ] Backup current state (code + database)
- [ ] Restore previous version
- [ ] Restore database if needed
- [ ] Test rolled-back version
- [ ] Monitor logs for errors
- [ ] Verify end-to-end functionality
- [ ] Document rollback reason and resolution

---

## Monitoring and Maintenance

### Daily Monitoring

**Automated health checks**:
```bash
# Add to crontab
*/5 * * * * curl -f https://api.gorweld.com/health || echo "API down" | mail -s "Gorweld API Alert" admin@example.com
```

**Check application status**:
```bash
pm2 status
pm2 monit  # Real-time monitoring
```

**Review logs**:
```bash
# Check for errors
grep -i error logs/app.log | tail -20

# Check critical errors
node scripts/check-critical-errors.js
```

### Weekly Maintenance

1. **Review error logs**:
   ```bash
   node scripts/analyze-logs.js
   ```

2. **Check disk space**:
   ```bash
   df -h
   du -sh uploads/
   du -sh data/
   ```

3. **Verify backups**:
   ```bash
   ls -lh backups/ | tail -10
   ```

4. **Update dependencies** (security patches):
   ```bash
   npm audit
   npm audit fix
   ```

5. **Restart application** (clear memory leaks):
   ```bash
   pm2 restart gorweld-api
   ```

### Monthly Maintenance

1. **Update system packages**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Rotate logs**:
   ```bash
   ./scripts/rotate-logs.sh
   ```

3. **Clean old uploads** (if needed):
   ```bash
   find uploads/ -mtime +90 -type f -delete
   ```

4. **Review SSL certificate expiration**:
   ```bash
   sudo certbot certificates
   ```

5. **Database optimization**:
   ```bash
   sqlite3 data/gorweld.db "VACUUM;"
   sqlite3 data/gorweld.db "ANALYZE;"
   ```

6. **Performance review**:
   - Check API response times
   - Review database query performance
   - Monitor RPC call latency

### Monitoring Tools

**Recommended tools**:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry, Rollbar
- **Log aggregation**: Papertrail, Loggly
- **Performance monitoring**: New Relic, Datadog
- **Server monitoring**: Netdata, Prometheus + Grafana

**Setup example (UptimeRobot)**:
1. Create monitor for https://api.gorweld.com/health
2. Set check interval: 5 minutes
3. Configure alerts via email/SMS
4. Monitor response time trends

### Performance Optimization

**Backend optimizations**:
- Enable gzip compression in Nginx
- Implement Redis caching for card listings
- Use connection pooling for database
- Optimize database indexes
- Consider CDN for uploaded media

**Frontend optimizations**:
- Enable GitHub Pages CDN
- Optimize images (WebP format)
- Implement lazy loading
- Minimize bundle size
- Use service worker for caching

---

## Security Best Practices

### Server Security

1. **Firewall configuration**:
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **SSH hardening**:
   - Disable root login
   - Use SSH keys only
   - Change default SSH port
   - Install fail2ban

3. **Keep system updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

### Application Security

1. **Environment variables**:
   - Never commit `.env` to repository
   - Use strong, unique values
   - Rotate credentials regularly

2. **Dependencies**:
   ```bash
   npm audit
   npm audit fix
   ```

3. **Rate limiting** (future enhancement):
   - Implement rate limiting on API endpoints
   - Protect against DDoS attacks

4. **Input validation**:
   - Already implemented in middleware
   - Regularly review validation rules

5. **HTTPS only**:
   - Enforce HTTPS on all endpoints
   - Use HSTS headers

---

## Support and Resources

### Documentation
- Backend README: `backend/README.md`
- API Documentation: `backend/docs/`
- Logging Guide: `backend/docs/LOGGING_AND_MONITORING.md`

### Verification Scripts
- Environment config: `backend/verify-env-config.js`
- Deployment verification: `verify-deployment.js`
- Frontend verification: `verify-frontend-deployment.js`
- Transaction testing: `backend/test-transaction-verification.js`

### External Resources
- Solana Documentation: https://docs.solana.com
- Solana Explorer: https://explorer.solana.com
- GitHub Pages Docs: https://docs.github.com/pages
- Let's Encrypt: https://letsencrypt.org
- PM2 Documentation: https://pm2.keymetrics.io

### Getting Help

**Check logs first**:
```bash
pm2 logs gorweld-api --lines 100
```

**Run diagnostics**:
```bash
node verify-env-config.js
node verify-deployment.js
curl https://api.gorweld.com/health
```

**Common commands**:
```bash
# Restart application
pm2 restart gorweld-api

# View logs
pm2 logs gorweld-api

# Check status
pm2 status

# Monitor resources
pm2 monit
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All code changes committed and pushed
- [ ] Tests passing locally
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] SSL certificates valid
- [ ] DNS records configured

### Backend Deployment
- [ ] Server prepared and updated
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment configured
- [ ] Database initialized
- [ ] PM2 configured and started
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Health check passing

### Frontend Deployment
- [ ] Production config verified
- [ ] GitHub Actions workflow configured
- [ ] Pushed to main branch
- [ ] Deployment successful
- [ ] HTTPS enabled
- [ ] Custom domain working

### Post-Deployment
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] CORS working
- [ ] Transaction verification working
- [ ] End-to-end flow tested
- [ ] Monitoring configured
- [ ] Team notified

---

**Deployment completed successfully!** 🎉

For issues or questions, refer to the Troubleshooting section or check the logs.
