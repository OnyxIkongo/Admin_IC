import type { SpaceType } from '@/types/domain'

const TYPE_LABELS: Record<SpaceType, string> = {
  'Private Office': 'Bureau privé',
  'Meeting Room': 'Salle de réunion',
  Coworking: 'Coworking',
  'Event Space': 'Grande salle',
}

/** Libellé français pour l’affichage (les clés domain restent en anglais). */
export function spaceTypeLabelFr(type: string): string {
  return TYPE_LABELS[type as SpaceType] ?? type
}

export type ReservationSpaceType = 'Bureau Privé' | 'Co-working' | 'Réunion' | 'Événement'

export function spaceTypeToReservationChoice(type: SpaceType): ReservationSpaceType {
  switch (type) {
    case 'Private Office':
      return 'Bureau Privé'
    case 'Meeting Room':
      return 'Réunion'
    case 'Coworking':
      return 'Co-working'
    case 'Event Space':
      return 'Événement'
    default:
      return 'Événement'
  }
}
