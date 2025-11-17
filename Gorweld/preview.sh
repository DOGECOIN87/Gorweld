#!/bin/bash
# Simple preview script for the new Gorweld website

echo "🚀 Starting Gorweld Preview Server..."
echo ""
echo "📍 Start here to compare all versions:"
echo "   🎯 COMPARISON PAGE: http://localhost:8000/compare.html"
echo ""
echo "📍 Or jump directly to a version:"
echo "   🌟 ENHANCED (with screenshots): http://localhost:8000/index-enhanced.html"
echo "   ✨ CLEAN (lightweight):         http://localhost:8000/index-new.html"
echo "   📦 ORIGINAL (3D version):       http://localhost:8000/index.html"
echo ""
echo "💡 Recommended: Start with compare.html to see all options!"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m http.server 8000
