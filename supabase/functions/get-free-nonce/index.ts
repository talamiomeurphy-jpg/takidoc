// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — EDGE FUNCTION : GET FREE NONCE
Génère un nonce de génération pour les modèles GRATUITS
(sans exiger d'achat préalable)

Corps attendu :
  { template_id: string, format: 'pdf' | 'docx' }

Réponse :
  { nonce: string, expires_in: number, template_name: string }
============================================================ */

import { preflight } from '../_shared/cors.ts'
import { adminClient, fail, json, readJson } from '../_shared/http.ts'
import { TEMPLATE_ID_RE } from '../_shared/validation.ts'

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

    const templateId = typeof body.template_id === 'string' ? body.template_id.trim() : ''
    if (!TEMPLATE_ID_RE.test(templateId)) {
      return fail(req, 'invalid_template', 'Modèle invalide.', 400)
    }

    const format = body.format === 'docx' ? 'docx' : 'pdf'

    // Vérifier que le template existe et est GRATUIT
    const { data: template, error: tplError } = await admin
      .from('templates')
      .select('id, name, price_xaf, is_active')
      .eq('id', templateId)
      .eq('is_active', true)
      .maybeSingle()

    if (tplError) {
      console.error('get-free-nonce : template', tplError.message)
      return fail(req, 'server_error', 'Erreur serveur.', 500)
    }

    if (!template) {
      return fail(req, 'template_not_found', 'Modèle introuvable.', 404)
    }

    if (template.price_xaf !== 0) {
      return fail(req, 'not_free', 'Ce modèle nécessite un paiement.', 403)
    }

    // Créer un nonce de génération (valable 10 minutes)
    const nonce = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: insertError } = await admin
      .from('generation_nonces')
      .insert({
        nonce: nonce,
        template_id: templateId,
        format: format,
        expires_at: expiresAt,
        used: false,
      })

    if (insertError) {
      console.error('get-free-nonce : insertion', insertError.message)
      return fail(req, 'server_error', 'Erreur création nonce.', 500)
    }

    console.log('get-free-nonce : nonce créé', { nonce: nonce.slice(0, 8) + '...', template_id: templateId })

    return json(req, {
      nonce: nonce,
      expires_in: 600, // 10 minutes en secondes
      template_id: templateId,
      template_name: template.name,
      format: format,
    })
  } catch (error) {
    console.error('get-free-nonce :', error)
    return fail(req, 'server_error', 'Erreur serveur.', 500)
  }
})