// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — EDGE FUNCTION : AUTHORIZE DOWNLOAD
Version 3.0 — nonce lié à un achat payé, avec quota

Corps attendu (deux façons de prouver son achat) :
  { purchase_token: string, format?: 'pdf' | 'docx' }   // invité ou connecté, juste après l'achat
  { template_id: string,    format?: 'pdf' | 'docx' }   // utilisateur CONNECTÉ : re-téléchargement

Réponse : { nonce, expires_in, format, template_id, remaining, max, generator_url }

Sécurité :
  - plus aucun user_id / e-mail / téléphone lu dans le corps (usurpation impossible)
  - plus de filtre .or() construit avec des données du client (injection impossible)
  - le nonce n'est créé que pour un achat « completed », dans le quota
    (fonction SQL create_generation_nonce, verrouillée contre les rafales)
  - un achat rattaché à un compte n'est utilisable que par ce compte
============================================================ */

import { preflight } from '../_shared/cors.ts'
import { adminClient, fail, getAuthUser, json, readJson, UUID_RE } from '../_shared/http.ts'
import { TEMPLATE_ID_RE } from '../_shared/validation.ts'

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  purchase_not_found: { status: 404, message: 'Achat introuvable.' },
  not_paid: { status: 402, message: 'Ce paiement n’est pas encore confirmé.' },
  access_expired: {
    status: 403,
    message: 'L’accès à ce document a expiré (30 jours après l’achat).',
  },
  quota_exceeded: {
    status: 429,
    message: 'Vous avez atteint la limite de téléchargements de cet achat.',
  },
  invalid_format: { status: 400, message: 'Format invalide.' },
}

Deno.serve(async (req) => {
  const early = preflight(req)
  if (early) return early

  if (req.method !== 'POST') {
    return fail(req, 'method_not_allowed', 'Méthode non autorisée.', 405)
  }

  try {
    const admin = adminClient()

    const body = await readJson(req, 10_000)
    if (!body) return fail(req, 'invalid_json', 'Requête invalide.', 400)

    /* ---------- Format ---------- */
    const format = body.format === 'docx' ? 'docx' : 'pdf'

    if (format === 'docx' && Deno.env.get('ENABLE_DOCX') !== 'true') {
      return fail(req, 'docx_disabled', 'Le format Word n’est pas encore disponible.', 400)
    }

    const user = await getAuthUser(admin, req)

    let purchaseId: string | null = null
    let templateId: string | null = null

    /* ---------- A. Par jeton d'achat ---------- */
    if (typeof body.purchase_token === 'string') {
      const token = body.purchase_token.trim()

      if (!UUID_RE.test(token)) {
        return fail(req, 'invalid_token', 'Jeton d’achat invalide.', 400)
      }

      const { data: pending, error } = await admin
        .from('pending_purchases')
        .select('status, purchase_id, user_id, template_id')
        .eq('purchase_token', token)
        .maybeSingle()

      if (error) {
        console.error('authorize-download : lecture', error.message)
        return fail(req, 'server_error', 'Une erreur est survenue. Réessayez dans un instant.', 500)
      }

      if (!pending) return fail(req, 'purchase_not_found', 'Achat introuvable.', 404)

      // Un achat rattaché à un compte n'est utilisable que par ce compte
      if (pending.user_id && pending.user_id !== user?.id) {
        return fail(
          req,
          'login_required',
          'Connectez-vous avec le compte utilisé pour cet achat.',
          403,
        )
      }

      if (pending.status !== 'completed' || !pending.purchase_id) {
        return fail(req, 'payment_not_completed', 'Ce paiement n’est pas encore confirmé.', 402, {
          status: pending.status,
        })
      }

      purchaseId = pending.purchase_id
      templateId = pending.template_id
    } /* ---------- B. Par modèle (utilisateur connecté) ---------- */ else if (
      typeof body.template_id === 'string'
    ) {
      const wanted = body.template_id.trim()

      if (!TEMPLATE_ID_RE.test(wanted)) {
        return fail(req, 'invalid_template', 'Modèle invalide.', 400)
      }

      if (!user) {
        return fail(req, 'login_required', 'Connectez-vous pour retrouver vos achats.', 401)
      }

      const { data: purchases, error } = await admin
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('template_id', wanted)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('authorize-download : achats', error.message)
        return fail(req, 'server_error', 'Une erreur est survenue. Réessayez dans un instant.', 500)
      }

      if (!purchases?.length) {
        return fail(req, 'payment_required', 'Aucun achat trouvé pour ce modèle.', 402)
      }

      // Premier achat qui a encore des téléchargements disponibles
      let firstQuota: any = null

      for (const purchase of purchases) {
        const { data: quota } = await admin.rpc('generation_quota', { p_purchase_id: purchase.id })
        firstQuota = firstQuota ?? quota

        const expired = quota?.access_expires_at && new Date(quota.access_expires_at) < new Date()

        if (quota && quota.remaining > 0 && !expired) {
          purchaseId = purchase.id
          break
        }
      }

      if (!purchaseId) {
        return fail(req, 'quota_exceeded', ERROR_MAP.quota_exceeded.message, 429, {
          quota: firstQuota,
        })
      }

      templateId = wanted
    } else {
      return fail(req, 'invalid_request', 'purchase_token ou template_id requis.', 400)
    }

    /* ---------- Création du nonce (fonction SQL atomique) ---------- */
    const { data: result, error: nonceError } = await admin.rpc('create_generation_nonce', {
      p_purchase_id: purchaseId,
      p_format: format,
    })

    if (nonceError) {
      console.error('authorize-download : nonce', nonceError.message)
      return fail(req, 'server_error', 'Une erreur est survenue. Réessayez dans un instant.', 500)
    }

    if (!result?.ok) {
      const mapped = ERROR_MAP[result?.error] ?? {
        status: 400,
        message: 'Téléchargement impossible.',
      }
      return fail(req, result?.error ?? 'denied', mapped.message, mapped.status, {
        quota: result?.quota ?? undefined,
      })
    }

    return json(req, {
      success: true,
      nonce: result.nonce,
      expires_in: result.expires_in,
      format,
      template_id: templateId,
      remaining: result.remaining,
      max: result.max,
      generator_url: Deno.env.get('GENERATOR_URL') ?? null,
    })
  } catch (error) {
    console.error('authorize-download :', error)
    return fail(req, 'server_error', 'Une erreur est survenue. Réessayez dans un instant.', 500)
  }
})
