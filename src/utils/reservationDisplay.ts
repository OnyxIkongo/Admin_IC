/** Libellé clair : bureau, salle, espace — pour les demandes de réservation côté admin. */
export function reservationVenueKindFr(spaceType: string): string {
  const t = spaceType.trim().toLowerCase()
  if (t.includes('bureau')) return 'Bureau'
  if (t.includes('réunion') || t.includes('reunion') || t.includes('salle')) return 'Salle'
  if (t.includes('co-working') || t.includes('coworking')) return 'Espace coworking'
  if (t.includes('événement') || t.includes('evenement')) return 'Espace événement'
  return 'Espace'
}
