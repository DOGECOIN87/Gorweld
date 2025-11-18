# Post-Deployment Monitoring Plan
## Gorweld Platform - Solana Mainnet

**Version:** 1.0  
**Date:** November 18, 2025  
**Status:** Active

---

## 1. Overview

This document outlines the monitoring strategy for the Gorweld platform after production deployment to Solana mainnet. It defines monitoring schedules, alert thresholds, response procedures, and maintenance tasks.

---

## 2. Monitoring Schedule

### 2.1 Automated Monitoring (24/7)

#### Health Checks
**Frequency:** Every 5 minutes  
**Tool:** Uptime monitoring service (UptimeRobot, Pingdom, or custom)

**Endpoints to Monitor:**
- `https://gorweld.fun` - Frontend availability
- `https://api.gorweld.com/health` - Backend health
- `https://api.mainnet-beta.solana.com` - RPC availability

**Expected Response:**
- Status Code: 200
- Response Time: <500ms
- Health Status: "ok"

#### Log Monitoring
**Frequency:** Every 15 minutes  
**Script:** `backend/scripts/check-critical-errors.js`

**Checks:**
- Database connection errors
- RPC connection failures
- Transaction verification failures
- Unhandled exceptions

### 2.2 Daily Monitoring

#### Morning Check (9:00 AM)
- [ ] Review overnight error logs
- [ ] Check API response times
- [ ] Verify frontend accessibility
- [ ] Monitor treasury wallet balances
- [ ] Check disk space usage
- [ ] Verify backup completion

#### Evening Check (6:00 PM)
- [ ] Review day's transaction logs
- [ ] Check for unusual traffic patterns
- [ ] Analyze error rates
- [ ] Review system performance metrics
- [ ] Check database size growth

### 2.3 Weekly Monitoring

#### Every Monday
- [ ] Review transaction verification logs
- [ ] Analyze API usage patterns
- [ ] Check database performance
- [ ] Review uploaded media storage
- [ ] Security audit of logs
- [ ] Performance optimization review
- [ ] Update monitoring dashboard

### 2.4 Monthly Monitoring

#### First Monday of Month
- [ ] Update dependencies (security patches)
- [ ] Review security advisories
- [ ] Audit treasury wallet balances
- [ ] Performance optimization review
- [ ] Test backup restoration
- [ ] Disaster recovery drill
- [ ] Review and update documentation

---

## 3. Alert Thresholds

### 3.1 Critical Alerts (Immediate Response Required)

**Health Endpoint Down**
- Threshold: Down for >5 minutes
- Action: Investigate and restart backend if needed
- Escalation: If not resolved in 15 minutes

**Database Connection Failure**
- Threshold: Any database connection error
- Action: Check database status, restart if needed
- Escalation: If not resolved in 10 minutes

**RPC Connection Failure**
- Threshold: >3 consecutive failures
- Action: Check RPC endpoint, switch to backup if available
- Escalation: If not resolved in 15 minutes

**Disk Space Critical**
- Threshold: >90% full
- Action: Clean up old logs, rotate backups
- Escalation: If not resolved in 30 minutes

**SSL Certificate Expiring**
- Threshold: <7 days until expiration
- Action: Renew SSL certificate immediately
- Escalation: If not renewed in 24 hours

### 3.2 Warning Alerts (Review Within 24 Hours)

**High Error Rate**
- Threshold: >5% of requests returning errors
- Action: Review error logs, identify patterns
- Response Time: Within 4 hours

**Slow API Response**
- Threshold: Average response time >2 seconds
- Action: Check database queries, optimize if needed
- Response Time: Within 8 hours

**RPC Rate Limit Warnings**
- Threshold: >10 rate limit errors per hour
- Action: Consider upgrading RPC service
- Response Time: Within 24 hours

**Disk Space Warning**
- Threshold: >80% full
- Action: Plan cleanup or storage expansion
- Response Time: Within 24 hours

**Unusual Traffic Patterns**
- Threshold: >200% increase in traffic
- Action: Check for DDoS or abuse
- Response Time: Within 2 hours

---

## 4. Monitoring Tools and Commands

### 4.1 Health Check
```bash
# Check backend health
curl https://api.gorweld.com/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-11-18T...",
#   "environment": "production",
#   "uptime": 12345,
#   "database": { "status": "healthy" },
#   "solana": { "status": "healthy", "endpoint": "...", "slot": 123456 }
# }
```

