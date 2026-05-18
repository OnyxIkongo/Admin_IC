/**
 * Hébergement statique (Render, etc.) : servir index.html pour les routes React
 * sans règle Rewrite dashboard (fichiers login/index.html, 404.html, …).
 */
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const indexHtml = join(dist, 'index.html')

const routePaths = [
  'login',
  'dashboard',
  'reservations',
  'events',
  'programs',
  'spaces',
  'participants',
]

copyFileSync(indexHtml, join(dist, '404.html'))

for (const route of routePaths) {
  const dir = join(dist, route)
  mkdirSync(dir, { recursive: true })
  copyFileSync(indexHtml, join(dir, 'index.html'))
}

console.log('[postbuild-spa] 404.html + routes SPA:', routePaths.join(', '))
