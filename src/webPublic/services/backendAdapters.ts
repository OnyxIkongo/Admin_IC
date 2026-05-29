import type { Event, Id, Program, Space } from '@/types/domain'
import { pickImageUrl, resolveMediaUrl } from '@/utils/mediaUrl'

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

function getImageUrlFromApi(
  item: { image?: unknown; image_path?: unknown; image_url?: unknown; extra?: unknown },
): string {
  return pickImageUrl({
    image: asString(item.image),
    image_path: asString(item.image_path),
    image_url: asString(item.image_url),
    extra: asRecord(item.extra),
  })
}

function parseGalleryUrls(space: ApiSpace, extra: Dict): string[] {
  const raw =
    space.gallery_urls ?? extra.gallery_urls ?? extra.gallery_paths ?? extra.gallery
  return asArray(raw)
    .map((entry) => asString(entry))
    .filter((entry) => entry.trim().length > 0)
    .map((entry) => resolveMediaUrl(entry))
    .filter((entry) => entry.length > 0)
    .slice(0, 3)
}

export type ApiSpace = {
  id: string | number
  kind?: string
  name: string
  slug?: string
  description?: string | null
  capacity?: number | null
  type?: string | null
  image?: string | null
  image_path?: string | null
  image_url?: string | null
  gallery_urls?: string[] | null
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
  image_path?: string | null
  image_url?: string | null
  space?: ApiActivitySpaceRef | null
  extra?: unknown
}

export type ApiEnrollment = {
  id: string | number
  activity: string | number
  guest_full_name?: string | null
  guest_email?: string | null
  guest_phone?: string | null
  full_name?: string | null
  name?: string | null
  email?: string | null
  phone?: string | null
  created_at?: string | null
  createdAt?: string | null
}

