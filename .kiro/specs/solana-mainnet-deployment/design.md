# Design Document: Solana Mainnet Deployment

## Overview

The Gorweld platform is a decentralized application (dApp) showcase system that enables project owners to submit their projects to a public directory with payment verification on the Solana blockchain. The system consists of two primary components:

1. **Frontend Application**: A React-based single-page application deployed to GitHub Pages at gorweld.fun
2. **Backend API**: A Node.js/Express server that handles card submissions, payment verification, and data persistence

This design document outlines the architecture, components, and deployment strategy for completing the Solana Mainnet deployment. The system is already configured for mainnet-beta but requires verification, testing, and potential refinements to ensure production readiness.

### Key Features

- **Payment Split System**: 1 SOL payment divided equally (0.5 SOL each) between two treasury wallets
- **Transaction Verification**: On-chain verification of Solana transactions before accepting submissions
- **First-Come-First-Served**: Permanent ordering based on submission timestamp
- **Card Management**: Submit new cards and update existing cards without additional payment
- **Media Upload**: Support for images (PNG, JPG, WEBP) and videos (WEBM, MP4)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Gorweld Frontend (React + Vite)                   │  │
│  │         Deployed: https://gorweld.fun                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS/REST API
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                  Gorweld Backend API                             │
│              (Node.js + Express + SQLite)                        │
│              Deployed: https://api.gorweld.com                   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes                                               │  │
│  │  - POST /api/cards/submit                                 │  │
│  │  - GET  /api/cards                                        │  │
│  │  - PUT  /api/cards/:cardId                                │  │
│  │  - POST /api/upload                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Transaction Verifier Service                             │  │
│  │  - Connects to Solana RPC                                 │  │
│  │  - Verifies payment amounts                               │  │
│  │  - Validates wallet addresses                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SQLite Database                                          │  │
│  │  - cards table                                            │  │
│  │  - transactions table                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ RPC Calls
                         │
┌────────────────────────▼────────────────────────────────────────┐
│              Solana Mainnet-Beta Network                         │
│              RPC: https://api.mainnet-beta.solana.com            │
│                                                                   │
│  Treasury Wallets:                                               │
│  - Wallet 1: BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt      │
│  - Wallet 2: Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo      │
└──────────────────────────────────────────────────────────────────┘
```

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Repository                           │
│              https://github.com/DOGECOIN87/Gorweld.git           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Frontend Code (Gorweld/)                                 │  │
│  │  - React components                                       │  │
│  │  - Vite build configuration                               │  │
│  │  - Production config                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Backend Code (backend/)                                  │  │
│  │  - Express server                                         │  │
│  │  - Controllers & services                                 │  │
│  │  - Database models                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Push to main branch
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                   GitHub Actions Workflow                        │
│                  (.github/workflows/deploy.yml)                  │
│                                                                   │
│  Steps:                                                          │
│  1. Checkout code                                                │
│  2. Setup Node.js 18                                             │
│  3. Install dependencies (npm ci)                                │
│  4. Apply production config                                      │
│  5. Build application (npm run build:production)                 │
│  6. Copy CNAME and static files                                  │
│  7. Upload artifact                                              │
│  8. Deploy to GitHub Pages                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Deployment
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      GitHub Pages                                │
│                   https://gorweld.fun                            │
│                                                                   │
│  - Custom domain configured                                      │
│  - HTTPS enabled                                                 │
│  - CDN distribution                                              │
└──────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. Configuration Module (`config.js`)

**Purpose**: Centralized configuration management for environment-specific settings

**Key Properties**:
- `api.getBaseURL()`: Returns appropriate API URL based on environment (localhost vs production)
- `solana.network`: Network identifier ("mainnet-beta")
- `solana.rpcUrl`: Solana RPC endpoint
- `solana.wallet1Address`: First treasury wallet (receives 0.5 SOL)
- `solana.wallet2Address`: Second treasury wallet (receives 0.5 SOL)
- `solana.paymentAmount`: Required payment (1 SOL)
- `validation`: Field validation rules for card submissions

**Production Configuration**:
```javascript
{
  api: {
    production: 'https://api.gorweld.com/api'
  },
  solana: {
    network: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wallet1Address: 'BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt',
    wallet2Address: 'Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo',
    paymentAmount: 1
  }
}
```

#### 2. Card Submission Flow

**User Journey**:
1. User connects Solana wallet (Phantom, Solflare, etc.)
2. User fills out project information form
3. User uploads media files (images/videos)
4. User initiates payment transaction (1 SOL split to two wallets)
5. Frontend captures transaction signature
6. Frontend submits card data + transaction signature to backend
7. Backend verifies transaction on-chain
8. Card is stored and published

### Backend Components

#### 1. Express Server (`server/index.js`)

**Purpose**: Main application entry point and middleware configuration

**Responsibilities**:
- Initialize database connection
- Configure CORS for allowed origins
- Mount API routes
- Handle graceful shutdown
- Provide health check endpoint

**Key Endpoints**:
- `GET /health`: Health check (returns `{status: 'ok', timestamp}`)
- `POST /api/cards/submit`: Submit new card with payment
- `GET /api/cards`: Retrieve all published cards
- `PUT /api/cards/:cardId`: Update existing card
- `POST /api/upload`: Upload media files

#### 2. Transaction Verifier Service (`services/transactionVerifier.js`)

**Purpose**: Verify Solana transactions on-chain before accepting card submissions

**Key Methods**:

```javascript
class TransactionVerifier {
  constructor(db)
  
