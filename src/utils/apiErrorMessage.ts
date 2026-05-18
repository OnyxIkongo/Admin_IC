import axios from 'axios'

/** Message lisible pour l’UI admin (502, timeout, réseau, etc.). */
export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const data = err.response?.data as { detail?: string } | undefined
    if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail

    if (status === 502 || status === 503) {
      return 'Le serveur API ne répond pas (erreur 502/503). Démarrez le backend Django sur le port 8000 (dossier backend : python manage.py runserver 8000), puis rechargez la page. Le proxy Vite redirige /api vers http://127.0.0.1:8000.'
    }
    if (status === 401 || status === 403) {
      return 'Session expirée ou accès refusé. Reconnectez-vous.'
    }
    if (err.code === 'ECONNABORTED') {
      return 'Délai d’attente dépassé : le serveur met trop longtemps à répondre.'
    }
    if (!err.response) {
      return 'Impossible de joindre l’API (réseau ou serveur arrêté). Vérifiez que Django tourne sur le port 8000.'
    }
    return err.message || `Erreur HTTP ${status ?? '?'}`
  }
  if (err instanceof Error) return err.message
  return 'Une erreur inattendue s’est produite.'
}
