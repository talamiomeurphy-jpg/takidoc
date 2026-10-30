// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — RÉCONCILIATION D'UN PAIEMENT (v5)

Principe de sécurité : on ne croit JAMAIS ce que dit le navigateur
ni le corps d'un webhook. On demande à Yabetoo l'état réel de la
transaction, on contrôle qu'elle appartient bien à cette intention
d'achat, puis la base de données (complete_purchase) contrôle
montant, devise et idempotence.

Utilisée par handle-yabetoo-webhook ET purchase-status
(l'interface publique est inchangée : PendingRow, PurchaseState,
ReconcileResult, reconcilePending).
============================================================ */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { verifyPayment } from './yabetoo.ts'

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
  | 'review'

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
  // Déjà traité : rien à refaire (idempotence)
  if (pending.status === 'completed' && pending.purchase_id) {
    return { status: 'completed', purchase_id: pending.purchase_id }
  }

  const reference = pending.provider_reference ?? hintReference

  if (!reference) {
    return { status: knownState(pending.status), purchase_id: null, detail: 'no_reference' }
  }

  // Source de vérité : l'API Yabetoo
  const tx = await verifyPayment(reference)

  if (!tx) {
    return { status: knownState(pending.status), purchase_id: null, detail: 'unknown_transaction' }
  }

  /* ---------- La transaction appartient-elle bien à cet achat ? ---------- */
  if (tx.purchaseToken) {
    if (tx.purchaseToken !== pending.purchase_token) {
      console.warn('Réconciliation : purchase_token différent', { token: pending.purchase_token })
      return { status: knownState(pending.status), purchase_id: null, detail: 'token_mismatch' }
    }
  } else if (!pending.provider_reference || pending.provider_reference !== reference) {
    // Pas de token dans la transaction ET référence non enregistrée par nous : on ne peut pas prouver l'appartenance
    return { status: knownState(pending.status), purchase_id: null, detail: 'unverifiable_owner' }
  }

  /* ---------- Paiement réussi ---------- */
  if (tx.status === 'complete') {
    // Si l'API ne renvoie pas le montant mais que la transaction est prouvée comme
    // appartenant à cet achat (metadata), on utilise le montant fixé côté serveur.
    let amount = tx.amount
    if (amount === null && tx.purchaseToken === pending.purchase_token) {
      console.warn('Réconciliation : montant absent de la réponse Yabetoo, montant attendu utilisé', {
        token: pending.purchase_token,
      })
      amount = pending.amount
    }

    const { data, error } = await admin.rpc('complete_purchase', {
      p_purchase_token: pending.purchase_token,
      p_provider_reference: tx.reference ?? reference,
      p_amount: amount,
      p_currency: tx.currency ?? 'XAF',
      p_payment_method: 'yabetoo',
    })

    if (error) throw new Error(`complete_purchase : ${error.message}`)

    if (data?.ok) {
      return { status: 'completed', purchase_id: data.purchase_id }
    }

    console.error('PAYMENT_REVIEW', {
      token: pending.purchase_token,
      reason: data?.error,
      paid: amount,
      expected: pending.amount,
      currency: tx.currency,
    })
    return { status: 'review', purchase_id: null, detail: data?.error ?? 'rejected' }
  }

  /* ---------- Échec / annulation / expiration ---------- */
  if (tx.status === 'failed' || tx.status === 'cancelled' || tx.status === 'expired') {
    // Sur une Checkout Session, un échec de paiement n'est PAS terminal :
    // le client peut réessayer sur la même page. On ne le fige donc pas.
    if (tx.kind === 'session' && tx.status === 'failed') {
      return { status: 'pending', purchase_id: null, detail: 'payment_failed_retry_possible' }
    }

    await admin
      .from('pending_purchases')
      .update({ status: tx.status, failure_reason: `yabetoo:${tx.status}` })
      .eq('purchase_token', pending.purchase_token)
      .eq('status', 'pending')

    return { status: tx.status, purchase_id: null }
  }

  return { status: 'pending', purchase_id: null }
}
