import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // The source is bind-mounted from the sandbox, where filesystem events are
    // unreliable, so poll instead of waiting for native watch events.
    watch: { usePolling: true, interval: 300 },
    // Single origin: the browser only ever talks to this dev server, which
    // forwards /api to the backend (no CORS setup needed).
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
