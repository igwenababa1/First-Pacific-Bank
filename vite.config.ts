
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, isSsrBuild }) => ({
  plugins: [react()],
  // Define specific env properties safely without overriding process.env object or global
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
    emptyOutDir: !isSsrBuild, // Prevent clearing client build during SSR step
    rollupOptions: isSsrBuild ? {
      input: 'server.ts',
      output: {
        format: 'cjs',
        entryFileNames: 'server.cjs',
      }
    } : {
      output: {
        // removed manualChunks to prevent React duplication issues
      }
    }
  },
  ssr: {
    target: 'node',
  }
}))
