/* TakiDoc — js/profile.js : « Mon espace » en mode application
   Espace · Favoris · Documents (récupération, brouillons, enregistrés, paiements) · Alertes · Compte
   Taki réagit à chaque action. */
(() => {
'use strict';

/* ================= CONFIG ================= */
const SUPABASE_URL = 'https://wyfkogowsdbxctbpfuud.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM';
const LOGIN_URL = 'auth.html?action=login';
const HOME_URL = 'index.html';
const DRAFT_PREFIX = 'takidoc_draft_';
const PENDING_PREFIX = 'takidoc_pending_';
const TEMPLATE_COLS = 'id, name, price_xaf, preview_image_url, html_structure, css_styles, template_categories(name)';
const resetRedirect = new URL('reset-password.html', location.href).href;
const takiTemplateUrl = new URL('components/taki/taki.html', location.href).href;

const editorUrl = (id, extra = {}) => `editor.html?${new URLSearchParams({ id, ...extra })}`;

/* ================= Helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = d => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtXAF = n => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
const safeUrl = u => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };
const initials = (n, mail) => {
  const s = (n || mail || 'TD').trim().split(/[\s@.]+/).filter(Boolean);
  return ((s[0]?.[0] || 'T') + (s[1]?.[0] || '')).toUpperCase();
};
function ago(ts) {
  const m = Math.round((Date.now() - Number(ts)) / 60000);
  if (!Number.isFinite(m) || m < 0) return '—';
  if (m < 1) return 'à l’instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return d < 30 ? `il y a ${d} j` : fmtDate(ts);
}
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

const state = { user: null, profile: null, favs: [], docs: [], buys: [], pp: [], kept: new Map(), used: null, notes: [], drafts: [], pendings: [], tpl: new Map(), view: 'home', seg: 'bought', nf: 'all' };
let db = null;

function getDb() {
  const existing = window.supabaseClient || window.sb || window.db || window._supabase;
  if (existing?.auth) return existing;
  if (!window.supabase?.createClient) return null;
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

/* ================= Retours visuels ================= */
let toastT;
function toast(msg, opts = {}) {
  const t = $('#toast'); if (!t) return;
  const o = typeof opts === 'boolean' ? { err: opts } : opts;
  t.className = `toast show${o.err ? ' err' : ''}`;
  t.replaceChildren(document.createTextNode(msg));
  if (o.action) {
    const b = document.createElement('button');
    b.textContent = o.action.label;
    b.addEventListener('click', () => { t.classList.remove('show'); o.action.fn(); });
    t.append(b);
  }
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), o.action ? 6500 : 3200);
}
function showAlert(msg) {
  const a = $('#alert'); if (!a) return;
  a.className = 'alert show error';
  a.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i><span>${esc(msg)}</span>`;
}
function confirmBox(title, text, okLabel = 'Confirmer') {
  return new Promise(resolve => {
    const dlg = $('#dlg');
    $('#dlg-t').textContent = title; $('#dlg-p').textContent = text; $('#dlg-ok').textContent = okLabel;
    const done = v => { dlg.close(); $('#dlg-ok').onclick = $('#dlg-no').onclick = null; resolve(v); };
    $('#dlg-ok').onclick = () => done(true);
    $('#dlg-no').onclick = () => done(false);
    dlg.addEventListener('cancel', () => resolve(false), { once: true });
    dlg.showModal();
  });
}
const loadingHtml = '<div class="load"><i class="fa-solid fa-spinner fa-spin"></i>Chargement…</div>';
const empty = (icon, title, text, cta = '') => `<div class="empty"><i class="fa-solid ${icon}"></i><h3>${esc(title)}</h3><p>${esc(text)}</p>${cta}</div>`;
const browseBtn = `<a class="bt p" href="${HOME_URL}"><i class="fa-solid fa-compass"></i>Explorer les modèles</a>`;

/* ================= Taki ================= */
const taki = {
  mascot: null, hideT: null, idleT: null,
  async init() {
    const host = $('#tkBtn');
    if (!host || !window.TakiMascot) return;
    try {
      this.mascot = await window.TakiMascot.mount(host, { initialState: 'thinking', templateUrl: takiTemplateUrl });
    } catch (e) { this.mascot = null; console.warn('Taki indisponible :', e); }
  },
  set(st, msg) { try { this.mascot?.setState(st, msg); } catch (_) { /* sans importance */ } },
  /** Taki parle : bulle + attitude, puis retour au calme. */
  say(text, st = 'idle', ms = 6500) {
    const b = $('#tkBubble'); if (!b || !text) return;
    this.set(st, text);
    b.textContent = text; b.classList.add('show');
    clearTimeout(this.hideT); clearTimeout(this.idleT);
    this.hideT = setTimeout(() => b.classList.remove('show'), ms);
    if (st !== 'idle') this.idleT = setTimeout(() => this.set('idle'), Math.min(ms, 4200));
  }
};

function bindTaki() {
  const btn = $('#tkBtn'), panel = $('#tkPanel');
  const TIPS = [
    'Un document payé se retélécharge gratuitement dans « Documents ».',
    'Tes brouillons restent sur cet appareil.',
    'Le cœur d’un modèle l’ajoute à tes favoris.',
    'Je te préviens ici quand un paiement est validé.'
  ];
  let tip = 0;
  const toggle = open => {
    const show = open ?? panel.hidden;
    panel.hidden = !show; btn.setAttribute('aria-expanded', String(show));
    if (show) { $('#tkTip').textContent = TIPS[tip++ % TIPS.length]; taki.set('thinking'); setTimeout(() => taki.set('idle'), 1800); }
  };
  btn.addEventListener('click', () => toggle());
  document.addEventListener('click', e => { if (!panel.hidden && !e.target.closest('#pfTaki')) toggle(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) toggle(false); });
  panel.addEventListener('click', e => { if (e.target.closest('button,a')) toggle(false); });
}

/* ================= Navigation ================= */
const VIEWS = ['home', 'favorites', 'documents', 'notifications', 'settings'];
const SEGS = ['bought', 'drafts', 'saved', 'pay'];
const LEGACY = { overview: 'home', purchases: 'documents/pay', catalog: 'home' };

function parseHash(hash) {
  let h = String(hash || '').replace(/^#/, '');
  if (LEGACY[h]) h = LEGACY[h];
  const [v, s] = h.split('/');
  return { view: VIEWS.includes(v) ? v : 'home', seg: SEGS.includes(s) ? s : null };
}

function go(view, seg = null, push = true) {
  if (!VIEWS.includes(view)) view = 'home';
  state.view = view;
  if (view === 'documents') state.seg = SEGS.includes(seg) ? seg : (state.seg || 'bought');
  $$('.view').forEach(v => v.classList.toggle('on', v.id === `v-${view}`));
  $$('.pf-rail [data-view], .pf-tab [data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === view));
  if (view === 'documents') showSeg(state.seg);
  const hash = view === 'documents' ? `#documents/${state.seg}` : `#${view}`;
  if (push && location.hash !== hash) history.replaceState(null, '', hash);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  taki.say(viewMessage(view), 'idle', 5200);
}

