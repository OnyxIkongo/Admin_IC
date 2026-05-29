import { useCallback, useEffect, useMemo, useState } from 'react'
import { dayjs } from '@/utils/dayjsFr'
import { Icon } from '@/components/ui/Icon'
import { reservationsService, type ReservationRecord, type ReservationStatus } from '@/services/reservationsService'
import type { Id } from '@/types/domain'
import { apiErrorMessage } from '@/utils/apiErrorMessage'
import { ApiErrorBanner } from '@/components/admin/ApiErrorBanner'
import { cn } from '@/utils/cn'

function statutLabel(s: ReservationStatus): string {
  if (s === 'pending') return 'En attente'
  if (s === 'validated') return 'Validée'
  return 'Refusée'
}

function dateTitle(dateISO: string): string {
  const todayISO = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowISO = tomorrow.toISOString().slice(0, 10)
  if (dateISO === todayISO) return "Aujourd'hui"
  if (dateISO === tomorrowISO) return 'Demain'
  return dayjs(dateISO).format('dddd DD MMMM YYYY')
}

export function AdminReservationsPage() {
  const [items, setItems] = useState<ReservationRecord[]>([])
  const [filter, setFilter] = useState<'all' | ReservationStatus>('all')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<Id | null>(null)

  const reload = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    try {
      const rows = await reservationsService.listAll()
      if (!silent) setLoadError(null)
      setItems(rows)
    } catch (e) {
      if (!silent) {
        setLoadError(apiErrorMessage(e))
        setItems([])
      }
    }
  }, [])

  useEffect(() => {
    void reload()
    const intervalId = window.setInterval(() => void reload({ silent: true }), 15_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload({ silent: true })
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload])

  const upcomingItems = useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10)
    return items.filter((r) => r.dateISO >= todayISO)
  }, [items])

  const groupedReservations = useMemo(() => {
    const rows = upcomingItems.filter((r) => filter === 'all' || r.status === filter).sort((a, b) => {
      const aTime = `${a.dateISO}T${a.timeStart ?? '00:00'}`
      const bTime = `${b.dateISO}T${b.timeStart ?? '00:00'}`
      return aTime.localeCompare(bTime)
    })
    const byDate = new Map<string, ReservationRecord[]>()
    for (const reservation of rows) {
      byDate.set(reservation.dateISO, [...(byDate.get(reservation.dateISO) ?? []), reservation])
    }
    return [...byDate.entries()].map(([dateISO, reservations]) => ({ dateISO, reservations }))
  }, [upcomingItems, filter])

  return (
    <main>
      <div className="mb-8">
        <p className="text-[10px] font-medium tracking-wider uppercase text-on-surface-variant font-label mb-1">
          Administration
        </p>
        <h2 className="text-2xl font-bold text-on-surface tracking-tight">Réservations</h2>
        <ApiErrorBanner message={loadError} onDismiss={() => setLoadError(null)} />
        <ApiErrorBanner message={actionError} onDismiss={() => setActionError(null)} />
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'pending', label: 'En attente' },
            { key: 'validated', label: 'Validées' },
            { key: 'rejected', label: 'Refusées' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key as typeof filter)}
              className={cn(
                'px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap',
                filter === t.key
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-high text-on-surface-variant',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-surface-container-lowest rounded-xl">
          <span className="text-3xl font-bold font-headline text-primary">
            {upcomingItems.filter((i) => i.status === 'pending').length}
          </span>
          <p className="text-[10px] font-medium tracking-wider uppercase text-on-surface-variant font-label mt-1">
            À traiter
          </p>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-xl">
          <span className="text-3xl font-bold font-headline text-tertiary">{upcomingItems.length}</span>
          <p className="text-[10px] font-medium tracking-wider uppercase text-on-surface-variant font-label mt-1">
            À venir
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {groupedReservations.length === 0 ? (
          <div className="rounded-xl bg-surface-container-lowest p-6 text-sm text-on-surface-variant">
            Aucune réservation à venir pour ce filtre.
          </div>
        ) : null}

        {groupedReservations.map(({ dateISO, reservations }) => (
          <section key={dateISO} className="space-y-4">
            <div className="sticky top-0 z-10 rounded-xl border border-outline-variant/10 bg-surface/95 px-4 py-3 backdrop-blur">
              <h3 className="font-headline text-lg font-bold capitalize text-on-surface">{dateTitle(dateISO)}</h3>
              <p className="text-[10px] font-label font-medium uppercase tracking-widest text-on-surface-variant">
                {reservations.length} réservation{reservations.length > 1 ? 's' : ''}
              </p>
            </div>

            {reservations.map((r) => (
              <div
                key={r.id}
                className="bg-surface-container-lowest p-5 rounded-xl shadow-sm transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                      <Icon name="person" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-on-surface">{r.fullName}</h3>
                      <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest">
                        {r.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider',
                      r.status === 'pending' && 'bg-amber-100 text-amber-700',
                      r.status === 'validated' && 'bg-green-100 text-green-700',
                      r.status === 'rejected' && 'bg-red-100 text-red-700',
                    )}
                  >
                    {statutLabel(r.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-4 mb-5">
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-label uppercase mb-1">Espace</p>
                    <p className="text-xs font-medium text-on-surface flex items-center gap-1">
                      <Icon name="meeting_room" className="text-[14px]" /> {r.spaceType}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-label uppercase mb-1">Date</p>
                    <p className="text-xs font-medium text-on-surface flex items-center gap-1">
                      <Icon name="calendar_today" className="text-[14px]" />{' '}
                      {dayjs(r.dateISO).format('DD MMM YYYY')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-label uppercase mb-1">Heure début</p>
                    <p className="text-xs font-medium text-on-surface flex items-center gap-1">
                      <Icon name="schedule" className="text-[14px]" /> {r.timeStart ?? r.time.split('-')[0]?.trim() ?? r.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-label uppercase mb-1">Heure fin</p>
                    <p className="text-xs font-medium text-on-surface flex items-center gap-1">
                      <Icon name="schedule" className="text-[14px]" /> {r.timeEnd ?? r.time.split('-')[1]?.trim() ?? r.time}
                    </p>
                  </div>
                </div>

                {r.message ? (
                  <div className="mb-5 rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
                    <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest mb-2">Choix utilisateur</p>
                    <p className="text-xs text-on-surface whitespace-pre-wrap">{r.message}</p>
                  </div>
                ) : null}

                {r.status !== 'rejected' && (
                  <div className="flex gap-2 pt-4 border-t border-outline-variant/10">
                    {r.status === 'pending' ? (
                      <button
                        type="button"
                        className="flex-1 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg uppercase tracking-wider transition-opacity hover:opacity-90"
                        onClick={async () => {
                          setActionError(null)
                          setActionId(r.id)
                          try {
                            const updated = await reservationsService.setStatus(r.id, 'validated')
                            setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                          } catch (e) {
                            setActionError(apiErrorMessage(e))
                          } finally {
                            setActionId(null)
                          }
                        }}
                        disabled={actionId === r.id}
                      >
                        Valider
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="px-4 py-2 bg-surface-container-high text-on-surface-variant text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-error-container hover:text-error transition-colors"
                      onClick={async () => {
                        setActionError(null)
                        setActionId(r.id)
                        try {
                          const updated = await reservationsService.setStatus(r.id, 'rejected')
                          setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                        } catch (e) {
                          setActionError(apiErrorMessage(e))
                        } finally {
                          setActionId(null)
                        }
                      }}
                      disabled={actionId === r.id}
                    >
                      {r.status === 'pending' ? 'Refuser' : 'Annuler'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  )
}
