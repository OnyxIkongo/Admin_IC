import { useLayoutEffect, useRef, useState } from 'react'
import { eventsService, type EventWriteBody } from '@/services/eventsService'
import { programsService } from '@/services/programsService'
import { spacesService, type SpaceWriteBody } from '@/services/spacesService'
import type { Event, Program, Space } from '@/types/domain'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/utils/cn'
import { mediaService } from '@/services/mediaService'
import { formatDateRangeFr } from '@/utils/formatDateRangeFr'
import { dayjs } from '@/utils/dayjsFr'
import {
  intakeFormSpacing,
  intakeInput,
  intakeLabel,
  intakeSelect,
  intakeSubmit,
  intakeTextarea,
} from '@webPublic/utils/intakeFormStyles'
import { ActivityBasicForm } from '@/components/admin/ActivityBasicForm'
import { apiErrorMessage } from '@/utils/apiErrorMessage'

// Types autorisés (on retire les autres options)
const SPACE_TYPES = ['Private Office', 'Coworking', 'Meeting Room', 'Event Space'] as const
function spaceTypeLabelFr(type: (typeof SPACE_TYPES)[number] | string): string {
  if (type === 'Private Office') return 'Bureau privé'
  if (type === 'Coworking') return 'Espace coworking'
  if (type === 'Meeting Room') return 'Salle de réunion'
  if (type === 'Event Space') return 'Grande salle'
  return type
}

const DEFAULT_AVAILABILITY = 'available' as const

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatTimeRangeFr(startsISO?: string, endsISO?: string): string {
  if (!startsISO || !endsISO) return ''
  const start = dayjs(startsISO)
  const end = dayjs(endsISO)
  if (!start.isValid() || !end.isValid()) return ''
  return `${start.format('HH:mm')} - ${end.format('HH:mm')}`
}

type ShellProps = {
  open: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
  footer: React.ReactNode
}

function DialogShell({ open, title, children, onClose, footer }: ShellProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-outline-variant/15 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high shrink-0"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0">{children}</div>
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-t border-outline-variant/15 bg-surface-container-low shrink-0">
          {footer}
        </div>
      </div>
    </div>
  )
}

type ActivityKind = 'event' | 'training'

type ActivityDialogProps<TInitial> = {
  open: boolean
  onClose: () => void
  initial: TInitial | null
  onSaved: () => void
}

type ActivityFormConfig<TInitial> = {
  kind: ActivityKind
  eyebrow: string
  category: string
  titleWhenCreate: string
  titleWhenEdit: string
  getInitialValues: (initial: TInitial) => {
    title: string
    startsISO?: string
    endsISO?: string
    placeName: string
    imageUrl: string
    description: string
    registrationLink?: string
  }
  includesRegistrationLink?: boolean
  submit: (args: {
    initial: TInitial | null
    title: string
    startsLocal: string
    endsLocal: string
    placeName: string
    city: string
    commune: string
    avenue: string
    description: string
    registrationLink: string
    imageFile: File | null
  }) => Promise<void>
}

function defaultStartEndLocal() {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  const end = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  return { startsLocal: toDatetimeLocalValue(now.toISOString()), endsLocal: toDatetimeLocalValue(end.toISOString()) }
}

