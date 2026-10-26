// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — CLIENT NOTCH PAY

Secrets Supabase utilisés :
  NOTCHPAY_PUBLIC_KEY   clé publique (pk_test… / pk_live…) : initialiser et vérifier un paiement
  NOTCHPAY_HASH_KEY     clé de hachage (hsk_…) : signature des webhooks
  NOTCHPAY_API_URL      (optionnel) par défaut https://api.notchpay.co
  NOTCHPAY_DEBUG        (optionnel) « true » : journalise le contenu complet des webhooks
  NOTCHPAY_ENFORCE_SIGNATURE  voir handle-notchpay-webhook

La clé privée (sk_…) n'est PAS utilisée ici : elle ne sert qu'aux
transferts sortants. Elle reste inutilisée, dans les secrets.
============================================================ */

const API_URL = (Deno.env.get('NOTCHPAY_API_URL') ?? 'https://api.notchpay.co').replace(/\/$/, '')

export class NotchError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'NotchError'
    this.status = status
  }
}

export type NotchStatus = 'complete' | 'pending' | 'failed' | 'cancelled' | 'expired'

export interface VerifiedPayment {
  reference: string | null // référence Notch Pay (trx.xxx)
  trxref: string | null // NOTRE référence (le purchase_token)
  status: NotchStatus
  amount: number | null
  currency: string | null
}

function publicKey(): string {
  const key = Deno.env.get('NOTCHPAY_PUBLIC_KEY')
  if (!key) throw new NotchError('NOTCHPAY_PUBLIC_KEY manquante dans les secrets Supabase')
  return key
}

export function isSandbox(): boolean {
  return (Deno.env.get('NOTCHPAY_PUBLIC_KEY') ?? '').startsWith('pk_test')
}

async function notchFetch(path: string, init: RequestInit = {}, timeoutMs = 15_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        // Notch Pay attend la clé brute (sans « Bearer »)
        'Authorization': publicKey(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    })

    const text = await res.text()
    let data: any = null

    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { raw: text.slice(0, 300) }
    }

    return { ok: res.ok, status: res.status, data }
  } catch (error) {
    if (error instanceof NotchError) throw error
    throw new NotchError(`Notch Pay injoignable : ${(error as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export function normalizeStatus(value: unknown): NotchStatus {
  const status = String(value ?? '').toLowerCase()

  if (['complete', 'completed', 'success', 'successful', 'paid'].includes(status)) return 'complete'
  if (['failed', 'rejected', 'declined', 'error'].includes(status)) return 'failed'
  if (['canceled', 'cancelled'].includes(status)) return 'cancelled'
  if (status === 'expired') return 'expired'

  return 'pending' // pending, processing, inconnu…
}

export interface InitParams {
  amount: number
  currency: 'XAF'
  reference: string // notre purchase_token
  description: string
  callback: string
  customer: { name: string; email: string; phone: string }
}

/* Crée la page de paiement. Renvoie l'URL de redirection et la référence Notch Pay. */
export async function initializePayment(
  params: InitParams,
): Promise<{ reference: string | null; authorizationUrl: string }> {
  const { ok, status, data } = await notchFetch('/payments', {
    method: 'POST',
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      reference: params.reference,
      description: params.description,
      callback: params.callback,
      customer: params.customer,
    }),
  })

  const authorizationUrl = data?.authorization_url

  if (!ok || typeof authorizationUrl !== 'string' || !authorizationUrl.startsWith('https://')) {
    console.error('Notch Pay : initialisation refusée', status, JSON.stringify(data)?.slice(0, 400))
    throw new NotchError(`Initialisation refusée (HTTP ${status})`, status)
  }

  return {
    reference: data?.transaction?.reference ?? data?.reference ?? null,
    authorizationUrl,
  }
}

/* Interroge Notch Pay : SEULE source de vérité sur l'état d'un paiement.
   Renvoie null si la transaction n'existe pas. */
export async function verifyPayment(reference: string): Promise<VerifiedPayment | null> {
  const { ok, status, data } = await notchFetch(`/payments/${encodeURIComponent(reference)}`)

  if (status === 404) return null

  if (!ok) {
    throw new NotchError(`Vérification impossible (HTTP ${status})`, status)
  }

  const tx = data?.transaction ?? data
  const amount = Number(tx?.amount)

  return {
    reference: tx?.reference ?? null,
    trxref: tx?.trxref ?? tx?.merchant_reference ?? null,
    status: normalizeStatus(tx?.status),
    amount: Number.isFinite(amount) ? Math.round(amount) : null,
    currency: typeof tx?.currency === 'string' ? tx.currency.toUpperCase() : null,
  }
}

/* ------------------------------------------------------------
   Signature des webhooks (HMAC-SHA256 du corps brut)
   La documentation Notch Pay est ambiguë (nom de l'en-tête,
   encodage) : on accepte les deux noms et les deux encodages.
------------------------------------------------------------ */
function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function toBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)

  return diff === 0
}

export async function checkWebhookSignature(
  rawBody: string,
  req: Request,
): Promise<{ present: boolean; valid: boolean; reason: string }> {
  const header = req.headers.get('x-notch-signature')
    ?? req.headers.get('x-notchpay-signature')
    ?? ''
  const secret = Deno.env.get('NOTCHPAY_HASH_KEY') ?? ''

  if (!header) return { present: false, valid: false, reason: 'no_header' }
  if (!secret) return { present: true, valid: false, reason: 'no_secret' }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))

  const given = header.trim().replace(/^sha256=/i, '')
  const valid = timingSafeEqual(given.toLowerCase(), toHex(mac))
    || timingSafeEqual(given, toBase64(mac))

  return { present: true, valid, reason: valid ? 'ok' : 'mismatch' }
}
