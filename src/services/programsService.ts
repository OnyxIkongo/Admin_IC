import type { Id, Program } from '@/types/domain'
import { http } from './http'
import {
  asList,
  buildProgramActivityPayload,
  mapActivityToProgram,
  type ApiActivity,
} from '@webPublic/services/backendAdapters'

export type ProgramWriteBody = {
  title: string
  category: string
  date_range_label: string
  location_label: string
  duration_label: string
  level_label: string
  price_label: string
  image_url: string
  summary: string
  description: string
  objectives?: unknown[]
  audience?: string[]
  starts_at?: string
  ends_at?: string
  is_published?: boolean
}

export const programsService = {
  async list(): Promise<Program[]> {
    const { data } = await http.get<unknown>('/admin/activities/')
    return asList<ApiActivity>(data)
      .filter((item) => item.kind === 'training')
      .map((a) => ({ ...mapActivityToProgram(a), starts_at: a.starts_at, ends_at: a.ends_at }))
  },

  async getById(id: Id): Promise<Program | undefined> {
    try {
      const { data } = await http.get<ApiActivity>(`/admin/activities/${id}/`)
      return { ...mapActivityToProgram(data), starts_at: data.starts_at, ends_at: data.ends_at }
    } catch {
      return undefined
    }
  },

  async create(body: ProgramWriteBody): Promise<Program> {
    const { data } = await http.post<ApiActivity>('/admin/activities/', buildProgramActivityPayload(body))
    return mapActivityToProgram(data)
  },

  async update(id: Id, body: Partial<ProgramWriteBody>): Promise<Program> {
    const current = await http.get<ApiActivity>(`/admin/activities/${id}/`)
    const extra = (current.data.extra ?? {}) as Record<string, unknown>
    const payload = buildProgramActivityPayload(
      {
        title: body.title ?? current.data.title,
        category: body.category ?? String(extra.category ?? 'Formation'),
        date_range_label: body.date_range_label ?? String(extra.date_range_label ?? ''),
        location_label: body.location_label ?? String(extra.location_label ?? current.data.space?.name ?? ''),
        duration_label: body.duration_label ?? String(extra.duration_label ?? ''),
        level_label: body.level_label ?? String(extra.level_label ?? 'Tous niveaux'),
        price_label: body.price_label ?? String(extra.price_label ?? 'Sur demande'),
        image_url: body.image_url ?? String(extra.image_url ?? ''),
        summary: body.summary ?? String(extra.summary ?? current.data.description ?? ''),
        description: body.description ?? current.data.description ?? '',
        objectives: body.objectives ?? (extra.objectives as unknown[] | undefined),
        audience: body.audience ?? (extra.audience as string[] | undefined),
        starts_at: body.starts_at ?? current.data.starts_at,
        ends_at: body.ends_at ?? current.data.ends_at,
        is_published: body.is_published ?? current.data.published,
      },
      current.data,
    )
    const { data } = await http.patch<ApiActivity>(`/admin/activities/${id}/`, payload)
    return mapActivityToProgram(data)
  },

  async uploadImage(id: Id, file: File): Promise<Program> {
    const form = new FormData()
    form.set('image', file)
    const { data } = await http.patch<ApiActivity>(`/admin/activities/${id}/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return mapActivityToProgram(data)
  },

  async remove(id: Id): Promise<void> {
    await http.delete(`/admin/activities/${id}/`)
  },
}
