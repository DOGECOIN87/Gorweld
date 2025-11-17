#!/bin/bash

# Setup script for Gorweld Card Submission Backend

echo "🚀 Setting up Gorweld Card Submission Backend..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✓ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed successfully"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "⚠️  Please update TREASURY_WALLET_ADDRESS in .env file"
else
    echo "✓ .env file already exists"
fi

echo ""

# Create data directory if it doesn't exist
if [ ! -d data ]; then
    echo "📁 Creating data directory..."
    mkdir -p data
    echo "✓ Data directory created"
else
    echo "✓ Data directory already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update TREASURY_WALLET_ADDRESS in .env file"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Run 'node test-db.js' to test database functionality"
echo ""
