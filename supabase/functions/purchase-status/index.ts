// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — EDGE FUNCTION : PURCHASE STATUS
Version 6.0 — YabetooPay Payment Intents

Appelée par la modale de paiement (polling) pour suivre un paiement.

Corps :  { purchase_token: string }
Réponse :
  {
    status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'review',
    template_id, template_name, amount, currency,
    purchase_id: string | null,  // <-- AJOUTÉ : essentiel pour le téléchargement
    quota?: { max, used, remaining, access_expires_at },
    sandbox: boolean
  }

Si le webhook est en retard, cette fonction interroge elle-même Yabetoo.
============================================================ */

import { preflight } from '../_shared/cors.ts'
import { adminClient, fail, json, readJson, UUID_RE } from '../_shared/http.ts'
import { verifyPayment } from '../_shared/yabetoo.ts'

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

    // Si pas encore complété, on interroge Yabetoo (source de vérité)
    if (pending.status !== 'completed' && pending.provider_reference) {
      try {
        const verified = await verifyPayment(pending.provider_reference)

        if (verified) {
          if (verified.status === 'complete') {
            // Vérifier si l'achat n'existe pas déjà (idempotence)
            if (!purchaseId) {
              const { data: newPurchase, error: insertError } = await admin
                .from('purchases')
                .insert({
                  user_id: pending.user_id,
                  guest_email: pending.guest_email,
                  guest_phone: pending.guest_phone,
                  template_id: pending.template_id,
                  amount_paid: pending.amount,
                  currency: 'XAF',
                  payment_method: 'yabetoo',
                  payment_reference: verified.reference,
                  payment_status: 'completed',
                })
                .select('id')
                .single()

              if (insertError) {
                console.error('purchase-status : erreur insertion purchase', insertError.message)
              } else {
                purchaseId = newPurchase?.id ?? null
                
                // Mettre à jour pending_purchases
                await admin
                  .from('pending_purchases')
                  .update({ status: 'completed', purchase_id: purchaseId })
                  .eq('purchase_token', token)
              }
            }
            status = 'completed'
          } else if (verified.status === 'failed' || verified.status === 'cancelled' || verified.status === 'expired') {
            status = verified.status
            await admin
              .from('pending_purchases')
              .update({ status: verified.status })
              .eq('purchase_token', token)
          }
        } else {
          verification = 'unavailable'
        }
      } catch (error) {
        verification = 'unavailable'
        console.warn('purchase-status : vérification Yabetoo impossible', error instanceof Error ? error.message : String(error))
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
      purchase_id: purchaseId, // <-- CRUCIAL pour que authorize-download fonctionne
      quota,
      sandbox: true,
    })
  } catch (error) {
    console.error('purchase-status :', error)
    return fail(req, 'server_error', 'Une erreur est survenue.', 500)
  }
})