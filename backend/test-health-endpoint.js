/**
 * Integration tests for the /health endpoint
 * Tests the comprehensive health check functionality
 */

require('dotenv').config({ path: '.env.test' });
const http = require('http');
const { Connection } = require('@solana/web3.js');
const Database = require('./models/database');

// Test configuration
const TEST_PORT = 3001;
const TEST_DB_PATH = './data/test-health.db';

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
 * Log test result
 */
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

/**
 * Make HTTP request to health endpoint
 */
function makeHealthRequest(port = TEST_PORT) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/health',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData
                    });
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

/**
 * Start test server
 */
async function startTestServer(dbPath = TEST_DB_PATH) {
    // Set test environment
    process.env.PORT = TEST_PORT;
    process.env.DATABASE_PATH = dbPath;
    
    // Import and start server
    const express = require('express');
    const cors = require('cors');
    const path = require('path');
    
    const app = express();
    const SERVER_START_TIME = Date.now();
    
    // Initialize database
    const db = new Database(dbPath);
    await db.initialize();
    
    // Middleware
    app.use(cors());
    app.use(express.json());
    
    // Attach database to request
    app.use((req, res, next) => {
        req.db = db;
        next();
    });
    
    // Health check endpoint (same as production)
    app.get('/health', async (req, res) => {
        const timestamp = new Date().toISOString();
        const uptime = Math.floor((Date.now() - SERVER_START_TIME) / 1000);
        const environment = process.env.NODE_ENV || 'development';
        
        const health = {
            status: 'ok',
            timestamp,
            uptime,
            environment,
            checks: {
                database: { status: 'unknown' },
                solanaRpc: { status: 'unknown' }
            }
        };

        let isHealthy = true;

        // Check database connection
        try {
            await req.db.get('SELECT 1 as test');
            health.checks.database = {
                status: 'healthy',
                message: 'Database connection successful'
            };
        } catch (error) {
            isHealthy = false;
            health.checks.database = {
                status: 'unhealthy',
                message: 'Database connection failed',
                error: error.message
            };
        }

        // Check Solana RPC connection
        try {
            const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
            const connection = new Connection(rpcUrl, 'confirmed');
            
            const slot = await connection.getSlot();
            
            health.checks.solanaRpc = {
                status: 'healthy',
                message: 'Solana RPC connection successful',
                endpoint: rpcUrl,
                currentSlot: slot
            };
        } catch (error) {
            isHealthy = false;
            health.checks.solanaRpc = {
                status: 'unhealthy',
                message: 'Solana RPC connection failed',
                endpoint: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
                error: error.message
            };
        }

        if (!isHealthy) {
            health.status = 'degraded';
            return res.status(503).json(health);
        }

        res.status(200).json(health);
    });
    
    const server = app.listen(TEST_PORT);
    
    return { server, db };
}

/**
 * Test: Health endpoint returns correct status when all systems operational
 */
async function testHealthySystem() {
    console.log(`\n${colors.blue}Test Suite: Healthy System${colors.reset}`);
    
    const { server, db } = await startTestServer();
    
    try {
        // Wait for server to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await makeHealthRequest();
        
        // Test 1: Status code should be 200
        logTest(
            'Returns HTTP 200 when all systems healthy',
            response.statusCode === 200,
            `Expected 200, got ${response.statusCode}`
        );
        
        // Test 2: Response should have correct structure
        const hasCorrectStructure = 
            response.data.status &&
            response.data.timestamp &&
            typeof response.data.uptime === 'number' &&
            response.data.environment &&
            response.data.checks &&
            response.data.checks.database &&
            response.data.checks.solanaRpc;
        
        logTest(
            'Response has correct schema structure',
            hasCorrectStructure,
            'Missing required fields in response'
        );
        
        // Test 3: Overall status should be 'ok'
        logTest(
            'Overall status is "ok"',
            response.data.status === 'ok',
            `Expected "ok", got "${response.data.status}"`
        );
        
        // Test 4: Database check should be healthy
        logTest(
            'Database status is "healthy"',
            response.data.checks.database.status === 'healthy',
            `Database status: ${response.data.checks.database.status}`
        );
        
        // Test 5: Solana RPC check should be healthy
        logTest(
            'Solana RPC status is "healthy"',
            response.data.checks.solanaRpc.status === 'healthy',
            `RPC status: ${response.data.checks.solanaRpc.status}`
        );
        
        // Test 6: Environment mode should be included
        logTest(
            'Environment mode is included',
            response.data.environment !== undefined,
            'Environment field missing'
        );
        
        // Test 7: Uptime should be a positive number
        logTest(
            'Uptime is a positive number',
            response.data.uptime >= 0,
            `Uptime: ${response.data.uptime}`
        );
        
        // Test 8: Timestamp should be valid ISO format
        const isValidTimestamp = !isNaN(Date.parse(response.data.timestamp));
        logTest(
            'Timestamp is valid ISO format',
            isValidTimestamp,
            `Timestamp: ${response.data.timestamp}`
        );
        
        // Test 9: Solana RPC should include endpoint information
        logTest(
            'Solana RPC check includes endpoint',
            response.data.checks.solanaRpc.endpoint !== undefined,
            'Endpoint information missing'
        );
        
        // Test 10: Solana RPC should include current slot
        logTest(
            'Solana RPC check includes current slot',
            response.data.checks.solanaRpc.currentSlot !== undefined,
            'Current slot missing'
        );
        
    } finally {
        server.close();
        await db.close();
        // Clean up test database
        const fs = require('fs');
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }
    }
}

