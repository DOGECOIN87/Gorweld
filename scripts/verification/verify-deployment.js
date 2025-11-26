#!/usr/bin/env node

/**
 * Deployment Verification Script for Gorweld Platform
 * Tests all critical endpoints on production and verifies deployment status
 * 
 * Usage:
 *   node verify-deployment.js
 *   BACKEND_URL=https://api.gorweld.com FRONTEND_URL=https://gorweld.fun node verify-deployment.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.gorweld.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gorweld.fun';
const EXPECTED_ORIGIN = 'gorweld.fun';

// Color codes for output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Log functions
 */
function logHeader(message) {
    console.log(`\n${colors.yellow}========================================${colors.reset}`);
    console.log(`${colors.yellow}${message}${colors.reset}`);
    console.log(`${colors.yellow}========================================${colors.reset}`);
}

function logTest(name, passed, message = '') {
    totalTests++;
    if (passed) {
        passedTests++;
        console.log(`${colors.green}✓${colors.reset} ${name}`);
    } else {
        failedTests++;
        console.log(`${colors.red}✗${colors.reset} ${name}`);
        if (message) {
            console.log(`  ${colors.red}${message}${colors.reset}`);
        }
    }
}

function logInfo(message) {
    console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: options.timeout || 10000
        };
        
        const req = protocol.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

/**
 * Test 1: Backend health endpoint
 */
async function testHealthEndpoint() {
    logHeader('Test 1: Backend Health Endpoint');
    logInfo(`Testing GET ${BACKEND_URL}/health`);
    
    try {
        const response = await makeRequest(`${BACKEND_URL}/health`);
        
        if (response.statusCode === 200 || response.statusCode === 503) {
            logTest('Health endpoint is accessible', true);
            
            try {
                const data = JSON.parse(response.body);
                logTest('Health endpoint returns valid JSON', true);
                
                if (data.status) {
                    logTest('Health response includes status field', true);
                    logInfo(`Status: ${data.status}`);
                } else {
                    logTest('Health response includes status field', false, 'Status field missing');
                }
                
                if (data.timestamp) {
                    logTest('Health response includes timestamp', true);
                } else {
                    logTest('Health response includes timestamp', false, 'Timestamp missing');
                }
                
                if (data.checks) {
                    logTest('Health response includes system checks', true);
                    
                    if (data.checks.database) {
                        logInfo(`Database status: ${data.checks.database.status}`);
                    }
                    
                    if (data.checks.solanaRpc) {
                        logInfo(`Solana RPC status: ${data.checks.solanaRpc.status}`);
                    }
                } else {
                    logTest('Health response includes system checks', false, 'Checks missing');
                }
                
            } catch (error) {
                logTest('Health endpoint returns valid JSON', false, 'Response is not valid JSON');
            }
        } else {
            logTest('Health endpoint is accessible', false, `HTTP ${response.statusCode}`);
        }
    } catch (error) {
        logTest('Health endpoint is accessible', false, error.message);
    }
}

/**
 * Test 2: Get cards endpoint
 */
