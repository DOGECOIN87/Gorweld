# Transaction Verification Test Suite

This directory contains comprehensive test scripts for verifying Solana mainnet transaction verification functionality.

## Test Scripts

### 1. test-transaction-verification.js

**Purpose**: End-to-end testing of mainnet transaction verification with real transaction signatures.

**Features**:
- Verifies real mainnet transactions
- Tests all verification checks (sender, recipients, amounts)
- Displays detailed verification results
- Tests duplicate signature detection
- Tests sender mismatch scenarios
- Color-coded terminal output

**Usage**:
```bash
# Test with a valid transaction signature and sender
node test-transaction-verification.js <signature> <sender_wallet>

# Example
node test-transaction-verification.js 5J7xK2... 9AbcDef...

# Show help
node test-transaction-verification.js --help
```

**What it tests**:
1. Valid transaction with correct sender
2. Duplicate signature detection (second attempt with same signature)
3. Sender mismatch detection (wrong sender address)
4. Invalid signature format
5. Non-existent transaction

**Requirements**: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5

### 2. test-transaction-edge-cases.js

**Purpose**: Automated testing of edge cases and error scenarios.

**Features**:
- Automated test suite with pass/fail tracking
- Tests all error codes and edge cases
- Isolated test database (doesn't affect production data)
- Comprehensive error scenario coverage
- Test summary with success rate

**Usage**:
```bash
# Run all edge case tests
node test-transaction-edge-cases.js

# Run with a valid signature for additional tests
node test-transaction-edge-cases.js --valid-sig <signature> --valid-sender <wallet>

# Show help
node test-transaction-edge-cases.js --help
```

**What it tests**:
1. Transaction not found (invalid signature format)
2. Transaction not found (non-existent transaction)
3. Duplicate signature detection (requires valid signature)
4. Sender mismatch detection (requires valid signature)
5. Empty signature
6. Null signature
7. Empty sender address
8. Oversized signature
9. Special characters in signature
10. Database query functionality

**Requirements**: 3.3, 4.1, 4.2, 4.3, 4.4, 4.5

## NPM Scripts

Add these to your `package.json` for easier testing:

```json
{
  "scripts": {
    "test:transaction": "node test-transaction-verification.js",
    "test:edge-cases": "node test-transaction-edge-cases.js"
  }
}
```

## Environment Setup

Ensure your `.env` file is configured with mainnet settings:

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Treasury Wallets
WALLET_1_ADDRESS=BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt
WALLET_2_ADDRESS=Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo

# Database
DATABASE_PATH=./data/cards.db
```

## Getting Test Transaction Signatures

To test with real mainnet transactions:

1. **Create a test transaction** on Solana mainnet:
   - Send exactly 1 SOL split between the two treasury wallets
   - 0.5 SOL to Wallet 1: `BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt`
   - 0.5 SOL to Wallet 2: `Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo`

2. **Capture the transaction signature** from your wallet

3. **Use the signature in tests**:
   ```bash
   node test-transaction-verification.js <your_signature> <your_wallet_address>
   ```

## Expected Error Codes

The TransactionVerifier can return the following error codes:

| Error Code | Description |
|------------|-------------|
| `DUPLICATE_SIGNATURE` | Transaction signature has already been used |
| `TRANSACTION_NOT_FOUND` | Transaction not found on blockchain |
| `TRANSACTION_FAILED` | Transaction failed or not confirmed |
| `SENDER_MISMATCH` | Sender doesn't match provided wallet |
| `INVALID_RECIPIENT_WALLET_1` | Wallet 1 not found in transaction |
| `INVALID_RECIPIENT_WALLET_2` | Wallet 2 not found in transaction |
| `INVALID_TOTAL_AMOUNT` | Total amount is not exactly 1 SOL |
| `INVALID_PAYMENT_AMOUNTS` | Split amounts are incorrect |
| `RATE_LIMIT` | RPC rate limit exceeded |
| `VERIFICATION_ERROR` | General verification error |

## Test Output Examples

### Successful Verification

```
================================================================================
Test: Valid Transaction with Correct Sender
================================================================================
✓ VERIFICATION PASSED

Transaction Details:
  Signature: 5J7xK2...
  Sender: 9AbcDef...
  Block Time: 2025-11-17T12:00:00.000Z
  Slot: 123456789

Recipients:
  Wallet 1: BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt
  Wallet 2: Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo

Amounts (Lamports):
  Wallet 1: 500,000,000
  Wallet 2: 500,000,000
  Total: 1,000,000,000

Amounts (SOL):
  Wallet 1: 0.5 SOL
  Wallet 2: 0.5 SOL
  Total: 1 SOL
```

### Failed Verification

```
================================================================================
Test: Duplicate Signature Detection
================================================================================
✗ VERIFICATION FAILED

Error Code: DUPLICATE_SIGNATURE
Error Message: Transaction signature already used
```

## Troubleshooting

### RPC Rate Limits

If you encounter rate limit errors:
- Use a paid RPC endpoint (Helius, QuickNode, etc.)
- Add delays between tests
- Reduce the number of test iterations

### Database Locked

If you see database locked errors:
- Ensure no other processes are using the database
- The edge case tests use a separate test database to avoid conflicts

### Transaction Not Found

If valid transactions show as not found:
- Verify the RPC URL is correct
- Check that the transaction is confirmed on mainnet
- Ensure the signature is copied correctly (no extra spaces)

## Integration with CI/CD

These tests can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Transaction Verification Tests
  run: |
    npm run test:edge-cases
  env:
    SOLANA_RPC_URL: ${{ secrets.SOLANA_RPC_URL }}
    WALLET_1_ADDRESS: ${{ secrets.WALLET_1_ADDRESS }}
    WALLET_2_ADDRESS: ${{ secrets.WALLET_2_ADDRESS }}
```

## Best Practices

1. **Use Test Database**: The edge case tests automatically use a separate database
2. **Clean Up**: Tests clean up after themselves (close connections, remove test data)
3. **Real Transactions**: Use real mainnet transactions for comprehensive testing
4. **Monitor RPC Usage**: Be aware of RPC rate limits when running tests frequently
5. **Document Results**: Save test output for deployment verification records

## Related Documentation

- [Design Document](../.kiro/specs/solana-mainnet-deployment/design.md)
- [Requirements Document](../.kiro/specs/solana-mainnet-deployment/requirements.md)
- [Transaction Verifier Service](./services/transactionVerifier.js)