export type ApiBooking = {
  id: string | number
  space: string | number
  space_name?: string | null
  status?: string | null
  guest_full_name?: string | null
  guest_email?: string | null
  guest_phone?: string | null
  start_at?: string | null
  end_at?: string | null
  note?: string | null
  created_at?: string | null
  createdAt?: string | null
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

function formatDateOnly(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatHourMinute(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function buildTimeDisplay(startsAt: string, endsAt: string, fallback?: string): string {
  const explicit = asString(fallback).trim()
  if (explicit) return explicit
  const start = formatHourMinute(startsAt)
  const end = formatHourMinute(endsAt)
  if (start && end) return `${start} - ${end}`
  return start || end || ''
}

function mapBookingStatus(statusRaw: string): 'pending' | 'validated' | 'rejected' {
  const s = statusRaw.trim().toLowerCase()
  if (s === 'confirmed') return 'validated'
  if (s === 'cancelled' || s === 'canceled' || s === 'rejected') return 'rejected'
  return 'pending'
}

function mapBookingKindToReservationChoice(kind: string): 'Bureau Privé' | 'Co-working' | 'Réunion' | 'Événement' {
  if (kind === 'office') return 'Bureau Privé'
  if (kind === 'coworking') return 'Co-working'
  if (kind === 'event_room') return 'Événement'
  return 'Réunion'
}

function toReservationSpaceType(raw: string): 'Bureau Privé' | 'Co-working' | 'Réunion' | 'Événement' {
  const key = raw.trim().toLowerCase()
  if (key.includes('private') || key === 'office') return 'Bureau Privé'
  if (key.includes('cowork')) return 'Co-working'
  if (key.includes('meeting') || key.includes('reunion') || key.includes('réunion')) return 'Réunion'
  if (key.includes('event')) return 'Événement'
  return 'Réunion'
}

export function mapActivityToEvent(activity: ApiActivity): Event {
  const extra = asRecord(activity.extra)
  const published = activity.is_published ?? activity.published ?? false
  const startsAt = asString(activity.starts_at)
  const endsAt = asString(activity.ends_at)
  return {
    id: String(activity.id),
    slug: asString(activity.slug),
    title: asString(activity.title),
    category: asString(extra.category, 'Innovation') as Event['category'],
    dateISO: formatDateOnly(startsAt),
    time: buildTimeDisplay(startsAt, endsAt, asString(extra.time_display)),
    locationName: asString(extra.location_name, asString(activity.space?.name)),
    address: asString(extra.address),
    priceLabel: asString(extra.price_label, 'Gratuit'),
    imageUrl: getImageUrlFromApi(activity),
    description: asString(activity.description),
    speakers: parseSpeakers(extra.speakers),
    isPublished: published,
    is_published: published,
    starts_at: startsAt,
    ends_at: endsAt,
    registrationLink: activity.registration_link ?? null,
    registration_link: activity.registration_link ?? null,
  }
}

export function mapActivityToProgram(activity: ApiActivity): Program {
  const extra = asRecord(activity.extra)
  const published = activity.is_published ?? activity.published ?? false
  const startsAt = asString(activity.starts_at)
  return {
    id: String(activity.id),
    slug: asString(activity.slug),
    title: asString(activity.title),
    category: asString(extra.category, 'Formation'),
    dateRangeLabel: asString(extra.date_range_label, formatDateOnly(startsAt)),
    locationLabel: asString(extra.location_label, asString(activity.space?.name)),
    durationLabel: asString(
      extra.duration_label,
      buildTimeDisplay(startsAt, asString(activity.ends_at)),
    ),
    levelLabel: asString(extra.level_label, 'Tous niveaux'),
    priceLabel: asString(extra.price_label, 'Sur demande'),
    imageUrl: getImageUrlFromApi(activity),
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

function mapSpaceKindToLabel(kind: string): Space['type'] {
  if (kind === 'office') return 'Private Office'
  if (kind === 'coworking') return 'Coworking'
  if (kind === 'event_room') return 'Event Space'
  return 'Meeting Room'
}

export function slugifyValue(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function mapAdminSpaceTypeToKind(type: string): string {
  if (type === 'Private Office') return 'office'
  if (type === 'Coworking') return 'coworking'
  if (type === 'Event Space') return 'event_room'
  // Backend n'a pas (encore) de kind "meeting_room" : on stocke le détail dans extra.display_type.
  if (type === 'Meeting Room') return 'event_room'
  return 'event_room'
}

function numberFromCapacityLabel(label: string): number | null {
  const match = label.match(/\d+/)
  return match ? Number(match[0]) : null
}

export function mapSpaceToDomain(space: ApiSpace): Space {
  const extra = asRecord(space.extra)
  const apiKind = asString(space.kind)
  // Important: le backend utilise parfois kind=event_room pour plusieurs sous-types.
  // On préfère donc l'intention admin (extra.display_type) quand disponible.
  const type = asString(space.type || extra.display_type || extra.type, '') || (apiKind ? mapSpaceKindToLabel(apiKind) : 'Meeting Room')
  const availability = asString(extra.availability, 'available') as Space['availability']
  return {
    id: String(space.id),
    name: asString(space.name),
    type,
    capacityLabel:
      asString(extra.capacity_label) ||
      (space.capacity != null && space.capacity > 0 ? `${space.capacity} places` : '') ||
      'Capacité variable',
    priceLabel: asString(extra.price_label, 'Sur demande'),
    priceUnitLabel: asString(extra.price_unit_label, 'par réservation'),
    pricingTiers: parsePricingTiers(extra.pricing_tiers),
    availability: availability === 'limited' || availability === 'occupied' ? availability : 'available',
    availabilityLabel:
      asString(extra.availability_label) ||
      (availability === 'limited' ? 'Places limitées' : availability === 'occupied' ? 'Occupé' : 'Disponible'),
    imageUrl: getImageUrlFromApi(space),
    galleryUrls: parseGalleryUrls(space, extra),
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
  targetType: 'event' | 'program'
  targetId: Id
  createdAtISO: string
} {
  const created = enrollment.created_at || enrollment.createdAt || new Date().toISOString()
  return {
    id: String(enrollment.id),
    fullName: asString(enrollment.guest_full_name || enrollment.full_name || enrollment.name),
    email: asString(enrollment.guest_email || enrollment.email),
    phone: asString(enrollment.guest_phone || enrollment.phone),
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
  const spaceId = String(booking.space)
  const linkedSpace = spaceById.get(spaceId)
  const startAt = asString(booking.start_at)
  const endAt = asString(booking.end_at)
  const timeStart = formatHourMinute(startAt)
  const timeEnd = formatHourMinute(endAt)
  const apiKind = linkedSpace ? mapAdminSpaceTypeToKind(linkedSpace.type) : ''

  return {
    id: String(booking.id),
    fullName: asString(booking.guest_full_name),
    email: asString(booking.guest_email),
    phone: asString(booking.guest_phone),
    spaceType: apiKind
      ? mapBookingKindToReservationChoice(apiKind)
      : toReservationSpaceType(asString(linkedSpace?.type)),
    dateISO: formatDateOnly(startAt),
    time: buildTimeDisplay(startAt, endAt),
    timeStart: timeStart || undefined,
    timeEnd: timeEnd || undefined,
    message: asString(booking.note) || undefined,
    createdAtISO: asString(booking.created_at || booking.createdAt, new Date().toISOString()),
    status: mapBookingStatus(asString(booking.status, 'pending')),
    spaceId: spaceId || undefined,
    spaceName: asString(booking.space_name) || linkedSpace?.name,
  }
}

type EventPayloadInput = {
  title: string
  category: string
  starts_at: string
  ends_at?: string
  time_display: string
  location_name: string
  address?: string
  price_label: string
  image_url?: string
  description: string
  speakers?: unknown[]
  is_published?: boolean
  registration_link?: string | null
}

function deriveEndIso(startsAt: string, timeDisplay?: string): string {
  const start = new Date(startsAt)
  if (Number.isNaN(start.getTime())) return startsAt
  const raw = (timeDisplay ?? '').trim()
  const match = raw.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/)
  if (match) {
    const [hours, minutes] = match[2].split(':').map(Number)
    const end = new Date(start)
    end.setHours(hours, minutes, 0, 0)
    if (end <= start) end.setDate(end.getDate() + 1)
    return end.toISOString()
  }
  return new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString()
}

export function buildEventActivityPayload(body: EventPayloadInput, current?: ApiActivity): Dict {
  const registrationLink = (body.registration_link ?? '').trim()
  const endsAt = body.ends_at ?? current?.ends_at ?? deriveEndIso(body.starts_at, body.time_display)
  return {
    kind: 'event',
    title: body.title,
    slug: current?.slug || slugifyValue(body.title),
    description: body.description,
    starts_at: body.starts_at,
    ends_at: endsAt,
    max_participants: null,
    published: body.is_published ?? true,
    registration_link: registrationLink || null,
    extra: {
      category: body.category,
      time_display: body.time_display,
      location_name: body.location_name,
      address: body.address ?? '',
      price_label: body.price_label,
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
  image_url?: string
  summary: string
  description: string
  objectives?: unknown[]
  audience?: string[]
  starts_at?: string
  ends_at?: string
  is_published?: boolean
}

export function buildProgramActivityPayload(body: ProgramPayloadInput, current?: ApiActivity): Dict {
  const startsAt = body.starts_at || current?.starts_at || new Date().toISOString()
  const endsAt = body.ends_at || current?.ends_at || deriveEndIso(startsAt, body.duration_label)
  return {
    kind: 'training',
    title: body.title,
    slug: current?.slug || slugifyValue(body.title),
    description: body.description,
    starts_at: startsAt,
    ends_at: endsAt,
    max_participants: null,
    published: body.is_published ?? current?.is_published ?? current?.published ?? true,
    registration_link: current?.registration_link ?? null,
    extra: {
      category: body.category,
      date_range_label: body.date_range_label,
      location_label: body.location_label,
      duration_label: body.duration_label,
      level_label: body.level_label,
      price_label: body.price_label,
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
  image_url?: string
  description: string
  equipment?: unknown[]
  is_active?: boolean
}

function buildUniqueSpaceSlug(name: string): string {
  const base = slugifyValue(name) || `space-${Date.now()}`
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base}-${suffix}`.slice(0, 280)
}

export type BuildSpacePayloadOptions = {
  /** Slug existant (PATCH) — ne pas le recalculer depuis le nom. */
  slug?: string
  /** POST : suffixe aléatoire pour éviter 400 « slug déjà utilisé ». */
  uniqueSlug?: boolean
  /** Extra existant (PATCH) — à préserver (ex: gallery_paths). */
  extra?: Record<string, unknown>
}

export function buildSpacePayload(body: SpacePayloadInput, options?: BuildSpacePayloadOptions): Dict {
  const kind = mapAdminSpaceTypeToKind(body.type)
  let slug = options?.slug?.trim() || slugifyValue(body.name)
  if (!slug) slug = `space-${Date.now()}`
  if (options?.uniqueSlug && !options.slug) slug = buildUniqueSpaceSlug(body.name)

  const capacity = numberFromCapacityLabel(body.capacity_label)
  const prevExtra = options?.extra ?? {}
  const payload: Dict = {
    kind,
    name: body.name.trim(),
    slug,
    description: body.description ?? '',
    is_active: body.is_active ?? true,
    extra: {
      // Préserver la galerie (sinon elle disparaît après un PATCH).
      gallery_paths: prevExtra.gallery_paths,
      gallery_urls: prevExtra.gallery_urls,
      gallery: prevExtra.gallery,
      display_type: body.type,
      capacity_label: body.capacity_label,
      price_label: body.price_label || 'Sur demande',
      price_unit_label: body.price_unit_label || 'Wi-Fi et climatisation inclus',
      pricing_tiers: [],
      availability: body.availability ?? 'available',
      availability_label: body.availability_label ?? '',
      equipment: body.equipment ?? [],
    },
  }
  if (capacity != null && capacity > 0) payload.capacity = capacity
  return payload
}
