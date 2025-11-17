# Gorweld Card Submission Backend

Backend API server for the Gorweld card submission and payment system.

## Quick Links

- [API Documentation](./API_USAGE_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update `TREASURY_WALLET_ADDRESS` with your Solana wallet address
   - Adjust other settings as needed

3. Start the server:

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## Project Structure

```
backend/
├── server/           # Server entry point
│   └── index.js     # Express server setup
├── routes/          # API route handlers (to be implemented)
├── controllers/     # Business logic controllers (to be implemented)
├── models/          # Database models
│   └── database.js  # SQLite database wrapper
├── data/            # SQLite database files
├── .env             # Environment configuration
├── .env.example     # Example environment configuration
└── package.json     # Dependencies and scripts
```

## Database Schema

### Cards Table
Stores submitted project cards with payment verification.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| wallet_address | TEXT | Submitter's wallet address |
| transaction_signature | TEXT | Unique Solana transaction signature |
| name | TEXT | Project name |
| subtitle | TEXT | Project subtitle |
| description | TEXT | Project description |
| url | TEXT | Project URL |
| icon | TEXT | Project icon/emoji |
| media_urls | TEXT | JSON array of media URLs |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| published | BOOLEAN | Publication status |

### Transactions Table
Audit log for payment transactions.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| signature | TEXT | Unique transaction signature |
| wallet_address | TEXT | Sender wallet address |
| amount | BIGINT | Transaction amount in lamports |
| verified_at | TIMESTAMP | Verification timestamp |
| card_id | INTEGER | Associated card ID (foreign key) |

## API Endpoints (To Be Implemented)

- `GET /health` - Health check endpoint (implemented)
- `POST /api/cards/submit` - Submit a new card with payment verification
- `GET /api/cards` - Get all published cards
- `PUT /api/cards/:cardId` - Update an existing card
- `GET /api/cards/draft/:walletAddress` - Get draft card for wallet
- `POST /api/verify-payment` - Verify a Solana transaction

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| SOLANA_RPC_URL | Solana RPC endpoint | https://api.mainnet-beta.solana.com |
| TREASURY_WALLET_ADDRESS | Treasury wallet for payments | (required) |
| PORT | Server port | 3000 |
| NODE_ENV | Environment mode | development |
| DATABASE_PATH | SQLite database path | ./data/cards.db |
| ALLOWED_ORIGINS | CORS allowed origins | http://localhost:5173,http://localhost:3000 |

## Testing

The server includes:
- Automatic database initialization on startup
- Health check endpoint at `/health`
- Request logging middleware
- Error handling middleware
- Graceful shutdown handling

Test the health endpoint:
```bash
curl http://localhost:3000/health
```

## Deployment

### Quick Deployment

For automated deployment with interactive wizard:

```bash
sudo ./quick-deploy.sh
```

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Deployment Scripts

- `deploy.sh` - Full deployment automation
- `quick-deploy.sh` - Interactive deployment wizard
- `ssl-setup.sh` - SSL certificate setup
- `backup-db.sh` - Database backup script
- `monitoring-setup.sh` - Monitoring and logging setup
- `verify-deployment.sh` - Deployment verification

### NPM Scripts

```bash
npm run deploy      # Run deployment script
npm run backup      # Create database backup
npm run logs        # View PM2 logs
npm run status      # Check PM2 status
npm run restart     # Restart application
npm run stop        # Stop application
```

## Production Checklist

Before deploying to production, ensure:

1. ✅ Treasury wallet address configured
2. ✅ Domain DNS configured
3. ✅ SSL certificate installed
4. ✅ Firewall rules configured
5. ✅ Database backups automated
6. ✅ Monitoring setup complete
7. ✅ CORS origins configured

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete checklist.
