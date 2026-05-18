import type { EventCategory } from '@/types/domain'

const LABELS: Record<EventCategory, string> = {
  Tech: 'Tech',
  Social: 'Réseau',
  Business: 'Commerce',
  Design: 'Design',
  Innovation: 'Innovation',
}

/** Libellé FR pour l’affichage ; accepte toute chaîne renvoyée par l’API. */
export function eventCategoryLabelFr(category: string): string {
  return LABELS[category as EventCategory] ?? category
}
