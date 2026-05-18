import type { Event, Id, Program, Space } from '@/types/domain'

type Dict = Record<string, unknown>

function isRecord(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null
}

function asRecord(value: unknown): Dict {
  return isRecord(value) ? value : {}
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function getImageUrl(primary: unknown, fallback: unknown): string {
  const a = asString(primary)
  if (a) return a
  return asString(fallback)
}

export type ApiSpace = {
  id: string | number
  name: string
  description?: string | null
  type?: string | null
  image?: string | null
  is_active?: boolean
  extra?: unknown
}

type ApiActivitySpaceRef = {
  id: string | number
  name?: string | null
}

export type ApiActivity = {
  id: string | number
  slug?: string | null
  kind: string
  title: string
  description?: string | null
  starts_at?: string | null
  ends_at?: string | null
  registration_link?: string | null
  published?: boolean
  is_published?: boolean
  image?: string | null
  space?: ApiActivitySpaceRef | null
  extra?: unknown
}

export type ApiEnrollment = {
  id: string | number
  activity: string | number
  full_name?: string | null
  name?: string | null
  email?: string | null
  phone?: string | null
  company?: string | null
  motivation?: string | null
  created_at?: string | null
  createdAt?: string | null
}

export type ApiBooking = {
  id: string | number
  status?: string | null
  full_name?: string | null
  name?: string | null
  email?: string | null
  phone?: string | null
  message?: string | null
  date?: string | null
  date_iso?: string | null
  start_time?: string | null
  end_time?: string | null
  time?: string | null
  created_at?: string | null
  createdAt?: string | null
  space?: string | number | ApiSpace | null
  space_type?: string | null
}

export function asList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (!isRecord(value)) return []
  const results = value.results
  if (Array.isArray(results)) return results as T[]
  const data = value.data
  if (Array.isArray(data)) return data as T[]
  return []
}

function parseSpeakers(raw: unknown): Event['speakers'] {
  return asArray(raw)
    .map((entry) => asRecord(entry))
    .filter((entry) => asString(entry.name).trim().length > 0)
    .map((entry) => ({
      name: asString(entry.name),
      role: asString(entry.role),
      avatarUrl: asString(entry.avatarUrl || entry.avatar_url),
    }))
}

function parseObjectives(raw: unknown): Program['objectives'] {
  return asArray(raw)
    .map((entry) => asRecord(entry))
    .filter((entry) => asString(entry.title).trim().length > 0)
    .map((entry) => ({
      title: asString(entry.title),
      description: asString(entry.description),
      icon: asString(entry.icon, 'check_circle'),
    }))
}

function parseAudience(raw: unknown): string[] {
  return asArray(raw).map((entry) => asString(entry)).filter((entry) => entry.trim().length > 0)
}

function parsePricingTiers(raw: unknown): Space['pricingTiers'] {
  const rows = asArray(raw)
    .map((entry) => asRecord(entry))
    .filter((entry) => asString(entry.id).trim().length > 0)
    .map((entry) => ({
      id: asString(entry.id),
      label: asString(entry.label),
      priceLabel: asString(entry.priceLabel || entry.price_label),
      includesWifi: entry.includesWifi === true,
      includesAc: entry.includesAc === true,
    }))
  return rows.length > 0 ? rows : []
}

function parseEquipment(raw: unknown): Space['equipment'] {
  return asArray(raw)
    .map((entry) => asRecord(entry))
    .filter((entry) => asString(entry.label).trim().length > 0)
    .map((entry) => ({
      icon: asString(entry.icon, 'check_circle'),
      label: asString(entry.label),
    }))
}

function toReservationSpaceType(raw: string): 'Bureau Privé' | 'Co-working' | 'Réunion' | 'Événement' {
  const key = raw.trim().toLowerCase()
  if (key.includes('private')) return 'Bureau Privé'
  if (key.includes('cowork')) return 'Co-working'
  if (key.includes('meeting') || key.includes('reunion') || key.includes('réunion')) return 'Réunion'
  return 'Événement'
}

