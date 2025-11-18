#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * Tests Requirements: 3.4, 3.5, 5.3, 5.4, 8.3
 * 
 * This script tests the complete card submission flow including:
 * - POST /api/cards/submit with valid data and transaction
 * - GET /api/cards returns submitted card
 * - PUT /api/cards/:cardId updates card correctly
 * - Error scenarios (invalid data, missing fields, etc.)
 * - Validation middleware functionality
 * - Input sanitization
 * 
 * Usage:
 *   node test-api-comprehensive.js
 */

require('dotenv').config();
const Database = require('./models/database');
const { submitCard, getCards, updateCard, validateCardData } = require('./controllers/cardController');
const { 
    validateWalletAddress, 
    validateTransactionSignature,
    sanitizeCardData,
    sanitizeString
} = require('./middleware/validation');

// Test configuration
const TEST_DB_PATH = ':memory:'; // Use in-memory database for testing

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '═'.repeat(80));
    log(title, 'bright');
    console.log('═'.repeat(80));
}

function logSubSection(title) {
    console.log('\n' + '─'.repeat(80));
    log(title, 'cyan');
}

// Mock logger
const mockLogger = {
    info: (msg, meta) => {},
    warn: (msg, meta) => {},
    error: (msg, meta) => {}
};

// Test data
const VALID_WALLET = 'BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt';
const VALID_SIGNATURE = '5J8H5sPKXHwHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGHqGH';
const ANOTHER_WALLET = 'Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo';

const VALID_CARD_DATA = {
    name: 'Test Project',
    subtitle: 'A comprehensive test project',
    description: 'This is a test project to verify the complete API functionality.',
    url: 'https://example.com',
    icon: '🚀',
    mediaUrls: ['https://example.com/image1.png']
};

const UPDATED_CARD_DATA = {
    name: 'Updated Project',
    subtitle: 'An updated test project',
    description: 'This project has been updated to test the update functionality.',
    url: 'https://updated-example.com',
    icon: '🎯',
    mediaUrls: ['https://example.com/image2.png', 'https://example.com/image3.png']
};

