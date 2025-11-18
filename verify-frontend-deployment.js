#!/usr/bin/env node

/**
 * Frontend Deployment Verification Script for Gorweld Platform
 * 
 * This script verifies that the frontend is properly deployed to GitHub Pages
 * and all critical components are functioning correctly.
 * 
 * Usage:
 *   node verify-frontend-deployment.js
 *   FRONTEND_URL=https://gorweld.fun BACKEND_URL=https://api.gorweld.com node verify-frontend-deployment.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gorweld.fun';
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.gorweld.com';
const EXPECTED_API_URL = 'https://api.gorweld.com/api';

// Color codes for output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

/**
 * Log functions
 */
function logHeader(message) {
    console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.cyan}${message}${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
}

function logTest(name, passed, message = '', details = null) {
    totalTests++;
    const result = {
        name,
        passed,
        message,
        details
    };
    testResults.push(result);
    
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
    
    if (details) {
        console.log(`  ${colors.blue}${details}${colors.reset}`);
    }
}

function logInfo(message) {
    console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function logWarning(message) {
    console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
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
            timeout: options.timeout || 15000,
            rejectUnauthorized: true
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
                    body: data,
                    socket: res.socket
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
 * Test 1: Frontend accessibility and HTTP status
 */
async function testFrontendAccessibility() {
    logHeader('Test 1: Frontend Accessibility');
    logInfo(`Testing GET ${FRONTEND_URL}`);
    
    try {
        const response = await makeRequest(FRONTEND_URL);
        
        if (response.statusCode === 200) {
            logTest(
                'Frontend is accessible and returns 200 status',
                true,
                '',
                `HTTP ${response.statusCode} OK`
            );
        } else {
            logTest(
                'Frontend is accessible and returns 200 status',
                false,
                `Expected HTTP 200, got HTTP ${response.statusCode}`
            );
        }
        
        // Check if HTML content is returned
        if (response.body.includes('<html') || response.body.includes('<!DOCTYPE')) {
            logTest('Frontend returns valid HTML content', true);
        } else {
            logTest(
                'Frontend returns valid HTML content',
                false,
                'Response does not appear to be HTML'
            );
        }
        
        // Check for React app indicators
        if (response.body.includes('id="root"') || response.body.includes('id="app"')) {
            logTest('Frontend contains React app root element', true);
        } else {
            logWarning('Could not find React app root element (id="root" or id="app")');
        }
        
        return response;
    } catch (error) {
        logTest(
            'Frontend is accessible and returns 200 status',
            false,
            error.message
        );
        return null;
    }
}

/**
 * Test 2: HTTPS certificate validity
 */
async function testHttpsCertificate() {
    logHeader('Test 2: HTTPS Certificate Validity');
    logInfo('Checking SSL/TLS certificate for frontend');
    
    try {
        const urlObj = new URL(FRONTEND_URL);
        
        if (urlObj.protocol !== 'https:') {
            logTest(
                'Frontend uses HTTPS',
                false,
                'URL does not use HTTPS protocol'
            );
            return;
        }
        
        logTest('Frontend uses HTTPS', true);
        
        const options = {
            hostname: urlObj.hostname,
            port: 443,
            method: 'GET',
            path: '/',
            rejectUnauthorized: true
        };
        
        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                const cert = res.socket.getPeerCertificate();
                
                if (cert && Object.keys(cert).length > 0) {
                    logTest('SSL certificate is present', true);
                    
                    // Check certificate validity
                    const validTo = new Date(cert.valid_to);
                    const validFrom = new Date(cert.valid_from);
                    const now = new Date();
                    
                    if (validFrom <= now && validTo > now) {
                        const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
                        logTest(
                            'SSL certificate is valid and not expired',
                            true,
                            '',
                            `Valid until: ${cert.valid_to} (${daysRemaining} days remaining)`
                        );
                        
                        if (daysRemaining < 30) {
                            logWarning(`Certificate expires in ${daysRemaining} days - consider renewal`);
                        }
                    } else {
                        logTest(
                            'SSL certificate is valid and not expired',
                            false,
                            'Certificate is expired or not yet valid'
                        );
                    }
                    
                    // Check certificate subject
                    if (cert.subject && cert.subject.CN) {
                        logInfo(`Certificate subject: ${cert.subject.CN}`);
                        
                        // Check if certificate matches domain
                        const hostname = urlObj.hostname;
                        if (cert.subject.CN === hostname || cert.subjectaltname?.includes(hostname)) {
                            logTest('Certificate matches domain', true);
                        } else {
                            logTest(
                                'Certificate matches domain',
                                false,
                                `Certificate CN (${cert.subject.CN}) does not match ${hostname}`
                            );
                        }
                    }
                    
                    // Check certificate issuer
                    if (cert.issuer) {
                        logInfo(`Certificate issuer: ${cert.issuer.O || cert.issuer.CN || 'Unknown'}`);
                    }
                } else {
                    logTest(
                        'SSL certificate is present',
                        false,
                        'Could not retrieve certificate information'
                    );
                }
                
                resolve();
            });
            
            req.on('error', (error) => {
                logTest(
                    'SSL certificate check',
                    false,
                    error.message
                );
                resolve();
            });
            
            req.end();
        });
    } catch (error) {
        logTest(
            'SSL certificate check',
            false,
            error.message
        );
    }
}

