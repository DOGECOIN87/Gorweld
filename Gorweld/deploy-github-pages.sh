#!/bin/bash

# GitHub Pages Deployment Script for Gorweld
# This script builds the frontend and prepares it for GitHub Pages deployment

set -e  # Exit on any error

echo "🚀 Starting GitHub Pages deployment for Gorweld..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the Gorweld directory."
    exit 1
fi

# Check if CNAME file exists
if [ ! -f "CNAME" ]; then
    echo "📝 Creating CNAME file for gorweld.fun..."
    echo "gorweld.fun" > CNAME
fi

# Switch to production configuration
echo "⚙️ Switching to production configuration..."
if [ -f "config.production.js" ]; then
    cp config.production.js config.js
    echo "✅ Production config applied"
else
    echo "⚠️ Warning: config.production.js not found. Using current config.js"
fi

# Build the project
echo "🏗️ Building project for production..."
npm run build:production

# Copy CNAME to dist directory
echo "📋 Copying CNAME file to build output..."
cp CNAME dist/

# Copy any additional static files that might be needed
echo "📁 Copying additional static files..."
if [ -f "Gorweld-Logo.png" ]; then
    cp Gorweld-Logo.png dist/
fi

if [ -f "metadata.json" ]; then
    cp metadata.json dist/
fi

# Verify build output
echo "🔍 Verifying build output..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: Build failed - index.html not found in dist/"
    exit 1
fi

if [ ! -f "dist/CNAME" ]; then
    echo "❌ Error: CNAME file not copied to dist/"
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Commit and push your changes to GitHub"
echo "2. Go to your repository Settings > Pages"
echo "3. Set source to 'Deploy from a branch'"
echo "4. Select branch: main, folder: / (root)"
echo "5. Set custom domain to: gorweld.fun"
echo "6. Configure DNS at your domain registrar:"
echo "   - CNAME record: gorweld.fun → <your-username>.github.io"
echo "   - Or A records pointing to GitHub Pages IPs"
echo ""
echo "🌐 Your site will be available at: https://gorweld.fun"
echo ""
echo "📁 Build output is in the 'dist' directory"
echo "📄 Files ready for deployment:"
ls -la dist/

echo ""
echo "🎉 GitHub Pages deployment preparation complete!"