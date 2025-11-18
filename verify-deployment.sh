#!/bin/bash

# Deployment Verification Script for Gorweld Platform
# Tests all critical endpoints on production and verifies deployment status

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-https://api.gorweld.com}"
FRONTEND_URL="${FRONTEND_URL:-https://gorweld.fun}"
EXPECTED_ORIGIN="gorweld.fun"

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Log functions
log_header() {
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}========================================${NC}"
}

log_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$2" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓${NC} $1"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗${NC} $1"
        if [ -n "$3" ]; then
            echo -e "  ${RED}$3${NC}"
        fi
    fi
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Test 1: Backend health endpoint
test_health_endpoint() {
    log_header "Test 1: Backend Health Endpoint"
    
    log_info "Testing GET ${BACKEND_URL}/health"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/health" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "503" ]; then
        log_test "Health endpoint is accessible" "PASS"
        
        # Check if response is valid JSON
        if echo "$BODY" | jq . >/dev/null 2>&1; then
            log_test "Health endpoint returns valid JSON" "PASS"
            
            # Check for required fields
            STATUS=$(echo "$BODY" | jq -r '.status' 2>/dev/null)
            TIMESTAMP=$(echo "$BODY" | jq -r '.timestamp' 2>/dev/null)
            
            if [ -n "$STATUS" ] && [ "$STATUS" != "null" ]; then
                log_test "Health response includes status field" "PASS"
                log_info "Status: $STATUS"
            else
                log_test "Health response includes status field" "FAIL" "Status field missing or null"
            fi
            
            if [ -n "$TIMESTAMP" ] && [ "$TIMESTAMP" != "null" ]; then
                log_test "Health response includes timestamp" "PASS"
            else
                log_test "Health response includes timestamp" "FAIL" "Timestamp missing or null"
            fi
            
        else
            log_test "Health endpoint returns valid JSON" "FAIL" "Response is not valid JSON"
        fi
    else
        log_test "Health endpoint is accessible" "FAIL" "HTTP $HTTP_CODE"
    fi
}

# Test 2: Get cards endpoint
test_get_cards() {
    log_header "Test 2: Get Cards Endpoint"
    
    log_info "Testing GET ${BACKEND_URL}/api/cards"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/api/cards" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_test "Cards endpoint is accessible" "PASS"
        
        # Check if response is valid JSON
        if echo "$BODY" | jq . >/dev/null 2>&1; then
            log_test "Cards endpoint returns valid JSON" "PASS"
            
            # Check if response is an array or has cards array
            CARDS=$(echo "$BODY" | jq -r '.cards // . | type' 2>/dev/null)
            if [ "$CARDS" = "array" ]; then
                log_test "Cards endpoint returns array format" "PASS"
                
                CARD_COUNT=$(echo "$BODY" | jq -r '.cards // . | length' 2>/dev/null)
                log_info "Number of cards: $CARD_COUNT"
            else
                log_test "Cards endpoint returns array format" "FAIL" "Response is not an array"
            fi
        else
            log_test "Cards endpoint returns valid JSON" "FAIL" "Response is not valid JSON"
        fi
    else
        log_test "Cards endpoint is accessible" "FAIL" "HTTP $HTTP_CODE"
    fi
}

# Test 3: Upload endpoint (without actual file)
test_upload_endpoint() {
    log_header "Test 3: Upload Endpoint"
    
    log_info "Testing POST ${BACKEND_URL}/api/upload (checking endpoint availability)"
    
    # Test without file to check if endpoint exists and returns appropriate error
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}/api/upload" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    # Endpoint should return 400 (bad request) or similar when no file provided
    if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "200" ]; then
        log_test "Upload endpoint is accessible" "PASS"
        log_info "Endpoint responds with HTTP $HTTP_CODE (expected for no file)"
    else
        log_test "Upload endpoint is accessible" "FAIL" "HTTP $HTTP_CODE"
    fi
}

# Test 4: CORS headers
test_cors_headers() {
    log_header "Test 4: CORS Headers"
    
    log_info "Testing CORS headers for origin: https://${EXPECTED_ORIGIN}"
    
    RESPONSE=$(curl -s -I -H "Origin: https://${EXPECTED_ORIGIN}" "${BACKEND_URL}/health" 2>&1)
    
    # Check for Access-Control-Allow-Origin header
    CORS_HEADER=$(echo "$RESPONSE" | grep -i "access-control-allow-origin" | tr -d '\r')
    
    if [ -n "$CORS_HEADER" ]; then
        log_test "CORS headers are present" "PASS"
        log_info "$CORS_HEADER"
        
        # Check if it allows the expected origin or wildcard
        if echo "$CORS_HEADER" | grep -q "$EXPECTED_ORIGIN\|*"; then
            log_test "CORS allows gorweld.fun origin" "PASS"
        else
            log_test "CORS allows gorweld.fun origin" "FAIL" "Origin not allowed: $CORS_HEADER"
        fi
    else
        log_test "CORS headers are present" "FAIL" "No Access-Control-Allow-Origin header found"
    fi
}

