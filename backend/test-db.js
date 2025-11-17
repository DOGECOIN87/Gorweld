// Simple test script to verify database initialization
require('dotenv').config();
const Database = require('./models/database');

async function testDatabase() {
    console.log('Testing database initialization...\n');
    
    const db = new Database('./data/test-cards.db');
    
    try {
        // Initialize database
        await db.initialize();
        console.log('✓ Database initialized successfully\n');
        
        // Test inserting a card
        console.log('Testing card insertion...');
        const result = await db.run(
            `INSERT INTO cards (wallet_address, transaction_signature, name, subtitle, description, url, icon, media_urls)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'TestWalletAddress123',
                'TestTransactionSignature123',
                'Test Project',
                'A test project',
                'This is a test project description',
                'https://example.com',
                '🚀',
                JSON.stringify(['https://example.com/image.png'])
            ]
        );
        console.log('✓ Card inserted with ID:', result.lastID, '\n');
        
        // Test retrieving cards
        console.log('Testing card retrieval...');
        const cards = await db.all('SELECT * FROM cards ORDER BY created_at DESC');
        console.log('✓ Retrieved', cards.length, 'card(s)');
        console.log('Card data:', JSON.stringify(cards[0], null, 2), '\n');
        
        // Test transaction insertion
        console.log('Testing transaction insertion...');
        const txResult = await db.run(
            `INSERT INTO transactions (signature, wallet_address, amount, card_id)
             VALUES (?, ?, ?, ?)`,
            [
                'TestTransactionSignature123',
                'TestWalletAddress123',
                1000000000,
                result.lastID
            ]
        );
        console.log('✓ Transaction inserted with ID:', txResult.lastID, '\n');
        
        // Test retrieving transaction
        console.log('Testing transaction retrieval...');
        const tx = await db.get('SELECT * FROM transactions WHERE signature = ?', ['TestTransactionSignature123']);
        console.log('✓ Transaction retrieved:', JSON.stringify(tx, null, 2), '\n');
        
        // Close database
        await db.close();
        console.log('✓ Database closed successfully\n');
        
        console.log('All tests passed! ✓');
        
    } catch (error) {
        console.error('✗ Test failed:', error);
        await db.close();
        process.exit(1);
    }
}

testDatabase();
