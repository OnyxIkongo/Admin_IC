/** URL de l’app Vite `web-public` (site utilisateur). Port par défaut 5173 — voir `web-public/vite.config.ts`. */
export const PUBLIC_APP_BASE_URL =
  import.meta.env.VITE_PUBLIC_APP_URL?.trim() || 'http://localhost:5173'

export function publicEventUrl(eventId: string) {
  return `${PUBLIC_APP_BASE_URL}/events/${eventId}`
}

export function publicProgramUrl(programId: string) {
  return `${PUBLIC_APP_BASE_URL}/programs/${programId}`
}

export function publicSpaceUrl(spaceId: string) {
  return `${PUBLIC_APP_BASE_URL}/spaces/${spaceId}`
}
