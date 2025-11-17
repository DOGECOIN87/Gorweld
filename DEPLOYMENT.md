# Gorweld Deployment Guide

This document provides comprehensive instructions for deploying the Gorweld application to GitHub Pages.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Deployment Process](#deployment-process)
- [Manual Deployment](#manual-deployment)
- [Verifying Deployment](#verifying-deployment)
- [Troubleshooting](#troubleshooting)
- [Configuration Management](#configuration-management)

---

## Overview

The Gorweld application is automatically deployed to GitHub Pages using GitHub Actions. The deployment workflow:

- Builds the application with production configuration
- Copies necessary static files (CNAME, assets)
- Deploys to GitHub Pages with custom domain support
- Runs automatically on every push to the `main` branch

**Live Site:** https://gorweld.fun  
**Repository:** https://github.com/DOGECOIN87/Gorweld.git

---

## Prerequisites

Before deployment, ensure:

1. **GitHub Pages is enabled** in repository settings
   - Go to Settings → Pages
   - Source should be set to "GitHub Actions"

2. **Custom domain is configured** (if using gorweld.fun)
   - Domain DNS points to GitHub Pages
   - CNAME file exists in `Gorweld/` directory

3. **Required files exist:**
   - `Gorweld/CNAME` - Contains "gorweld.fun"
   - `Gorweld/.nojekyll` - Prevents Jekyll processing
   - `Gorweld/config.production.js` - Production configuration

4. **Workflow permissions are set:**
   - Repository Settings → Actions → General
   - Workflow permissions: "Read and write permissions"
   - Allow GitHub Actions to create and approve pull requests: Enabled

---

## Deployment Process

### Automatic Deployment

The deployment happens automatically when code is pushed to the `main` branch:

1. Developer pushes changes to `main` branch
2. GitHub Actions workflow triggers automatically
3. Workflow performs the following steps:
   - Checks out repository code
   - Sets up Node.js 18 with npm caching
   - Installs dependencies with `npm ci`
   - Applies production configuration
   - Builds application with `npm run build:production`
   - Copies CNAME and static files to dist
   - Uploads deployment artifact
   - Deploys to GitHub Pages

4. Site is live at https://gorweld.fun within 1-2 minutes

### Workflow Steps Explained

```yaml
# Step 1: Checkout - Fetches latest code
# Step 2: Setup Node.js - Installs Node 18 with caching
# Step 3: Install dependencies - Uses npm ci for reproducible builds
# Step 4: Apply production config - Switches to production settings
# Step 5: Build - Creates optimized production bundle
# Step 6: Copy static files - Adds CNAME and assets to dist
# Step 7: Upload artifact - Packages dist for deployment
# Step 8: Deploy - Publishes to GitHub Pages
```

---

## Manual Deployment

To manually trigger a deployment:

1. Go to the repository on GitHub
2. Navigate to **Actions** tab
3. Select **"Deploy Gorweld to GitHub Pages"** workflow
4. Click **"Run workflow"** button
5. Select the `main` branch
6. Click **"Run workflow"** to start

This is useful for:
- Testing deployment without pushing code
- Re-deploying after configuration changes
- Recovering from failed deployments

---

## Verifying Deployment

### Check Workflow Status

1. Go to **Actions** tab in GitHub repository
2. Find the latest workflow run
3. Verify all steps show green checkmarks
4. Check deployment URL in workflow output

### Verify Site Functionality

After deployment, test the following:

1. **Custom Domain**
   - Visit https://gorweld.fun
   - Verify HTTPS certificate is valid
   - Check that URL doesn't redirect to github.io

2. **Assets Loading**
   - Open browser DevTools (F12)
   - Check Network tab for 404 errors
   - Verify images, CSS, and JS files load

3. **Configuration**
   - Open browser console
   - Check that production endpoints are used
   - Verify Solana network is mainnet-beta

4. **Functionality**
   - Test wallet connection
   - Verify project cards display correctly
   - Check navigation and links work
   - Test responsive design on mobile

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Deployment Fails at Build Step

**Symptoms:**
- Workflow fails during "Build" step
- Error messages about missing dependencies or build errors

**Solutions:**
1. Check build logs in GitHub Actions for specific error
2. Verify `package.json` and `package-lock.json` are in sync
3. Test build locally: `cd Gorweld && npm ci && npm run build:production`
4. Ensure all dependencies are listed in `package.json`
5. Check for TypeScript or linting errors

**Prevention:**
- Always test builds locally before pushing
- Keep dependencies up to date
- Use `npm ci` instead of `npm install`

---

#### Issue: Custom Domain Not Working

**Symptoms:**
- Site accessible via github.io URL but not gorweld.fun
- SSL certificate errors
- DNS resolution failures

**Solutions:**
1. Verify CNAME file exists in `Gorweld/` directory
2. Check CNAME file contains exactly: `gorweld.fun`
3. Verify workflow copies CNAME to dist: `cp CNAME dist/`
4. Check DNS settings:
   ```
   dig gorweld.fun
   # Should point to GitHub Pages IPs
   ```
5. In repository Settings → Pages, verify custom domain is set
6. Wait 24-48 hours for DNS propagation

**Prevention:**
- Never delete CNAME file from repository
- Always include CNAME in deployment artifact
- Monitor DNS configuration regularly

---

#### Issue: 404 Errors for Assets

**Symptoms:**
- Site loads but images/CSS/JS return 404
- Console shows "Failed to load resource" errors

**Solutions:**
1. Check `vite.config.ts` base path is set to `/`
2. Verify assets are in dist directory after build
3. Check that `.nojekyll` file is copied to dist
4. Inspect deployment artifact in workflow logs
5. Clear browser cache and hard refresh (Ctrl+Shift+R)

**Prevention:**
- Always include `.nojekyll` in deployment
- Use relative paths for assets
- Test build output locally before deploying

---

#### Issue: Old Version Still Showing

**Symptoms:**
- Deployment succeeds but site shows old content
- Changes not visible after deployment

**Solutions:**
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache completely
3. Check deployment timestamp in GitHub Actions
4. Verify workflow completed successfully
5. Wait 2-5 minutes for CDN cache to clear
6. Test in incognito/private browsing mode

**Prevention:**
- Implement cache-busting in build process
- Use versioned asset filenames
- Set appropriate cache headers

---

#### Issue: Configuration Not Applied

**Symptoms:**
- Site uses development endpoints instead of production
- Wrong Solana network (devnet instead of mainnet)
- Payment addresses incorrect

**Solutions:**
1. Verify `config.production.js` exists in `Gorweld/` directory
2. Check workflow logs for "Production config applied" message
3. Compare `config.production.js` and `config.js` contents
4. Ensure workflow step runs before build:
   ```bash
   cp config.production.js config.js
   ```
5. Rebuild and redeploy manually

**Prevention:**
- Always commit `config.production.js` to repository
- Add validation step to check config before build
- Document required configuration values

---

#### Issue: Workflow Permission Denied

**Symptoms:**
- Workflow fails at "Deploy to GitHub Pages" step
- Error: "Resource not accessible by integration"
- Permission denied errors

**Solutions:**
1. Check workflow permissions in `.github/workflows/deploy.yml`:
   ```yaml
   permissions:
     contents: read
     pages: write
     id-token: write
   ```
2. Verify repository Settings → Actions → General:
   - Workflow permissions: "Read and write permissions"
3. Ensure GitHub Pages is enabled in repository settings
4. Check that Pages source is set to "GitHub Actions"

**Prevention:**
- Don't modify workflow permissions
- Regularly audit repository settings
- Document required permissions

---

#### Issue: Build Takes Too Long

**Symptoms:**
- Workflow times out
- Build step runs for >10 minutes
- Slow dependency installation

**Solutions:**
1. Verify npm caching is working:
   ```yaml
   cache: 'npm'
   cache-dependency-path: Gorweld/package-lock.json
   ```
2. Check for large dependencies in `package.json`
3. Remove unused dependencies
4. Use `npm ci` instead of `npm install`
5. Consider splitting large dependencies

**Prevention:**
- Keep dependencies minimal
- Regularly audit and remove unused packages
- Use npm caching effectively

---

#### Issue: Concurrent Deployment Conflicts

**Symptoms:**
- Multiple deployments running simultaneously
- Deployment artifacts overwriting each other
- Inconsistent deployment results

**Solutions:**
1. Verify concurrency settings in workflow:
   ```yaml
   concurrency:
     group: "pages"
     cancel-in-progress: false
   ```
2. Wait for current deployment to complete
3. Avoid pushing multiple commits rapidly
4. Use manual deployment for testing

**Prevention:**
- Concurrency control is already configured
- Batch multiple changes into single commit
- Use feature branches for development

---

## Configuration Management

### Production Configuration

The `config.production.js` file contains production-specific settings:

```javascript
// Example structure
export default {
  solanaNetwork: 'mainnet-beta',
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  paymentWallet: 'PRODUCTION_WALLET_ADDRESS',
  // ... other production settings
}
```

### Configuration Workflow

1. **Development:** Use `config.js` with devnet settings
2. **Pre-deployment:** Ensure `config.production.js` is up to date
3. **Deployment:** Workflow automatically copies production config
4. **Verification:** Check deployed site uses production endpoints

### Updating Configuration

To update production configuration:

1. Edit `Gorweld/config.production.js`
2. Commit and push changes
3. Workflow automatically applies new config on next deployment
4. Verify changes on live site

---

## Monitoring and Maintenance

### Regular Checks

Perform these checks regularly:

1. **Weekly:**
   - Verify site is accessible at https://gorweld.fun
   - Check for console errors in browser DevTools
   - Test wallet connection functionality

2. **Monthly:**
   - Review GitHub Actions workflow runs
   - Check for failed deployments
   - Update dependencies if needed
   - Verify SSL certificate is valid

3. **Quarterly:**
   - Audit and update npm dependencies
   - Review and update workflow actions versions
   - Test deployment process end-to-end

### Logs and Debugging

To access deployment logs:

1. Go to repository **Actions** tab
2. Click on specific workflow run
3. Expand each step to view detailed logs
4. Download logs for offline analysis if needed

### Rollback Procedure

If a deployment introduces issues:

1. Identify last working commit
2. Revert to that commit: `git revert <commit-hash>`
3. Push revert commit to trigger new deployment
4. Verify site functionality restored

Alternatively:
1. Use manual workflow trigger
2. Select previous working branch/commit
3. Deploy manually

---

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
- [Custom Domain Configuration](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

---

## Support

For deployment issues or questions:

- Check workflow logs in GitHub Actions
- Review this troubleshooting guide
- Contact: [@mattrick_gor](https://t.me/mattrick_gor) on Telegram
