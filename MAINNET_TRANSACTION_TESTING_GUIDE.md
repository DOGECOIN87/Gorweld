# Mainnet Transaction Testing Guide

## Overview

This guide provides step-by-step instructions for creating and testing Solana mainnet transactions for the Gorweld platform. The platform requires a 1 SOL payment split equally (0.5 SOL each) between two treasury wallets to submit a project card.

**Treasury Wallets:**
- Wallet 1: `BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt`
- Wallet 2: `Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo`

**Required Payment:** 1 SOL total (0.5 SOL to each wallet)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating a Test Transaction on Mainnet](#creating-a-test-transaction-on-mainnet)
3. [Wallet Provider Guides](#wallet-provider-guides)
4. [Verifying Transactions on Solana Explorer](#verifying-transactions-on-solana-explorer)
5. [Example Transaction Signatures](#example-transaction-signatures)
6. [Testing with the Backend API](#testing-with-the-backend-api)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before creating a test transaction, ensure you have:

1. **Solana Wallet**: A wallet with at least 1.01 SOL (1 SOL for payment + ~0.01 SOL for transaction fees)
2. **Wallet Provider**: One of the following installed:
   - Phantom Wallet (recommended)
   - Solflare Wallet
   - Backpack Wallet
   - Glow Wallet
3. **Network**: Wallet configured for Solana Mainnet-Beta
4. **Browser**: Modern browser (Chrome, Firefox, Brave, Edge)

### Checking Your SOL Balance

1. Open your wallet extension
2. Ensure you're on "Mainnet Beta" network
3. Check your SOL balance (should be > 1.01 SOL)

---

## Creating a Test Transaction on Mainnet

### Method 1: Using Phantom Wallet (Recommended)

#### Step 1: Open Phantom Wallet
1. Click the Phantom extension icon in your browser
2. Unlock your wallet if needed
3. Verify you're on "Mainnet Beta" (check network indicator)

#### Step 2: Initiate First Transfer (0.5 SOL to Wallet 1)
1. Click **"Send"** button
2. In the recipient field, paste: `BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt`
3. Enter amount: `0.5` SOL
4. Review the transaction details:
   - Recipient: BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt
   - Amount: 0.5 SOL
   - Network Fee: ~0.000005 SOL
5. Click **"Next"** then **"Approve"**
6. Wait for confirmation (usually 5-15 seconds)
7. **IMPORTANT**: Copy the transaction signature from the confirmation screen

#### Step 3: Initiate Second Transfer (0.5 SOL to Wallet 2)
1. Click **"Send"** button again
2. In the recipient field, paste: `Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo`
3. Enter amount: `0.5` SOL
4. Review the transaction details
5. Click **"Next"** then **"Approve"**
6. Wait for confirmation
7. Copy the transaction signature

#### Step 4: Record Transaction Information
Create a record with the following information:
```json
{
  "wallet_address": "YOUR_WALLET_ADDRESS",
  "transaction_1": {
    "signature": "TRANSACTION_SIGNATURE_1",
    "recipient": "BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt",
    "amount": "0.5 SOL"
  },
  "transaction_2": {
    "signature": "TRANSACTION_SIGNATURE_2",
    "recipient": "Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo",
    "amount": "0.5 SOL"
  },
  "timestamp": "2025-11-17T12:00:00Z"
}
```

### Method 2: Using Solana CLI (Advanced)

If you prefer command-line tools:

#### Step 1: Install Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

#### Step 2: Configure for Mainnet
```bash
solana config set --url https://api.mainnet-beta.solana.com
```

#### Step 3: Check Your Balance
```bash
solana balance YOUR_WALLET_ADDRESS
```

#### Step 4: Create Split Transaction
```bash
# Transfer 0.5 SOL to Wallet 1
solana transfer BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt 0.5 \
  --keypair /path/to/your/keypair.json

# Transfer 0.5 SOL to Wallet 2
solana transfer Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo 0.5 \
  --keypair /path/to/your/keypair.json
```

The CLI will output transaction signatures after each transfer.

### Method 3: Using @solana/web3.js (Programmatic)

For developers who want to automate testing:

```javascript
const { Connection, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = require('@solana/web3.js');
const fs = require('fs');

async function createSplitPayment() {
  // Connect to mainnet
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
  // Load your keypair (NEVER commit this file!)
  const keypairData = JSON.parse(fs.readFileSync('/path/to/keypair.json', 'utf-8'));
  const payer = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  
  // Treasury wallets
  const wallet1 = 'BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt';
  const wallet2 = 'Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo';
  
  // Create transaction for 0.5 SOL to wallet 1
  const transaction1 = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: wallet1,
      lamports: 0.5 * LAMPORTS_PER_SOL
    })
  );
  
  // Send first transaction
  const signature1 = await sendAndConfirmTransaction(connection, transaction1, [payer]);
  console.log('Transaction 1 signature:', signature1);
  
  // Create transaction for 0.5 SOL to wallet 2
  const transaction2 = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: wallet2,
      lamports: 0.5 * LAMPORTS_PER_SOL
    })
  );
  
  // Send second transaction
  const signature2 = await sendAndConfirmTransaction(connection, transaction2, [payer]);
  console.log('Transaction 2 signature:', signature2);
  
  return { signature1, signature2 };
}

createSplitPayment().catch(console.error);
```

---

## Wallet Provider Guides

### Phantom Wallet

**Installation:**
1. Visit https://phantom.app
2. Click "Download" and select your browser
3. Install the extension
4. Create or import a wallet
5. Switch to "Mainnet Beta" network

**Creating Split Payment:**
1. Click Phantom icon → "Send"
2. Enter recipient: `BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt`
3. Amount: `0.5` SOL
4. Approve transaction
5. Repeat for second wallet: `Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo`

**Finding Transaction Signature:**
- After approval, click "View on Explorer"
- Or go to Activity tab → Click transaction → Copy signature

### Solflare Wallet

**Installation:**
1. Visit https://solflare.com
2. Download browser extension
3. Create or import wallet
4. Ensure "Mainnet" is selected

**Creating Split Payment:**
1. Click "Send" button
2. Recipient: `BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt`
3. Amount: `0.5` SOL
4. Click "Send" → Confirm
5. Copy transaction signature from confirmation
6. Repeat for second wallet

**Finding Transaction Signature:**
- Click "Activity" → Select transaction
- Signature displayed at top of transaction details

### Backpack Wallet

**Installation:**
1. Visit https://backpack.app
2. Install browser extension
3. Create wallet
4. Switch to Mainnet

**Creating Split Payment:**
1. Click "Send" tab
2. Enter address: `BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt`
3. Amount: `0.5`
4. Confirm transaction
5. Repeat for second wallet

### Glow Wallet

**Installation:**
1. Visit https://glow.app
2. Download extension
3. Set up wallet
4. Select Mainnet network

**Creating Split Payment:**
1. Navigate to "Send"
2. Recipient: `BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt`
3. Amount: `0.5` SOL
4. Approve
5. Repeat for second wallet

---

## Verifying Transactions on Solana Explorer

### Using Solana Explorer (explorer.solana.com)

#### Step 1: Access Solana Explorer
1. Go to https://explorer.solana.com
2. Ensure "Mainnet Beta" is selected in the network dropdown (top right)

#### Step 2: Search for Transaction
1. Paste your transaction signature in the search bar
2. Press Enter or click search icon

#### Step 3: Verify Transaction Details

**Check Transaction Status:**
- Look for "Success" badge (green checkmark)
- Status should be "Finalized" or "Confirmed"

**Verify Transaction Information:**
```
Transaction Signature: [Your signature]
Block: [Block number]
Timestamp: [Transaction time]
Fee: ~0.000005 SOL
Status: ✓ Success
```

**Verify Transfer Details:**
1. Scroll to "Instruction" section
2. Look for "System Program: Transfer"
3. Verify:
   - **From**: Your wallet address
   - **To**: Treasury wallet address (Wallet 1 or Wallet 2)
   - **Amount**: 0.5 SOL (500,000,000 lamports)

#### Step 4: Check Both Transactions
Repeat the verification process for both transaction signatures to ensure:
- Transaction 1: 0.5 SOL → `BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt`
- Transaction 2: 0.5 SOL → `Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo`

### Using Solscan (solscan.io)

Alternative block explorer with more detailed analytics:

1. Go to https://solscan.io
2. Paste transaction signature in search
3. Verify similar details as Solana Explorer
4. Additional features:
   - Token transfers
   - Account changes
   - Program logs

### Using Solana Beach (solanabeach.io)

Another alternative with clean interface:

1. Visit https://solanabeach.io
2. Search for transaction signature
3. Review transaction details
4. Check confirmation status

---

## Example Transaction Signatures

Here are example transaction signatures from successful mainnet transactions for reference:

### Example 1: Complete Split Payment

**Wallet Address:** `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`

**Transaction 1 (0.5 SOL to Wallet 1):**
```
Signature: 5J7ZqQ2QZ8VvN3xKx8YvN3xKx8YvN3xKx8YvN3xKx8YvN3xKx8YvN3xKx8YvN3xKx8YvN3xKx8Yv
Recipient: BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt
Amount: 0.5 SOL (500,000,000 lamports)
Status: Success
Block: 234567890
```

**Transaction 2 (0.5 SOL to Wallet 2):**
```
Signature: 3K8ZrR3RZ9WwO4yLy9YwO4yLy9YwO4yLy9YwO4yLy9YwO4yLy9YwO4yLy9YwO4yLy9YwO4yLy9Yw
Recipient: Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo
Amount: 0.5 SOL (500,000,000 lamports)
Status: Success
Block: 234567891
```

### Example 2: Testing Scenario

For testing the backend verification system, you can use either transaction signature. The backend will verify:
- Transaction exists on mainnet
- Correct sender address
- Correct recipient (one of the two treasury wallets)
- Correct amount (0.5 SOL)

**Note:** The example signatures above are for illustration. You must create real transactions on mainnet for actual testing.

---

## Testing with the Backend API

### Step 1: Prepare Test Data

After creating your mainnet transactions, prepare the card submission data:

```json
{
  "cardData": {
    "name": "Test Project",
    "subtitle": "Testing mainnet integration",
    "description": "This is a test submission to verify mainnet transaction processing",
    "url": "https://example.com",
    "icon": "🧪",
    "mediaUrls": [
      "https://example.com/image1.png"
    ]
  },
  "transactionSignature": "YOUR_TRANSACTION_SIGNATURE_HERE",
  "walletAddress": "YOUR_WALLET_ADDRESS_HERE"
}
```

### Step 2: Test Transaction Verification

Use the backend test script to verify your transaction:

```bash
cd backend
node test-transaction-verification.js YOUR_TRANSACTION_SIGNATURE YOUR_WALLET_ADDRESS
```

Expected output for valid transaction:
```
Testing transaction verification...
Transaction Signature: YOUR_TRANSACTION_SIGNATURE
Expected Sender: YOUR_WALLET_ADDRESS

Verification Result:
{
  valid: true,
  signature: 'YOUR_TRANSACTION_SIGNATURE',
  sender: 'YOUR_WALLET_ADDRESS',
  recipients: {
    wallet1: 'BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt',
    wallet2: 'Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo'
  },
  amounts: {
    wallet1: 500000000,
    wallet2: 500000000,
    total: 1000000000
  },
  amountsSOL: {
    wallet1: 0.5,
    wallet2: 0.5,
    total: 1
  }
}

✓ Transaction verified successfully!
```

### Step 3: Test Card Submission

Submit a test card using curl:

```bash
curl -X POST http://localhost:3001/api/cards/submit \
  -H "Content-Type: application/json" \
  -d '{
    "cardData": {
      "name": "Test Project",
      "subtitle": "Testing mainnet integration",
      "description": "This is a test submission",
      "url": "https://example.com",
      "icon": "🧪",
      "mediaUrls": ["https://example.com/image.png"]
    },
    "transactionSignature": "YOUR_TRANSACTION_SIGNATURE",
    "walletAddress": "YOUR_WALLET_ADDRESS"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Card submitted successfully",
  "cardId": 1,
  "card": {
    "id": 1,
    "wallet_address": "YOUR_WALLET_ADDRESS",
    "transaction_signature": "YOUR_TRANSACTION_SIGNATURE",
    "name": "Test Project",
    "created_at": "2025-11-17T12:00:00.000Z"
  }
}
```

### Step 4: Verify Card Retrieval

Check that your card appears in the list:

```bash
curl http://localhost:3001/api/cards
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Insufficient funds" Error

**Symptoms:**
- Wallet shows error when trying to send
- Transaction fails before confirmation

**Solutions:**
1. Check your SOL balance: Must have > 1.01 SOL
2. Account for network fees (~0.000005 SOL per transaction)
3. Ensure you're on Mainnet Beta, not Devnet
4. Wait a few seconds and try again (network congestion)

**How to fix:**
```bash
# Check balance
solana balance YOUR_WALLET_ADDRESS

# If insufficient, acquire more SOL from an exchange
```

#### Issue 2: "Transaction not found" Error

**Symptoms:**
- Backend returns `TRANSACTION_NOT_FOUND` error
- Explorer shows "Transaction not found"

**Solutions:**
1. **Wait longer**: Transactions can take 15-30 seconds to finalize
2. **Check network**: Ensure you're searching on Mainnet Beta
3. **Verify signature**: Copy the full signature (87-88 characters)
4. **Check transaction status**: May have failed or been dropped

**How to verify:**
```bash
# Using Solana CLI
solana confirm YOUR_TRANSACTION_SIGNATURE
```

#### Issue 3: "Invalid amount" Error

**Symptoms:**
- Backend returns `INVALID_TOTAL_AMOUNT` or `INVALID_PAYMENT_AMOUNTS`
- Transaction shows wrong amount on explorer

**Solutions:**
1. **Verify amount**: Must be exactly 0.5 SOL per wallet
2. **Check decimals**: Use 0.5, not 0.50000001
3. **Lamports conversion**: 0.5 SOL = 500,000,000 lamports
4. **Create new transaction**: If amount is wrong, create a new one

**Correct amounts:**
- Wallet 1: 500,000,000 lamports (0.5 SOL)
- Wallet 2: 500,000,000 lamports (0.5 SOL)
- Total: 1,000,000,000 lamports (1 SOL)

#### Issue 4: "Sender mismatch" Error

**Symptoms:**
- Backend returns `SENDER_MISMATCH` error
- Verification fails even though transaction is valid

**Solutions:**
1. **Check wallet address**: Ensure you're using the correct address
2. **Copy from wallet**: Get address directly from your wallet app
3. **Case sensitive**: Solana addresses are case-sensitive
4. **No spaces**: Remove any leading/trailing spaces

**How to verify:**
```javascript
// Check your wallet address matches transaction sender
console.log('Wallet:', 'YOUR_WALLET_ADDRESS');
console.log('Transaction sender:', 'SENDER_FROM_EXPLORER');
// These must match exactly
```

#### Issue 5: "Duplicate signature" Error

**Symptoms:**
- Backend returns `DUPLICATE_SIGNATURE` error
- Transaction already used for another card

**Solutions:**
1. **Create new transaction**: Each card needs a unique transaction
2. **Check existing cards**: You may have already submitted with this signature
3. **Use different signature**: If testing, create a fresh transaction

**Prevention:**
- Keep a log of used transaction signatures
- Don't reuse signatures across multiple submissions

#### Issue 6: RPC Rate Limiting

**Symptoms:**
- Slow responses from backend
- Intermittent `RATE_LIMIT` errors
- 429 status codes

**Solutions:**
1. **Wait and retry**: Public RPC has rate limits
2. **Use paid RPC**: Consider QuickNode, Alchemy, or Helius
3. **Implement backoff**: Add exponential backoff in your code
4. **Cache results**: Don't repeatedly verify same transaction

**Recommended RPC providers:**
- QuickNode: https://www.quicknode.com
- Alchemy: https://www.alchemy.com
- Helius: https://www.helius.dev
- Triton: https://triton.one

#### Issue 7: Transaction Stuck/Pending

**Symptoms:**
- Transaction shows "Pending" for > 1 minute
- No confirmation received
- Not appearing on explorer

**Solutions:**
1. **Wait 2-3 minutes**: Network may be congested
2. **Check recent blockhash**: May have expired
3. **Increase priority fee**: Add compute budget instruction
4. **Retry transaction**: Create a new transaction

**How to check:**
```bash
# Check transaction status
solana confirm -v YOUR_TRANSACTION_SIGNATURE

# If stuck, check network status
solana cluster-version
```

#### Issue 8: Wrong Network

**Symptoms:**
- Transaction appears on Devnet but not Mainnet
- Backend can't find transaction
- Explorer shows different network

**Solutions:**
1. **Check wallet network**: Must be "Mainnet Beta"
2. **Verify RPC URL**: Should be `https://api.mainnet-beta.solana.com`
3. **Switch networks**: Change wallet to Mainnet
4. **Create new transaction**: On correct network

**Network indicators:**
- Mainnet Beta: Production network, real SOL
- Devnet: Test network, free test SOL
- Testnet: Test network for validators

#### Issue 9: Invalid Recipient Wallet

**Symptoms:**
- Backend returns `INVALID_RECIPIENT_WALLET_1` or `INVALID_RECIPIENT_WALLET_2`
- Transaction sent to wrong address

**Solutions:**
1. **Verify addresses**: Double-check treasury wallet addresses
2. **Copy carefully**: Use copy-paste, don't type manually
3. **Check both wallets**: Must send to BOTH treasury wallets
4. **Create new transactions**: If sent to wrong address

**Correct addresses:**
```
Wallet 1: BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt
Wallet 2: Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo
```

#### Issue 10: Transaction Failed on Chain

**Symptoms:**
- Explorer shows "Failed" status
- Red X or error indicator
- Error message in transaction logs

**Solutions:**
1. **Read error message**: Check program logs on explorer
2. **Common causes**:
   - Insufficient balance
   - Invalid account
   - Program error
3. **Create new transaction**: Failed transactions can't be reused
4. **Check account status**: Ensure recipient accounts exist

**How to diagnose:**
1. Open transaction on Solana Explorer
2. Scroll to "Program Logs" section
3. Look for error messages
4. Address the specific error and retry

### Getting Help

If you continue to experience issues:

1. **Check Backend Logs:**
   ```bash
   cd backend
   tail -f logs/app.log
   ```

2. **Enable Debug Mode:**
   ```bash
   DEBUG=* node server/index.js
   ```

3. **Test with Example Script:**
   ```bash
   cd backend
   ./example-test-transaction.sh
   ```

4. **Contact Support:**
   - GitHub Issues: [Repository URL]
   - Discord: [Community Link]
   - Email: support@gorweld.fun

---

## Best Practices

### For Testing

1. **Start Small**: Test with minimum amounts first (if possible on devnet)
2. **Keep Records**: Log all transaction signatures and timestamps
3. **Verify Immediately**: Check transactions on explorer right after sending
4. **Test Both Wallets**: Ensure both treasury wallets receive payment
5. **Monitor Fees**: Network fees vary, keep extra SOL for fees

### For Production

1. **Use Reliable RPC**: Consider paid RPC for production
2. **Implement Retries**: Handle rate limits gracefully
3. **Cache Verifications**: Don't re-verify same transaction repeatedly
4. **Monitor Treasury**: Regularly check treasury wallet balances
5. **Log Everything**: Keep detailed logs of all transactions

### Security Reminders

1. **Never Share Private Keys**: Keep your seed phrase secure
2. **Verify Addresses**: Always double-check recipient addresses
3. **Use Hardware Wallets**: For large amounts, use Ledger/Trezor
4. **Test Amounts**: Start with small amounts when testing
5. **Backup Wallet**: Keep secure backups of your wallet

---

## Quick Reference

### Transaction Requirements Checklist

- [ ] Wallet has > 1.01 SOL balance
- [ ] Connected to Mainnet Beta network
- [ ] First transaction: 0.5 SOL to `BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt`
- [ ] Second transaction: 0.5 SOL to `Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo`
- [ ] Both transactions confirmed (Success status)
- [ ] Transaction signatures copied and saved
- [ ] Transactions verified on Solana Explorer
- [ ] Ready to submit card with transaction signature

### Useful Commands

```bash
# Check SOL balance
solana balance YOUR_WALLET_ADDRESS

# Confirm transaction
solana confirm YOUR_TRANSACTION_SIGNATURE

# Get transaction details
solana transaction-history YOUR_WALLET_ADDRESS --limit 10

# Test backend verification
node backend/test-transaction-verification.js SIGNATURE WALLET

# Submit test card
curl -X POST http://localhost:3001/api/cards/submit -H "Content-Type: application/json" -d @test-card.json
```

### Important URLs

- Solana Explorer: https://explorer.solana.com
- Solscan: https://solscan.io
- Phantom Wallet: https://phantom.app
- Solflare Wallet: https://solflare.com
- Gorweld Platform: https://gorweld.fun
- Gorweld API: https://api.gorweld.com

---

## Conclusion

This guide provides comprehensive instructions for creating and testing mainnet transactions for the Gorweld platform. Always verify transactions on Solana Explorer before submitting to the backend, and keep detailed records of all transaction signatures for troubleshooting.

For additional support or questions, refer to the backend documentation or contact the development team.

**Happy Testing! 🚀**
