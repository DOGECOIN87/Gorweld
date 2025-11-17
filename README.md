# 🔥 Gorweld - Welding the Gorbagana Ecosystem

**Live Site**: [gorweld.fun](https://gorweld.fun) (Coming Soon)  
**Repository**: https://github.com/DOGECOIN87/Gorweld.git

Gorweld is a Solana-based dApp that allows projects to submit showcase cards with payment verification.

## 🚀 Features

- **Solana Payment Integration**: Secure SOL payment processing
- **Multi-Wallet Support**: Phantom, Backpack, Solflare wallet integration
- **On-Chain Verification**: All transactions verified on Solana blockchain
- **Media Upload**: Support for images and videos in project cards
- **Real-time Verification**: On-chain transaction verification
- **Custom Domain**: Deployed at gorweld.fun via GitHub Pages

## 💰 Payment System

Card placement requires a 1 SOL payment, verified on-chain before submission.



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



## 🚀 Deployment

### Quick Deploy to GitHub Pages
```bash
cd Gorweld
./deploy-github-pages.sh
```

### Full Deployment Guide
See detailed deployment instructions:
- Backend README - Backend setup and configuration
- Frontend deployment via GitHub Actions

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
└── README.md              # This file
```

## 🧪 Testing

### Manual Testing
1. Start backend: `cd backend && npm start`
2. Open frontend in browser
3. Connect wallet
4. Submit test card with 1 SOL payment
5. Verify transaction on Solana Explorer

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

- ✅ **Payment System**: Fully implemented and tested on mainnet
- ✅ **Frontend**: Deployed via GitHub Pages
- ✅ **Backend**: Production ready
- ✅ **Documentation**: Complete deployment guides

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