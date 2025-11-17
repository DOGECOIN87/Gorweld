# Design Document

## Overview

This design addresses the GitHub Pages deployment misconfiguration by consolidating duplicate workflow files, implementing proper permissions, and ensuring correct custom domain configuration. The solution will use the modern GitHub Pages deployment approach with official actions.

## Architecture

### Current State

```
Repository Root
├── .github/workflows/deploy.yml          (Modern approach, proper permissions)
├── Gorweld/
│   ├── .github/workflows/deploy.yml      (Legacy approach, missing permissions)
│   ├── CNAME                             (gorweld.fun)
│   ├── package.json
│   ├── vite.config.ts
│   ├── config.js
│   ├── config.production.js
│   └── dist/ (build output)
└── CNAME                                  (gorweld.fun - redundant)
```

### Target State

```
Repository Root
├── .github/workflows/deploy.yml          (Single, consolidated workflow)
├── Gorweld/
│   ├── CNAME                             (gorweld.fun)
│   ├── package.json
│   ├── vite.config.ts
│   ├── config.js
│   ├── config.production.js
│   └── dist/ (build output with CNAME)
└── CNAME (removed - redundant)
```

## Components and Interfaces

### 1. GitHub Actions Workflow

**Location:** `.github/workflows/deploy.yml`

**Purpose:** Single source of truth for deployment automation

**Key Components:**

- **Trigger Configuration**
  - Push events on `main` branch
  - Manual workflow dispatch capability

- **Permissions Block**
  ```yaml
  permissions:
    contents: read
    pages: write
    id-token: write
  ```

- **Environment Configuration**
  - Environment name: `github-pages`
  - URL output from deployment step

- **Job Steps:**
  1. Checkout repository
  2. Setup Node.js with caching
  3. Install dependencies
  4. Apply production configuration
  5. Build application
  6. Copy CNAME and static assets
  7. Upload Pages artifact
  8. Deploy to GitHub Pages

### 2. Build Configuration

**Vite Configuration** (`Gorweld/vite.config.ts`)

Current configuration is correct:
- Base path: `/` (correct for custom domain)
- Output directory: `dist`
- Production optimizations enabled

**Package.json Scripts**

Current scripts are correct:
- `build:production`: Uses NODE_ENV=production
- `deploy:github`: Includes CNAME copy step

### 3. Configuration Management

**Production Config Application**

The workflow will:
1. Check for `config.production.js` existence
2. If exists, copy to `config.js`
3. Log the operation result
4. Proceed with build

**Static File Handling**

Files to copy to dist:
- `CNAME` (required for custom domain)
- `Gorweld-Logo.png` (if exists)
- `metadata.json` (if exists)

## Data Models

### Workflow Configuration Schema

```yaml
name: string                    # Workflow name
on:                            # Trigger events
  push:
    branches: string[]
  workflow_dispatch: boolean
permissions:                   # Required permissions
  contents: string
  pages: string
  id-token: string
concurrency:                   # Prevent concurrent deployments
  group: string
  cancel-in-progress: boolean
jobs:
  deploy:
    environment:
      name: string
      url: string
    runs-on: string
    steps: Step[]
```

### Deployment Artifact Structure

```
dist/
├── index.html
├── assets/
│   ├── *.js
│   ├── *.css
│   └── *.png
├── CNAME                      # Custom domain configuration
├── Gorweld-Logo.png          # Logo asset
└── metadata.json             # Optional metadata
```

## Error Handling

### Build Failures

**Scenario:** npm build fails

**Handling:**
- Workflow stops at build step
- Error logs are captured in GitHub Actions
- No deployment occurs
- Developer receives notification via GitHub

**Prevention:**
- Use `npm ci` for consistent dependency installation
- Cache Node.js modules for reliability
- Validate configuration before build

### Configuration Issues

**Scenario:** config.production.js missing

**Handling:**
- Workflow logs warning message
- Continues with existing config.js
- Build proceeds normally

**Prevention:**
- Document configuration requirements
- Add config.production.js to repository

