#!/bin/bash

# Comprehensive API Test Runner
# This script runs the comprehensive API tests for the Gorweld backend

echo "════════════════════════════════════════════════════════════════"
echo "  Gorweld Backend - Comprehensive API Test Suite"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js to run the tests"
    exit 1
fi

# Check if we're in the backend directory
if [ ! -f "test-api-comprehensive.js" ]; then
    echo "❌ Error: test-api-comprehensive.js not found"
    echo "Please run this script from the backend directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  Warning: node_modules not found"
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Run the tests
echo "Running comprehensive API tests..."
echo ""

node test-api-comprehensive.js

# Capture exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed successfully!"
else
    echo "❌ Some tests failed. Please review the output above."
fi

exit $EXIT_CODE
