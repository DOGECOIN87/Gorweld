const TransactionVerifier = require('../services/transactionVerifier');

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
    try {
        const { cardData, transactionSignature, walletAddress } = req.body;

        // Validate required fields
        if (!cardData || !transactionSignature || !walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: cardData, transactionSignature, walletAddress'
            });
        }

        // Validate card data
        const validationErrors = validateCardData(cardData);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Card data validation failed',
                details: validationErrors
            });
        }

        // Initialize transaction verifier
        const verifier = new TransactionVerifier(req.db);

        // Verify the transaction
        const verificationResult = await verifier.verifyTransaction(
            transactionSignature,
            walletAddress
        );

        if (!verificationResult.valid) {
            return res.status(400).json({
                success: false,
                error: verificationResult.error,
                code: verificationResult.code,
                details: verificationResult.details
            });
        }

        // Store card in database
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

        // Record transaction in transactions table
        await verifier.recordTransaction(verificationResult, result.lastID);

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
        console.error('Error submitting card:', error);
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

        res.json({
            success: true,
            count: parsedCards.length,
            cards: parsedCards
        });

    } catch (error) {
        console.error('Error fetching cards:', error);
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
    try {
        const { cardId } = req.params;
        const { cardData, walletAddress } = req.body;

        // Validate required fields
        if (!cardData || !walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: cardData, walletAddress'
            });
        }

        // Validate card data
        const validationErrors = validateCardData(cardData);
        if (validationErrors.length > 0) {
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
            return res.status(404).json({
                success: false,
                error: 'Card not found'
            });
        }

        if (existingCard.wallet_address !== walletAddress) {
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

        res.json({
            success: true,
            message: 'Card updated successfully',
            card: {
                ...updatedCard,
                mediaUrls: JSON.parse(updatedCard.media_urls)
            }
        });

    } catch (error) {
        console.error('Error updating card:', error);
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
