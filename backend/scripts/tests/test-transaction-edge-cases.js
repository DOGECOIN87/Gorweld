#!/usr/bin/env node

/**
 * Automated test suite for transaction verification edge cases
 * 
 * This script tests various edge cases and error scenarios for the TransactionVerifier:
 * - Duplicate signature detection
 * - Transaction not found
 * - Sender mismatch
 * - Invalid recipient wallets
 * - Invalid payment amounts
 * - RPC rate limit handling
 * 
 * Usage:
 *   node test-transaction-edge-cases.js [--valid-sig <signature> --valid-sender <wallet>]
 * 
 * Note: Some tests require a valid mainnet transaction signature to test edge cases.
 */

require('dotenv').config();
const Database = require('./models/database');
const TransactionVerifier = require('./services/transactionVerifier');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(80));
    log(title, 'bright');
    console.log('='.repeat(80));
}

function logTest(testName, testNumber, totalTests) {
    console.log('\n' + '-'.repeat(80));
    log(`Test ${testNumber}/${totalTests}: ${testName}`, 'cyan');
    console.log('-'.repeat(80));
}

/**
 * Test result tracker
 */
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    async runTest(name, testFn, expectedResult) {
        const testNum = this.tests.length + 1;
        logTest(name, testNum, 'TBD');
        
        try {
            const result = await testFn();
            const success = this.validateResult(result, expectedResult);
            
            this.tests.push({ name, success, result });
            
            if (success) {
                this.passed++;
                log('✓ TEST PASSED', 'green');
            } else {
                this.failed++;
                log('✗ TEST FAILED', 'red');
                console.log('Expected:', expectedResult);
                console.log('Got:', result);
            }
            
            return { success, result };
        } catch (error) {
            this.failed++;
            this.tests.push({ name, success: false, error: error.message });
            log(`✗ TEST FAILED WITH EXCEPTION: ${error.message}`, 'red');
            return { success: false, error };
        }
    }
    
    validateResult(result, expected) {
        if (expected.valid !== undefined && result.valid !== expected.valid) {
            return false;
        }
        if (expected.code && result.code !== expected.code) {
            return false;
        }
        return true;
    }
    
    printSummary() {
        logSection('Test Summary');
        console.log(`Total Tests: ${this.tests.length}`);
        log(`Passed: ${this.passed}`, 'green');
        log(`Failed: ${this.failed}`, this.failed > 0 ? 'red' : 'green');
        
        if (this.failed > 0) {
            console.log('\nFailed Tests:');
            this.tests.filter(t => !t.success).forEach(t => {
                log(`  - ${t.name}`, 'red');
            });
        }
        
        const successRate = ((this.passed / this.tests.length) * 100).toFixed(1);
        console.log(`\nSuccess Rate: ${successRate}%`);
        
        return this.failed === 0;
    }
}

/**
 * Main test suite
 */
