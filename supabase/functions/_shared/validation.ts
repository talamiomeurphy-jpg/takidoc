/* ============================================================
TAKIDOC — VALIDATION DES ENTRÉES
============================================================ */

export const TEMPLATE_ID_RE = /^[A-Za-z0-9_-]{2,128}$/

const EMAIL_RE = /^[^\s@,;()<>"']+@[^\s@,;()<>"']+\.[^\s@,;()<>"']{2,}$/

export function cleanEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const email = value.trim().toLowerCase()
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null
}

/* Normalise un numéro de téléphone.
   - « +242 06 518 69 67 » ou « 00242… » : conservé en format international
   - « 06 518 69 67 » (9 chiffres commençant par 0, numéro congolais) :
     préfixé par +242, le 0 est conservé (format congolais) */
export function cleanPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null

  let phone = value.replace(/[\s().-]/g, '')

  if (phone.startsWith('00')) phone = '+' + phone.slice(2)
  if (!phone.startsWith('+') && /^0\d{8}$/.test(phone)) phone = '+242' + phone

  return /^\+?\d{8,15}$/.test(phone) ? phone : null
}

export function cleanName(value: unknown, fallback = 'Client TakiDoc'): string {
  if (typeof value !== 'string') return fallback

  const name = value.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 80)
  return name || fallback
}

/* Données du document conservées avec l'achat (champs, couleur, police).
   Objet simple, taille bornée, jamais de photo (trop lourde, inutile). */
export function sanitizeDocumentData(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}

  try {
    const clone = JSON.parse(JSON.stringify(input)) as Record<string, unknown>

    delete clone.photoDataUrl
    delete clone.photo_data_url

    return JSON.stringify(clone).length <= 200_000 ? clone : {}
  } catch {
    return {}
  }
}