/**
 * Test 3: CNAME file presence
 */
async function testCnameFile() {
    logHeader('Test 3: CNAME File Verification');
    logInfo('Checking for CNAME file in deployment');
    
    try {
        const cnameUrl = `${FRONTEND_URL}/CNAME`;
        const response = await makeRequest(cnameUrl);
        
        if (response.statusCode === 200) {
            logTest('CNAME file is present in deployment', true);
            
            const cnameContent = response.body.trim();
            logInfo(`CNAME content: ${cnameContent}`);
            
            // Check if CNAME contains expected domain
            const urlObj = new URL(FRONTEND_URL);
            if (cnameContent === urlObj.hostname) {
                logTest('CNAME file contains correct domain', true);
            } else {
                logTest(
                    'CNAME file contains correct domain',
                    false,
                    `Expected "${urlObj.hostname}", found "${cnameContent}"`
                );
            }
        } else if (response.statusCode === 404) {
            logTest(
                'CNAME file is present in deployment',
                false,
                'CNAME file not found (HTTP 404)'
            );
        } else {
            logTest(
                'CNAME file is present in deployment',
                false,
                `Unexpected HTTP status: ${response.statusCode}`
            );
        }
    } catch (error) {
        logTest(
            'CNAME file is present in deployment',
            false,
            error.message
        );
    }
}

/**
 * Test 4: Configuration file verification
 */
async function testConfigFile() {
    logHeader('Test 4: Configuration File Verification');
    logInfo('Checking config.js for production API URL');
    
    try {
        const configUrl = `${FRONTEND_URL}/config.js`;
        const response = await makeRequest(configUrl);
        
        if (response.statusCode === 200) {
            logTest('config.js file is accessible', true);
            
            const configContent = response.body;
            
            // Check for production API URL
            if (configContent.includes(EXPECTED_API_URL)) {
                logTest(
                    'config.js contains production API URL',
                    true,
                    '',
                    `Found: ${EXPECTED_API_URL}`
                );
            } else {
                logTest(
                    'config.js contains production API URL',
                    false,
                    `Expected API URL "${EXPECTED_API_URL}" not found in config`
                );
            }
            
            // Check for mainnet-beta network
            if (configContent.includes("network: 'mainnet-beta'")) {
                logTest('config.js is set to mainnet-beta network', true);
            } else {
                logTest(
                    'config.js is set to mainnet-beta network',
                    false,
                    'mainnet-beta network configuration not found'
                );
            }
            
            // Check for treasury wallet addresses
            const wallet1 = 'BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt';
            const wallet2 = 'Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo';
            
            if (configContent.includes(wallet1) && configContent.includes(wallet2)) {
                logTest('config.js contains correct treasury wallet addresses', true);
            } else {
                logTest(
                    'config.js contains correct treasury wallet addresses',
                    false,
                    'One or both treasury wallet addresses not found'
                );
            }
            
            // Check for frozen configuration
            if (configContent.includes('Object.freeze(GorweldConfig)')) {
                logTest('Configuration object is frozen (immutable)', true);
            } else {
                logWarning('Configuration object is not frozen');
            }
        } else if (response.statusCode === 404) {
            logTest(
                'config.js file is accessible',
                false,
                'config.js not found (HTTP 404)'
            );
        } else {
            logTest(
                'config.js file is accessible',
                false,
                `Unexpected HTTP status: ${response.statusCode}`
            );
        }
    } catch (error) {
        logTest(
            'config.js file is accessible',
            false,
            error.message
        );
    }
}

