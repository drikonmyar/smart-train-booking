import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      axios: fileURLToPath(new URL('./src/lib/axiosShim.js', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})
