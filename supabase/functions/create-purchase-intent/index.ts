// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — EDGE FUNCTION : CREATE PURCHASE INTENT
Version 6.0 — YabetooPay Payment Intents (sans redirection)

Flux :
  1. Contrôle du modèle et du prix (base de données)
  2. Identification de l'acheteur (connecté ou invité)
  3. Limitation de débit (max 8 intentions / 10 minutes)
  4. Création de l'intention d'achat (pending_purchases)
  5a. Modèle gratuit : validé immédiatement (RPC complete_purchase)
  5b. Modèle payant : création d'un Payment Intent Yabetoo
      → Retourne payment_intent_id + client_secret au frontend
      → Le frontend appelle confirm-yabetoo-payment avec le numéro MoMo
      → Aucun lien de redirection : tout reste sur TakiDoc

Secrets utilisés :
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  YABETOO_SECRET_KEY
  SITE_URL, ALLOWED_ORIGINS
============================================================ */

import { allowedOrigins, preflight } from '../_shared/cors.ts';
import {
  adminClient,
  fail,
  getAuthUser,
  json,
  readJson,
} from '../_shared/http.ts';
import {
  cleanEmail,
  cleanName,
  cleanPhone,
  sanitizeDocumentData,
  TEMPLATE_ID_RE,
} from '../_shared/validation.ts';
import { createPaymentIntent, isSandbox } from '../_shared/yabetoo.ts';

/* ============================================================
   CONFIGURATION
============================================================ */

// Pas plus de 8 intentions d'achat par utilisateur / email en 10 minutes
const MAX_PENDING_PER_10_MIN = 8;

// Durée de la fenêtre de limitation de débit
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

// Longueur maximale du motif de refus (failure_reason)
const MAX_FAILURE_REASON_LENGTH = 300;

// Longueur maximale de la description envoyée à Yabetoo
const MAX_DESCRIPTION_LENGTH = 120;

/* ============================================================
   HANDLER PRINCIPAL
============================================================ */

