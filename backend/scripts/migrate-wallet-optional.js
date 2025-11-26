#!/usr/bin/env node

/**
 * Migration script to make wallet_address and transaction_signature optional
 * This updates the database schema to allow NULL values for these fields
 */

const Database = require('../models/database');
const path = require('path');

async function migrate() {
    console.log('Starting migration: Make wallet_address and transaction_signature optional');
    
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/cards.db');
    const db = new Database(dbPath);
    
    try {
        await db.initialize();
        console.log('Database connected');
        
        // SQLite doesn't support ALTER COLUMN directly, so we need to:
        // 1. Create a new table with the updated schema
        // 2. Copy data from old table
        // 3. Drop old table
        // 4. Rename new table
        
        console.log('Creating new cards table with updated schema...');
        await db.run(`
            CREATE TABLE IF NOT EXISTS cards_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT,
                transaction_signature TEXT UNIQUE,
                name TEXT NOT NULL,
                subtitle TEXT NOT NULL,
                description TEXT NOT NULL,
                url TEXT NOT NULL,
                icon TEXT NOT NULL,
                media_urls TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                published BOOLEAN DEFAULT TRUE
            )
        `);
        
        console.log('Copying data from old table...');
        await db.run(`
            INSERT INTO cards_new (id, wallet_address, transaction_signature, name, subtitle, description, url, icon, media_urls, created_at, updated_at, published)
            SELECT id, wallet_address, transaction_signature, name, subtitle, description, url, icon, media_urls, created_at, updated_at, published
            FROM cards
        `);
        
        console.log('Dropping old table...');
        await db.run('DROP TABLE cards');
        
        console.log('Renaming new table...');
        await db.run('ALTER TABLE cards_new RENAME TO cards');
        
        console.log('Recreating indexes...');
        await db.run('CREATE INDEX IF NOT EXISTS idx_wallet ON cards(wallet_address)');
        await db.run('CREATE INDEX IF NOT EXISTS idx_created ON cards(created_at)');
        
        console.log('Migration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

// Run migration
migrate();