/**
 * Test 5: Static assets loading
 */
async function testStaticAssets() {
    logHeader('Test 5: Static Assets Verification');
    logInfo('Checking if static assets load correctly');
    
    // Get the main HTML page first to find asset references
    try {
        const response = await makeRequest(FRONTEND_URL);
        const html = response.body;
        
        // Extract JavaScript files
        const jsMatches = html.match(/src="([^"]+\.js)"/g) || [];
        const jsFiles = jsMatches.map(match => match.match(/src="([^"]+)"/)[1]);
        
        // Extract CSS files
        const cssMatches = html.match(/href="([^"]+\.css)"/g) || [];
        const cssFiles = cssMatches.map(match => match.match(/href="([^"]+)"/)[1]);
        
        logInfo(`Found ${jsFiles.length} JavaScript files and ${cssFiles.length} CSS files`);
        
        // Test JavaScript files
        let jsSuccess = 0;
        for (const jsFile of jsFiles.slice(0, 3)) { // Test first 3 JS files
            try {
                const jsUrl = jsFile.startsWith('http') ? jsFile : `${FRONTEND_URL}${jsFile}`;
                const jsResponse = await makeRequest(jsUrl);
                
                if (jsResponse.statusCode === 200) {
                    jsSuccess++;
                }
            } catch (error) {
                // Continue checking other files
            }
        }
        
        if (jsFiles.length > 0 && jsSuccess > 0) {
            logTest(
                'JavaScript files load correctly',
                true,
                '',
                `${jsSuccess}/${Math.min(jsFiles.length, 3)} tested files loaded successfully`
            );
        } else if (jsFiles.length === 0) {
            logWarning('No JavaScript files found in HTML');
        } else {
            logTest(
                'JavaScript files load correctly',
                false,
                'JavaScript files failed to load'
            );
        }
        
        // Test CSS files
        let cssSuccess = 0;
        for (const cssFile of cssFiles.slice(0, 3)) { // Test first 3 CSS files
            try {
                const cssUrl = cssFile.startsWith('http') ? cssFile : `${FRONTEND_URL}${cssFile}`;
                const cssResponse = await makeRequest(cssUrl);
                
                if (cssResponse.statusCode === 200) {
                    cssSuccess++;
                }
            } catch (error) {
                // Continue checking other files
            }
        }
        
        if (cssFiles.length > 0 && cssSuccess > 0) {
            logTest(
                'CSS files load correctly',
                true,
                '',
                `${cssSuccess}/${Math.min(cssFiles.length, 3)} tested files loaded successfully`
            );
        } else if (cssFiles.length === 0) {
            logWarning('No CSS files found in HTML');
        } else {
            logTest(
                'CSS files load correctly',
                false,
                'CSS files failed to load'
            );
        }
        
        // Test image assets
        const imageAssets = [
            '/Gorweld-Logo.png',
            '/Gorweld-Logo-Hero.png'
        ];
        
        let imageSuccess = 0;
        for (const imagePath of imageAssets) {
            try {
                const imageUrl = `${FRONTEND_URL}${imagePath}`;
                const imageResponse = await makeRequest(imageUrl);
                
                if (imageResponse.statusCode === 200) {
                    imageSuccess++;
                }
            } catch (error) {
                // Continue checking other images
            }
        }
        
        if (imageSuccess > 0) {
            logTest(
                'Image assets load correctly',
                true,
                '',
                `${imageSuccess}/${imageAssets.length} tested images loaded successfully`
            );
        } else {
            logTest(
                'Image assets load correctly',
                false,
                'Image assets failed to load'
            );
        }
    } catch (error) {
        logTest(
            'Static assets verification',
            false,
            error.message
        );
    }
}

