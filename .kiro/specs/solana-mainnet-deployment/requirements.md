# Requirements Document

## Introduction

The Gorweld project is a decentralized application (dApp) showcase platform built on the Gorbagana blockchain ecosystem. The system consists of a React-based frontend deployed to GitHub Pages and a Node.js backend API that handles project card submissions with Solana blockchain payment verification. The platform requires a 1 SOL payment (split 0.5 SOL to each of two treasury wallets) for new project listings, maintaining a first-come-first-served ordering system. This requirements document outlines the necessary steps to complete and verify the deployment to Solana Mainnet.

## Glossary

- **Gorweld_Frontend**: The React-based web application that displays project cards and handles user interactions
- **Gorweld_Backend**: The Express.js API server that processes card submissions and verifies Solana transactions
- **Solana_Mainnet**: The production Solana blockchain network (mainnet-beta)
- **Treasury_Wallet**: A Solana wallet address that receives payment for card submissions
- **Transaction_Signature**: A unique identifier for a Solana blockchain transaction
- **Card_Submission**: The process of submitting a project showcase card with payment verification
- **RPC_Endpoint**: A Remote Procedure Call URL used to communicate with the Solana blockchain
- **Payment_Split**: The mechanism that divides the 1 SOL payment equally between two treasury wallets
- **Transaction_Verifier**: The backend service that validates Solana transactions on the blockchain

## Requirements

### Requirement 1

**User Story:** As a platform administrator, I want to verify that all Solana mainnet configuration is correctly set across both frontend and backend, so that the system operates on the production blockchain network.

#### Acceptance Criteria

1. WHEN the Gorweld_Frontend loads, THE Gorweld_Frontend SHALL connect to the Solana mainnet-beta network using the RPC endpoint "https://api.mainnet-beta.solana.com"
2. WHEN the Gorweld_Backend initializes, THE Gorweld_Backend SHALL establish a connection to the Solana mainnet-beta network with "confirmed" commitment level
3. THE Gorweld_Frontend SHALL reference the production Treasury_Wallet addresses "BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt" and "Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo" in the configuration
4. THE Gorweld_Backend SHALL load Treasury_Wallet addresses from environment variables WALLET_1_ADDRESS and WALLET_2_ADDRESS
5. THE Gorweld_Frontend SHALL display the correct payment amount of 1 SOL to users during Card_Submission

### Requirement 2

**User Story:** As a platform administrator, I want to ensure the backend API is properly deployed and accessible, so that the frontend can communicate with payment verification services.

#### Acceptance Criteria

1. WHEN the Gorweld_Backend starts, THE Gorweld_Backend SHALL listen on the configured PORT and respond to health check requests at the "/health" endpoint
2. THE Gorweld_Backend SHALL serve API endpoints at the base path "/api" with CORS enabled for the production domain
3. WHEN a request is made to "https://api.gorweld.com/health", THE Gorweld_Backend SHALL return a JSON response with status "ok" and a timestamp
4. THE Gorweld_Frontend SHALL use the production API URL "https://api.gorweld.com/api" when deployed to gorweld.fun
5. THE Gorweld_Backend SHALL initialize the SQLite database with cards and transactions tables before accepting requests

### Requirement 3

**User Story:** As a project owner, I want to submit my project card with a 1 SOL payment, so that my project appears on the Gorweld showcase.

#### Acceptance Criteria

1. WHEN a user submits a Card_Submission with a valid Transaction_Signature, THE Gorweld_Backend SHALL verify the transaction exists on Solana_Mainnet
2. WHEN the Transaction_Verifier validates a transaction, THE Transaction_Verifier SHALL confirm that exactly 0.5 SOL was transferred to each Treasury_Wallet
3. IF a Transaction_Signature has been used previously, THEN THE Gorweld_Backend SHALL reject the Card_Submission with error code "DUPLICATE_SIGNATURE"
4. WHEN a transaction is verified successfully, THE Gorweld_Backend SHALL store the card data in the database with the associated Transaction_Signature
5. WHEN a Card_Submission is accepted, THE Gorweld_Backend SHALL return a success response with the assigned card ID and confirmation message

### Requirement 4

