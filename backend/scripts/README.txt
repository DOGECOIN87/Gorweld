BACKEND SCRIPTS ORGANIZATION
============================

Root Scripts (backend/scripts/):
- analyze-logs.js          - Analyze application logs
- backup-database.js       - Database backup utility
- check-critical-errors.js - Check logs for critical errors
- restore-database.js      - Database restore utility
- rotate-logs.js           - Log rotation utility
- setup-backup-cron.sh     - Setup automated backups
- verify-backup.js         - Verify backup integrity
- verify-env-config.js     - Verify environment configuration

tests/:
- run-api-tests.sh                      - Run all API tests
- test-api-comprehensive.js             - Comprehensive API tests
- test-backup-recovery.js               - Backup/recovery tests
- test-card-update-authorization.js     - Card update auth tests
- test-health-endpoint.js               - Health endpoint tests
- test-transaction-edge-cases.js        - Transaction edge case tests
- test-transaction-verification.js      - Transaction verification tests

examples/:
- example-test-transaction.sh - Example transaction test
- example-verify-usage.sh     - Example verification usage
