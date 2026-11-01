// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — EDGE FUNCTION : MY DOCUMENTS
Version 1.0 — Documents payés encore conservés (72 h)

Réservée aux utilisateurs connectés.

Corps :
  {}                                              → liste
  { action: 'list' }                              → liste
  { action: 'delete', purchase_id: '<uuid>' }     → supprime le document conservé

Réponse (liste) :
  {
    retention_hours: 72,
    documents: [
      { purchase_id, template_id, template_name, created_at, expires_at, hours_left }
    ]
  }
============================================================ */

import { preflight } from '../_shared/cors.ts'
import { adminClient, fail, getAuthUser, json, readJson, UUID_RE } from '../_shared/http.ts'

const RETENTION_HOURS = 72

Deno.serve(async (req) => {
  const early = preflight(req)
  if (early) return early

  if (req.method !== 'POST') {
    return fail(req, 'method_not_allowed', 'Méthode non autorisée.', 405)
  }

  try {
    const admin = adminClient()
    const user = await getAuthUser(admin, req)

    if (!user) {
      return fail(req, 'login_required', 'Connectez-vous pour voir vos documents.', 401)
    }

    // Corps facultatif : une requête vide équivaut à « list »
    const body: any = (await readJson(req, 2_000)) ?? {}
    const action = typeof body.action === 'string' ? body.action : 'list'

    /* ---------- Suppression anticipée ---------- */
    if (action === 'delete') {
      const purchaseId = typeof body.purchase_id === 'string' ? body.purchase_id.trim() : ''
      if (!UUID_RE.test(purchaseId)) {
        return fail(req, 'invalid_purchase', 'Achat invalide.', 400)
      }

      const { data, error } = await admin
        .from('purchase_documents')
        .delete()
        .eq('purchase_id', purchaseId)
        .eq('user_id', user.id) // on ne supprime que ses propres documents
        .select('purchase_id')

      if (error) {
        console.error('my-documents : suppression', error.message)
        return fail(req, 'server_error', 'Une erreur est survenue.', 500)
      }

      if (!data?.length) {
        return fail(req, 'document_not_found', 'Document introuvable.', 404)
      }

      return json(req, { success: true, deleted: purchaseId })
    }

    if (action !== 'list') {
      return fail(req, 'invalid_action', 'Action inconnue.', 400)
    }

    /* ---------- Liste ---------- */
    const nowIso = new Date().toISOString()

    const { data: rows, error } = await admin
      .from('purchase_documents')
      .select('purchase_id, template_id, created_at, expires_at')
      .eq('user_id', user.id)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('my-documents : lecture', error.message)
      return fail(req, 'server_error', 'Une erreur est survenue.', 500)
    }

    const templateIds = [...new Set((rows ?? []).map((r: any) => r.template_id))]
    const names = new Map<string, string>()

    if (templateIds.length) {
      const { data: templates } = await admin
        .from('templates')
        .select('id, name')
        .in('id', templateIds)

      for (const t of templates ?? []) names.set(t.id, t.name)
    }

    const documents = (rows ?? []).map((row: any) => ({
      purchase_id: row.purchase_id,
      template_id: row.template_id,
      template_name: names.get(row.template_id) ?? null,
      created_at: row.created_at,
      expires_at: row.expires_at,
      hours_left: Math.max(
        0,
        Math.floor((new Date(row.expires_at).getTime() - Date.now()) / 3_600_000),
      ),
    }))

    return json(req, { retention_hours: RETENTION_HOURS, documents })
  } catch (error) {
    console.error('my-documents :', error)
    return fail(req, 'server_error', 'Une erreur est survenue.', 500)
  }
})
