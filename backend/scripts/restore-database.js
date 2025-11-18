#!/usr/bin/env node

/**
 * Database Restore Script
 * 
 * Restores database from a backup file with safety checks
 * and automatic backup of current database before restoration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const CONFIG = {
    DATABASE_PATH: process.env.DATABASE_PATH || './data/cards.db',
    BACKUP_DIR: process.env.BACKUP_DIR || './backups'
};

/**
 * Create readline interface for user input
 */
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * Ask user for confirmation
 */
function askConfirmation(question) {
    return new Promise((resolve) => {
        const rl = createReadlineInterface();
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

/**
 * List available backups
 */
function listAvailableBackups() {
    try {
        const files = fs.readdirSync(CONFIG.BACKUP_DIR)
            .filter(file => file.endsWith('.db') || file.endsWith('.db.gz'))
            .map(file => {
                const filePath = path.join(CONFIG.BACKUP_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    path: filePath,
                    size: stats.size,
                    mtime: stats.mtime
                };
            })
            .sort((a, b) => b.mtime - a.mtime);

        return files;
    } catch (error) {
        console.error(`✗ Failed to list backups: ${error.message}`);
        return [];
    }
}

/**
 * Display available backups
 */
function displayBackups(backups) {
    console.log('\nAvailable backups:');
    if (backups.length === 0) {
        console.log('  No backups found');
        return;
    }

    backups.forEach((backup, index) => {
        const sizeKB = (backup.size / 1024).toFixed(2);
        const date = backup.mtime.toISOString().replace('T', ' ').substring(0, 19);
        console.log(`  ${index + 1}. ${backup.name}`);
        console.log(`     Size: ${sizeKB} KB | Date: ${date}`);
    });
}

/**
 * Decompress backup if needed
 */
function decompressBackup(backupPath) {
    if (backupPath.endsWith('.gz')) {
        console.log('Decompressing backup...');
        const decompressedPath = backupPath.replace('.gz', '');
        
        try {
            execSync(`gunzip -c "${backupPath}" > "${decompressedPath}"`);
            console.log(`✓ Decompressed to: ${decompressedPath}`);
            return decompressedPath;
        } catch (error) {
            console.error(`✗ Decompression failed: ${error.message}`);
            process.exit(1);
        }
    }
    return backupPath;
}

/**
 * Verify backup integrity
 */
function verifyBackup(backupPath) {
    console.log('Verifying backup integrity...');
    
    try {
        // Check if file exists and is readable
        if (!fs.existsSync(backupPath)) {
            throw new Error('Backup file not found');
        }

        const stats = fs.statSync(backupPath);
        if (stats.size === 0) {
            throw new Error('Backup file is empty');
        }

        // Try to open the database to verify it's valid SQLite
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(backupPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                throw new Error(`Invalid SQLite database: ${err.message}`);
            }
        });

        // Verify tables exist
        return new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
                db.close();
                
                if (err) {
                    reject(new Error(`Failed to read database: ${err.message}`));
                    return;
                }

                const tableNames = tables.map(t => t.name);
                const requiredTables = ['cards', 'transactions'];
                const missingTables = requiredTables.filter(t => !tableNames.includes(t));

                if (missingTables.length > 0) {
                    reject(new Error(`Missing required tables: ${missingTables.join(', ')}`));
                    return;
                }

                console.log(`✓ Backup verified (${tableNames.length} tables found)`);
                resolve(true);
            });
        });
    } catch (error) {
        console.error(`✗ Backup verification failed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Backup current database before restoration
 */
function backupCurrentDatabase() {
    if (!fs.existsSync(CONFIG.DATABASE_PATH)) {
        console.log('No existing database to backup');
        return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(
        CONFIG.BACKUP_DIR,
        `cards-pre-restore-${timestamp}.db`
    );

    try {
        fs.copyFileSync(CONFIG.DATABASE_PATH, backupPath);
        console.log(`✓ Current database backed up to: ${backupPath}`);
        return backupPath;
    } catch (error) {
        console.error(`✗ Failed to backup current database: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Restore database from backup
 */
function restoreDatabase(backupPath) {
    console.log(`\nRestoring database from: ${backupPath}`);

    try {
        // Ensure data directory exists
        const dataDir = path.dirname(CONFIG.DATABASE_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Copy backup to database location
        fs.copyFileSync(backupPath, CONFIG.DATABASE_PATH);
        
        const stats = fs.statSync(CONFIG.DATABASE_PATH);
        console.log(`✓ Database restored successfully`);
        console.log(`  Location: ${CONFIG.DATABASE_PATH}`);
        console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
        
        return true;
    } catch (error) {
        console.error(`✗ Restoration failed: ${error.message}`);
        return false;
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('=== Database Restore Script ===\n');

    // Get backup file from command line or list available
    let backupPath = process.argv[2];

    if (!backupPath) {
        const backups = listAvailableBackups();
        displayBackups(backups);

        if (backups.length === 0) {
            console.log('\nNo backups available to restore');
            process.exit(1);
        }

        console.log('\nUsage: node restore-database.js <backup-file>');
        console.log('Example: node restore-database.js backups/cards-backup-2025-11-17.db.gz');
        process.exit(0);
    }

    // Resolve backup path
    if (!path.isAbsolute(backupPath)) {
        backupPath = path.resolve(backupPath);
    }

    if (!fs.existsSync(backupPath)) {
        console.error(`✗ Backup file not found: ${backupPath}`);
        process.exit(1);
    }

    console.log(`Backup file: ${backupPath}`);
    console.log(`Target database: ${CONFIG.DATABASE_PATH}\n`);

    // Decompress if needed
    const decompressedPath = decompressBackup(backupPath);

    // Verify backup
    await verifyBackup(decompressedPath);

    // Confirm restoration
    const confirmed = await askConfirmation(
        '\n⚠️  This will replace the current database. Continue? (y/n): '
    );

    if (!confirmed) {
        console.log('Restoration cancelled');
        
        // Clean up decompressed file if it was created
        if (decompressedPath !== backupPath && fs.existsSync(decompressedPath)) {
            fs.unlinkSync(decompressedPath);
        }
        
        process.exit(0);
    }

    // Backup current database
    backupCurrentDatabase();

    // Restore database
    const success = restoreDatabase(decompressedPath);

    // Clean up decompressed file if it was created
    if (decompressedPath !== backupPath && fs.existsSync(decompressedPath)) {
        fs.unlinkSync(decompressedPath);
    }

    if (success) {
        console.log('\n✓ Database restoration completed successfully');
        process.exit(0);
    } else {
        console.log('\n✗ Database restoration failed');
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { restoreDatabase, verifyBackup };
