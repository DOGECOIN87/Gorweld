# Comprehensive API Testing Script

## Overview

The `test-api-comprehensive.js` script provides comprehensive testing for the Gorweld backend API, covering all major endpoints and validation scenarios.

## Requirements Tested

- **3.4**: Card data validation and required fields
- **3.5**: Input sanitization and XSS prevention
- **5.3**: Card retrieval and ordering
- **5.4**: API endpoint functionality
- **8.3**: Card update validation

## Test Coverage

### 1. Card Data Validation
- ✓ Valid card data passes validation
- ✓ Empty name is rejected
- ✓ Name exceeding 50 characters is rejected
- ✓ Invalid URL format is rejected
- ✓ Empty media URLs array is rejected
- ✓ More than 5 media URLs is rejected

### 2. Input Sanitization
- ✓ XSS script tags are sanitized
- ✓ HTML tags are escaped
- ✓ Quotes are escaped
- ✓ Card data middleware sanitizes all fields

### 3. Validation Middleware
- ✓ Valid wallet address passes validation
- ✓ Short wallet address is rejected
- ✓ Wallet with invalid characters is rejected
- ✓ Valid transaction signature passes validation
- ✓ Short transaction signature is rejected

### 4. POST /api/cards/submit - Missing Fields
- ✓ Missing cardData returns 400 error
- ✓ Missing transactionSignature returns 400 error
- ✓ Missing walletAddress returns 400 error

### 5. POST /api/cards/submit - Invalid Card Data
- ✓ Empty card name returns validation error
- ✓ Invalid URL returns validation error
- ✓ Empty media URLs returns validation error

### 6. GET /api/cards
- ✓ Returns all published cards
- ✓ Cards are ordered by creation time (oldest first)
- ✓ Media URLs are parsed as arrays

### 7. PUT /api/cards/:cardId - Update Card
- ✓ Card owner can update card successfully
- ✓ Card data is updated correctly
- ✓ Transaction signature is preserved after update
- ✓ Non-owner receives 403 error
- ✓ Invalid card data is rejected on update
- ✓ Non-existent card returns 404 error

### 8. PUT /api/cards/:cardId - Missing Fields
- ✓ Missing cardData returns 400 error
- ✓ Missing walletAddress returns 400 error

## Usage

### Run the test script:

```bash
cd backend
node test-api-comprehensive.js
```

Or using npm:

```bash
cd backend
npm run test:api
```

## Test Output

The script provides detailed output with color-coded results:

- **Green ✓**: Test passed
- **Red ✗**: Test failed
- **Yellow**: Informational messages

### Example Output:

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
✓ PASS: 1b. Empty name is rejected
✓ PASS: 1c. Name exceeding 50 characters is rejected
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

## Test Database

The script uses an in-memory SQLite database (`:memory:`) for testing, which means:
- No persistent data is created
- Tests are isolated and don't affect production data
- Fast execution
- Clean state for each test run

## What Gets Tested

### Complete Card Submission Flow
1. **Validation**: All card data fields are validated according to requirements
2. **Sanitization**: User inputs are sanitized to prevent XSS attacks
3. **Middleware**: Validation middleware correctly rejects invalid requests
4. **Error Handling**: Proper error messages for all failure scenarios

### Card Retrieval
1. **GET /api/cards**: Returns all published cards
2. **Ordering**: Cards are ordered by creation time (first-come-first-served)
3. **Data Format**: Media URLs are correctly parsed as arrays

### Card Updates
1. **Authorization**: Only card owners can update their cards
2. **Validation**: Updated data is validated using the same rules
3. **Preservation**: Transaction signature and creation time are preserved
4. **Error Handling**: Non-owners receive 403, non-existent cards return 404

## Integration with CI/CD

This test script can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run API Tests
  run: |
    cd backend
    npm run test:api
```

## Troubleshooting

### Test Failures

If tests fail, the script will:
1. Display which tests failed
2. Show error details for each failure
3. Exit with code 1 (for CI/CD integration)

### Common Issues

1. **Database initialization fails**: Ensure SQLite3 is properly installed
2. **Module not found**: Run `npm install` in the backend directory
3. **Permission denied**: Make the script executable with `chmod +x test-api-comprehensive.js`

## Notes

- This script does NOT test actual Solana transaction verification (that requires mainnet/devnet access)
- Transaction verification is tested separately in `test-transaction-verification.js`
- This focuses on API logic, validation, and data handling
- All tests use mock data and in-memory database

## Related Test Scripts

- `test-transaction-verification.js`: Tests Solana transaction verification
- `test-transaction-edge-cases.js`: Tests transaction verification edge cases
- `test-card-update-authorization.js`: Tests card update authorization
- `test-health-endpoint.js`: Tests health check endpoint