async function testGetCards() {
    logHeader('Test 2: Get Cards Endpoint');
    logInfo(`Testing GET ${BACKEND_URL}/api/cards`);
    
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/cards`);
        
        if (response.statusCode === 200) {
            logTest('Cards endpoint is accessible', true);
            
            try {
                const data = JSON.parse(response.body);
                logTest('Cards endpoint returns valid JSON', true);
                
                const cards = data.cards || data;
                if (Array.isArray(cards)) {
                    logTest('Cards endpoint returns array format', true);
                    logInfo(`Number of cards: ${cards.length}`);
                    
                    if (cards.length > 0) {
                        const firstCard = cards[0];
                        const hasRequiredFields = 
                            firstCard.name &&
                            firstCard.subtitle &&
                            firstCard.description &&
                            firstCard.url;
                        
                        if (hasRequiredFields) {
                            logTest('Card objects have required fields', true);
                        } else {
                            logTest('Card objects have required fields', false, 'Missing required fields');
                        }
                    }
                } else {
                    logTest('Cards endpoint returns array format', false, 'Response is not an array');
                }
            } catch (error) {
                logTest('Cards endpoint returns valid JSON', false, 'Response is not valid JSON');
            }
        } else {
            logTest('Cards endpoint is accessible', false, `HTTP ${response.statusCode}`);
        }
    } catch (error) {
        logTest('Cards endpoint is accessible', false, error.message);
    }
}

/**
 * Test 3: Upload endpoint with sample image
 */
async function testUploadEndpoint() {
    logHeader('Test 3: Upload Endpoint');
    logInfo(`Testing POST ${BACKEND_URL}/api/upload`);
    
    try {
        // Create a minimal test image (1x1 PNG)
        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );
        
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        const formData = [
            `--${boundary}`,
            'Content-Disposition: form-data; name="media"; filename="test.png"',
            'Content-Type: image/png',
            '',
            testImageBuffer.toString('binary'),
            `--${boundary}--`
        ].join('\r\n');
        
        const response = await makeRequest(`${BACKEND_URL}/api/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(formData)
            },
            body: formData
        });
        
        if (response.statusCode === 200) {
            logTest('Upload endpoint accepts file uploads', true);
            
            try {
                const data = JSON.parse(response.body);
                if (data.urls && Array.isArray(data.urls)) {
                    logTest('Upload endpoint returns file URLs', true);
                    logInfo(`Uploaded ${data.urls.length} file(s)`);
                } else {
                    logTest('Upload endpoint returns file URLs', false, 'URLs not in expected format');
                }
            } catch (error) {
                logTest('Upload endpoint returns valid JSON', false, 'Response is not valid JSON');
            }
        } else if (response.statusCode === 400 || response.statusCode === 422) {
            logTest('Upload endpoint is accessible', true);
            logInfo(`Endpoint responds with HTTP ${response.statusCode} (validation error expected)`);
        } else {
            logTest('Upload endpoint is accessible', false, `HTTP ${response.statusCode}`);
        }
    } catch (error) {
        logTest('Upload endpoint is accessible', false, error.message);
    }
}

/**
 * Test 4: CORS headers
 */
async function testCorsHeaders() {
    logHeader('Test 4: CORS Headers');
    logInfo(`Testing CORS headers for origin: https://${EXPECTED_ORIGIN}`);
    
    try {
        const response = await makeRequest(`${BACKEND_URL}/health`, {
            headers: {
                'Origin': `https://${EXPECTED_ORIGIN}`
            }
        });
        
        const corsHeader = response.headers['access-control-allow-origin'];
        
        if (corsHeader) {
            logTest('CORS headers are present', true);
            logInfo(`Access-Control-Allow-Origin: ${corsHeader}`);
            
            if (corsHeader === '*' || corsHeader.includes(EXPECTED_ORIGIN)) {
                logTest('CORS allows gorweld.fun origin', true);
            } else {
                logTest('CORS allows gorweld.fun origin', false, `Origin not allowed: ${corsHeader}`);
            }
        } else {
            logTest('CORS headers are present', false, 'No Access-Control-Allow-Origin header found');
        }
    } catch (error) {
        logTest('CORS headers test', false, error.message);
    }
}

/**
 * Test 5: SSL certificate validity
 */
async function testSslCertificate() {
    logHeader('Test 5: SSL Certificate Validity');
    logInfo('Checking SSL certificate for api.gorweld.com');
    
    try {
        const urlObj = new URL(BACKEND_URL);
        
        const options = {
            hostname: urlObj.hostname,
            port: 443,
            method: 'GET',
            path: '/health'
        };
        
        const req = https.request(options, (res) => {
            const cert = res.socket.getPeerCertificate();
            
            if (cert && Object.keys(cert).length > 0) {
                logTest('SSL certificate is present', true);
                
                const validTo = new Date(cert.valid_to);
                const now = new Date();
                
                if (validTo > now) {
                    const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
                    logTest('SSL certificate is valid', true);
                    logInfo(`Certificate expires: ${cert.valid_to}`);
                    logInfo(`Days remaining: ${daysRemaining}`);
                } else {
                    logTest('SSL certificate is valid', false, 'Certificate has expired');
                }
                
                if (cert.subject) {
                    logInfo(`Subject: ${cert.subject.CN || 'N/A'}`);
                }
            } else {
                logTest('SSL certificate is present', false, 'Could not retrieve certificate');
            }
        });
        
        req.on('error', (error) => {
            logTest('SSL certificate check', false, error.message);
        });
        
        req.end();
        
        // Wait for the request to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
    } catch (error) {
        logTest('SSL certificate check', false, error.message);
    }
}

