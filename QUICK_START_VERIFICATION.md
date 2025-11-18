# Quick Start: Deployment Verification

## Run Verification Now

### Option 1: Bash Script (Recommended for Linux/macOS)
```bash
./verify-deployment.sh
```

### Option 2: Node.js Script (Cross-platform)
```bash
node verify-deployment.js
```

## What Gets Tested

✅ **Backend API** (api.gorweld.com)
- Health endpoint
- Cards retrieval
- File upload
- CORS configuration
- SSL certificate

✅ **Frontend** (gorweld.fun)
- Website accessibility
- HTTPS enabled
- SSL certificate validity

## Current Results

When you run the script now, you'll see:
- ✅ Frontend tests PASS (gorweld.fun is live)
- ❌ Backend tests FAIL (api.gorweld.com not deployed yet)

This is **expected** - the backend needs to be deployed first.

## After Backend Deployment

Once you deploy the backend to api.gorweld.com, run the script again:
```bash
./verify-deployment.sh
```

All tests should pass! ✅

## Custom Testing

Test different environments:
```bash
# Staging
BACKEND_URL=https://staging-api.gorweld.com \
FRONTEND_URL=https://staging.gorweld.fun \
./verify-deployment.sh

# Local development
BACKEND_URL=http://localhost:3000 \
FRONTEND_URL=http://localhost:5173 \
node verify-deployment.js
```

## Need Help?

See `DEPLOYMENT.md` for detailed documentation.
