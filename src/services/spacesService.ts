import type { Id, Space } from '@/types/domain'
import { uploadSpaceGallery, uploadSpaceImage } from './apiUpload'
import { http } from './http'
import {
  asList,
  buildSpacePayload,
  mapSpaceToDomain,
  type ApiSpace,
} from '@webPublic/services/backendAdapters'

export type SpaceWriteBody = {
  name: string
  type: string
  capacity_label: string
  price_label: string
  price_unit_label: string
  pricing_tiers?: unknown[]
  availability?: string
  availability_label?: string
  image_url: string
  description: string
  equipment?: unknown[]
  is_active?: boolean
}

export const spacesService = {
  async list(): Promise<Space[]> {
    const { data } = await http.get<unknown>('/admin/spaces/')
    return asList<ApiSpace>(data).map(mapSpaceToDomain)
  },

  async getById(id: Id): Promise<Space | undefined> {
    try {
      const { data } = await http.get<ApiSpace>(`/admin/spaces/${id}/`)
      return mapSpaceToDomain(data)
    } catch {
      return undefined
    }
  },

  async create(body: SpaceWriteBody): Promise<Space> {
    const { data } = await http.post<ApiSpace>(
      '/admin/spaces/',
      buildSpacePayload(body, { uniqueSlug: true }),
    )
    return mapSpaceToDomain(data)
  },

  async update(id: Id, body: Partial<SpaceWriteBody>): Promise<Space> {
    const current = await http.get<ApiSpace>(`/admin/spaces/${id}/`)
    const extra = (current.data.extra ?? {}) as Record<string, unknown>
    const payload = buildSpacePayload(
      {
        name: body.name ?? current.data.name,
        type: body.type ?? mapSpaceToDomain(current.data).type,
        capacity_label: body.capacity_label ?? String(extra.capacity_label ?? ''),
        price_label: body.price_label ?? String(extra.price_label ?? 'Sur demande'),
        price_unit_label: body.price_unit_label ?? String(extra.price_unit_label ?? 'par réservation'),
        availability: body.availability ?? String(extra.availability ?? 'available'),
        availability_label: body.availability_label ?? String(extra.availability_label ?? ''),
        description: body.description ?? current.data.description ?? '',
        equipment: body.equipment ?? (extra.equipment as unknown[] | undefined),
        is_active: body.is_active ?? current.data.is_active,
      },
      { slug: current.data.slug, extra },
    )
    const { data } = await http.patch<ApiSpace>(`/admin/spaces/${id}/`, payload)
    return mapSpaceToDomain(data)
  },

  async uploadImage(id: Id, file: File): Promise<Space> {
    const data = await uploadSpaceImage<ApiSpace>(String(id), file)
    return mapSpaceToDomain(data)
  },

  async uploadGallery(id: Id, files: File[], replace = false): Promise<Space> {
    const data = await uploadSpaceGallery<ApiSpace>(String(id), files, replace)
    return mapSpaceToDomain(data)
  },

  async remove(id: Id): Promise<void> {
    await http.delete(`/admin/spaces/${id}/`)
  },
}