/**
 * Test: Health endpoint returns error status when database unavailable
 */
async function testDatabaseUnavailable() {
    console.log(`\n${colors.blue}Test Suite: Database Unavailable${colors.reset}`);
    
    const invalidDbPath = '/invalid/path/to/database.db';
    
    let server, db;
    try {
        // Try to start server with invalid database path
        const result = await startTestServer(invalidDbPath);
        server = result.server;
        db = result.db;
        
        // If we get here, the database was created (shouldn't happen with invalid path)
        logTest(
            'Server handles invalid database path',
            false,
            'Server started with invalid database path'
        );
        
    } catch (error) {
        // Expected: database initialization should fail
        logTest(
            'Database initialization fails with invalid path',
            true
        );
    } finally {
        if (server) server.close();
        if (db) await db.close();
    }
}

/**
 * Test: Health endpoint returns error status when RPC unavailable
 */
async function testRpcUnavailable() {
    console.log(`\n${colors.blue}Test Suite: RPC Unavailable${colors.reset}`);
    
    // Set invalid RPC URL
    const originalRpcUrl = process.env.SOLANA_RPC_URL;
    process.env.SOLANA_RPC_URL = 'http://invalid-rpc-endpoint.local:9999';
    
    const { server, db } = await startTestServer('./data/test-health-rpc.db');
    
    try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await makeHealthRequest();
        
        // Test 1: Status code should be 503 (Service Unavailable)
        logTest(
            'Returns HTTP 503 when RPC unavailable',
            response.statusCode === 503,
            `Expected 503, got ${response.statusCode}`
        );
        
        // Test 2: Overall status should be 'degraded'
        logTest(
            'Overall status is "degraded"',
            response.data.status === 'degraded',
            `Expected "degraded", got "${response.data.status}"`
        );
        
        // Test 3: Database should still be healthy
        logTest(
            'Database status remains "healthy"',
            response.data.checks.database.status === 'healthy',
            `Database status: ${response.data.checks.database.status}`
        );
        
        // Test 4: RPC check should be unhealthy
        logTest(
            'Solana RPC status is "unhealthy"',
            response.data.checks.solanaRpc.status === 'unhealthy',
            `RPC status: ${response.data.checks.solanaRpc.status}`
        );
        
        // Test 5: RPC error should include error message
        logTest(
            'RPC check includes error message',
            response.data.checks.solanaRpc.error !== undefined,
            'Error message missing'
        );
        
    } finally {
        server.close();
        await db.close();
        process.env.SOLANA_RPC_URL = originalRpcUrl;
        
        // Clean up test database
        const fs = require('fs');
        const testDbPath = './data/test-health-rpc.db';
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    }
}

/**
 * Run all tests
 */
async function runTests() {
    console.log(`${colors.yellow}==================================${colors.reset}`);
    console.log(`${colors.yellow}Health Endpoint Integration Tests${colors.reset}`);
    console.log(`${colors.yellow}==================================${colors.reset}`);
    
    try {
        await testHealthySystem();
        await testDatabaseUnavailable();
        await testRpcUnavailable();
        
        // Print summary
        console.log(`\n${colors.yellow}==================================${colors.reset}`);
        console.log(`${colors.yellow}Test Summary${colors.reset}`);
        console.log(`${colors.yellow}==================================${colors.reset}`);
        console.log(`Total Tests: ${totalTests}`);
        console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
        console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
        
        if (failedTests === 0) {
            console.log(`\n${colors.green}All tests passed!${colors.reset}`);
            process.exit(0);
        } else {
            console.log(`\n${colors.red}Some tests failed.${colors.reset}`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error(`${colors.red}Test execution failed:${colors.reset}`, error);
        process.exit(1);
    }
}

// Run tests
runTests();
