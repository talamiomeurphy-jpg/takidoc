// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — EDGE FUNCTION : CREATE PURCHASE INTENT
Version 3.0 — Notch Pay

Appelée depuis l'éditeur quand l'utilisateur clique sur « Payer ».

Corps attendu :
  {
    template_id: string,
    guest_email?: string,          // invité uniquement
    guest_phone?: string,          // obligatoire pour un modèle payant
    customer_name?: string,
    document_data?: object         // champs, couleur, police (sans la photo)
  }

Sécurité :
  - l'utilisateur est identifié par son JETON de connexion, jamais par le corps
  - le PRIX est lu en base de données, jamais envoyé par le navigateur
  - création de l'achat uniquement ici (service_role) : le navigateur n'écrit rien
============================================================ */

import { allowedOrigins, preflight } from '../_shared/cors.ts'
import { adminClient, fail, getAuthUser, json, readJson } from '../_shared/http.ts'
import {
  cleanEmail,
  cleanName,
  cleanPhone,
  sanitizeDocumentData,
  TEMPLATE_ID_RE,
} from '../_shared/validation.ts'
import { initializePayment, isSandbox, NotchError } from '../_shared/notchpay.ts'

const MAX_PENDING_PER_10_MIN = 8

Deno.serve(async (req) => {
  const early = preflight(req)
  if (early) return early

  if (req.method !== 'POST') {
    return fail(req, 'method_not_allowed', 'Méthode non autorisée.', 405)
  }

  try {
    const admin = adminClient()

    const body = await readJson(req)
    if (!body) return fail(req, 'invalid_json', 'Requête invalide.', 400)

    /* ---------- 1. Modèle et prix (source : base de données) ---------- */
    const templateId = typeof body.template_id === 'string' ? body.template_id.trim() : ''

    if (!TEMPLATE_ID_RE.test(templateId)) {
      return fail(req, 'invalid_template', 'Modèle invalide.', 400)
    }

    const { data: template, error: templateError } = await admin
      .from('templates')
      .select('id, name, price_xaf, is_active')
      .eq('id', templateId)
      .eq('is_active', true)
      .maybeSingle()

    if (templateError) {
      console.error('create-purchase-intent : template', templateError.message)
      return fail(req, 'server_error', 'Une erreur est survenue. Réessayez dans un instant.', 500)
    }

    if (!template) {
      return fail(req, 'template_not_found', 'Ce modèle n’est plus disponible.', 404)
    }

    const price = Number(template.price_xaf)

    if (!Number.isInteger(price) || price < 0) {
      console.error('create-purchase-intent : prix invalide', template.id, template.price_xaf)
      return fail(req, 'server_error', 'Une erreur est survenue. Réessayez dans un instant.', 500)
    }

    const isFree = price === 0

    /* ---------- 2. Identité de l'acheteur ---------- */
    const user = await getAuthUser(admin, req)

    let email = cleanEmail(user?.email) ?? cleanEmail(body.guest_email)
    let phone = cleanPhone(body.guest_phone)
    let name = cleanName(body.customer_name)

    if (user) {
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name, phone_number, email')
        .eq('id', user.id)
        .maybeSingle()

      email = cleanEmail(user.email) ?? cleanEmail(profile?.email) ?? email
      phone = phone ?? cleanPhone(profile?.phone_number)
      if (profile?.full_name) name = cleanName(profile.full_name, name)
    }

    if (!isFree) {
      if (!email) {
        return fail(req, 'email_required', 'Une adresse e-mail valide est nécessaire.', 400)
      }
      if (!phone) {
        return fail(
          req,
          'phone_required',
          'Un numéro de téléphone valide est nécessaire (ex. 06 123 45 67).',
          400,
        )
      }
    }

    /* ---------- 3. Limitation : pas plus de 8 intentions en 10 minutes ---------- */
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    let recent = admin
      .from('pending_purchases')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since)

    recent = user ? recent.eq('user_id', user.id) : recent.eq('guest_email', email ?? '')

    const { count } = await recent

    if ((count ?? 0) >= MAX_PENDING_PER_10_MIN) {
      return fail(
        req,
        'too_many_attempts',
        'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
        429,
      )
    }

    /* ---------- 4. Création de l'intention d'achat ---------- */
    const purchaseToken = crypto.randomUUID()

    const { error: insertError } = await admin.from('pending_purchases').insert({
      purchase_token: purchaseToken,
      template_id: template.id,
      user_id: user?.id ?? null,
      guest_email: email ?? '',
      guest_phone: phone ?? '',
      amount: price,
      payment_method: isFree ? 'free' : 'notchpay',
      provider: isFree ? 'internal' : 'notchpay',
      status: 'pending',
      document_data: sanitizeDocumentData(body.document_data),
    })

    if (insertError) {
      console.error('create-purchase-intent : insertion', insertError.message)
      return fail(req, 'server_error', 'Une erreur est survenue. Réessayez dans un instant.', 500)
    }

    /* ---------- 5a. Modèle gratuit : validé immédiatement ---------- */
    if (isFree) {
      const { data: done, error: freeError } = await admin.rpc('complete_purchase', {
        p_purchase_token: purchaseToken,
        p_provider_reference: `free_${purchaseToken}`,
        p_amount: 0,
        p_currency: 'XAF',
        p_payment_method: 'free',
      })

      if (freeError || !done?.ok) {
        console.error('create-purchase-intent : gratuit', freeError?.message, done)
        return fail(req, 'server_error', 'Une erreur est survenue. Réessayez dans un instant.', 500)
      }

      return json(req, {
        mode: 'free',
        status: 'completed',
        purchase_token: purchaseToken,
        template_id: template.id,
        template_name: template.name,
        amount: 0,
        currency: 'XAF',
      })
    }

    /* ---------- 5b. Modèle payant : page de paiement Notch Pay ---------- */
    // Retour sur le site qui a lancé l'achat (liste blanche), sinon sur SITE_URL
    const origin = (req.headers.get('Origin') ?? '').replace(/\/$/, '')
    const siteUrl = allowedOrigins().includes(origin)
      ? origin
      : (Deno.env.get('SITE_URL') ?? allowedOrigins()[0] ?? '').replace(/\/$/, '')

    const callback = `${siteUrl}/confirmation.html?token=${encodeURIComponent(purchaseToken)}`

    try {
      const payment = await initializePayment({
        amount: price,
        currency: 'XAF',
        reference: purchaseToken,
        description: `TakiDoc — ${template.name}`.slice(0, 120),
        callback,
        customer: { name, email: email!, phone: phone! },
      })

      await admin
        .from('pending_purchases')
        .update({
          provider_reference: payment.reference,
          authorization_url: payment.authorizationUrl,
        })
        .eq('purchase_token', purchaseToken)

      return json(req, {
        mode: 'checkout',
        status: 'pending',
        purchase_token: purchaseToken,
        authorization_url: payment.authorizationUrl,
        template_id: template.id,
        template_name: template.name,
        amount: price,
        currency: 'XAF',
        sandbox: isSandbox(),
      })
    } catch (error) {
      const reason = error instanceof NotchError ? error.message : String(error)
      console.error('create-purchase-intent : Notch Pay', reason)

      await admin
        .from('pending_purchases')
        .update({ status: 'failed', failure_reason: `init: ${reason}`.slice(0, 300) })
        .eq('purchase_token', purchaseToken)

      return fail(
        req,
        'payment_provider_error',
        'Le service de paiement est momentanément indisponible. Réessayez dans un instant.',
        502,
      )
    }
  } catch (error) {
    console.error('create-purchase-intent :', error)
    return fail(req, 'server_error', 'Une erreur est survenue. Réessayez dans un instant.', 500)
  }
})
