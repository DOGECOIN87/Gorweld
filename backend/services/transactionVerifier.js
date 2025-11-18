const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { logger, startTimer } = require('../utils/logger');

class TransactionVerifier {
    constructor(db, requestLogger = null) {
        this.db = db;
        this.logger = requestLogger || logger;
        this.connection = new Connection(
            process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
            'confirmed'
        );
        
        // Payment Wallet Configuration
        this.wallet1Address = new PublicKey(process.env.WALLET_1_ADDRESS || process.env.TREASURY_WALLET_ADDRESS);
        this.wallet2Address = new PublicKey(process.env.WALLET_2_ADDRESS || process.env.TREASURY_WALLET_ADDRESS);
        
        // Legacy single treasury address (for backward compatibility)
        this.treasuryAddress = this.wallet1Address;
        
        this.requiredAmount = LAMPORTS_PER_SOL; // 1 SOL in lamports
        this.amount1 = Math.floor(this.requiredAmount / 2); // 0.5 SOL to wallet 1
        this.amount2 = this.requiredAmount - this.amount1; // 0.5 SOL to wallet 2 (handles odd lamports)
    }

    /**
     * Verify a transaction signature on the Solana blockchain
     * @param {string} signature - Transaction signature to verify
     * @param {string} expectedSender - Expected sender wallet address
     * @returns {Promise<Object>} Verification result
     */
    async verifyTransaction(signature, expectedSender) {
        const timer = startTimer('transaction_verification');
        
        this.logger.info('Starting transaction verification', {
            signature,
            expectedSender
        });
        
        try {
            // Check if transaction signature has already been used
            const existingTx = await this.db.get(
                'SELECT * FROM transactions WHERE signature = ?',
                [signature]
            );

            if (existingTx) {
                this.logger.warn('Transaction verification failed: duplicate signature', {
                    signature,
                    code: 'DUPLICATE_SIGNATURE'
                });
                
                return {
                    valid: false,
                    error: 'Transaction signature already used',
                    code: 'DUPLICATE_SIGNATURE'
                };
            }

            // Fetch transaction from Solana blockchain
            const rpcTimer = startTimer('rpc_getTransaction');
            const transaction = await this.connection.getTransaction(signature, {
                maxSupportedTransactionVersion: 0
            });
            rpcTimer.end();

            if (!transaction) {
                this.logger.warn('Transaction verification failed: not found', {
                    signature,
                    code: 'TRANSACTION_NOT_FOUND'
                });
                
                return {
                    valid: false,
                    error: 'Transaction not found on blockchain',
                    code: 'TRANSACTION_NOT_FOUND'
                };
            }

            // Check if transaction is confirmed
            if (!transaction.meta || transaction.meta.err) {
                this.logger.warn('Transaction verification failed: not confirmed', {
                    signature,
                    code: 'TRANSACTION_FAILED',
                    error: transaction.meta?.err
                });
                
                return {
                    valid: false,
                    error: 'Transaction failed or not confirmed',
                    code: 'TRANSACTION_FAILED'
                };
            }

            // Extract transaction details
            const { meta, transaction: txData } = transaction;
            const accountKeys = txData.message.accountKeys || txData.message.staticAccountKeys;
            
            // Get sender (first account key, fee payer)
            const sender = accountKeys[0].toString();

            // Verify sender matches expected wallet
            if (sender !== expectedSender) {
                this.logger.warn('Transaction verification failed: sender mismatch', {
                    signature,
                    code: 'SENDER_MISMATCH',
                    expected: expectedSender,
                    actual: sender
                });
                
                return {
                    valid: false,
                    error: 'Transaction sender does not match provided wallet address',
                    code: 'SENDER_MISMATCH',
                    details: {
                        expected: expectedSender,
                        actual: sender
                    }
                };
            }

            // Find both wallet addresses in account keys
            const wallet1Index = accountKeys.findIndex(
                key => key.toString() === this.wallet1Address.toString()
            );
            const wallet2Index = accountKeys.findIndex(
                key => key.toString() === this.wallet2Address.toString()
            );

            if (wallet1Index === -1) {
                this.logger.warn('Transaction verification failed: wallet 1 not found', {
                    signature,
                    code: 'INVALID_RECIPIENT_WALLET_1',
                    expectedWallet: this.wallet1Address.toString()
                });
                
                return {
                    valid: false,
                    error: 'Wallet 1 address not found in transaction',
                    code: 'INVALID_RECIPIENT_WALLET_1'
                };
            }

            if (wallet2Index === -1) {
                this.logger.warn('Transaction verification failed: wallet 2 not found', {
                    signature,
                    code: 'INVALID_RECIPIENT_WALLET_2',
                    expectedWallet: this.wallet2Address.toString()
                });
                
                return {
                    valid: false,
                    error: 'Wallet 2 address not found in transaction',
                    code: 'INVALID_RECIPIENT_WALLET_2'
                };
            }

            // Calculate amounts transferred to each wallet
            const wallet1PreBalance = meta.preBalances[wallet1Index];
            const wallet1PostBalance = meta.postBalances[wallet1Index];
            const wallet1Transfer = wallet1PostBalance - wallet1PreBalance;

            const wallet2PreBalance = meta.preBalances[wallet2Index];
            const wallet2PostBalance = meta.postBalances[wallet2Index];
            const wallet2Transfer = wallet2PostBalance - wallet2PreBalance;

            const totalTransferred = wallet1Transfer + wallet2Transfer;

            // Verify total amount is exactly 1 SOL
            if (totalTransferred !== this.requiredAmount) {
                this.logger.warn('Transaction verification failed: invalid total amount', {
                    signature,
                    code: 'INVALID_TOTAL_AMOUNT',
                    required: this.requiredAmount,
                    actual: totalTransferred,
                    requiredSOL: this.requiredAmount / LAMPORTS_PER_SOL,
                    actualSOL: totalTransferred / LAMPORTS_PER_SOL
                });
                
                return {
                    valid: false,
                    error: 'Total transaction amount is not exactly 1 SOL',
                    code: 'INVALID_TOTAL_AMOUNT',
                    details: {
                        required: this.requiredAmount,
                        actual: totalTransferred,
                        requiredSOL: this.requiredAmount / LAMPORTS_PER_SOL,
                        actualSOL: totalTransferred / LAMPORTS_PER_SOL,
                        wallet1Transfer: wallet1Transfer,
                        wallet2Transfer: wallet2Transfer,
                        wallet1TransferSOL: wallet1Transfer / LAMPORTS_PER_SOL,
                        wallet2TransferSOL: wallet2Transfer / LAMPORTS_PER_SOL
                    }
                };
            }

            // Verify payment amounts
            const expectedWallet1 = this.amount1;
            const expectedWallet2 = this.amount2;

            if (wallet1Transfer !== expectedWallet1 || wallet2Transfer !== expectedWallet2) {
                this.logger.warn('Transaction verification failed: invalid payment amounts', {
                    signature,
                    code: 'INVALID_PAYMENT_AMOUNTS',
                    expectedWallet1SOL: expectedWallet1 / LAMPORTS_PER_SOL,
                    expectedWallet2SOL: expectedWallet2 / LAMPORTS_PER_SOL,
                    actualWallet1SOL: wallet1Transfer / LAMPORTS_PER_SOL,
                    actualWallet2SOL: wallet2Transfer / LAMPORTS_PER_SOL
                });
                
                return {
                    valid: false,
                    error: 'Transaction amounts do not match required payment',
                    code: 'INVALID_PAYMENT_AMOUNTS',
                    details: {
                        expectedWallet1: expectedWallet1,
                        expectedWallet2: expectedWallet2,
                        actualWallet1: wallet1Transfer,
                        actualWallet2: wallet2Transfer,
                        expectedWallet1SOL: expectedWallet1 / LAMPORTS_PER_SOL,
                        expectedWallet2SOL: expectedWallet2 / LAMPORTS_PER_SOL,
                        actualWallet1SOL: wallet1Transfer / LAMPORTS_PER_SOL,
                        actualWallet2SOL: wallet2Transfer / LAMPORTS_PER_SOL
                    }
                };
            }

            // All checks passed
            const duration = timer.end({
                signature,
                result: 'success'
            });
            
            this.logger.info('Transaction verification successful', {
                signature,
                sender,
                totalSOL: totalTransferred / LAMPORTS_PER_SOL,
                blockTime: transaction.blockTime,
                slot: transaction.slot,
                duration_ms: duration
            });
            
            return {
                valid: true,
                signature,
                sender,
                recipients: {
                    wallet1: this.wallet1Address.toString(),
                    wallet2: this.wallet2Address.toString()
                },
                amounts: {
                    wallet1: wallet1Transfer,
                    wallet2: wallet2Transfer,
                    total: totalTransferred
                },
                amountsSOL: {
                    wallet1: wallet1Transfer / LAMPORTS_PER_SOL,
                    wallet2: wallet2Transfer / LAMPORTS_PER_SOL,
                    total: totalTransferred / LAMPORTS_PER_SOL
                },
                // Legacy fields for backward compatibility
                recipient: this.wallet1Address.toString(),
                amount: totalTransferred,
                amountSOL: totalTransferred / LAMPORTS_PER_SOL,
                blockTime: transaction.blockTime,
                slot: transaction.slot
            };

        } catch (error) {
            timer.end({
                signature,
                result: 'error',
                error: error.message
            });
            
            this.logger.error('Error verifying transaction', {
                signature,
                error: error.message,
                stack: error.stack
            });
            
            // Handle specific RPC errors
            if (error.message && error.message.includes('429')) {
                return {
                    valid: false,
                    error: 'RPC rate limit exceeded, please try again',
                    code: 'RATE_LIMIT'
                };
            }

            return {
                valid: false,
                error: error.message || 'Failed to verify transaction',
                code: 'VERIFICATION_ERROR'
            };
        }
    }

