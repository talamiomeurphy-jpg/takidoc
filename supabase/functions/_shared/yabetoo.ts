// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — CLIENT YABETOO PAY (v5.2 : Correction customer_phone)
============================================================ */
const PAYMENT_API_URL = (Deno.env.get('YABETOO_API_URL') ?? 'https://pay.sandbox.yabetoopay.com').replace(/\/$/, '')
const CHECKOUT_API_URL = (Deno.env.get('YABETOO_CHECKOUT_API_URL') ?? 'https://buy.api.yabetoopay.com').replace(/\/$/, '')
const PAY_APP_URL = (Deno.env.get('YABETOO_PAY_APP_URL') ?? 'https://pay.yabetoo.com').replace(/\/$/, '')
const DEBUG = Deno.env.get('YABETOO_DEBUG') === 'true'

export class YabetooError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'YabetooError'
    this.status = status
  }
}

export type YabetooStatus = 'complete' | 'pending' | 'failed' | 'cancelled' | 'expired'

export interface VerifiedPayment {
  reference: string | null
  purchaseToken: string | null
  status: YabetooStatus
  amount: number | null
  currency: string | null
  kind: 'session' | 'intent'
}

function secretKey(): string {
  const key = Deno.env.get('YABETOO_SECRET_KEY')
  if (!key) throw new YabetooError('YABETOO_SECRET_KEY manquante dans les secrets Supabase')
  return key
}

export function isSandbox(): boolean {
  const key = Deno.env.get('YABETOO_SECRET_KEY') ?? Deno.env.get('YABETOO_PUBLIC_KEY') ?? ''
  if (/^(sk|pk)_test/i.test(key)) return true
  if (/^(sk|pk)_live/i.test(key)) return false
  return CHECKOUT_API_URL.includes('sandbox') || PAYMENT_API_URL.includes('sandbox')
}

function pick(obj: any, keys: string[]): any {
  for (const k of keys) {
    const v = obj?.[k]
    if (v !== undefined && v !== null && v !== '') return v
  }
  return undefined
}

