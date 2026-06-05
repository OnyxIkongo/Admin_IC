export type SpaceEquipmentItem = { icon: string; label: string }

export const DEFAULT_SPACE_EQUIPMENT: SpaceEquipmentItem[] = [
  { icon: 'wifi', label: 'Wi‑Fi haut débit' },
  { icon: 'ac_unit', label: 'Climatisation' },
  { icon: 'tv', label: 'Écran' },
  { icon: 'speaker', label: 'Barre de son' },
  { icon: 'weekend', label: 'Mobilier' },
  { icon: 'videocam', label: 'Webcam' },
  { icon: 'fire_extinguisher', label: 'Extincteur' },
  { icon: 'electrical_services', label: 'Électricité' },
]

const ICON_ALIASES: Record<string, string> = {
  screen: 'tv',
  ecran: 'tv',
  monitor: 'tv',
  sound: 'speaker',
  soundbar: 'speaker',
  furniture: 'weekend',
  mobilier: 'weekend',
  camera: 'videocam',
  webcam: 'videocam',
  extinguisher: 'fire_extinguisher',
  extincteur: 'fire_extinguisher',
  electric: 'electrical_services',
  electricity: 'electrical_services',
  power: 'electrical_services',
}

export function normalizeEquipmentIcon(icon: string): string {
  const raw = (icon || '').trim().toLowerCase()
  if (!raw) return 'check_circle'
  return ICON_ALIASES[raw] ?? raw
}
