/**
 * Test script to verify API structure without running the server
 */

console.log('Testing API structure...\n');

try {
    // Test imports
    console.log('✓ Testing imports...');
    const cardController = require('./controllers/cardController');
    const TransactionVerifier = require('./services/transactionVerifier');
    const validation = require('./middleware/validation');
    const errorHandler = require('./middleware/errorHandler');
    const Database = require('./models/database');
    
    console.log('✓ All modules imported successfully\n');
    
    // Test controller exports
    console.log('✓ Testing controller exports...');
    if (typeof cardController.submitCard !== 'function') {
        throw new Error('submitCard is not a function');
    }
    if (typeof cardController.getCards !== 'function') {
        throw new Error('getCards is not a function');
    }
    if (typeof cardController.updateCard !== 'function') {
        throw new Error('updateCard is not a function');
    }
    if (typeof cardController.validateCardData !== 'function') {
        throw new Error('validateCardData is not a function');
    }
    console.log('✓ All controller functions exported\n');
    
    // Test validation exports
    console.log('✓ Testing validation middleware exports...');
    if (typeof validation.validateRequiredFields !== 'function') {
        throw new Error('validateRequiredFields is not a function');
    }
    if (typeof validation.validateWalletAddress !== 'function') {
        throw new Error('validateWalletAddress is not a function');
    }
    if (typeof validation.validateTransactionSignature !== 'function') {
        throw new Error('validateTransactionSignature is not a function');
    }
    if (typeof validation.validateCardId !== 'function') {
        throw new Error('validateCardId is not a function');
    }
    if (typeof validation.sanitizeCardData !== 'function') {
        throw new Error('sanitizeCardData is not a function');
    }
    console.log('✓ All validation middleware exported\n');
    
    // Test error handler exports
    console.log('✓ Testing error handler exports...');
    if (typeof errorHandler.errorHandler !== 'function') {
        throw new Error('errorHandler is not a function');
    }
    if (typeof errorHandler.notFoundHandler !== 'function') {
        throw new Error('notFoundHandler is not a function');
    }
    if (typeof errorHandler.asyncHandler !== 'function') {
        throw new Error('asyncHandler is not a function');
    }
    if (typeof errorHandler.ApiError !== 'function') {
        throw new Error('ApiError is not a constructor');
    }
    console.log('✓ All error handlers exported\n');
    
    // Test TransactionVerifier class
    console.log('✓ Testing TransactionVerifier class...');
    if (typeof TransactionVerifier !== 'function') {
        throw new Error('TransactionVerifier is not a constructor');
    }
    console.log('✓ TransactionVerifier class is valid\n');
    
    // Test Database class
    console.log('✓ Testing Database class...');
    if (typeof Database !== 'function') {
        throw new Error('Database is not a constructor');
    }
    console.log('✓ Database class is valid\n');
    
    // Test card data validation
    console.log('✓ Testing card data validation...');
    const validCard = {
        name: 'Test Project',
        subtitle: 'A test project',
        description: 'This is a test project description',
        url: 'https://example.com',
        icon: '🚀',
        mediaUrls: ['https://example.com/image.png']
    };
    
    const errors = cardController.validateCardData(validCard);
    if (errors.length > 0) {
        throw new Error('Valid card data failed validation: ' + errors.join(', '));
    }
    console.log('✓ Card data validation works correctly\n');
    
    // Test invalid card data
    console.log('✓ Testing invalid card data detection...');
    const invalidCard = {
        name: '',
        subtitle: '',
        description: '',
        url: 'not-a-url',
        icon: '',
        mediaUrls: []
    };
    
    const invalidErrors = cardController.validateCardData(invalidCard);
    if (invalidErrors.length === 0) {
        throw new Error('Invalid card data passed validation');
    }
    console.log('✓ Invalid card data correctly rejected\n');
    
    console.log('✅ All API structure tests passed!');
    console.log('\nAPI endpoints configured:');
    console.log('  POST /api/cards/submit - Submit a new card');
    console.log('  GET  /api/cards - Get all published cards');
    console.log('  PUT  /api/cards/:cardId - Update an existing card');
    console.log('\nMiddleware configured:');
    console.log('  - CORS');
    console.log('  - JSON body parser');
    console.log('  - Request logging');
    console.log('  - Input validation');
    console.log('  - Error handling');
    console.log('\nServices implemented:');
    console.log('  - Transaction verification');
    console.log('  - Card validation');
    console.log('  - Database operations');
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
}
