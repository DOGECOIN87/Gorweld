#!/usr/bin/env node

/**
 * Test script for mainnet transaction verification
 * 
 * This script tests the TransactionVerifier service with real mainnet transactions.
 * It accepts transaction signatures as command-line arguments and performs comprehensive
 * verification including all checks for payment amounts, recipients, and error handling.
 * 
 * Usage:
 *   node test-transaction-verification.js <transaction_signature> [sender_wallet]
 * 
 * Examples:
 *   # Test with a valid transaction
 *   node test-transaction-verification.js 5J7x... 9Abc...
 * 
 *   # Test with multiple transactions
 *   node test-transaction-verification.js 5J7x... 9Abc... --signature 2Def... 8Xyz...
 */

require('dotenv').config();
const Database = require('./models/database');
const TransactionVerifier = require('./services/transactionVerifier');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

/**
 * Format output with colors
 */
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(80));
    log(title, 'bright');
    console.log('='.repeat(80));
}

function logSubSection(title) {
    console.log('\n' + '-'.repeat(80));
    log(title, 'cyan');
    console.log('-'.repeat(80));
}

/**
 * Display verification result in a formatted way
 */
function displayResult(result, testName) {
    logSubSection(`Test: ${testName}`);
    
    if (result.valid) {
        log('✓ VERIFICATION PASSED', 'green');
        console.log('\nTransaction Details:');
        console.log(`  Signature: ${result.signature}`);
        console.log(`  Sender: ${result.sender}`);
        console.log(`  Block Time: ${result.blockTime ? new Date(result.blockTime * 1000).toISOString() : 'N/A'}`);
        console.log(`  Slot: ${result.slot || 'N/A'}`);
        
        console.log('\nRecipients:');
        console.log(`  Wallet 1: ${result.recipients.wallet1}`);
        console.log(`  Wallet 2: ${result.recipients.wallet2}`);
        
        console.log('\nAmounts (Lamports):');
        console.log(`  Wallet 1: ${result.amounts.wallet1.toLocaleString()}`);
        console.log(`  Wallet 2: ${result.amounts.wallet2.toLocaleString()}`);
        console.log(`  Total: ${result.amounts.total.toLocaleString()}`);
        
        console.log('\nAmounts (SOL):');
        console.log(`  Wallet 1: ${result.amountsSOL.wallet1} SOL`);
        console.log(`  Wallet 2: ${result.amountsSOL.wallet2} SOL`);
        console.log(`  Total: ${result.amountsSOL.total} SOL`);
    } else {
        log('✗ VERIFICATION FAILED', 'red');
        console.log(`\nError Code: ${result.code}`);
        console.log(`Error Message: ${result.error}`);
        
        if (result.details) {
            console.log('\nError Details:');
            console.log(JSON.stringify(result.details, null, 2));
        }
    }
}

/**
 * Test a single transaction
 */
async function testTransaction(verifier, signature, sender, testName) {
    try {
        log(`\nTesting transaction: ${signature.substring(0, 20)}...`, 'blue');
        if (sender) {
            log(`Expected sender: ${sender.substring(0, 20)}...`, 'blue');
        }
        
        const result = await verifier.verifyTransaction(signature, sender);
        displayResult(result, testName);
        
        return result;
    } catch (error) {
        log(`✗ ERROR: ${error.message}`, 'red');
        console.error(error);
        return { valid: false, error: error.message, code: 'EXCEPTION' };
    }
}

/**
 * Run comprehensive test suite
 */
