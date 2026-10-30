// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — EDGE FUNCTION : CONFIRM YABETOO PAYMENT
Version 1.1 — Correction : payment_method_data (et non payment_method)

Cette fonction est appelée par la modale de paiement du frontend
après que l'utilisateur a saisi son numéro Mobile Money et choisi
son opérateur (MTN / Airtel).

Flux :
  1. Vérification des paramètres (payment_intent_id, client_secret,
     operator, phone, purchase_token)
  2. Appel à Yabetoo POST /v1/payment-intents/{id}/confirm
     avec le champ payment_method_data (obligatoire)
  3. Retour du statut au frontend qui lance le polling

Secrets utilisés :
  YABETOO_SECRET_KEY
  SITE_URL, ALLOWED_ORIGINS
============================================================ */

import { allowedOrigins, preflight } from '../_shared/cors.ts';
import { fail, json, readJson } from '../_shared/http.ts';
import { confirmPaymentIntent } from '../_shared/yabetoo.ts';

/* ============================================================
   VALIDATION DES ENTRÉES
============================================================ */

const OPERATOR_RE = /^(MTN|AIRTEL)$/i;
const PHONE_RE = /^\+?[0-9]{9,15}$/;

function validateOperator(value: unknown): string {
  if (typeof value !== 'string') return '';
  const upper = value.toUpperCase();
  return OPERATOR_RE.test(upper) ? upper : '';
}

function validatePhone(value: unknown): string {
  if (typeof value !== 'string') return '';
  const cleaned = value.replace(/[\s().-]/g, '');
  return PHONE_RE.test(cleaned) ? cleaned : '';
}

function validatePaymentIntentId(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  // Les Payment Intents Yabetoo commencent par "pi_"
  return trimmed.startsWith('pi_') && trimmed.length > 10 ? trimmed : '';
}

function validateClientSecret(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.includes('_secret_') && trimmed.length > 20 ? trimmed : '';
}

function validatePurchaseToken(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  // UUID v4 format
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)
    ? trimmed
    : '';
}

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
    /* ---------- Lecture et validation du corps ---------- */
    const body = await readJson(req);
    if (!body) {
      return fail(req, 'invalid_json', 'Requête invalide.', 400);
    }

    const paymentIntentId = validatePaymentIntentId(body.payment_intent_id);
    const clientSecret = validateClientSecret(body.client_secret);
    const operator = validateOperator(body.operator);
    const phone = validatePhone(body.phone);
    const purchaseToken = validatePurchaseToken(body.purchase_token);

    if (!paymentIntentId) {
      return fail(req, 'invalid_payment_intent', 'Identifiant de paiement invalide.', 400);
    }
    if (!clientSecret) {
      return fail(req, 'invalid_client_secret', 'Secret client invalide.', 400);
    }
    if (!operator) {
      return fail(req, 'invalid_operator', "Opérateur invalide. Choisissez MTN ou Airtel.", 400);
    }
    if (!phone) {
      return fail(req, 'invalid_phone', "Numéro de téléphone invalide (format: +242065186967).", 400);
    }
    if (!purchaseToken) {
      return fail(req, 'invalid_purchase_token', "Jeton d'achat invalide.", 400);
    }

    /* ---------- URL de retour ---------- */
    const origin = (req.headers.get('Origin') ?? '').replace(/\/$/, '');
    const siteUrl = allowedOrigins().includes(origin)
      ? origin
      : (Deno.env.get('SITE_URL') ?? allowedOrigins()[0] ?? '').replace(
        /\/$/,
        '',
      );

    const returnUrl =
      `${siteUrl}/confirmation.html?token=${encodeURIComponent(purchaseToken)}`;

    /* ---------- Confirmation auprès de Yabetoo ---------- */
    console.log(
      'confirm-yabetoo-payment : confirmation en cours',
      {
        payment_intent_id: paymentIntentId,
        operator,
        phone: phone.replace(/\d{4}$/, '****'), // masqué dans les logs
        purchase_token: purchaseToken,
      },
    );

    const result = await confirmPaymentIntent({
      paymentIntentId,
      clientSecret,
      operator: operator as 'MTN' | 'AIRTEL',
      phone,
      returnUrl,
    });

    console.log(
      'confirm-yabetoo-payment : confirmation réussie',
      {
        payment_intent_id: result.id,
        status: result.status,
      },
    );

    /* ---------- Réponse au frontend ---------- */
    return json(req, {
      success: true,
      status: result.status,
      payment_intent_id: result.id,
      purchase_token: purchaseToken,
      message: 'Paiement initié. Veuillez valider sur votre téléphone.',
    });
  } catch (error) {
    const reason = error instanceof Error
      ? error.message
      : String(error);

    console.error(
      'confirm-yabetoo-payment : erreur',
      reason,
    );

    // Distinguer les erreurs Yabetoo (4xx) des erreurs internes (5xx)
    if (reason.includes('HTTP 4')) {
      return fail(
        req,
        'payment_failed',
        `Le paiement a été refusé : ${reason}. Vérifiez votre numéro et réessayez.`,
        400,
      );
    }

    return fail(
      req,
      'server_error',
      'Une erreur est survenue. Réessayez dans un instant.',
      500,
    );
  }
});