### 4.2 Log Analysis
```bash
# Check for critical errors
cd backend
node scripts/check-critical-errors.js

# Analyze error patterns
node scripts/analyze-logs.js

# View recent errors
tail -n 100 logs/error.log
```

### 4.3 Database Monitoring
```bash
# Check database size
du -h data/cards.db

# Verify backup
node backend/scripts/verify-backup.js backups/latest-backup.db.gz

# Check card count
sqlite3 data/cards.db "SELECT COUNT(*) FROM cards;"
```

### 4.4 System Resources
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top -bn1 | head -20

# Check process status
pm2 status  # or systemctl status gorweld-backend
```

---

## 5. Response Procedures

### 5.1 Backend Down

**Symptoms:**
- Health endpoint not responding
- API requests failing
- Frontend shows connection errors

**Response Steps:**
1. Check if process is running: `pm2 status` or `systemctl status gorweld-backend`
2. Check error logs: `tail -n 100 backend/logs/error.log`
3. Restart backend: `pm2 restart gorweld-backend` or `systemctl restart gorweld-backend`
4. Verify health: `curl https://api.gorweld.com/health`
5. Monitor for 10 minutes to ensure stability
6. Document incident and root cause

**Escalation:**
If restart doesn't resolve:
1. Check database connectivity
2. Check RPC connectivity
3. Review recent code changes
4. Consider rollback if recent deployment

### 5.2 Database Issues

**Symptoms:**
- Database connection errors in logs
- Card submission failures
- Slow query performance

**Response Steps:**
1. Check database file exists: `ls -lh data/cards.db`
2. Check disk space: `df -h`
3. Check database integrity: `sqlite3 data/cards.db "PRAGMA integrity_check;"`
4. If corrupted, restore from backup: `node backend/scripts/restore-database.js`
5. Restart backend after restoration
6. Verify functionality with test submission

**Prevention:**
- Automated backups every 6 hours
- Keep 7 days of backups
- Regular integrity checks

### 5.3 RPC Connection Issues

**Symptoms:**
- Transaction verification failures
- RPC timeout errors in logs
- "RATE_LIMIT" errors

**Response Steps:**
1. Check RPC endpoint: `curl https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'`
2. If rate limited, wait and retry
3. If down, check Solana status page
4. Consider switching to backup RPC endpoint
5. Update SOLANA_RPC_URL environment variable if needed
6. Restart backend

**Long-term Solution:**
- Upgrade to paid RPC service (QuickNode, Alchemy)
- Implement RPC endpoint failover
- Add request caching where possible

### 5.4 High Error Rate

**Symptoms:**
- Increased error logs
- User reports of failures
- Monitoring alerts

**Response Steps:**
1. Run log analysis: `node backend/scripts/analyze-logs.js`
2. Identify error patterns
3. Check for common error types:
   - Validation errors (user input issues)
   - Transaction verification errors (RPC issues)
   - Database errors (connection/query issues)
4. Address root cause based on error type
5. Monitor error rate for improvement
6. Communicate with users if widespread issue

### 5.5 Storage Full

**Symptoms:**
- Disk space >90% full
- Write errors in logs
- Backup failures

**Response Steps:**
1. Identify large files: `du -h backend/ | sort -rh | head -20`
2. Rotate logs: `bash backend/scripts/rotate-logs.sh`
3. Clean old backups: Keep only last 7 days
4. Archive old media if needed
5. Consider storage expansion
6. Update monitoring thresholds

---

## 6. Maintenance Tasks

### 6.1 Daily Maintenance

**Automated (via cron):**
```bash
# Backup database (every 6 hours)
0 */6 * * * cd /path/to/backend && node scripts/backup-database.js

# Check critical errors (every 15 minutes)
*/15 * * * * cd /path/to/backend && node scripts/check-critical-errors.js

# Rotate logs (daily at 2 AM)
0 2 * * * cd /path/to/backend && bash scripts/rotate-logs.sh
```

**Manual:**
- Review error logs
- Check system health
- Monitor treasury balances

### 6.2 Weekly Maintenance