async function yabetooFetch(
  base: string,
  path: string,
  init: RequestInit = {},
  timeoutMs = 15_000,
): Promise<{ ok: boolean; status: number; data: any }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${secretKey()}`,
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
    if (DEBUG) console.log('Yabetoo HTTP', init.method ?? 'GET', `${base}${path}`, res.status, text.slice(0, 1500))
    return { ok: res.ok, status: res.status, data }
  } catch (error) {
    if (error instanceof YabetooError) throw error
    throw new YabetooError(`Yabetoo Pay injoignable : ${(error as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export function normalizeStatus(value: unknown): YabetooStatus {
  const status = String(value ?? '').toLowerCase()
  if (['complete', 'completed', 'success', 'successful', 'succeeded', 'paid'].includes(status)) return 'complete'
  if (['failed', 'rejected', 'declined', 'error', 'payment_failed'].includes(status)) return 'failed'
  if (['canceled', 'cancelled'].includes(status)) return 'cancelled'
  if (status === 'expired') return 'expired'
  return 'pending'
}

/* ============================================================
   CRÉATION D'UNE CHECKOUT SESSION (v5.2)
============================================================ */
export interface SessionParams {
  amount: number
  currency: string
  name: string
  description: string
  successUrl: string
  cancelUrl: string
  metadata: Record<string, string>
  productId?: string | null
}

/**
 * Variantes testées dans l'ordre :
 * 1. "complete" : tous les champs obligatoires (line_items + success_url + customer_phone dans metadata)
 * 2. "snake+inline" : snake_case avec line_items inline
 * 3. "camel+inline" : camelCase avec lineItems inline
 * 4. "flat" : format simple (pour fallback)
 */
function sessionVariants(p: SessionParams): Array<{ label: string; body: any }> {
  const unit = {
    name: p.name,
    description: p.description,
    amount: p.amount,
    currency: p.currency,
    quantity: 1,
  }

  const variants: Array<{ label: string; body: any }> = []

  // Variante 1 : COMPLETE (recommandée)
  variants.push({
    label: 'complete',
    body: {
      success_url: p.successUrl,
      cancel_url: p.cancelUrl,
      line_items: [unit],
      metadata: {
        ...p.metadata,
        customer_phone: p.metadata.customer_phone || '',
        customer_email: p.metadata.customer_email || '',
        customer_name: p.metadata.customer_name || '',
      },
    },
  })

  // Variante 2 : snake_case avec line_items
  variants.push({
    label: 'snake+inline',
    body: {
      success_url: p.successUrl,
      cancel_url: p.cancelUrl,
      currency: p.currency,
      line_items: [unit],
      metadata: {
        ...p.metadata,
        customer_phone: p.metadata.customer_phone || '',
      },
    },
  })

  // Variante 3 : camelCase avec lineItems
  variants.push({
    label: 'camel+inline',
    body: {
      successUrl: p.successUrl,
      cancelUrl: p.cancelUrl,
      currency: p.currency,
      lineItems: [unit],
      metadata: {
        ...p.metadata,
        customer_phone: p.metadata.customer_phone || '',
      },
    },
  })

  // Variante 4 : flat (sans line_items, pour fallback)
  variants.push({
    label: 'flat',
    body: {
      amount: p.amount,
      currency: p.currency,
      description: p.description,
      success_url: p.successUrl,
      cancel_url: p.cancelUrl,
      metadata: {
        ...p.metadata,
        customer_phone: p.metadata.customer_phone || '',
      },
    },
  })

  return variants
}

export async function createCheckoutSession(
  params: SessionParams,
): Promise<{ id: string; url: string }> {
  let last: { label: string; status: number; data: any } | null = null

  for (const variant of sessionVariants(params)) {
    const res = await yabetooFetch(CHECKOUT_API_URL, '/v1/checkout/sessions', {
      method: 'POST',
      body: JSON.stringify(variant.body),
    })

    if (res.ok) {
      const session = res.data?.data ?? res.data
      const id = pick(session, ['id', 'session_id', 'sessionId'])
      let url = pick(session, ['url', 'checkout_url', 'checkoutUrl', 'payment_url', 'paymentUrl'])

      if (typeof url !== 'string' && typeof id === 'string') {
        url = `${PAY_APP_URL}/c/${encodeURIComponent(id)}`
        console.warn('Yabetoo : pas d\'URL dans la réponse, URL /c/:id utilisée', url)
      }

      if (typeof id !== 'string' || typeof url !== 'string' || !url.startsWith('https://')) {
        console.error('Yabetoo : réponse de session inexploitable', JSON.stringify(res.data)?.slice(0, 500))
        throw new YabetooError('Réponse de session inexploitable', res.status)
      }

      console.log('Yabetoo : session créée', { id, variant: variant.label })
      return { id, url }
    }

    last = { label: variant.label, status: res.status, data: res.data }
    console.warn(
      'Yabetoo : session refusée',
      variant.label,
      res.status,
      JSON.stringify(res.data)?.slice(0, 500),
    )

    // 401/403/404/5xx : inutile de réessayer
    if (res.status !== 400 && res.status !== 422) break
  }

  throw new YabetooError(`Création de session refusée (HTTP ${last?.status ?? 0})`, last?.status ?? 0)
}

/* ============================================================
   VÉRIFICATION D'UN PAIEMENT
============================================================ */
function toVerified(tx: any, kind: 'session' | 'intent'): VerifiedPayment {
  const rawStatus = kind === 'session'
    ? pick(tx, ['payment_status', 'paymentStatus', 'status'])
    : pick(tx, ['status'])

  const rawAmount = kind === 'session'
    ? pick(tx, ['amount_total', 'amountTotal', 'amount', 'total'])
    : pick(tx, ['amount'])

  const amount = Number(rawAmount)
  const token = tx?.metadata?.purchase_token ?? tx?.trxref ?? tx?.merchant_reference ?? null

  return {
    reference: pick(tx, ['id', 'reference']) ?? null,
    purchaseToken: typeof token === 'string' ? token : null,
    status: normalizeStatus(rawStatus),
    amount: rawAmount !== undefined && Number.isFinite(amount) ? Math.round(amount) : null,
    currency: typeof tx?.currency === 'string' ? tx.currency.toUpperCase() : null,
    kind,
  }
}

async function verifyIntent(reference: string): Promise<VerifiedPayment | null> {
  const { ok, status, data } = await yabetooFetch(
    PAYMENT_API_URL,
    `/v1/payment-intents/${encodeURIComponent(reference)}`,
  )
  if (status === 404) return null
  if (!ok) throw new YabetooError(`Vérification impossible (HTTP ${status})`, status)
  return toVerified(data?.transaction ?? data?.data ?? data, 'intent')
}

async function verifySession(reference: string): Promise<VerifiedPayment | null> {
  const { ok, status, data } = await yabetooFetch(
    CHECKOUT_API_URL,
    `/v1/checkout/sessions/${encodeURIComponent(reference)}`,
  )
  if (status === 404) return null
  if (!ok) throw new YabetooError(`Vérification impossible (HTTP ${status})`, status)
  return toVerified(data?.data ?? data, 'session')
}

export function verifyPayment(reference: string): Promise<VerifiedPayment | null> {
  return reference.startsWith('pi_') ? verifyIntent(reference) : verifySession(reference)
}

/* ============================================================
   SIGNATURE WEBHOOK
============================================================ */
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

async function hmac(secret: string, payload: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
}

export async function checkWebhookSignature(
  rawBody: string,
  req: Request,
): Promise<{ present: boolean; valid: boolean; reason: string }> {
  const header = (
    req.headers.get('x-yabetoo-webhook-signature') ??
    req.headers.get('x-yabetoo-signature') ??
    ''
  ).trim()
  const secret = Deno.env.get('YABETOO_HASH_KEY') ?? ''

  if (!header) return { present: false, valid: false, reason: 'no_header' }
  if (!secret) return { present: true, valid: false, reason: 'no_secret' }

  let timestamp: string | null = null
  const candidates: string[] = []

  for (const part of header.split(/[,\s]+/).filter(Boolean)) {
    const m = part.match(/^(t|v\d|sha256|s|sig|signature)=(.+)$/i)
    if (m) {
      if (m[1].toLowerCase() === 't') timestamp = m[2]
      else candidates.push(m[2])
    } else {
      candidates.push(part)
    }
  }

  const secrets = [...new Set([secret, secret.replace(/^whsec_/i, '')])]
  const payloads = [rawBody, ...(timestamp ? [`${timestamp}.${rawBody}`] : [])]

  for (const s of secrets) {
    for (const payload of payloads) {
      const mac = await hmac(s, payload)
      const hex = toHex(mac)
      const b64 = toBase64(mac)

      for (const raw of candidates) {
        const given = raw.replace(/^whsec_/i, '')
        if (timingSafeEqual(given.toLowerCase(), hex) || timingSafeEqual(given, b64)) {
          return { present: true, valid: true, reason: 'ok' }
        }
      }
    }
  }

  return { present: true, valid: false, reason: 'mismatch' }
}

/* ------------------------------------------------------------
   CRÉATION D'UN PAYMENT INTENT (sans redirection)
   POST /v1/payment-intents
   Retourne { id, clientSecret }
------------------------------------------------------------ */
export interface PaymentIntentParams {
  amount: number
  currency: string // 'xaf'
  description: string
  metadata: Record<string, string>
}

export interface PaymentIntentResult {
  id: string
  clientSecret: string
  status: string
}

export async function createPaymentIntent(
  params: PaymentIntentParams,
): Promise<PaymentIntentResult> {
  const res = await yabetooFetch(PAYMENT_API_URL, '/v1/payment-intents', {
    method: 'POST',
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      metadata: params.metadata,
    }),
  })

  if (!res.ok) {
    console.error('Yabetoo : création Payment Intent refusée', res.status, JSON.stringify(res.data)?.slice(0, 500))
    throw new YabetooError(`Création Payment Intent refusée (HTTP ${res.status})`, res.status)
  }

  const data = res.data?.data ?? res.data
  const id = pick(data, ['id'])
  const clientSecret = pick(data, ['clientSecret', 'client_secret'])

  if (typeof id !== 'string' || typeof clientSecret !== 'string') {
    console.error('Yabetoo : réponse Payment Intent inexploitable', JSON.stringify(data)?.slice(0, 500))
    throw new YabetooError('Réponse Payment Intent inexploitable', res.status)
  }

  console.log('Yabetoo : Payment Intent créé', { id })
  return { id, clientSecret, status: data.status ?? 'requires_payment_method' }
}



