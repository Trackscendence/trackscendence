import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'
import svgr from 'vite-plugin-svgr'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
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
