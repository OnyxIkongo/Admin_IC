import { Icon } from '@/components/ui/Icon'

type Props = {
  message: string | null
  onDismiss?: () => void
}

export function ApiErrorBanner({ message, onDismiss }: Props) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="mb-6 rounded-xl border border-error/40 bg-error-container/30 px-4 py-3 text-sm text-on-error-container"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="leading-relaxed">{message}</p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fermer"
            className="shrink-0 rounded-lg p-2 text-on-error-container hover:bg-error/10"
          >
            <Icon name="close" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
