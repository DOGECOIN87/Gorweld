#!/usr/bin/env node

/**
 * Backup Verification Script
 * 
 * Verifies the integrity and completeness of database backups
 * by checking file validity, table structure, and data consistency.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

// Configuration
const CONFIG = {
    BACKUP_DIR: process.env.BACKUP_DIR || './backups'
};

/**
 * Decompress backup if needed
 */
function decompressBackup(backupPath) {
    if (backupPath.endsWith('.gz')) {
        const decompressedPath = backupPath.replace('.gz', '.tmp');
        
        try {
            execSync(`gunzip -c "${backupPath}" > "${decompressedPath}"`);
            return { path: decompressedPath, cleanup: true };
        } catch (error) {
            throw new Error(`Decompression failed: ${error.message}`);
        }
    }
    return { path: backupPath, cleanup: false };
}

/**
 * Verify backup file integrity
 */
async function verifyBackupIntegrity(backupPath) {
    const results = {
        valid: false,
        errors: [],
        warnings: [],
        info: {}
    };

    try {
        // Check file exists
        if (!fs.existsSync(backupPath)) {
            results.errors.push('Backup file not found');
            return results;
        }

        // Check file size
        const stats = fs.statSync(backupPath);
        if (stats.size === 0) {
            results.errors.push('Backup file is empty');
            return results;
        }
        results.info.fileSize = stats.size;
        results.info.fileSizeKB = (stats.size / 1024).toFixed(2);
        results.info.lastModified = stats.mtime;

        // Decompress if needed
        const { path: dbPath, cleanup } = decompressBackup(backupPath);

        try {
            // Open database
            const db = await new Promise((resolve, reject) => {
                const database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
                    if (err) {
                        reject(new Error(`Cannot open database: ${err.message}`));
                    } else {
                        resolve(database);
                    }
                });
            });

            // Get table list
            const tables = await new Promise((resolve, reject) => {
                db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(r => r.name));
                });
            });

            results.info.tables = tables;

            // Check required tables
            const requiredTables = ['cards', 'transactions'];
            const missingTables = requiredTables.filter(t => !tables.includes(t));
            
            if (missingTables.length > 0) {
                results.errors.push(`Missing required tables: ${missingTables.join(', ')}`);
            }

            // Verify cards table structure
            if (tables.includes('cards')) {
                const cardsSchema = await new Promise((resolve, reject) => {
                    db.all("PRAGMA table_info(cards)", (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });

                const requiredColumns = [
                    'id', 'wallet_address', 'transaction_signature', 'name',
                    'subtitle', 'description', 'url', 'icon', 'media_urls',
                    'created_at', 'updated_at', 'published'
                ];

                const columnNames = cardsSchema.map(c => c.name);
                const missingColumns = requiredColumns.filter(c => !columnNames.includes(c));

                if (missingColumns.length > 0) {
                    results.errors.push(`Cards table missing columns: ${missingColumns.join(', ')}`);
                }

                // Count cards
                const cardCount = await new Promise((resolve, reject) => {
                    db.get("SELECT COUNT(*) as count FROM cards", (err, row) => {
                        if (err) reject(err);
                        else resolve(row.count);
                    });
                });
                results.info.cardCount = cardCount;
            }

            // Verify transactions table structure
            if (tables.includes('transactions')) {
                const transactionsSchema = await new Promise((resolve, reject) => {
                    db.all("PRAGMA table_info(transactions)", (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });

                const requiredColumns = [
                    'id', 'signature', 'wallet_address', 'amount',
                    'verified_at', 'card_id'
                ];

                const columnNames = transactionsSchema.map(c => c.name);
                const missingColumns = requiredColumns.filter(c => !columnNames.includes(c));

                if (missingColumns.length > 0) {
                    results.errors.push(`Transactions table missing columns: ${missingColumns.join(', ')}`);
                }

                // Count transactions
                const txCount = await new Promise((resolve, reject) => {
                    db.get("SELECT COUNT(*) as count FROM transactions", (err, row) => {
                        if (err) reject(err);
                        else resolve(row.count);
                    });
                });
                results.info.transactionCount = txCount;
            }

            // Check for orphaned transactions
            if (tables.includes('cards') && tables.includes('transactions')) {
                const orphanedTx = await new Promise((resolve, reject) => {
                    db.get(
                        "SELECT COUNT(*) as count FROM transactions WHERE card_id IS NOT NULL AND card_id NOT IN (SELECT id FROM cards)",
                        (err, row) => {
                            if (err) reject(err);
                            else resolve(row.count);
                        }
                    );
                });

                if (orphanedTx > 0) {
                    results.warnings.push(`Found ${orphanedTx} orphaned transaction(s)`);
                }
            }

            // Check indexes
            const indexes = await new Promise((resolve, reject) => {
                db.all("SELECT name FROM sqlite_master WHERE type='index'", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(r => r.name));
                });
            });
            results.info.indexes = indexes.filter(i => !i.startsWith('sqlite_'));

            // Close database
            await new Promise((resolve) => {
                db.close(() => resolve());
            });

            // Set valid if no errors
            results.valid = results.errors.length === 0;

        } finally {
            // Clean up decompressed file
            if (cleanup && fs.existsSync(dbPath)) {
                fs.unlinkSync(dbPath);
            }
        }

    } catch (error) {
        results.errors.push(error.message);
    }

    return results;
}

