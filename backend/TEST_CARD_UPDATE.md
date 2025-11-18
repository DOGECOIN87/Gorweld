# Card Update Authorization Testing Guide

## Quick Start

Run the automated test suite to verify card update authorization:

```bash
# From backend directory
npm run test:card-update

# Or directly
node test-card-update-authorization.js
```

## What Gets Tested

The test suite verifies all requirements for card update authorization (8.1-8.5):

### ✅ Test 1: Wallet Ownership Check (Requirement 8.1)
- Verifies that the owner wallet can successfully update their card
- Confirms no payment verification is required for updates
- Tests that card data is properly updated in the database

### ✅ Test 2: Non-Owner Rejection (Requirement 8.2)
- Verifies that non-owner wallets receive HTTP 403 error
- Confirms exact error message: "You do not have permission to edit this card"
- Tests that unauthorized updates are blocked

### ✅ Test 3: Card Data Validation (Requirement 8.3)
- Verifies that invalid card data is rejected
- Tests all validation rules (name, subtitle, description, URL, icon, mediaUrls)
- Confirms same validation as new card submissions

### ✅ Test 4: Updated_at Timestamp (Requirement 8.4)
- Verifies that updated_at timestamp changes on successful update
- Confirms timestamp uses current server time
- Tests that timestamp is independent of other field updates

### ✅ Test 5: Preserved Fields (Requirement 8.5)
- Verifies that transaction_signature remains unchanged
- Confirms that created_at timestamp is preserved
- Tests that wallet_address is not modified

### ✅ Test 6: Card Not Found
- Verifies that updating non-existent card returns 404
- Tests proper error handling for invalid card IDs

### ✅ Test 7: Missing Required Fields
- Verifies that missing cardData or walletAddress returns 400
- Tests proper validation of request body

## Expected Output

```
╔════════════════════════════════════════════════════════════╗
║  Card Update Authorization Verification Tests              ║
║  Requirements: 8.1, 8.2, 8.3, 8.4, 8.5                     ║
╚════════════════════════════════════════════════════════════╝

=== Setting up test database ===
✓ Test card created with ID: 1

=== Test 1: Wallet Ownership Check (Requirement 8.1) ===
✓ PASS: Owner wallet successfully updated card

=== Test 2: Non-Owner Rejection (Requirement 8.2) ===
✓ PASS: Non-owner wallet received 403 error
✓ PASS: Correct error message returned

=== Test 3: Card Data Validation (Requirement 8.3) ===
✓ PASS: Invalid card data was rejected

=== Test 4: Updated_at Timestamp (Requirement 8.4) ===
✓ PASS: updated_at timestamp was updated

=== Test 5: Preserved Fields (Requirement 8.5) ===
✓ PASS: transaction_signature was preserved
✓ PASS: created_at was preserved

=== Test 6: Card Not Found ===
✓ PASS: Non-existent card returns 404 error

=== Test 7: Missing Required Fields ===
✓ PASS: Missing fields returns 400 error

╔════════════════════════════════════════════════════════════╗
║  Test Summary                                              ║
╚════════════════════════════════════════════════════════════╝

✓ PASS: Wallet Ownership Check
✓ PASS: Non-Owner Rejection
✓ PASS: Card Data Validation
✓ PASS: Updated_at Timestamp
✓ PASS: Preserved Fields
✓ PASS: Card Not Found
✓ PASS: Missing Required Fields

Total: 7/7 tests passed

✓ All tests passed! Card update authorization is working correctly.
```

## Manual Testing

If you prefer to test manually with a running server:

### 1. Start the Backend Server

```bash
npm start
# Server should be running on http://localhost:3000
```

### 2. Submit a Test Card

First, you need a card to update. Submit one with a valid transaction:

```bash
curl -X POST http://localhost:3000/api/cards/submit \
  -H "Content-Type: application/json" \
  -d '{
    "cardData": {
      "name": "Test Project",
      "subtitle": "A test project",
      "description": "This is a test project for update testing.",
      "url": "https://example.com",
      "icon": "🚀",
      "mediaUrls": ["https://example.com/image.png"]
    },
    "transactionSignature": "VALID_MAINNET_SIGNATURE",
    "walletAddress": "YOUR_WALLET_ADDRESS"
  }'
```

