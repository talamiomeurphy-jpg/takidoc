/* TakiDoc — js/profile.js : logique de la page « Mon espace » */
(() => {
'use strict';

/* ================= CONFIG (à adapter) ================= */
const SUPABASE_URL = 'https://wyfkogowsdbxctbpfuud.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM';
const LOGIN_URL    = 'auth.html?action=login';                       // page de connexion
const HOME_URL     = 'index.html';
const templateUrl = (id) => `editor.html?id=${encodeURIComponent(id)}`; // page d'un modèle
const resetRedirect = new URL('reset-password.html', location.href).href;     // retour après reset mot de passe

/* ================= Helpers ================= */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const fmtXAF = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
const safeUrl = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };
const initials = (n, mail) => {
  const s = (n || mail || 'TD').trim().split(/[\s@.]+/).filter(Boolean);
  return ((s[0]?.[0] || 'T') + (s[1]?.[0] || '')).toUpperCase();
};

const state = { user: null, profile: null, favs: [], docs: [], buys: [], notes: [] };
let db = null;

function getDb() {
  const existing = window.supabaseClient || window.sb || window.db || window._supabase;
  if (existing?.auth) return existing;
  if (!window.supabase?.createClient) return null;
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

/* ================= UI feedback ================= */
let toastT;
function toast(msg, err = false) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.toggle('err', err); t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200);
}
function showAlert(msg, type = 'error') {
  const a = $('#alert'); if (!a) return;
  a.className = `alert show ${type}`;
  a.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span>${esc(msg)}</span>`;
}
const loading = '<div class="load"><i class="fa-solid fa-spinner fa-spin"></i>Chargement…</div>';
const empty = (icon, title, text, cta = '') =>
  `<div class="empty"><i class="fa-solid ${icon}"></i><h3>${esc(title)}</h3><p>${esc(text)}</p>${cta}</div>`;
const browseBtn = `<a class="bt p" href="${HOME_URL}#catalog"><i class="fa-solid fa-magnifying-glass"></i>Explorer les modèles</a>`;

/* ================= Navigation ================= */
const VIEWS = ['overview', 'favorites', 'documents', 'purchases', 'notifications', 'settings'];
function go(view, push = true) {
  if (!VIEWS.includes(view)) view = 'overview';
  $$('.view').forEach(v => v.classList.toggle('on', v.id === `v-${view}`));
  $$('.sl[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === view));
  if (push && location.hash !== `#${view}`) history.replaceState(null, '', `#${view}`);
  if (view === 'favorites') fitPreviews();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-view]');
  if (b) { e.preventDefault(); go(b.dataset.view); }
});
window.addEventListener('hashchange', () => go(location.hash.slice(1), false));

/* ================= Aperçus de modèles ================= */

/* =========================================================
   APERÇUS DES MODÈLES — TAKIDOC
   - Miniatures proportionnelles au format A4
   - Images complètes, sans recadrage
   - Iframe dimensionné et centré dans son conteneur
   - Compatibilité avec les favoris et la vue d'ensemble
   ========================================================= */

const PREVIEW_WIDTH = 794;
const PREVIEW_HEIGHT = 1123;

