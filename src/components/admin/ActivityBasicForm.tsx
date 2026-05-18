import type React from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/utils/cn'
import { intakeEyebrow, intakeGrid2, intakeInput, intakeLabel, intakeTextarea } from '@webPublic/utils/intakeFormStyles'

type Props = {
  eyebrow: string
  title: string
  onTitleChange: (value: string) => void

  startsLocal: string
  onStartsLocalChange: (value: string) => void

  endsLocal: string
  onEndsLocalChange: (value: string) => void

  city: string
  onCityChange: (value: string) => void

  commune: string
  onCommuneChange: (value: string) => void

  placeName: string
  onPlaceNameChange: (value: string) => void

  avenue: string
  onAvenueChange: (value: string) => void

  imageUrl: string
  uploadingImage: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onPickImage: () => void
  onFileSelected: (file: File) => void

  description: string
  onDescriptionChange: (value: string) => void

  /** Affiché uniquement pour les événements (lien Google Form / formulaire externe). */
  registrationLink?: string
  onRegistrationLinkChange?: (value: string) => void
}

export function ActivityBasicForm({
  eyebrow,
  title,
  onTitleChange,
  startsLocal,
  onStartsLocalChange,
  endsLocal,
  onEndsLocalChange,
  city,
  onCityChange,
  commune,
  onCommuneChange,
  placeName,
  onPlaceNameChange,
  avenue,
  onAvenueChange,
  imageUrl,
  uploadingImage,
  fileInputRef,
  onPickImage,
  onFileSelected,
  description,
  onDescriptionChange,
  registrationLink,
  onRegistrationLinkChange,
}: Props) {
  return (
    <>
      <div>
        <span className={intakeEyebrow}>{eyebrow}</span>
      </div>

      <div>
        <label className={intakeLabel}>Titre</label>
        <input className={intakeInput} value={title} onChange={(e) => onTitleChange(e.target.value)} />
      </div>

      <div className={intakeGrid2}>
        <div>
          <label className={intakeLabel}>Début</label>
          <input
            type="datetime-local"
            className={intakeInput}
            value={startsLocal}
            onChange={(e) => onStartsLocalChange(e.target.value)}
          />
        </div>
        <div>
          <label className={intakeLabel}>Fin</label>
          <input
            type="datetime-local"
            className={intakeInput}
            value={endsLocal}
            onChange={(e) => onEndsLocalChange(e.target.value)}
          />
        </div>
      </div>

      <div className={intakeGrid2}>
        <div>
          <label className={intakeLabel}>Ville</label>
          <input className={intakeInput} value={city} onChange={(e) => onCityChange(e.target.value)} />
        </div>
        <div>
          <label className={intakeLabel}>Commune</label>
          <input className={intakeInput} value={commune} onChange={(e) => onCommuneChange(e.target.value)} />
        </div>
      </div>

      <div>
        <label className={intakeLabel}>Nom du lieu</label>
        <input
          className={intakeInput}
          value={placeName}
          onChange={(e) => onPlaceNameChange(e.target.value)}
          placeholder="Ex. Ingenious City, Salle A…"
        />
      </div>

      <div className={intakeGrid2}>
        <div>
          <label className={intakeLabel}>Avenue et numéro</label>
          <input
            className={intakeInput}
            value={avenue}
            onChange={(e) => onAvenueChange(e.target.value)}
            placeholder="Ex. OUA, n°45"
          />
        </div>
      </div>

      <div>
        <label className={intakeLabel}>Image principale</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFileSelected(f)
          }}
        />
        <button
          type="button"
          onClick={onPickImage}
          disabled={uploadingImage}
          className={cn(intakeInput, 'text-left font-semibold flex items-center justify-between gap-2 disabled:opacity-70')}
        >
          <span className="truncate">{uploadingImage ? 'Upload…' : imageUrl ? 'Changer l’image' : 'Choisir une image'}</span>
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

      {onRegistrationLinkChange ? (
        <div>
          <label className={intakeLabel}>Lien du formulaire d&apos;inscription</label>
          <input
            type="url"
            className={intakeInput}
            value={registrationLink ?? ''}
            onChange={(e) => onRegistrationLinkChange(e.target.value)}
            placeholder="https://forms.gle/..."
          />
        </div>
      ) : null}

      <div>
        <label className={intakeLabel}>Description courte</label>
        <textarea
          className={intakeTextarea}
          rows={3}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>
    </>
  )
}

