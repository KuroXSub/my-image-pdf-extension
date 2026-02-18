import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.json'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173,      // Port default Vite
    strictPort: true, // Jangan ganti port kalau 5173 sibuk
    hmr: {
      port: 5173,    // Paksa WebSocket connect ke port ini
    },
  },
  plugins: [
    react(),
    crx({ manifest }),
  ],
})