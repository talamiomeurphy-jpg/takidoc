// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — EDGE FUNCTION : PURCHASE STATUS
Version 3.0

Appelée par confirmation.html (et l'éditeur) pour suivre un paiement.

Corps :  { purchase_token: string }
Réponse :
  {
    status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'review',
    template_id, template_name, amount, currency,
    quota?: { max, used, remaining, access_expires_at }   // si completed
    sandbox: boolean
  }

Si le webhook est en retard (ou mal configuré), cette fonction
interroge elle-même Notch Pay : le client n'attend jamais pour rien.
Le statut renvoyé vient de la base de données et de Notch Pay,
jamais du navigateur.
============================================================ */

import { preflight } from '../_shared/cors.ts'
import { adminClient, fail, json, readJson, UUID_RE } from '../_shared/http.ts'
import { isSandbox, NotchError } from '../_shared/notchpay.ts'
import { reconcilePending, type PendingRow } from '../_shared/payments.ts'

Deno.serve(async (req) => {
  const early = preflight(req)
  if (early) return early

  if (req.method !== 'POST') {
    return fail(req, 'method_not_allowed', 'Méthode non autorisée.', 405)
  }

  try {
    const admin = adminClient()

    const body = await readJson(req, 5_000)
    const token = typeof body?.purchase_token === 'string' ? body.purchase_token.trim() : ''

    if (!UUID_RE.test(token)) {
      return fail(req, 'invalid_token', 'Jeton d’achat invalide.', 400)
    }

    const { data: pending, error } = await admin
      .from('pending_purchases')
      .select(
        'id, purchase_token, template_id, user_id, amount, status, provider_reference, purchase_id, templates(name)',
      )
      .eq('purchase_token', token)
      .maybeSingle()

    if (error) {
      console.error('purchase-status : lecture', error.message)
      return fail(req, 'server_error', 'Une erreur est survenue. Réessayez dans un instant.', 500)
    }

    if (!pending) return fail(req, 'purchase_not_found', 'Achat introuvable.', 404)

    let status: string = pending.status
    let purchaseId: string | null = pending.purchase_id
    let verification: 'ok' | 'unavailable' = 'ok'

    // Pas encore confirmé : on interroge Notch Pay (source de vérité)
    if (pending.status !== 'completed') {
      try {
        const result = await reconcilePending(admin, pending as unknown as PendingRow)
        status = result.status
        purchaseId = result.purchase_id ?? purchaseId
      } catch (error) {
        // Notch Pay injoignable : on garde le statut connu, le client réessaiera
        verification = 'unavailable'
        console.warn(
          'purchase-status : vérification impossible',
          error instanceof NotchError ? error.message : String(error),
        )
      }
    }

    let quota: unknown = undefined

    if (status === 'completed' && purchaseId) {
      const { data } = await admin.rpc('generation_quota', { p_purchase_id: purchaseId })
      quota = data ?? undefined
    }

    return json(req, {
      status,
      verification,
      template_id: pending.template_id,
      template_name: (pending as any).templates?.name ?? null,
      amount: pending.amount,
      currency: 'XAF',
      quota,
      sandbox: isSandbox(),
    })
  } catch (error) {
    console.error('purchase-status :', error)
    return fail(req, 'server_error', 'Une erreur est survenue. Réessayez dans un instant.', 500)
  }
})
