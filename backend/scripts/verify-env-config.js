#!/usr/bin/env node

/**
 * Environment Configuration Verification Script
 * 
 * This script validates all required environment variables for the Gorweld backend
 * and ensures the system is properly configured before deployment.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */

require('dotenv').config();
const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Track validation results
const results = {
    passed: [],
    failed: [],
    warnings: []
};

/**
 * Print colored output to console
 */
function print(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function printHeader(title) {
    print('\n' + '='.repeat(60), 'cyan');
    print(`  ${title}`, 'cyan');
    print('='.repeat(60), 'cyan');
}

/**
 * Print check result
 */
function printCheck(name, passed, message = '') {
    const symbol = passed ? '✓' : '✗';
    const color = passed ? 'green' : 'red';
    print(`${symbol} ${name}`, color);
    if (message) {
        print(`  ${message}`, color);
    }
}

/**
 * Validate that a required environment variable is present
 */
function checkEnvVariable(name, description) {
    const value = process.env[name];
    const passed = value && value.trim() !== '';
    
    if (passed) {
        results.passed.push(`${name}: ${description}`);
        printCheck(name, true, `Value: ${value}`);
    } else {
        results.failed.push(`${name}: ${description} - MISSING`);
        printCheck(name, false, `Missing required environment variable`);
    }
    
    return { passed, value };
}

/**
 * Validate Solana wallet address format
 */
function isValidSolanaAddress(address) {
    try {
        // Solana addresses are base58 encoded and typically 32-44 characters
        if (!address || typeof address !== 'string') {
            return false;
        }
        
        // Try to create a PublicKey - this will throw if invalid
        new PublicKey(address);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Validate wallet addresses
 */
async function validateWalletAddresses() {
    printHeader('Wallet Address Validation');
    
    // Check WALLET_1_ADDRESS
    const wallet1Check = checkEnvVariable('WALLET_1_ADDRESS', 'First treasury wallet address');
    if (wallet1Check.passed) {
        const isValid = isValidSolanaAddress(wallet1Check.value);
        if (isValid) {
            results.passed.push('WALLET_1_ADDRESS format is valid');
            printCheck('WALLET_1_ADDRESS format', true, 'Valid Solana address');
        } else {
            results.failed.push('WALLET_1_ADDRESS format is invalid');
            printCheck('WALLET_1_ADDRESS format', false, 'Invalid Solana address format');
        }
    }
    
    // Check WALLET_2_ADDRESS
    const wallet2Check = checkEnvVariable('WALLET_2_ADDRESS', 'Second treasury wallet address');
    if (wallet2Check.passed) {
        const isValid = isValidSolanaAddress(wallet2Check.value);
        if (isValid) {
            results.passed.push('WALLET_2_ADDRESS format is valid');
            printCheck('WALLET_2_ADDRESS format', true, 'Valid Solana address');
        } else {
            results.failed.push('WALLET_2_ADDRESS format is invalid');
            printCheck('WALLET_2_ADDRESS format', false, 'Invalid Solana address format');
        }
    }
    
    // Check if addresses are different
    if (wallet1Check.passed && wallet2Check.passed) {
        if (wallet1Check.value === wallet2Check.value) {
            results.warnings.push('WALLET_1_ADDRESS and WALLET_2_ADDRESS are identical');
            printCheck('Wallet addresses are different', false, 'WARNING: Both wallets have the same address');
        } else {
            results.passed.push('Wallet addresses are different');
            printCheck('Wallet addresses are different', true);
        }
    }
}

/**
 * Validate Solana RPC URL and connectivity
 */
async function validateSolanaRPC() {
    printHeader('Solana RPC Validation');
    
    const rpcCheck = checkEnvVariable('SOLANA_RPC_URL', 'Solana RPC endpoint URL');
    
    if (!rpcCheck.passed) {
        return;
    }
    
    // Validate URL format
    try {
        new URL(rpcCheck.value);
        results.passed.push('SOLANA_RPC_URL is a valid URL');
        printCheck('SOLANA_RPC_URL format', true, 'Valid URL format');
    } catch (error) {
        results.failed.push('SOLANA_RPC_URL is not a valid URL');
        printCheck('SOLANA_RPC_URL format', false, 'Invalid URL format');
        return;
    }
    
    // Test RPC connectivity
    print('\nTesting RPC connectivity...', 'yellow');
    try {
        const connection = new Connection(rpcCheck.value, 'confirmed');
        
        // Get version to test connectivity
        const version = await connection.getVersion();
        results.passed.push('RPC endpoint is accessible');
        printCheck('RPC connectivity', true, `Connected successfully (Solana version: ${version['solana-core']})`);
        
        // Get recent blockhash to verify it's responding properly
        const { blockhash } = await connection.getLatestBlockhash();
        results.passed.push('RPC health check passed');
        printCheck('RPC health check', true, `Latest blockhash: ${blockhash.substring(0, 20)}...`);
        
    } catch (error) {
        results.failed.push(`RPC endpoint is not accessible: ${error.message}`);
        printCheck('RPC connectivity', false, `Failed to connect: ${error.message}`);
    }
}

/**
 * Validate database path
 */
async function validateDatabasePath() {
    printHeader('Database Configuration Validation');
    
    const dbPathCheck = checkEnvVariable('DATABASE_PATH', 'SQLite database file path');
    
    if (!dbPathCheck.passed) {
        return;
    }
    
    const dbPath = dbPathCheck.value;
    const dbDir = path.dirname(dbPath);
    
    // Check if directory exists
    if (fs.existsSync(dbDir)) {
        results.passed.push('Database directory exists');
        printCheck('Database directory exists', true, `Directory: ${dbDir}`);
    } else {
        // Try to create the directory
        try {
            fs.mkdirSync(dbDir, { recursive: true });
            results.passed.push('Database directory created');
            printCheck('Database directory created', true, `Created: ${dbDir}`);
        } catch (error) {
            results.failed.push(`Cannot create database directory: ${error.message}`);
            printCheck('Database directory', false, `Cannot create directory: ${error.message}`);
            return;
        }
    }
    
    // Check if directory is writable
    try {
        const testFile = path.join(dbDir, '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        results.passed.push('Database directory is writable');
        printCheck('Database directory writable', true);
    } catch (error) {
        results.failed.push(`Database directory is not writable: ${error.message}`);
        printCheck('Database directory writable', false, `Permission denied: ${error.message}`);
    }
    
    // Check if database file exists
    if (fs.existsSync(dbPath)) {
        results.warnings.push('Database file already exists');
        printCheck('Database file', true, `Existing database: ${dbPath}`);
        
        // Check if database file is readable/writable
        try {
            fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
            results.passed.push('Database file is readable and writable');
            printCheck('Database file permissions', true);
        } catch (error) {
            results.failed.push(`Database file permissions error: ${error.message}`);
            printCheck('Database file permissions', false, error.message);
        }
    } else {
        results.warnings.push('Database file does not exist (will be created on first run)');
        printCheck('Database file', true, 'Will be created on first run');
    }
}

/**
 * Validate other required environment variables
 */
function validateOtherEnvVariables() {
    printHeader('Other Environment Variables');
    
    // PORT (optional, has default)
    const portCheck = process.env.PORT;
    if (portCheck) {
        const port = parseInt(portCheck, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
            results.failed.push('PORT is not a valid port number');
            printCheck('PORT', false, `Invalid port number: ${portCheck}`);
        } else {
            results.passed.push('PORT is valid');
            printCheck('PORT', true, `Port: ${port}`);
        }
    } else {
        results.warnings.push('PORT not set (will use default: 3000)');
        printCheck('PORT', true, 'Using default: 3000');
    }
    
    // NODE_ENV (optional)
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv) {
        results.passed.push(`NODE_ENV is set to ${nodeEnv}`);
        printCheck('NODE_ENV', true, `Environment: ${nodeEnv}`);
        
        if (nodeEnv === 'production') {
            print('  ⚠️  Running in PRODUCTION mode', 'yellow');
        }
    } else {
        results.warnings.push('NODE_ENV not set (will use default: development)');
        printCheck('NODE_ENV', true, 'Using default: development');
    }
    
    // ALLOWED_ORIGINS (optional)
    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    if (allowedOrigins) {
        const origins = allowedOrigins.split(',').map(o => o.trim());
        results.passed.push(`ALLOWED_ORIGINS configured with ${origins.length} origin(s)`);
        printCheck('ALLOWED_ORIGINS', true, `${origins.length} origin(s) configured`);
        origins.forEach(origin => {
            print(`    - ${origin}`, 'blue');
        });
    } else {
        results.warnings.push('ALLOWED_ORIGINS not set (CORS will allow all origins)');
        printCheck('ALLOWED_ORIGINS', true, 'CORS will allow all origins (*)');
    }
}

/**
 * Print summary of validation results
 */
function printSummary() {
    printHeader('Validation Summary');
    
    print(`\nPassed: ${results.passed.length}`, 'green');
    print(`Failed: ${results.failed.length}`, 'red');
    print(`Warnings: ${results.warnings.length}`, 'yellow');
    
    if (results.failed.length > 0) {
        print('\n❌ FAILED CHECKS:', 'red');
        results.failed.forEach(item => {
            print(`  • ${item}`, 'red');
        });
    }
    
    if (results.warnings.length > 0) {
        print('\n⚠️  WARNINGS:', 'yellow');
        results.warnings.forEach(item => {
            print(`  • ${item}`, 'yellow');
        });
    }
    
    if (results.failed.length === 0) {
        print('\n✅ All required configuration checks passed!', 'green');
        print('The backend is ready to start.', 'green');
        return 0;
    } else {
        print('\n❌ Configuration validation failed!', 'red');
        print('Please fix the errors above before starting the backend.', 'red');
        return 1;
    }
}

/**
 * Main execution
 */
async function main() {
    print('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    print('║  Gorweld Backend Environment Configuration Verification   ║', 'cyan');
    print('╚════════════════════════════════════════════════════════════╝', 'cyan');
    
    try {
        // Run all validation checks
        await validateWalletAddresses();
        await validateSolanaRPC();
        await validateDatabasePath();
        validateOtherEnvVariables();
        
        // Print summary and exit with appropriate code
        const exitCode = printSummary();
        process.exit(exitCode);
        
    } catch (error) {
        print('\n❌ Unexpected error during validation:', 'red');
        print(error.message, 'red');
        if (error.stack) {
            print('\nStack trace:', 'red');
            print(error.stack, 'red');
        }
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { isValidSolanaAddress };
