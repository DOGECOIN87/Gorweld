#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * Creates timestamped backups of the SQLite database with compression
 * and maintains retention policy for old backups.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
    DATABASE_PATH: process.env.DATABASE_PATH || './data/cards.db',
    BACKUP_DIR: process.env.BACKUP_DIR || './backups',
    RETENTION_DAYS: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    COMPRESS: process.env.BACKUP_COMPRESS !== 'false'
};

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDirectory() {
    if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
        fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
        console.log(`✓ Created backup directory: ${CONFIG.BACKUP_DIR}`);
    }
}

/**
 * Generate backup filename with timestamp
 */
function generateBackupFilename() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const basename = path.basename(CONFIG.DATABASE_PATH, '.db');
    return `${basename}-backup-${timestamp}.db`;
}

/**
 * Create database backup
 */
function createBackup() {
    // Check if database exists
    if (!fs.existsSync(CONFIG.DATABASE_PATH)) {
        console.error(`✗ Database not found: ${CONFIG.DATABASE_PATH}`);
        process.exit(1);
    }

    const backupFilename = generateBackupFilename();
    const backupPath = path.join(CONFIG.BACKUP_DIR, backupFilename);

    console.log(`Creating backup of ${CONFIG.DATABASE_PATH}...`);

    try {
        // Copy database file
        fs.copyFileSync(CONFIG.DATABASE_PATH, backupPath);
        
        const stats = fs.statSync(backupPath);
        console.log(`✓ Backup created: ${backupPath}`);
        console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);

        // Compress backup if enabled
        if (CONFIG.COMPRESS) {
            const gzipPath = `${backupPath}.gz`;
            execSync(`gzip -f "${backupPath}"`);
            
            const gzipStats = fs.statSync(gzipPath);
            const compressionRatio = ((1 - gzipStats.size / stats.size) * 100).toFixed(1);
            
            console.log(`✓ Backup compressed: ${gzipPath}`);
            console.log(`  Compressed size: ${(gzipStats.size / 1024).toFixed(2)} KB`);
            console.log(`  Compression ratio: ${compressionRatio}%`);
            
            return gzipPath;
        }

        return backupPath;
    } catch (error) {
        console.error(`✗ Backup failed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Clean up old backups based on retention policy
 */
function cleanupOldBackups() {
    console.log(`\nCleaning up backups older than ${CONFIG.RETENTION_DAYS} days...`);

    try {
        const files = fs.readdirSync(CONFIG.BACKUP_DIR);
        const now = Date.now();
        const retentionMs = CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000;
        let deletedCount = 0;

        files.forEach(file => {
            const filePath = path.join(CONFIG.BACKUP_DIR, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtimeMs;

            if (age > retentionMs && (file.endsWith('.db') || file.endsWith('.db.gz'))) {
                fs.unlinkSync(filePath);
                console.log(`  Deleted: ${file} (${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`);
                deletedCount++;
            }
        });

        if (deletedCount === 0) {
            console.log('  No old backups to delete');
        } else {
            console.log(`✓ Deleted ${deletedCount} old backup(s)`);
        }
    } catch (error) {
        console.error(`✗ Cleanup failed: ${error.message}`);
    }
}

/**
 * List existing backups
 */
function listBackups() {
    console.log('\nExisting backups:');
    
    try {
        const files = fs.readdirSync(CONFIG.BACKUP_DIR)
            .filter(file => file.endsWith('.db') || file.endsWith('.db.gz'))
            .map(file => {
                const filePath = path.join(CONFIG.BACKUP_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    mtime: stats.mtime
                };
            })
            .sort((a, b) => b.mtime - a.mtime);

        if (files.length === 0) {
            console.log('  No backups found');
        } else {
            files.forEach(file => {
                const sizeKB = (file.size / 1024).toFixed(2);
                const date = file.mtime.toISOString().replace('T', ' ').substring(0, 19);
                console.log(`  ${file.name} - ${sizeKB} KB - ${date}`);
            });
            console.log(`\nTotal: ${files.length} backup(s)`);
        }
    } catch (error) {
        console.error(`✗ Failed to list backups: ${error.message}`);
    }
}

/**
 * Main execution
 */
function main() {
    console.log('=== Database Backup Script ===\n');
    console.log('Configuration:');
    console.log(`  Database: ${CONFIG.DATABASE_PATH}`);
    console.log(`  Backup directory: ${CONFIG.BACKUP_DIR}`);
    console.log(`  Retention: ${CONFIG.RETENTION_DAYS} days`);
    console.log(`  Compression: ${CONFIG.COMPRESS ? 'enabled' : 'disabled'}\n`);

    ensureBackupDirectory();
    createBackup();
    cleanupOldBackups();
    listBackups();

    console.log('\n✓ Backup completed successfully');
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { createBackup, cleanupOldBackups, listBackups };
