# Deployment Verification Guide

This document describes how to verify the Gorweld platform deployment using the provided verification scripts.

## Overview

The deployment verification scripts test all critical endpoints and configurations to ensure the platform is production-ready. Two versions are provided:

1. **verify-deployment.sh** - Bash script (Linux/macOS)
2. **verify-deployment.js** - Node.js script (cross-platform)

Both scripts perform the same tests and provide detailed pass/fail results.

## Prerequisites

### For Bash Script (verify-deployment.sh)

Required:
- `curl` - HTTP client
- `bash` - Shell interpreter

Optional (for enhanced testing):
- `jq` - JSON processor
- `openssl` - SSL certificate validation

### For Node.js Script (verify-deployment.js)

Required:
- Node.js 14+ installed

No additional dependencies needed (uses built-in Node.js modules).

## Usage

### Basic Usage

Run against default production URLs:

```bash
# Using bash script
./verify-deployment.sh

# Using Node.js script
node verify-deployment.js
```

### Custom URLs

Test against different environments:

```bash
# Using bash script
BACKEND_URL=https://staging-api.gorweld.com FRONTEND_URL=https://staging.gorweld.fun ./verify-deployment.sh

# Using Node.js script
BACKEND_URL=https://staging-api.gorweld.com FRONTEND_URL=https://staging.gorweld.fun node verify-deployment.js
```

### Local Testing

Test against local development server:

```bash
# Using Node.js script
BACKEND_URL=http://localhost:3000 FRONTEND_URL=http://localhost:5173 node verify-deployment.js
```

## Tests Performed

### 1. Backend Health Endpoint
- **Endpoint**: `GET /health`
- **Checks**:
  - Endpoint is accessible (HTTP 200 or 503)
  - Returns valid JSON
  - Includes required fields: status, timestamp
  - Includes system checks for database and Solana RPC
  - Reports system health status

### 2. Get Cards Endpoint
- **Endpoint**: `GET /api/cards`
- **Checks**:
  - Endpoint is accessible (HTTP 200)
  - Returns valid JSON
  - Returns array format
  - Card objects have required fields (name, subtitle, description, url)
  - Reports number of cards

### 3. Upload Endpoint
- **Endpoint**: `POST /api/upload`
- **Checks**:
  - Endpoint is accessible
  - Accepts multipart/form-data
  - Handles file uploads correctly
  - Returns file URLs in response
  - Validates file types and sizes

### 4. CORS Headers
- **Endpoint**: `GET /health` (with Origin header)
- **Checks**:
  - Access-Control-Allow-Origin header is present
  - Allows requests from gorweld.fun origin
  - CORS configuration is correct

### 5. Backend SSL Certificate
- **Domain**: api.gorweld.com
- **Checks**:
  - SSL certificate is present
  - Certificate is valid (not expired)
  - Reports expiration date and days remaining
  - Certificate matches domain

### 6. Frontend Accessibility
- **URL**: https://gorweld.fun
- **Checks**:
  - Frontend is accessible (HTTP 200)
  - Returns HTML content
  - Uses HTTPS protocol
  - Page loads correctly

### 7. Frontend SSL Certificate
- **Domain**: gorweld.fun
- **Checks**:
  - SSL certificate is present
  - Certificate is valid (not expired)
  - Reports expiration date and days remaining

## Output Format

The scripts provide color-coded output:

- ✓ **Green** - Test passed
- ✗ **Red** - Test failed
- ℹ **Blue** - Informational message
- **Yellow** - Section headers

### Example Output

```
========================================
Test 1: Backend Health Endpoint
========================================
ℹ Testing GET https://api.gorweld.com/health
✓ Health endpoint is accessible
✓ Health endpoint returns valid JSON
✓ Health response includes status field
ℹ Status: ok
✓ Health response includes timestamp
✓ Health response includes system checks
ℹ Database status: healthy
ℹ Solana RPC status: healthy

========================================
Test Summary
========================================
Total Tests: 25
Passed: 25
Failed: 0

✓ All deployment verification tests passed!
The system appears to be production-ready.
```

## Exit Codes

- **0** - All tests passed
- **1** - One or more tests failed

This allows integration with CI/CD pipelines:

```bash
./verify-deployment.sh && echo "Deployment verified!" || echo "Deployment failed!"
```

## Troubleshooting

### Common Issues

#### "curl: command not found"
Install curl:
```bash
# Ubuntu/Debian
sudo apt-get install curl

# macOS
brew install curl
```

#### "jq: command not found"
Install jq (optional but recommended):
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

#### "Connection refused"
- Verify the backend server is running
- Check firewall settings
- Ensure correct URL is specified

#### "SSL certificate errors"
- Check if the domain has a valid SSL certificate
- Verify DNS is configured correctly
- Ensure the certificate hasn't expired

#### "CORS errors"
- Verify ALLOWED_ORIGINS environment variable in backend
- Check that gorweld.fun is in the allowed origins list
- Ensure CORS middleware is properly configured

### Testing Specific Components

To test only specific endpoints, you can modify the scripts or use curl directly:

```bash
# Test health endpoint
curl -i https://api.gorweld.com/health

# Test cards endpoint
curl -i https://api.gorweld.com/api/cards

# Test CORS
curl -i -H "Origin: https://gorweld.fun" https://api.gorweld.com/health

# Test SSL certificate
openssl s_client -servername api.gorweld.com -connect api.gorweld.com:443 </dev/null 2>/dev/null | openssl x509 -noout -dates
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Verify Deployment

on:
  deployment_status:

jobs:
  verify:
    runs-on: ubuntu-latest
    if: github.event.deployment_status.state == 'success'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Run deployment verification
        run: node verify-deployment.js
        env:
          BACKEND_URL: https://api.gorweld.com
          FRONTEND_URL: https://gorweld.fun
```

## Maintenance

### Regular Checks

Run the verification script:
- After each deployment
- Daily (automated via cron/scheduled task)
- Before major releases
- After infrastructure changes

### Monitoring SSL Certificates

The scripts report SSL certificate expiration. Set up alerts when certificates have less than 30 days remaining:

```bash
# Add to crontab for daily checks
0 9 * * * /path/to/verify-deployment.sh | grep -i "days remaining" | mail -s "SSL Certificate Status" admin@example.com
```

## Related Documentation

- [Requirements Document](.kiro/specs/solana-mainnet-deployment/requirements.md)
- [Design Document](.kiro/specs/solana-mainnet-deployment/design.md)
- [Implementation Tasks](.kiro/specs/solana-mainnet-deployment/tasks.md)
- [Backend README](backend/README.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the test output for specific error messages
3. Verify environment configuration
4. Check backend logs for detailed error information
