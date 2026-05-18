import { dayjs } from '@/utils/dayjsFr'
import { eventCategoryLabelFr } from '@/utils/eventDisplay'
import { programCategoryLabel } from '@webPublic/utils/programDisplay'
import { spaceTypeLabelFr } from '@/utils/spaceDisplay'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/utils/cn'
import { intakeEyebrow, intakeFormCard } from '@webPublic/utils/intakeFormStyles'
import { formatDateRangeFr } from '@/utils/formatDateRangeFr'

type Speaker = { name: string; role: string; avatarUrl: string }
type Objective = { title: string; description: string; icon: string }
type Equip = { icon: string; label: string }

function parseSpeakers(raw: string): Speaker[] {
  try {
    const a = JSON.parse(raw || '[]') as unknown
    if (!Array.isArray(a)) return []
    return a.filter((x) => x && typeof x === 'object' && 'name' in x) as Speaker[]
  } catch {
    return []
  }
}

function parseObjectives(raw: string): Objective[] {
  try {
    const a = JSON.parse(raw || '[]') as unknown
    if (!Array.isArray(a)) return []
    return a.filter((x) => x && typeof x === 'object' && 'title' in x) as Objective[]
  } catch {
    return []
  }
}

function parseEquipment(raw: string): Equip[] {
  try {
    const a = JSON.parse(raw || '[]') as unknown
    if (!Array.isArray(a)) return []
    return a.filter((x) => x && typeof x === 'object' && 'label' in x) as Equip[]
  } catch {
    return []
  }
}

