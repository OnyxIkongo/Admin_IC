import type { Id, RegistrationPayload } from '@/types/domain'
import { http } from './http'
import { downloadCsv } from '@/utils/csvDownload'
import { asList, mapEnrollmentToRegistration, type ApiActivity, type ApiEnrollment } from '@webPublic/services/backendAdapters'

export type RegistrationRecord = RegistrationPayload & {
  id: Id
  targetType: 'event' | 'program'
  targetId: Id
  createdAtISO: string
}

async function listActivities(): Promise<ApiActivity[]> {
  const { data } = await http.get<unknown>('/admin/activities/')
  return asList<ApiActivity>(data)
}

async function listEnrollments(): Promise<ApiEnrollment[]> {
  const { data } = await http.get<unknown>('/admin/enrollments/')
  return asList<ApiEnrollment>(data)
}

async function loadMergedRegistrations(): Promise<RegistrationRecord[]> {
  const [activities, enrollments] = await Promise.all([listActivities(), listEnrollments()])
  const kindByActivityId = new Map(activities.map((activity) => [String(activity.id), activity.kind]))
  const rows: RegistrationRecord[] = []
  for (const row of enrollments) {
      const kind = kindByActivityId.get(String(row.activity))
      if (kind !== 'event' && kind !== 'training') continue
      const mapped = mapEnrollmentToRegistration(row, kind === 'event' ? 'event' : 'program')
      rows.push({
        ...mapped,
      })
  }
  return rows
}

function asExcelText(value: string): string {
  // Force Excel to keep the value as text (apostrophe is not displayed in cells).
  const v = (value ?? '').trim()
  return v ? `'${v}` : ''
}

function formatEmailForExcel(email: string): string {
  const v = (email ?? '').trim()
  if (!v) return ''
  return v
}

function formatDateForExcel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad2 = (n: number) => String(n).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${yy} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function exportTimestamp(): string {
  return formatDateForExcel(new Date().toISOString())
}

export const registrationsService = {
  async listByEvent(eventId: Id): Promise<RegistrationRecord[]> {
    const rows = await loadMergedRegistrations()
    return rows.filter((row) => row.targetType === 'event' && row.targetId === eventId)
  },

  async listByProgram(programId: Id): Promise<RegistrationRecord[]> {
    const rows = await loadMergedRegistrations()
    return rows.filter((row) => row.targetType === 'program' && row.targetId === programId)
  },

  async listAll(): Promise<RegistrationRecord[]> {
    const rows = await loadMergedRegistrations()
    return [...rows].sort((x, y) => (x.createdAtISO < y.createdAtISO ? 1 : -1))
  },

  /** Nombre d’inscriptions par id d’événement (API admin). */
  async countByEventId(): Promise<Record<Id, number>> {
    const rows = (await loadMergedRegistrations()).filter((row) => row.targetType === 'event')
    const m: Record<Id, number> = {}
    for (const r of rows) {
      m[r.targetId] = (m[r.targetId] ?? 0) + 1
    }
    return m
  },

  /** Nombre de candidatures par id de formation. */
  async countByProgramId(): Promise<Record<Id, number>> {
    const rows = (await loadMergedRegistrations()).filter((row) => row.targetType === 'program')
    const m: Record<Id, number> = {}
    for (const r of rows) {
      m[r.targetId] = (m[r.targetId] ?? 0) + 1
    }
    return m
  },

  async downloadEventRegistrationsPdf(eventId?: Id, targetTitle?: string): Promise<void> {
    const rows = eventId ? await this.listByEvent(eventId) : (await this.listAll()).filter((row) => row.targetType === 'event')
    downloadCsv(
      'inscriptions_evenements.csv',
      rows.map((row) => ({
        Nom: row.fullName,
        Email: formatEmailForExcel(row.email),
        Tel: row.phone?.trim() ? asExcelText(row.phone) : '-',
      })),
      {
        title:
          targetTitle && targetTitle.trim()
            ? `Liste des événements — ${targetTitle.trim()} — ${exportTimestamp()}`
            : `Liste des événements — ${exportTimestamp()}`,
      },
    )
  },

  async downloadProgramApplicationsPdf(programId?: Id, targetTitle?: string): Promise<void> {
    const rows = programId
      ? await this.listByProgram(programId)
      : (await this.listAll()).filter((row) => row.targetType === 'program')
    downloadCsv(
      'inscriptions_formations.csv',
      rows.map((row) => ({
        Nom: row.fullName,
        Email: formatEmailForExcel(row.email),
        Tel: row.phone?.trim() ? asExcelText(row.phone) : '-',
      })),
      {
        title:
          targetTitle && targetTitle.trim()
            ? `Liste des formations — ${targetTitle.trim()} — ${exportTimestamp()}`
            : `Liste des formations — ${exportTimestamp()}`,
      },
    )
  },
}