/* ------------------------------------------------------------
   CONFIRMATION D'UN PAYMENT INTENT (Mobile Money)
   POST /v1/payment-intents/{id}/confirm
   
   Format Yabetoo documenté :
   https://docs.yabetoopay.com/en/guides/concepts/mobile-money
   
   payment_method_data: {
     type: "momo",  // ← TOUJOURS "momo" pour Mobile Money
     momo: {
       country: "cg",  // Code pays (Congo = "cg")
       msisdn: "+242065186967",  // Numéro international
       operator_name: "mtn"  // "mtn" ou "airtel"
     }
   }
------------------------------------------------------------ */
export interface ConfirmPaymentParams {
  paymentIntentId: string
  clientSecret: string
  operator: 'MTN' | 'AIRTEL'
  phone: string // format international ex: +242065186967
  returnUrl: string
}

export async function confirmPaymentIntent(
  params: ConfirmPaymentParams,
): Promise<{ status: string; id: string }> {
  const operatorLower = params.operator.toLowerCase() // 'mtn' ou 'airtel'
  
  // Déterminer le code pays (Congo = "cg")
  // Pour les numéros +242 (Congo-Brazzaville)
  const countryCode = params.phone.startsWith('+242') ? 'cg' : 'cg'
  
  const res = await yabetooFetch(
    PAYMENT_API_URL,
    `/v1/payment-intents/${encodeURIComponent(params.paymentIntentId)}/confirm`,
    {
      method: 'POST',
      body: JSON.stringify({
        client_secret: params.clientSecret,
        payment_method_data: {
          type: 'momo', // ← TOUJOURS "momo" pour Mobile Money
          momo: {
            country: countryCode,
            msisdn: params.phone,
            operator_name: operatorLower,
          },
        },
        return_url: params.returnUrl,
      }),
    },
  )

  if (!res.ok) {
    console.error('Yabetoo : confirmation refusée', res.status, JSON.stringify(res.data)?.slice(0, 500))
    throw new YabetooError(`Confirmation refusée (HTTP ${res.status})`, res.status)
  }

  const data = res.data?.data ?? res.data
  console.log('Yabetoo : Payment Intent confirmé', {
    id: data.id ?? params.paymentIntentId,
    status: data.status,
  })

  return {
    id: data.id ?? params.paymentIntentId,
    status: data.status ?? 'processing',
  }
}