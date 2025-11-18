/**
 * Test script for card update authorization verification
 * Tests Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

const Database = require('./models/database');
const { updateCard, validateCardData } = require('./controllers/cardController');

// Test configuration
const TEST_DB_PATH = ':memory:'; // Use in-memory database for testing

// Mock logger
const mockLogger = {
    info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
    warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta || ''),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || '')
};

// Test data
const OWNER_WALLET = 'BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt';
const NON_OWNER_WALLET = 'Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo';
const TEST_SIGNATURE = '5J8H5sPKXHwHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGH';

const VALID_CARD_DATA = {
    name: 'Test Project',
    subtitle: 'A test project for verification',
    description: 'This is a test project to verify card update authorization functionality.',
    url: 'https://example.com',
    icon: '🚀',
    mediaUrls: ['https://example.com/image1.png']
};

const UPDATED_CARD_DATA = {
    name: 'Updated Test Project',
    subtitle: 'An updated test project',
    description: 'This project has been updated to test the update functionality.',
    url: 'https://updated-example.com',
    icon: '🎯',
    mediaUrls: ['https://example.com/image2.png', 'https://example.com/image3.png']
};

const INVALID_CARD_DATA = {
    name: '', // Invalid: empty name
    subtitle: 'Test',
    description: 'Test',
    url: 'not-a-valid-url', // Invalid: not a URL
    icon: '🚀',
    mediaUrls: [] // Invalid: empty array
};

// Test utilities
function createMockRequest(cardId, cardData, walletAddress, db) {
    return {
        params: { cardId },
        body: { cardData, walletAddress },
        db,
        logger: mockLogger
    };
}

function createMockResponse() {
    const res = {
        statusCode: null,
        jsonData: null,
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.jsonData = data;
            return this;
        }
    };
    return res;
}

// Test functions
async function setupTestDatabase() {
    console.log('\n=== Setting up test database ===\n');
    
    const db = new Database(TEST_DB_PATH);
    await db.initialize();
    
    // Insert a test card
    const result = await db.run(
        `INSERT INTO cards (wallet_address, transaction_signature, name, subtitle, description, url, icon, media_urls, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 hour'))`,
        [
            OWNER_WALLET,
            TEST_SIGNATURE,
            VALID_CARD_DATA.name,
            VALID_CARD_DATA.subtitle,
            VALID_CARD_DATA.description,
            VALID_CARD_DATA.url,
            VALID_CARD_DATA.icon,
            JSON.stringify(VALID_CARD_DATA.mediaUrls)
        ]
    );
    
    console.log(`✓ Test card created with ID: ${result.lastID}`);
    return { db, cardId: result.lastID };
}

async function testWalletOwnershipCheck(db, cardId) {
    console.log('\n=== Test 1: Wallet Ownership Check (Requirement 8.1) ===\n');
    
    // Test 1a: Owner can update
    console.log('Test 1a: Owner wallet can update card');
    const req1 = createMockRequest(cardId, UPDATED_CARD_DATA, OWNER_WALLET, db);
    const res1 = createMockResponse();
    
    await updateCard(req1, res1);
    
    if (res1.statusCode === 200 && res1.jsonData.success) {
        console.log('✓ PASS: Owner wallet successfully updated card');
        console.log(`  Response: ${res1.jsonData.message}`);
    } else {
        console.log('✗ FAIL: Owner wallet could not update card');
        console.log(`  Status: ${res1.statusCode}`);
        console.log(`  Error: ${res1.jsonData.error}`);
        return false;
    }
    
    return true;
}

async function testNonOwnerRejection(db, cardId) {
    console.log('\n=== Test 2: Non-Owner Rejection (Requirement 8.2) ===\n');
    
    console.log('Test 2: Non-owner wallet receives 403 error');
    const req = createMockRequest(cardId, UPDATED_CARD_DATA, NON_OWNER_WALLET, db);
    const res = createMockResponse();
    
    await updateCard(req, res);
    
    if (res.statusCode === 403) {
        console.log('✓ PASS: Non-owner wallet received 403 error');
        console.log(`  Error message: "${res.jsonData.error}"`);
        
        if (res.jsonData.error === 'You do not have permission to edit this card') {
            console.log('✓ PASS: Correct error message returned');
            return true;
        } else {
            console.log('✗ FAIL: Incorrect error message');
            return false;
        }
    } else {
        console.log('✗ FAIL: Non-owner wallet did not receive 403 error');
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Response: ${JSON.stringify(res.jsonData)}`);
        return false;
    }
}

async function testCardDataValidation(db, cardId) {
    console.log('\n=== Test 3: Card Data Validation (Requirement 8.3) ===\n');
    
    console.log('Test 3: Invalid card data is rejected');
    const req = createMockRequest(cardId, INVALID_CARD_DATA, OWNER_WALLET, db);
    const res = createMockResponse();
    
    await updateCard(req, res);
    
    if (res.statusCode === 400 && res.jsonData.error === 'Card data validation failed') {
        console.log('✓ PASS: Invalid card data was rejected');
        console.log(`  Validation errors: ${JSON.stringify(res.jsonData.details)}`);
        return true;
    } else {
        console.log('✗ FAIL: Invalid card data was not properly rejected');
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Response: ${JSON.stringify(res.jsonData)}`);
        return false;
    }
}

async function testUpdatedAtTimestamp(db, cardId) {
    console.log('\n=== Test 4: Updated_at Timestamp (Requirement 8.4) ===\n');
    
    // Get original timestamps
    const originalCard = await db.get('SELECT created_at, updated_at FROM cards WHERE id = ?', [cardId]);
    console.log(`Original created_at: ${originalCard.created_at}`);
    console.log(`Original updated_at: ${originalCard.updated_at}`);
    
    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the card
    const req = createMockRequest(cardId, UPDATED_CARD_DATA, OWNER_WALLET, db);
    const res = createMockResponse();
    
    await updateCard(req, res);
    
    if (res.statusCode !== 200) {
        console.log('✗ FAIL: Card update failed');
        return false;
    }
    
    // Get updated timestamps
    const updatedCard = await db.get('SELECT created_at, updated_at FROM cards WHERE id = ?', [cardId]);
    console.log(`Updated created_at: ${updatedCard.created_at}`);
    console.log(`Updated updated_at: ${updatedCard.updated_at}`);
    
    // Verify updated_at changed
    if (updatedCard.updated_at !== originalCard.updated_at) {
        console.log('✓ PASS: updated_at timestamp was updated');
    } else {
        console.log('✗ FAIL: updated_at timestamp was not updated');
        return false;
    }
    
    return true;
}

async function testPreservedFields(db, cardId) {
    console.log('\n=== Test 5: Preserved Fields (Requirement 8.5) ===\n');
    
    // Get original card data
    const originalCard = await db.get(
        'SELECT transaction_signature, created_at FROM cards WHERE id = ?',
        [cardId]
    );
    console.log(`Original transaction_signature: ${originalCard.transaction_signature}`);
    console.log(`Original created_at: ${originalCard.created_at}`);
    
    // Update the card with different data
    const newCardData = {
        name: 'Another Update',
        subtitle: 'Testing preservation',
        description: 'This update should preserve transaction_signature and created_at.',
        url: 'https://preservation-test.com',
        icon: '🔒',
        mediaUrls: ['https://example.com/preserved.png']
    };
    
    const req = createMockRequest(cardId, newCardData, OWNER_WALLET, db);
    const res = createMockResponse();
    
    await updateCard(req, res);
    
    if (res.statusCode !== 200) {
        console.log('✗ FAIL: Card update failed');
        return false;
    }
    
    // Get updated card data
    const updatedCard = await db.get(
        'SELECT transaction_signature, created_at FROM cards WHERE id = ?',
        [cardId]
    );
    console.log(`Updated transaction_signature: ${updatedCard.transaction_signature}`);
    console.log(`Updated created_at: ${updatedCard.created_at}`);
    
    // Verify transaction_signature is preserved
    if (updatedCard.transaction_signature === originalCard.transaction_signature) {
        console.log('✓ PASS: transaction_signature was preserved');
    } else {
        console.log('✗ FAIL: transaction_signature was changed');
        return false;
    }
    
    // Verify created_at is preserved
    if (updatedCard.created_at === originalCard.created_at) {
        console.log('✓ PASS: created_at was preserved');
    } else {
        console.log('✗ FAIL: created_at was changed');
        return false;
    }
    
    return true;
}

async function testCardNotFound(db) {
    console.log('\n=== Test 6: Card Not Found ===\n');
    
    console.log('Test 6: Updating non-existent card returns 404');
    const req = createMockRequest(99999, UPDATED_CARD_DATA, OWNER_WALLET, db);
    const res = createMockResponse();
    
    await updateCard(req, res);
    
    if (res.statusCode === 404 && res.jsonData.error === 'Card not found') {
        console.log('✓ PASS: Non-existent card returns 404 error');
        return true;
    } else {
        console.log('✗ FAIL: Non-existent card did not return 404');
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Response: ${JSON.stringify(res.jsonData)}`);
        return false;
    }
}

async function testMissingFields(db, cardId) {
    console.log('\n=== Test 7: Missing Required Fields ===\n');
    
    console.log('Test 7: Missing cardData or walletAddress returns 400');
    const req = createMockRequest(cardId, null, OWNER_WALLET, db);
    const res = createMockResponse();
    
    await updateCard(req, res);
    
    if (res.statusCode === 400 && res.jsonData.error.includes('Missing required fields')) {
        console.log('✓ PASS: Missing fields returns 400 error');
        return true;
    } else {
        console.log('✗ FAIL: Missing fields did not return proper error');
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Response: ${JSON.stringify(res.jsonData)}`);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  Card Update Authorization Verification Tests              ║');
    console.log('║  Requirements: 8.1, 8.2, 8.3, 8.4, 8.5                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    let db, cardId;
    const results = [];
    
    try {
        // Setup
        ({ db, cardId } = await setupTestDatabase());
        
        // Run tests
        results.push({ name: 'Wallet Ownership Check', passed: await testWalletOwnershipCheck(db, cardId) });
        results.push({ name: 'Non-Owner Rejection', passed: await testNonOwnerRejection(db, cardId) });
        results.push({ name: 'Card Data Validation', passed: await testCardDataValidation(db, cardId) });
        results.push({ name: 'Updated_at Timestamp', passed: await testUpdatedAtTimestamp(db, cardId) });
        results.push({ name: 'Preserved Fields', passed: await testPreservedFields(db, cardId) });
        results.push({ name: 'Card Not Found', passed: await testCardNotFound(db) });
        results.push({ name: 'Missing Required Fields', passed: await testMissingFields(db, cardId) });
        
        // Summary
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║  Test Summary                                              ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        
        results.forEach(result => {
            const status = result.passed ? '✓ PASS' : '✗ FAIL';
            console.log(`${status}: ${result.name}`);
        });
        
        console.log(`\nTotal: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('\n✓ All tests passed! Card update authorization is working correctly.');
            process.exit(0);
        } else {
            console.log('\n✗ Some tests failed. Please review the implementation.');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n✗ Test execution failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        if (db) {
            await db.close();
        }
    }
}

// Run tests
runTests();
