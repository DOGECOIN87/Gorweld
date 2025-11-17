/**
 * Gorweld Production Configuration
 * 
 * This file contains production-specific configuration.
 * Copy this file to config.js when deploying to production.
 */

const GorweldConfig = {
    // API Configuration
    api: {
        development: 'http://localhost:3000/api',
        production: 'https://api.gorweld.com/api',
        
        getBaseURL: function() {
            const isLocalhost = window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1';
            return isLocalhost ? this.development : this.production;
        }
    },
    
    // Solana Configuration
    solana: {
        network: 'mainnet-beta',
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        
        // Production payment wallet addresses
        wallet1Address: 'BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt',
        wallet2Address: 'Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo',
        
        // Legacy single treasury address (deprecated - kept for backward compatibility)
        treasuryAddress: 'BwwXgbiHMWqukbxzTjK9QJcp8EPBLc7hWo2A2e9xEsGt',
        
        paymentAmount: 1,
        commitment: 'confirmed'
    },
    
    features: {
        cardSubmission: true,
        walletConnection: true,
        cardEditing: true
    },
    
    upload: {
        maxImageSize: 5 * 1024 * 1024,
        maxVideoSize: 20 * 1024 * 1024,
        allowedImageTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        allowedVideoTypes: ['video/webm', 'video/mp4'],
        maxMediaFiles: 5
    },
    
    ui: {
        ctaHeading: 'Submit Your Project to Gorweld',
        ctaDescription: 'Showcase your project to the Gorbagana ecosystem. First-come, first-serve.',
        connectWalletText: 'Connect Wallet',
        animationDuration: 300
    },
    
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

Object.freeze(GorweldConfig);
Object.freeze(GorweldConfig.api);
Object.freeze(GorweldConfig.solana);
Object.freeze(GorweldConfig.features);
Object.freeze(GorweldConfig.upload);
Object.freeze(GorweldConfig.ui);
Object.freeze(GorweldConfig.validation);
