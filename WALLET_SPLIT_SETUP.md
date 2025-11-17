# 🔄 50/50 Wallet Split Configuration Guide

This document explains how to configure the dual wallet payment system for Gorweld.

## 📋 Overview

The Gorweld dApp now splits all incoming payments 50/50 between two Solana wallet addresses:
- **Wallet 1**: Receives 50% of each payment (+ any odd lamport)
- **Wallet 2**: Receives 50% of each payment

For a 1 SOL payment (1,000,000,000 lamports):
- Wallet 1: 500,000,000 lamports (0.5 SOL)
- Wallet 2: 500,000,000 lamports (0.5 SOL)

## ⚙️ Configuration Steps

### 1. Frontend Configuration

Update the wallet addresses in both config files:

**Development (`Gorweld/config.js`):**
```javascript
solana: {
    network: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    wallet1Address: 'YOUR_WALLET_1_ADDRESS_HERE',
    wallet2Address: 'YOUR_WALLET_2_ADDRESS_HERE',
    // ...
}
```

**Production (`Gorweld/config.production.js`):**
```javascript
solana: {
    network: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wallet1Address: 'YOUR_PRODUCTION_WALLET_1_ADDRESS',
    wallet2Address: 'YOUR_PRODUCTION_WALLET_2_ADDRESS',
    // ...
}
```

### 2. Backend Configuration

Update the environment variables in `backend/.env`:

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_1_ADDRESS=YOUR_WALLET_1_ADDRESS_HERE
WALLET_2_ADDRESS=YOUR_WALLET_2_ADDRESS_HERE
# Legacy single treasury address (for backward compatibility)
TREASURY_WALLET_ADDRESS=YOUR_WALLET_1_ADDRESS_HERE
```

For production, use mainnet RPC URL and production wallet addresses.

## 🧪 Testing

### 1. Run Split Logic Tests
```bash
cd backend
npm run test-split
```

### 2. Test on Devnet
1. Configure devnet wallet addresses
2. Fund test wallets with devnet SOL
3. Submit a test card
4. Verify both wallets received 0.5 SOL each

### 3. Verify Transaction
Check the transaction on Solana Explorer to confirm:
- Two transfer instructions exist
- Each transfers exactly 0.5 SOL
- Both recipient addresses are correct

## 🔒 Security Considerations

1. **Wallet Security**: Ensure both wallet addresses are controlled by trusted parties
2. **Address Validation**: The system validates addresses before creating transactions
3. **Transaction Verification**: Backend verifies the exact split amounts on-chain
4. **Duplicate Prevention**: Transaction signatures are tracked to prevent reuse

## 🚨 Important Notes

- **Exact Split Required**: Transactions must split exactly 50/50 or they will be rejected
- **Odd Lamports**: Any odd lamport goes to Wallet 1 (e.g., 1.000000001 SOL → 0.500000001 + 0.5)
- **Both Wallets Required**: Both wallet addresses must be present in the transaction
- **Network Consistency**: Frontend and backend must use the same network (devnet/mainnet)

## 🔧 Troubleshooting

### Common Issues:

1. **"Wallet address not configured"**
   - Solution: Update config files with actual wallet addresses

2. **"Transaction does not follow 50/50 split pattern"**
   - Solution: Ensure frontend creates two equal transfer instructions

3. **"Wallet X address not found in transaction"**
   - Solution: Verify wallet addresses are correct and reachable

### Debug Information:

The payment system logs detailed split information:
- Wallet addresses being used
- Split amounts in lamports and SOL
- Transaction creation details

## 📞 Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify wallet addresses are valid Solana addresses
3. Ensure sufficient balance for payment + transaction fees
4. Test on devnet before mainnet deployment

## 🧪 Current Configuration

**Network**: Solana Mainnet-Beta ✅

**Configured Wallet Addresses:**
- **Wallet 1**: `BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt`
- **Wallet 2**: `Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo`
- **Status**: ✅ Configured for mainnet production

**⚠️ IMPORTANT**: The system is now configured for Solana mainnet. All transactions will use real SOL.

---

**Next Steps**: 
1. ✅ Test the split logic on devnet with the configured test addresses
2. ⏳ Provide mainnet wallet addresses for production deployment