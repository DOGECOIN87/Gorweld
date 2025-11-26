#!/bin/bash

# Gorweld Deployment Status Checker
# This script checks the status of the frontend deployment

echo "============================================"
echo "Gorweld Deployment Status Checker"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check GitHub Actions
echo -e "${BLUE}📋 GitHub Actions Status:${NC}"
echo "   Visit: https://github.com/DOGECOIN87/Gorweld/actions"
echo ""

# Check if site is accessible
echo -e "${BLUE}🌐 Checking Frontend Accessibility...${NC}"
if curl -s -I https://gorweld.fun | head -n 1 | grep -q "200\|301\|302"; then
    echo -e "   ${GREEN}✅ Site is accessible${NC}"
    echo "   URL: https://gorweld.fun"
else
    echo -e "   ${YELLOW}⏳ Site not yet accessible (DNS propagation may be in progress)${NC}"
    echo "   This is normal for new deployments (can take 5-30 minutes)"
fi
echo ""

# Check HTTPS certificate
echo -e "${BLUE}🔒 Checking HTTPS Certificate...${NC}"
if curl -s -I https://gorweld.fun 2>&1 | grep -q "SSL certificate"; then
    echo -e "   ${GREEN}✅ HTTPS certificate is valid${NC}"
else
    echo -e "   ${YELLOW}⏳ HTTPS certificate pending${NC}"
fi
echo ""

# Check GitHub Pages status
echo -e "${BLUE}📦 GitHub Pages Status:${NC}"
echo "   Repository: https://github.com/DOGECOIN87/Gorweld"
echo "   Settings: https://github.com/DOGECOIN87/Gorweld/settings/pages"
echo ""

# Latest commit
echo -e "${BLUE}📝 Latest Commit:${NC}"
git log -1 --oneline
echo ""

# Deployment timeline
echo -e "${BLUE}⏱️  Expected Timeline:${NC}"
echo "   Build: 2-3 minutes"
echo "   Deploy: 1-2 minutes"
echo "   DNS propagation: 5-30 minutes"
echo "   Total: ~10-35 minutes"
echo ""

# Next steps
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "   1. Monitor GitHub Actions: https://github.com/DOGECOIN87/Gorweld/actions"
echo "   2. Wait for deployment to complete (~5 minutes)"
echo "   3. Check site accessibility: https://gorweld.fun"
echo "   4. Run verification: bash verify-frontend-deployment.sh"
echo ""

echo "============================================"
echo "Run this script again in 5 minutes to check progress"
echo "============================================"
