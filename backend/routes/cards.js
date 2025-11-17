const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const { 
    validateRequiredFields, 
    validateWalletAddress, 
    validateTransactionSignature,
    validateCardId,
    sanitizeCardData
} = require('../middleware/validation');

/**
 * POST /api/cards/submit
 * Submit a new card with payment verification
 */
router.post('/submit', 
    validateRequiredFields(['cardData', 'transactionSignature', 'walletAddress']),
    validateWalletAddress,
    validateTransactionSignature,
    sanitizeCardData,
    cardController.submitCard
);

/**
 * GET /api/cards
 * Get all published cards
 */
router.get('/', cardController.getCards);

/**
 * PUT /api/cards/:cardId
 * Update an existing card
 */
router.put('/:cardId',
    validateCardId,
    validateRequiredFields(['cardData', 'walletAddress']),
    validateWalletAddress,
    sanitizeCardData,
    cardController.updateCard
);

module.exports = router;
