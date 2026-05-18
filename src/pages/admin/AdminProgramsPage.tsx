import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { programsService } from '@/services/programsService'
import { registrationsService } from '@/services/registrationsService'
import type { Program } from '@/types/domain'
import { ProgramFormDialog } from '@/components/admin/ContentFormDialogs'
import { apiErrorMessage } from '@/utils/apiErrorMessage'
import { ApiErrorBanner } from '@/components/admin/ApiErrorBanner'
import { formatDateRangeFr } from '@/utils/formatDateRangeFr'

function isProgramPublished(p: Program) {
  return Boolean(p.is_published ?? p.isPublished)
}

export function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Program | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setLoadError(null)
      const [list, byProgram] = await Promise.all([programsService.list(), registrationsService.countByProgramId()])
      setPrograms(list)
      setCounts(byProgram)
    } catch (e) {
      setLoadError(apiErrorMessage(e))
      setPrograms([])
      setCounts({})
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const removeProgram = async (p: Program) => {
    const ok = window.confirm(`Supprimer définitivement la formation “${p.title}” ?`)
    if (!ok) return
    try {
      setLoadError(null)
      setRemovingId(p.id)
      await programsService.remove(p.id)
      await reload()
    } catch (e) {
      setLoadError(apiErrorMessage(e))
    } finally {
      setRemovingId(null)
    }
  }

  const totalApps = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <main>
      <ApiErrorBanner message={loadError} onDismiss={() => setLoadError(null)} />
      <ProgramFormDialog
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
          <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Formations</h2>
          <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
            Les contenus publiés sont visibles côté site utilisateur.
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
          Nouvelle formation
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-container-low p-5 rounded-lg">
          <p className="font-headline text-3xl font-bold text-primary">{programs.length}</p>
          <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
            Formations (toutes)
          </p>
        </div>
        <div className="bg-surface-container-low p-5 rounded-lg">
          <p className="font-headline text-3xl font-bold text-primary">{totalApps}</p>
          <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
            Candidatures (total)
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {programs.map((p) => (
          <div
            key={p.id}
            className="bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant/10 transition-all active:scale-[0.99]"
          >
            {p.imageUrl ? (
              <img src={p.imageUrl} alt="" className="w-full h-44 object-cover" />
            ) : null}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`flex items-center gap-2 px-2 py-1 rounded ${
                    isProgramPublished(p) ? 'bg-primary/10' : 'bg-surface-container-high'
                  }`}
                >
                  <Icon name="circle" className="text-[14px] text-primary" filled />
                  <span className="font-label text-[10px] font-bold text-primary uppercase">
                    {isProgramPublished(p) ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
              </div>

              <h3 className="font-headline text-lg font-semibold mb-2">{p.title}</h3>
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                  <Icon name="calendar_today" className="text-sm" />
                  <span>{formatDateRangeFr(p.starts_at, p.ends_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                  <Icon name="group" className="text-sm" />
                  <span>{counts[p.id] ?? 0} candidature(s)</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-3 rounded-lg font-label text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
                  onClick={() => void registrationsService.downloadProgramApplicationsPdf(p.id)}
                >
                  <Icon name="download" className="text-sm" />
                  Télécharger la liste (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(p)
                    setDialogOpen(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 border border-outline-variant/20 py-3 rounded-lg text-on-surface font-label text-[10px] font-semibold uppercase tracking-widest hover:bg-surface-container-low transition-colors"
                >
                  <Icon name="edit" className="text-sm" /> Modifier / publier
                </button>
                <button
                  type="button"
                  disabled={removingId === p.id}
                  onClick={() => void removeProgram(p)}
                  className="w-full flex items-center justify-center gap-2 border border-red-200 py-3 rounded-lg text-red-700 font-label text-[10px] font-semibold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  <Icon name="delete" className="text-sm" /> {removingId === p.id ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
