import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { spacesService } from '@/services/spacesService'
import type { Space } from '@/types/domain'
import { cn } from '@/utils/cn'
import { spaceTypeLabelFr } from '@/utils/spaceDisplay'
import { SpaceFormDialog } from '@/components/admin/ContentFormDialogs'
import { apiErrorMessage } from '@/utils/apiErrorMessage'
import { ApiErrorBanner } from '@/components/admin/ApiErrorBanner'

export function AdminSpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Space | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setLoadError(null)
      const list = await spacesService.list()
      setSpaces(list)
    } catch (e) {
      setLoadError(apiErrorMessage(e))
      setSpaces([])
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const availabilityLabel = (s: Space) => {
    if (s.availability === 'available') return 'Disponible'
    if (s.availability === 'limited') return 'Places limitées'
    return 'Occupé'
  }

  const isActive = (s: Space) => (s.is_active ?? s.isActive) !== false

  const removeSpace = async (s: Space) => {
    const ok = window.confirm(`Supprimer définitivement l’espace “${s.name}” ?`)
    if (!ok) return
    try {
      setLoadError(null)
      setRemovingId(s.id)
      await spacesService.remove(s.id)
      await reload()
    } catch (e) {
      setLoadError(apiErrorMessage(e))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <main className="pb-6">
      <ApiErrorBanner message={loadError} onDismiss={() => setLoadError(null)} />
      <SpaceFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={editing}
        onSaved={() => void reload()}
      />

      <div className="mt-4 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">Gestion des espaces</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Salles, bureaux et espaces — images et champs synchronisés avec le backend.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shrink-0"
        >
          <Icon name="add" />
          Nouvel espace
        </button>
      </div>

      <div className="space-y-6">
        {spaces.map((s) => (
          <div
            key={s.id}
            className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_20px_40px_rgba(28,27,27,0.03)] transition-all border border-outline-variant/10"
          >
            {s.imageUrl ? (
              <img src={s.imageUrl} alt="" className="w-full h-48 object-cover" />
            ) : null}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">{s.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Icon name="groups" className="text-sm text-on-surface-variant" />
                    <span className="text-xs text-on-surface-variant">{s.capacityLabel}</span>
                  </div>
                  {!isActive(s) ? (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mt-2">Inactif (masqué public)</p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase',
                    s.availability === 'available' && 'bg-primary/10 text-primary',
                    s.availability === 'limited' && 'bg-amber-100 text-amber-700',
                    s.availability === 'occupied' && 'bg-primary/10 text-primary',
                  )}
                >
                  {availabilityLabel(s)}
                </span>
              </div>

              <div className="bg-surface-container-low p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
                    Contexte
                  </span>
                  <span className="text-[10px] font-medium text-primary">{s.availabilityLabel}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center">
                    <Icon name="business_center" className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{spaceTypeLabelFr(s.type)}</p>
                    <p className="text-xs text-on-surface-variant">
                      {s.priceLabel} • {s.priceUnitLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-outline-variant/10">
              <button
                type="button"
                onClick={() => {
                  setEditing(s)
                  setDialogOpen(true)
                }}
                className="py-4 text-xs font-semibold uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors"
              >
                Modifier
              </button>
              <button
                type="button"
                disabled={removingId === s.id}
                onClick={() => void removeSpace(s)}
                className="py-4 text-xs font-semibold uppercase tracking-widest text-red-700 hover:bg-red-50 transition-colors border-l border-outline-variant/10 disabled:opacity-60"
              >
                {removingId === s.id ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
