// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — EDGE FUNCTION : HANDLE NOTCH PAY WEBHOOK
Version 3.0

URL à enregistrer dans le dashboard Notch Pay (Développeur > Webhooks) :
  https://wyfkogowsdbxctbpfuud.supabase.co/functions/v1/handle-notchpay-webhook

⚠️ À déployer SANS vérification JWT (Notch Pay n'a pas de jeton Supabase) :
  supabase functions deploy handle-notchpay-webhook --no-verify-jwt

Sécurité en deux niveaux :
  1. Signature HMAC-SHA256 (en-tête X-Notch-Signature) — contrôlée et journalisée.
     Elle devient BLOQUANTE quand le secret NOTCHPAY_ENFORCE_SIGNATURE vaut « true »
     (à activer après le premier événement de test, quand le format est confirmé).
  2. Re-vérification du paiement auprès de l'API Notch Pay, contrôle de la
     référence, du montant et de la devise. C'est CE niveau qui protège :
     un faux webhook ne peut jamais valider un achat.

Réponses :
  200 -> événement traité ou ignoré (Notch Pay ne réessaie pas)
  401 -> signature invalide (si bloquante)
  500 -> erreur temporaire (Notch Pay réessaiera plus tard)
============================================================ */

import { adminClient, UUID_RE } from '../_shared/http.ts'
import { checkWebhookSignature, NotchError } from '../_shared/notchpay.ts'
import { reconcilePending, type PendingRow } from '../_shared/payments.ts'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  try {
    const raw = await req.text()

    if (raw.length > 200_000) return jsonResponse({ error: 'payload_too_large' }, 413)

    /* ---------- 1. Signature ---------- */
    const signature = await checkWebhookSignature(raw, req)
    const enforce = Deno.env.get('NOTCHPAY_ENFORCE_SIGNATURE') === 'true'
    const debug = Deno.env.get('NOTCHPAY_DEBUG') === 'true'

    // Journal de mise au point : noms des en-têtes liés à la signature (jamais leur valeur complète)
    const signatureHeaders = [...req.headers.entries()]
      .filter(([name]) => /signature|notch/i.test(name))
      .map(([name, value]) => `${name}=${value.slice(0, 10)}…`)

    console.log('Webhook reçu', {
      signature: signature.reason,
      enforce,
      headers: signatureHeaders,
    })

    if (debug) console.log('Webhook corps complet :', raw)

    if (enforce && !signature.valid) {
      console.warn('Webhook refusé : signature invalide')
      return jsonResponse({ error: 'invalid_signature' }, 401)
    }

    /* ---------- 2. Lecture de l'événement ---------- */
    let event: any

    try {
      event = JSON.parse(raw)
    } catch {
      return jsonResponse({ error: 'invalid_json' }, 400)
    }

    const type = String(event?.type ?? event?.event ?? '')
    const data = event?.data ?? event
    const tx = data?.transaction ?? data

    // On ne traite que les événements de paiement
    if (!type.startsWith('payment.')) {
      return jsonResponse({ received: true, ignored: type || 'unknown_event' })
    }

    const notchReference: string | null = typeof tx?.reference === 'string' ? tx.reference : null
    const merchantReference: string | null = typeof tx?.trxref === 'string'
      ? tx.trxref
      : typeof tx?.merchant_reference === 'string'
      ? tx.merchant_reference
      : null

    console.log('Webhook événement', {
      type,
      notchReference,
      merchantReference,
      status: tx?.status,
    })

    /* ---------- 3. Retrouver l'intention d'achat ---------- */
    const admin = adminClient()

    const columns =
      'id, purchase_token, template_id, user_id, amount, status, provider_reference, purchase_id'

    let pending: PendingRow | null = null

    if (merchantReference && UUID_RE.test(merchantReference)) {
      const { data: row } = await admin
        .from('pending_purchases')
        .select(columns)
        .eq('purchase_token', merchantReference)
        .maybeSingle()
      pending = row as PendingRow | null
    }

    if (!pending && notchReference) {
      const { data: row } = await admin
        .from('pending_purchases')
        .select(columns)
        .eq('provider_reference', notchReference)
        .maybeSingle()
      pending = row as PendingRow | null
    }

    if (!pending) {
      // Événement qui ne concerne aucun de nos achats : on l'accuse simplement
      console.warn('Webhook : intention d’achat inconnue', { notchReference, merchantReference })
      return jsonResponse({ received: true, ignored: 'unknown_reference' })
    }

    /* ---------- 4. Vérification réelle + validation ---------- */
    const result = await reconcilePending(admin, pending, notchReference)

    console.log('Webhook résultat', {
      token: pending.purchase_token,
      status: result.status,
      detail: result.detail,
    })

    return jsonResponse({ received: true, status: result.status })
  } catch (error) {
    // Erreur temporaire (Notch Pay injoignable, base indisponible…) : 500 => nouvelle tentative
    console.error(
      'Webhook : erreur',
      error instanceof NotchError ? error.message : error,
    )
    return jsonResponse({ error: 'temporary_failure' }, 500)
  }
})