  // Verify transaction on Solana blockchain
  async verifyTransaction(signature, expectedSender)
  
  // Record verified transaction in database
  async recordTransaction(verificationResult, cardId)
  
  // Check if wallet already has a published card
  async getExistingCard(walletAddress)
}
```

**Verification Logic**:
1. Check if transaction signature already used (prevent duplicates)
2. Fetch transaction from Solana blockchain via RPC
3. Verify transaction is confirmed and successful
4. Extract sender address and validate against expected wallet
5. Locate both treasury wallets in transaction recipients
6. Calculate amounts transferred to each wallet
7. Verify total amount equals exactly 1 SOL (1,000,000,000 lamports)
8. Verify split amounts: 0.5 SOL to wallet1, 0.5 SOL to wallet2
9. Return verification result with detailed information

**Error Codes**:
- `DUPLICATE_SIGNATURE`: Transaction already used
- `TRANSACTION_NOT_FOUND`: Transaction not found on blockchain
- `TRANSACTION_FAILED`: Transaction failed or not confirmed
- `SENDER_MISMATCH`: Sender doesn't match provided wallet
- `INVALID_RECIPIENT_WALLET_1`: Wallet 1 not found in transaction
- `INVALID_RECIPIENT_WALLET_2`: Wallet 2 not found in transaction
- `INVALID_TOTAL_AMOUNT`: Total amount is not 1 SOL
- `INVALID_PAYMENT_AMOUNTS`: Split amounts incorrect
- `RATE_LIMIT`: RPC rate limit exceeded
- `VERIFICATION_ERROR`: General verification error

#### 3. Card Controller (`controllers/cardController.js`)

**Purpose**: Business logic for card operations

**Key Functions**:

```javascript
// Validate card data fields
function validateCardData(cardData)

// Submit new card with payment verification
async function submitCard(req, res)

// Get all published cards
async function getCards(req, res)

