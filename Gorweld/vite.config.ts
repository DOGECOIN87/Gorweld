import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      // GitHub Pages configuration
      base: isProduction ? '/' : '/',
      
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      
      build: {
        // Output directory for GitHub Pages
        outDir: 'dist',
        // Generate source maps for debugging
        sourcemap: false,
        // Optimize for production
        minify: isProduction,
        // Copy CNAME file to build output
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html')
          }
        }
      },
      
      plugins: [react()],
      
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      
      // Ensure assets are served correctly from custom domain
      experimental: {
        renderBuiltUrl(filename, { hostType }) {
          if (hostType === 'js') {
            return { js: `/${filename}` };
          } else {
            return { relative: true };
          }
        }
      }
    };
});