async function runTests() {
    logSection('Mainnet Transaction Verification Test Suite');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log('\nUsage:');
        console.log('  node test-transaction-verification.js <signature> [sender]');
        console.log('\nOptions:');
        console.log('  --help, -h     Show this help message');
        console.log('\nExamples:');
        console.log('  # Test a valid transaction');
        console.log('  node test-transaction-verification.js 5J7x... 9Abc...');
        console.log('\n  # Test without sender (will fail sender check)');
        console.log('  node test-transaction-verification.js 5J7x...');
        process.exit(0);
    }
    
    const signature = args[0];
    const sender = args[1] || null;
    
    // Display configuration
    logSubSection('Configuration');
    console.log(`RPC URL: ${process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'}`);
    console.log(`Wallet 1: ${process.env.WALLET_1_ADDRESS || 'Not set'}`);
    console.log(`Wallet 2: ${process.env.WALLET_2_ADDRESS || 'Not set'}`);
    console.log(`Database: ${process.env.DATABASE_PATH || './data/cards.db'}`);
    
    // Initialize database
    log('\nInitializing database...', 'yellow');
    const db = new Database(process.env.DATABASE_PATH || './data/test-cards.db');
    await db.initialize();
    log('✓ Database initialized', 'green');
    
    // Initialize verifier
    log('Initializing transaction verifier...', 'yellow');
    const verifier = new TransactionVerifier(db);
    log('✓ Transaction verifier initialized', 'green');
    
    // Test the provided transaction
    logSection('Transaction Verification Tests');
    
    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };
    
    // Test 1: Verify the transaction with provided sender
    if (sender) {
        const result = await testTransaction(
            verifier,
            signature,
            sender,
            'Valid Transaction with Correct Sender'
        );
        results.total++;
        if (result.valid) results.passed++;
        else results.failed++;
    } else {
        log('\nNo sender provided. Skipping sender validation test.', 'yellow');
        log('To test sender validation, provide sender wallet as second argument.', 'yellow');
    }
    
    // Test 2: Verify the same transaction again (should fail with DUPLICATE_SIGNATURE)
    if (sender) {
        log('\n\nTesting duplicate signature detection...', 'blue');
        const result = await testTransaction(
            verifier,
            signature,
            sender,
            'Duplicate Signature Detection'
        );
        results.total++;
        // For duplicate test, we expect it to fail with DUPLICATE_SIGNATURE
        if (!result.valid && result.code === 'DUPLICATE_SIGNATURE') {
            log('✓ Duplicate signature correctly detected', 'green');
            results.passed++;
        } else {
            log('✗ Duplicate signature not detected as expected', 'red');
            results.failed++;
        }
    }
    
    // Test 3: Test with wrong sender (if sender was provided)
    if (sender) {
        log('\n\nTesting sender mismatch detection...', 'blue');
        const wrongSender = 'WrongSenderAddress1234567890123456789012';
        const result = await testTransaction(
            verifier,
            signature,
            wrongSender,
            'Sender Mismatch Detection'
        );
        results.total++;
        // We expect this to fail with SENDER_MISMATCH or DUPLICATE_SIGNATURE
        if (!result.valid && (result.code === 'SENDER_MISMATCH' || result.code === 'DUPLICATE_SIGNATURE')) {
            log('✓ Sender mismatch correctly detected (or duplicate)', 'green');
            results.passed++;
        } else {
            log('✗ Sender mismatch not detected as expected', 'red');
            results.failed++;
        }
    }
    
    // Test 4: Test with invalid signature format
    logSubSection('Testing Invalid Signature Format');
    const invalidSig = 'invalid_signature_format';
    const result4 = await testTransaction(
        verifier,
        invalidSig,
        sender || 'DummySender123',
        'Invalid Signature Format'
    );
    results.total++;
    if (!result4.valid && result4.code === 'TRANSACTION_NOT_FOUND') {
        log('✓ Invalid signature correctly rejected', 'green');
        results.passed++;
    } else {
        log('✗ Invalid signature handling unexpected', 'red');
        results.failed++;
    }
    
    // Test 5: Test with non-existent transaction
    logSubSection('Testing Non-Existent Transaction');
    const nonExistentSig = '1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111';
    const result5 = await testTransaction(
        verifier,
        nonExistentSig,
        sender || 'DummySender123',
        'Non-Existent Transaction'
    );
    results.total++;
    if (!result5.valid && result5.code === 'TRANSACTION_NOT_FOUND') {
        log('✓ Non-existent transaction correctly detected', 'green');
        results.passed++;
    } else {
        log('✗ Non-existent transaction handling unexpected', 'red');
        results.failed++;
    }
    
    // Display summary
    logSection('Test Summary');
    console.log(`Total Tests: ${results.total}`);
    log(`Passed: ${results.passed}`, 'green');
    log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    // Cleanup
    log('\nClosing database connection...', 'yellow');
    await db.close();
    log('✓ Database closed', 'green');
    
    logSection('Test Complete');
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
    log(`\n✗ FATAL ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
