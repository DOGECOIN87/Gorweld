# 🌐 Frontend Deployment Guide - GitHub Pages & Custom Domain

This guide covers deploying the Gorweld frontend to GitHub Pages with the custom domain `gorweld.fun`.

## 📋 Overview

The Gorweld frontend is a static site that will be:
- Built using Vite
- Deployed to GitHub Pages
- Served from the custom domain `gorweld.fun`
- Configured for 50/50 wallet split payments

## 🏗️ Build Configuration

### Static Build Verification
✅ **Confirmed**: The frontend builds to a static bundle with no Node.js server required at runtime.

### Key Files
- `index.html` - Main application entry point
- `config.js` - Runtime configuration (copied from `config.production.js`)
- `CNAME` - Custom domain configuration for GitHub Pages
- `vite.config.ts` - Build configuration optimized for GitHub Pages

## 🚀 Deployment Methods

### Method 1: Manual Deployment

#### 1. Prepare Production Build
```bash
cd Gorweld

# Switch to production configuration
cp config.production.js config.js

# Update config.js with your mainnet wallet addresses:
# wallet1Address: 'YOUR_MAINNET_WALLET_1_ADDRESS'
# wallet2Address: 'YOUR_MAINNET_WALLET_2_ADDRESS'

# Build for production
npm run build:production

# Copy CNAME file
cp CNAME dist/
```

#### 2. Deploy to GitHub Pages
```bash
# Commit and push changes
git add .
git commit -m "Deploy frontend to GitHub Pages"
git push origin main

# Enable GitHub Pages in repository settings:
# 1. Go to Settings > Pages
# 2. Source: Deploy from a branch
# 3. Branch: main / (root) 
# 4. Custom domain: gorweld.fun
```

### Method 2: Automated Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically:
1. Builds the frontend on every push to main
2. Switches to production configuration
3. Deploys to GitHub Pages
4. Sets up the custom domain

**Setup:**
1. Push your code to GitHub
2. The workflow will run automatically
3. Enable GitHub Pages in repository settings
4. Set custom domain to `gorweld.fun`

### Method 3: Quick Deploy Script

```bash
cd Gorweld
./deploy-github-pages.sh
```

This script handles the entire build and preparation process.

## ⚙️ GitHub Pages Configuration

### Repository Settings
1. Go to your repository on GitHub
2. Navigate to **Settings** > **Pages**
3. Configure the following:

**Source:**
- Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`

**Custom Domain:**
- Domain: `gorweld.fun`
- ✅ Enforce HTTPS (will be enabled automatically)

### Build Output Structure
```
dist/
├── index.html          # Main application
├── assets/            # CSS, JS, and other assets
├── CNAME              # Custom domain configuration
├── Gorweld-Logo.png   # Logo file
└── metadata.json      # Project metadata
```

## 🌍 DNS Configuration

You need to configure DNS at your domain registrar to point `gorweld.fun` to GitHub Pages.

### Option 1: CNAME Record (Recommended)
```
Type: CNAME
Name: gorweld.fun (or @)
Value: dogecoin87.github.io
TTL: 3600
```

### Option 2: A Records
```
Type: A
Name: gorweld.fun (or @)
Value: 185.199.108.153
TTL: 3600

Type: A  
Name: gorweld.fun (or @)
Value: 185.199.109.153
TTL: 3600

Type: A
Name: gorweld.fun (or @) 
Value: 185.199.110.153
TTL: 3600

Type: A
Name: gorweld.fun (or @)
Value: 185.199.111.153
TTL: 3600
```

### WWW Subdomain (Optional)
```
Type: CNAME
Name: www
Value: gorweld.fun
TTL: 3600
```

## 🔧 Configuration for Production

### Frontend Configuration
Before deployment, ensure `config.js` contains your mainnet wallet addresses:

```javascript
solana: {
    network: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wallet1Address: 'YOUR_MAINNET_WALLET_1_ADDRESS',
    wallet2Address: 'YOUR_MAINNET_WALLET_2_ADDRESS',
    // ...
}
```

### Asset Paths
The build is configured to work correctly when served from:
- `https://gorweld.fun` (custom domain)
- `https://<username>.github.io/<repo>` (GitHub Pages default)

## 🧪 Testing Deployment

### Pre-Deployment Checklist
- [ ] Production wallet addresses configured in `config.js`
- [ ] Backend API URL points to production server
- [ ] CNAME file contains `gorweld.fun`
- [ ] Build completes without errors
- [ ] All static assets are included in `dist/`

### Post-Deployment Verification
1. **Site Loads**: Visit `https://gorweld.fun`
2. **Wallet Connection**: Test wallet connection functionality
3. **Payment Flow**: Verify payment modal shows correct wallet addresses
4. **API Integration**: Ensure frontend connects to production backend
5. **Mobile Responsive**: Test on mobile devices
6. **HTTPS**: Verify SSL certificate is active

### Test Payment (Small Amount)
1. Connect a mainnet wallet with small SOL balance
2. Submit a test card with minimal payment (0.01 SOL for testing)
3. Verify both production wallets receive correct split amounts
4. Check transaction on Solana Explorer

## 🚨 Important Notes

### Custom Domain Setup
- DNS propagation can take 24-48 hours
- GitHub Pages will automatically provision SSL certificate
- The site will be accessible via both `gorweld.fun` and `www.gorweld.fun`

### Static Site Limitations
- No server-side rendering
- All configuration is client-side
- API calls go directly from browser to backend

### Security Considerations
- All wallet addresses are visible in client-side code
- Use HTTPS for all API communications
- Validate all transactions on the backend

## 🔍 Troubleshooting

### Common Issues

1. **Site not loading at custom domain**
   - Check DNS configuration
   - Verify CNAME file is in repository root
   - Wait for DNS propagation (up to 48 hours)

2. **Assets not loading (404 errors)**
   - Check `vite.config.ts` base path configuration
   - Verify all assets are in `dist/` after build
   - Clear browser cache

3. **Wallet connection fails**
   - Check browser console for errors
   - Verify wallet addresses in `config.js`
   - Ensure using mainnet network configuration

4. **Payment fails**
   - Verify backend API is accessible
   - Check wallet has sufficient balance (>1.00001 SOL)
   - Confirm wallet addresses are correct mainnet addresses

### Debug Commands
```bash
# Build and inspect output
npm run build:production
ls -la dist/

# Test local build
npm run preview

# Check configuration
cat config.js | grep -A 10 "solana:"
```

## 📈 Performance Optimization

The build is optimized for:
- ✅ Minified JavaScript and CSS
- ✅ Optimized images and assets
- ✅ Gzip compression (handled by GitHub Pages)
- ✅ CDN delivery (GitHub's global CDN)

## 📞 Support

If you encounter deployment issues:
1. Check the GitHub Actions workflow logs
2. Verify DNS configuration with your registrar
3. Test the build locally with `npm run preview`
4. Check browser developer tools for errors

---

**🎉 Your Gorweld frontend will be live at https://gorweld.fun once DNS propagates!**