// Update existing card
async function updateCard(req, res)
```

**Validation Rules**:
- `name`: Required, 1-50 characters
- `subtitle`: Required, 1-100 characters
- `description`: Required, 1-200 characters
- `url`: Required, valid URL format
- `icon`: Required, non-empty string (emoji or icon identifier)
- `mediaUrls`: Required array, 1-5 URLs

#### 4. Upload Controller (`controllers/uploadController.js`)

**Purpose**: Handle media file uploads with validation

**Configuration**:
- Storage: Organized by date (`uploads/YYYY/MM/DD/`)
- Filename: `{sanitized-name}-{timestamp}-{random}.{ext}`
- Max files: 5 per request
- Image types: PNG, JPG, WEBP (max 5MB each)
- Video types: WEBM, MP4 (max 20MB each)

**Upload Flow**:
1. Receive multipart/form-data with 'media' field
2. Validate file types and sizes
3. Store files in date-organized directories
4. Generate public URLs for uploaded files
5. Return array of URLs to frontend

#### 5. Database Model (`models/database.js`)

**Purpose**: SQLite database wrapper with promise-based API

**Schema**:

**cards table**:
```sql
CREATE TABLE cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  transaction_signature TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL,
  media_urls TEXT NOT NULL,  -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published BOOLEAN DEFAULT TRUE
)
```

**transactions table**:
```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signature TEXT UNIQUE NOT NULL,
  wallet_address TEXT NOT NULL,
  amount BIGINT NOT NULL,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  card_id INTEGER,
  FOREIGN KEY (card_id) REFERENCES cards(id)
)
```

**Indexes**:
- `idx_wallet`: Index on `cards.wallet_address`
- `idx_created`: Index on `cards.created_at`

#### 6. Middleware

**Validation Middleware** (`middleware/validation.js`):
- `validateRequiredFields(fields)`: Ensure required fields present
- `validateWalletAddress`: Validate Solana wallet format (base58, 32-44 chars)
- `validateTransactionSignature`: Validate signature format (base58, 87-88 chars)
- `validateCardId`: Validate card ID parameter
- `sanitizeCardData`: Sanitize string inputs to prevent XSS

**Error Handler Middleware** (`middleware/errorHandler.js`):
- `errorHandler`: Centralized error handling with logging
- `notFoundHandler`: 404 handler for undefined routes
- `asyncHandler`: Wrapper for async route handlers
- `ApiError`: Custom error class with status codes

## Data Models

### Card Data Model

```typescript
interface Card {
  id: number;
  wallet_address: string;
  transaction_signature: string;
  name: string;
  subtitle: string;
  description: string;
  url: string;
  icon: string;
  media_urls: string;  // JSON array of URLs
  created_at: string;  // ISO timestamp
  updated_at: string;  // ISO timestamp
  published: boolean;
}
```

### Transaction Data Model

```typescript
interface Transaction {
  id: number;
  signature: string;
  wallet_address: string;
  amount: number;  // lamports
  verified_at: string;  // ISO timestamp
  card_id: number | null;
}
```

### Card Submission Request

```typescript
interface CardSubmissionRequest {
  cardData: {
    name: string;
    subtitle: string;
    description: string;
    url: string;
    icon: string;
    mediaUrls: string[];
  };
  transactionSignature: string;
  walletAddress: string;
}
```

### Verification Result

```typescript
interface VerificationResult {
  valid: boolean;
  signature?: string;
  sender?: string;
  recipients?: {
    wallet1: string;
    wallet2: string;
  };
  amounts?: {
    wallet1: number;  // lamports
    wallet2: number;  // lamports
    total: number;    // lamports
  };
  amountsSOL?: {
    wallet1: number;  // SOL
    wallet2: number;  // SOL
    total: number;    // SOL
  };
  blockTime?: number;
  slot?: number;
  error?: string;
  code?: string;
  details?: any;
}
```

## Error Handling

### Frontend Error Handling

**Strategy**: User-friendly error messages with actionable guidance

**Error Categories**:
1. **Wallet Connection Errors**: Guide user to install/connect wallet
2. **Payment Errors**: Display transaction failure reasons
3. **Validation Errors**: Highlight invalid form fields
4. **Network Errors**: Suggest retry or check connection
5. **API Errors**: Display backend error messages

### Backend Error Handling

**Strategy**: Comprehensive logging with structured error responses

**Error Response Format**:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "additional": "context"
  },
  "timestamp": "2025-11-17T12:00:00.000Z"
}
```

**Logging Strategy**:
- All requests logged with timestamp, method, path
- Errors logged with full stack trace in development
- Transaction verification failures logged with signature and reason
- Database errors logged with query context

**Graceful Shutdown**:
- Handle SIGINT and SIGTERM signals
- Close database connections cleanly
- Complete in-flight requests before shutdown

## Testing Strategy

### Frontend Testing

**Manual Testing Checklist**:
1. **Configuration Verification**:
   - Verify mainnet-beta network in browser console
   - Check API URL points to production
   - Confirm treasury wallet addresses match

2. **Wallet Connection**:
   - Test with Phantom wallet
   - Test with Solflare wallet
   - Verify wallet address display

3. **Card Submission**:
   - Fill out form with valid data
   - Upload media files
   - Initiate payment transaction
   - Verify transaction signature captured
   - Confirm card appears after submission

4. **Card Display**:
   - Verify all cards load
   - Check media displays correctly
   - Test links open correctly
   - Verify ordering (oldest first)

5. **Card Updates**:
   - Update existing card
   - Verify changes persist
   - Confirm no payment required

### Backend Testing

**Unit Testing**:
- Transaction verifier logic
- Card validation functions
- Database operations
- Middleware functions

**Integration Testing**:
1. **Health Check**:
   ```bash
   curl https://api.gorweld.com/health
   ```

2. **Card Retrieval**:
   ```bash
   curl https://api.gorweld.com/api/cards
   ```

3. **Card Submission** (with test transaction):
   ```bash
   curl -X POST https://api.gorweld.com/api/cards/submit \
     -H "Content-Type: application/json" \
     -d '{
       "cardData": {...},
       "transactionSignature": "...",
       "walletAddress": "..."
     }'
   ```

4. **Media Upload**:
   ```bash
   curl -X POST https://api.gorweld.com/api/upload \
     -F "media=@image.png"
   ```

**Mainnet Transaction Testing**:
1. Create test transaction on mainnet with 1 SOL
2. Split payment: 0.5 SOL to each treasury wallet
3. Capture transaction signature
4. Submit to backend for verification
5. Verify card is created and published

### End-to-End Testing

**Complete User Flow**:
1. Access https://gorweld.fun
2. Connect wallet
3. Fill out project information
4. Upload media files
5. Initiate payment (1 SOL)
6. Wait for transaction confirmation
7. Submit card with transaction signature
8. Verify card appears on homepage
9. Update card information
10. Verify updates display correctly