### Deployment Failures

**Scenario:** GitHub Pages deployment fails

**Handling:**
- Workflow fails at deployment step
- Artifact is preserved for debugging
- Previous deployment remains active
- Retry via workflow_dispatch

**Prevention:**
- Ensure proper permissions are set
- Verify GitHub Pages is enabled in repository settings
- Check custom domain DNS configuration

### CNAME Issues

**Scenario:** CNAME file not copied to dist

**Handling:**
- Custom domain will not work
- Site accessible via github.io URL
- Workflow logs show copy operation status

**Prevention:**
- Verify CNAME exists in Gorweld directory
- Check copy command in workflow
- Validate dist contents before deployment

## Testing Strategy

### Pre-Deployment Testing

1. **Local Build Verification**
   - Run `npm run build:production` locally
   - Verify dist directory contains CNAME
   - Check that config.production.js is applied
   - Validate all assets are present

2. **Workflow Syntax Validation**
   - Use GitHub Actions YAML validator
   - Check for syntax errors
   - Verify action versions are current

### Deployment Testing

1. **Test Deployment**
   - Trigger workflow via workflow_dispatch
   - Monitor GitHub Actions logs
   - Verify each step completes successfully
   - Check deployment URL

2. **Custom Domain Verification**
   - Access site via gorweld.fun
   - Verify HTTPS certificate is valid
   - Check that all assets load correctly
   - Test navigation and functionality

3. **Configuration Verification**
   - Inspect network requests in browser DevTools
   - Verify API endpoints use production URLs
   - Check that production config is active

### Post-Deployment Validation

1. **Functional Testing**
   - Test wallet connection
   - Verify project cards display correctly
   - Check responsive design on mobile
   - Test all navigation links

2. **Performance Testing**
   - Measure page load time
   - Check asset optimization
   - Verify caching headers

3. **Monitoring**
   - Check GitHub Pages deployment status
   - Monitor for 404 errors
   - Verify DNS resolution

## Implementation Notes

### Workflow Consolidation Strategy

1. Keep root-level `.github/workflows/deploy.yml` (has proper permissions)
2. Delete `Gorweld/.github/workflows/deploy.yml` (legacy approach)
3. Remove redundant root-level `CNAME` file
4. Ensure Gorweld/CNAME is the single source

### Concurrency Control

The workflow includes concurrency settings to prevent multiple simultaneous deployments:
```yaml
concurrency:
  group: "pages"
  cancel-in-progress: false
```

This ensures:
- Only one deployment runs at a time
- Queued deployments wait for completion
- No race conditions in gh-pages branch

### Permissions Explanation

Required permissions for GitHub Pages deployment:
- `contents: read` - Read repository contents
- `pages: write` - Write to GitHub Pages
- `id-token: write` - Generate OIDC token for deployment

### Migration Path

1. Verify root workflow is correct
2. Remove duplicate workflow from Gorweld subdirectory
3. Remove redundant CNAME from root
4. Test deployment via workflow_dispatch
5. Monitor first automatic deployment on push

## Security Considerations

1. **Token Security**
   - Use built-in `GITHUB_TOKEN` (no secrets needed)
   - Token is automatically scoped to repository
   - Expires after workflow completion

2. **Dependency Security**
   - Use `npm ci` for reproducible builds
   - Pin action versions (e.g., `@v4`)
   - Regularly update dependencies

3. **Custom Domain Security**
   - Enforce HTTPS via GitHub Pages settings
   - Verify DNS configuration prevents hijacking
   - Monitor certificate renewal

## Performance Optimizations

1. **Caching Strategy**
   - Cache Node.js modules between runs
   - Use cache-dependency-path for accuracy
   - Reduces build time by ~50%

2. **Build Optimizations**
   - Vite production mode minification
   - Tree shaking for smaller bundles
   - Asset optimization

3. **Deployment Efficiency**
   - Upload only dist directory
   - Compress artifacts automatically
   - Incremental deployments when possible