function viewMessage(view) {
  const first = (state.profile?.full_name || '').split(' ')[0];
  const paid = paidList().length, unread = state.notes.filter(n => !n.is_read).length;
  switch (view) {
    case 'home': return first ? `Content de te revoir, ${first} !` : 'Content de te revoir !';
    case 'favorites': return state.favs.length ? `Tu as ${plural(state.favs.length, 'modèle gardé', 'modèles gardés')}.` : 'Ajoute des modèles avec le cœur.';
    case 'documents': return paid ? `${plural(paid, 'document payé', 'documents payés')} : retéléchargement gratuit.` : 'Ici, tu retrouves tout ce que tu as créé.';
    case 'notifications': return unread ? `${plural(unread, 'message non lu', 'messages non lus')}.` : 'Tout est à jour !';
    default: return 'Ici, tu gères ton compte.';
  }
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-view]');
  if (!b) return;
  e.preventDefault();
  go(b.dataset.view, b.dataset.seg || null);
});
window.addEventListener('hashchange', () => { const r = parseHash(location.hash); go(r.view, r.seg, false); });

function showSeg(seg) {
  if (seg === 'saved' && state.user && !state.docs.length) seg = 'bought';
  state.seg = seg;
  $$('#v-documents [data-seg]').forEach(b => { b.classList.toggle('on', b.dataset.seg === seg); b.setAttribute('aria-selected', String(b.dataset.seg === seg)); });
  $$('#v-documents [data-pane]').forEach(p => { p.hidden = p.dataset.pane !== seg; });
  fitPreviews();
}
$$('#v-documents .seg [data-seg]').forEach(b => b.addEventListener('click', () => {
  showSeg(b.dataset.seg);
  history.replaceState(null, '', `#documents/${b.dataset.seg}`);
}));

/* ================= Aperçus A4 ================= */
const PV_W = 794, PV_H = 1123;
const roPv = 'ResizeObserver' in window ? new ResizeObserver(() => fitPreviews()) : null;

function previewHTML(t, link = '') {
  const imageUrl = safeUrl(t.preview_image_url);
  let inner = '';
  if (imageUrl) {
    inner = `<img src="${esc(imageUrl)}" alt="Aperçu de ${esc(t.name || 'document')}" loading="lazy" decoding="async">`;
  } else if (t.html_structure) {
    const doc = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>html,body{margin:0!important;padding:0!important;width:100%;min-height:100%;background:#fff!important;overflow:hidden}*,*::before,*::after{box-sizing:border-box}img{max-width:100%}</style><style>${String(t.css_styles || '')}</style></head><body>${t.html_structure}</body></html>`;
    inner = `<iframe sandbox tabindex="-1" loading="lazy" title="Aperçu de ${esc(t.name || 'document')}" srcdoc="${esc(doc)}" width="${PV_W}" height="${PV_H}"></iframe>`;
  }
  return `<div class="pv${inner ? '' : ' ready'}"><div class="ph0" aria-hidden="true"><i class="fa-regular fa-file-lines"></i></div>${inner}${link ? `<a href="${esc(link)}" aria-label="Ouvrir ${esc(t.name || 'le modèle')}"></a>` : ''}</div>`;
}

function fitPreviews(root = document) {
  $$('.pv iframe', root).forEach(frame => {
    const box = frame.parentElement;
    const w = box?.clientWidth, h = box?.clientHeight;
    if (!w || !h) return;
    const scale = Math.min(w / PV_W, h / PV_H);
    frame.style.transform = `scale(${scale})`;
    frame.style.left = `${Math.max(0, (w - PV_W * scale) / 2)}px`;
    frame.style.top = `${Math.max(0, (h - PV_H * scale) / 2)}px`;
  });
}

function bindPreviews(root) {
  $$('.pv', root).forEach(pv => {
    roPv?.observe(pv);
    const media = $('img, iframe', pv);
    if (!media) { pv.classList.add('ready'); return; }
    const done = () => { pv.classList.add('ready'); fitPreviews(pv); };
    if (media.tagName === 'IMG' && media.complete) done();
    else { media.addEventListener('load', done, { once: true }); media.addEventListener('error', done, { once: true }); }
  });
  fitPreviews(root);
}
window.addEventListener('resize', () => fitPreviews());

/* ================= Données locales (brouillons, paiements en cours) ================= */
function scanLocal() {
  const drafts = [], pendings = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(DRAFT_PREFIX)) {
        try {
          const d = JSON.parse(localStorage.getItem(k) || '{}');
          drafts.push({
            key: k, templateId: k.slice(DRAFT_PREFIX.length), ts: Number(d.timestamp) || 0,
            filled: Object.values(d.fields || {}).filter(v => String(v ?? '').trim()).length, photo: Boolean(d.photoDataUrl)
          });
        } catch (_) { /* brouillon illisible : ignoré */ }
      } else if (k.startsWith(PENDING_PREFIX)) {
        try {
          const p = JSON.parse(localStorage.getItem(k) || 'null');
          if (p?.token) pendings.push({ key: k, token: p.token, templateId: k.slice(PENDING_PREFIX.length), format: p.format || 'pdf', ts: Number(p.ts) || 0 });
        } catch (_) { /* ignoré */ }
      }
    }
  } catch (_) { /* stockage indisponible */ }
  state.drafts = drafts.sort((a, b) => b.ts - a.ts);
  state.pendings = pendings.sort((a, b) => b.ts - a.ts);
}