    /**
     * Record a verified transaction in the database
     * @param {Object} verificationResult - Result from verifyTransaction
     * @param {number} cardId - Associated card ID (optional)
     * @returns {Promise<Object>} Database insert result
     */
    async recordTransaction(verificationResult, cardId = null) {
        const { signature, sender, amount } = verificationResult;
        
        try {
            const result = await this.db.run(
                `INSERT INTO transactions (signature, wallet_address, amount, card_id)
                 VALUES (?, ?, ?, ?)`,
                [signature, sender, amount, cardId]
            );

            this.logger.info('Transaction recorded in database', {
                signature,
                transactionId: result.lastID,
                cardId
            });

            return {
                success: true,
                transactionId: result.lastID
            };
        } catch (error) {
            this.logger.error('Error recording transaction', {
                signature,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Check if a wallet address has already submitted a card
     * @param {string} walletAddress - Wallet address to check
     * @returns {Promise<Object|null>} Existing card or null
     */
    async getExistingCard(walletAddress) {
        try {
            const card = await this.db.get(
                'SELECT * FROM cards WHERE wallet_address = ? AND published = TRUE',
                [walletAddress]
            );
            
            if (card) {
                this.logger.debug('Found existing card for wallet', {
                    walletAddress,
                    cardId: card.id
                });
            }
            
            return card;
        } catch (error) {
            this.logger.error('Error checking existing card', {
                walletAddress,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = TransactionVerifier;
