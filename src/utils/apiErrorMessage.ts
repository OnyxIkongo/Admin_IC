import axios from 'axios'

const FIELD_LABELS: Record<string, string> = {
  kind: 'Type (kind)',
  name: 'Nom',
  slug: 'Identifiant (slug)',
  capacity: 'Capacité',
  description: 'Description',
  is_active: 'Actif',
  extra: 'Métadonnées',
}

function parseDrfData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>
  const detail = record.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const first = detail.find((v) => typeof v === 'string' && v.trim())
    if (typeof first === 'string') return first
  }
  const parts: string[] = []
  for (const [key, value] of Object.entries(record)) {
    if (key === 'detail') continue
    const label = FIELD_LABELS[key] ?? key
    if (typeof value === 'string' && value.trim()) {
      parts.push(`${label} : ${value}`)
    } else if (Array.isArray(value)) {
      const first = value.find((v) => typeof v === 'string' && v.trim())
      if (typeof first === 'string') parts.push(`${label} : ${first}`)
    }
  }
  if (parts.length) return parts.join(' · ')
  return null
}

/** Message lisible pour l’UI admin (502, timeout, réseau, validation DRF, etc.). */
export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const parsed = parseDrfData(err.response?.data)
    if (parsed) return parsed

    if (status === 502 || status === 503) {
      return 'Le serveur API ne répond pas (502/503). Vérifiez que ingenious-city-api est démarré sur Render.'
    }
    if (status === 401 || status === 403) {
      return 'Session expirée ou accès refusé. Reconnectez-vous.'
    }
    if (status === 400) {
      return 'Données refusées par l’API (400). Vérifiez les champs du formulaire.'
    }
    if (err.code === 'ECONNABORTED') {
      return 'Délai d’attente dépassé : le serveur met trop longtemps à répondre.'
    }
    if (!err.response) {
      return 'Impossible de joindre l’API. Vérifiez VITE_API_BASE_URL et que l’API Render est en ligne.'
    }
    return err.message || `Erreur HTTP ${status ?? '?'}`
  }
  if (err instanceof Error) return err.message
  return 'Une erreur inattendue s’est produite.'
}