**Performance Testing**:
- Measure page load time
- Test API response times
- Verify RPC call latency
- Check database query performance

## Deployment Verification Checklist

### Pre-Deployment

- [ ] Verify `config.production.js` has correct mainnet settings
- [ ] Confirm treasury wallet addresses are correct
- [ ] Ensure `.env` file has production values
- [ ] Test backend locally with mainnet RPC
- [ ] Verify database schema is up to date
- [ ] Check GitHub Actions workflow is configured

### Frontend Deployment

- [ ] Push changes to main branch
- [ ] Monitor GitHub Actions workflow
- [ ] Verify build completes successfully
- [ ] Check CNAME file copied to dist
- [ ] Confirm deployment to GitHub Pages
- [ ] Access https://gorweld.fun
- [ ] Verify HTTPS certificate valid
- [ ] Check browser console for errors
- [ ] Test wallet connection
- [ ] Verify API calls reach backend

### Backend Deployment

- [ ] Deploy backend to production server
- [ ] Configure environment variables
- [ ] Start server with PM2 or systemd
- [ ] Verify health check responds
- [ ] Test API endpoints
- [ ] Check database connection
- [ ] Verify Solana RPC connection
- [ ] Test transaction verification
- [ ] Monitor logs for errors
- [ ] Configure SSL certificate
- [ ] Set up domain DNS (api.gorweld.com)
- [ ] Enable CORS for gorweld.fun

### Post-Deployment

- [ ] Test complete card submission flow
- [ ] Verify payment verification works
- [ ] Check card display on frontend
- [ ] Test card update functionality
- [ ] Monitor error logs
- [ ] Verify database backups
- [ ] Test with real mainnet transaction
- [ ] Confirm treasury wallets receive payments
- [ ] Document any issues encountered
- [ ] Create rollback plan if needed

## Security Considerations

### Frontend Security

1. **Configuration Protection**: Production config frozen to prevent modification
2. **Input Sanitization**: All user inputs sanitized before submission
3. **HTTPS Only**: Enforce HTTPS for all communications
4. **Wallet Security**: Never request private keys or seed phrases
5. **XSS Prevention**: Sanitize all displayed content

### Backend Security

1. **Environment Variables**: Sensitive data in environment variables, not code
2. **Input Validation**: Comprehensive validation on all endpoints
3. **SQL Injection Prevention**: Parameterized queries only
4. **CORS Configuration**: Restrict origins to known domains
5. **Rate Limiting**: Implement rate limiting on API endpoints (future enhancement)
6. **Transaction Verification**: Always verify on-chain before accepting
7. **Duplicate Prevention**: Check transaction signatures for reuse
8. **Error Messages**: Don't expose sensitive system information

### Solana Security

1. **Mainnet RPC**: Use reliable RPC endpoint (consider paid tier for production)
2. **Transaction Verification**: Multi-step verification process
3. **Amount Validation**: Exact amount checking (1 SOL = 1,000,000,000 lamports)
4. **Wallet Validation**: Verify both sender and recipients
5. **Confirmation Level**: Use 'confirmed' commitment for balance between speed and security

## Monitoring and Maintenance

### Logging

**Frontend Logging**:
- Browser console errors
- API request/response logging (development)
- Transaction signature capture

**Backend Logging**:
- All HTTP requests (timestamp, method, path)
- Transaction verification attempts
- Database operations
- Error stack traces
- Startup/shutdown events

### Monitoring Metrics

**Application Metrics**:
- API response times
- Database query performance
- RPC call latency
- Error rates
- Card submission success rate

**Infrastructure Metrics**:
- Server CPU/memory usage
- Disk space (for uploads and database)
- Network bandwidth
- SSL certificate expiration

### Maintenance Tasks

**Daily**:
- Check error logs
- Monitor API health
- Verify frontend accessibility

**Weekly**:
- Review transaction verification logs
- Check database size
- Backup database
- Review uploaded media storage

**Monthly**:
- Update dependencies
- Review security advisories
- Audit treasury wallet balances
- Performance optimization review

## Future Enhancements

### Short-Term

1. **Rate Limiting**: Implement rate limiting on API endpoints
2. **Caching**: Add Redis caching for card listings
3. **CDN**: Use CDN for uploaded media files
4. **Analytics**: Add usage analytics and metrics
5. **Admin Panel**: Create admin interface for card management

### Long-Term

1. **Smart Contract**: Move payment verification to on-chain program
2. **Decentralized Storage**: Use Arweave or IPFS for media
3. **Multi-Network**: Support other Solana networks (devnet, testnet)
4. **Advanced Features**: Categories, search, filtering
5. **User Profiles**: Enhanced user profiles and project tracking
