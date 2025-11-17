/**
 * Gorweld Frontend Configuration
 * 
 * This file contains environment-specific configuration for the Gorweld website.
 * Update these values based on your deployment environment.
 */

const GorweldConfig = {
    // API Configuration
    api: {
        // Development API URL (used when running on localhost)
        development: 'http://localhost:3000/api',
        
        // Production API URL (used when deployed)
        production: 'https://api.gorweld.com/api',
        
        // Get the appropriate API URL based on current environment
        getBaseURL: function() {
            const isLocalhost = window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1';
            return isLocalhost ? this.development : this.production;
        }
    },
    
    // Solana Configuration
    solana: {
        // Network (mainnet-beta, devnet, testnet)
        network: 'devnet', // Start with devnet for testing
        
        // RPC URL
        rpcUrl: 'https://api.devnet.solana.com',
        
        // Treasury wallet addresses for 50/50 split
        wallet1Address: 'BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt', // Wallet 1 (50% of payments)
        wallet2Address: 'Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo', // Wallet 2 (50% of payments)
        
        // Legacy single treasury address (deprecated - kept for backward compatibility)
        treasuryAddress: 'BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt', // Same as wallet1Address
        
        // Required payment amount in SOL
        paymentAmount: 1,
        
        // Commitment level for transactions
        commitment: 'confirmed'
    },
    
    // Feature Flags
    features: {
        // Enable/disable card submission feature
        cardSubmission: true,
        
        // Enable/disable wallet connection
        walletConnection: true,
        
        // Enable/disable card editing
        cardEditing: true
    },
    
    // Upload Configuration
    upload: {
        // Maximum file size in bytes
        maxImageSize: 5 * 1024 * 1024,  // 5MB
        maxVideoSize: 20 * 1024 * 1024, // 20MB
        
        // Allowed file types
        allowedImageTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        allowedVideoTypes: ['video/webm', 'video/mp4'],
        
        // Maximum number of media files per card
        maxMediaFiles: 5
    },
    
    // UI Configuration
    ui: {
        // Card submission CTA text
        ctaHeading: 'Submit Your Project to Gorweld',
        ctaDescription: 'Showcase your project to the Gorbagana ecosystem. First-come, first-serve.',
        
        // Wallet connection text
        connectWalletText: 'Connect Wallet',
        
        // Animation durations (ms)
        animationDuration: 300
    },
    
    // Validation Rules
    validation: {
        projectName: {
            minLength: 3,
            maxLength: 50
        },
        projectSubtitle: {
            minLength: 10,
            maxLength: 100
        },
        projectDescription: {
            minLength: 20,
            maxLength: 500
        },
        projectUrl: {
            pattern: /^https?:\/\/.+/
        }
    }
};

// Freeze the configuration to prevent accidental modifications
Object.freeze(GorweldConfig);
Object.freeze(GorweldConfig.api);
Object.freeze(GorweldConfig.solana);
Object.freeze(GorweldConfig.features);
Object.freeze(GorweldConfig.upload);
Object.freeze(GorweldConfig.ui);
Object.freeze(GorweldConfig.validation);
