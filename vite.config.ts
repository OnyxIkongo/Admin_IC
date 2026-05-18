import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/** Dev : Django sur le Bureau (ex. `python manage.py runserver 8000` → port 8000). Prod : définir `VITE_API_BASE_URL`. */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@webPublic': path.resolve(__dirname, './src/webPublic'),
    },
  },
})
