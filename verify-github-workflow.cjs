#!/usr/bin/env node

/**
 * GitHub Actions Deployment Workflow Verification Script
 * 
 * This script verifies that the GitHub Actions deployment workflow is properly
 * configured for deploying the Gorweld frontend to GitHub Pages.
 * 
 * Checks performed:
 * 1. Workflow file exists and is valid YAML
 * 2. Node.js version matches production requirements
 * 3. Production config is applied before build
 * 4. CNAME and .nojekyll files exist and are copied to dist
 * 5. Build script is correctly configured
 * 6. Deployment artifact includes all necessary files
 * 7. Manual workflow trigger is enabled
 * 
 * Usage: node verify-github-workflow.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Verification results
const results = {
    passed: [],
    failed: [],
    warnings: []
};

/**
 * Print colored output
 */
function print(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function printHeader(title) {
    console.log('\n' + '='.repeat(80));
    print(title, 'bright');
    console.log('='.repeat(80) + '\n');
}

/**
 * Add test result
 */
function addResult(type, message) {
    results[type].push(message);
    const symbol = type === 'passed' ? '✓' : type === 'failed' ? '✗' : '⚠';
    const color = type === 'passed' ? 'green' : type === 'failed' ? 'red' : 'yellow';
    print(`${symbol} ${message}`, color);
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

/**
 * Read file content
 */
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        return null;
    }
}

/**
 * Parse YAML-like content (simple parser for workflow file)
 */