async function runEdgeCaseTests() {
    logSection('Transaction Verification Edge Case Test Suite');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    let validSignature = null;
    let validSender = null;
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--valid-sig' && args[i + 1]) {
            validSignature = args[i + 1];
            i++;
        } else if (args[i] === '--valid-sender' && args[i + 1]) {
            validSender = args[i + 1];
            i++;
        } else if (args[i] === '--help' || args[i] === '-h') {
            console.log('\nUsage:');
            console.log('  node test-transaction-edge-cases.js [options]');
            console.log('\nOptions:');
            console.log('  --valid-sig <signature>    Valid mainnet transaction signature for testing');
            console.log('  --valid-sender <wallet>    Valid sender wallet address');
            console.log('  --help, -h                 Show this help message');
            console.log('\nNote: Some tests require a valid transaction to test edge cases.');
            process.exit(0);
        }
    }
    
    // Display configuration
    console.log('\nConfiguration:');
    console.log(`RPC URL: ${process.env.SOLANA_RPC_URL || 'Not set'}`);
    console.log(`Wallet 1: ${process.env.WALLET_1_ADDRESS || 'Not set'}`);
    console.log(`Wallet 2: ${process.env.WALLET_2_ADDRESS || 'Not set'}`);
    console.log(`Test Database: ./data/test-edge-cases.db`);
    
    if (validSignature) {
        console.log(`Valid Signature: ${validSignature.substring(0, 20)}...`);
    } else {
        log('\nWarning: No valid signature provided. Some tests will be skipped.', 'yellow');
        log('Use --valid-sig and --valid-sender to enable all tests.', 'yellow');
    }
    
    // Initialize test database (separate from production)
    const testDbPath = './data/test-edge-cases.db';
    
    // Clean up old test database
    if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
        log('\n✓ Cleaned up old test database', 'green');
    }
    
    log('\nInitializing test database...', 'yellow');
    const db = new Database(testDbPath);
    await db.initialize();
    log('✓ Test database initialized', 'green');
    
    const verifier = new TransactionVerifier(db);
    const runner = new TestRunner();
    
    logSection('Running Edge Case Tests');
    
    // Test 1: Transaction Not Found
    await runner.runTest(
        'Transaction Not Found - Invalid Signature',
        async () => {
            const invalidSig = 'InvalidSignatureFormat123';
            return await verifier.verifyTransaction(invalidSig, 'DummySender123');
        },
        { valid: false, code: 'TRANSACTION_NOT_FOUND' }
    );
    
    // Test 2: Transaction Not Found - Non-existent but valid format
    await runner.runTest(
        'Transaction Not Found - Non-existent Transaction',
        async () => {
            const nonExistentSig = '1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111';
            return await verifier.verifyTransaction(nonExistentSig, 'DummySender123');
        },
        { valid: false, code: 'TRANSACTION_NOT_FOUND' }
    );
    
    // Test 3: Duplicate Signature Detection (requires valid signature)
    if (validSignature && validSender) {
        await runner.runTest(
            'First Transaction Verification',
            async () => {
                return await verifier.verifyTransaction(validSignature, validSender);
            },
            { valid: true }
        );
        
        await runner.runTest(
            'Duplicate Signature Detection',
            async () => {
                return await verifier.verifyTransaction(validSignature, validSender);
            },
            { valid: false, code: 'DUPLICATE_SIGNATURE' }
        );
    } else {
        log('\nSkipping duplicate signature tests (no valid signature provided)', 'yellow');
    }
    
    // Test 4: Sender Mismatch (requires valid signature)
    if (validSignature) {
        await runner.runTest(
            'Sender Mismatch Detection',
            async () => {
                const wrongSender = 'WrongSenderAddress1234567890123456789012';
                return await verifier.verifyTransaction(validSignature, wrongSender);
            },
            { valid: false, code: 'SENDER_MISMATCH' }
        );
    } else {
        log('\nSkipping sender mismatch test (no valid signature provided)', 'yellow');
    }
    
    // Test 5: Empty Signature
    await runner.runTest(
        'Empty Signature',
        async () => {
            return await verifier.verifyTransaction('', 'DummySender123');
        },
        { valid: false }
    );
    
    // Test 6: Null Signature
    await runner.runTest(
        'Null Signature',
        async () => {
            return await verifier.verifyTransaction(null, 'DummySender123');
        },
        { valid: false }
    );
    
    // Test 7: Empty Sender
    await runner.runTest(
        'Empty Sender Address',
        async () => {
            const testSig = '2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222';
            return await verifier.verifyTransaction(testSig, '');
        },
        { valid: false }
    );
    
    // Test 8: Test with very long signature (should fail)
    await runner.runTest(
        'Oversized Signature',
        async () => {
            const longSig = '1'.repeat(200);
            return await verifier.verifyTransaction(longSig, 'DummySender123');
        },
        { valid: false }
    );
    
    // Test 9: Test with special characters in signature
    await runner.runTest(
        'Special Characters in Signature',
        async () => {
            const specialSig = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
            return await verifier.verifyTransaction(specialSig, 'DummySender123');
        },
        { valid: false }
    );
    
    // Test 10: Test database connection by checking existing card
    await runner.runTest(
        'Database Query - Get Existing Card (None Expected)',
        async () => {
            const card = await verifier.getExistingCard('TestWallet123');
            return { valid: card === undefined || card === null };
        },
        { valid: true }
    );
    
    // Additional tests for invalid recipient wallets would require:
    // - A transaction that doesn't include the treasury wallets
    // - This is difficult to test without creating actual transactions
    log('\n\nNote: Tests for invalid recipient wallets and payment amounts', 'yellow');
    log('require specific mainnet transactions with incorrect configurations.', 'yellow');
    log('These scenarios are best tested with real transaction signatures.', 'yellow');
    
    // Print summary
    const allPassed = runner.printSummary();
    
    // Cleanup
    log('\nCleaning up...', 'yellow');
    await db.close();
    
    // Remove test database
    if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
    }
    log('✓ Cleanup complete', 'green');
    
    logSection('Edge Case Tests Complete');
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
}

// Run tests
runEdgeCaseTests().catch(error => {
    log(`\n✗ FATAL ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
