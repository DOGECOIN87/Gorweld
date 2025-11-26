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
 * Submit a new card (no payment required, optional wallet for ownership)
 */
router.post('/submit', 
    validateRequiredFields(['cardData']),
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
 * Update an existing card (requires wallet address if card has owner)
 */
router.put('/:cardId',
    validateCardId,
    validateRequiredFields(['cardData']),
    sanitizeCardData,
    cardController.updateCard
);

module.exports = router;
