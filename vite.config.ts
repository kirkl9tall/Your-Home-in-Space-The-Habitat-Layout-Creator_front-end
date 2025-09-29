import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/nasa': {
        target: 'https://amine759--nasa-habitat-validator-api.modal.run',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nasa/, ''),
        secure: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🌐 Proxying NASA API request:', req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('📥 NASA API response status:', proxyRes.statusCode);
          });
        }
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'jscad-vendor': ['@jscad/modeling'],
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild'
  }
})