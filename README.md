# 🔥 Gorweld - Welding the Gorbagana Ecosystem

**Live Site**: [gorweld.fun](https://gorweld.fun) (Coming Soon)  
**Repository**: https://github.com/DOGECOIN87/Gorweld.git

Gorweld is a Solana-based dApp that allows projects to submit showcase cards with a unique 50/50 payment split system.

## 🚀 Features

- **50/50 Payment Split**: All payments are automatically split between two configured wallets
- **Solana Integration**: Direct SOL transfers using `SystemProgram.transfer()`
- **Multi-Wallet Support**: Phantom, Backpack, Solflare wallet integration
- **Media Upload**: Support for images and videos in project cards
- **Real-time Verification**: On-chain transaction verification
- **Custom Domain**: Deployed at gorweld.fun via GitHub Pages

## 💰 Payment System

Every 1 SOL payment is automatically split:
- **Wallet 1**: 0.5 SOL (+ any odd lamport)
- **Wallet 2**: 0.5 SOL

### Test Configuration (Devnet)
- **Wallet 1**: `GdS8GCrAaVviZE5nxTNGG3pYxxb1UCgUbf23FwCTVirK`
- **Wallet 2**: `Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo`

## 🏗️ Architecture

- **Frontend**: Static HTML/CSS/JavaScript (Vite build)
- **Backend**: Node.js/Express API with SQLite database
- **Blockchain**: Solana (devnet for testing, mainnet for production)
- **Hosting**: GitHub Pages (frontend) + VPS/Cloud (backend)

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+
- Git
- Solana wallet with devnet SOL for testing

### Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm start
```

### Frontend Setup
```bash
cd Gorweld
npm install
npm run dev
# OR serve index.html directly
```

### Test the Split Logic
```bash
cd backend
npm run test-split
```

## 🚀 Deployment

### Quick Deploy to GitHub Pages
```bash
cd Gorweld
./deploy-github-pages.sh
```

### Full Deployment Guide
See detailed deployment instructions:
- [DEPLOY.md](DEPLOY.md) - Complete deployment guide
- [Gorweld/DEPLOY_FRONTEND.md](Gorweld/DEPLOY_FRONTEND.md) - Frontend deployment
- [WALLET_SPLIT_SETUP.md](WALLET_SPLIT_SETUP.md) - Wallet configuration

## 📁 Project Structure

```
├── backend/                 # Node.js API server
│   ├── controllers/        # API controllers
│   ├── services/          # Transaction verification
│   ├── models/            # Database models
│   └── .env.example       # Environment template
├── Gorweld/               # Frontend application
│   ├── index.html         # Main application
│   ├── config.js          # Runtime configuration
│   ├── CNAME              # Custom domain config
│   └── .github/workflows/ # Auto-deployment
├── DEPLOY.md              # Deployment guide
└── README.md              # This file
```

## 🧪 Testing

### Run Unit Tests
```bash
cd backend
npm run test-split
```

### Manual Testing
1. Start backend: `cd backend && npm start`
2. Open frontend in browser
3. Connect devnet wallet
4. Submit test card with 1 SOL
5. Verify both wallets receive 0.5 SOL each

## 🌐 Custom Domain Setup

The site is configured for the custom domain `gorweld.fun`:

1. **GitHub Pages**: Enable in repository Settings > Pages
2. **DNS Configuration**: Add CNAME record pointing to `dogecoin87.github.io`
3. **SSL**: Automatically provisioned by GitHub Pages

## 🔒 Security

- ✅ Wallet address validation
- ✅ On-chain transaction verification
- ✅ Duplicate transaction prevention
- ✅ Environment-based configuration
- ✅ Comprehensive error handling

## 📊 Current Status

- ✅ **50/50 Split System**: Fully implemented and tested
- ✅ **Frontend**: Ready for GitHub Pages deployment
- ✅ **Backend**: Ready for production deployment
- ✅ **Documentation**: Complete deployment guides
- ⏳ **Production**: Awaiting mainnet wallet addresses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test thoroughly on devnet
4. Submit a pull request

## 📞 Support

For deployment issues or questions:
1. Check the deployment guides in the repository
2. Verify configuration matches the documentation
3. Test on devnet before mainnet deployment

## 📄 License

This project is licensed under the MIT License.

---

**🎉 Ready to weld the Gorbagana ecosystem together!**