async function ensureTemplates(ids) {
  const missing = [...new Set(ids)].filter(id => id && !state.tpl.has(id));
  if (!missing.length) return;
  const { data, error } = await db.from('templates').select(TEMPLATE_COLS).in('id', missing);
  if (error) { console.warn('[profile] modèles introuvables', error); return; }
  (data || []).forEach(t => state.tpl.set(t.id, t));
}
const tplOf = id => state.tpl.get(id) || { id, name: 'Document', template_categories: null };

/* ================= Données Supabase ================= */
const PAID = ['paid', 'completed', 'success', 'succeeded', 'successful'];
const isPaid = b => PAID.includes(String(b.payment_status || '').toLowerCase());
const paidList = () => state.buys.filter(isPaid);

// Un achat est lié à son jeton de récupération par pending_purchases (purchase_id, ou pending_purchase_id côté purchases)
const tokenOf = b => {
  const hit = state.pp.find(x => x.purchase_token && (x.purchase_id === b.id || (b.pending_purchase_id && x.id === b.pending_purchase_id)));
  return hit?.purchase_token || null;
};
const myMail = () => String(state.user?.email || '').trim().toLowerCase();
// Un achat est « à moi » s'il est lié à mon compte, ou fait en invité avec mon adresse e-mail
const isMine = r => r.user_id === state.user.id || (r.guest_email && String(r.guest_email).trim().toLowerCase() === myMail());
const ownerFilter = () => {
  const m = String(state.user.email || '').trim().replace(/"/g, '');
  const mails = [...new Set([m, m.toLowerCase()])].filter(Boolean);
  return [`user_id.eq.${state.user.id}`, ...mails.map(x => `guest_email.eq."${x}"`)].join(',');
};

// Droits de retéléchargement d'un achat : toujours gratuits, dans la limite fixée par l'achat
function rightsOf(b) {
  const max = Number(b.max_generations) || 5;
  const used = state.used ? (state.used.get(b.id) || 0) : null;
  const expired = Boolean(b.access_expires_at && new Date(b.access_expires_at) < new Date());
  const left = used === null ? null : Math.max(0, max - used);
  const kept = state.kept.get(b.id);
  const keptOk = Boolean(kept && new Date(kept.expires_at) > new Date());
  return { max, used, left, expired, kept, keptOk };
}

const PP_COLS = 'id, purchase_id, purchase_token, template_id, status, amount, payment_method, created_at, expires_at, completed_at, failure_reason, user_id, guest_email';

async function loadAll() {
  const uid = state.user.id, owner = ownerFilter();
  const [p, f, d, b, n, q] = await Promise.all([
    db.from('profiles').select('*').eq('id', uid).maybeSingle(),
    db.from('favorites').select(`id, template_id, created_at, templates(${TEMPLATE_COLS})`).eq('user_id', uid).order('created_at', { ascending: false }),
    db.from('user_documents').select('*, templates(id, name)').eq('user_id', uid).order('created_at', { ascending: false }),
    db.from('purchases').select(`*, templates(${TEMPLATE_COLS})`).or(owner).order('created_at', { ascending: false }).limit(60),
    db.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(100),
    db.from('pending_purchases').select(PP_COLS).or(owner).order('created_at', { ascending: false }).limit(80)
  ]);
  const errs = [p, f, d, b, n, q].map(r => r.error).filter(Boolean);
  if (errs.length) { console.error('[profile] erreurs Supabase', errs); showAlert('Certaines données n’ont pas pu être chargées. Réessaie dans un instant.'); taki.say('Oups, un souci de chargement…', 'error'); }

  state.profile = p.data;
  if (!state.profile) {
    const { data } = await db.from('profiles')
      .upsert({ id: uid, email: state.user.email, full_name: state.user.user_metadata?.full_name || null }, { onConflict: 'id' })
      .select().maybeSingle();
    state.profile = data || { id: uid, email: state.user.email };
  }
  state.favs = f.data || []; state.docs = d.data || [];
  state.buys = (b.data || []).filter(isMine);
  state.pp = (q.data || []).filter(isMine);
  state.notes = n.data || [];

  // Copies conservées (72 h) et téléchargements déjà utilisés : informatifs, jamais bloquants si illisibles
  state.kept = new Map(); state.used = null;
  const ids = paidList().map(x => x.id);
  if (ids.length) {
    const [k, u] = await Promise.all([
      db.from('purchase_documents').select('purchase_id, expires_at').in('purchase_id', ids),
      db.from('generation_nonces').select('purchase_id').in('purchase_id', ids).eq('used', true)
    ]);
    if (!k.error) (k.data || []).forEach(x => state.kept.set(x.purchase_id, x));
    else console.warn('[profile] copies conservées illisibles', k.error);
    if (!u.error) { state.used = new Map(); (u.data || []).forEach(x => state.used.set(x.purchase_id, (state.used.get(x.purchase_id) || 0) + 1)); }
    else console.warn('[profile] téléchargements illisibles', u.error);
  }

  state.favs.forEach(x => x.templates && state.tpl.set(x.template_id, x.templates));
  state.buys.forEach(x => x.templates && state.tpl.set(x.template_id, x.templates));
  scanLocal();
  await ensureTemplates([...state.drafts.map(x => x.templateId), ...state.pendings.map(x => x.templateId), ...state.pp.map(x => x.template_id)]);
  renderAll();
}

// Paiements : les achats confirmés + les tentatives sans achat (en attente, échouées, expirées)
const payItems = () => {
  const bought = state.buys.map(b => ({ kind: 'buy', id: b.id, ts: b.created_at, tpl: b.template_id, amount: b.amount_paid, method: b.payment_method, status: b.payment_status, ref: b.payment_reference }));
  const tries = state.pp.filter(x => !x.purchase_id && x.status !== 'completed').map(x => ({
    kind: 'try', id: x.id, ts: x.created_at, tpl: x.template_id, amount: x.amount, method: x.payment_method,
    status: x.status === 'pending' && new Date(x.expires_at) < new Date() ? 'expired' : x.status, token: x.purchase_token
  }));
  return [...bought, ...tries].sort((a, b) => new Date(b.ts) - new Date(a.ts));
};

// Paiements en cours de livraison ou de validation
function pendingBanners() {
  const seen = new Set();
  const out = [];
  state.pendings.forEach(p => {
    seen.add(p.token);
    const done = state.pp.find(x => x.purchase_token === p.token && x.status === 'completed');
    out.push({ templateId: p.templateId, token: p.token, format: p.format, ts: p.ts, text: done ? 'Ton paiement est validé mais le document n’a pas fini d’arriver' : 'Paiement en attente de validation' });
  });
  state.pp.filter(x => x.status === 'pending' && !x.purchase_id && new Date(x.expires_at) > new Date() && !seen.has(x.purchase_token))
    .forEach(x => out.push({ templateId: x.template_id, token: x.purchase_token, format: 'pdf', ts: new Date(x.created_at).getTime(), text: 'Paiement en attente de validation' }));
  return out;
}
const bannerHtml = x => `<div class="banner"><i class="fa-solid fa-hourglass-half"></i>
  <span>${esc(x.text)} : « ${esc(tplOf(x.templateId).name)} » (${esc(ago(x.ts))}).</span>
  <a class="bt s" data-recover href="${esc(editorUrl(x.templateId, { recover: x.token, format: x.format }))}">Reprendre</a></div>`;

/* ================= Rendu ================= */
function renderCounts() {
  const unread = state.notes.filter(n => !n.is_read).length;
  const paid = paidList().length;
  const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  const badge = (id, n) => { const el = $(id); if (el) { el.textContent = n > 99 ? '99+' : n; el.hidden = !n; } };
  set('#c-doc', paid); set('#c-dra', state.drafts.length); set('#c-fav', state.favs.length); set('#c-not', unread);
  set('#g-bought', paid); set('#g-drafts', state.drafts.length); set('#g-saved', state.docs.length); set('#g-pay', payItems().length);
  const sv = $('#v-documents .seg [data-seg="saved"]'); if (sv) sv.hidden = !state.docs.length;
  set('#g-unread', unread); set('#clr-n', state.drafts.length);
  badge('#rb-not', unread); badge('#tb-not', unread); badge('#rb-doc', paid); badge('#tb-doc', paid);
}

function renderProfile() {
  const p = state.profile || {}, mail = p.email || state.user.email, name = p.full_name || '';
  const first = name.split(' ')[0];
  $('#hello').textContent = first ? `Bonjour ${first} !` : 'Bonjour !';
  $('#joined').textContent = fmtDate(p.created_at || state.user.created_at);
  const av = $('#av'), url = safeUrl(p.avatar_url);
  if (url) {
    av.innerHTML = `<img src="${esc(url)}" alt="Photo de profil">`;
    $('img', av).addEventListener('error', () => { av.textContent = initials(name, mail); });
  } else av.textContent = initials(name, mail);
  $('#i-name').value = name; $('#i-mail').value = mail; $('#i-tel').value = p.phone_number || '';
}

/* --- Cartes --- */
function favCard(f, removable = true) {
  const t = tplOf(f.template_id);
  const price = Number(t.price_xaf) === 0 ? '<b class="free">Gratuit</b>' : `<b>${fmtXAF(t.price_xaf)}</b>`;
  return `<article class="fc">${previewHTML(t, editorUrl(f.template_id))}
    ${removable ? `<button class="rm" data-rm="${esc(f.id)}" title="Retirer des favoris" aria-label="Retirer des favoris"><i class="fa-solid fa-heart"></i></button>` : ''}
    <div class="fi"><small>${esc(t.template_categories?.name || 'Modèle')}</small><h3>${esc(t.name || f.template_id)}</h3>
    <div class="fr">${price}<a class="bt s" href="${esc(editorUrl(f.template_id))}">Utiliser</a></div></div></article>`;
}

function recoverLinks(b) {
  const token = tokenOf(b), id = b.template_id, r = rightsOf(b);
  if (r.expired) return `<span class="tag e">Accès expiré</span><a class="bt s" href="contact.html">Contacter TakiDoc</a>`;
  if (r.left === 0) return `<span class="tag e">Limite de téléchargements atteinte</span><a class="bt s" href="contact.html">Contacter TakiDoc</a>`;
  if (!token) {
    return `<span class="tag n" title="Aucun jeton de récupération n’est lié à cet achat.">Récupération indisponible</span>
      <a class="bt s" href="contact.html">Contacter TakiDoc</a>`;
  }
  const link = fmt => esc(editorUrl(id, { recover: token, format: fmt, purchase: b.id }));
  return `<a class="bt s p" data-recover href="${link('pdf')}"><i class="fa-solid fa-download"></i>Retélécharger en PDF</a>
    <a class="bt s" data-recover href="${link('docx')}"><i class="fa-regular fa-file-word"></i>Word</a>`;
}

function boughtCard(b) {
  const t = tplOf(b.template_id), r = rightsOf(b);
  const tags = ['<span class="tag ok"><i class="fa-solid fa-lock-open"></i> Retéléchargement gratuit</span>'];
  if (r.left !== null && r.left > 0 && !r.expired) tags.push(`<span class="tag n">${plural(r.left, 'téléchargement restant', 'téléchargements restants')} sur ${r.max}</span>`);
  if (state.kept.size || state.used) {
    tags.push(r.keptOk
      ? `<span class="tag n" title="Ton document est gardé 72 h après le paiement.">Copie gardée jusqu’au ${esc(fmtDateTime(r.kept.expires_at))}</span>`
      : `<span class="tag w" title="Passé 72 h, la copie est supprimée : l’éditeur repart de ton brouillon.">Copie de 72 h expirée</span>`);
  }
  return `<article class="dc"><div class="th">${previewHTML(t)}</div><div class="di">
    <small>Payé le ${fmtDate(b.created_at)}</small><h3>${esc(t.name || b.template_id)}</h3>
    <p class="meta"><span class="amount">${fmtXAF(b.amount_paid)}</span> · ${esc(methodLabel(b.payment_method))}</p>
    <div class="st">${tags.join('')}</div>
    <div class="ac">${recoverLinks(b)}</div></div></article>`;
}

function draftCard(d) {
  const t = tplOf(d.templateId);
  const detail = d.filled ? plural(d.filled, 'champ rempli', 'champs remplis') : 'Aucun champ rempli';
  return `<article class="dc"><div class="th">${previewHTML(t)}</div><div class="di">
    <small>Modifié ${esc(ago(d.ts))}</small><h3>${esc(t.name)}</h3><p class="meta">${esc(detail)}${d.photo ? ' · photo ajoutée' : ''}</p>
    <div class="ac"><a class="bt s p" href="${esc(editorUrl(d.templateId))}"><i class="fa-solid fa-pen"></i>Continuer</a>
    <button class="bt s d" data-del-draft="${esc(d.key)}" aria-label="Supprimer ce brouillon"><i class="fa-regular fa-trash-can"></i></button></div></div></article>`;
}

function savedCard(d) {
  const t = tplOf(d.template_id);
  const name = d.templates?.name || t.name || d.template_id;
  const pdf = safeUrl(d.generated_pdf_url);
  return `<article class="dc"><div class="th">${previewHTML(t)}</div><div class="di">
    <small>Créé le ${fmtDate(d.created_at)}</small><h3>${esc(name)}</h3><p class="meta">Modifié le ${fmtDate(d.updated_at)}</p>
    <div class="ac">${pdf
      ? `<a class="bt s p" href="${esc(pdf)}" target="_blank" rel="noopener"><i class="fa-regular fa-file-pdf"></i>Ouvrir le PDF</a>`
      : `<span class="tag n">PDF non disponible</span>`}
    <a class="bt s" href="${esc(editorUrl(d.template_id))}">Rouvrir le modèle</a></div></div></article>`;
}

const STATUS = {
  paid: ['ok', 'Payé'], completed: ['ok', 'Payé'], success: ['ok', 'Payé'], succeeded: ['ok', 'Payé'], successful: ['ok', 'Payé'],
  pending: ['w', 'En attente'], processing: ['w', 'En cours'],
  failed: ['e', 'Échoué'], cancelled: ['e', 'Annulé'], canceled: ['e', 'Annulé'], expired: ['e', 'Expiré'], refunded: ['n', 'Remboursé']
};
const METHODS = { mtn: 'MTN Mobile Money', airtel: 'Airtel Money', card: 'Carte bancaire' };
const methodLabel = m => METHODS[String(m || '').toLowerCase()] || m || 'Mobile Money';

function payRow(x) {
  const [cls, label] = STATUS[String(x.status || '').toLowerCase()] || ['n', x.status || '—'];
  const t = tplOf(x.tpl);
  const resume = x.kind === 'try' && x.status === 'pending' && x.token
    ? `<a class="bt s" data-recover href="${esc(editorUrl(x.tpl, { recover: x.token, format: 'pdf' }))}">Reprendre</a>` : '';
  return `<div class="row"><i class="fa-solid fa-receipt"></i>
    <div><h3>${esc(t.name || x.tpl)}</h3><p>${fmtDateTime(x.ts)} · ${esc(methodLabel(x.method))}</p>${x.ref ? `<small>Réf. ${esc(x.ref)}</small>` : ''}</div>
    <div class="end"><span class="amount">${fmtXAF(x.amount)}</span><span class="tag ${cls}">${esc(label)}</span>${resume}</div></div>`;
}

/* --- Vues --- */
const matches = (q, ...vals) => !q || vals.some(v => String(v || '').toLowerCase().includes(q));
const searchQ = id => ($(id)?.value || '').trim().toLowerCase();

function renderHome() {
  const box = $('#home-body');
  const paid = paidList(), drafts = state.drafts;
  const parts = [];

  pendingBanners().forEach(x => parts.push(bannerHtml(x)));
  if (paid.length) {
    parts.push(`<div class="sec"><div class="sh"><div><h2>Mes documents payés</h2><p>Retéléchargement gratuit, quand tu veux.</p></div><button class="bt s" data-view="documents" data-seg="bought">Tout voir</button></div>
      <div class="dgrid">${paid.slice(0, 3).map(boughtCard).join('')}</div></div>`);
  }
  if (drafts.length) {
    parts.push(`<div class="sec"><div class="sh"><div><h2>Reprendre</h2><p>Tes brouillons sur cet appareil.</p></div><button class="bt s" data-view="documents" data-seg="drafts">Tout voir</button></div>
      <div class="dgrid">${drafts.slice(0, 3).map(draftCard).join('')}</div></div>`);
  }
  if (state.favs.length) {
    parts.push(`<div class="sec"><div class="sh"><div><h2>Favoris récents</h2><p>Tes modèles préférés.</p></div><button class="bt s" data-view="favorites">Tout voir</button></div>
      <div class="strip">${state.favs.slice(0, 8).map(f => favCard(f, false)).join('')}</div></div>`);
  }
  if (!parts.length) {
    parts.push(empty('fa-wand-magic-sparkles', 'Ton espace est prêt', 'Choisis un modèle, personnalise-le : tes documents, brouillons et favoris apparaîtront ici.', browseBtn));
  }
  box.innerHTML = parts.join('');
  bindPreviews(box);
}

function renderFavorites() {
  const q = searchQ('#q-fav'), sort = $('#s-fav').value;
  let list = state.favs.filter(f => matches(q, tplOf(f.template_id).name));
  const price = f => Number(tplOf(f.template_id).price_xaf) || 0;
  if (sort === 'name') list.sort((a, b) => String(tplOf(a.template_id).name).localeCompare(String(tplOf(b.template_id).name), 'fr'));
  else if (sort === 'asc') list.sort((a, b) => price(a) - price(b));
  else if (sort === 'desc') list.sort((a, b) => price(b) - price(a));
  const box = $('#fav-list');
  box.innerHTML = list.length
    ? `<div class="grid">${list.map(f => favCard(f)).join('')}</div>`
    : (state.favs.length
      ? empty('fa-magnifying-glass', 'Aucun résultat', 'Aucun favori ne correspond à ta recherche.')
      : empty('fa-heart', 'Aucun favori', 'Touche le cœur d’un modèle pour le garder ici.', browseBtn));
  bindPreviews(box);
}

function renderDocuments() {
  const q = searchQ('#q-doc');

  // Payés : récupération
  let html = '';
  html += pendingBanners().map(bannerHtml).join('');
  const bought = paidList().filter(b => matches(q, tplOf(b.template_id).name));
  html += bought.length
    ? `<div class="dgrid">${bought.map(boughtCard).join('')}</div>`
    : (paidList().length ? empty('fa-magnifying-glass', 'Aucun résultat', 'Aucun document payé ne correspond à ta recherche.')
      : empty('fa-download', 'Aucun document payé', 'Après un paiement, ton document apparaît ici et tu peux le retélécharger gratuitement.', browseBtn));
  $('#p-bought').innerHTML = html;

  // Brouillons
  const drafts = state.drafts.filter(d => matches(q, tplOf(d.templateId).name));
  $('#p-drafts').innerHTML = drafts.length
    ? `<div class="dgrid">${drafts.map(draftCard).join('')}</div><p class="note">Les brouillons sont gardés dans ce navigateur uniquement.</p>`
    : (state.drafts.length ? empty('fa-magnifying-glass', 'Aucun résultat', 'Aucun brouillon ne correspond à ta recherche.')
      : empty('fa-pen-ruler', 'Aucun brouillon', 'Un document commencé dans l’éditeur est sauvegardé automatiquement ici.', browseBtn));

  // Enregistrés
  const saved = state.docs.filter(d => matches(q, d.templates?.name, tplOf(d.template_id).name));
  $('#p-saved').innerHTML = saved.length
    ? `<div class="dgrid">${saved.map(savedCard).join('')}</div>`
    : (state.docs.length ? empty('fa-magnifying-glass', 'Aucun résultat', 'Aucun document ne correspond à ta recherche.')
      : empty('fa-box-archive', 'Aucun document enregistré', 'Les documents enregistrés dans ton compte apparaîtront ici.'));

  // Paiements
  const all = payItems(), pays = all.filter(x => matches(q, tplOf(x.tpl).name, x.ref));
  $('#p-pay').innerHTML = pays.length
    ? `<div class="list">${pays.map(payRow).join('')}</div>`
    : (all.length ? empty('fa-magnifying-glass', 'Aucun résultat', 'Aucun paiement ne correspond à ta recherche.')
      : empty('fa-receipt', 'Aucun paiement', 'Tes achats et leur statut s’afficheront ici.', browseBtn));

  bindPreviews($('#v-documents'));
}

const NOTE_ICONS = { info: 'fa-circle-info', success: 'fa-circle-check', purchase: 'fa-bag-shopping', payment: 'fa-credit-card', warning: 'fa-triangle-exclamation', error: 'fa-circle-exclamation', document: 'fa-file-lines' };

function renderNotifications() {
  const box = $('#not-list');
  $('#read-all').hidden = !state.notes.some(n => !n.is_read);
  const list = state.nf === 'unread' ? state.notes.filter(n => !n.is_read) : state.notes;
  if (!list.length) {
    box.innerHTML = state.notes.length
      ? empty('fa-check-double', 'Tout est lu', 'Tu n’as aucune notification non lue.')
      : empty('fa-bell-slash', 'Aucune notification', 'Les nouveaux messages apparaîtront ici.');
    return;
  }
  box.innerHTML = `<div class="list">${list.map(n => {
    const link = n.link && (safeUrl(n.link) || (/^[\w./?#=&%-]+$/.test(n.link) ? n.link : ''));
    return `<div class="row${n.is_read ? '' : ' new'}"><i class="fa-solid ${NOTE_ICONS[n.type] || 'fa-bell'}"></i>
      <div><h3>${esc(n.title)}</h3><p>${esc(n.message)}</p><small>${fmtDateTime(n.created_at)}</small></div>
      <div class="end">${link ? `<a class="bt s" href="${esc(link)}" data-open="${esc(n.id)}">Voir</a>` : ''}
      ${n.is_read ? '' : `<button class="bt s" data-read="${esc(n.id)}"><i class="fa-solid fa-check"></i>Lu</button>`}
      <button class="bt s" data-del="${esc(n.id)}" aria-label="Supprimer" title="Supprimer"><i class="fa-regular fa-trash-can"></i></button></div></div>`;
  }).join('')}</div>`;
}

function renderAll() {
  renderProfile(); renderCounts(); renderHome(); renderFavorites(); renderDocuments(); renderNotifications();
  const paid = paidList().length;
  const first = (state.profile?.full_name || '').split(' ')[0];
  $('#hello-sub').textContent = paid ? `${plural(paid, 'document payé', 'documents payés')} à retélécharger gratuitement.` : 'Voici ce qui t’attend aujourd’hui.';
  let hello = false;
  try { hello = sessionStorage.getItem('takidoc_pf_hello') === '1'; sessionStorage.setItem('takidoc_pf_hello', '1'); } catch (_) { /* ignoré */ }
  taki.say(paid && !hello ? `${first ? first + ', ' : ''}tes ${plural(paid, 'document payé t’attend', 'documents payés t’attendent')}, gratuitement !` : viewMessage(state.view), paid && !hello ? 'celebrating' : 'idle', 6500);
}

/* ================= Actions ================= */
// Récupération : Taki prévient avant d'ouvrir l'éditeur, qui livre le fichier
document.addEventListener('click', e => {
  const a = e.target.closest('[data-recover]');
  if (!a) return;
  e.preventDefault();
  taki.say('J’ouvre ton document payé, je te le prépare. C’est gratuit !', 'working', 4000);
  setTimeout(() => { location.href = a.href; }, 600);
});

// Favoris : retirer (avec annulation)
document.addEventListener('click', async e => {
  const rm = e.target.closest('[data-rm]'); if (!rm) return;
  e.preventDefault();
  rm.disabled = true;
  const fav = state.favs.find(x => x.id === rm.dataset.rm);
  const { error } = await db.from('favorites').delete().eq('id', rm.dataset.rm).eq('user_id', state.user.id);
  if (error) { rm.disabled = false; taki.say('Je n’ai pas pu retirer ce favori.', 'error'); return toast('Impossible de retirer ce favori.', true); }
  state.favs = state.favs.filter(x => x.id !== rm.dataset.rm);
  renderCounts(); renderFavorites(); renderHome();
  toast('Favori retiré.', {
    action: {
      label: 'Annuler',
      fn: async () => {
        if (!fav) return;
        const { data, error: err } = await db.from('favorites').insert({ user_id: state.user.id, template_id: fav.template_id }).select('id, template_id, created_at').maybeSingle();
        if (err || !data) return toast('Impossible de rétablir ce favori.', true);
        state.favs.unshift({ ...fav, ...data });
        renderCounts(); renderFavorites(); renderHome(); taki.say('Favori rétabli !', 'celebrating', 3500);
      }
    }
  });
});
$('#q-fav').addEventListener('input', renderFavorites);
$('#s-fav').addEventListener('change', renderFavorites);
$('#q-doc').addEventListener('input', renderDocuments);

// Brouillons : supprimer
document.addEventListener('click', async e => {
  const del = e.target.closest('[data-del-draft]'); if (!del) return;
  const ok = await confirmBox('Supprimer ce brouillon ?', 'Il sera supprimé de cet appareil. Cette action est définitive.', 'Supprimer');
  if (!ok) return;
  try { localStorage.removeItem(del.dataset.delDraft); } catch (_) { /* ignoré */ }
  scanLocal(); renderCounts(); renderDocuments(); renderHome(); toast('Brouillon supprimé.');
});
$('#b-clear').addEventListener('click', async () => {
  if (!state.drafts.length) return toast('Aucun brouillon à supprimer.');
  const ok = await confirmBox('Vider les brouillons ?', `${plural(state.drafts.length, 'brouillon sera supprimé', 'brouillons seront supprimés')} de cet appareil.`, 'Tout supprimer');
  if (!ok) return;
  state.drafts.forEach(d => { try { localStorage.removeItem(d.key); } catch (_) { /* ignoré */ } });
  scanLocal(); renderCounts(); renderDocuments(); renderHome(); toast('Brouillons supprimés.');
});

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
$('#not-list').addEventListener('click', async e => {
  const r = e.target.closest('[data-read]'), x = e.target.closest('[data-del]'), o = e.target.closest('[data-open]');
  if (r) await markRead([r.dataset.read]);
  else if (o) markRead([o.dataset.open]);
  else if (x) {
    const { error } = await db.from('notifications').delete().eq('id', x.dataset.del).eq('user_id', state.user.id);
    if (error) return toast('Suppression impossible.', true);
    state.notes = state.notes.filter(n => n.id !== x.dataset.del);
    renderCounts(); renderNotifications();
  }
});
$('#read-all').addEventListener('click', async () => {
  const ok = await markRead(state.notes.filter(n => !n.is_read).map(n => n.id));
  if (ok) { toast('Tout est marqué comme lu.'); taki.say('Tout est à jour !', 'celebrating', 3500); }
});
$$('[data-nf]').forEach(b => b.addEventListener('click', () => {
  state.nf = b.dataset.nf;
  $$('[data-nf]').forEach(x => x.classList.toggle('on', x === b));
  renderNotifications();
}));

// Profil
async function saveProfile(patch, okMsg) {
  const { data, error } = await db.from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', state.user.id).select().maybeSingle();
  if (error) { console.error(error); taki.say('L’enregistrement a échoué.', 'error'); toast('Enregistrement impossible.', true); return false; }
  state.profile = { ...state.profile, ...(data || patch) };
  renderProfile(); toast(okMsg); taki.say('C’est enregistré !', 'celebrating', 3500);
  return true;
}
$('#f-profile').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#i-name').value.trim(), tel = $('#i-tel').value.trim();
  if (!name) return toast('Le nom est obligatoire.', true);
  if (tel && !/^[+\d\s().-]{6,40}$/.test(tel)) return toast('Numéro de téléphone invalide.', true);
  const btn = $('#b-save'); btn.disabled = true;
  await saveProfile({ full_name: name, phone_number: tel || null }, 'Profil mis à jour.');
  btn.disabled = false;
});