/**
 * Test 6: Frontend accessibility
 */
async function testFrontendAccessibility() {
    logHeader('Test 6: Frontend Accessibility');
    logInfo(`Testing GET ${FRONTEND_URL}`);
    
    try {
        const response = await makeRequest(FRONTEND_URL);
        
        if (response.statusCode === 200) {
            logTest('Frontend is accessible', true);
            
            if (response.body.includes('<html') || response.body.includes('<!DOCTYPE')) {
                logTest('Frontend returns HTML content', true);
            } else {
                logTest('Frontend returns HTML content', false, 'Response doesn\'t appear to be HTML');
            }
            
            if (FRONTEND_URL.startsWith('https://')) {
                logTest('Frontend uses HTTPS', true);
            } else {
                logTest('Frontend uses HTTPS', false, 'URL is not HTTPS');
            }
        } else {
            logTest('Frontend is accessible', false, `HTTP ${response.statusCode}`);
        }
    } catch (error) {
        logTest('Frontend is accessible', false, error.message);
    }
}

/**
 * Test 7: Frontend SSL certificate
 */
async function testFrontendSsl() {
    logHeader('Test 7: Frontend SSL Certificate');
    logInfo('Checking SSL certificate for gorweld.fun');
    
    try {
        const urlObj = new URL(FRONTEND_URL);
        
        const options = {
            hostname: urlObj.hostname,
            port: 443,
            method: 'GET',
            path: '/'
        };
        
        const req = https.request(options, (res) => {
            const cert = res.socket.getPeerCertificate();
            
            if (cert && Object.keys(cert).length > 0) {
                logTest('Frontend SSL certificate is present', true);
                
                const validTo = new Date(cert.valid_to);
                const now = new Date();
                
                if (validTo > now) {
                    const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
                    logTest('Frontend SSL certificate is valid', true);
                    logInfo(`Certificate expires: ${cert.valid_to}`);
                    logInfo(`Days remaining: ${daysRemaining}`);
                } else {
                    logTest('Frontend SSL certificate is valid', false, 'Certificate has expired');
                }
            } else {
                logTest('Frontend SSL certificate is present', false, 'Could not retrieve certificate');
            }
        });
        
        req.on('error', (error) => {
            logTest('Frontend SSL certificate check', false, error.message);
        });
        
        req.end();
        
        // Wait for the request to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
    } catch (error) {
        logTest('Frontend SSL certificate check', false, error.message);
    }
}

/**
 * Main execution
 */
async function main() {
    console.log(`${colors.blue}`);
    console.log('╔════════════════════════════════════════╗');
    console.log('║  Gorweld Deployment Verification      ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`${colors.reset}`);
    
    logInfo(`Backend URL: ${BACKEND_URL}`);
    logInfo(`Frontend URL: ${FRONTEND_URL}`);
    logInfo(`Expected Origin: ${EXPECTED_ORIGIN}`);
    
    try {
        // Run all tests
        await testHealthEndpoint();
        await testGetCards();
        await testUploadEndpoint();
        await testCorsHeaders();
        await testSslCertificate();
        await testFrontendAccessibility();
        await testFrontendSsl();
        
        // Print summary
        logHeader('Test Summary');
        console.log(`Total Tests: ${colors.blue}${totalTests}${colors.reset}`);
        console.log(`Passed: ${colors.green}${passedTests}${colors.reset}`);
        console.log(`Failed: ${colors.red}${failedTests}${colors.reset}`);
        
        if (failedTests === 0) {
            console.log(`\n${colors.green}✓ All deployment verification tests passed!${colors.reset}`);
            console.log(`${colors.green}The system appears to be production-ready.${colors.reset}`);
            process.exit(0);
        } else {
            console.log(`\n${colors.red}✗ Some deployment verification tests failed.${colors.reset}`);
            console.log(`${colors.red}Please review the failures above before deploying to production.${colors.reset}`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`${colors.red}Test execution failed:${colors.reset}`, error);
        process.exit(1);
    }
}

// Run main function
main();
