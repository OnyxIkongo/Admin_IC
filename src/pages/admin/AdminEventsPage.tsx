import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { eventsService } from '@/services/eventsService'
import { registrationsService } from '@/services/registrationsService'
import type { Event } from '@/types/domain'
import { EventFormDialog } from '@/components/admin/ContentFormDialogs'
import { apiErrorMessage } from '@/utils/apiErrorMessage'
import { ApiErrorBanner } from '@/components/admin/ApiErrorBanner'
import { formatDateRangeFr } from '@/utils/formatDateRangeFr'

function isEventPublished(e: Event) {
  return Boolean(e.is_published ?? e.isPublished)
}

export function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const fetchEventsData = useCallback(async () => {
    const [list, byEvent] = await Promise.all([eventsService.list(), registrationsService.countByEventId()])
    return { list, byEvent }
  }, [])

  const reload = useCallback(async () => {
    try {
      setLoadError(null)
      const { list, byEvent } = await fetchEventsData()
      setEvents(list)
      setCounts(byEvent)
    } catch (e) {
      setLoadError(apiErrorMessage(e))
      setEvents([])
      setCounts({})
    }
  }, [fetchEventsData])

  useEffect(() => {
    let cancelled = false

    const loadInitialData = async () => {
      try {
        const { list, byEvent } = await fetchEventsData()
        if (cancelled) return
        setLoadError(null)
        setEvents(list)
        setCounts(byEvent)
      } catch (e) {
        if (cancelled) return
        setLoadError(apiErrorMessage(e))
        setEvents([])
        setCounts({})
      }
    }

    void loadInitialData()

    return () => {
      cancelled = true
    }
  }, [fetchEventsData])

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (e: Event) => {
    setEditing(e)
    setDialogOpen(true)
  }

  const removeEvent = async (e: Event) => {
    const ok = window.confirm(`Supprimer définitivement l’événement “${e.title}” ?`)
    if (!ok) return
    try {
      setLoadError(null)
      setRemovingId(e.id)
      await eventsService.remove(e.id)
      await reload()
    } catch (err) {
      setLoadError(apiErrorMessage(err))
    } finally {
      setRemovingId(null)
    }
  }

  const totalRegs = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <main>
      <ApiErrorBanner message={loadError} onDismiss={() => setLoadError(null)} />
      <EventFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={editing}
        onSaved={() => void reload()}
      />

      <div className="mt-4 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="font-label text-[10px] font-medium tracking-wider uppercase text-on-surface-variant block mb-1">
            Console de gestion
          </span>
          <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Événements</h2>
          <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
            Les contenus publiés sont visibles côté site utilisateur.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shrink-0"
        >
          <Icon name="add" />
          Nouvel événement
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-container-low p-5 rounded-lg">
          <p className="font-headline text-3xl font-bold text-primary">{events.length}</p>
          <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Événements (tous)</p>
        </div>
        <div className="bg-surface-container-low p-5 rounded-lg">
          <p className="font-headline text-3xl font-bold text-primary">{totalRegs}</p>
          <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Inscriptions (total)</p>
        </div>
      </div>

      <div className="space-y-6">
        {events.map((e) => (
          <div
            key={e.id}
            className="bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant/10 transition-all active:scale-[0.99]"
          >
            {e.imageUrl ? <img src={e.imageUrl} alt="" className="w-full h-44 object-cover" /> : null}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`flex items-center gap-2 px-2 py-1 rounded ${
                    isEventPublished(e) ? 'bg-primary/10' : 'bg-surface-container-high'
                  }`}
                >
                  <Icon name="circle" className="text-[14px] text-primary" filled />
                  <span className="font-label text-[10px] font-bold text-primary uppercase">
                    {isEventPublished(e) ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
              </div>

              <h3 className="font-headline text-lg font-semibold mb-2">{e.title}</h3>
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                  <Icon name="calendar_today" className="text-sm" />
                  <span>{formatDateRangeFr(e.starts_at ?? e.dateISO, e.ends_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                  <Icon name="group" className="text-sm" />
                  <span>{counts[e.id] ?? 0} inscrit(s)</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-3 rounded-lg font-label text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
                  onClick={() => void registrationsService.downloadEventRegistrationsPdf(e.id)}
                >
                  <Icon name="download" className="text-sm" />
                  Télécharger la liste (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(e)}
                  className="w-full flex items-center justify-center gap-2 border border-outline-variant/20 py-3 rounded-lg text-on-surface font-label text-[10px] font-semibold uppercase tracking-widest hover:bg-surface-container-low transition-colors"
                >
                  <Icon name="edit" className="text-sm" /> Modifier / publier
                </button>
                <button
                  type="button"
                  disabled={removingId === e.id}
                  onClick={() => void removeEvent(e)}
                  className="w-full flex items-center justify-center gap-2 border border-red-200 py-3 rounded-lg text-red-700 font-label text-[10px] font-semibold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  <Icon name="delete" className="text-sm" /> {removingId === e.id ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