**User Story:** As a platform administrator, I want comprehensive error handling for payment verification failures, so that users receive clear feedback when transactions are invalid.

#### Acceptance Criteria

1. WHEN a Transaction_Signature is not found on Solana_Mainnet, THE Transaction_Verifier SHALL return error code "TRANSACTION_NOT_FOUND" with a descriptive message
2. WHEN a transaction amount does not equal 1 SOL total, THE Transaction_Verifier SHALL return error code "INVALID_TOTAL_AMOUNT" with details showing expected and actual amounts
3. WHEN a transaction sender does not match the provided wallet address, THE Transaction_Verifier SHALL return error code "SENDER_MISMATCH" with both addresses
4. WHEN either Treasury_Wallet is not found in the transaction recipients, THE Transaction_Verifier SHALL return error codes "INVALID_RECIPIENT_WALLET_1" or "INVALID_RECIPIENT_WALLET_2"
5. WHEN the RPC endpoint rate limit is exceeded, THE Transaction_Verifier SHALL return error code "RATE_LIMIT" with a retry message

### Requirement 5

**User Story:** As a platform administrator, I want to verify the complete end-to-end deployment, so that I can confirm the system is production-ready.

#### Acceptance Criteria

1. WHEN accessing "https://gorweld.fun", THE Gorweld_Frontend SHALL load successfully with HTTPS enabled and valid SSL certificate
2. WHEN the Gorweld_Frontend makes API requests, THE Gorweld_Frontend SHALL successfully communicate with "https://api.gorweld.com/api" endpoints
3. THE Gorweld_Backend SHALL successfully verify test transactions on Solana_Mainnet and return accurate validation results
4. WHEN retrieving published cards, THE Gorweld_Backend SHALL return cards ordered by creation timestamp in ascending order
5. THE Gorweld_Frontend SHALL display all published cards with correct media, descriptions, and links

### Requirement 6

**User Story:** As a platform administrator, I want proper environment configuration management, so that sensitive credentials are secured and deployment environments are clearly separated.

#### Acceptance Criteria

1. THE Gorweld_Backend SHALL load all configuration values from environment variables using the dotenv package
2. WHEN the Gorweld_Backend starts in production mode, THE Gorweld_Backend SHALL use NODE_ENV value "production"
3. THE Gorweld_Backend SHALL NOT expose Treasury_Wallet private keys or sensitive credentials in configuration files
4. THE Gorweld_Frontend SHALL use the production configuration file when deployed to GitHub Pages
5. WHEN environment variables are missing, THE Gorweld_Backend SHALL log clear error messages indicating which variables are required

### Requirement 7

**User Story:** As a platform administrator, I want monitoring and logging capabilities, so that I can track system health and diagnose issues in production.

#### Acceptance Criteria

1. WHEN the Gorweld_Backend receives any HTTP request, THE Gorweld_Backend SHALL log the timestamp, HTTP method, and request path
2. WHEN a transaction verification fails, THE Transaction_Verifier SHALL log the error details including signature and failure reason
3. WHEN the Gorweld_Backend encounters an error, THE Gorweld_Backend SHALL log the full error stack trace for debugging
4. THE Gorweld_Backend SHALL handle SIGINT and SIGTERM signals by closing database connections gracefully before shutdown
5. WHEN the database initialization fails, THE Gorweld_Backend SHALL log the error and exit with status code 1

### Requirement 8

**User Story:** As a project owner, I want to update my existing project card, so that I can keep my project information current without paying again.

#### Acceptance Criteria

1. WHEN a wallet address that owns a card requests an update, THE Gorweld_Backend SHALL allow modification of card data without requiring a new payment
2. WHEN a wallet address attempts to update a card it does not own, THE Gorweld_Backend SHALL reject the request with HTTP status 403 and error message "You do not have permission to edit this card"
3. WHEN a card is updated, THE Gorweld_Backend SHALL validate all card data fields using the same validation rules as new submissions
4. WHEN a card update is successful, THE Gorweld_Backend SHALL update the "updated_at" timestamp to the current time
5. THE Gorweld_Backend SHALL preserve the original Transaction_Signature and creation timestamp when updating a card
