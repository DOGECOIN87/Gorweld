# Health Endpoint Integration Tests

This document describes the integration tests for the `/health` endpoint.

## Overview

The health endpoint integration tests verify that the comprehensive health check system works correctly under various conditions:

1. **Healthy System**: All systems (database and Solana RPC) are operational
2. **Database Unavailable**: Database connection fails
3. **RPC Unavailable**: Solana RPC connection fails

## Running the Tests

```bash
npm run test-health
```

Or directly:

```bash
node test-health-endpoint.js
```

## Test Coverage

### Test Suite 1: Healthy System

Tests when all systems are operational:

- ✓ Returns HTTP 200 when all systems healthy
- ✓ Response has correct schema structure
- ✓ Overall status is "ok"
- ✓ Database status is "healthy"
- ✓ Solana RPC status is "healthy"
- ✓ Environment mode is included
- ✓ Uptime is a positive number
- ✓ Timestamp is valid ISO format
- ✓ Solana RPC check includes endpoint
- ✓ Solana RPC check includes current slot

### Test Suite 2: Database Unavailable

Tests when database connection fails:

- ✓ Database initialization fails with invalid path

### Test Suite 3: RPC Unavailable

Tests when Solana RPC connection fails:

- ✓ Returns HTTP 503 when RPC unavailable
- ✓ Overall status is "degraded"
- ✓ Database status remains "healthy"
- ✓ Solana RPC status is "unhealthy"
- ✓ RPC check includes error message

## Expected Response Format

### Healthy Response (HTTP 200)

```json
{
  "status": "ok",
  "timestamp": "2025-11-17T12:00:00.000Z",
  "uptime": 123,
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful"
    },
    "solanaRpc": {
      "status": "healthy",
      "message": "Solana RPC connection successful",
      "endpoint": "https://api.mainnet-beta.solana.com",
      "currentSlot": 123456789
    }
  }
}
```

### Degraded Response (HTTP 503)

```json
{
  "status": "degraded",
  "timestamp": "2025-11-17T12:00:00.000Z",
  "uptime": 123,
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful"
    },
    "solanaRpc": {
      "status": "unhealthy",
      "message": "Solana RPC connection failed",
      "endpoint": "https://api.mainnet-beta.solana.com",
      "error": "Connection timeout"
    }
  }
}
```

## Requirements Verified

These tests verify the following requirements:

- **Requirement 2.1**: Backend responds to health check requests at "/health" endpoint
- **Requirement 2.3**: Health endpoint returns JSON response with status and timestamp
- **Requirement 2.5**: Backend initializes database before accepting requests

## Test Environment

The tests use:

- Test port: 3001
- Test database: `./data/test-health.db` (automatically cleaned up)
- Environment configuration: `.env.test`

## Notes

- Tests create temporary databases that are automatically cleaned up after execution
- Tests verify both successful and failure scenarios
- All tests are self-contained and don't affect production data
- Tests include timeout handling to prevent hanging