/**
 * Test 6: API connectivity from frontend to backend
 */
async function testApiConnectivity() {
    logHeader('Test 6: API Connectivity');
    logInfo('Testing connectivity from frontend to backend API');
    
    try {
        // Test backend health endpoint
        const healthUrl = `${BACKEND_URL}/health`;
        logInfo(`Testing ${healthUrl}`);
        
        const healthResponse = await makeRequest(healthUrl);
        
        if (healthResponse.statusCode === 200 || healthResponse.statusCode === 503) {
            logTest(
                'Backend API is accessible',
                true,
                '',
                `Backend health endpoint responds with HTTP ${healthResponse.statusCode}`
            );
            
            try {
                const healthData = JSON.parse(healthResponse.body);
                if (healthData.status) {
                    logInfo(`Backend status: ${healthData.status}`);
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
        } else {
            logTest(
                'Backend API is accessible',
                false,
                `Expected HTTP 200 or 503, got HTTP ${healthResponse.statusCode}`
            );
        }
        
        // Test cards endpoint
        const cardsUrl = `${BACKEND_URL}/api/cards`;
        logInfo(`Testing ${cardsUrl}`);
        
        const cardsResponse = await makeRequest(cardsUrl);
        
        if (cardsResponse.statusCode === 200) {
            logTest(
                'Backend cards endpoint is accessible',
                true,
                '',
                'Cards endpoint responds with HTTP 200'
            );
            
            try {
                const cardsData = JSON.parse(cardsResponse.body);
                const cards = cardsData.cards || cardsData;
                
                if (Array.isArray(cards)) {
                    logInfo(`Backend has ${cards.length} cards`);
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
        } else {
            logTest(
                'Backend cards endpoint is accessible',
                false,
                `Expected HTTP 200, got HTTP ${cardsResponse.statusCode}`
            );
        }
        
        // Test CORS headers
        const corsResponse = await makeRequest(healthUrl, {
            headers: {
                'Origin': FRONTEND_URL
            }
        });
        
        const corsHeader = corsResponse.headers['access-control-allow-origin'];
        
        if (corsHeader) {
            const urlObj = new URL(FRONTEND_URL);
            if (corsHeader === '*' || corsHeader.includes(urlObj.hostname)) {
                logTest(
                    'CORS is properly configured for frontend',
                    true,
                    '',
                    `Access-Control-Allow-Origin: ${corsHeader}`
                );
            } else {
                logTest(
                    'CORS is properly configured for frontend',
                    false,
                    `CORS header does not allow frontend origin: ${corsHeader}`
                );
            }
        } else {
            logTest(
                'CORS is properly configured for frontend',
                false,
                'No CORS headers found in response'
            );
        }
    } catch (error) {
        logTest(
            'API connectivity test',
            false,
            error.message
        );
    }
}

/**
 * Test 7: Additional deployment checks
 */
async function testAdditionalChecks() {
    logHeader('Test 7: Additional Deployment Checks');
    
    try {
        // Check for .nojekyll file (required for GitHub Pages with underscored files)
        const nojekyllUrl = `${FRONTEND_URL}/.nojekyll`;
        const nojekyllResponse = await makeRequest(nojekyllUrl);
        
        if (nojekyllResponse.statusCode === 200) {
            logTest('.nojekyll file is present', true);
        } else {
            logWarning('.nojekyll file not found - may cause issues with GitHub Pages');
        }
    } catch (error) {
        logWarning('.nojekyll file check failed');
    }
    
    // Check response headers
    try {
        const response = await makeRequest(FRONTEND_URL);
        
        // Check for security headers
        if (response.headers['x-frame-options']) {
            logInfo(`X-Frame-Options: ${response.headers['x-frame-options']}`);
        }
        
        if (response.headers['x-content-type-options']) {
            logInfo(`X-Content-Type-Options: ${response.headers['x-content-type-options']}`);
        }
        
        // Check content type
        if (response.headers['content-type']?.includes('text/html')) {
            logTest('Correct content-type header for HTML', true);
        }
    } catch (error) {
        // Non-critical check
    }
}

/**
 * Print summary
 */
function printSummary() {
    logHeader('Verification Summary');
    
    console.log(`\nTotal Tests: ${colors.blue}${totalTests}${colors.reset}`);
    console.log(`Passed: ${colors.green}${passedTests}${colors.reset}`);
    console.log(`Failed: ${colors.red}${failedTests}${colors.reset}`);
    
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    console.log(`Pass Rate: ${passRate >= 80 ? colors.green : colors.red}${passRate}%${colors.reset}`);
    
    if (failedTests > 0) {
        console.log(`\n${colors.red}${'='.repeat(70)}${colors.reset}`);
        console.log(`${colors.red}FAILED TESTS:${colors.reset}`);
        console.log(`${colors.red}${'='.repeat(70)}${colors.reset}`);
        
        testResults
            .filter(r => !r.passed)
            .forEach(r => {
                console.log(`${colors.red}✗ ${r.name}${colors.reset}`);
                if (r.message) {
                    console.log(`  ${r.message}`);
                }
            });
    }
    
    console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
    
    if (failedTests === 0) {
        console.log(`${colors.green}✓ ALL FRONTEND DEPLOYMENT CHECKS PASSED!${colors.reset}`);
        console.log(`${colors.green}The frontend is properly deployed and production-ready.${colors.reset}`);
    } else if (passRate >= 80) {
        console.log(`${colors.yellow}⚠ FRONTEND DEPLOYMENT MOSTLY SUCCESSFUL${colors.reset}`);
        console.log(`${colors.yellow}Some checks failed. Review the failures above.${colors.reset}`);
    } else {
        console.log(`${colors.red}✗ FRONTEND DEPLOYMENT VERIFICATION FAILED${colors.reset}`);
        console.log(`${colors.red}Please fix the issues above before considering the deployment complete.${colors.reset}`);
    }
    
    console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);
}

/**
 * Main execution
 */
async function main() {
    console.log(`${colors.blue}`);
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║       Gorweld Frontend Deployment Verification Script             ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log(`${colors.reset}`);
    
    logInfo(`Frontend URL: ${FRONTEND_URL}`);
    logInfo(`Backend URL: ${BACKEND_URL}`);
    logInfo(`Expected API URL: ${EXPECTED_API_URL}`);
    
    try {
        // Run all tests sequentially
        await testFrontendAccessibility();
        await testHttpsCertificate();
        await testCnameFile();
        await testConfigFile();
        await testStaticAssets();
        await testApiConnectivity();
        await testAdditionalChecks();
        
        // Print summary
        printSummary();
        
        // Exit with appropriate code
        process.exit(failedTests === 0 ? 0 : 1);
    } catch (error) {
        console.error(`${colors.red}Verification script failed:${colors.reset}`, error);
        process.exit(1);
    }
}

// Run main function
if (require.main === module) {
    main();
}

module.exports = { main };
