# API Usage Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and set TREASURY_WALLET_ADDRESS
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## API Endpoints

### 1. Health Check
Check if the server is running.

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. Submit Card
Submit a new project card with payment verification.

**Request:**
```http
POST /api/cards/submit
Content-Type: application/json

{
  "cardData": {
    "name": "My Awesome Project",
    "subtitle": "A revolutionary dApp",
    "description": "This project does amazing things in the Gorbagana ecosystem",
    "url": "https://myproject.com",
    "icon": "🚀",
    "mediaUrls": [
      "https://myproject.com/screenshot1.png",
      "https://myproject.com/demo.mp4"
    ]
  },
  "transactionSignature": "5J7x...", 
  "walletAddress": "ABC123..."
}
```

**Success Response (201):**
```json
{
  "success": true,
  "cardId": 1,
  "message": "Card submitted successfully",
  "card": {
    "id": 1,
    "walletAddress": "ABC123...",
    "transactionSignature": "5J7x...",
    "name": "My Awesome Project",
    "subtitle": "A revolutionary dApp",
    "description": "This project does amazing things in the Gorbagana ecosystem",
    "url": "https://myproject.com",
    "icon": "🚀",
    "mediaUrls": [
      "https://myproject.com/screenshot1.png",
      "https://myproject.com/demo.mp4"
    ]
  }
}
```

**Error Responses:**

*Missing fields (400):*
```json
{
  "success": false,
  "error": "Missing required fields: cardData, transactionSignature, walletAddress"
}
```

*Invalid card data (400):*
```json
{
  "success": false,
  "error": "Card data validation failed",
  "details": [
    "Card name is required",
    "Card URL must be a valid URL"
  ]
}
```

*Invalid transaction (400):*
```json
{
  "success": false,
  "error": "Transaction amount is not exactly 1 SOL",
  "code": "INVALID_AMOUNT",
  "details": {
    "required": 1000000000,
    "actual": 500000000,
    "requiredSOL": 1,
    "actualSOL": 0.5
  }
}
```

*Duplicate transaction (400):*
```json
{
  "success": false,
  "error": "Transaction signature already used",
  "code": "DUPLICATE_SIGNATURE"
}
```

---

### 3. Get All Cards
Retrieve all published project cards.

**Request:**
```http
GET /api/cards
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "cards": [
    {
      "id": 1,
      "wallet_address": "ABC123...",
      "name": "First Project",
      "subtitle": "The first project",
      "description": "This was the first project submitted",
      "url": "https://first.com",
      "icon": "🥇",
      "mediaUrls": ["https://first.com/image.png"],
      "created_at": "2024-01-01 10:00:00",
      "updated_at": "2024-01-01 10:00:00"
    },
    {
      "id": 2,
      "wallet_address": "XYZ789...",
      "name": "Second Project",
      "subtitle": "The second project",
      "description": "This was the second project submitted",
      "url": "https://second.com",
      "icon": "🥈",
      "mediaUrls": ["https://second.com/image.png"],
      "created_at": "2024-01-01 11:00:00",
      "updated_at": "2024-01-01 11:00:00"
    }
  ]
}
```

---

### 4. Update Card
Update an existing project card (must be owner).

**Request:**
```http
PUT /api/cards/1
Content-Type: application/json

{
  "cardData": {
    "name": "Updated Project Name",
    "subtitle": "Updated subtitle",
    "description": "Updated description",
    "url": "https://updated.com",
    "icon": "✨",
    "mediaUrls": [
      "https://updated.com/new-screenshot.png"
    ]
  },
  "walletAddress": "ABC123..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Card updated successfully",
  "card": {
    "id": 1,
    "wallet_address": "ABC123...",
    "transaction_signature": "5J7x...",
    "name": "Updated Project Name",
    "subtitle": "Updated subtitle",
    "description": "Updated description",
    "url": "https://updated.com",
    "icon": "✨",
    "mediaUrls": ["https://updated.com/new-screenshot.png"],
    "created_at": "2024-01-01 10:00:00",
    "updated_at": "2024-01-01 12:00:00"
  }
}
```

