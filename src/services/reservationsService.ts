import type { Id, ReservationPayload } from '@/types/domain'
import { http } from './http'
import {
  asList,
  mapBookingToReservation,
  mapSpaceToDomain,
  type ApiBooking,
  type ApiSpace,
} from '@webPublic/services/backendAdapters'

export type ReservationStatus = 'pending' | 'validated' | 'rejected'

export type ReservationRecord = ReservationPayload & {
  id: Id
  createdAtISO: string
  status: ReservationStatus
  spaceId?: Id
  spaceName?: string
}

export const reservationsService = {
  async listAll(): Promise<ReservationRecord[]> {
    const [bookings, spaces] = await Promise.all([
      http.get<unknown>('/admin/bookings/'),
      http.get<unknown>('/admin/spaces/'),
    ])
    const spaceById = new Map(
      asList<ApiSpace>(spaces.data).map((space) => [String(space.id), mapSpaceToDomain(space)]),
    )
    return asList<ApiBooking>(bookings.data).map((booking) => mapBookingToReservation(booking, spaceById))
  },

  async setStatus(id: Id, status: ReservationStatus): Promise<ReservationRecord | undefined> {
    if (status === 'rejected') {
      await http.post(`/bookings/${id}/cancel/`, {})
    }
    if (status === 'validated') {
      try {
        await http.post(`/bookings/${id}/validate/`, {})
      } catch (e) {
        // Si l’API n’expose pas d’action "validate", on remonte l’erreur pour feedback UI.
        throw e
      }
    }
    const rows = await this.listAll()
    return rows.find((row) => row.id === id)
  },
}
