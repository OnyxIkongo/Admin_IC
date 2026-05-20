import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { reservationsService } from '@/services/reservationsService'
import { dayjs } from '@/utils/dayjsFr'
import { apiErrorMessage } from '@/utils/apiErrorMessage'
import { ApiErrorBanner } from '@/components/admin/ApiErrorBanner'
import { reservationVenueKindFr } from '@/utils/reservationDisplay'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/utils/cn'
import type { ReservationStatus } from '@/services/reservationsService'

function statutLabel(s: ReservationStatus): string {
  if (s === 'pending') return 'En attente'
  if (s === 'validated') return 'Validée'
  return 'Refusée'
}

export function AdminDashboardPage() {
  const [loadError, setLoadError] = useState<string | null>(null)
  const [recentReservations, setRecentReservations] = useState<
    Array<{
      id: string
      fullName: string
      email: string
      spaceName: string
      spaceType: string
      dateISO: string
      time: string
      createdAtISO: string
      status: ReservationStatus
    }>
  >([])

  const loadDashboard = useCallback(async () => {
    try {
      setLoadError(null)
      const reservations = await reservationsService.listAll()
      const todayISO = new Date().toISOString().slice(0, 10)
      setRecentReservations(
        [...reservations]
          .filter((r) => r.dateISO === todayISO)
          .sort((a, b) => (a.createdAtISO < b.createdAtISO ? 1 : -1))
          .slice(0, 8)
          .map((r) => ({
            id: r.id,
            fullName: r.fullName,
            email: r.email,
            spaceName: r.spaceName ?? '',
            spaceType: r.spaceType,
            dateISO: r.dateISO,
            time: r.time,
            createdAtISO: r.createdAtISO,
            status: r.status,
          })),
      )
    } catch (e) {
      setLoadError(apiErrorMessage(e))
      setRecentReservations([])
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
    const intervalId = window.setInterval(() => void loadDashboard(), 30_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void loadDashboard()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loadDashboard])

  return (
    <main className="min-h-screen">
      <section className="mt-4 mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-label text-[10px] font-medium tracking-wider uppercase text-on-surface-variant mb-1 block">
            Administration
          </span>
          <h2 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Tableau de bord</h2>
          <p className="text-on-surface-variant text-sm mt-1 leading-relaxed max-w-3xl">
            Réservations d’espaces : les créneaux se bloquent pour les autres utilisateurs. Gérez le détail sous{' '}
            <Link to="/spaces" className="font-semibold text-primary">
              Espaces
            </Link>
            , les événements et formations dans leurs menus respectifs.
          </p>
        </div>
      </section>

      <ApiErrorBanner message={loadError} onDismiss={() => setLoadError(null)} />

      <section className="mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              to: '/reservations',
              title: 'Réservations',
              subtitle: 'Traiter / valider / refuser les demandes',
              icon: 'event',
            },
            {
              to: '/spaces',
              title: 'Espaces',
              subtitle: 'Créer, modifier, activer, images',
              icon: 'business_center',
            },
            {
              to: '/events',
              title: 'Événements',
              subtitle: 'Publier, éditer, inscriptions',
              icon: 'calendar_today',
            },
          ].map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-5 hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-label font-bold tracking-widest uppercase text-on-surface-variant">
                    Accès rapide
                  </p>
                  <h3 className="font-headline text-lg font-bold text-on-surface mt-1">{card.title}</h3>
                  <p className="text-sm text-on-surface-variant mt-1">{card.subtitle}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon name={card.icon} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] font-label font-bold tracking-widest uppercase text-on-surface-variant">
              Zone
            </p>
            <h3 className="font-headline text-xl font-bold text-on-surface">Réservations du jour</h3>
          </div>
          <div className="flex gap-2">
            <Link
              to="/reservations"
              className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-colors rounded-lg px-3 py-2 inline-flex items-center gap-2"
            >
              <Icon name="open_in_new" className="text-sm" />
              Voir tout
            </Link>
            <Link
              to="/spaces"
              className="text-xs font-semibold text-on-surface bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-lg px-3 py-2 inline-flex items-center gap-2"
            >
              <Icon name="business_center" className="text-sm" />
              Voir espaces
            </Link>
          </div>
        </div>

        {recentReservations.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-6 text-sm text-on-surface-variant">
            Aucune réservation pour aujourd’hui.
          </div>
        ) : (
          <div className="space-y-4">
            {recentReservations.map((r) => (
              <div
                key={r.id}
                className="bg-surface-container-lowest p-5 rounded-xl shadow-sm transition-all active:scale-[0.98] border border-outline-variant/10"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                      <Icon name="person" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-on-surface truncate">{r.fullName}</h4>
                      <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest truncate">
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

                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-label uppercase mb-1">Lieu réservé</p>
                    <p className="text-xs font-medium text-on-surface flex items-center gap-1">
                      <Icon name="meeting_room" className="text-[14px]" /> Réservation : {reservationVenueKindFr(r.spaceType)}
                    </p>
                    {r.spaceName ? <p className="text-xs text-on-surface mt-0.5">{r.spaceName}</p> : null}
                    <p className="text-[10px] text-on-surface-variant mt-0.5">({r.spaceType})</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-label uppercase mb-1">Date & heure</p>
                    <p className="text-xs font-medium text-on-surface flex items-center gap-1">
                      <Icon name="calendar_today" className="text-[14px]" /> {dayjs(r.dateISO).format('DD MMM YYYY')}
                    </p>
                    <p className="text-xs font-medium text-on-surface flex items-center gap-1 mt-1">
                      <Icon name="schedule" className="text-[14px]" /> {r.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