// Mot de passe et déconnexion
$('#b-pwd').addEventListener('click', async e => {
  const btn = e.currentTarget, mail = state.profile?.email || state.user.email;
  btn.disabled = true;
  const { error } = await db.auth.resetPasswordForEmail(mail, { redirectTo: resetRedirect });
  btn.disabled = false;
  if (error) return toast('Envoi impossible. Réessaie plus tard.', true);
  toast(`E-mail de réinitialisation envoyé à ${mail}.`);
});
$('#logout').addEventListener('click', async () => {
  const ok = await confirmBox('Te déconnecter ?', 'Tu pourras te reconnecter à tout moment.', 'Me déconnecter');
  if (!ok) return;
  await db.auth.signOut();
  location.href = HOME_URL;
});

/* ================= Temps réel (notifications) ================= */
function listenNotifications() {
  try {
    db.channel(`notes-${state.user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${state.user.id}` }, payload => {
        if (!payload?.new || state.notes.some(n => n.id === payload.new.id)) return;
        state.notes.unshift(payload.new);
        renderCounts(); renderNotifications();
        taki.say(payload.new.title || 'Nouvelle notification !', 'celebrating', 6000);
      })
      .subscribe();
  } catch (e) { console.warn('[profile] temps réel indisponible', e); }
}

/* ================= Initialisation ================= */
async function init() {
  $('#yr').textContent = new Date().getFullYear();
  bindTaki();
  const first = parseHash(location.hash);
  go(first.view, first.seg, false);
  taki.init().then(() => taki.set('thinking'));

  db = getDb();
  if (!db) { showAlert('Connexion au service impossible. Recharge la page.'); taki.say('Je n’arrive pas à me connecter…', 'error'); return; }

  const { data: { session } } = await db.auth.getSession();
  if (!session) { location.replace(LOGIN_URL); return; }
  state.user = session.user;
  db.auth.onAuthStateChange(evt => { if (evt === 'SIGNED_OUT') location.href = HOME_URL; });

  try { await loadAll(); listenNotifications(); }
  catch (err) { console.error(err); showAlert('Une erreur est survenue lors du chargement.'); taki.say('Oups, un souci est survenu.', 'error'); }
}

document.addEventListener('DOMContentLoaded', init);
})();
