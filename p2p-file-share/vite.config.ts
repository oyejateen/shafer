import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
    outDir: 'dist',
    assetsDir: 'assets',
    copyPublicDir: true,
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3456,
    open: true,
  },
})