export function mapActivityToEvent(activity: ApiActivity): Event {
  const extra = asRecord(activity.extra)
  const published = activity.is_published ?? activity.published ?? false
  return {
    id: String(activity.id),
    slug: asString(activity.slug),
    title: asString(activity.title),
    category: asString(extra.category, 'Innovation') as Event['category'],
    dateISO: asString(activity.starts_at),
    time: asString(extra.time_display),
    locationName: asString(extra.location_name, asString(activity.space?.name)),
    address: asString(extra.address),
    priceLabel: asString(extra.price_label, 'Gratuit'),
    imageUrl: getImageUrl(extra.image_url, activity.image),
    description: asString(activity.description),
    speakers: parseSpeakers(extra.speakers),
    isPublished: published,
    is_published: published,
    starts_at: asString(activity.starts_at),
    ends_at: asString(activity.ends_at),
    registrationLink: activity.registration_link ?? null,
    registration_link: activity.registration_link ?? null,
  }
}

export function mapActivityToProgram(activity: ApiActivity): Program {
  const extra = asRecord(activity.extra)
  const published = activity.is_published ?? activity.published ?? false
  return {
    id: String(activity.id),
    slug: asString(activity.slug),
    title: asString(activity.title),
    category: asString(extra.category, 'Formation'),
    dateRangeLabel: asString(extra.date_range_label),
    locationLabel: asString(extra.location_label, asString(activity.space?.name)),
    durationLabel: asString(extra.duration_label),
    levelLabel: asString(extra.level_label, 'Tous niveaux'),
    priceLabel: asString(extra.price_label, 'Sur demande'),
    imageUrl: getImageUrl(extra.image_url, activity.image),
    summary: asString(extra.summary, asString(activity.description)),
    description: asString(activity.description),
    objectives: parseObjectives(extra.objectives),
    audience: parseAudience(extra.audience),
    isPublished: published,
    is_published: published,
    starts_at: asString(activity.starts_at),
    ends_at: asString(activity.ends_at),
  }
}

export function mapSpaceToDomain(space: ApiSpace): Space {
  const extra = asRecord(space.extra)
  const type = asString(space.type || extra.type, 'Meeting Room')
  const availability = asString(extra.availability, 'available') as Space['availability']
  return {
    id: String(space.id),
    name: asString(space.name),
    type,
    capacityLabel: asString(extra.capacity_label),
    priceLabel: asString(extra.price_label, 'Sur demande'),
    priceUnitLabel: asString(extra.price_unit_label, 'par réservation'),
    pricingTiers: parsePricingTiers(extra.pricing_tiers),
    availability: availability === 'limited' || availability === 'occupied' ? availability : 'available',
    availabilityLabel: asString(extra.availability_label),
    imageUrl: getImageUrl(extra.image_url, space.image),
    description: asString(space.description),
    equipment: parseEquipment(extra.equipment),
    isActive: space.is_active !== false,
    is_active: space.is_active !== false,
  }
}

export function mapEnrollmentToRegistration(
  enrollment: ApiEnrollment,
  targetType: 'event' | 'program',
): {
  id: Id
  fullName: string
  email: string
  phone: string
  company?: string
  motivation?: string
  targetType: 'event' | 'program'
  targetId: Id
  createdAtISO: string
} {
  const created = enrollment.created_at || enrollment.createdAt || new Date().toISOString()
  return {
    id: String(enrollment.id),
    fullName: asString(enrollment.full_name || enrollment.name),
    email: asString(enrollment.email),
    phone: asString(enrollment.phone),
    company: asString(enrollment.company),
    motivation: asString(enrollment.motivation),
    targetType,
    targetId: String(enrollment.activity),
    createdAtISO: asString(created, new Date().toISOString()),
  }
}

