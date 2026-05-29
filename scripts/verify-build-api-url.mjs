/**
 * Échoue le build si le bundle appelle /admin/* sans le préfixe /api (bug upload Render).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const distAssets = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'assets')
const jsFiles = readdirSync(distAssets).filter((f) => f.endsWith('.js'))

const badPattern = /onrender\.com\/admin\//
const goodPattern = /onrender\.com\/api\/admin\//
const setStatusPattern = /setStatus\([^)]*\)\{[^}]{0,280}/

for (const file of jsFiles) {
  const content = readFileSync(join(distAssets, file), 'utf8')
  if (badPattern.test(content) && !goodPattern.test(content)) {
    console.error(`[verify-build] ${file} contient une URL API sans /api — build refusé.`)
    process.exit(1)
  }

  const setStatus = content.match(setStatusPattern)?.[0] ?? ''
  if (setStatus && !setStatus.includes('/admin/bookings/')) {
    console.error(
      `[verify-build] ${file} : setStatus n'utilise pas /admin/bookings/ — build refusé.`,
    )
    process.exit(1)
  }
}

console.log('[verify-build] URLs API admin OK (/api/admin + validate/reject).')
