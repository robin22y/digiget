import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  publicDir: 'public',
  server: {
    host: true, // Allow external connections
    port: 5173,
    strictPort: false, // Try next available port if 5173 is taken
  },
  build: {
    outDir: 'dist',
    // Ensure _redirects file is included in build
    copyPublicDir: true,
  },
});