function ActivityFormDialog<TInitial>({ open, onClose, initial, onSaved, config }: ActivityDialogProps<TInitial> & { config: ActivityFormConfig<TInitial> }) {
  const [title, setTitle] = useState('')
  const [startsLocal, setStartsLocal] = useState('')
  const [endsLocal, setEndsLocal] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [city, setCity] = useState('')
  const [commune, setCommune] = useState('')
  const [avenue, setAvenue] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [registrationLink, setRegistrationLink] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)
    if (initial) {
      const v = config.getInitialValues(initial)
      setTitle(v.title)
      setStartsLocal(toDatetimeLocalValue(v.startsISO))
      setEndsLocal(toDatetimeLocalValue(v.endsISO))
      setPlaceName(v.placeName || '')
      setCity('')
      setCommune('')
      setAvenue('')
      setImageUrl(v.imageUrl)
      setImageFile(null)
      setDescription(v.description)
      setRegistrationLink(v.registrationLink ?? '')
    } else {
      setTitle('')
      const { startsLocal: defaultStarts, endsLocal: defaultEnds } = defaultStartEndLocal()
      setStartsLocal(defaultStarts)
      setEndsLocal(defaultEnds)
      setPlaceName('')
      setCity('')
      setCommune('')
      setAvenue('')
      setImageUrl('')
      setImageFile(null)
      setDescription('')
      setRegistrationLink('')
    }
  }, [open, initial, config])

  const pickImage = () => {
    fileInputRef.current?.click()
  }

  const uploadImage = async (file: File) => {
    setError(null)
    setUploadingImage(true)
    try {
      setImageFile(file)
      setImageUrl(mediaService.previewUrl(file))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload impossible.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const submit = async () => {
    setError(null)
    if (!title.trim()) {
      setError('Titre requis.')
      return
    }
    setSaving(true)
    try {
      await config.submit({
        initial,
        title,
        startsLocal,
        endsLocal,
        placeName,
        city,
        commune,
        avenue,
        description,
        registrationLink,
        imageFile,
      })
      onSaved()
      onClose()
    } catch (e: unknown) {
      setError(apiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogShell
      open={open}
      title={initial ? config.titleWhenEdit : config.titleWhenCreate}
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button type="button" className={cn(intakeInput, 'sm:w-auto text-center')} onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            disabled={saving}
            className={cn(intakeSubmit, 'sm:w-auto sm:min-w-40')}
            onClick={() => void submit()}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-5">
        <div className="grid gap-6 lg:grid-cols-[1fr,420px]">
          <div className={cn(intakeFormSpacing, 'max-w-2xl')}>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <ActivityBasicForm
              eyebrow={config.eyebrow}
              title={title}
              onTitleChange={setTitle}
              startsLocal={startsLocal}
              onStartsLocalChange={setStartsLocal}
              endsLocal={endsLocal}
              onEndsLocalChange={setEndsLocal}
              city={city}
              onCityChange={setCity}
              commune={commune}
              onCommuneChange={setCommune}
              placeName={placeName}
              onPlaceNameChange={setPlaceName}
              avenue={avenue}
              onAvenueChange={setAvenue}
              imageUrl={imageUrl}
              uploadingImage={uploadingImage}
              fileInputRef={fileInputRef}
              onPickImage={pickImage}
              onFileSelected={(f) => void uploadImage(f)}
              description={description}
              onDescriptionChange={setDescription}
              registrationLink={config.includesRegistrationLink ? registrationLink : undefined}
              onRegistrationLinkChange={
                config.includesRegistrationLink ? setRegistrationLink : undefined
              }
            />
          </div>

          {/* Aperçu supprimé : formulaire uniquement */}
        </div>
      </div>
    </DialogShell>
  )
}

const eventDialogConfig: ActivityFormConfig<Event> = {
  kind: 'event',
  eyebrow: 'Événement',
  category: 'Innovation',
  includesRegistrationLink: true,
  titleWhenCreate: 'Nouvel événement',
  titleWhenEdit: 'Modifier l’événement',
  getInitialValues: (initial) => ({
    title: initial.title,
    startsISO: initial.starts_at,
    endsISO: initial.ends_at,
    placeName: initial.locationName || '',
    imageUrl: initial.imageUrl,
    description: initial.description,
    registrationLink: initial.registrationLink ?? initial.registration_link ?? '',
  }),
  submit: async ({
    initial,
    title,
    startsLocal,
    endsLocal,
    placeName,
    city,
    commune,
    avenue,
    description,
    registrationLink,
    imageFile,
  }) => {
    if (!startsLocal) throw new Error('Indiquez la date et l’heure de début.')
    if (!endsLocal) throw new Error('Indiquez la date et l’heure de fin.')
    const startsISO = new Date(startsLocal).toISOString()
    const endsISO = new Date(endsLocal).toISOString()
    const timeDisplay = formatTimeRangeFr(startsISO, endsISO)
    const locationName = placeName.trim()
    const address = [city.trim(), commune.trim(), avenue.trim()].filter(Boolean).join(', ')
    const body: EventWriteBody = {
      title: title.trim(),
      category: 'Innovation',
      starts_at: startsISO,
      ends_at: endsISO,
      time_display: timeDisplay.trim(),
      location_name: locationName.trim(),
      address: address.trim(),
      price_label: 'Gratuit',
      image_url: '',
      description: description.trim(),
      speakers: [],
      is_published: true,
      registration_link: registrationLink.trim() || null,
    }
    const saved = initial ? await eventsService.update((initial as Event).id, body) : await eventsService.create(body)
    if (imageFile) await eventsService.uploadImage(saved.id, imageFile)
  },
}

const programDialogConfig: ActivityFormConfig<Program> = {
  kind: 'training',
  eyebrow: 'Formation',
  category: 'Formation',
  titleWhenCreate: 'Nouvelle formation',
  titleWhenEdit: 'Modifier la formation',
  getInitialValues: (initial) => ({
    title: initial.title,
    startsISO: initial.starts_at,
    endsISO: initial.ends_at,
    placeName: initial.locationLabel || '',
    imageUrl: initial.imageUrl,
    description: initial.description,
  }),
  submit: async ({ initial, title, startsLocal, endsLocal, placeName, city, commune, avenue, description, imageFile }) => {
    if (!startsLocal) throw new Error('Indiquez la date et l’heure de début.')
    if (!endsLocal) throw new Error('Indiquez la date et l’heure de fin.')
    const startsISO = new Date(startsLocal).toISOString()
    const endsISO = new Date(endsLocal).toISOString()
    const computedDateLabel = formatDateRangeFr(startsISO, endsISO)
    const computedTimeLabel = formatTimeRangeFr(startsISO, endsISO)
    const details = [city.trim(), commune.trim(), avenue.trim()].filter(Boolean).join(', ')
    const locationLabel = [placeName.trim(), details].filter(Boolean).join(details ? ' — ' : '')
    const core = {
      title: title.trim(),
      category: 'Formation',
      date_range_label: computedDateLabel !== '—' ? computedDateLabel : '',
      location_label: locationLabel,
      duration_label: computedTimeLabel,
      image_url: '',
      summary: description.trim(),
      description: description.trim(),
      objectives: [],
      audience: [],
      is_published: true,
      level_label: '',
      price_label: '',
      starts_at: startsISO,
      ends_at: endsISO,
    }
    const saved = initial ? await programsService.update((initial as Program).id, core) : await programsService.create(core)
    if (imageFile) await programsService.uploadImage(saved.id, imageFile)
  },
}

export function EventFormDialog(props: ActivityDialogProps<Event>) {
  return <ActivityFormDialog {...props} config={eventDialogConfig} />
}

export function ProgramFormDialog(props: ActivityDialogProps<Program>) {
  return <ActivityFormDialog {...props} config={programDialogConfig} />
}

export function SpaceFormDialog({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  initial: Space | null
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<string>('Meeting Room')
  const [availability, setAvailability] = useState<string>(DEFAULT_AVAILABILITY)
  const [priceBasic, setPriceBasic] = useState('')
  const [pricePremium, setPricePremium] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)
    if (initial) {
      setName(initial.name)
      setType(initial.type)
      setAvailability(initial.availability)
      const tiers = initial.pricingTiers ?? []
      const basic = tiers.find((t) => t.id === 'ac_only') ?? tiers.find((t) => t.id === 'basic') ?? tiers[0]
      const premium = tiers.find((t) => t.id === 'wifi_ac') ?? tiers.find((t) => t.id === 'premium') ?? tiers[1]
      setPriceBasic(basic?.priceLabel ?? '')
      setPricePremium(premium?.priceLabel ?? '')
      setImageUrl(initial.imageUrl)
      setImageFile(null)
      setDescription(initial.description)
    } else {
      setName('')
      setType('Meeting Room')
      setAvailability(DEFAULT_AVAILABILITY)
      setPriceBasic('')
      setPricePremium('')
      setImageUrl('')
      setImageFile(null)
      setDescription('')
    }
  }, [open, initial])

  const pickImage = () => {
    fileInputRef.current?.click()
  }

  const selectImage = async (file: File) => {
    setError(null)
    setUploadingImage(true)
    try {
      setImageFile(file)
      setImageUrl(mediaService.previewUrl(file))
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const submit = async () => {
    setError(null)
    const body: SpaceWriteBody = {
      name: name.trim(),
      type,
      capacity_label: '',
      price_label: '',
      price_unit_label: '',
      pricing_tiers: [
        ...(priceBasic.trim()
          ? [
              {
                id: 'ac_only',
                label: 'Sans Wi‑Fi (avec climatisation)',
                priceLabel: priceBasic.trim(),
                includesWifi: false,
                includesAc: true,
              },
            ]
          : []),
        ...(pricePremium.trim()
          ? [
              {
                id: 'wifi_ac',
                label: 'Avec Wi‑Fi & climatisation',
                priceLabel: pricePremium.trim(),
                includesWifi: true,
                includesAc: true,
              },
            ]
          : []),
      ],
      availability,
      availability_label: '',
      image_url: '',
      description: description.trim(),
      equipment: [],
      is_active: (initial?.is_active ?? initial?.isActive) !== false,
    }
    if (!body.name) {
      setError('Nom requis.')
      return
    }
    setSaving(true)
    try {
      const saved = initial ? await spacesService.update(initial.id, body) : await spacesService.create(body)
      if (imageFile) {
        await spacesService.uploadImage(saved.id, imageFile)
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(apiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogShell
      open={open}
      title={initial ? 'Modifier l’espace' : 'Nouvel espace'}
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button type="button" className={cn(intakeInput, 'sm:w-auto text-center')} onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            disabled={saving}
            className={cn(intakeSubmit, 'sm:w-auto sm:min-w-40')}
            onClick={() => void submit()}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-5">
        <div className={intakeFormSpacing}>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className={intakeLabel}>Nom</label>
            <input className={intakeInput} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className={intakeLabel}>Type d&apos;espace</label>
            <select className={intakeSelect} value={type} onChange={(e) => setType(e.target.value)}>
              {SPACE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {spaceTypeLabelFr(t)}
                </option>
              ))}
            </select>
          </div>
          {/* Champ "État" supprimé */}
          <div>
            <label className={intakeLabel}>Tarif (sans Wi‑Fi & climatisation)</label>
            <input className={intakeInput} value={priceBasic} onChange={(e) => setPriceBasic(e.target.value)} placeholder="Ex. 10$ / heure" />
          </div>
          <div>
            <label className={intakeLabel}>Tarif (avec Wi‑Fi & climatisation)</label>
            <input className={intakeInput} value={pricePremium} onChange={(e) => setPricePremium(e.target.value)} placeholder="Ex. 15$ / heure" />
          </div>
          <div>
            <label className={intakeLabel}>Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void selectImage(f)
              }}
            />
            <button
              type="button"
              onClick={pickImage}
              disabled={uploadingImage}
              className={cn(
                intakeInput,
                'text-left font-semibold flex items-center justify-between gap-2 disabled:opacity-70',
              )}
            >
              <span className="truncate">
                {uploadingImage ? 'Upload…' : imageUrl ? 'Changer l’image' : 'Choisir une image'}
              </span>
              <Icon name="image" />
            </button>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="mt-3 h-44 w-full object-cover rounded-xl border border-outline-variant/15 bg-surface-container-high"
              />
            ) : null}
          </div>
          <div>
            <label className={intakeLabel}>Description</label>
            <textarea className={intakeTextarea} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
      </div>
    </DialogShell>
  )
}
