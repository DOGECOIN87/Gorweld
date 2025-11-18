# GitHub Actions Workflow - Quick Reference Guide

## Quick Verification

Run the verification script:
```bash
node verify-github-workflow.cjs
```

## Manual Deployment

1. Go to GitHub repository → Actions tab
2. Select "Deploy Gorweld to GitHub Pages"
3. Click "Run workflow" → Select branch → Run

## Automatic Deployment

Push to main branch:
```bash
git push origin main
```

Workflow triggers automatically.

## Workflow Status

✅ **All Checks Passed**
- Node.js 18 (LTS)
- Production config applied
- CNAME and .nojekyll present
- Manual trigger enabled
- Deployment artifact configured

## Manual Verification Required

Check GitHub repository settings:
1. Settings → Pages
2. Source: **GitHub Actions**
3. Custom domain: **gorweld.fun**
4. Enforce HTTPS: **Enabled**

## Deployment Steps

1. Checkout code
2. Setup Node.js 18
3. Install dependencies (`npm ci`)
4. Apply production config
5. Build (`npm run build:production`)
6. Copy CNAME and .nojekyll
7. Upload artifact
8. Deploy to GitHub Pages

## Troubleshooting

### Build fails
```bash
cd Gorweld
npm run build:production
```

### Check workflow logs
GitHub → Actions → Select run → View logs

### Verify DNS
```bash
dig gorweld.fun
```

### Test locally
```bash
cd Gorweld
npm ci
npm run build:production
cd dist
python3 -m http.server 8000
```

## Key Files

- `.github/workflows/deploy.yml` - Workflow configuration
- `Gorweld/config.production.js` - Production config
- `Gorweld/CNAME` - Custom domain
- `Gorweld/.nojekyll` - Jekyll bypass
- `verify-github-workflow.cjs` - Verification script

## Production Config

- Network: `mainnet-beta`
- API: `https://api.gorweld.com/api`
- Wallet 1: `BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt`
- Wallet 2: `Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo`
- Payment: 1 SOL

## Monitoring

- **Deployment URL:** https://gorweld.fun
- **GitHub Actions:** Repository → Actions tab
- **Deployment time:** ~2-5 minutes

## Security

- HTTPS enforced
- No secrets required
- OIDC authentication
- Minimal permissions

## Maintenance

**Monthly:** Verify workflow runs  
**Quarterly:** Update Actions versions  
**Annually:** Review configuration

---

For detailed information, see `GITHUB_WORKFLOW_VERIFICATION.md`
