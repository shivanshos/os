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
  },
})
