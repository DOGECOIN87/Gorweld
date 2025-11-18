# API Testing Guide

## Overview

This guide explains how to test the Gorweld backend API using the comprehensive test suite. The test script validates all major API endpoints, validation logic, and error handling.

## Test Script: `test-api-comprehensive.js`

### Purpose

The comprehensive API test script validates:
- Complete card submission flow
- Card retrieval and ordering
- Card update functionality
- Input validation and sanitization
- Error handling for all scenarios
- Middleware functionality

### Requirements Covered

- **Requirement 3.4**: Card data validation and storage
- **Requirement 3.5**: Input sanitization and XSS prevention
- **Requirement 5.3**: Card retrieval functionality
- **Requirement 5.4**: API endpoint correctness
- **Requirement 8.3**: Card update validation

## Running the Tests

### Method 1: Using npm script (Recommended)

```bash
cd backend
npm run test:api
```

### Method 2: Direct execution

```bash
cd backend
node test-api-comprehensive.js
```

### Method 3: Using the shell script

```bash
cd backend
./run-api-tests.sh
```

## Test Categories

### 1. Card Data Validation Tests

Tests the `validateCardData()` function with various inputs:

| Test | Description | Expected Result |
|------|-------------|-----------------|
| 1a | Valid card data | Passes validation |
| 1b | Empty name | Rejected with error |
| 1c | Name > 50 chars | Rejected with error |
| 1d | Invalid URL | Rejected with error |
| 1e | Empty media URLs | Rejected with error |
| 1f | > 5 media URLs | Rejected with error |

### 2. Input Sanitization Tests

Tests the sanitization middleware:

| Test | Description | Input | Expected Output |
|------|-------------|-------|-----------------|
| 2a | XSS script tags | `<script>alert("xss")</script>` | `&lt;script&gt;...` |
| 2b | HTML tags | `<div>Test</div>` | `&lt;div&gt;Test&lt;/div&gt;` |
| 2c | Quotes | `"quoted" and 'single'` | `&quot;quoted&quot; and &#x27;single&#x27;` |
| 2d | Card data middleware | XSS in card fields | All fields sanitized |

### 3. Validation Middleware Tests

Tests wallet and signature validation:

| Test | Description | Expected Result |
|------|-------------|-----------------|
| 3a | Valid wallet address | Passes validation |
| 3b | Short wallet address | 400 error |
| 3c | Invalid characters in wallet | 400 error |
| 3d | Valid transaction signature | Passes validation |
| 3e | Short transaction signature | 400 error |

### 4. POST /api/cards/submit - Missing Fields

Tests required field validation:

| Test | Description | Missing Field | Expected Result |
|------|-------------|---------------|-----------------|
| 4a | Missing cardData | cardData | 400 error |
| 4b | Missing signature | transactionSignature | 400 error |
| 4c | Missing wallet | walletAddress | 400 error |

### 5. POST /api/cards/submit - Invalid Data

Tests card data validation on submission:

| Test | Description | Invalid Field | Expected Result |
|------|-------------|---------------|-----------------|
| 5a | Empty name | name | 400 validation error |
| 5b | Invalid URL | url | 400 validation error |
| 5c | Empty media URLs | mediaUrls | 400 validation error |

### 6. GET /api/cards

Tests card retrieval:

| Test | Description | Expected Result |
|------|-------------|-----------------|
| 6a | Get all cards | Returns all published cards |
| 6b | Card ordering | Ordered by created_at ASC |
| 6c | Media URLs parsing | Parsed as arrays |

### 7. PUT /api/cards/:cardId - Update Card

Tests card update functionality:

| Test | Description | Expected Result |
|------|-------------|-----------------|
| 7a | Owner updates card | Success (200) |
| 7b | Data is updated | New data saved |
| 7c | Signature preserved | Original signature unchanged |
| 7d | Non-owner attempts update | 403 error |
| 7e | Invalid data on update | 400 validation error |
| 7f | Non-existent card | 404 error |

### 8. PUT /api/cards/:cardId - Missing Fields

Tests required fields on update:

| Test | Description | Missing Field | Expected Result |
|------|-------------|---------------|-----------------|
| 8a | Missing cardData | cardData | 400 error |
| 8b | Missing wallet | walletAddress | 400 error |

## Test Output Format

### Success Output