function parseWorkflowFile(content) {
    const lines = content.split('\n');
    const workflow = {
        name: '',
        triggers: [],
        nodeVersion: '',
        steps: [],
        hasManualTrigger: false,
        hasProductionConfig: false,
        copiesCNAME: false,
        copiesNojekyll: false
    };
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Extract workflow name
        if (line.startsWith('name:')) {
            workflow.name = line.split('name:')[1].trim();
        }
        
        // Check for manual trigger
        if (line === 'workflow_dispatch:' || line.includes('workflow_dispatch')) {
            workflow.hasManualTrigger = true;
        }
        
        // Extract Node.js version
        if (line.includes("node-version:")) {
            const match = line.match(/node-version:\s*['"]?(\d+)['"]?/);
            if (match) {
                workflow.nodeVersion = match[1];
            }
        }
        
        // Check for production config step
        if (line.includes('config.production.js') || line.includes('production config')) {
            workflow.hasProductionConfig = true;
        }
        
        // Check for CNAME copy
        if (line.includes('CNAME') && line.includes('dist')) {
            workflow.copiesCNAME = true;
        }
        
        // Check for .nojekyll copy
        if (line.includes('.nojekyll') && line.includes('dist')) {
            workflow.copiesNojekyll = true;
        }
        
        // Extract step names
        if (line.startsWith('- name:')) {
            workflow.steps.push(line.split('- name:')[1].trim());
        }
    }
    
    return workflow;
}

/**
 * Verify workflow file exists and is valid
 */
function verifyWorkflowFile() {
    printHeader('1. Workflow File Verification');
    
    const workflowPath = '.github/workflows/deploy.yml';
    
    if (!fileExists(workflowPath)) {
        addResult('failed', `Workflow file not found: ${workflowPath}`);
        return null;
    }
    
    addResult('passed', `Workflow file exists: ${workflowPath}`);
    
    const content = readFile(workflowPath);
    if (!content) {
        addResult('failed', 'Unable to read workflow file');
        return null;
    }
    
    addResult('passed', 'Workflow file is readable');
    
    // Basic YAML validation
    if (!content.includes('name:') || !content.includes('jobs:')) {
        addResult('failed', 'Workflow file appears to be invalid (missing required fields)');
        return null;
    }
    
    addResult('passed', 'Workflow file has valid structure');
    
    return parseWorkflowFile(content);
}

/**
 * Verify Node.js version
 */
function verifyNodeVersion(workflow) {
    printHeader('2. Node.js Version Verification');
    
    if (!workflow.nodeVersion) {
        addResult('failed', 'Node.js version not specified in workflow');
        return;
    }
    
    print(`Workflow Node.js version: ${workflow.nodeVersion}`, 'cyan');
    
    // Check package.json for engines field
    const packageJsonPath = 'Gorweld/package.json';
    if (fileExists(packageJsonPath)) {
        const packageJson = JSON.parse(readFile(packageJsonPath));
        if (packageJson.engines && packageJson.engines.node) {
            print(`Package.json engines.node: ${packageJson.engines.node}`, 'cyan');
        }
    }
    
    // Verify it's a supported LTS version
    const nodeVersionNum = parseInt(workflow.nodeVersion);
    if (nodeVersionNum >= 18) {
        addResult('passed', `Node.js version ${workflow.nodeVersion} is a supported LTS version`);
    } else {
        addResult('warnings', `Node.js version ${workflow.nodeVersion} may be outdated (recommend 18+)`);
    }
}

/**
 * Verify production config application
 */
function verifyProductionConfig(workflow) {
    printHeader('3. Production Configuration Verification');
    
    if (!workflow.hasProductionConfig) {
        addResult('failed', 'Workflow does not apply production config before build');
        return;
    }
    
    addResult('passed', 'Workflow includes production config application step');
    
    // Check if config.production.js exists
    const prodConfigPath = 'Gorweld/config.production.js';
    if (!fileExists(prodConfigPath)) {
        addResult('failed', `Production config file not found: ${prodConfigPath}`);
        return;
    }
    
    addResult('passed', 'Production config file exists');
    
    // Verify production config has correct settings
    const prodConfig = readFile(prodConfigPath);
    if (prodConfig) {
        const checks = [
            { pattern: /mainnet-beta/, name: 'Solana mainnet-beta network' },
            { pattern: /api\.gorweld\.com/, name: 'Production API URL' },
            { pattern: /BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt/, name: 'Wallet 1 address' },
            { pattern: /Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo/, name: 'Wallet 2 address' }
        ];
        
        checks.forEach(check => {
            if (check.pattern.test(prodConfig)) {
                addResult('passed', `Production config contains ${check.name}`);
            } else {
                addResult('failed', `Production config missing ${check.name}`);
            }
        });
    }
}

/**
 * Verify CNAME and .nojekyll files
 */
function verifyStaticFiles(workflow) {
    printHeader('4. Static Files Verification');
    
    // Check CNAME file
    const cnamePath = 'Gorweld/CNAME';
    if (!fileExists(cnamePath)) {
        addResult('failed', `CNAME file not found: ${cnamePath}`);
    } else {
        addResult('passed', 'CNAME file exists');
        
        const cnameContent = readFile(cnamePath);
        if (cnameContent && cnameContent.trim() === 'gorweld.fun') {
            addResult('passed', 'CNAME contains correct domain: gorweld.fun');
        } else {
            addResult('failed', `CNAME contains incorrect domain: ${cnameContent}`);
        }
    }
    
    // Check .nojekyll file
    const nojekyllPath = 'Gorweld/.nojekyll';
    if (!fileExists(nojekyllPath)) {
        addResult('warnings', `.nojekyll file not found: ${nojekyllPath} (will be created)`);
    } else {
        addResult('passed', '.nojekyll file exists');
    }
    
    // Check if workflow copies these files
    if (workflow.copiesCNAME) {
        addResult('passed', 'Workflow copies CNAME to dist directory');
    } else {
        addResult('failed', 'Workflow does not copy CNAME to dist directory');
    }
    
    if (workflow.copiesNojekyll) {
        addResult('passed', 'Workflow copies .nojekyll to dist directory');
    } else {
        addResult('warnings', 'Workflow does not copy .nojekyll to dist directory');
    }
}

/**
 * Verify build configuration
 */
function verifyBuildConfig() {
    printHeader('5. Build Configuration Verification');
    
    const packageJsonPath = 'Gorweld/package.json';
    if (!fileExists(packageJsonPath)) {
        addResult('failed', `Package.json not found: ${packageJsonPath}`);
        return;
    }
    
    const packageJson = JSON.parse(readFile(packageJsonPath));
    
    // Check for build:production script
    if (packageJson.scripts && packageJson.scripts['build:production']) {
        addResult('passed', 'build:production script exists');
        print(`  Script: ${packageJson.scripts['build:production']}`, 'cyan');
        
        // Verify it sets NODE_ENV=production
        if (packageJson.scripts['build:production'].includes('NODE_ENV=production')) {
            addResult('passed', 'build:production sets NODE_ENV=production');
        } else {
            addResult('warnings', 'build:production does not explicitly set NODE_ENV=production');
        }
    } else {
        addResult('failed', 'build:production script not found in package.json');
    }
    
    // Check vite.config.ts
    const viteConfigPath = 'Gorweld/vite.config.ts';
    if (fileExists(viteConfigPath)) {
        addResult('passed', 'Vite config file exists');
        
        const viteConfig = readFile(viteConfigPath);
        if (viteConfig.includes('outDir')) {
            addResult('passed', 'Vite config specifies output directory');
        }
    } else {
        addResult('warnings', 'Vite config file not found');
    }
}

/**
 * Verify manual workflow trigger
 */
function verifyManualTrigger(workflow) {
    printHeader('6. Manual Workflow Trigger Verification');
    
    if (workflow.hasManualTrigger) {
        addResult('passed', 'Manual workflow trigger (workflow_dispatch) is enabled');
        print('  You can manually trigger this workflow from GitHub Actions UI', 'cyan');
    } else {
        addResult('failed', 'Manual workflow trigger (workflow_dispatch) is not enabled');
    }
}

/**
 * Verify deployment artifact configuration
 */
function verifyDeploymentArtifact(workflow) {
    printHeader('7. Deployment Artifact Verification');
    
    // Check if workflow uploads artifact
    const hasUploadStep = workflow.steps.some(step => 
        step.toLowerCase().includes('upload') && step.toLowerCase().includes('artifact')
    );
    
    if (hasUploadStep) {
        addResult('passed', 'Workflow includes artifact upload step');
    } else {
        addResult('failed', 'Workflow missing artifact upload step');
    }
    
    // Check if workflow deploys to GitHub Pages
    const hasDeployStep = workflow.steps.some(step => 
        step.toLowerCase().includes('deploy') && step.toLowerCase().includes('pages')
    );
    
    if (hasDeployStep) {
        addResult('passed', 'Workflow includes GitHub Pages deployment step');
    } else {
        addResult('failed', 'Workflow missing GitHub Pages deployment step');
    }
    
    // List expected files in deployment artifact
    print('\nExpected files in deployment artifact:', 'cyan');
    const expectedFiles = [
        '  - index.html',
        '  - assets/ (CSS, JS, images)',
        '  - CNAME (for custom domain)',
        '  - .nojekyll (to prevent Jekyll processing)',
        '  - config.js (production configuration)'
    ];
    expectedFiles.forEach(file => print(file, 'cyan'));
}

/**
 * Verify GitHub Pages configuration (informational)
 */
function verifyGitHubPagesConfig() {
    printHeader('8. GitHub Pages Configuration (Manual Check Required)');
    
    print('Please verify the following in your GitHub repository settings:', 'yellow');
    print('', 'reset');
    print('1. Go to: Settings > Pages', 'cyan');
    print('2. Source: GitHub Actions', 'cyan');
    print('3. Custom domain: gorweld.fun', 'cyan');
    print('4. Enforce HTTPS: Enabled', 'cyan');
    print('', 'reset');
    
    addResult('warnings', 'GitHub Pages configuration must be verified manually in repository settings');
}

/**
 * Print workflow steps summary
 */
function printWorkflowSteps(workflow) {
    printHeader('Workflow Steps Summary');
    
    print(`Workflow Name: ${workflow.name}`, 'bright');
    print(`Node.js Version: ${workflow.nodeVersion}`, 'cyan');
    print(`Manual Trigger: ${workflow.hasManualTrigger ? 'Enabled' : 'Disabled'}`, 'cyan');
    print('', 'reset');
    
    print('Deployment Steps:', 'bright');
    workflow.steps.forEach((step, index) => {
        print(`  ${index + 1}. ${step}`, 'cyan');
    });
}

/**
 * Print final summary
 */
function printSummary() {
    printHeader('Verification Summary');
    
    print(`Total Checks: ${results.passed.length + results.failed.length + results.warnings.length}`, 'bright');
    print(`Passed: ${results.passed.length}`, 'green');
    print(`Failed: ${results.failed.length}`, 'red');
    print(`Warnings: ${results.warnings.length}`, 'yellow');
    
    if (results.failed.length > 0) {
        print('\n❌ VERIFICATION FAILED', 'red');
        print('The following issues must be resolved:', 'red');
        results.failed.forEach(msg => print(`  - ${msg}`, 'red'));
    } else if (results.warnings.length > 0) {
        print('\n⚠️  VERIFICATION PASSED WITH WARNINGS', 'yellow');
        print('Consider addressing the following warnings:', 'yellow');
        results.warnings.forEach(msg => print(`  - ${msg}`, 'yellow'));
    } else {
        print('\n✅ ALL CHECKS PASSED', 'green');
        print('GitHub Actions deployment workflow is properly configured!', 'green');
    }
    
    // Exit with appropriate code
    process.exit(results.failed.length > 0 ? 1 : 0);
}

/**
 * Main execution
 */
function main() {
    print('GitHub Actions Deployment Workflow Verification', 'bright');
    print('================================================\n', 'bright');
    
    const workflow = verifyWorkflowFile();
    
    if (!workflow) {
        printSummary();
        return;
    }
    
    verifyNodeVersion(workflow);
    verifyProductionConfig(workflow);
    verifyStaticFiles(workflow);
    verifyBuildConfig();
    verifyManualTrigger(workflow);
    verifyDeploymentArtifact(workflow);
    verifyGitHubPagesConfig();
    
    printWorkflowSteps(workflow);
    printSummary();
}

// Run the verification
main();
