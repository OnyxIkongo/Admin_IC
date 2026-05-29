import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/** Corrige VITE_API_* au build (Render peut omettre /api). */
function resolveBuildApiBaseUrl(): string {
  const raw =
    process.env.VITE_API_BASE_URL?.trim() ||
    process.env.VITE_API_URL?.trim() ||
    'https://ingenious-city-api.onrender.com/api'
  let url = raw.replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(url)) url = `https://${url.replace(/^\/+/, '')}`
  try {
    const u = new URL(url)
    const p = u.pathname.replace(/\/+$/, '')
    if (!p.endsWith('/api')) u.pathname = p ? `${p}/api` : '/api'
    return `${u.origin}${u.pathname}`.replace(/\/+$/, '')
  } catch {
    return url.endsWith('/api') ? url : `${url}/api`
  }
}

const buildApiBaseUrl = resolveBuildApiBaseUrl()

/** Dev : Django sur le Bureau (ex. `python manage.py runserver 8000` → port 8000). Prod : définir `VITE_API_BASE_URL`. */
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(buildApiBaseUrl),
    'import.meta.env.VITE_API_URL': JSON.stringify(buildApiBaseUrl),
  },
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/media': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@webPublic': path.resolve(__dirname, './src/webPublic'),
    },
  },
})
