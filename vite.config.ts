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
  optimizeDeps: {
    exclude: ['3DTilesRendererJS'],
    entries: [
      'src/**/*.{ts,tsx,js,jsx}',
      '!3DTilesRendererJS/**/*',
    ],
  },
  server: {
    fs: {
      allow: [
        // Allow serving files from the project root
        path.resolve(__dirname),
        // Exclude the 3DTilesRendererJS example directory
        '!3DTilesRendererJS/example/**/*',
      ],
    },
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Exclude 3DTilesRendererJS example files from bundling
        return id.includes('3DTilesRendererJS/example/');
      },
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