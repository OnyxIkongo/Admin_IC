import { hardReloadApp, isChunkLoadError } from '@/utils/deployRecovery'

type AppErrorScreenProps = {
  title?: string
  error?: unknown
  onRetry?: () => void
}

export function AppErrorScreen({
  title = 'Admin indisponible',
  error,
  onRetry = hardReloadApp,
}: AppErrorScreenProps) {
  const chunk = isChunkLoadError(error)

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-surface px-6 py-12 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="font-headline text-xl font-bold text-on-surface">{title}</h1>
        <p className="text-sm leading-relaxed text-on-surface-variant">
          {chunk
            ? 'Une nouvelle version de l’admin est en ligne ou la connexion a été coupée. Rechargez pour continuer.'
            : 'Rechargez la page. Vérifiez aussi votre connexion internet.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary"
      >
        Recharger l&apos;admin
      </button>
    </div>
  )
}
