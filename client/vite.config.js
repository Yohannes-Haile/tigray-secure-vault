import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/uploads': 'http://localhost:3000',
      '/list-files': 'http://localhost:3000',
      '/download': 'http://localhost:3000'
    }
  }
})