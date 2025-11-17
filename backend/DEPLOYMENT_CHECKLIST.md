# Gorweld Backend Deployment Checklist

Use this checklist to ensure all deployment steps are completed correctly.

## Pre-Deployment

- [ ] Server provisioned (VPS/Cloud with minimum 1GB RAM)
- [ ] Domain name configured and DNS pointing to server
- [ ] SSH access configured with key-based authentication
- [ ] Firewall rules configured (ports 22, 80, 443)
- [ ] Node.js 16+ installed
- [ ] Git installed
- [ ] Treasury wallet address ready for production

## Initial Setup

- [ ] Clone/copy application files to server
- [ ] Install dependencies: `npm install --production`
- [ ] Create necessary directories (data, logs, uploads)
- [ ] Set proper file permissions (www-data:www-data)
- [ ] Configure `.env` file with production values
- [ ] Verify treasury wallet address in `.env`
- [ ] Update CORS allowed origins in `.env`

## Web Server Configuration

- [ ] Nginx installed
- [ ] Nginx configuration copied to `/etc/nginx/sites-available/`
- [ ] Symbolic link created in `/etc/nginx/sites-enabled/`
- [ ] Nginx configuration tested: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`

## SSL Certificate

- [ ] Certbot installed
- [ ] SSL certificate obtained: `sudo ./ssl-setup.sh`
- [ ] Certificate auto-renewal verified
- [ ] HTTPS working correctly
- [ ] HTTP to HTTPS redirect working

## Application Deployment

- [ ] PM2 installed globally: `sudo npm install -g pm2`
- [ ] Application started: `pm2 start ecosystem.config.js --env production`
- [ ] PM2 configuration saved: `pm2 save`
- [ ] PM2 startup script configured: `pm2 startup systemd`
- [ ] Application accessible via domain

## Database Setup

- [ ] SQLite3 installed
- [ ] Database initialized automatically on first start
- [ ] Database file exists at configured path
- [ ] Database integrity verified
- [ ] Database permissions correct

## Monitoring and Logging

- [ ] Monitoring setup script executed: `sudo ./monitoring-setup.sh`
- [ ] Log rotation configured
- [ ] Health check cron job active
- [ ] PM2 monitoring configured
- [ ] Status dashboard accessible: `gorweld-status.sh`

## Backup Configuration

- [ ] Backup script tested: `sudo ./backup-db.sh`
- [ ] Backup cron job configured (daily at 2 AM)
- [ ] Backup directory created
- [ ] Backup retention policy configured (30 days)
- [ ] Test backup restoration process

## API Verification

- [ ] Health endpoint responding: `curl https://api.gorweld.com/health`
- [ ] Cards endpoint responding: `curl https://api.gorweld.com/api/cards`
- [ ] Upload endpoint accessible
- [ ] CORS headers correct
- [ ] Error responses formatted correctly

## Security Verification

- [ ] Environment variables secured (proper permissions)
- [ ] No sensitive data in logs
- [ ] SSL certificate valid and trusted
- [ ] Security headers configured in Nginx
- [ ] Rate limiting configured (if needed)
- [ ] Firewall rules verified
- [ ] SSH root login disabled
- [ ] SSH password authentication disabled

## Performance Testing

- [ ] Load test API endpoints
- [ ] Verify response times acceptable
- [ ] Check memory usage under load
- [ ] Verify PM2 cluster mode working
- [ ] Test file upload performance
- [ ] Verify database query performance

## Deployment Verification

Run the verification script:
```bash
sudo ./verify-deployment.sh https://api.gorweld.com
```

- [ ] All verification checks pass
- [ ] No errors in PM2 logs
- [ ] No errors in Nginx logs
- [ ] No errors in application logs

## Post-Deployment

- [ ] Update frontend with production API URL
- [ ] Test complete submission flow from frontend
- [ ] Test wallet connection on production
- [ ] Test payment processing on mainnet
- [ ] Verify cards display correctly
- [ ] Test card editing functionality

## Documentation

- [ ] Deployment documentation reviewed
- [ ] Team notified of deployment
- [ ] API documentation updated
- [ ] Monitoring dashboard access shared
- [ ] Emergency contact information documented

## Rollback Plan

- [ ] Previous version backup available
- [ ] Rollback procedure documented
- [ ] Database backup before deployment
- [ ] Quick rollback tested

## Ongoing Maintenance

- [ ] Monitor logs daily for first week
- [ ] Check backup success daily
- [ ] Review error rates
- [ ] Monitor disk space usage
- [ ] Review SSL certificate expiration
- [ ] Plan for updates and patches

## Emergency Contacts

- Server Provider: _______________
- Domain Registrar: _______________
- System Administrator: _______________
- Developer Contact: _______________

## Notes

Date Deployed: _______________
Deployed By: _______________
Version/Commit: _______________

Additional Notes:
_________________________________
_________________________________
_________________________________
