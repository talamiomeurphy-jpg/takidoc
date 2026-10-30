// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — EDGE FUNCTION : HANDLE YABETOO WEBHOOK
Version 5.0

Le webhook n'est qu'un DÉCLENCHEUR. Il sert à retrouver l'achat
concerné, puis la vraie vérification se fait en interrogeant l'API
Yabetoo (reconcilePending) : un faux webhook ne peut donc jamais
débloquer un document.

Réponses :
  200  événement traité ou volontairement ignoré (pas de renvoi)
  401  signature refusée (uniquement si YABETOO_ENFORCE_SIGNATURE=true)
  500  erreur temporaire (Yabetoo réessaiera)

Secrets : YABETOO_SECRET_KEY, YABETOO_HASH_KEY,
          YABETOO_ENFORCE_SIGNATURE (optionnel, « true »),
          YABETOO_DEBUG (optionnel, « true » : journalise le corps brut)
============================================================ */

import { adminClient, UUID_RE } from '../_shared/http.ts'
import { reconcilePending, type PendingRow } from '../_shared/payments.ts'
import { checkWebhookSignature } from '../_shared/yabetoo.ts'

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const COLUMNS =
  'id, purchase_token, template_id, user_id, amount, status, provider_reference, purchase_id'

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405)

  try {
    const raw = await req.text()
    if (raw.length > 200_000) return reply({ error: 'payload_too_large' }, 413)

    /* ---------- 1. Signature (informative, bloquante si demandé) ---------- */
    const signature = await checkWebhookSignature(raw, req)
    const enforce = Deno.env.get('YABETOO_ENFORCE_SIGNATURE') === 'true'

    console.log('Webhook Yabetoo : signature', signature.reason)

    if (enforce && !signature.valid) {
      return reply({ error: 'invalid_signature' }, 401)
    }

    if (Deno.env.get('YABETOO_DEBUG') === 'true') {
      console.log('Webhook Yabetoo : corps brut', raw.slice(0, 4000))
    }

    let event: any
    try {
      event = JSON.parse(raw)
    } catch {
      return reply({ error: 'invalid_json' }, 400)
    }

    /* ---------- 2. Filtrage des événements ---------- */
    const type = String(event?.type ?? event?.event ?? '').toLowerCase()

    if (!type) return reply({ received: true, ignored: 'no_type' })

    // « created » = simple ouverture, pas de paiement à vérifier
    if (type.endsWith('.created')) return reply({ received: true, ignored: type })

    if (!/(checkout|session|payment|intent)/.test(type)) {
      return reply({ received: true, ignored: type })
    }

    /* ---------- 3. Retrouver l'achat concerné ---------- */
    const obj = event?.data?.object ?? event?.data?.transaction ?? event?.data ?? event

    const token = str(obj?.metadata?.purchase_token) ?? str(event?.metadata?.purchase_token)

    const refs = [
      obj?.id,
      obj?.checkoutSessionId,
      obj?.checkout_session_id,
      obj?.paymentIntentId,
      obj?.payment_intent,
      obj?.reference,
    ]
      .map(str)
      .filter((v): v is string => v !== null)

    const admin = adminClient()
    let pending: PendingRow | null = null

    if (token && UUID_RE.test(token)) {
      const { data } = await admin
        .from('pending_purchases')
        .select(COLUMNS)
        .eq('purchase_token', token)
        .maybeSingle()
      pending = data as PendingRow | null
    }

    if (!pending && refs.length) {
      const { data } = await admin
        .from('pending_purchases')
        .select(COLUMNS)
        .in('provider_reference', refs)
        .limit(1)
        .maybeSingle()
      pending = data as PendingRow | null
    }

    if (!pending) {
      console.warn('Webhook Yabetoo : achat inconnu', { type, token, refs })
      return reply({ received: true, ignored: 'unknown_reference' })
    }

    /* ---------- 4. Vérification réelle auprès de Yabetoo ---------- */
    const result = await reconcilePending(admin, pending, refs[0] ?? null)

    console.log('Webhook Yabetoo : résultat', {
      type,
      token: pending.purchase_token,
      status: result.status,
      detail: result.detail,
    })

    return reply({
      received: true,
      status: result.status,
      purchase_token: pending.purchase_token,
    })
  } catch (error) {
    console.error('Webhook Yabetoo : erreur', error instanceof Error ? error.message : String(error))
    return reply({ error: 'temporary_failure' }, 500)
  }
})