/**
 * Display verification results
 */
function displayResults(backupName, results) {
    console.log(`\n${backupName}:`);
    
    if (results.valid) {
        console.log('  ✓ VALID');
    } else {
        console.log('  ✗ INVALID');
    }

    // Display info
    if (results.info.fileSizeKB) {
        console.log(`  Size: ${results.info.fileSizeKB} KB`);
    }
    if (results.info.lastModified) {
        const date = results.info.lastModified.toISOString().replace('T', ' ').substring(0, 19);
        console.log(`  Modified: ${date}`);
    }
    if (results.info.tables) {
        console.log(`  Tables: ${results.info.tables.join(', ')}`);
    }
    if (results.info.cardCount !== undefined) {
        console.log(`  Cards: ${results.info.cardCount}`);
    }
    if (results.info.transactionCount !== undefined) {
        console.log(`  Transactions: ${results.info.transactionCount}`);
    }
    if (results.info.indexes && results.info.indexes.length > 0) {
        console.log(`  Indexes: ${results.info.indexes.join(', ')}`);
    }

    // Display warnings
    if (results.warnings.length > 0) {
        console.log('  Warnings:');
        results.warnings.forEach(warning => {
            console.log(`    ⚠️  ${warning}`);
        });
    }

    // Display errors
    if (results.errors.length > 0) {
        console.log('  Errors:');
        results.errors.forEach(error => {
            console.log(`    ✗ ${error}`);
        });
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('=== Backup Verification Script ===');

    // Get backup file from command line or verify all
    const backupPath = process.argv[2];

    if (backupPath) {
        // Verify single backup
        console.log(`\nVerifying: ${backupPath}`);
        
        if (!fs.existsSync(backupPath)) {
            console.error(`✗ Backup file not found: ${backupPath}`);
            process.exit(1);
        }

        const results = await verifyBackupIntegrity(backupPath);
        displayResults(path.basename(backupPath), results);

        if (results.valid) {
            console.log('\n✓ Backup verification passed');
            process.exit(0);
        } else {
            console.log('\n✗ Backup verification failed');
            process.exit(1);
        }
    } else {
        // Verify all backups in directory
        console.log(`\nVerifying all backups in: ${CONFIG.BACKUP_DIR}`);

        if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
            console.error(`✗ Backup directory not found: ${CONFIG.BACKUP_DIR}`);
            process.exit(1);
        }

        const backupFiles = fs.readdirSync(CONFIG.BACKUP_DIR)
            .filter(file => file.endsWith('.db') || file.endsWith('.db.gz'))
            .sort();

        if (backupFiles.length === 0) {
            console.log('\nNo backup files found');
            process.exit(0);
        }

        let validCount = 0;
        let invalidCount = 0;

        for (const file of backupFiles) {
            const filePath = path.join(CONFIG.BACKUP_DIR, file);
            const results = await verifyBackupIntegrity(filePath);
            displayResults(file, results);

            if (results.valid) {
                validCount++;
            } else {
                invalidCount++;
            }
        }

        console.log(`\n=== Summary ===`);
        console.log(`Total backups: ${backupFiles.length}`);
        console.log(`Valid: ${validCount}`);
        console.log(`Invalid: ${invalidCount}`);

        if (invalidCount === 0) {
            console.log('\n✓ All backups verified successfully');
            process.exit(0);
        } else {
            console.log('\n⚠️  Some backups failed verification');
            process.exit(1);
        }
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { verifyBackupIntegrity };
