import type { Id, ReservationPayload } from '@/types/domain'
import { http } from './http'
import {
  asList,
  mapBookingToReservation,
  mapSpaceToDomain,
  type ApiBooking,
  type ApiSpace,
} from '@webPublic/services/backendAdapters'
import { apiErrorMessage } from '@/utils/apiErrorMessage'

export type ReservationStatus = 'pending' | 'validated' | 'rejected'

export type ReservationRecord = ReservationPayload & {
  id: Id
  createdAtISO: string
  status: ReservationStatus
  spaceId?: Id
  spaceName?: string
}

function mapSingleBooking(data: ApiBooking, spaceById: Map<string, ReturnType<typeof mapSpaceToDomain>>) {
  return mapBookingToReservation(data, spaceById)
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

  async setStatus(id: Id, status: ReservationStatus): Promise<ReservationRecord> {
    const path =
      status === 'validated' ? `/bookings/${id}/validate/` : `/bookings/${id}/cancel/`
    try {
      const { data } = await http.post<ApiBooking>(path, {})
      return mapSingleBooking(data, new Map())
    } catch (err) {
      throw new Error(apiErrorMessage(err))
    }
  },
}
