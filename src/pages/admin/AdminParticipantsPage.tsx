import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { eventsService } from '@/services/eventsService'
import { programsService } from '@/services/programsService'
import { registrationsService, type RegistrationRecord } from '@/services/registrationsService'
import type { Event, Program } from '@/types/domain'
import { cn } from '@/utils/cn'
import { apiErrorMessage } from '@/utils/apiErrorMessage'
import { ApiErrorBanner } from '@/components/admin/ApiErrorBanner'

const ALL_TARGETS = '__all__'

export function AdminParticipantsPage() {
  const [tab, setTab] = useState<'event' | 'program'>('event')
  const [events, setEvents] = useState<Event[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedId, setSelectedId] = useState<string>(ALL_TARGETS)
  const [regs, setRegs] = useState<RegistrationRecord[]>([])
  const [listsError, setListsError] = useState<string | null>(null)
  const [regsError, setRegsError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setListsError(null)
        const [e, p] = await Promise.all([eventsService.list(), programsService.list()])
        setEvents(e)
        setPrograms(p)
        setSelectedId(ALL_TARGETS)
      } catch (err) {
        setListsError(apiErrorMessage(err))
        setEvents([])
        setPrograms([])
        setSelectedId(ALL_TARGETS)
      }
    })()
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        setRegsError(null)
        const list = await registrationsService.listAll()
        setRegs(list)
      } catch (err) {
        setRegsError(apiErrorMessage(err))
        setRegs([])
      }
    })()
  }, [])

  const currentTargets = useMemo(() => {
    return tab === 'event' ? events : programs
  }, [tab, events, programs])

  const titleById = useMemo(() => {
    return new Map(currentTargets.map((t) => [String(t.id), t.title]))
  }, [currentTargets])

  const filteredRegs = useMemo(() => {
    const targetType = tab === 'event' ? 'event' : 'program'
    return regs.filter((r) => r.targetType === targetType && (selectedId === ALL_TARGETS || r.targetId === selectedId))
  }, [regs, tab, selectedId])

  const groupedRegs = useMemo(() => {
    if (selectedId !== ALL_TARGETS) {
      const label = titleById.get(String(selectedId)) ?? '—'
      return [{ id: String(selectedId), title: label, rows: filteredRegs }]
    }

    const byTarget = new Map<string, RegistrationRecord[]>()
    for (const r of filteredRegs) {
      const key = String(r.targetId)
      const arr = byTarget.get(key)
      if (arr) arr.push(r)
      else byTarget.set(key, [r])
    }

    const groups = [...byTarget.entries()].map(([id, rows]) => ({
      id,
      title: titleById.get(id) ?? '(cible inconnue)',
      rows: [...rows].sort((a, b) => (a.createdAtISO < b.createdAtISO ? 1 : -1)),
    }))
    groups.sort((a, b) => a.title.localeCompare(b.title, 'fr'))
    return groups
  }, [filteredRegs, selectedId, titleById])

  const selectedLabel = useMemo(() => {
    if (selectedId === ALL_TARGETS) {
      return tab === 'event' ? 'Tous les événements' : 'Toutes les formations'
    }
    if (tab === 'event') return events.find((e) => e.id === selectedId)?.title ?? '—'
    return programs.find((p) => p.id === selectedId)?.title ?? '—'
  }, [tab, selectedId, events, programs])

  return (
    <main>
      <ApiErrorBanner message={listsError ?? regsError} onDismiss={() => { setListsError(null); setRegsError(null) }} />
      <div className="mb-8">
        <p className="text-[10px] font-medium tracking-wider uppercase text-on-surface-variant font-label mb-1">
          Administration
        </p>
        <h2 className="text-2xl font-bold text-on-surface tracking-tight">Participants</h2>
        <p className="text-sm text-on-surface-variant mt-2">
          Filtrez par événement ou formation et exportez la liste en CSV.
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest',
            tab === 'event' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant',
          )}
          onClick={() => setTab('event')}
        >
          Événements
        </button>
        <button
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest',
            tab === 'program' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant',
          )}
          onClick={() => setTab('program')}
        >
          Formations
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant mb-2">
              Cible
            </p>
            <select
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value={ALL_TARGETS}>{tab === 'event' ? 'Tous les événements' : 'Toutes les formations'}</option>
              {currentTargets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider border border-outline-variant/20 hover:bg-surface-container-low transition-colors inline-flex items-center gap-2"
              onClick={() => {
                void (tab === 'event'
                  ? registrationsService.downloadEventRegistrationsPdf(
                      selectedId === ALL_TARGETS ? undefined : selectedId,
                      selectedId === ALL_TARGETS ? undefined : selectedLabel,
                    )
                  : registrationsService.downloadProgramApplicationsPdf(
                      selectedId === ALL_TARGETS ? undefined : selectedId,
                      selectedId === ALL_TARGETS ? undefined : selectedLabel,
                    ))
              }}
            >
              <Icon name="download" className="text-sm" /> Télécharger CSV
            </button>
            <div className="px-4 py-3 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider inline-flex items-center">
              {filteredRegs.length} inscrits
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-on-surface-variant">
          Liste: <span className="text-on-surface font-semibold">{selectedLabel}</span>
        </p>
      </div>

      {groupedRegs.length === 0 || filteredRegs.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 px-6 py-10 text-sm text-on-surface-variant">
          Aucun inscrit pour le moment.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedRegs.map((group) => (
            <section
              key={group.id}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-surface-container-low">
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
                    {tab === 'event' ? 'Événement' : 'Formation'}
                  </p>
                  <h3 className="text-base font-semibold text-on-surface">{group.title}</h3>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-2 rounded-lg">
                  {group.rows.length} inscrit{group.rows.length > 1 ? 's' : ''}
                </div>
              </div>

              {/* Desktop header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
                <div className="col-span-3">Nom</div>
                <div className="col-span-4">Courriel</div>
                <div className="col-span-2">Téléphone</div>
                <div className="col-span-3">Date</div>
              </div>

              {group.rows.map((r) => (
                <div key={r.id} className="border-t border-outline-variant/10 px-6 py-4">
                  {/* Mobile card */}
                  <div className="md:hidden space-y-2">
                    <div className="font-medium text-on-surface">{r.fullName}</div>
                    <div className="text-sm text-on-surface-variant break-all">{r.email}</div>
                    <div className="text-sm text-on-surface-variant">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant mr-2">
                        Téléphone
                      </span>
                      {r.phone || '—'}
                    </div>
                    <div className="text-sm text-on-surface-variant">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant mr-2">
                        Date
                      </span>
                      {new Date(r.createdAtISO).toLocaleString()}
                    </div>
                  </div>

                  {/* Desktop row */}
                  <div className="hidden md:grid md:grid-cols-12 md:gap-4">
                    <div className="md:col-span-3 font-medium">{r.fullName}</div>
                    <div className="md:col-span-4 text-on-surface-variant break-all">{r.email}</div>
                    <div className="md:col-span-2 text-on-surface-variant">{r.phone}</div>
                    <div className="md:col-span-3 text-on-surface-variant">
                      {new Date(r.createdAtISO).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