function previewHTML(t) {
  const id = t.id ?? '';
  const link = templateUrl(id);
  let inner = '';

  const imageUrl = safeUrl(t.preview_image_url);

  if (imageUrl) {
    inner = `
      <img
        src="${esc(imageUrl)}"
        alt="Aperçu du document ${esc(t.name || '')}"
        loading="lazy"
        decoding="async"
      >`;
  } else if (t.html_structure) {
    /*
     * Le contenu du modèle reste dans un iframe isolé.
     * Le CSS du modèle est conservé, mais la page d'aperçu
     * reçoit une base de dimensions cohérente.
     */
    const css = String(t.css_styles || '');

    const doc = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html {
    width: 100%;
    min-height: 100%;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  body {
    width: 100%;
    min-height: 100%;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden;
    background: #fff !important;
  }

  img {
    max-width: 100%;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }
</style>
<style>${css}</style>
</head>
<body>${t.html_structure}</body>
</html>`;

    inner = `
      <iframe
        sandbox
        tabindex="-1"
        loading="lazy"
        title="Aperçu du document ${esc(t.name || '')}"
        srcdoc="${esc(doc)}"
        width="${PREVIEW_WIDTH}"
        height="${PREVIEW_HEIGHT}"
      ></iframe>`;
  }

  return `
    <div class="pv${inner ? '' : ' ready'}">
      <div class="ph0" aria-hidden="true">
        <i class="fa-regular fa-file-lines"></i>
      </div>
      ${inner}
      <a
        href="${esc(link)}"
        aria-label="Ouvrir le modèle ${esc(t.name || '')}"
        title="Ouvrir ce modèle"
      ></a>`;
}

/*
 * Ajuste la page complète à la zone A4.
 * On utilise la plus petite échelle permise par la largeur
 * et la hauteur disponibles : aucun débordement du document.
 */
function fitPreviews(root = document) {
  $$('.pv iframe', root).forEach(frame => {
    const container = frame.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;

    const scale = Math.min(
      width / PREVIEW_WIDTH,
      height / PREVIEW_HEIGHT
    );

    const renderedWidth = PREVIEW_WIDTH * scale;
    const renderedHeight = PREVIEW_HEIGHT * scale;

    frame.style.width = `${PREVIEW_WIDTH}px`;
    frame.style.height = `${PREVIEW_HEIGHT}px`;
    frame.style.transformOrigin = 'top left';
    frame.style.transform = `scale(${scale})`;
    frame.style.left = `${Math.max(0, (width - renderedWidth) / 2)}px`;
    frame.style.top = `${Math.max(0, (height - renderedHeight) / 2)}px`;
  });
}

/*
 * Attend les images et iframes pour retirer l'indicateur
 * de chargement. Le délai de secours évite de laisser
 * indéfiniment une miniature bloquée en chargement.
 */
function bindPreviewLoad(root = document) {
  $$('.pv', root).forEach(pv => {
    const media = $('img, iframe', pv);

    if (!media) {
      pv.classList.add('ready');
      return;
    }

    const done = () => {
      pv.classList.add('ready');
      fitPreviews(pv);
    };

    if (media.tagName === 'IMG') {
      if (media.complete) {
        done();
      } else {
        media.addEventListener('load', done, { once: true });
        media.addEventListener('error', done, { once: true });
      }
    } else {
      media.addEventListener('load', done, { once: true });
      media.addEventListener('error', done, { once: true });
    }
  });

  fitPreviews(root);
}

window.addEventListener('resize', () => fitPreviews());


/* ================= Rendu ================= */
function favCard(f, removable = true) {
  const t = f.templates || {};
  const price = t.price_xaf === 0 ? '<b class="free">Gratuit</b>' : `<b>${fmtXAF(t.price_xaf)}</b>`;
  return `<article class="fc" data-id="${esc(f.id)}">
    ${previewHTML({ ...t, id: f.template_id })}
      ${removable ? `<button class="rm" data-rm="${esc(f.id)}" title="Retirer des favoris" aria-label="Retirer des favoris"><i class="fa-solid fa-heart"></i></button>` : ''}
    </div>
    <div class="fi"><small>${esc(t.template_categories?.name || 'Modèle')}</small><h3>${esc(t.name || f.template_id)}</h3>
    <div class="fr">${price}<a class="bt s" href="${templateUrl(f.template_id)}">Utiliser</a></div></div></article>`;
}

function renderCounts() {
  const unread = state.notes.filter(n => !n.is_read).length;
  const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  set('#n-fav', state.favs.length); set('#s-fav', state.favs.length);
  set('#n-doc', state.docs.length); set('#s-doc', state.docs.length);
  set('#n-buy', state.buys.length); set('#s-buy', state.buys.length);
  set('#n-not', unread);            set('#s-not', unread);
}

function renderProfile() {
  const p = state.profile || {}, mail = p.email || state.user.email;
  const name = p.full_name || '';
  const first = name.split(' ')[0];
  $('#hello').textContent = first ? `Bonjour ${first} !` : 'Bonjour !';
  $('#p-name').textContent = name || 'Mon compte';
  $('#p-mail').textContent = mail;
  $('#joined').textContent = fmtDate(p.created_at || state.user.created_at);
  const av = $('#av'), url = safeUrl(p.avatar_url);
  if (url) {
    av.innerHTML = `<img src="${esc(url)}" alt="Photo de profil">`;
    $('img', av).addEventListener('error', () => { av.textContent = initials(name, mail); });
  } else av.textContent = initials(name, mail);
  $('#i-name').value = name; $('#i-mail').value = mail; $('#i-tel').value = p.phone_number || '';
  $('#i-av').value = p.avatar_url || '';
}

function renderFavorites() {
  const ov = $('#ov-fav');
  ov.innerHTML = state.favs.length
    ? `<div class="grid">${state.favs.slice(0, 4).map(f => favCard(f, false)).join('')}</div>`
    : empty('fa-heart', 'Aucun favori pour le moment', 'Ajoutez des modèles à vos favoris pour les retrouver ici.', browseBtn);
  bindPreviewLoad(ov);

  const q = ($('#q-fav').value || '').trim().toLowerCase();
  const list = state.favs.filter(f => !q || (f.templates?.name || '').toLowerCase().includes(q));
  const box = $('#fav-list');
  box.innerHTML = list.length
    ? `<div class="grid">${list.map(f => favCard(f)).join('')}</div>`
    : (state.favs.length
        ? empty('fa-magnifying-glass', 'Aucun résultat', 'Aucun favori ne correspond à votre recherche.')
        : empty('fa-heart', 'Aucun favori', 'Cliquez sur le cœur d’un modèle pour l’enregistrer ici.', browseBtn));
  bindPreviewLoad(box);
}

function renderDocuments() {
  const q = ($('#q-doc').value || '').trim().toLowerCase();
  const list = state.docs.filter(d => !q || (d.templates?.name || '').toLowerCase().includes(q));
  const box = $('#doc-list');
  if (!list.length) {
    box.innerHTML = state.docs.length
      ? empty('fa-magnifying-glass', 'Aucun résultat', 'Aucun document ne correspond à votre recherche.')
      : empty('fa-file-circle-plus', 'Aucun document', 'Vos documents apparaîtront ici après un achat.', browseBtn);
    return;
  }
  box.innerHTML = `<div class="tw"><table><thead><tr><th>Document</th><th>Créé le</th><th>Modifié le</th><th>Fichier</th></tr></thead><tbody>${
    list.map(d => {
      const pdf = safeUrl(d.generated_pdf_url);
      return `<tr><td><b>${esc(d.templates?.name || d.template_id)}</b><small>${esc(d.template_id)}</small></td>
        <td>${fmtDate(d.created_at)}</td><td>${fmtDate(d.updated_at)}</td>
        <td>${pdf
          ? `<a class="bt s" href="${esc(pdf)}" target="_blank" rel="noopener"><i class="fa-regular fa-file-pdf"></i>Ouvrir le PDF</a>`
          : '<span class="tag n">PDF en préparation</span>'}</td></tr>`;
    }).join('')}</tbody></table></div>`;
}

const STATUS = {
  paid: ['ok', 'Payé'], completed: ['ok', 'Payé'], success: ['ok', 'Payé'], succeeded: ['ok', 'Payé'], successful: ['ok', 'Payé'],
  pending: ['w', 'En attente'], processing: ['w', 'En cours'],
  failed: ['e', 'Échoué'], cancelled: ['e', 'Annulé'], canceled: ['e', 'Annulé'], expired: ['e', 'Expiré'], refunded: ['n', 'Remboursé']
};
const METHODS = { mtn: 'MTN Mobile Money', airtel: 'Airtel Money', card: 'Carte bancaire' };

function renderPurchases() {
  const box = $('#buy-list');
  if (!state.buys.length) {
    box.innerHTML = empty('fa-bag-shopping', 'Aucun achat', 'Vos achats et leur statut de paiement s’afficheront ici.', browseBtn);
    return;
  }
  box.innerHTML = `<div class="tw"><table><thead><tr><th>Modèle</th><th>Date</th><th>Montant</th><th>Paiement</th><th>Statut</th></tr></thead><tbody>${
    state.buys.map(b => {
      const [cls, label] = STATUS[(b.payment_status || '').toLowerCase()] || ['n', b.payment_status || '—'];
      const m = METHODS[(b.payment_method || '').toLowerCase()] || b.payment_method || '—';
      return `<tr><td><b>${esc(b.templates?.name || b.template_id)}</b><small>${esc(b.payment_reference || '')}</small></td>
        <td>${fmtDateTime(b.created_at)}</td><td><b>${fmtXAF(b.amount_paid)}</b></td><td>${esc(m)}</td>
        <td><span class="tag ${cls}">${esc(label)}</span></td></tr>`;
    }).join('')}</tbody></table></div>`;
}

const NOTE_ICONS = { info: 'fa-circle-info', success: 'fa-circle-check', purchase: 'fa-bag-shopping', payment: 'fa-credit-card', warning: 'fa-triangle-exclamation', error: 'fa-circle-exclamation', document: 'fa-file-lines' };

function renderNotifications() {
  const box = $('#not-list');
  $('#read-all').hidden = !state.notes.some(n => !n.is_read);
  if (!state.notes.length) {
    box.innerHTML = empty('fa-bell-slash', 'Aucune notification', 'Vous êtes à jour. Les nouveaux messages apparaîtront ici.');
    return;
  }
  box.innerHTML = state.notes.map(n => {
    const link = n.link && (safeUrl(n.link) || (/^[\w./?#=&%-]+$/.test(n.link) ? n.link : ''));
    return `<div class="nt${n.is_read ? '' : ' new'}" data-id="${esc(n.id)}">
      <i class="fa-solid ${NOTE_ICONS[n.type] || 'fa-bell'}"></i>
      <div><h3>${esc(n.title)}</h3><p>${esc(n.message)}</p><small>${fmtDateTime(n.created_at)}</small></div>
      <div>${link ? `<a class="bt s" href="${esc(link)}" data-open="${esc(n.id)}">Voir</a>` : ''}
      ${n.is_read ? '' : `<button class="bt s" data-read="${esc(n.id)}"><i class="fa-solid fa-check"></i>Lu</button>`}
      <button class="bt s" data-del="${esc(n.id)}" aria-label="Supprimer" title="Supprimer"><i class="fa-regular fa-trash-can"></i></button></div></div>`;
  }).join('');
}

const renderAll = () => { renderProfile(); renderCounts(); renderFavorites(); renderDocuments(); renderPurchases(); renderNotifications(); };

/* ================= Chargement des données ================= */
async function loadAll() {
  const uid = state.user.id;
  const [p, f, d, b, n] = await Promise.all([
    db.from('profiles').select('*').eq('id', uid).maybeSingle(),
    db.from('favorites')
      .select('id, template_id, created_at, templates(id, name, price_xaf, preview_image_url, html_structure, css_styles, template_categories(name))')
      .eq('user_id', uid).order('created_at', { ascending: false }),
    db.from('user_documents').select('*, templates(name)').eq('user_id', uid).order('created_at', { ascending: false }),
    db.from('purchases').select('*, templates(name)').eq('user_id', uid).order('created_at', { ascending: false }),
    db.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(100)
  ]);
  const errs = [p, f, d, b, n].map(r => r.error).filter(Boolean);
  if (errs.length) { console.error('[profile] erreurs Supabase', errs); showAlert('Certaines données n’ont pas pu être chargées. Réessayez dans un instant.'); }

  state.profile = p.data;
  if (!state.profile) {                       // profil absent : on le crée
    const { data } = await db.from('profiles')
      .upsert({ id: uid, email: state.user.email, full_name: state.user.user_metadata?.full_name || null }, { onConflict: 'id' })
      .select().maybeSingle();
    state.profile = data || { id: uid, email: state.user.email };
  }
  state.favs = f.data || []; state.docs = d.data || []; state.buys = b.data || []; state.notes = n.data || [];
  renderAll();
}

/* ================= Actions ================= */
// Favoris : retirer
document.addEventListener('click', async (e) => {
  const rm = e.target.closest('[data-rm]'); if (!rm) return;
  e.preventDefault();
  rm.disabled = true;
  const { error } = await db.from('favorites').delete().eq('id', rm.dataset.rm).eq('user_id', state.user.id);
  if (error) { rm.disabled = false; return toast('Impossible de retirer ce favori.', true); }
  state.favs = state.favs.filter(x => x.id !== rm.dataset.rm);
  renderCounts(); renderFavorites(); toast('Favori retiré.');
});
$('#q-fav').addEventListener('input', renderFavorites);
$('#q-doc').addEventListener('input', renderDocuments);

// Notifications
async function markRead(ids) {
  ids = ids.filter(id => state.notes.find(n => n.id === id && !n.is_read));
  if (!ids.length) return true;
  const { error } = await db.from('notifications').update({ is_read: true }).in('id', ids).eq('user_id', state.user.id);
  if (error) { toast('Action impossible.', true); return false; }
  state.notes.forEach(n => { if (ids.includes(n.id)) n.is_read = true; });
  renderCounts(); renderNotifications();
  return true;
}
$('#not-list').addEventListener('click', async (e) => {
  const r = e.target.closest('[data-read]'), x = e.target.closest('[data-del]'), o = e.target.closest('[data-open]');
  if (r) await markRead([r.dataset.read]);
  else if (o) markRead([o.dataset.open]);        // laisse le lien s'ouvrir
  else if (x) {
    const { error } = await db.from('notifications').delete().eq('id', x.dataset.del).eq('user_id', state.user.id);
    if (error) return toast('Suppression impossible.', true);
    state.notes = state.notes.filter(n => n.id !== x.dataset.del);
    renderCounts(); renderNotifications();
  }
});
$('#read-all').addEventListener('click', async () => {
  const ok = await markRead(state.notes.filter(n => !n.is_read).map(n => n.id));
  if (ok) toast('Tout est marqué comme lu.');
});

// Profil
async function saveProfile(patch, okMsg) {
  const { data, error } = await db.from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', state.user.id).select().maybeSingle();
  if (error) { console.error(error); toast('Enregistrement impossible.', true); return false; }
  state.profile = { ...state.profile, ...(data || patch) };
  renderProfile(); toast(okMsg); return true;
}
$('#f-profile').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('#i-name').value.trim(), tel = $('#i-tel').value.trim();
  if (!name) return toast('Le nom est obligatoire.', true);
  if (tel && !/^[+\d\s().-]{6,40}$/.test(tel)) return toast('Numéro de téléphone invalide.', true);
  const btn = $('#b-save'); btn.disabled = true;
  await saveProfile({ full_name: name, phone_number: tel || null }, 'Profil mis à jour.');
  btn.disabled = false;
});
$('#b-av').addEventListener('click', async () => {
  const raw = $('#i-av').value.trim();
  const url = safeUrl(raw);
  if (!url) return toast('Saisissez une adresse d’image valide (https://…).', true);
  await saveProfile({ avatar_url: url }, 'Photo enregistrée.');
});
$('#b-av-x').addEventListener('click', async () => {
  $('#i-av').value = '';
  await saveProfile({ avatar_url: null }, 'Photo retirée.');
});

// Mot de passe
$('#b-pwd').addEventListener('click', async (e) => {
  const btn = e.currentTarget, mail = state.profile?.email || state.user.email;
  btn.disabled = true;
  const { error } = await db.auth.resetPasswordForEmail(mail, { redirectTo: resetRedirect });
  btn.disabled = false;
  if (error) return toast('Envoi impossible. Réessayez plus tard.', true);
  toast(`E-mail de réinitialisation envoyé à ${mail}.`);
});

// Déconnexion
async function logout() {
  await db.auth.signOut();
  location.href = HOME_URL;
}
$('#logout').addEventListener('click', logout);
$('#logout-2').addEventListener('click', logout);

/* ================= Init ================= */
async function init() {
  $('#yr').textContent = new Date().getFullYear();
  go(location.hash.slice(1) || 'overview', false);

  db = getDb();
  if (!db) { showAlert('Connexion au service impossible. Rechargez la page.'); return; }

  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    location.replace(LOGIN_URL);
    return;
  }
  state.user = session.user;

  db.auth.onAuthStateChange((evt) => { if (evt === 'SIGNED_OUT') location.href = HOME_URL; });

  try { await loadAll(); }
  catch (err) { console.error(err); showAlert('Une erreur est survenue lors du chargement.'); }
}

document.addEventListener('DOMContentLoaded', init);
})();