```
════════════════════════════════════════════════════════════════════════════════
Comprehensive API Testing Suite
════════════════════════════════════════════════════════════════════════════════
Testing Requirements: 3.4, 3.5, 5.3, 5.4, 8.3

Initializing test database...
✓ Database initialized

────────────────────────────────────────────────────────────────────────────────
Test 1: Card Data Validation (Requirement 3.4, 3.5)
────────────────────────────────────────────────────────────────────────────────
✓ PASS: 1a. Valid card data passes validation
  No validation errors
✓ PASS: 1b. Empty name is rejected
  Validation error: Card name is required
...

════════════════════════════════════════════════════════════════════════════════
Test Summary
════════════════════════════════════════════════════════════════════════════════

Total Tests: 30
Passed: 30
Failed: 0
Success Rate: 100.0%

════════════════════════════════════════════════════════════════════════════════
Test Complete
════════════════════════════════════════════════════════════════════════════════

✓ All tests passed! API is functioning correctly.
```

### Failure Output

When tests fail, you'll see:

```
✗ FAIL: 5a. Empty card name returns validation error
  Error: Expected 400, got 200

Failed Tests:
  ✗ 5a. Empty card name returns validation error
    Error: Expected 400, got 200
```

## Test Data

The script uses the following test data:

### Valid Test Wallet Addresses
- `BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt`
- `Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo`

### Valid Test Transaction Signature
- `5J8H5sPKXHwHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGH`

### Valid Card Data
```javascript
{
    name: 'Test Project',
    subtitle: 'A comprehensive test project',
    description: 'This is a test project to verify the complete API functionality.',
    url: 'https://example.com',
    icon: '🚀',
    mediaUrls: ['https://example.com/image1.png']
}
```

## Database

The test script uses an **in-memory SQLite database** (`:memory:`), which means:

✅ **Advantages:**
- No persistent data created
- Tests are isolated
- Fast execution
- Clean state for each run
- No cleanup required

❌ **Limitations:**
- Cannot test actual Solana transaction verification
- Does not test production database
- Data is lost after test completion

## What Is NOT Tested

This script focuses on API logic and validation. It does **NOT** test:

1. **Solana Transaction Verification**: Use `test-transaction-verification.js` for that
2. **File Upload**: Use manual testing or integration tests
3. **Production Database**: This uses in-memory database
4. **Network/RPC Calls**: Mocked or skipped
5. **Authentication**: Not implemented in current version

## Integration with Other Tests

### Complete Test Suite

Run all backend tests:

```bash
# Environment configuration
npm run verify-env

# Health endpoint
npm run test:health

# Transaction verification
npm run test:transaction

# Transaction edge cases
npm run test:edge-cases

# Card update authorization
npm run test:card-update

# Comprehensive API tests
npm run test:api
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Run API tests
        run: |
          cd backend
          npm run test:api
```

## Troubleshooting

### Common Issues

#### 1. Module not found errors

```bash
cd backend
npm install
```

#### 2. Permission denied

```bash
chmod +x test-api-comprehensive.js
chmod +x run-api-tests.sh
```

#### 3. Database errors

Ensure SQLite3 is properly installed:

```bash
npm install sqlite3
```

#### 4. Test failures

If tests fail:
1. Check the error details in the output
2. Review the specific test that failed
3. Verify the implementation matches requirements
4. Check for recent code changes

### Debug Mode

To see more detailed output, you can modify the mock logger in the test script:

```javascript
const mockLogger = {
    info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
    warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta || ''),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || '')
};
```

## Best Practices

1. **Run tests before committing**: Ensure all tests pass before pushing code
2. **Run tests after changes**: Verify changes don't break existing functionality
3. **Review failed tests**: Understand why tests fail before fixing
4. **Keep tests updated**: Update tests when requirements change
5. **Use in CI/CD**: Automate testing in your deployment pipeline

## Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed or fatal error occurred

This makes it easy to integrate with CI/CD pipelines and scripts.

## Related Documentation

- [TEST_API_COMPREHENSIVE.md](./TEST_API_COMPREHENSIVE.md) - Detailed test coverage
- [CARD_UPDATE_AUTHORIZATION_VERIFICATION.md](./CARD_UPDATE_AUTHORIZATION_VERIFICATION.md) - Card update tests
- [TRANSACTION_VERIFICATION_TESTS.md](./TRANSACTION_VERIFICATION_TESTS.md) - Transaction tests
- [HEALTH_ENDPOINT_IMPLEMENTATION.md](./HEALTH_ENDPOINT_IMPLEMENTATION.md) - Health check tests

## Support

For issues or questions:
1. Check the test output for specific error messages
2. Review the implementation in `controllers/cardController.js`
3. Check validation logic in `middleware/validation.js`
4. Verify database schema in `models/database.js`
