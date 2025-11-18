#!/bin/bash

# Example: Using the environment verification script in deployment workflows
# This demonstrates how to integrate the verification script into your deployment process

echo "================================================"
echo "Example 1: Basic Verification"
echo "================================================"
echo ""
echo "Command: npm run verify-env"
echo ""
echo "This will validate all environment variables and system configuration."
echo "Exit code 0 = success, Exit code 1 = failure"
echo ""

echo "================================================"
echo "Example 2: Pre-Start Validation"
echo "================================================"
echo ""
echo "# Verify configuration before starting server"
echo "npm run verify-env && npm start"
echo ""
echo "The server will only start if all checks pass."
echo ""

echo "================================================"
echo "Example 3: Deployment Script Integration"
echo "================================================"
echo ""
cat << 'EOF'
#!/bin/bash
# deploy.sh

echo "Verifying environment configuration..."
npm run verify-env

if [ $? -ne 0 ]; then
    echo "❌ Environment verification failed!"
    echo "Please fix configuration errors before deploying."
    exit 1
fi

echo "✅ Environment verification passed!"
echo "Proceeding with deployment..."

# Continue with deployment steps
pm2 restart gorweld-backend
EOF
echo ""

echo "================================================"
echo "Example 4: CI/CD Pipeline Integration"
echo "================================================"
echo ""
cat << 'EOF'
# .github/workflows/deploy.yml
name: Deploy Backend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend
      
      - name: Verify environment configuration
        run: npm run verify-env
        working-directory: ./backend
        env:
          SOLANA_RPC_URL: ${{ secrets.SOLANA_RPC_URL }}
          WALLET_1_ADDRESS: ${{ secrets.WALLET_1_ADDRESS }}
          WALLET_2_ADDRESS: ${{ secrets.WALLET_2_ADDRESS }}
          DATABASE_PATH: ./data/cards.db
      
      - name: Deploy to production
        run: ./deploy.sh
        if: success()
EOF
echo ""

echo "================================================"
echo "Example 5: Docker Integration"
echo "================================================"
echo ""
cat << 'EOF'
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .

# Verify environment on container start
RUN npm run verify-env

CMD ["npm", "start"]
EOF
echo ""

echo "================================================"
echo "Example 6: Manual Testing"
echo "================================================"
echo ""
echo "# Test with custom .env file"
echo "cp .env.test .env"
echo "npm run verify-env"
echo ""
echo "# Test with missing variables"
echo "unset WALLET_1_ADDRESS"
echo "npm run verify-env  # Should fail"
echo ""

echo "================================================"
echo "For more information, see:"
echo "  - ENV_VERIFICATION.md"
echo "  - README.md"
echo "================================================"