**Error Responses:**

*Card not found (404):*
```json
{
  "success": false,
  "error": "Card not found"
}
```

*Not authorized (403):*
```json
{
  "success": false,
  "error": "You do not have permission to edit this card"
}
```

---

## Card Data Validation Rules

| Field | Type | Required | Max Length | Notes |
|-------|------|----------|------------|-------|
| name | string | Yes | 50 chars | Project name |
| subtitle | string | Yes | 100 chars | Short tagline |
| description | string | Yes | 200 chars | Project description |
| url | string | Yes | - | Must be valid URL |
| icon | string | Yes | - | Emoji or icon |
| mediaUrls | array | Yes | 1-5 items | Image/video URLs |

## Transaction Verification

The API verifies Solana transactions with the following checks:

1. ✅ Transaction exists on blockchain
2. ✅ Transaction is confirmed (not failed)
3. ✅ Sender matches provided wallet address
4. ✅ Recipient is the treasury wallet
5. ✅ Amount is exactly 1 SOL (1,000,000,000 lamports)
6. ✅ Transaction signature hasn't been used before

## Error Codes

| Code | Description |
|------|-------------|
| `DUPLICATE_SIGNATURE` | Transaction signature already used |
| `TRANSACTION_NOT_FOUND` | Transaction not found on blockchain |
| `TRANSACTION_FAILED` | Transaction failed or not confirmed |
| `SENDER_MISMATCH` | Sender doesn't match provided wallet |
| `INVALID_RECIPIENT` | Treasury address not in transaction |
| `INVALID_AMOUNT` | Amount is not exactly 1 SOL |
| `RATE_LIMIT` | RPC rate limit exceeded |
| `VERIFICATION_ERROR` | General verification error |

## Testing with cURL

**Submit a card:**
```bash
curl -X POST http://localhost:3000/api/cards/submit \
  -H "Content-Type: application/json" \
  -d '{
    "cardData": {
      "name": "Test Project",
      "subtitle": "A test",
      "description": "Testing the API",
      "url": "https://test.com",
      "icon": "🧪",
      "mediaUrls": ["https://test.com/image.png"]
    },
    "transactionSignature": "YOUR_TX_SIGNATURE",
    "walletAddress": "YOUR_WALLET_ADDRESS"
  }'
```

**Get all cards:**
```bash
curl http://localhost:3000/api/cards
```

**Update a card:**
```bash
curl -X PUT http://localhost:3000/api/cards/1 \
  -H "Content-Type: application/json" \
  -d '{
    "cardData": {
      "name": "Updated Name",
      "subtitle": "Updated subtitle",
      "description": "Updated description",
      "url": "https://updated.com",
      "icon": "✨",
      "mediaUrls": ["https://updated.com/image.png"]
    },
    "walletAddress": "YOUR_WALLET_ADDRESS"
  }'
```

## Common Issues

### Issue: "Transaction not found on blockchain"
**Solution:** Wait a few seconds for the transaction to be confirmed, then retry.

### Issue: "Transaction amount is not exactly 1 SOL"
**Solution:** Ensure the transaction sends exactly 1 SOL (1,000,000,000 lamports) to the treasury wallet.

### Issue: "Transaction signature already used"
**Solution:** Each transaction can only be used once. Create a new transaction.

### Issue: "You do not have permission to edit this card"
**Solution:** Only the wallet that submitted the card can edit it. Verify you're using the correct wallet address.

## Development Tips

1. **Use devnet for testing:** Update `SOLANA_RPC_URL` to `https://api.devnet.solana.com`
2. **Enable debug logging:** Set `NODE_ENV=development` in `.env`
3. **Test with Postman:** Import the endpoints into Postman for easier testing
4. **Monitor logs:** Watch the console output for detailed error messages
5. **Check database:** Use SQLite browser to inspect the database directly

## Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Use mainnet RPC URL
- [ ] Set correct treasury wallet address
- [ ] Configure CORS allowed origins
- [ ] Set up SSL/HTTPS
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Test all endpoints thoroughly
- [ ] Verify transaction verification works
- [ ] Test error handling
