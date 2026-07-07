import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'
import svgr from 'vite-plugin-svgr'
import path from 'node:path'

const getManualChunk = (id) => {
  if (!id.includes('node_modules')) return undefined

  if (
    id.includes('/react/') ||
    id.includes('/react-dom/') ||
    id.includes('/react-router/') ||
    id.includes('/react-router-dom/')
  ) {
    return 'vendor-react'
  }

  if (
    id.includes('/socket.io-client/') ||
    id.includes('/engine.io-client/') ||
    id.includes('/@socket.io/')
  ) {
    return 'vendor-realtime'
  }

  if (id.includes('/zustand/')) {
    return 'vendor-state'
  }

  return 'vendor'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  build: {
    // Emit .vite/manifest.json so the bundle-size benchmark (benchmarks/e1)
    // can follow the real static-import graph. Harmless metadata; index.html
    // still references the hashed files directly.
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://server:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://server:3001',
        changeOrigin: true,
      },
      // Same-origin sockets, the routing model production nginx already
      // uses. `ws: true` is required: the client connects with
      // transports: ['websocket'] and no polling fallback, so the proxy
      // must handle the upgrade itself.
      '/websocket': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://server:3001',
        ws: true,
      },
    },
  },
})