export function EventSitePreview({
  title,
  category,
  startsLocal,
  endsLocal,
  timeDisplay,
  locationName,
  address,
  priceLabel,
  imageUrl,
  description,
  speakersJson,
  isPublished,
}: {
  title: string
  category: string
  startsLocal: string
  endsLocal: string
  timeDisplay: string
  locationName: string
  address: string
  priceLabel: string
  imageUrl: string
  description: string
  speakersJson: string
  isPublished: boolean
}) {
  void description
  void isPublished
  const dateISO = startsLocal ? startsLocal.slice(0, 10) : ''
  const dateRangeLabel = formatDateRangeFr(
    startsLocal ? new Date(startsLocal).toISOString() : undefined,
    endsLocal ? new Date(endsLocal).toISOString() : undefined,
  )
  const speakers = parseSpeakers(speakersJson)
  const catLabel = eventCategoryLabelFr(category)

  return (
    <div className={cn(intakeFormCard, 'p-4 md:p-5')}>
      <div className="relative w-full h-36 rounded-lg overflow-hidden bg-surface-container-high">
        {imageUrl ? (
          <img alt="" className="w-full h-full object-cover" src={imageUrl} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs">Image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
      </div>
      <div className="mt-3 bg-surface-container-lowest rounded-xl p-4 shadow-card-float border border-outline-variant/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-primary-container/10 text-primary px-2 py-0.5 rounded-full font-label text-[9px] font-bold tracking-wider uppercase">
            {catLabel}
          </span>
          {dateISO ? (
            <span className="text-on-surface-variant font-label text-[9px] tracking-wider uppercase">
              {dayjs(dateISO).format('YYYY')}
            </span>
          ) : null}
        </div>
        <h3 className="font-headline text-lg font-bold text-on-surface leading-tight mb-3">{title || 'Titre'}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-label text-[9px] uppercase text-on-surface-variant">Date</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Icon name="calendar_today" className="text-primary text-base" />
              <span className="font-semibold">{dateISO ? dateRangeLabel : '—'}</span>
            </div>
          </div>
          <div>
            <span className="font-label text-[9px] uppercase text-on-surface-variant">Heure</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Icon name="schedule" className="text-primary text-base" />
              <span className="font-semibold">{timeDisplay || '—'}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <h4 className="font-headline text-sm font-semibold mb-2">Lieu de l&apos;événement</h4>
        <div className="bg-surface-container-low rounded-xl p-3 flex gap-3 items-center">
          <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
            <Icon name="location_on" />
          </div>
          <div>
            <p className="font-bold text-sm text-on-surface">{locationName || '—'}</p>
            <p className="text-xs text-on-surface-variant">{address || '—'}</p>
          </div>
        </div>
      </div>
      {speakers.length > 0 ? (
        <div className="mt-4">
          <h4 className="font-headline text-sm font-semibold mb-2">Intervenants</h4>
          <div className="flex flex-col gap-3">
            {speakers.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                {s.avatarUrl ? (
                  <img alt="" className="w-10 h-10 rounded-full object-cover" src={s.avatarUrl} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-surface-container-high" />
                )}
                <div>
                  <p className="font-bold text-sm">{s.name}</p>
                  <p className="text-xs text-primary">{s.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/15">
        <div>
          <span className="font-label text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">Prix</span>
          <p className="font-headline text-lg font-bold">{priceLabel || '—'}</p>
        </div>
        <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container-high px-3 py-2 rounded-lg">
          S&apos;inscrire
        </span>
      </div>
    </div>
  )
}

export function ProgramSitePreview({
  title,
  category,
  dateRangeLabel,
  startsAtISO,
  endsAtISO,
  locationLabel,
  durationLabel,
  imageUrl,
  summary,
  description,
  objectivesJson,
  audienceLines,
  isPublished,
}: {
  title: string
  category: string
  dateRangeLabel: string
  startsAtISO: string
  endsAtISO: string
  locationLabel: string
  durationLabel: string
  imageUrl: string
  summary: string
  description: string
  objectivesJson: string
  audienceLines: string
  isPublished: boolean
}) {
  void description
  const objectives = parseObjectives(objectivesJson)
  const audience = audienceLines
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const badge = programCategoryLabel(category)
  const computedRange = formatDateRangeFr(startsAtISO || undefined, endsAtISO || undefined)
  const dateLabel = (computedRange !== '—' ? computedRange : dateRangeLabel).trim()

  return (
    <div className={cn(intakeFormCard, 'p-4 md:p-5')}>
      {!isPublished ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          Non publié — restera invisible sur le site.
        </p>
      ) : null}
      <div className="rounded-xl overflow-hidden mb-3 aspect-[16/10] bg-surface-container-high">
        {imageUrl ? <img className="w-full h-full object-cover" alt="" src={imageUrl} /> : null}
      </div>
      <div className="space-y-1">
        {badge ? (
          <span className="font-label text-[9px] font-medium tracking-wider uppercase text-primary">{badge}</span>
        ) : null}
        <h3 className="font-headline text-lg font-bold text-on-surface">{title || 'Titre'}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-on-surface-variant text-[11px]">
          {durationLabel ? (
            <span className="flex items-center gap-1">
              <Icon name="schedule" className="text-sm" />
              {durationLabel}
            </span>
          ) : null}
          {locationLabel ? (
            <span className="flex items-center gap-1">
              <Icon name="location_on" className="text-sm" />
              {locationLabel}
            </span>
          ) : null}
        </div>
        {dateLabel ? (
          <p className="text-[10px] text-on-surface-variant flex items-center gap-1 pt-1">
            <Icon name="calendar_today" className="text-sm" />
            {dateLabel}
          </p>
        ) : null}
        {summary ? <p className="text-xs text-on-surface-variant line-clamp-2 pt-2">{summary}</p> : null}
      </div>
      {objectives.length > 0 ? (
        <div className="mt-4 space-y-2">
          <h4 className="font-headline text-sm font-semibold">Objectifs d&apos;apprentissage</h4>
          <div className="grid grid-cols-1 gap-2">
            {objectives.slice(0, 3).map((o) => (
              <div key={o.title} className="bg-surface-container-highest p-3 rounded-lg space-y-1">
                <Icon name={o.icon || 'check_circle'} className="text-primary text-lg" filled />
                <h5 className="font-headline font-semibold text-xs">{o.title}</h5>
                <p className="text-[10px] text-on-surface-variant line-clamp-2">{o.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {audience.length > 0 ? (
        <div className="mt-4">
          <h4 className="font-headline text-sm font-semibold mb-2">Public cible</h4>
          <div className="space-y-2">
            {audience.slice(0, 4).map((a) => (
              <div key={a} className="flex gap-2 items-start text-xs text-on-surface-variant">
                <span className="mt-1 w-1 h-1 rounded-full bg-primary shrink-0" />
                {a}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-4 pt-3 border-t border-outline-variant/15 flex justify-end">
        <span className="text-[11px] font-semibold text-on-primary bg-gradient-to-br from-primary to-primary-container px-4 py-2.5 rounded-lg">
          S&apos;inscrire
        </span>
      </div>
    </div>
  )
}

export function SpaceSitePreview({
  name,
  type,
  capacityLabel,
  priceLabel,
  priceUnitLabel,
  availability,
  availabilityLabel,
  imageUrl,
  description,
  equipmentJson,
  isActive,
}: {
  name: string
  type: string
  capacityLabel: string
  priceLabel: string
  priceUnitLabel: string
  availability: string
  availabilityLabel: string
  imageUrl: string
  description: string
  equipmentJson: string
  isActive: boolean
}) {
  const equipment = parseEquipment(equipmentJson)

  return (
    <div className={cn(intakeFormCard, 'p-4 md:p-5')}>
      <span className={intakeEyebrow}>Aperçu — fiche espace (web-public)</span>
      {!isActive ? (
        <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          Inactif : masqué des listes publiques (/spaces).
        </p>
      ) : (
        <p className="text-xs text-primary font-medium mb-3">Actif — visible sur le site</p>
      )}
      <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-surface-container-high relative">
        {imageUrl ? <img className="w-full h-full object-cover" alt="" src={imageUrl} /> : null}
        <div className="absolute top-2 right-2 bg-surface-container-lowest/90 backdrop-blur-sm px-2 py-1 rounded-full text-[9px] font-label font-medium tracking-wider uppercase text-primary flex items-center gap-1">
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              availability === 'available' ? 'bg-primary' : availability === 'limited' ? 'bg-orange-400' : 'bg-outline',
            )}
          />
          {availability === 'available' ? 'Disponible' : availabilityLabel || '—'}
        </div>
      </div>
      <div className="mt-3">
        <div className="font-label text-[10px] text-on-surface-variant tracking-widest uppercase">{name || 'Nom'}</div>
        <h3 className="font-headline text-xl font-bold text-on-surface">
          {spaceTypeLabelFr(type as Parameters<typeof spaceTypeLabelFr>[0])}
        </h3>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="border-l border-outline-variant/20 pl-3">
          <span className="font-headline text-xl font-bold text-primary">{capacityLabel || '—'}</span>
          <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant block">Capacité</span>
        </div>
        <div className="border-l border-outline-variant/20 pl-3">
          <span className="font-headline text-xl font-bold text-primary">{priceLabel || '—'}</span>
          <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant block">
            {priceUnitLabel || '—'}
          </span>
        </div>
      </div>
      <div className="mt-3 bg-surface-container-low rounded-xl p-3">
        <h4 className="font-headline text-sm font-semibold mb-1">Description</h4>
        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-4">{description || '…'}</p>
      </div>
      {equipment.length > 0 ? (
        <div className="mt-3">
          <h4 className="font-headline text-sm font-semibold mb-2">Équipements</h4>
          <div className="flex flex-col gap-2">
            {equipment.slice(0, 4).map((e) => (
              <div key={e.label} className="flex items-center gap-3 p-2 bg-surface-container-lowest rounded-lg text-xs">
                <Icon name={e.icon || 'check'} className="text-primary" />
                <span>{e.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-outline-variant/15">
        <div>
          <span className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">À partir de</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-headline font-bold">{priceLabel || '—'}</span>
            <span className="text-[10px] text-on-surface-variant">/ {priceUnitLabel || '—'}</span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-on-primary bg-gradient-to-br from-primary to-primary-container px-3 py-2 rounded-lg">
          Réserver
        </span>
      </div>
    </div>
  )
}
