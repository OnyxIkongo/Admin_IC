export type Id = string

export type EventCategory = 'Tech' | 'Social' | 'Business' | 'Design' | 'Innovation'
export type ProgramCategory = 'Tech' | 'Business' | 'Design'

export type Event = {
  id: Id
  slug?: string
  title: string
  category: EventCategory
  dateISO: string
  time: string
  locationName: string
  address?: string
  priceLabel: string
  imageUrl: string
  description: string
  speakers?: { name: string; role: string; avatarUrl: string }[]
  isPublished?: boolean
  /** Réponse API staff (snake_case DRF). */
  is_published?: boolean
  /** Présent pour les comptes staff (édition, API Django REST). */
  starts_at?: string
  ends_at?: string
  /** Lien externe d'inscription (Google Form, Jotform, etc.). */
  registrationLink?: string | null
  registration_link?: string | null
}

export type Program = {
  id: Id
  slug?: string
  title: string
  /** Libre (aligné web-public / admin Django). */
  category: string
  dateRangeLabel: string
  locationLabel: string
  durationLabel: string
  levelLabel: string
  priceLabel: string
  imageUrl: string
  summary: string
  description: string
  objectives: { title: string; description: string; icon: string }[]
  audience: string[]
  isPublished?: boolean
  is_published?: boolean
  starts_at?: string
  ends_at?: string
}

export type SpaceType = 'Private Office' | 'Coworking' | 'Meeting Room' | 'Event Space'

export type SpaceAvailability = 'available' | 'limited' | 'occupied'

export type SpacePricingTier = {
  id: string
  label: string
  priceLabel: string
  includesWifi?: boolean
  includesAc?: boolean
}

export type Space = {
  id: Id
  slug?: string
  name: string
  /** Libellé technique API (ex. Meeting Room) — afficher via `spaceTypeLabelFr`. */
  type: string
  capacityLabel: string
  priceLabel: string
  priceUnitLabel: string
  pricingTiers?: SpacePricingTier[]
  availability: SpaceAvailability
  availabilityLabel: string
  imageUrl: string
  /** 2–3 photos page « Voir détails » (hors couverture accueil). */
  galleryUrls?: string[]
  description: string
  equipment: { icon: string; label: string }[]
  isActive?: boolean
  is_active?: boolean
}

export type RegistrationPayload = {
  fullName: string
  email: string
  phone: string
  company?: string
  motivation?: string
}

export type ReservationPayload = {
  fullName: string
  email: string
  phone: string
  spaceType: 'Bureau Privé' | 'Co-working' | 'Réunion' | 'Événement'
  dateISO: string
  /** Plage affichée (ex. `09:00 - 11:30`). */
  time: string
  /** Début et fin (si disponibles). */
  timeStart?: string
  timeEnd?: string
  message?: string
}

export type AdminSession = {
  access: string
  refresh: string
  adminName: string
}

/** Résumé inscriptions (tableau de bord admin). */
export type RegistrationSummaryType = 'formation' | 'evenement'