export function mapBookingToReservation(
  booking: ApiBooking,
  spaceById: Map<string, Space>,
): {
  id: Id
  fullName: string
  email: string
  phone: string
  spaceType: 'Bureau Privé' | 'Co-working' | 'Réunion' | 'Événement'
  dateISO: string
  time: string
  timeStart?: string
  timeEnd?: string
  message?: string
  createdAtISO: string
  status: 'pending' | 'validated' | 'rejected'
  spaceId?: Id
  spaceName?: string
} {
  const spaceRef = booking.space
  const spaceId =
    typeof spaceRef === 'string' || typeof spaceRef === 'number'
      ? String(spaceRef)
      : isRecord(spaceRef)
        ? asString(spaceRef.id)
        : ''
  const linkedSpace = spaceById.get(spaceId)

  const start = asString(booking.start_time)
  const end = asString(booking.end_time)
  const fallbackTime = asString(booking.time)
  const fullTime = start && end ? `${start} - ${end}` : fallbackTime || start || end

  const statusRaw = asString(booking.status, 'pending').toLowerCase()
  const status: 'pending' | 'validated' | 'rejected' =
    statusRaw === 'validated' || statusRaw === 'accepted'
      ? 'validated'
      : statusRaw === 'rejected' || statusRaw === 'cancelled' || statusRaw === 'canceled'
        ? 'rejected'
        : 'pending'

  const created = booking.created_at || booking.createdAt || new Date().toISOString()
  const dateISO = asString(booking.date_iso || booking.date).slice(0, 10)

  return {
    id: String(booking.id),
    fullName: asString(booking.full_name || booking.name),
    email: asString(booking.email),
    phone: asString(booking.phone),
    spaceType: toReservationSpaceType(asString(booking.space_type || linkedSpace?.type)),
    dateISO,
    time: fullTime,
    timeStart: start || undefined,
    timeEnd: end || undefined,
    message: asString(booking.message) || undefined,
    createdAtISO: asString(created, new Date().toISOString()),
    status,
    spaceId: spaceId || undefined,
    spaceName: linkedSpace?.name,
  }
}

type EventPayloadInput = {
  title: string
  category: string
  starts_at: string
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

export function buildEventActivityPayload(body: EventPayloadInput): Dict {
  return {
    kind: 'event',
    title: body.title,
    description: body.description,
    starts_at: body.starts_at,
    published: body.is_published ?? true,
    registration_link: body.registration_link ?? null,
    extra: {
      category: body.category,
      time_display: body.time_display,
      location_name: body.location_name,
      address: body.address ?? '',
      price_label: body.price_label,
      image_url: body.image_url,
      speakers: body.speakers ?? [],
    },
  }
}

type ProgramPayloadInput = {
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

export function buildProgramActivityPayload(body: ProgramPayloadInput, current?: ApiActivity): Dict {
  return {
    kind: 'training',
    title: body.title,
    description: body.description,
    starts_at: body.starts_at ?? current?.starts_at ?? null,
    ends_at: body.ends_at ?? current?.ends_at ?? null,
    published: body.is_published ?? current?.is_published ?? current?.published ?? true,
    registration_link: current?.registration_link ?? null,
    extra: {
      category: body.category,
      date_range_label: body.date_range_label,
      location_label: body.location_label,
      duration_label: body.duration_label,
      level_label: body.level_label,
      price_label: body.price_label,
      image_url: body.image_url,
      summary: body.summary,
      objectives: body.objectives ?? [],
      audience: body.audience ?? [],
    },
  }
}

type SpacePayloadInput = {
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

export function buildSpacePayload(body: SpacePayloadInput): Dict {
  return {
    name: body.name,
    description: body.description,
    type: body.type,
    is_active: body.is_active ?? true,
    extra: {
      type: body.type,
      capacity_label: body.capacity_label,
      price_label: body.price_label,
      price_unit_label: body.price_unit_label,
      pricing_tiers: body.pricing_tiers ?? [],
      availability: body.availability ?? 'available',
      availability_label: body.availability_label ?? '',
      image_url: body.image_url,
      equipment: body.equipment ?? [],
    },
  }
}
