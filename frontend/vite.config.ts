import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 1000,
    proxy: {
      '/api': 'http://localhost:1001',
    },
  },
  preview: {
    port: 1000,
    proxy: {
      '/api': 'http://localhost:1001',
    },
  },
})
