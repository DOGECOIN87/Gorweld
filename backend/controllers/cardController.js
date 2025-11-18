const TransactionVerifier = require('../services/transactionVerifier');
const { startTimer } = require('../utils/logger');

/**
 * Validate card data fields
 */
function validateCardData(cardData) {
    const errors = [];

    if (!cardData.name || typeof cardData.name !== 'string' || cardData.name.trim().length === 0) {
        errors.push('Card name is required');
    } else if (cardData.name.length > 50) {
        errors.push('Card name must be 50 characters or less');
    }

    if (!cardData.subtitle || typeof cardData.subtitle !== 'string' || cardData.subtitle.trim().length === 0) {
        errors.push('Card subtitle is required');
    } else if (cardData.subtitle.length > 100) {
        errors.push('Card subtitle must be 100 characters or less');
    }

    if (!cardData.description || typeof cardData.description !== 'string' || cardData.description.trim().length === 0) {
        errors.push('Card description is required');
    } else if (cardData.description.length > 200) {
        errors.push('Card description must be 200 characters or less');
    }

    if (!cardData.url || typeof cardData.url !== 'string') {
        errors.push('Card URL is required');
    } else {
        try {
            new URL(cardData.url);
        } catch (e) {
            errors.push('Card URL must be a valid URL');
        }
    }

    if (!cardData.icon || typeof cardData.icon !== 'string' || cardData.icon.trim().length === 0) {
        errors.push('Card icon is required');
    }

    if (!Array.isArray(cardData.mediaUrls)) {
        errors.push('Media URLs must be an array');
    } else if (cardData.mediaUrls.length === 0) {
        errors.push('At least one media file is required');
    } else if (cardData.mediaUrls.length > 5) {
        errors.push('Maximum 5 media files allowed');
    }

    return errors;
}

/**
 * Submit a new card with payment verification
 */