Note the `cardId` from the response.

### 3. Test Owner Update (Should Succeed)

```bash
curl -X PUT http://localhost:3000/api/cards/CARD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "cardData": {
      "name": "Updated Project",
      "subtitle": "An updated project",
      "description": "This project has been updated successfully.",
      "url": "https://updated.com",
      "icon": "🎯",
      "mediaUrls": ["https://example.com/new-image.png"]
    },
    "walletAddress": "YOUR_WALLET_ADDRESS"
  }'
```

Expected: `200 OK` with success message

### 4. Test Non-Owner Update (Should Fail)

```bash
curl -X PUT http://localhost:3000/api/cards/CARD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "cardData": {
      "name": "Unauthorized Update",
      "subtitle": "This should fail",
      "description": "Non-owner trying to update.",
      "url": "https://hacker.com",
      "icon": "💀",
      "mediaUrls": ["https://hacker.com/image.png"]
    },
    "walletAddress": "DIFFERENT_WALLET_ADDRESS"
  }'
```

Expected: `403 Forbidden` with error message

### 5. Test Invalid Data (Should Fail)

```bash
curl -X PUT http://localhost:3000/api/cards/CARD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "cardData": {
      "name": "",
      "subtitle": "Invalid",
      "description": "Invalid data",
      "url": "not-a-url",
      "icon": "🚀",
      "mediaUrls": []
    },
    "walletAddress": "YOUR_WALLET_ADDRESS"
  }'
```

Expected: `400 Bad Request` with validation errors

### 6. Verify Preserved Fields

```bash
# Get the card before update
curl http://localhost:3000/api/cards

# Note: created_at, updated_at, transaction_signature

# Update the card
curl -X PUT http://localhost:3000/api/cards/CARD_ID \
  -H "Content-Type: application/json" \
  -d '{...}'

# Get the card after update
curl http://localhost:3000/api/cards

# Verify:
# - created_at is the same
# - updated_at is newer
# - transaction_signature is the same
```

## Troubleshooting

### Test Fails: "Cannot find module"

Make sure you're in the backend directory and dependencies are installed:

```bash
cd backend
npm install
npm run test:card-update
```

### Test Fails: Database Error

The test uses an in-memory database, so this shouldn't happen. If it does:

1. Check that sqlite3 is installed: `npm list sqlite3`
2. Reinstall dependencies: `npm install`
3. Check Node.js version: `node --version` (should be 14+)

### Manual Test Fails: Connection Refused

Make sure the backend server is running:

```bash
npm start
# Should see: "Server running on port 3000"
```

### Manual Test Fails: Transaction Verification

For manual testing with real transactions:
1. Use a valid mainnet transaction signature
2. Ensure the transaction sent 1 SOL split to both treasury wallets
3. Check backend logs for detailed error messages

## Implementation Details

The card update authorization is implemented in `backend/controllers/cardController.js`:

- **Authorization**: Checks `existingCard.wallet_address === walletAddress`
- **Validation**: Uses same `validateCardData()` as new submissions
- **Preservation**: UPDATE statement only modifies specific fields
- **Timestamp**: Sets `updated_at = CURRENT_TIMESTAMP` on update
- **Error Handling**: Returns appropriate HTTP status codes (403, 404, 400, 500)

## Related Documentation

- Full verification report: `CARD_UPDATE_AUTHORIZATION_VERIFICATION.md`
- Requirements document: `.kiro/specs/solana-mainnet-deployment/requirements.md`
- Design document: `.kiro/specs/solana-mainnet-deployment/design.md`
- API documentation: `backend/README.md`

## Support

If tests fail or you encounter issues:

1. Check the verification report for detailed implementation analysis
2. Review backend logs for error details
3. Verify database schema matches expected structure
4. Ensure all dependencies are installed and up to date