// Mock request/response helpers
function createMockRequest(body, params = {}, db = null) {
    return {
        body,
        params,
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

// Test suite
const testResults = [];

function recordTest(name, passed, details = '') {
    testResults.push({ name, passed, details });
    const status = passed ? '✓ PASS' : '✗ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status}: ${name}`, color);
    if (details) {
        console.log(`  ${details}`);
    }
}

// ============================================================================
// Test 1: Card Data Validation
// ============================================================================
async function testCardDataValidation() {
    logSubSection('Test 1: Card Data Validation (Requirement 3.4, 3.5)');
    
    // Test 1a: Valid card data
    const errors1 = validateCardData(VALID_CARD_DATA);
    recordTest(
        '1a. Valid card data passes validation',
        errors1.length === 0,
        errors1.length === 0 ? 'No validation errors' : `Errors: ${errors1.join(', ')}`
    );
    
    // Test 1b: Missing name
    const invalidData1 = { ...VALID_CARD_DATA, name: '' };
    const errors2 = validateCardData(invalidData1);
    recordTest(
        '1b. Empty name is rejected',
        errors2.some(e => e.includes('name')),
        `Validation error: ${errors2.find(e => e.includes('name'))}`
    );
    
    // Test 1c: Name too long
    const invalidData2 = { ...VALID_CARD_DATA, name: 'a'.repeat(51) };
    const errors3 = validateCardData(invalidData2);
    recordTest(
        '1c. Name exceeding 50 characters is rejected',
        errors3.some(e => e.includes('50 characters')),
        `Validation error: ${errors3.find(e => e.includes('50'))}`
    );
    
    // Test 1d: Invalid URL
    const invalidData3 = { ...VALID_CARD_DATA, url: 'not-a-url' };
    const errors4 = validateCardData(invalidData3);
    recordTest(
        '1d. Invalid URL format is rejected',
        errors4.some(e => e.includes('valid URL')),
        `Validation error: ${errors4.find(e => e.includes('URL'))}`
    );
    
    // Test 1e: Empty media URLs
    const invalidData4 = { ...VALID_CARD_DATA, mediaUrls: [] };
    const errors5 = validateCardData(invalidData4);
    recordTest(
        '1e. Empty media URLs array is rejected',
        errors5.some(e => e.includes('At least one media')),
        `Validation error: ${errors5.find(e => e.includes('media'))}`
    );
    
    // Test 1f: Too many media URLs
    const invalidData5 = { ...VALID_CARD_DATA, mediaUrls: Array(6).fill('https://example.com/img.png') };
    const errors6 = validateCardData(invalidData5);
    recordTest(
        '1f. More than 5 media URLs is rejected',
        errors6.some(e => e.includes('Maximum 5')),
        `Validation error: ${errors6.find(e => e.includes('Maximum'))}`
    );
}

// ============================================================================
// Test 2: Input Sanitization
// ============================================================================
async function testInputSanitization() {
    logSubSection('Test 2: Input Sanitization (Requirement 3.5)');
    
    // Test 2a: XSS prevention in strings
    const xssInput = '<script>alert("xss")</script>';
    const sanitized = sanitizeString(xssInput);
    recordTest(
        '2a. XSS script tags are sanitized',
        !sanitized.includes('<script>') && sanitized.includes('&lt;'),
        `Input: ${xssInput} → Output: ${sanitized}`
    );
    
    // Test 2b: HTML entities are escaped
    const htmlInput = '<div>Test</div>';
    const sanitized2 = sanitizeString(htmlInput);
    recordTest(
        '2b. HTML tags are escaped',
        sanitized2.includes('&lt;') && sanitized2.includes('&gt;'),
        `Input: ${htmlInput} → Output: ${sanitized2}`
    );
    
    // Test 2c: Quotes are escaped
    const quoteInput = 'Test "quoted" and \'single\'';
    const sanitized3 = sanitizeString(quoteInput);
    recordTest(
        '2c. Quotes are escaped',
        sanitized3.includes('&quot;') && sanitized3.includes('&#x27;'),
        `Input: ${quoteInput} → Output: ${sanitized3}`
    );
    
    // Test 2d: Sanitize card data middleware
    const xssCardData = {
        name: '<script>alert("xss")</script>',
        subtitle: 'Normal subtitle',
        description: '<img src=x onerror=alert(1)>',
        url: 'https://example.com',
        icon: '🚀',
        mediaUrls: ['<script>bad</script>']
    };
    
    const req = createMockRequest({ cardData: xssCardData });
    const res = createMockResponse();
    const next = () => {};
    
    sanitizeCardData(req, res, next);
    
    const sanitizedName = req.body.cardData.name;
    const sanitizedDesc = req.body.cardData.description;
    recordTest(
        '2d. Card data middleware sanitizes all fields',
        !sanitizedName.includes('<script>') && !sanitizedDesc.includes('<img'),
        `Name sanitized: ${!sanitizedName.includes('<script>')}, Desc sanitized: ${!sanitizedDesc.includes('<img')}`
    );
}

// ============================================================================
// Test 3: Validation Middleware
// ============================================================================
async function testValidationMiddleware() {
    logSubSection('Test 3: Validation Middleware (Requirement 3.4)');
    
    // Test 3a: Valid wallet address
    const req1 = createMockRequest({ walletAddress: VALID_WALLET });
    const res1 = createMockResponse();
    let nextCalled = false;
    validateWalletAddress(req1, res1, () => { nextCalled = true; });
    recordTest(
        '3a. Valid wallet address passes validation',
        nextCalled && res1.statusCode === null,
        `Wallet: ${VALID_WALLET.substring(0, 20)}...`
    );
    
    // Test 3b: Invalid wallet address (too short)
    const req2 = createMockRequest({ walletAddress: 'short' });
    const res2 = createMockResponse();
    validateWalletAddress(req2, res2, () => {});
    recordTest(
        '3b. Short wallet address is rejected',
        res2.statusCode === 400 && res2.jsonData.error.includes('Invalid wallet'),
        `Error: ${res2.jsonData?.error}`
    );
    
    // Test 3c: Invalid wallet address (invalid characters)
    const req3 = createMockRequest({ walletAddress: 'Invalid@#$%Wallet1234567890123456' });
    const res3 = createMockResponse();
    validateWalletAddress(req3, res3, () => {});
    recordTest(
        '3c. Wallet with invalid characters is rejected',
        res3.statusCode === 400,
        `Error: ${res3.jsonData?.error}`
    );
    
    // Test 3d: Valid transaction signature
    const req4 = createMockRequest({ transactionSignature: VALID_SIGNATURE });
    const res4 = createMockResponse();
    nextCalled = false;
    validateTransactionSignature(req4, res4, () => { nextCalled = true; });
    recordTest(
        '3d. Valid transaction signature passes validation',
        nextCalled && res4.statusCode === null,
        `Signature: ${VALID_SIGNATURE.substring(0, 20)}...`
    );
    
    // Test 3e: Invalid transaction signature (too short)
    const req5 = createMockRequest({ transactionSignature: 'short' });
    const res5 = createMockResponse();
    validateTransactionSignature(req5, res5, () => {});
    recordTest(
        '3e. Short transaction signature is rejected',
        res5.statusCode === 400 && res5.jsonData.error.includes('Invalid transaction'),
        `Error: ${res5.jsonData?.error}`
    );
}

// ============================================================================
// Test 4: POST /api/cards/submit - Missing Fields
// ============================================================================
async function testSubmitCardMissingFields(db) {
    logSubSection('Test 4: POST /api/cards/submit - Missing Fields (Requirement 3.4)');
    
    // Test 4a: Missing cardData
    const req1 = createMockRequest({
        transactionSignature: VALID_SIGNATURE,
        walletAddress: VALID_WALLET
    }, {}, db);
    const res1 = createMockResponse();
    await submitCard(req1, res1);
    recordTest(
        '4a. Missing cardData returns 400 error',
        res1.statusCode === 400 && res1.jsonData.error.includes('Missing required fields'),
        `Error: ${res1.jsonData?.error}`
    );
    
    // Test 4b: Missing transactionSignature
    const req2 = createMockRequest({
        cardData: VALID_CARD_DATA,
        walletAddress: VALID_WALLET
    }, {}, db);
    const res2 = createMockResponse();
    await submitCard(req2, res2);
    recordTest(
        '4b. Missing transactionSignature returns 400 error',
        res2.statusCode === 400 && res2.jsonData.error.includes('Missing required fields'),
        `Error: ${res2.jsonData?.error}`
    );
    
    // Test 4c: Missing walletAddress
    const req3 = createMockRequest({
        cardData: VALID_CARD_DATA,
        transactionSignature: VALID_SIGNATURE
    }, {}, db);
    const res3 = createMockResponse();
    await submitCard(req3, res3);
    recordTest(
        '4c. Missing walletAddress returns 400 error',
        res3.statusCode === 400 && res3.jsonData.error.includes('Missing required fields'),
        `Error: ${res3.jsonData?.error}`
    );
}

// ============================================================================
// Test 5: POST /api/cards/submit - Invalid Card Data
// ============================================================================
async function testSubmitCardInvalidData(db) {
    logSubSection('Test 5: POST /api/cards/submit - Invalid Card Data (Requirement 3.4, 3.5)');
    
    // Test 5a: Invalid card data (empty name)
    const invalidCard1 = { ...VALID_CARD_DATA, name: '' };
    const req1 = createMockRequest({
        cardData: invalidCard1,
        transactionSignature: VALID_SIGNATURE,
        walletAddress: VALID_WALLET
    }, {}, db);
    const res1 = createMockResponse();
    await submitCard(req1, res1);
    recordTest(
        '5a. Empty card name returns validation error',
        res1.statusCode === 400 && res1.jsonData.error.includes('validation failed'),
        `Error: ${res1.jsonData?.error}`
    );
    
    // Test 5b: Invalid URL
    const invalidCard2 = { ...VALID_CARD_DATA, url: 'not-a-url' };
    const req2 = createMockRequest({
        cardData: invalidCard2,
        transactionSignature: VALID_SIGNATURE,
        walletAddress: VALID_WALLET
    }, {}, db);
    const res2 = createMockResponse();
    await submitCard(req2, res2);
    recordTest(
        '5b. Invalid URL returns validation error',
        res2.statusCode === 400 && res2.jsonData.details.some(e => e.includes('valid URL')),
        `Validation errors: ${res2.jsonData?.details?.join(', ')}`
    );
    
    // Test 5c: Empty media URLs
    const invalidCard3 = { ...VALID_CARD_DATA, mediaUrls: [] };
    const req3 = createMockRequest({
        cardData: invalidCard3,
        transactionSignature: VALID_SIGNATURE,
        walletAddress: VALID_WALLET
    }, {}, db);
    const res3 = createMockResponse();
    await submitCard(req3, res3);
    recordTest(
        '5c. Empty media URLs returns validation error',
        res3.statusCode === 400 && res3.jsonData.details.some(e => e.includes('media')),
        `Validation errors: ${res3.jsonData?.details?.join(', ')}`
    );
}

// ============================================================================
// Test 6: GET /api/cards
// ============================================================================
async function testGetCards(db) {
    logSubSection('Test 6: GET /api/cards (Requirement 5.3, 5.4)');
    
    // Insert test cards
    await db.run(
        `INSERT INTO cards (wallet_address, transaction_signature, name, subtitle, description, url, icon, media_urls, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 hours'))`,
        [VALID_WALLET, 'sig1' + 'x'.repeat(84), 'Card 1', 'First card', 'Description 1', 
         'https://example.com/1', '🚀', JSON.stringify(['https://example.com/img1.png'])]
    );
    
    await db.run(
        `INSERT INTO cards (wallet_address, transaction_signature, name, subtitle, description, url, icon, media_urls, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 hour'))`,
        [ANOTHER_WALLET, 'sig2' + 'x'.repeat(84), 'Card 2', 'Second card', 'Description 2',
         'https://example.com/2', '🎯', JSON.stringify(['https://example.com/img2.png'])]
    );
    
    // Test 6a: Get all cards
    const req1 = createMockRequest({}, {}, db);
    const res1 = createMockResponse();
    await getCards(req1, res1);
    recordTest(
        '6a. GET /api/cards returns all published cards',
        res1.statusCode === null && res1.jsonData.success && res1.jsonData.count === 2,
        `Returned ${res1.jsonData?.count} cards`
    );
    
    // Test 6b: Cards are ordered by created_at ASC
    recordTest(
        '6b. Cards are ordered by creation time (oldest first)',
        res1.jsonData.cards[0].name === 'Card 1' && res1.jsonData.cards[1].name === 'Card 2',
        `Order: ${res1.jsonData.cards.map(c => c.name).join(' → ')}`
    );
    
    // Test 6c: Media URLs are parsed correctly
    recordTest(
        '6c. Media URLs are parsed as arrays',
        Array.isArray(res1.jsonData.cards[0].mediaUrls),
        `Type: ${typeof res1.jsonData.cards[0].mediaUrls}, IsArray: ${Array.isArray(res1.jsonData.cards[0].mediaUrls)}`
    );
}

// ============================================================================
// Test 7: PUT /api/cards/:cardId - Update Card
// ============================================================================
async function testUpdateCard(db) {
    logSubSection('Test 7: PUT /api/cards/:cardId - Update Card (Requirement 8.3)');
    
    // Insert a test card
    const result = await db.run(
        `INSERT INTO cards (wallet_address, transaction_signature, name, subtitle, description, url, icon, media_urls)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [VALID_WALLET, 'sig3' + 'x'.repeat(84), 'Original Card', 'Original subtitle', 'Original description',
         'https://example.com/original', '🚀', JSON.stringify(['https://example.com/original.png'])]
    );
    const cardId = result.lastID;
    
    // Test 7a: Owner can update card
    const req1 = createMockRequest({
        cardData: UPDATED_CARD_DATA,
        walletAddress: VALID_WALLET
    }, { cardId }, db);
    const res1 = createMockResponse();
    await updateCard(req1, res1);
    recordTest(
        '7a. Card owner can update card successfully',
        res1.statusCode === null && res1.jsonData.success,
        `Message: ${res1.jsonData?.message}`
    );
    
    // Test 7b: Updated data is correct
    const updatedCard = await db.get('SELECT * FROM cards WHERE id = ?', [cardId]);
    recordTest(
        '7b. Card data is updated correctly',
        updatedCard.name === UPDATED_CARD_DATA.name && updatedCard.url === UPDATED_CARD_DATA.url,
        `Name: ${updatedCard.name}, URL: ${updatedCard.url}`
    );
    
    // Test 7c: Transaction signature is preserved
    recordTest(
        '7c. Transaction signature is preserved after update',
        updatedCard.transaction_signature === 'sig3' + 'x'.repeat(84),
        `Signature: ${updatedCard.transaction_signature.substring(0, 20)}...`
    );
    
    // Test 7d: Non-owner cannot update
    const req2 = createMockRequest({
        cardData: UPDATED_CARD_DATA,
        walletAddress: ANOTHER_WALLET
    }, { cardId }, db);
    const res2 = createMockResponse();
    await updateCard(req2, res2);
    recordTest(
        '7d. Non-owner receives 403 error',
        res2.statusCode === 403 && res2.jsonData.error.includes('permission'),
        `Error: ${res2.jsonData?.error}`
    );
    
    // Test 7e: Invalid card data is rejected
    const invalidUpdate = { ...VALID_CARD_DATA, name: '' };
    const req3 = createMockRequest({
        cardData: invalidUpdate,
        walletAddress: VALID_WALLET
    }, { cardId }, db);
    const res3 = createMockResponse();
    await updateCard(req3, res3);
    recordTest(
        '7e. Invalid card data is rejected on update',
        res3.statusCode === 400 && res3.jsonData.error.includes('validation'),
        `Error: ${res3.jsonData?.error}`
    );
    
    // Test 7f: Non-existent card returns 404
    const req4 = createMockRequest({
        cardData: UPDATED_CARD_DATA,
        walletAddress: VALID_WALLET
    }, { cardId: 99999 }, db);
    const res4 = createMockResponse();
    await updateCard(req4, res4);
    recordTest(
        '7f. Non-existent card returns 404 error',
        res4.statusCode === 404 && res4.jsonData.error.includes('not found'),
        `Error: ${res4.jsonData?.error}`
    );
}

// ============================================================================
// Test 8: PUT /api/cards/:cardId - Missing Fields
// ============================================================================
async function testUpdateCardMissingFields(db) {
    logSubSection('Test 8: PUT /api/cards/:cardId - Missing Fields (Requirement 3.4)');
    
    // Test 8a: Missing cardData
    const req1 = createMockRequest({
        walletAddress: VALID_WALLET
    }, { cardId: 1 }, db);
    const res1 = createMockResponse();
    await updateCard(req1, res1);
    recordTest(
        '8a. Missing cardData returns 400 error',
        res1.statusCode === 400 && res1.jsonData.error.includes('Missing required fields'),
        `Error: ${res1.jsonData?.error}`
    );
    
    // Test 8b: Missing walletAddress
    const req2 = createMockRequest({
        cardData: UPDATED_CARD_DATA
    }, { cardId: 1 }, db);
    const res2 = createMockResponse();
    await updateCard(req2, res2);
    recordTest(
        '8b. Missing walletAddress returns 400 error',
        res2.statusCode === 400 && res2.jsonData.error.includes('Missing required fields'),
        `Error: ${res2.jsonData?.error}`
    );
}

// ============================================================================
// Main Test Runner
// ============================================================================
async function runAllTests() {
    logSection('Comprehensive API Testing Suite');
    log('Testing Requirements: 3.4, 3.5, 5.3, 5.4, 8.3', 'yellow');
    
    let db;
    
    try {
        // Initialize test database
        log('\nInitializing test database...', 'yellow');
        db = new Database(TEST_DB_PATH);
        await db.initialize();
        log('✓ Database initialized', 'green');
        
        // Run all test suites
        await testCardDataValidation();
        await testInputSanitization();
        await testValidationMiddleware();
        await testSubmitCardMissingFields(db);
        await testSubmitCardInvalidData(db);
        await testGetCards(db);
        await testUpdateCard(db);
        await testUpdateCardMissingFields(db);
        
        // Display summary
        logSection('Test Summary');
        
        const passed = testResults.filter(r => r.passed).length;
        const failed = testResults.filter(r => !r.passed).length;
        const total = testResults.length;
        
        console.log(`\nTotal Tests: ${total}`);
        log(`Passed: ${passed}`, 'green');
        log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\nFailed Tests:');
            testResults.filter(r => !r.passed).forEach(r => {
                log(`  ✗ ${r.name}`, 'red');
                if (r.details) console.log(`    ${r.details}`);
            });
        }
        
        logSection('Test Complete');
        
        if (passed === total) {
            log('\n✓ All tests passed! API is functioning correctly.', 'green');
            process.exit(0);
        } else {
            log('\n✗ Some tests failed. Please review the implementation.', 'red');
            process.exit(1);
        }
        
    } catch (error) {
        log(`\n✗ FATAL ERROR: ${error.message}`, 'red');
        console.error(error.stack);
        process.exit(1);
    } finally {
        if (db) {
            await db.close();
        }
    }
}

// Run tests
runAllTests();
          
            await submitCard(req, res);
            
            if (res.statusCode === 400 && res.jsonData.error.includes('Missing required fields')) {
                this.recordResult(
                    `Missing ${testCase.missing}`,
                    true,
                    `Correctly rejected with 400`
                );
            } else {
                this.recordResult(
                    `Missing ${testCase.missing}`,
                    false,
                    `Expected 400, got ${res.statusCode}`
                );
                allPassed = false;
            }
        }
        
        return allPassed;
    }

    // Test 3: POST /api/cards/submit with invalid card data
    async testInvalidCardData() {
        logSubSection('Test 3: Invalid Card Data Validation');
        
        const invalidCases = [
            {
                name: 'Empty name',
                data: { ...VALID_CARD_DATA, name: '' }
            },
            {
                name: 'Name too long',
                data: { ...VALID_CARD_DATA, name: 'A'.repeat(51) }
            },
            {
                name: 'Empty subtitle',
                data: { ...VALID_CARD_DATA, subtitle: '' }
            },
            {
                name: 'Subtitle too long',
                data: { ...VALID_CARD_DATA, subtitle: 'A'.repeat(101) }
            },
            {
                name: 'Empty description',
                data: { ...VALID_CARD_DATA, description: '' }
            },
            {
                name: 'Description too long',
                data: { ...VALID_CARD_DATA, description: 'A'.repeat(201) }
            },
            {
                name: 'Invalid URL',
                data: { ...VALID_CARD_DATA, url: 'not-a-valid-url' }
            },
            {
                name: 'Empty icon',
                data: { ...VALID_CARD_DATA, icon: '' }
            },
            {
                name: 'Empty mediaUrls array',
                data: { ...VALID_CARD_DATA, mediaUrls: [] }
            },
            {
                name: 'Too many mediaUrls',
                data: { ...VALID_CARD_DATA, mediaUrls: Array(6).fill('https://example.com/image.png') }
            },
            {
                name: 'mediaUrls not an array',
                data: { ...VALID_CARD_DATA, mediaUrls: 'not-an-array' }
            }
        ];
        
        let allPassed = true;
        
        for (const testCase of invalidCases) {
            const req = createMockRequest({
                cardData: testCase.data,
                transactionSignature: VALID_SIGNATURE,
                walletAddress: VALID_WALLET
            }, {}, this.db);
            
            const res = createMockResponse();
            
            await submitCard(req, res);
            
            if (res.statusCode === 400 && res.jsonData.error === 'Card data validation failed') {
                this.recordResult(
                    testCase.name,
                    true,
                    `Validation error: ${res.jsonData.details[0]}`
                );
            } else {
                this.recordResult(
                    testCase.name,
                    false,
                    `Expected validation error, got status ${res.statusCode}`
                );
                allPassed = false;
            }
        }
        
        return allPassed;
    }

    // Test 4: GET /api/cards returns submitted card
    async testGetCards() {
        logSubSection('Test 4: Get All Cards');
        
        const req = createMockRequest({}, {}, this.db);
        const res = createMockResponse();
        
        await getCards(req, res);
        
        if (res.statusCode === 200 && res.jsonData.success && Array.isArray(res.jsonData.cards)) {
            const foundCard = res.jsonData.cards.find(c => c.id === this.submittedCardId);
            
            if (foundCard) {
                this.recordResult(
                    'Get cards returns submitted card',
                    true,
                    `Found card with ID ${this.submittedCardId}, count: ${res.jsonData.count}`
                );
                
                // Verify card data
                const dataMatches = 
                    foundCard.name === VALID_CARD_DATA.name &&
                    foundCard.subtitle === VALID_CARD_DATA.subtitle &&
                    foundCard.description === VALID_CARD_DATA.description &&
                    foundCard.url === VALID_CARD_DATA.url &&
                    foundCard.icon === VALID_CARD_DATA.icon &&
                    JSON.stringify(foundCard.mediaUrls) === JSON.stringify(VALID_CARD_DATA.mediaUrls);
                
                this.recordResult(
                    'Card data integrity',
                    dataMatches,
                    dataMatches ? 'All fields match' : 'Some fields do not match'
                );
                
                return dataMatches;
            } else {
                this.recordResult(
                    'Get cards returns submitted card',
                    false,
                    `Card ID ${this.submittedCardId} not found in results`
                );
                return false;
            }
        } else {
            this.recordResult(
                'Get cards returns submitted card',
                false,
                `Status: ${res.statusCode}, Success: ${res.jsonData.success}`
            );
            return false;
        }
    }

    // Test 5: PUT /api/cards/:cardId updates card correctly
    async testUpdateCard() {
        logSubSection('Test 5: Update Card');
        
        if (!this.submittedCardId) {
            this.recordResult('Update card', false, 'No card ID available');
            return false;
        }
        
        const req = createMockRequest({
            cardData: UPDATED_CARD_DATA,
            walletAddress: VALID_WALLET
        }, { cardId: this.submittedCardId }, this.db);
        
        const res = createMockResponse();
        
        await updateCard(req, res);
        
        if (res.statusCode === 200 && res.jsonData.success) {
            this.recordResult(
                'Update card with valid data',
                true,
                `Card ${this.submittedCardId} updated successfully`
            );
            
            // Verify updated data
            const updatedCard = res.jsonData.card;
            const dataMatches = 
                updatedCard.name === UPDATED_CARD_DATA.name &&
                updatedCard.subtitle === UPDATED_CARD_DATA.subtitle &&
                updatedCard.description === UPDATED_CARD_DATA.description &&
                updatedCard.url === UPDATED_CARD_DATA.url &&
                updatedCard.icon === UPDATED_CARD_DATA.icon;
            
            this.recordResult(
                'Updated card data integrity',
                dataMatches,
                dataMatches ? 'All fields updated correctly' : 'Some fields not updated'
            );
            
            return dataMatches;
        } else {
            this.recordResult(
                'Update card with valid data',
                false,
                `Status: ${res.statusCode}, Error: ${res.jsonData.error}`
            );
            return false;
        }
    }

    // Test 6: PUT /api/cards/:cardId with wrong wallet (authorization)
    async testUpdateCardUnauthorized() {
        logSubSection('Test 6: Update Card Authorization');
        
        if (!this.submittedCardId) {
            this.recordResult('Update card authorization', false, 'No card ID available');
            return false;
        }
        
        const req = createMockRequest({
            cardData: UPDATED_CARD_DATA,
            walletAddress: ANOTHER_WALLET
        }, { cardId: this.submittedCardId }, this.db);
        
        const res = createMockResponse();
        
        await updateCard(req, res);
        
        if (res.statusCode === 403 && res.jsonData.error === 'You do not have permission to edit this card') {
            this.recordResult(
                'Unauthorized update rejected',
                true,
                'Correctly returned 403 Forbidden'
            );
            return true;
        } else {
            this.recordResult(
                'Unauthorized update rejected',
                false,
                `Expected 403, got ${res.statusCode}`
            );
            return false;
        }
    }

    // Test 7: PUT /api/cards/:cardId with invalid data
    async testUpdateCardInvalidData() {
        logSubSection('Test 7: Update Card with Invalid Data');
        
        if (!this.submittedCardId) {
            this.recordResult('Update card invalid data', false, 'No card ID available');
            return false;
        }
        
        const invalidData = { ...UPDATED_CARD_DATA, name: '', url: 'invalid-url' };
        
        const req = createMockRequest({
            cardData: invalidData,
            walletAddress: VALID_WALLET
        }, { cardId: this.submittedCardId }, this.db);
        
        const res = createMockResponse();
        
        await updateCard(req, res);
        
        if (res.statusCode === 400 && res.jsonData.error === 'Card data validation failed') {
            this.recordResult(
                'Invalid update data rejected',
                true,
                `Validation errors: ${res.jsonData.details.length}`
            );
            return true;
        } else {
            this.recordResult(
                'Invalid update data rejected',
                false,
                `Expected 400, got ${res.statusCode}`
            );
            return false;
        }
    }

    // Test 8: PUT /api/cards/:cardId with non-existent card
    async testUpdateNonExistentCard() {
        logSubSection('Test 8: Update Non-Existent Card');
        
        const req = createMockRequest({
            cardData: UPDATED_CARD_DATA,
            walletAddress: VALID_WALLET
        }, { cardId: 99999 }, this.db);
        
        const res = createMockResponse();
        
        await updateCard(req, res);
        
        if (res.statusCode === 404 && res.jsonData.error === 'Card not found') {
            this.recordResult(
                'Non-existent card returns 404',
                true,
                'Correctly returned 404 Not Found'
            );
            return true;
        } else {
            this.recordResult(
                'Non-existent card returns 404',
                false,
                `Expected 404, got ${res.statusCode}`
            );
            return false;
        }
    }

    // Test 9: Input sanitization
    async testInputSanitization() {
        logSubSection('Test 9: Input Sanitization');
        
        const xssAttempts = [
            { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;' },
            { input: '<img src=x onerror=alert(1)>', expected: '&lt;img src=x onerror=alert(1)&gt;' },
            { input: 'Normal text', expected: 'Normal text' },
            { input: 'Text with "quotes" and \'apostrophes\'', expected: 'Text with &quot;quotes&quot; and &#x27;apostrophes&#x27;' }
        ];
        
        let allPassed = true;
        
        for (const test of xssAttempts) {
            const sanitized = sanitizeString(test.input);
            const passed = sanitized === test.expected;
            
            this.recordResult(
                `Sanitize: ${test.input.substring(0, 30)}...`,
                passed,
                passed ? 'Correctly sanitized' : `Expected: ${test.expected}, Got: ${sanitized}`
            );
            
            if (!passed) allPassed = false;
        }
        
        return allPassed;
    }

    // Test 10: Card data validation function
    async testValidateCardDataFunction() {
        logSubSection('Test 10: validateCardData Function');
        
        // Test valid data
        const validErrors = validateCardData(VALID_CARD_DATA);
        const validPassed = validErrors.length === 0;
        this.recordResult(
            'Valid card data has no errors',
            validPassed,
            validPassed ? 'No validation errors' : `Errors: ${validErrors.join(', ')}`
        );
        
        // Test invalid data
        const invalidData = { ...VALID_CARD_DATA, name: '', url: 'invalid' };
        const invalidErrors = validateCardData(invalidData);
        const invalidPassed = invalidErrors.length > 0;
        this.recordResult(
            'Invalid card data has errors',
            invalidPassed,
            invalidPassed ? `Found ${invalidErrors.length} errors` : 'No errors found'
        );
        
        return validPassed && invalidPassed;
    }

    // Generate summary
    printSummary() {
        logSection('Test Summary');
        
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const total = this.results.length;
        
        console.log(`\nTotal Tests: ${total}`);
        log(`Passed: ${passed}`, 'green');
        log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\nFailed Tests:');
            this.results.filter(r => !r.passed).forEach(r => {
                log(`  ✗ ${r.testName}`, 'red');
                if (r.details) console.log(`    ${r.details}`);
            });
        }
        
        return failed === 0;
    }
}

// Main test runner
async function runTests() {
    logSection('Comprehensive API Testing Suite');
    log('Requirements: 3.4, 3.5, 5.3, 5.4, 8.3', 'cyan');
    
    // Initialize database
    log('\nInitializing test database...', 'yellow');
    const db = new Database(TEST_DB_PATH);
    await db.initialize();
    log('✓ Database initialized', 'green');
    
    // Create test suite
    const suite = new APITestSuite(db);
    
    try {
        // Run all tests
        await suite.testValidCardSubmission();
        await suite.testMissingFields();
        await suite.testInvalidCardData();
        await suite.testGetCards();
        await suite.testUpdateCard();
        await suite.testUpdateCardUnauthorized();
        await suite.testUpdateCardInvalidData();
        await suite.testUpdateNonExistentCard();
        await suite.testInputSanitization();
        await suite.testValidateCardDataFunction();
        
        // Print summary
        const allPassed = suite.printSummary();
        
        // Cleanup
        await db.close();
        
        if (allPassed) {
            log('\n✓ All tests passed! API is functioning correctly.', 'green');
            process.exit(0);
        } else {
            log('\n✗ Some tests failed. Please review the implementation.', 'red');
            process.exit(1);
        }
        
    } catch (error) {
        log(`\n✗ Test execution failed: ${error.message}`, 'red');
        console.error(error.stack);
        await db.close();
        process.exit(1);
    }
}

// Run tests
if (require.main === module) {
    runTests();
}

module.exports = { runTests };
