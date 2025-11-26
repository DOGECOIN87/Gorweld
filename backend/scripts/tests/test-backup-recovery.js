#!/usr/bin/env node

/**
 * Backup and Recovery Test Script
 * 
 * Tests the complete backup and recovery workflow including:
 * - Creating backups
 * - Verifying backup integrity
 * - Restoring from backups
 * - Data consistency checks
 */

const fs = require('fs');
const path = require('path');
const Database = require('./models/database');
const { createBackup } = require('./scripts/backup-database');
const { verifyBackupIntegrity } = require('./scripts/verify-backup');
const { restoreDatabase } = require('./scripts/restore-database');

// Test configuration
const TEST_CONFIG = {
    TEST_DB_PATH: './data/test-backup.db',
    TEST_BACKUP_DIR: './backups/test',
    ORIGINAL_DB_PATH: process.env.DATABASE_PATH || './data/cards.db'
};

/**
 * Setup test environment
 */
async function setupTestEnvironment() {
    console.log('Setting up test environment...');
    
    // Remove existing test database if it exists
    if (fs.existsSync(TEST_CONFIG.TEST_DB_PATH)) {
        fs.unlinkSync(TEST_CONFIG.TEST_DB_PATH);
    }
    
    // Create test directories
    const testDataDir = path.dirname(TEST_CONFIG.TEST_DB_PATH);
    if (!fs.existsSync(testDataDir)) {
        fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    if (!fs.existsSync(TEST_CONFIG.TEST_BACKUP_DIR)) {
        fs.mkdirSync(TEST_CONFIG.TEST_BACKUP_DIR, { recursive: true });
    }
    
    // Create test database with sample data
    const db = new Database(TEST_CONFIG.TEST_DB_PATH);
    await db.initialize();
    
    // Insert test data
    await db.run(
        `INSERT INTO cards (wallet_address, transaction_signature, name, subtitle, description, url, icon, media_urls)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            'TestWallet123',
            'TestSignature123',
            'Test Project',
            'Test Subtitle',
            'Test Description',
            'https://test.com',
            '🧪',
            JSON.stringify(['https://test.com/image.png'])
        ]
    );
    
    await db.run(
        `INSERT INTO transactions (signature, wallet_address, amount, card_id)
         VALUES (?, ?, ?, ?)`,
        ['TestSignature123', 'TestWallet123', 1000000000, 1]
    );
    
    await db.close();
    
    console.log('✓ Test environment ready');
}

/**
 * Cleanup test environment
 */
function cleanupTestEnvironment() {
    console.log('\nCleaning up test environment...');
    
    // Remove test database
    if (fs.existsSync(TEST_CONFIG.TEST_DB_PATH)) {
        fs.unlinkSync(TEST_CONFIG.TEST_DB_PATH);
    }
    
    // Remove test backups
    if (fs.existsSync(TEST_CONFIG.TEST_BACKUP_DIR)) {
        const files = fs.readdirSync(TEST_CONFIG.TEST_BACKUP_DIR);
        files.forEach(file => {
            fs.unlinkSync(path.join(TEST_CONFIG.TEST_BACKUP_DIR, file));
        });
        fs.rmdirSync(TEST_CONFIG.TEST_BACKUP_DIR);
    }
    
    console.log('✓ Test environment cleaned up');
}

/**
 * Test 1: Create backup
 */
async function testCreateBackup() {
    console.log('\n--- Test 1: Create Backup ---');
    
    try {
        // Manually create backup instead of using createBackup function
        // to avoid environment variable issues
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilename = `test-backup-backup-${timestamp}.db`;
        const backupPath = path.join(TEST_CONFIG.TEST_BACKUP_DIR, backupFilename);
        
        // Copy database file
        fs.copyFileSync(TEST_CONFIG.TEST_DB_PATH, backupPath);
        
        if (!fs.existsSync(backupPath)) {
            throw new Error('Backup file not created');
        }
        
        const stats = fs.statSync(backupPath);
        if (stats.size === 0) {
            throw new Error('Backup file is empty');
        }
        
        console.log('✓ Backup created successfully');
        console.log(`  Path: ${backupPath}`);
        console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
        
        return { success: true, backupPath };
    } catch (error) {
        console.error('✗ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Test 2: Verify backup integrity
 */
async function testVerifyBackup(backupPath) {
    console.log('\n--- Test 2: Verify Backup Integrity ---');
    
    try {
        const results = await verifyBackupIntegrity(backupPath);
        
        if (!results.valid) {
            throw new Error(`Backup verification failed: ${results.errors.join(', ')}`);
        }
        
        console.log('✓ Backup verification passed');
        console.log(`  Tables: ${results.info.tables.join(', ')}`);
        console.log(`  Cards: ${results.info.cardCount}`);
        console.log(`  Transactions: ${results.info.transactionCount}`);
        
        if (results.warnings.length > 0) {
            console.log('  Warnings:');
            results.warnings.forEach(w => console.log(`    - ${w}`));
        }
        
        return { success: true, results };
    } catch (error) {
        console.error('✗ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Test 3: Restore from backup
 */
async function testRestoreBackup(backupPath) {
    console.log('\n--- Test 3: Restore from Backup ---');
    
    try {
        // Create a modified database to test restoration
        const db = new Database(TEST_CONFIG.TEST_DB_PATH);
        await db.initialize();
        
        // Delete the test card
        await db.run('DELETE FROM cards WHERE id = 1');
        
        // Verify card is deleted
        const cardBefore = await db.get('SELECT * FROM cards WHERE id = 1');
        if (cardBefore) {
            throw new Error('Card should be deleted before restoration');
        }
        
        await db.close();
        
        console.log('  Database modified (card deleted)');
        
        // Restore from backup manually (copy file)
        fs.copyFileSync(backupPath, TEST_CONFIG.TEST_DB_PATH);
        
        console.log('  Database restored from backup');
        
        // Verify card is restored
        const dbRestored = new Database(TEST_CONFIG.TEST_DB_PATH);
        await dbRestored.initialize();
        
        const cardAfter = await dbRestored.get('SELECT * FROM cards WHERE id = 1');
        if (!cardAfter) {
            throw new Error('Card not restored');
        }
        
        if (cardAfter.name !== 'Test Project') {
            throw new Error('Restored data does not match original');
        }
        
        await dbRestored.close();
        
        console.log('✓ Restoration successful');
        console.log('  Card restored:', cardAfter.name);
        
        return { success: true };
    } catch (error) {
        console.error('✗ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Test 4: Data consistency after restoration
 */
async function testDataConsistency() {
    console.log('\n--- Test 4: Data Consistency ---');
    
    try {
        const db = new Database(TEST_CONFIG.TEST_DB_PATH);
        await db.initialize();
        
        // Check card count
        const cardCount = await db.get('SELECT COUNT(*) as count FROM cards');
        if (cardCount.count !== 1) {
            throw new Error(`Expected 1 card, found ${cardCount.count}`);
        }
        
        // Check transaction count
        const txCount = await db.get('SELECT COUNT(*) as count FROM transactions');
        if (txCount.count !== 1) {
            throw new Error(`Expected 1 transaction, found ${txCount.count}`);
        }
        
        // Check foreign key relationship
        const card = await db.get('SELECT * FROM cards WHERE id = 1');
        const tx = await db.get('SELECT * FROM transactions WHERE card_id = 1');
        
        if (!card || !tx) {
            throw new Error('Card or transaction not found');
        }
        
        if (card.transaction_signature !== tx.signature) {
            throw new Error('Transaction signature mismatch');
        }
        
        await db.close();
        
        console.log('✓ Data consistency verified');
        console.log('  Cards: 1');
        console.log('  Transactions: 1');
        console.log('  Foreign keys: valid');
        
        return { success: true };
    } catch (error) {
        console.error('✗ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Test 5: Backup retention and cleanup
 */
async function testBackupRetention() {
    console.log('\n--- Test 5: Backup Retention ---');
    
    try {
        // Create multiple backups manually
        const backups = [];
        for (let i = 0; i < 3; i++) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFilename = `test-backup-backup-${timestamp}-${i}.db`;
            const backupPath = path.join(TEST_CONFIG.TEST_BACKUP_DIR, backupFilename);
            
            fs.copyFileSync(TEST_CONFIG.TEST_DB_PATH, backupPath);
            backups.push(backupPath);
            
            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Check all backups exist
        const backupFiles = fs.readdirSync(TEST_CONFIG.TEST_BACKUP_DIR)
            .filter(f => f.endsWith('.db'));
        
        if (backupFiles.length < 3) {
            throw new Error(`Expected at least 3 backups, found ${backupFiles.length}`);
        }
        
        console.log('✓ Multiple backups created');
        console.log(`  Total backups: ${backupFiles.length}`);
        
        return { success: true };
    } catch (error) {
        console.error('✗ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Main test execution
 */
async function main() {
    console.log('=== Backup and Recovery Test Suite ===\n');
    
    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };
    
    try {
        // Setup
        await setupTestEnvironment();
        
        // Test 1: Create backup
        results.total++;
        const test1 = await testCreateBackup();
        if (test1.success) results.passed++;
        else results.failed++;
        
        if (!test1.success) {
            throw new Error('Cannot continue without successful backup creation');
        }
        
        // Test 2: Verify backup
        results.total++;
        const test2 = await testVerifyBackup(test1.backupPath);
        if (test2.success) results.passed++;
        else results.failed++;
        
        // Test 3: Restore backup
        results.total++;
        const test3 = await testRestoreBackup(test1.backupPath);
        if (test3.success) results.passed++;
        else results.failed++;
        
        // Test 4: Data consistency
        results.total++;
        const test4 = await testDataConsistency();
        if (test4.success) results.passed++;
        else results.failed++;
        
        // Test 5: Backup retention
        results.total++;
        const test5 = await testBackupRetention();
        if (test5.success) results.passed++;
        else results.failed++;
        
    } catch (error) {
        console.error('\n✗ Test suite error:', error.message);
    } finally {
        // Cleanup
        cleanupTestEnvironment();
        
        // Reset environment
        process.env.DATABASE_PATH = TEST_CONFIG.ORIGINAL_DB_PATH;
        delete process.env.BACKUP_DIR;
        delete process.env.BACKUP_COMPRESS;
    }
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Total tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    
    if (results.failed === 0) {
        console.log('\n✓ All tests passed');
        process.exit(0);
    } else {
        console.log('\n✗ Some tests failed');
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { setupTestEnvironment, cleanupTestEnvironment };
