#!/bin/bash

# Example script for testing transaction verification
# This demonstrates how to use the transaction verification test scripts

echo "=========================================="
echo "Transaction Verification Test Examples"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js to run these tests"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found"
    echo "Copying from .env.example..."
    cp .env.example .env
    echo "Please update .env with your actual configuration"
    echo ""
fi

echo "Available test commands:"
echo ""
echo "1. Run edge case tests (automated):"
echo "   npm run test:edge-cases"
echo ""
echo "2. Test with a valid mainnet transaction:"
echo "   npm run test:transaction <signature> <sender_wallet>"
echo ""
echo "3. Run edge cases with a valid transaction for additional tests:"
echo "   npm run test:edge-cases -- --valid-sig <signature> --valid-sender <wallet>"
echo ""
echo "=========================================="
echo ""

# Example 1: Run edge case tests
echo "Example 1: Running automated edge case tests..."
echo "Command: npm run test:edge-cases"
echo ""
read -p "Press Enter to run this test (or Ctrl+C to skip)..."
npm run test:edge-cases
echo ""

# Example 2: Show how to test with a real transaction
echo "=========================================="
echo "Example 2: Testing with a real mainnet transaction"
echo "=========================================="
echo ""
echo "To test with a real transaction, you need:"
echo "  1. A valid Solana mainnet transaction signature"
echo "  2. The sender wallet address"
echo ""
echo "Example command:"
echo "  npm run test:transaction 5J7xK2... 9AbcDef..."
echo ""
echo "To get a test transaction:"
echo "  1. Send 1 SOL on mainnet split between:"
echo "     - 0.5 SOL to: BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt"
echo "     - 0.5 SOL to: Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo"
echo "  2. Copy the transaction signature from your wallet"
echo "  3. Run the test with your signature and wallet address"
echo ""

# Check if user provided a signature
if [ -n "$1" ] && [ -n "$2" ]; then
    echo "Running test with provided signature..."
    npm run test:transaction "$1" "$2"
else
    echo "No transaction signature provided. Skipping real transaction test."
    echo "To test with a real transaction, run:"
    echo "  ./example-test-transaction.sh <signature> <sender_wallet>"
fi

echo ""
echo "=========================================="
echo "Test examples complete!"
echo "=========================================="
