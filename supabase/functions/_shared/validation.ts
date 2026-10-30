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

export function cleanPhone(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return ""

  let p = String(value).trim().replace(/[\s().-]/g, "")

  if (p.startsWith("00")) p = "+" + p.slice(2)
  if (p.startsWith("+242")) p = p.slice(4)
  else if (p.length === 12 && p.startsWith("242")) p = p.slice(3)

  // Numéro congolais : 9 chiffres commençant par 0
  return /^0\d{8}$/.test(p) ? `+242${p}` : ""
}

export function cleanName(value: unknown, fallback = "Client TakiDoc"): string {
  if (typeof value !== 'string') return fallback
  const name = value.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 80)
  return name || fallback
}

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