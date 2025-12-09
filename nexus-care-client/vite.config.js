import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // ✅ PROXY CONFIGURATION: Tunnels /api requests to Python
      '/api': {
        target: 'http://127.0.0.1:5000', // Points to your Flask Backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
    },
  },
})