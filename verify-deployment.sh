#!/bin/bash

echo "🔍 Verifying Gorweld.fun Deployment"
echo "===================================="
echo ""

# Check DNS resolution
echo "1. Checking DNS resolution..."
DNS_RESULT=$(nslookup gorweld.fun | grep -A 4 "Non-authoritative answer")
if echo "$DNS_RESULT" | grep -q "185.199.1"; then
    echo "   ✅ DNS correctly points to GitHub Pages"
else
    echo "   ❌ DNS not pointing to GitHub Pages"
fi
echo ""

# Check HTTPS certificate
echo "2. Checking HTTPS certificate..."
CERT_INFO=$(echo | openssl s_client -servername gorweld.fun -connect gorweld.fun:443 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ HTTPS certificate is valid"
    echo "   $CERT_INFO" | sed 's/^/   /'
else
    echo "   ❌ HTTPS certificate issue"
fi
echo ""

# Check site accessibility
echo "3. Checking site accessibility..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://gorweld.fun)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Site returns HTTP 200 OK"
else
    echo "   ❌ Site returns HTTP $HTTP_CODE"
fi
echo ""

# Check for index.html
echo "4. Checking for index.html..."
if curl -s https://gorweld.fun | grep -q "<title>"; then
    TITLE=$(curl -s https://gorweld.fun | grep -o "<title>[^<]*" | sed 's/<title>//')
    echo "   ✅ Index.html found"
    echo "   Page title: $TITLE"
else
    echo "   ❌ Index.html not found or empty"
fi
echo ""

# Check for assets
echo "5. Checking for assets..."
CONTENT=$(curl -s https://gorweld.fun)

if echo "$CONTENT" | grep -q "\.js"; then
    echo "   ✅ JavaScript files referenced"
else
    echo "   ⚠️  No JavaScript files found"
fi

if echo "$CONTENT" | grep -q "\.css"; then
    echo "   ✅ CSS files referenced"
else
    echo "   ⚠️  No CSS files found"
fi

if echo "$CONTENT" | grep -q "Gorweld"; then
    echo "   ✅ Gorweld content detected"
else
    echo "   ⚠️  Gorweld content not detected"
fi
echo ""

# Check redirect from github.io
echo "6. Checking redirect from github.io..."
REDIRECT=$(curl -s -I https://dogecoin87.github.io/Gorweld/ | grep -i "location:")
if echo "$REDIRECT" | grep -q "gorweld.fun"; then
    echo "   ✅ Redirect from github.io to gorweld.fun working"
else
    echo "   ❌ Redirect not working properly"
fi
echo ""

echo "===================================="
echo "Verification complete!"
