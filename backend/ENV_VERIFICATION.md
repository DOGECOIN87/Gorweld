# Environment Configuration Verification

## Overview

The `verify-env-config.js` script validates all required environment variables and system configuration before starting the Gorweld backend server. This ensures that the deployment is properly configured and reduces runtime errors.

## Requirements Addressed

- **6.1**: Load all configuration values from environment variables
- **6.2**: Use NODE_ENV value "production" in production mode
- **6.3**: Do not expose sensitive credentials in configuration files
- **6.5**: Log clear error messages for missing environment variables

## Usage

### Running the Script

```bash
# Using npm script (recommended)
npm run verify-env

# Or directly with node
node verify-env-config.js
```

### Exit Codes

- `0`: All required checks passed, system is ready
- `1`: One or more required checks failed, fix errors before starting

## Validation Checks

### 1. Wallet Address Validation

**Checks performed:**
- ✓ `WALLET_1_ADDRESS` environment variable is present
- ✓ `WALLET_1_ADDRESS` is a valid Solana address format
- ✓ `WALLET_2_ADDRESS` environment variable is present
- ✓ `WALLET_2_ADDRESS` is a valid Solana address format
- ✓ Both wallet addresses are different (warning if identical)

**Expected values (mainnet):**
```bash
WALLET_1_ADDRESS=BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt
WALLET_2_ADDRESS=Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo
```

### 2. Solana RPC Validation

**Checks performed:**
- ✓ `SOLANA_RPC_URL` environment variable is present
- ✓ `SOLANA_RPC_URL` is a valid URL format
- ✓ RPC endpoint is accessible (network connectivity test)
- ✓ RPC endpoint responds to health checks (getVersion call)
- ✓ RPC endpoint can fetch blockchain data (getLatestBlockhash call)

**Expected value (mainnet):**
```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

**Note:** The script performs actual network calls to verify RPC connectivity. This may take a few seconds.

### 3. Database Path Validation

**Checks performed:**
- ✓ `DATABASE_PATH` environment variable is present
- ✓ Database directory exists (creates if missing)
- ✓ Database directory is writable
- ✓ Database file permissions (if file exists)

**Expected value:**
```bash
DATABASE_PATH=./data/cards.db
```

**Note:** The script will create the database directory if it doesn't exist.

### 4. Other Environment Variables

**Optional variables checked:**
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (default: development)
- `ALLOWED_ORIGINS`: CORS allowed origins (default: all origins)

## Example Output

### Successful Validation

```
╔════════════════════════════════════════════════════════════╗
║  Gorweld Backend Environment Configuration Verification   ║
╚════════════════════════════════════════════════════════════╝

============================================================
  Wallet Address Validation
============================================================
✓ WALLET_1_ADDRESS
  Value: BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt
✓ WALLET_1_ADDRESS format
  Valid Solana address
✓ WALLET_2_ADDRESS
  Value: Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo
✓ WALLET_2_ADDRESS format
  Valid Solana address
✓ Wallet addresses are different

============================================================
  Solana RPC Validation
============================================================
✓ SOLANA_RPC_URL
  Value: https://api.mainnet-beta.solana.com
✓ SOLANA_RPC_URL format
  Valid URL format

Testing RPC connectivity...
✓ RPC connectivity
  Connected successfully (Solana version: 1.18.0)
✓ RPC health check
  Latest blockhash: 8xKz3...

============================================================
  Database Configuration Validation
============================================================
✓ DATABASE_PATH
  Value: ./data/cards.db
✓ Database directory exists
  Directory: ./data
✓ Database directory writable
✓ Database file
  Existing database: ./data/cards.db
✓ Database file permissions

============================================================
  Other Environment Variables
============================================================
✓ PORT
  Port: 3000
✓ NODE_ENV
  Environment: production
  ⚠️  Running in PRODUCTION mode
✓ ALLOWED_ORIGINS
  2 origin(s) configured
    - https://gorweld.fun
    - https://www.gorweld.fun

============================================================
  Validation Summary
============================================================

Passed: 15
Failed: 0
Warnings: 0

✅ All required configuration checks passed!
The backend is ready to start.
```

### Failed Validation

```
╔════════════════════════════════════════════════════════════╗
║  Gorweld Backend Environment Configuration Verification   ║
╚════════════════════════════════════════════════════════════╝

============================================================
  Wallet Address Validation
============================================================
✗ WALLET_1_ADDRESS
  Missing required environment variable
✓ WALLET_2_ADDRESS
  Value: Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo
✓ WALLET_2_ADDRESS format
  Valid Solana address

============================================================
  Solana RPC Validation
============================================================
✗ SOLANA_RPC_URL
  Missing required environment variable

============================================================
  Validation Summary
============================================================

Passed: 2
Failed: 2
Warnings: 0

❌ FAILED CHECKS:
  • WALLET_1_ADDRESS: First treasury wallet address - MISSING
  • SOLANA_RPC_URL: Solana RPC endpoint URL - MISSING

❌ Configuration validation failed!
Please fix the errors above before starting the backend.
```

## Integration with Deployment

### Pre-Start Validation

Add the verification script to your deployment process:

```bash
# In your deployment script
npm run verify-env || exit 1
npm start
```

### Docker Integration

```dockerfile
# In your Dockerfile
RUN npm run verify-env
CMD ["npm", "start"]
```

### PM2 Integration

```bash
# Verify before starting with PM2
npm run verify-env && pm2 start server/index.js --name gorweld-backend
```

## Troubleshooting

### Missing Environment Variables

**Error:** `✗ WALLET_1_ADDRESS - Missing required environment variable`

**Solution:** Create a `.env` file in the backend directory or set environment variables:

```bash
cp .env.example .env
# Edit .env with your values
```

### Invalid Solana Address

**Error:** `✗ WALLET_1_ADDRESS format - Invalid Solana address format`

**Solution:** Verify the wallet address is a valid base58-encoded Solana public key (32-44 characters).

### RPC Connection Failed

**Error:** `✗ RPC connectivity - Failed to connect: connect ETIMEDOUT`

**Solution:**
1. Check your internet connection
2. Verify the RPC URL is correct
3. Consider using a paid RPC provider for production (e.g., Helius, QuickNode)
4. Check firewall settings

### Database Directory Not Writable

**Error:** `✗ Database directory writable - Permission denied`

**Solution:**
```bash
# Fix directory permissions
chmod 755 ./data
# Or create with correct permissions
mkdir -p ./data && chmod 755 ./data
```

## Best Practices

1. **Run Before Every Deployment**: Always run the verification script before deploying to production
2. **CI/CD Integration**: Add the script to your CI/CD pipeline as a pre-deployment check
3. **Environment-Specific Configs**: Use different `.env` files for development, staging, and production
4. **Secure Credentials**: Never commit `.env` files to version control
5. **Monitor RPC Health**: Regularly verify RPC connectivity, especially before high-traffic events

## Related Files

- `.env.example`: Template for environment variables
- `server/index.js`: Main server entry point
- `services/transactionVerifier.js`: Uses wallet addresses and RPC URL
- `models/database.js`: Uses DATABASE_PATH

## Support

For issues or questions about environment configuration:
1. Check the `.env.example` file for required variables
2. Review the backend README.md
3. Consult the deployment documentation
