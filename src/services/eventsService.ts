import type { Event, Id } from '@/types/domain'
import { http } from './http'
import {
  asList,
  buildEventActivityPayload,
  mapActivityToEvent,
  type ApiActivity,
} from '@webPublic/services/backendAdapters'

export type EventWriteBody = {
  title: string
  category: string
  starts_at: string
  ends_at?: string
  time_display: string
  location_name: string
  address?: string
  price_label: string
  image_url: string
  description: string
  speakers?: unknown[]
  is_published?: boolean
  registration_link?: string | null
}

export const eventsService = {
  async list(): Promise<Event[]> {
    const { data } = await http.get<unknown>('/admin/activities/')
    return asList<ApiActivity>(data)
      .filter((item) => item.kind === 'event')
      .map((a) => mapActivityToEvent(a))
  },

  async getById(id: Id): Promise<Event | undefined> {
    try {
      const { data } = await http.get<ApiActivity>(`/admin/activities/${id}/`)
      return mapActivityToEvent(data)
    } catch {
      return undefined
    }
  },

  async create(body: EventWriteBody): Promise<Event> {
    const { data } = await http.post<ApiActivity>('/admin/activities/', buildEventActivityPayload(body))
    return mapActivityToEvent(data)
  },

  async update(id: Id, body: Partial<EventWriteBody>): Promise<Event> {
    const current = await http.get<ApiActivity>(`/admin/activities/${id}/`)
    const payload = buildEventActivityPayload(
      {
      title: body.title ?? current.data.title,
      category: body.category ?? String((current.data.extra as Record<string, unknown> | null)?.category ?? 'Innovation'),
      starts_at: body.starts_at ?? current.data.starts_at ?? '',
      ends_at: body.ends_at ?? current.data.ends_at ?? undefined,
      time_display:
        body.time_display ?? String((current.data.extra as Record<string, unknown> | null)?.time_display ?? ''),
      location_name:
        body.location_name ?? String((current.data.extra as Record<string, unknown> | null)?.location_name ?? current.data.space?.name ?? ''),
      address: body.address ?? String((current.data.extra as Record<string, unknown> | null)?.address ?? ''),
      price_label: body.price_label ?? String((current.data.extra as Record<string, unknown> | null)?.price_label ?? 'Gratuit'),
      image_url: body.image_url ?? String((current.data.extra as Record<string, unknown> | null)?.image_url ?? ''),
      description: body.description ?? current.data.description ?? '',
      speakers: body.speakers ?? ((current.data.extra as Record<string, unknown> | null)?.speakers as unknown[] | undefined),
      is_published: body.is_published ?? current.data.published,
      registration_link:
        body.registration_link !== undefined
          ? body.registration_link
          : (current.data.registration_link ?? null),
      },
      current.data,
    )
    const { data } = await http.patch<ApiActivity>(`/admin/activities/${id}/`, payload)
    return mapActivityToEvent(data)
  },

  async uploadImage(id: Id, file: File): Promise<Event> {
    const form = new FormData()
    form.set('image', file)
    const { data } = await http.patch<ApiActivity>(`/admin/activities/${id}/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return mapActivityToEvent(data)
  },

  async remove(id: Id): Promise<void> {
    await http.delete(`/admin/activities/${id}/`)
  },
}
