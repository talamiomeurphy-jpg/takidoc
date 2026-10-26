// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — RÉCONCILIATION D'UN PAIEMENT

Principe de sécurité : on ne croit JAMAIS ce que dit le navigateur
ni le corps d'un webhook. On demande à Notch Pay l'état réel de la
transaction, on contrôle qu'elle appartient bien à cette intention
d'achat, puis la base de données contrôle montant et devise
(fonction SQL complete_purchase, atomique et idempotente).

Utilisée à la fois par le webhook et par la page de retour
(purchase-status) : si l'un est en retard, l'autre rattrape.
============================================================ */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { verifyPayment } from './notchpay.ts'

export interface PendingRow {
  id: string
  purchase_token: string
  template_id: string
  user_id: string | null
  amount: number
  status: string
  provider_reference: string | null
  purchase_id: string | null
}

export type PurchaseState =
  | 'completed'
  | 'pending'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'review' // argent reçu mais incohérence à examiner (montant, devise…)

export interface ReconcileResult {
  status: PurchaseState
  purchase_id: string | null
  detail?: string
}

function knownState(status: string): PurchaseState {
  return ['completed', 'pending', 'failed', 'cancelled', 'expired'].includes(status)
    ? (status as PurchaseState)
    : 'pending'
}

export async function reconcilePending(
  admin: SupabaseClient,
  pending: PendingRow,
  hintReference: string | null = null,
): Promise<ReconcileResult> {
  // Déjà traité
  if (pending.status === 'completed' && pending.purchase_id) {
    return { status: 'completed', purchase_id: pending.purchase_id }
  }

  const reference = pending.provider_reference ?? hintReference

  if (!reference) {
    return { status: knownState(pending.status), purchase_id: null, detail: 'no_reference' }
  }

  // Peut lever NotchError (réseau) : l'appelant décide (le webhook répond 500 pour être rappelé)
  const tx = await verifyPayment(reference)

  if (!tx) {
    return { status: knownState(pending.status), purchase_id: null, detail: 'unknown_transaction' }
  }

  // Cette transaction doit appartenir à CETTE intention d'achat
  if (tx.trxref) {
    if (tx.trxref !== pending.purchase_token) {
      console.warn('Réconciliation : trxref différent', { token: pending.purchase_token })
      return { status: knownState(pending.status), purchase_id: null, detail: 'trxref_mismatch' }
    }
  } else if (!pending.provider_reference) {
    // Référence venue d'ailleurs (webhook) et aucun moyen de la relier à notre intention
    return { status: knownState(pending.status), purchase_id: null, detail: 'unverifiable_owner' }
  }

  if (tx.status === 'complete') {
    const { data, error } = await admin.rpc('complete_purchase', {
      p_purchase_token: pending.purchase_token,
      p_provider_reference: tx.reference ?? reference,
      p_amount: tx.amount,
      p_currency: tx.currency,
      p_payment_method: 'notchpay',
    })

    if (error) throw new Error(`complete_purchase : ${error.message}`)

    if (data?.ok) {
      return { status: 'completed', purchase_id: data.purchase_id }
    }

    // Paiement reçu côté Notch Pay mais refusé par nos contrôles : à examiner à la main.
    console.error('PAYMENT_REVIEW', {
      token: pending.purchase_token,
      reason: data?.error,
      paid: tx.amount,
      expected: pending.amount,
      currency: tx.currency,
    })
    return { status: 'review', purchase_id: null, detail: data?.error ?? 'rejected' }
  }

  if (tx.status === 'failed' || tx.status === 'cancelled' || tx.status === 'expired') {
    await admin
      .from('pending_purchases')
      .update({ status: tx.status, failure_reason: `notchpay:${tx.status}` })
      .eq('purchase_token', pending.purchase_token)
      .eq('status', 'pending') // ne rétrograde jamais un achat déjà validé

    return { status: tx.status, purchase_id: null }
  }

  return { status: 'pending', purchase_id: null }
}
