# 🚀 Gorweld Deployment Guide

This guide covers deploying the Gorweld dApp to production environments.

## 📋 Overview

Gorweld is a Solana-based dApp that uses direct SOL transfers (no custom smart contracts). The deployment involves:
1. Backend API server deployment
2. Frontend static site deployment to GitHub Pages
3. Environment configuration for devnet/mainnet

## 🏗️ Architecture

- **Frontend**: Static HTML/CSS/JavaScript served via GitHub Pages
- **Backend**: Node.js/Express API with SQLite database
- **Solana Integration**: Direct `SystemProgram.transfer()` calls (no custom program)
- **Payment Flow**: 50/50 split between two configured wallet addresses

## 🧪 Development/Testing (Devnet)

### Prerequisites
- Node.js 16+ installed
- Git installed
- Solana CLI (optional, for testing)

### 1. Backend Setup
```bash
# Clone and setup backend
cd backend
cp .env.example .env
# Edit .env with your devnet configuration

# Install dependencies
npm install

# Initialize database
npm start
# Server will create database automatically on first run
```

### 2. Frontend Setup
```bash
# Frontend is already configured for devnet testing
cd Gorweld
# No build step needed for development - uses index.html directly
```

### 3. Test the Split Logic
```bash
cd backend
node test-split-logic.js
```

### 4. Start Development Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (if using Vite)
cd Gorweld
npm run dev
# OR serve index.html directly via any web server
```

### 5. Test Payment Flow
1. Open frontend in browser
2. Connect a devnet wallet (with devnet SOL)
3. Submit a test card with 1 SOL payment
4. Verify both test wallets received 0.5 SOL each

## 🌐 Production Deployment

### Backend Deployment

#### Option 1: VPS/Cloud Server
```bash
# 1. Setup production server
sudo apt update
sudo apt install nodejs npm nginx

# 2. Clone repository
git clone https://github.com/DOGECOIN87/Gorweld.git
cd Gorweld/backend

# 3. Install dependencies
npm install

# 4. Configure production environment
cp .env.example .env.production
# Edit .env.production with mainnet settings:
# - SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# - WALLET_1_ADDRESS=<your-mainnet-wallet-1>
# - WALLET_2_ADDRESS=<your-mainnet-wallet-2>
# - NODE_ENV=production

# 5. Install PM2 for process management
npm install -g pm2

# 6. Start production server
NODE_ENV=production pm2 start ecosystem.config.js

# 7. Setup nginx reverse proxy (see nginx.conf)
sudo cp nginx.conf /etc/nginx/sites-available/gorweld-api
sudo ln -s /etc/nginx/sites-available/gorweld-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

#### Option 2: Heroku/Railway/Vercel
```bash
# 1. Configure environment variables in platform dashboard:
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
WALLET_1_ADDRESS=<your-mainnet-wallet-1>
WALLET_2_ADDRESS=<your-mainnet-wallet-2>
NODE_ENV=production
PORT=3000

# 2. Deploy via git push or platform CLI
```

### Frontend Deployment (GitHub Pages)

#### 1. Prepare Production Config
```bash
cd Gorweld
# Copy production config
cp config.production.js config.js
# Edit config.js with your mainnet wallet addresses
```

#### 2. Setup GitHub Pages
```bash
# 1. Create CNAME file for custom domain
echo "gorweld.fun" > CNAME

# 2. Configure Vite for GitHub Pages (if using build process)
# Update vite.config.ts with base path if needed

# 3. Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 4. Enable GitHub Pages in repository settings
# - Go to Settings > Pages
# - Source: Deploy from a branch
# - Branch: main / (root)
# - Custom domain: gorweld.fun
```

## ⚙️ Environment Configuration

### Development (.env)
```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_1_ADDRESS=GdS8GCrAaVviZE5nxTNGG3pYxxb1UCgUbf23FwCTVirK
WALLET_2_ADDRESS=Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo
NODE_ENV=development
```

### Production (.env.production)
```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
WALLET_1_ADDRESS=<YOUR_MAINNET_WALLET_1>
WALLET_2_ADDRESS=<YOUR_MAINNET_WALLET_2>
NODE_ENV=production
BASE_URL=https://api.gorweld.com
```

## 🔒 Security Checklist

- [ ] Mainnet wallet addresses are secure and controlled
- [ ] Environment variables are properly configured
- [ ] HTTPS is enabled for all endpoints
- [ ] CORS is configured for production domains only
- [ ] Database backups are automated
- [ ] Rate limiting is enabled
- [ ] Error logging is configured

## 🧪 Testing Checklist

### Devnet Testing
- [ ] Backend starts without errors
- [ ] Frontend connects to backend API
- [ ] Wallet connection works (Phantom, Backpack, Solflare)
- [ ] Payment creates two transfer instructions
- [ ] Both test wallets receive exactly 0.5 SOL
- [ ] Transaction verification passes
- [ ] Card submission completes successfully

### Mainnet Testing
- [ ] All devnet tests pass
- [ ] Production environment variables configured
- [ ] Small test payment (0.01 SOL) works correctly
- [ ] Production wallets receive correct amounts
- [ ] Frontend loads from custom domain
- [ ] API endpoints respond correctly

## 🚨 Important Notes

### No Solana Program Deployment
This dApp does NOT require deploying a custom Solana program because it uses:
- `SystemProgram.transfer()` for payments (built into Solana)
- Backend verification of transactions
- No custom on-chain logic

### Wallet Security
- Keep private keys secure and never commit them
- Use hardware wallets for production addresses
- Test thoroughly on devnet before mainnet

### Network Consistency
- Frontend and backend must use the same network (devnet/mainnet)
- RPC URLs must match the target network
- Wallet addresses must be valid for the target network

## 📞 Troubleshooting

### Common Issues

1. **"Wallet address not configured"**
   - Check config.js has correct wallet addresses
   - Verify addresses are valid Solana addresses

2. **"Transaction verification failed"**
   - Ensure backend uses same network as frontend
   - Check RPC URL is accessible
   - Verify wallet addresses match

3. **"CORS error"**
   - Update ALLOWED_ORIGINS in backend .env
   - Ensure frontend domain is whitelisted

4. **"Insufficient balance"**
   - Ensure wallet has > 1.00001 SOL (payment + fees)
   - Check network (devnet wallets need devnet SOL)

### Debug Commands
```bash
# Check backend logs
pm2 logs gorweld-backend

# Test API endpoints
curl https://api.gorweld.com/health

# Check database
sqlite3 backend/data/cards.db ".tables"

# Verify split logic
cd backend && node test-split-logic.js
```

## 📈 Monitoring

### Key Metrics to Monitor
- Payment success rate
- Transaction verification time
- API response times
- Database size growth
- Error rates

### Recommended Tools
- PM2 for process monitoring
- Nginx logs for request monitoring
- Solana Explorer for transaction verification
- Uptime monitoring for API availability

---

**Ready for deployment!** Follow the steps above to deploy to your chosen environment.