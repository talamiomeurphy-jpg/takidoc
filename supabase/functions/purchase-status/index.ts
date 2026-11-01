// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — EDGE FUNCTION : PURCHASE STATUS
Version 6.1 — YabetooPay Payment Intents + conservation 72 h

Appelée par la modale de paiement (polling) pour suivre un paiement.

Corps :  { purchase_token: string }
Réponse :
  {
    status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'review',
    verification: 'ok' | 'unavailable',
    template_id, template_name, amount, currency,
    purchase_id: string | null,      // nécessaire au téléchargement
    quota?: { max, used, remaining, access_expires_at },
    document_expires_at: string | null,   // fin de conservation du document (72 h)
    sandbox: boolean
  }

Si le webhook est en retard, cette fonction interroge elle-même Yabetoo,
puis valide l'achat avec la MÊME fonction SQL que le webhook
(complete_purchase) : l'opération est idempotente, donc un paiement ne
peut plus créer deux achats si le webhook et le polling arrivent en même
temps.

Correctifs par rapport à la v6.0 :
  - Plus d'insertion directe dans « purchases » (risque de doublon avec le
    webhook, et guest_email / guest_phone n'étaient pas lus dans le select).
  - « sandbox » reflète la configuration réelle (isSandbox) au lieu de true.
  - Ajout de document_expires_at.
============================================================ */

import { preflight } from '../_shared/cors.ts'
import { adminClient, fail, json, readJson, UUID_RE } from '../_shared/http.ts'
import { isSandbox, verifyPayment } from '../_shared/yabetoo.ts'

const TERMINAL_FAILURES = ['failed', 'cancelled', 'expired']

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
      return fail(req, 'invalid_token', 'Jeton d\'achat invalide.', 400)
    }

    const { data: pending, error } = await admin
      .from('pending_purchases')
      .select('id, purchase_token, template_id, user_id, amount, status, provider_reference, purchase_id, templates(name)')
      .eq('purchase_token', token)
      .maybeSingle()

    if (error) {
      console.error('purchase-status : lecture', error.message)
      return fail(req, 'server_error', 'Une erreur est survenue.', 500)
    }

    if (!pending) {
      return fail(req, 'purchase_not_found', 'Achat introuvable.', 404)
    }

    let status: string = pending.status
    let purchaseId: string | null = pending.purchase_id
    let verification: 'ok' | 'unavailable' = 'ok'

    // Pas encore complété : on interroge Yabetoo (source de vérité)
    if (pending.status !== 'completed' && pending.provider_reference) {
      try {
        const verified = await verifyPayment(pending.provider_reference)

        if (!verified) {
          verification = 'unavailable'
        } else if (verified.status === 'complete') {
          // Validation idempotente, identique au webhook
          const { data: done, error: rpcError } = await admin.rpc('complete_purchase', {
            p_purchase_token: token,
            p_provider_reference: verified.reference ?? pending.provider_reference,
            p_amount: pending.amount,
            p_currency: 'XAF',
            p_payment_method: 'yabetoo',
          })

          if (rpcError) {
            // Erreur probablement temporaire : le prochain polling réessaiera
            console.error('purchase-status : complete_purchase', rpcError.message)
            status = 'pending'
          } else if (!done?.ok) {
            // Paiement confirmé chez Yabetoo mais refusé par la base : à examiner à la main
            console.error('purchase-status : complete_purchase refusé', JSON.stringify(done))
            status = 'review'
          } else {
            // On relit l'état réel (le webhook a pu passer entre-temps)
            const { data: fresh } = await admin
              .from('pending_purchases')
              .select('status, purchase_id')
              .eq('purchase_token', token)
              .maybeSingle()

            purchaseId = fresh?.purchase_id ?? purchaseId
            status = fresh?.status === 'completed' && purchaseId ? 'completed' : 'pending'
          }
        } else if (TERMINAL_FAILURES.includes(verified.status)) {
          status = verified.status
          await admin
            .from('pending_purchases')
            .update({ status: verified.status })
            .eq('purchase_token', token)
        }
        // Autre statut (en attente de confirmation Mobile Money) : on reste « pending »
      } catch (error) {
        verification = 'unavailable'
        console.warn(
          'purchase-status : vérification Yabetoo impossible',
          error instanceof Error ? error.message : String(error),
        )
      }
    }

    let quota: unknown = undefined
    let documentExpiresAt: string | null = null

    if (status === 'completed' && purchaseId) {
      const { data } = await admin.rpc('generation_quota', { p_purchase_id: purchaseId })
      quota = data ?? undefined

      const { data: stored } = await admin
        .from('purchase_documents')
        .select('expires_at')
        .eq('purchase_id', purchaseId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      documentExpiresAt = stored?.expires_at ?? null
    }

    return json(req, {
      status,
      verification,
      template_id: pending.template_id,
      template_name: (pending as any).templates?.name ?? null,
      amount: pending.amount,
      currency: 'XAF',
      purchase_id: purchaseId,
      quota,
      document_expires_at: documentExpiresAt,
      sandbox: isSandbox(),
    })
  } catch (error) {
    console.error('purchase-status :', error)
    return fail(req, 'server_error', 'Une erreur est survenue.', 500)
  }
})
