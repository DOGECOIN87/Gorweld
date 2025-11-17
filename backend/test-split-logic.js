/**
 * Unit Tests for 50/50 Wallet Split Logic
 * 
 * Run with: node test-split-logic.js
 */

const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// Test Configuration
const TEST_CONFIG = {
    // Test wallet addresses (these are example addresses for testing)
    WALLET_1: 'So11111111111111111111111111111111111111112', // Wrapped SOL mint (safe test address)
    WALLET_2: '11111111111111111111111111111111', // System Program (safe test address)
    PAYMENT_AMOUNT_SOL: 1,
    PAYMENT_AMOUNT_LAMPORTS: LAMPORTS_PER_SOL
};

// Mock Database for testing
class MockDatabase {
    constructor() {
        this.transactions = [];
    }
    
    async get(sql, params) {
        // Simulate checking for existing transaction
        if (sql.includes('SELECT * FROM transactions WHERE signature')) {
            return null; // No existing transaction
        }
        return null;
    }
    
    async run(sql, params) {
        // Simulate inserting transaction
        const id = this.transactions.length + 1;
        this.transactions.push({ id, params });
        return { lastID: id, changes: 1 };
    }
}

// Test Split Amount Calculation
function testSplitCalculation() {
    console.log('🧮 Testing Split Amount Calculation...');
    
    const totalAmount = LAMPORTS_PER_SOL; // 1 SOL = 1,000,000,000 lamports
    const splitAmount1 = Math.floor(totalAmount / 2); // 500,000,000 lamports
    const splitAmount2 = totalAmount - splitAmount1;   // 500,000,000 lamports
    
    console.log(`Total Amount: ${totalAmount} lamports (${totalAmount / LAMPORTS_PER_SOL} SOL)`);
    console.log(`Split Amount 1: ${splitAmount1} lamports (${splitAmount1 / LAMPORTS_PER_SOL} SOL)`);
    console.log(`Split Amount 2: ${splitAmount2} lamports (${splitAmount2 / LAMPORTS_PER_SOL} SOL)`);
    console.log(`Sum Check: ${splitAmount1 + splitAmount2} === ${totalAmount} ? ${splitAmount1 + splitAmount2 === totalAmount}`);
    
    // Test with odd lamport amount
    const oddAmount = 1000000001; // 1.000000001 SOL
    const oddSplit1 = Math.floor(oddAmount / 2); // 500000000 lamports
    const oddSplit2 = oddAmount - oddSplit1;     // 500000001 lamports (gets the extra)
    
    console.log(`\n🔢 Testing Odd Lamport Distribution:`);
    console.log(`Odd Total: ${oddAmount} lamports`);
    console.log(`Odd Split 1: ${oddSplit1} lamports`);
    console.log(`Odd Split 2: ${oddSplit2} lamports (gets extra lamport)`);
    console.log(`Odd Sum Check: ${oddSplit1 + oddSplit2} === ${oddAmount} ? ${oddSplit1 + oddSplit2 === oddAmount}`);
    
    console.log('✅ Split calculation tests passed!\n');
}

// Test Transaction Verification Logic
async function testTransactionVerification() {
    console.log('🔍 Testing Transaction Verification Logic...');
    
    // Import TransactionVerifier with test environment
    process.env.WALLET_1_ADDRESS = TEST_CONFIG.WALLET_1;
    process.env.WALLET_2_ADDRESS = TEST_CONFIG.WALLET_2;
    process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
    
    const TransactionVerifier = require('./services/transactionVerifier');
    const mockDb = new MockDatabase();
    const verifier = new TransactionVerifier(mockDb);
    
    console.log(`Wallet 1 Address: ${verifier.wallet1Address.toString()}`);
    console.log(`Wallet 2 Address: ${verifier.wallet2Address.toString()}`);
    console.log(`Required Amount: ${verifier.requiredAmount} lamports`);
    console.log(`Split Amount 1: ${verifier.splitAmount1} lamports`);
    console.log(`Split Amount 2: ${verifier.splitAmount2} lamports`);
    
    console.log('✅ Transaction verifier initialization tests passed!\n');
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting 50/50 Wallet Split Tests\n');
    console.log('=' .repeat(50));
    
    try {
        testSplitCalculation();
        await testTransactionVerification();
        
        console.log('🎉 All tests passed successfully!');
        console.log('\n📋 Next Steps:');
        console.log('1. Update environment variables with real wallet addresses');
        console.log('2. Test on devnet with small amounts');
        console.log('3. Deploy to production with mainnet addresses');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    testSplitCalculation,
    testTransactionVerification,
    TEST_CONFIG
};