Deno.serve(async (req) => {
  /* ---------- CORS preflight ---------- */
  const early = preflight(req);
  if (early) return early;

  /* ---------- Méthode autorisée ---------- */
  if (req.method !== 'POST') {
    return fail(req, 'method_not_allowed', 'Méthode non autorisée.', 405);
  }

  try {
    const admin = adminClient();

    /* ---------- Lecture et validation du corps ---------- */
    const body = await readJson(req);
    if (!body) {
      return fail(req, 'invalid_json', 'Requête invalide.', 400);
    }

    /* ==========================================================
       1. MODÈLE ET PRIX (source de vérité : base de données)
    ========================================================== */

    const templateId =
      typeof body.template_id === 'string' ? body.template_id.trim() : '';

    if (!TEMPLATE_ID_RE.test(templateId)) {
      return fail(req, 'invalid_template', 'Modèle invalide.', 400);
    }

    const { data: template, error: templateError } = await admin
      .from('templates')
      .select('id, name, price_xaf, is_active')
      .eq('id', templateId)
      .eq('is_active', true)
      .maybeSingle();

    if (templateError) {
      console.error(
        'create-purchase-intent : erreur lecture template',
        templateError.message,
      );
      return fail(
        req,
        'server_error',
        'Une erreur est survenue. Réessayez dans un instant.',
        500,
      );
    }

    if (!template) {
      return fail(
        req,
        'template_not_found',
        "Ce modèle n'est plus disponible.",
        404,
      );
    }

    const price = Number(template.price_xaf);

    if (!Number.isInteger(price) || price < 0) {
      console.error(
        'create-purchase-intent : prix invalide',
        template.id,
        template.price_xaf,
      );
      return fail(
        req,
        'server_error',
        'Une erreur est survenue. Réessayez dans un instant.',
        500,
      );
    }

    const isFree = price === 0;

    /* ==========================================================
       2. IDENTITÉ DE L'ACHETEUR
    ========================================================== */

    const user = await getAuthUser(admin, req);

    // L'email est prioritairement celui de l'utilisateur connecté,
    // sinon celui fourni par le navigateur (invité).
    let email = cleanEmail(user?.email) ?? cleanEmail(body.guest_email);
    let phone = cleanPhone(body.guest_phone);
    let name = cleanName(body.customer_name);

    if (user) {
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name, phone_number, email')
        .eq('id', user.id)
        .maybeSingle();

      // L'email connecté prime toujours
      email = cleanEmail(user.email) ?? cleanEmail(profile?.email) ?? email;

      // cleanPhone renvoie "" (jamais null) : on utilise || et non ??
      phone = phone || cleanPhone(profile?.phone_number);

      if (profile?.full_name) {
        name = cleanName(profile.full_name, name);
      }
    }

    // Sur le flux Payment Intent, le client saisit lui-même son numéro
    // Mobile Money dans la modale : seul l'email est exigé côté serveur.
    if (!isFree && !email) {
      return fail(
        req,
        'email_required',
        'Une adresse e-mail valide est nécessaire.',
        400,
      );
    }

    /* ==========================================================
       3. LIMITATION DE DÉBIT (anti-rafale)
    ========================================================== */

    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    let recent = admin
      .from('pending_purchases')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since);

    recent = user
      ? recent.eq('user_id', user.id)
      : recent.eq('guest_email', email ?? '');

    const { count } = await recent;

    if ((count ?? 0) >= MAX_PENDING_PER_10_MIN) {
      return fail(
        req,
        'too_many_attempts',
        'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
        429,
      );
    }

    /* ==========================================================
       4. CRÉATION DE L'INTENTION D'ACHAT
    ========================================================== */

    const purchaseToken = crypto.randomUUID();
    const documentData = sanitizeDocumentData(body.document_data);

    const { error: insertError } = await admin
      .from('pending_purchases')
      .insert({
        purchase_token: purchaseToken,
        template_id: template.id,
        user_id: user?.id ?? null,
        guest_email: email ?? '',
        guest_phone: phone ?? '',
        amount: price,
        payment_method: isFree ? 'free' : 'yabetoo',
        provider: isFree ? 'internal' : 'yabetoo',
        status: 'pending',
        document_data: documentData,
      });

    if (insertError) {
      console.error(
        'create-purchase-intent : erreur insertion',
        insertError.message,
      );
      return fail(
        req,
        'server_error',
        'Une erreur est survenue. Réessayez dans un instant.',
        500,
      );
    }

    /* ==========================================================
       5a. MODÈLE GRATUIT : validé immédiatement
    ========================================================== */

    if (isFree) {
      const { data: done, error: freeError } = await admin.rpc(
        'complete_purchase',
        {
          p_purchase_token: purchaseToken,
          p_provider_reference: `free_${purchaseToken}`,
          p_amount: 0,
          p_currency: 'XAF',
          p_payment_method: 'free',
        },
      );

      if (freeError || !done?.ok) {
        console.error(
          'create-purchase-intent : erreur achat gratuit',
          freeError?.message,
          done,
        );
        return fail(
          req,
          'server_error',
          'Une erreur est survenue. Réessayez dans un instant.',
          500,
        );
      }

      return json(req, {
        mode: 'free',
        status: 'completed',
        purchase_token: purchaseToken,
        template_id: template.id,
        template_name: template.name,
        amount: 0,
        currency: 'XAF',
      });
    }

    /* ==========================================================
       5b. MODÈLE PAYANT : Payment Intent Yabetoo (sans redirection)
    ========================================================== */

    const origin = (req.headers.get('Origin') ?? '').replace(/\/$/, '');
    const siteUrl = allowedOrigins().includes(origin)
      ? origin
      : (Deno.env.get('SITE_URL') ?? allowedOrigins()[0] ?? '').replace(
        /\/$/,
        '',
      );

    const returnUrl =
      `${siteUrl}/confirmation.html?token=${encodeURIComponent(purchaseToken)}`;

    try {
      // Création du Payment Intent chez Yabetoo
      const intent = await createPaymentIntent({
        amount: price,
        currency: 'xaf',
        description: `TakiDoc - ${template.name}`.slice(
          0,
          MAX_DESCRIPTION_LENGTH,
        ),
        metadata: {
          purchase_token: purchaseToken,
          template_id: String(template.id),
          template_name: String(template.name ?? '').slice(0, 80),
          customer_name: name || 'Client TakiDoc',
          customer_email: email ?? '',
          customer_phone: phone || '',
          return_url: returnUrl,
        },
      });

      // On mémorise la référence du Payment Intent
      const { error: updateError } = await admin
        .from('pending_purchases')
        .update({
          provider_reference: intent.id,
          authorization_url: returnUrl, // URL de retour après confirmation
        })
        .eq('purchase_token', purchaseToken);

      if (updateError) {
        // Non bloquant : le webhook retrouve aussi l'achat par
        // metadata.purchase_token
        console.error(
          'create-purchase-intent : erreur mise à jour référence',
          updateError.message,
        );
      }

      console.log(
        'create-purchase-intent : Payment Intent créé',
        {
          payment_intent_id: intent.id,
          purchase_token: purchaseToken,
          template_id: template.id,
          amount: price,
        },
      );

      // On retourne le client_secret au frontend pour qu'il puisse
      // confirmer le paiement avec le numéro Mobile Money
      return json(req, {
        mode: 'checkout',
        status: 'pending',
        purchase_token: purchaseToken,
        payment_intent_id: intent.id,
        client_secret: intent.clientSecret,
        template_id: template.id,
        template_name: template.name,
        amount: price,
        currency: 'XAF',
        sandbox: isSandbox(),
      });
    } catch (error) {
      const reason = error instanceof Error
        ? error.message
        : String(error);

      console.error(
        'create-purchase-intent : erreur création Payment Intent Yabetoo',
        reason,
      );

      await admin
        .from('pending_purchases')
        .update({
          status: 'failed',
          failure_reason: `init: ${reason}`.slice(0, MAX_FAILURE_REASON_LENGTH),
        })
        .eq('purchase_token', purchaseToken);

      return fail(
        req,
        'payment_provider_error',
        'Le service de paiement est momentanément indisponible.',
        502,
      );
    }
  } catch (error) {
    console.error('create-purchase-intent : erreur non gérée', error);
    return fail(
      req,
      'server_error',
      'Une erreur est survenue. Réessayez dans un instant.',
      500,
    );
  }
});