#!/usr/bin/env node

/**
 * Solana Mainnet Configuration Verification Script
 * 
 * This script verifies that all Solana mainnet configuration is correctly set
 * across both frontend and backend components.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Expected configuration values
const EXPECTED_CONFIG = {
    network: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wallet1Address: 'BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt',
    wallet2Address: 'Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo',
    paymentAmount: 1,
    commitment: 'confirmed'
};

// Verification results
const results = {
    passed: [],
    failed: [],
    warnings: []
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(70));
    log(title, 'cyan');
    console.log('='.repeat(70));
}

function pass(message) {
    results.passed.push(message);
    log(`✓ ${message}`, 'green');
}

function fail(message) {
    results.failed.push(message);
    log(`✗ ${message}`, 'red');
}

function warn(message) {
    results.warnings.push(message);
    log(`⚠ ${message}`, 'yellow');
}

function verifyFrontendConfig(configPath, configName) {
    logSection(`Verifying ${configName}`);
    
    if (!fs.existsSync(configPath)) {
        fail(`${configName} file not found at ${configPath}`);
        return;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check network setting
    if (configContent.includes(`network: '${EXPECTED_CONFIG.network}'`)) {
        pass(`Network set to ${EXPECTED_CONFIG.network}`);
    } else {
        fail(`Network not set to ${EXPECTED_CONFIG.network}`);
    }
    
    // Check RPC URL
    if (configContent.includes(`rpcUrl: '${EXPECTED_CONFIG.rpcUrl}'`)) {
        pass(`RPC URL set to ${EXPECTED_CONFIG.rpcUrl}`);
    } else {
        fail(`RPC URL not set to ${EXPECTED_CONFIG.rpcUrl}`);
    }
    
    // Check wallet 1 address
    if (configContent.includes(`wallet1Address: '${EXPECTED_CONFIG.wallet1Address}'`)) {
        pass(`Wallet 1 address correctly set`);
    } else {
        fail(`Wallet 1 address not correctly set`);
    }
    
    // Check wallet 2 address
    if (configContent.includes(`wallet2Address: '${EXPECTED_CONFIG.wallet2Address}'`)) {
        pass(`Wallet 2 address correctly set`);
    } else {
        fail(`Wallet 2 address not correctly set`);
    }
    
    // Check payment amount
    if (configContent.includes(`paymentAmount: ${EXPECTED_CONFIG.paymentAmount}`)) {
        pass(`Payment amount set to ${EXPECTED_CONFIG.paymentAmount} SOL`);
    } else {
        fail(`Payment amount not set to ${EXPECTED_CONFIG.paymentAmount} SOL`);
    }
    
    // Check commitment level
    if (configContent.includes(`commitment: '${EXPECTED_CONFIG.commitment}'`)) {
        pass(`Commitment level set to ${EXPECTED_CONFIG.commitment}`);
    } else {
        fail(`Commitment level not set to ${EXPECTED_CONFIG.commitment}`);
    }
    
    // Check production API URL
    if (configContent.includes(`production: 'https://api.gorweld.com/api'`)) {
        pass(`Production API URL correctly set`);
    } else {
        fail(`Production API URL not correctly set`);
    }
    
    // Check if config is frozen
    if (configContent.includes('Object.freeze(GorweldConfig)')) {
        pass(`Configuration object is frozen (immutable)`);
    } else {
        warn(`Configuration object is not frozen`);
    }
}

function verifyBackendEnvExample() {
    logSection('Verifying Backend .env.example');
    
    const envPath = path.join(__dirname, 'backend', '.env.example');
    
    if (!fs.existsSync(envPath)) {
        fail('.env.example file not found');
        return;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check SOLANA_RPC_URL
    if (envContent.includes(`SOLANA_RPC_URL=${EXPECTED_CONFIG.rpcUrl}`)) {
        pass(`SOLANA_RPC_URL set to ${EXPECTED_CONFIG.rpcUrl}`);
    } else {
        fail(`SOLANA_RPC_URL not set to ${EXPECTED_CONFIG.rpcUrl}`);
    }
    
    // Check WALLET_1_ADDRESS
    if (envContent.includes(`WALLET_1_ADDRESS=${EXPECTED_CONFIG.wallet1Address}`)) {
        pass(`WALLET_1_ADDRESS correctly set`);
    } else {
        fail(`WALLET_1_ADDRESS not correctly set`);
    }
    
    // Check WALLET_2_ADDRESS
    if (envContent.includes(`WALLET_2_ADDRESS=${EXPECTED_CONFIG.wallet2Address}`)) {
        pass(`WALLET_2_ADDRESS correctly set`);
    } else {
        fail(`WALLET_2_ADDRESS not correctly set`);
    }
    
    // Check for required environment variables
    const requiredVars = [
        'SOLANA_RPC_URL',
        'WALLET_1_ADDRESS',
        'WALLET_2_ADDRESS',
        'PORT',
        'NODE_ENV',
        'DATABASE_PATH'
    ];
    
    requiredVars.forEach(varName => {
        if (envContent.includes(`${varName}=`)) {
            pass(`Environment variable ${varName} is defined`);
        } else {
            fail(`Environment variable ${varName} is missing`);
        }
    });
}

function verifyBackendCode() {
    logSection('Verifying Backend Code');
    
    // Check transactionVerifier.js
    const verifierPath = path.join(__dirname, 'backend', 'services', 'transactionVerifier.js');
    
    if (!fs.existsSync(verifierPath)) {
        fail('transactionVerifier.js not found');
        return;
    }
    
    const verifierContent = fs.readFileSync(verifierPath, 'utf8');
    
    // Check environment variable usage
    if (verifierContent.includes('process.env.SOLANA_RPC_URL')) {
        pass('Transaction verifier uses SOLANA_RPC_URL environment variable');
    } else {
        fail('Transaction verifier does not use SOLANA_RPC_URL environment variable');
    }
    
    if (verifierContent.includes('process.env.WALLET_1_ADDRESS')) {
        pass('Transaction verifier uses WALLET_1_ADDRESS environment variable');
    } else {
        fail('Transaction verifier does not use WALLET_1_ADDRESS environment variable');
    }
    
    if (verifierContent.includes('process.env.WALLET_2_ADDRESS')) {
        pass('Transaction verifier uses WALLET_2_ADDRESS environment variable');
    } else {
        fail('Transaction verifier does not use WALLET_2_ADDRESS environment variable');
    }
    
    // Check commitment level
    if (verifierContent.includes("'confirmed'")) {
        pass('Transaction verifier uses "confirmed" commitment level');
    } else {
        warn('Transaction verifier commitment level may not be set to "confirmed"');
    }
    
    // Check payment amount calculation
    if (verifierContent.includes('LAMPORTS_PER_SOL')) {
        pass('Payment amount uses LAMPORTS_PER_SOL constant');
    } else {
        fail('Payment amount does not use LAMPORTS_PER_SOL constant');
    }
    
    // Check for payment split logic
    if (verifierContent.includes('Math.floor(this.requiredAmount / 2)')) {
        pass('Payment split logic implemented (0.5 SOL to each wallet)');
    } else {
        fail('Payment split logic not found');
    }
}

function verifyConfigConsistency() {
    logSection('Verifying Configuration Consistency');
    
    // Compare frontend configs
    const configPath = path.join(__dirname, 'Gorweld', 'config.js');
    const configProdPath = path.join(__dirname, 'Gorweld', 'config.production.js');
    
    if (fs.existsSync(configPath) && fs.existsSync(configProdPath)) {
        const config = fs.readFileSync(configPath, 'utf8');
        const configProd = fs.readFileSync(configProdPath, 'utf8');
        
        // Check if wallet addresses match
        const wallet1Match = config.includes(EXPECTED_CONFIG.wallet1Address) && 
                            configProd.includes(EXPECTED_CONFIG.wallet1Address);
        const wallet2Match = config.includes(EXPECTED_CONFIG.wallet2Address) && 
                            configProd.includes(EXPECTED_CONFIG.wallet2Address);
        
        if (wallet1Match && wallet2Match) {
            pass('Wallet addresses consistent across config.js and config.production.js');
        } else {
            fail('Wallet addresses inconsistent between config files');
        }
        
        // Check if RPC URLs match
        if (config.includes(EXPECTED_CONFIG.rpcUrl) && configProd.includes(EXPECTED_CONFIG.rpcUrl)) {
            pass('RPC URL consistent across config.js and config.production.js');
        } else {
            fail('RPC URL inconsistent between config files');
        }
    }
    
    // Check frontend vs backend consistency
    const envPath = path.join(__dirname, 'backend', '.env.example');
    if (fs.existsSync(configPath) && fs.existsSync(envPath)) {
        const config = fs.readFileSync(configPath, 'utf8');
        const env = fs.readFileSync(envPath, 'utf8');
        
        if (config.includes(EXPECTED_CONFIG.wallet1Address) && 
            env.includes(EXPECTED_CONFIG.wallet1Address)) {
            pass('Wallet 1 address consistent between frontend and backend');
        } else {
            fail('Wallet 1 address inconsistent between frontend and backend');
        }
        
        if (config.includes(EXPECTED_CONFIG.wallet2Address) && 
            env.includes(EXPECTED_CONFIG.wallet2Address)) {
            pass('Wallet 2 address consistent between frontend and backend');
        } else {
            fail('Wallet 2 address inconsistent between frontend and backend');
        }
        
        if (config.includes(EXPECTED_CONFIG.rpcUrl) && 
            env.includes(EXPECTED_CONFIG.rpcUrl)) {
            pass('RPC URL consistent between frontend and backend');
        } else {
            fail('RPC URL inconsistent between frontend and backend');
        }
    }
}

function printSummary() {
    logSection('Verification Summary');
    
    console.log(`\nTotal Checks: ${results.passed.length + results.failed.length + results.warnings.length}`);
    log(`Passed: ${results.passed.length}`, 'green');
    log(`Failed: ${results.failed.length}`, 'red');
    log(`Warnings: ${results.warnings.length}`, 'yellow');
    
    if (results.failed.length > 0) {
        console.log('\n' + '='.repeat(70));
        log('FAILED CHECKS:', 'red');
        console.log('='.repeat(70));
        results.failed.forEach(msg => log(`  • ${msg}`, 'red'));
    }
    
    if (results.warnings.length > 0) {
        console.log('\n' + '='.repeat(70));
        log('WARNINGS:', 'yellow');
        console.log('='.repeat(70));
        results.warnings.forEach(msg => log(`  • ${msg}`, 'yellow'));
    }
    
    console.log('\n' + '='.repeat(70));
    if (results.failed.length === 0) {
        log('✓ ALL CONFIGURATION CHECKS PASSED!', 'green');
        log('The system is correctly configured for Solana mainnet-beta.', 'green');
    } else {
        log('✗ CONFIGURATION VERIFICATION FAILED', 'red');
        log('Please fix the issues above before deploying to production.', 'red');
    }
    console.log('='.repeat(70) + '\n');
    
    // Exit with appropriate code
    process.exit(results.failed.length > 0 ? 1 : 0);
}

// Main execution
function main() {
    log('\n🔍 Solana Mainnet Configuration Verification', 'blue');
    log('This script verifies mainnet-beta configuration across frontend and backend\n', 'blue');
    
    // Verify frontend configs
    verifyFrontendConfig(
        path.join(__dirname, 'Gorweld', 'config.js'),
        'Frontend config.js'
    );
    
    verifyFrontendConfig(
        path.join(__dirname, 'Gorweld', 'config.production.js'),
        'Frontend config.production.js'
    );
    
    // Verify backend configuration
    verifyBackendEnvExample();
    verifyBackendCode();
    
    // Verify consistency across components
    verifyConfigConsistency();
    
    // Print summary
    printSummary();
}

// Run the script
main();