**Every Monday:**
```bash
# Analyze logs
cd backend
node scripts/analyze-logs.js

# Verify latest backup
node scripts/verify-backup.js backups/latest-backup.db.gz

# Check database size and performance
sqlite3 data/cards.db "PRAGMA optimize;"
```

### 6.3 Monthly Maintenance

**First Monday:**
```bash
# Update dependencies
cd backend
npm audit
npm update

# Test backup restoration
node scripts/restore-database.js backups/test-restore.db.gz --test

# Review and clean old backups
find backups/ -name "*.db.gz" -mtime +30 -delete
```

---

## 7. Performance Metrics

### 7.1 Key Performance Indicators (KPIs)

**Availability:**
- Target: 99.9% uptime
- Measurement: Uptime monitoring service
- Review: Weekly

**Response Time:**
- Target: <500ms average
- Measurement: Health endpoint monitoring
- Review: Daily

**Error Rate:**
- Target: <1% of requests
- Measurement: Log analysis
- Review: Daily

**Transaction Success Rate:**
- Target: >95% (excluding user errors)
- Measurement: Transaction verification logs
- Review: Weekly

### 7.2 Capacity Metrics

**Database Size:**
- Current: Monitor growth rate
- Alert: When approaching storage limits
- Action: Plan for scaling

**Media Storage:**
- Current: Monitor upload volume
- Alert: When >80% of allocated space
- Action: Implement cleanup or expansion

**API Request Volume:**
- Current: Track requests per day
- Alert: Unusual spikes (>200% increase)
- Action: Investigate and scale if needed

---

## 8. Incident Response

### 8.1 Incident Severity Levels

**P0 - Critical (Immediate Response)**
- Complete service outage
- Data loss or corruption
- Security breach
- Response Time: <15 minutes

**P1 - High (Urgent Response)**
- Partial service degradation
- High error rates (>10%)
- Performance issues affecting users
- Response Time: <1 hour

**P2 - Medium (Standard Response)**
- Minor service issues
- Moderate error rates (5-10%)
- Non-critical feature failures
- Response Time: <4 hours

**P3 - Low (Scheduled Response)**
- Cosmetic issues
- Low error rates (<5%)
- Enhancement requests
- Response Time: <24 hours

### 8.2 Incident Documentation

**For Each Incident, Document:**
1. Date and time of incident
2. Severity level
3. Symptoms observed
4. Root cause analysis
5. Resolution steps taken
6. Time to resolution
7. Preventive measures
8. Lessons learned

**Incident Log Location:** `/incidents/YYYY-MM-DD-incident-name.md`

---

## 9. Escalation Procedures

### 9.1 Escalation Path

**Level 1: Automated Monitoring**
- Automated alerts via monitoring tools
- Immediate notification of critical issues

**Level 2: On-Call Engineer**
- Responds to automated alerts
- Performs initial troubleshooting
- Escalates if needed

**Level 3: Senior Engineer**
- Complex issues requiring deep expertise
- Architecture or design decisions
- Major incidents

**Level 4: Management**
- Business-critical decisions
- External communication
- Resource allocation

### 9.2 Escalation Triggers

**Escalate to Level 3 if:**
- Issue not resolved within 30 minutes
- Root cause unclear
- Requires code changes
- Affects multiple systems

**Escalate to Level 4 if:**
- Extended outage (>2 hours)
- Data loss or security breach
- Requires external communication
- Significant financial impact

---

## 10. Communication Plan

### 10.1 Internal Communication

**During Incidents:**
- Use dedicated incident channel
- Regular status updates every 30 minutes
- Document all actions taken
- Post-mortem after resolution

**Regular Updates:**
- Weekly status report
- Monthly performance review
- Quarterly planning sessions

### 10.2 External Communication

**Status Page:**
- Update status page for major incidents
- Provide estimated resolution time
- Post-incident summary

**User Communication:**
- Email notifications for extended outages
- Social media updates if applicable
- In-app notifications for service issues

---

## 11. Continuous Improvement

### 11.1 Monthly Review

**Review Topics:**
- Incident frequency and severity
- Response time metrics
- System performance trends
- User feedback
- Monitoring effectiveness

**Action Items:**
- Update alert thresholds
- Improve response procedures
- Enhance monitoring coverage
- Optimize system performance

### 11.2 Quarterly Planning

