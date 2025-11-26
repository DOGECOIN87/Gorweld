#!/bin/bash

# Frontend Deployment Verification Script Wrapper
# This script runs the Node.js frontend verification script

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Gorweld Frontend Deployment Verification                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js to run this verification script"
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if the verification script exists
if [ ! -f "verify-frontend-deployment.js" ]; then
    echo -e "${RED}Error: verify-frontend-deployment.js not found${NC}"
    echo "Please ensure you are running this script from the project root directory"
    exit 1
fi

# Set default URLs if not provided
export FRONTEND_URL=${FRONTEND_URL:-"https://gorweld.fun"}
export BACKEND_URL=${BACKEND_URL:-"https://api.gorweld.com"}

echo -e "${BLUE}Configuration:${NC}"
echo -e "  Frontend URL: ${FRONTEND_URL}"
echo -e "  Backend URL: ${BACKEND_URL}"
echo ""

# Run the Node.js verification script
node verify-frontend-deployment.js

# Capture exit code
EXIT_CODE=$?

# Exit with the same code as the Node.js script
exit $EXIT_CODE