# Test 5: SSL certificate validity
test_ssl_certificate() {
    log_header "Test 5: SSL Certificate Validity"
    
    log_info "Checking SSL certificate for api.gorweld.com"
    
    # Extract domain from URL
    DOMAIN=$(echo "$BACKEND_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||' -e 's|:.*$||')
    
    # Check SSL certificate
    SSL_INFO=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ -n "$SSL_INFO" ]; then
        log_test "SSL certificate is present" "PASS"
        
        # Extract expiry date
        NOT_AFTER=$(echo "$SSL_INFO" | grep "notAfter" | cut -d= -f2)
        
        if [ -n "$NOT_AFTER" ]; then
            log_info "Certificate expires: $NOT_AFTER"
            
            # Check if certificate is still valid
            EXPIRY_EPOCH=$(date -d "$NOT_AFTER" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$NOT_AFTER" +%s 2>/dev/null)
            CURRENT_EPOCH=$(date +%s)
            
            if [ -n "$EXPIRY_EPOCH" ] && [ "$EXPIRY_EPOCH" -gt "$CURRENT_EPOCH" ]; then
                DAYS_REMAINING=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
                log_test "SSL certificate is valid" "PASS"
                log_info "Days remaining: $DAYS_REMAINING"
            else
                log_test "SSL certificate is valid" "FAIL" "Certificate may be expired"
            fi
        else
            log_test "SSL certificate expiry is readable" "FAIL" "Could not parse expiry date"
        fi
    else
        log_test "SSL certificate is present" "FAIL" "Could not retrieve certificate"
    fi
}

# Test 6: Frontend accessibility
test_frontend_accessibility() {
    log_header "Test 6: Frontend Accessibility"
    
    log_info "Testing GET ${FRONTEND_URL}"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "${FRONTEND_URL}" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_test "Frontend is accessible" "PASS"
        
        # Check if it's HTML
        if echo "$BODY" | grep -q "<html\|<!DOCTYPE"; then
            log_test "Frontend returns HTML content" "PASS"
        else
            log_test "Frontend returns HTML content" "FAIL" "Response doesn't appear to be HTML"
        fi
        
        # Check for HTTPS
        if echo "$FRONTEND_URL" | grep -q "^https://"; then
            log_test "Frontend uses HTTPS" "PASS"
        else
            log_test "Frontend uses HTTPS" "FAIL" "URL is not HTTPS"
        fi
    else
        log_test "Frontend is accessible" "FAIL" "HTTP $HTTP_CODE"
    fi
}

# Test 7: Frontend SSL certificate
test_frontend_ssl() {
    log_header "Test 7: Frontend SSL Certificate"
    
    log_info "Checking SSL certificate for gorweld.fun"
    
    DOMAIN=$(echo "$FRONTEND_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||' -e 's|:.*$||')
    
    SSL_INFO=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ -n "$SSL_INFO" ]; then
        log_test "Frontend SSL certificate is present" "PASS"
        
        NOT_AFTER=$(echo "$SSL_INFO" | grep "notAfter" | cut -d= -f2)
        
        if [ -n "$NOT_AFTER" ]; then
            log_info "Certificate expires: $NOT_AFTER"
            
            EXPIRY_EPOCH=$(date -d "$NOT_AFTER" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$NOT_AFTER" +%s 2>/dev/null)
            CURRENT_EPOCH=$(date +%s)
            
            if [ -n "$EXPIRY_EPOCH" ] && [ "$EXPIRY_EPOCH" -gt "$CURRENT_EPOCH" ]; then
                DAYS_REMAINING=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
                log_test "Frontend SSL certificate is valid" "PASS"
                log_info "Days remaining: $DAYS_REMAINING"
            else
                log_test "Frontend SSL certificate is valid" "FAIL" "Certificate may be expired"
            fi
        fi
    else
        log_test "Frontend SSL certificate is present" "FAIL" "Could not retrieve certificate"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════╗"
    echo "║  Gorweld Deployment Verification      ║"
    echo "╔════════════════════════════════════════╗"
    echo -e "${NC}"
    
    log_info "Backend URL: $BACKEND_URL"
    log_info "Frontend URL: $FRONTEND_URL"
    log_info "Expected Origin: $EXPECTED_ORIGIN"
    
    # Check dependencies
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}Error: curl is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}Warning: jq is not installed. JSON validation will be limited${NC}"
    fi
    
    if ! command -v openssl &> /dev/null; then
        echo -e "${YELLOW}Warning: openssl is not installed. SSL checks will be skipped${NC}"
    fi
    
    # Run all tests
    test_health_endpoint
    test_get_cards
    test_upload_endpoint
    test_cors_headers
    
    if command -v openssl &> /dev/null; then
        test_ssl_certificate
        test_frontend_ssl
    fi
    
    test_frontend_accessibility
    
    # Print summary
    log_header "Test Summary"
    echo -e "Total Tests: ${BLUE}${TOTAL_TESTS}${NC}"
    echo -e "Passed: ${GREEN}${PASSED_TESTS}${NC}"
    echo -e "Failed: ${RED}${FAILED_TESTS}${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}✓ All deployment verification tests passed!${NC}"
        echo -e "${GREEN}The system appears to be production-ready.${NC}"
        exit 0
    else
        echo -e "\n${RED}✗ Some deployment verification tests failed.${NC}"
        echo -e "${RED}Please review the failures above before deploying to production.${NC}"
        exit 1
    fi
}

# Run main function
main
