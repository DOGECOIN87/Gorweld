/**
 * Validation middleware for API endpoints
 */

/**
 * Validate request body has required fields
 */
function validateRequiredFields(requiredFields) {
    return (req, res, next) => {
        const missingFields = [];
        
        for (const field of requiredFields) {
            if (!req.body[field]) {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                details: {
                    missing: missingFields,
                    required: requiredFields
                }
            });
        }

        next();
    };
}

/**
 * Validate Solana wallet address format
 */
function validateWalletAddress(req, res, next) {
    const { walletAddress } = req.body;

    if (!walletAddress) {
        return res.status(400).json({
            success: false,
            error: 'Wallet address is required'
        });
    }

    // Basic validation: Solana addresses are base58 encoded and typically 32-44 characters
    if (typeof walletAddress !== 'string' || walletAddress.length < 32 || walletAddress.length > 44) {
        return res.status(400).json({
            success: false,
            error: 'Invalid wallet address format'
        });
    }

    // Check for valid base58 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(walletAddress)) {
        return res.status(400).json({
            success: false,
            error: 'Wallet address contains invalid characters'
        });
    }

    next();
}

/**
 * Validate transaction signature format
 */
function validateTransactionSignature(req, res, next) {
    const { transactionSignature } = req.body;

    if (!transactionSignature) {
        return res.status(400).json({
            success: false,
            error: 'Transaction signature is required'
        });
    }

    // Solana transaction signatures are base58 encoded and typically 87-88 characters
    if (typeof transactionSignature !== 'string' || transactionSignature.length < 87 || transactionSignature.length > 88) {
        return res.status(400).json({
            success: false,
            error: 'Invalid transaction signature format'
        });
    }

    // Check for valid base58 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(transactionSignature)) {
        return res.status(400).json({
            success: false,
            error: 'Transaction signature contains invalid characters'
        });
    }

    next();
}

/**
 * Validate card ID parameter
 */
function validateCardId(req, res, next) {
    const { cardId } = req.params;

    if (!cardId) {
        return res.status(400).json({
            success: false,
            error: 'Card ID is required'
        });
    }

    const cardIdNum = parseInt(cardId, 10);
    if (isNaN(cardIdNum) || cardIdNum <= 0) {
        return res.status(400).json({
            success: false,
            error: 'Invalid card ID format'
        });
    }

    next();
}

/**
 * Sanitize string input to prevent XSS
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize card data
 */
function sanitizeCardData(req, res, next) {
    if (req.body.cardData) {
        const { cardData } = req.body;
        
        // Sanitize string fields
        if (cardData.name) cardData.name = sanitizeString(cardData.name);
        if (cardData.subtitle) cardData.subtitle = sanitizeString(cardData.subtitle);
        if (cardData.description) cardData.description = sanitizeString(cardData.description);
        if (cardData.icon) cardData.icon = sanitizeString(cardData.icon);
        
        // Sanitize media URLs array
        if (Array.isArray(cardData.mediaUrls)) {
            cardData.mediaUrls = cardData.mediaUrls.map(url => sanitizeString(url));
        }
    }

    next();
}

module.exports = {
    validateRequiredFields,
    validateWalletAddress,
    validateTransactionSignature,
    validateCardId,
    sanitizeCardData,
    sanitizeString
};