async function submitCard(req, res) {
    const timer = startTimer('submit_card');
    const logger = req.logger;
    
    try {
        const { cardData, transactionSignature, walletAddress } = req.body;

        logger.info('Card submission started', {
            walletAddress,
            transactionSignature,
            cardName: cardData?.name
        });

        // Validate required fields
        if (!cardData || !transactionSignature || !walletAddress) {
            logger.warn('Card submission failed: missing required fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: cardData, transactionSignature, walletAddress'
            });
        }

        // Validate card data
        const validationErrors = validateCardData(cardData);
        if (validationErrors.length > 0) {
            logger.warn('Card submission failed: validation errors', {
                errors: validationErrors
            });
            return res.status(400).json({
                success: false,
                error: 'Card data validation failed',
                details: validationErrors
            });
        }

        // Initialize transaction verifier with request logger
        const verifier = new TransactionVerifier(req.db, logger);

        // Verify the transaction
        const verificationResult = await verifier.verifyTransaction(
            transactionSignature,
            walletAddress
        );

        if (!verificationResult.valid) {
            logger.warn('Card submission failed: transaction verification failed', {
                code: verificationResult.code,
                error: verificationResult.error
            });
            return res.status(400).json({
                success: false,
                error: verificationResult.error,
                code: verificationResult.code,
                details: verificationResult.details
            });
        }

        // Store card in database
        const dbTimer = startTimer('database_insert_card');
        const mediaUrlsJson = JSON.stringify(cardData.mediaUrls);
        const result = await req.db.run(
            `INSERT INTO cards (wallet_address, transaction_signature, name, subtitle, description, url, icon, media_urls)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                walletAddress,
                transactionSignature,
                cardData.name.trim(),
                cardData.subtitle.trim(),
                cardData.description.trim(),
                cardData.url,
                cardData.icon,
                mediaUrlsJson
            ]
        );
        dbTimer.end();

        // Record transaction in transactions table
        await verifier.recordTransaction(verificationResult, result.lastID);

        const duration = timer.end({
            cardId: result.lastID,
            result: 'success'
        });

        logger.info('Card submitted successfully', {
            cardId: result.lastID,
            walletAddress,
            transactionSignature,
            duration_ms: duration
        });

        // Return success response
        res.status(201).json({
            success: true,
            cardId: result.lastID,
            message: 'Card submitted successfully',
            card: {
                id: result.lastID,
                walletAddress,
                transactionSignature,
                ...cardData
            }
        });

    } catch (error) {
        timer.end({ result: 'error' });
        logger.error('Error submitting card', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: 'Failed to submit card',
            message: error.message
        });
    }
}

/**
 * Get all published cards
 */
async function getCards(req, res) {
    const timer = startTimer('get_cards');
    const logger = req.logger;
    
    try {
        const cards = await req.db.all(
            `SELECT id, wallet_address, name, subtitle, description, url, icon, media_urls, created_at, updated_at
             FROM cards
             WHERE published = TRUE
             ORDER BY created_at ASC`
        );

        // Parse media_urls JSON for each card
        const parsedCards = cards.map(card => ({
            ...card,
            mediaUrls: JSON.parse(card.media_urls)
        }));

        timer.end({ count: parsedCards.length });
        
        logger.info('Cards retrieved successfully', {
            count: parsedCards.length
        });

        res.json({
            success: true,
            count: parsedCards.length,
            cards: parsedCards
        });

    } catch (error) {
        timer.end({ result: 'error' });
        logger.error('Error fetching cards', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cards',
            message: error.message
        });
    }
}

/**
 * Update an existing card
 */
async function updateCard(req, res) {
    const timer = startTimer('update_card');
    const logger = req.logger;
    
    try {
        const { cardId } = req.params;
        const { cardData, walletAddress } = req.body;

        logger.info('Card update started', {
            cardId,
            walletAddress
        });

        // Validate required fields
        if (!cardData || !walletAddress) {
            logger.warn('Card update failed: missing required fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: cardData, walletAddress'
            });
        }

        // Validate card data
        const validationErrors = validateCardData(cardData);
        if (validationErrors.length > 0) {
            logger.warn('Card update failed: validation errors', {
                errors: validationErrors
            });
            return res.status(400).json({
                success: false,
                error: 'Card data validation failed',
                details: validationErrors
            });
        }

        // Check if card exists and belongs to the wallet
        const existingCard = await req.db.get(
            'SELECT * FROM cards WHERE id = ?',
            [cardId]
        );

        if (!existingCard) {
            logger.warn('Card update failed: card not found', { cardId });
            return res.status(404).json({
                success: false,
                error: 'Card not found'
            });
        }

        if (existingCard.wallet_address !== walletAddress) {
            logger.warn('Card update failed: permission denied', {
                cardId,
                requestWallet: walletAddress,
                ownerWallet: existingCard.wallet_address
            });
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to edit this card'
            });
        }

        // Update card in database
        const mediaUrlsJson = JSON.stringify(cardData.mediaUrls);
        await req.db.run(
            `UPDATE cards
             SET name = ?, subtitle = ?, description = ?, url = ?, icon = ?, media_urls = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                cardData.name.trim(),
                cardData.subtitle.trim(),
                cardData.description.trim(),
                cardData.url,
                cardData.icon,
                mediaUrlsJson,
                cardId
            ]
        );

        // Fetch updated card
        const updatedCard = await req.db.get(
            'SELECT * FROM cards WHERE id = ?',
            [cardId]
        );

        timer.end({ cardId, result: 'success' });
        
        logger.info('Card updated successfully', {
            cardId,
            walletAddress
        });

        res.json({
            success: true,
            message: 'Card updated successfully',
            card: {
                ...updatedCard,
                mediaUrls: JSON.parse(updatedCard.media_urls)
            }
        });

    } catch (error) {
        timer.end({ result: 'error' });
        logger.error('Error updating card', {
            cardId: req.params.cardId,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: 'Failed to update card',
            message: error.message
        });
    }
}

module.exports = {
    submitCard,
    getCards,
    updateCard,
    validateCardData
};
