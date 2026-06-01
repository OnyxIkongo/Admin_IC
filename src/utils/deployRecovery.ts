/** Erreurs Vite / navigateur après déploiement ou réseau mobile lent. */
export function isChunkLoadError(reason: unknown): boolean {
  const msg =
    typeof reason === 'string'
      ? reason
      : reason instanceof Error
        ? reason.message
        : String(reason ?? '')
  return (
    /importing a module script failed/i.test(msg) ||
    /failed to fetch dynamically imported module/i.test(msg) ||
    /failed to load module script/i.test(msg) ||
    /chunkloaderror/i.test(msg) ||
    /loading chunk [\da-f]+ failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg)
  )
}

const RELOAD_KEY = 'ic_admin_deploy_reload'
const MAX_AUTO_RELOADS = 1

function tryAutoReload(): void {
  try {
    const count = Number(sessionStorage.getItem(RELOAD_KEY) ?? '0')
    if (count >= MAX_AUTO_RELOADS) return
    sessionStorage.setItem(RELOAD_KEY, String(count + 1))
    const url = new URL(window.location.href)
    url.searchParams.set('_cb', String(Date.now()))
    window.location.replace(url.toString())
  } catch {
    window.location.reload()
  }
}

export function installDeployRecovery(): void {
  const buildId = import.meta.env.VITE_BUILD_ID as string | undefined
  if (buildId) {
    try {
      const prev = localStorage.getItem('ic_admin_build_id')
      if (prev && prev !== buildId) {
        localStorage.setItem('ic_admin_build_id', buildId)
        sessionStorage.removeItem(RELOAD_KEY)
      } else if (!prev) {
        localStorage.setItem('ic_admin_build_id', buildId)
      }
    } catch {
      /* private mode */
    }
  }

  window.addEventListener('error', (event) => {
    if (!isChunkLoadError(event.message)) return
    tryAutoReload()
  })

  window.addEventListener('unhandledrejection', (event) => {
    if (!isChunkLoadError(event.reason)) return
    event.preventDefault()
    tryAutoReload()
  })
}

export function hardReloadApp(): void {
  try {
    sessionStorage.removeItem(RELOAD_KEY)
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href)
  url.searchParams.set('_cb', String(Date.now()))
  window.location.replace(url.toString())
}
