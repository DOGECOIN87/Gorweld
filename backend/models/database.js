const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor(dbPath) {
        this.dbPath = dbPath || process.env.DATABASE_PATH || './data/cards.db';
        this.db = null;
    }

    /**
     * Initialize database connection and create tables if they don't exist
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Open database connection
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                    return;
                }
                console.log('Connected to SQLite database');
                
                // Create tables
                this.createTables()
                    .then(() => resolve())
                    .catch(reject);
            });
        });
    }

    /**
     * Create database tables
     */
    async createTables() {
        const cardsTableSQL = `
            CREATE TABLE IF NOT EXISTS cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT NOT NULL,
                transaction_signature TEXT UNIQUE NOT NULL,
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
        `;

        const transactionsTableSQL = `
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                signature TEXT UNIQUE NOT NULL,
                wallet_address TEXT NOT NULL,
                amount BIGINT NOT NULL,
                verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                card_id INTEGER,
                FOREIGN KEY (card_id) REFERENCES cards(id)
            )
        `;

        const cardsIndexSQL = `
            CREATE INDEX IF NOT EXISTS idx_wallet ON cards(wallet_address)
        `;

        const cardsCreatedIndexSQL = `
            CREATE INDEX IF NOT EXISTS idx_created ON cards(created_at)
        `;

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(cardsTableSQL, (err) => {
                    if (err) {
                        console.error('Error creating cards table:', err);
                        reject(err);
                        return;
                    }
                    console.log('Cards table ready');
                });

                this.db.run(transactionsTableSQL, (err) => {
                    if (err) {
                        console.error('Error creating transactions table:', err);
                        reject(err);
                        return;
                    }
                    console.log('Transactions table ready');
                });

                this.db.run(cardsIndexSQL, (err) => {
                    if (err) {
                        console.error('Error creating wallet index:', err);
                    }
                });

                this.db.run(cardsCreatedIndexSQL, (err) => {
                    if (err) {
                        console.error('Error creating created_at index:', err);
                        reject(err);
                        return;
                    }
                    console.log('Database indexes ready');
                    resolve();
                });
            });
        });
    }

    /**
     * Run a query that doesn't return rows (INSERT, UPDATE, DELETE)
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    /**
     * Get a single row
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get all rows
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Close database connection
     */
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = Database;
