/* ============================================================
   TAKIDOC — DOCUMENTS CONSERVÉS 72 H (côté navigateur)
   Fichier : js/saved-documents.js

   Expose  window.TakiSavedDocs  avec :

     list(supabase)
        → { retention_hours, documents: [{ purchase_id, template_id,
            template_name, created_at, expires_at, hours_left }] }

     remove(supabase, purchaseId)
        → supprime le document conservé avant les 72 h

     download({ supabase, purchaseToken | templateId, format })
        → demande l'autorisation, récupère le document conservé,
          le fait générer par le serveur de génération et déclenche
          l'enregistrement du fichier.
        → { fileName, remaining, max, documentExpiresAt }

   « supabase » est le client déjà créé sur ton site
   (celui de createClient). Il envoie tout seul le jeton de connexion.

   Erreurs : toutes sont des Error avec .code et .status, par exemple
     document_expired  (72 h écoulées)  login_required  quota_exceeded
     payment_required  generator_error  ...
============================================================ */

(function () {
  'use strict';

  /* ---------- Appel d'une Edge Function avec erreur lisible ---------- */
  async function invoke(supabase, name, body) {
    const { data, error } = await supabase.functions.invoke(name, { body: body || {} });

    if (!error) return data;

    let payload = null;
    try {
      payload = await error.context.json();
    } catch (_) { /* pas de JSON dans la réponse */ }

    const code =
      (payload && typeof payload.error === 'string' && payload.error) ||
      (payload && payload.error && payload.error.code) ||
      (payload && payload.code) ||
      'request_failed';

    const message =
      (payload && payload.message) ||
      (payload && payload.error && payload.error.message) ||
      error.message ||
      'Une erreur est survenue.';

    const err = new Error(message);
    err.code = code;
    err.status = error.context && error.context.status ? error.context.status : null;
    err.details = payload;
    throw err;
  }

  /* ---------- URL de l'endpoint de génération ---------- */
  function generatorEndpoint(generatorUrl) {
    const base = String(generatorUrl || '').trim().replace(/\/+$/, '');
    if (!base) {
      const err = new Error('Le service de génération n\'est pas configuré.');
      err.code = 'generator_not_configured';
      throw err;
    }
    return /\/api\/generate$/i.test(base) ? base : base + '/api/generate';
  }

  /* ---------- Nom de fichier depuis Content-Disposition ---------- */
  function fileNameFrom(response, fallback) {
    const header = response.headers.get('Content-Disposition') || '';
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
    if (!match) return fallback;
    try {
      return decodeURIComponent(match[1]);
    } catch (_) {
      return match[1];
    }
  }

  function saveBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }

  /* ---------- API publique ---------- */
  function list(supabase) {
    return invoke(supabase, 'my-documents', { action: 'list' });
  }

  function remove(supabase, purchaseId) {
    return invoke(supabase, 'my-documents', { action: 'delete', purchase_id: purchaseId });
  }

  async function download(options) {
    const supabase = options && options.supabase;
    const format = options && options.format === 'docx' ? 'docx' : 'pdf';

    if (!supabase) throw new Error('Client Supabase manquant.');
    if (!options.purchaseToken && !options.templateId) {
      throw new Error('purchaseToken ou templateId requis.');
    }

    /* 1. Autorisation + récupération du document conservé */
    const body = { format: format, with_document: true };
    if (options.purchaseToken) body.purchase_token = options.purchaseToken;
    else body.template_id = options.templateId;

    const auth = await invoke(supabase, 'authorize-download', body);

    if (!auth.document) {
      const err = new Error('Aucun document conservé pour cet achat.');
      err.code = 'document_missing';
      throw err;
    }

    /* 2. Génération du fichier par le serveur */
    const response = await fetch(generatorEndpoint(auth.generator_url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nonce: auth.nonce,
        template_id: auth.template_id,
        format: auth.format,
        data: auth.document
      })
    });

    if (!response.ok) {
      let message = 'La génération du fichier a échoué. Réessayez dans un instant.';
      try {
        const payload = await response.json();
        if (payload && payload.error) message = payload.error;
      } catch (_) { /* réponse non JSON */ }

      // Le serveur de génération restitue le téléchargement en cas d'échec
      const err = new Error(message);
      err.code = 'generator_error';
      err.status = response.status;
      throw err;
    }

    /* 3. Enregistrement du fichier */
    const blob = await response.blob();
    const fileName = fileNameFrom(response, 'TakiDoc_document.' + auth.format);
    saveBlob(blob, fileName);

    return {
      fileName: fileName,
      remaining: auth.remaining,
      max: auth.max,
      documentExpiresAt: auth.document_expires_at
    };
  }

  window.TakiSavedDocs = { list: list, remove: remove, download: download };
})();