**Planning Topics:**
- Capacity planning
- Infrastructure upgrades
- Feature enhancements
- Security improvements
- Cost optimization

---

## 12. Monitoring Dashboard

### 12.1 Key Metrics to Display

**System Health:**
- Frontend uptime (%)
- Backend uptime (%)
- RPC connectivity status
- Database status

**Performance:**
- Average response time
- Request volume (per hour)
- Error rate (%)
- Transaction success rate (%)

**Resources:**
- Disk space usage (%)
- Memory usage (%)
- CPU usage (%)
- Database size (MB)

**Business Metrics:**
- Total cards submitted
- Cards submitted today
- Total transactions processed
- Treasury wallet balances

### 12.2 Dashboard Tools

**Options:**
- Grafana + Prometheus (self-hosted)
- Datadog (SaaS)
- New Relic (SaaS)
- Custom dashboard (Node.js + Chart.js)

---

## 13. Backup and Recovery Monitoring

### 13.1 Backup Verification

**Daily Checks:**
- Verify backup completed successfully
- Check backup file size (should be consistent)
- Verify backup compression
- Test backup integrity

**Weekly Checks:**
- Test backup restoration
- Verify data integrity after restore
- Document restoration time
- Update recovery procedures if needed

### 13.2 Recovery Time Objectives (RTO)

**Database Recovery:**
- Target RTO: <30 minutes
- Maximum acceptable: 1 hour

**Full System Recovery:**
- Target RTO: <2 hours
- Maximum acceptable: 4 hours

---

## 14. Security Monitoring

### 14.1 Security Checks

**Daily:**
- Review authentication logs
- Check for unusual access patterns
- Monitor failed login attempts
- Review API abuse patterns

**Weekly:**
- Security log analysis
- Dependency vulnerability scan
- SSL certificate status
- Firewall rule review

**Monthly:**
- Full security audit
- Penetration testing (if applicable)
- Access control review
- Incident response drill

### 14.2 Security Alerts

**Immediate Action Required:**
- Multiple failed authentication attempts
- Unusual API access patterns
- SQL injection attempts
- DDoS attack indicators
- SSL certificate issues

---

## 15. Documentation Maintenance

### 15.1 Keep Updated

**This Document:**
- Review monthly
- Update after major incidents
- Incorporate lessons learned
- Add new procedures as needed

**Related Documentation:**
- Deployment guides
- API documentation
- Troubleshooting guides
- Runbooks

### 15.2 Documentation Locations

- Monitoring Plan: `/POST_DEPLOYMENT_MONITORING_PLAN.md`
- Incident Logs: `/incidents/`
- Runbooks: `/backend/docs/runbooks/`
- Performance Reports: `/reports/performance/`

---

## Appendix A: Quick Reference Commands

### Health Checks
```bash
# Backend health
curl https://api.gorweld.com/health

# Frontend check
curl -I https://gorweld.fun

# RPC check
curl https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

### Log Analysis
```bash
# Critical errors
node backend/scripts/check-critical-errors.js

# Error analysis
node backend/scripts/analyze-logs.js

# Recent errors
tail -n 100 backend/logs/error.log

# Search for specific error
grep "TRANSACTION_NOT_FOUND" backend/logs/error.log
```

### Database Operations
```bash
# Backup
node backend/scripts/backup-database.js

# Verify backup
node backend/scripts/verify-backup.js backups/latest.db.gz

# Restore
node backend/scripts/restore-database.js backups/latest.db.gz

# Check integrity
sqlite3 data/cards.db "PRAGMA integrity_check;"
```

### System Monitoring
```bash
# Disk space
df -h

# Memory
free -h

# CPU
top -bn1 | head -20

# Process status
pm2 status
```

---

## Appendix B: Contact Information

### On-Call Rotation
- Primary: [Contact Info]
- Secondary: [Contact Info]
- Escalation: [Contact Info]

### External Services
- Hosting Provider: [Contact/Support]
- Domain Registrar: [Contact/Support]
- SSL Certificate: [Contact/Support]
- RPC Provider: [Contact/Support]

---

**Document Version:** 1.0  
**Last Updated:** November 18, 2025  
**Next Review:** December 18, 2025  
**Owner:** Platform Operations Team

**END OF MONITORING PLAN**
