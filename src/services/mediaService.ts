export const mediaService = {
  /**
   * Retourne une URL de preview locale (pas un upload serveur).
   * L'upload réel se fait via PATCH multipart sur l'API admin.
   */
  previewUrl(file: File): string {
    return URL.createObjectURL(file)
  },
}

