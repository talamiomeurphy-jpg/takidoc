/* ============================================================
   TAKIDOC — js/editor-discover.js : rend les fonctionnalités visibles
   - sous-titre du panneau selon l'onglet, pastille « champs restants »
   - bouton Astuces (fenêtre listant tout ce que l'éditeur sait faire)
   - barre au-dessus du document : zones modifiables + astuce de départ
   - anneau de progression cliquable
   Ne modifie ni le document ni l'export : il ne fait que cliquer sur
   les boutons qui existent déjà (editor.js / editor-app.js).
============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MOBILE = window.matchMedia('(max-width: 900px)');
const HINT_KEY = 'takidoc_discover_hint';
const read = k => { try { return localStorage.getItem(k) === '1'; } catch (_) { return false; } };
const write = k => { try { localStorage.setItem(k, '1'); } catch (_) { /* ignoré */ } };

const SUBS = {
  fields: 'Remplis les champs : le document se met à jour en direct.',
  design: 'Couleur principale, police et photo du document.',
  export: 'Télécharge en PDF ou Word et gère ton brouillon.'
};

/* --- Sous-titre du panneau --- */
function setSub(tab) {
  const el = $('#panelSub');
  if (el && SUBS[tab]) el.textContent = SUBS[tab];
}
$$('.tab-btn').forEach(btn => btn.addEventListener('click', () => setSub(btn.dataset.tab)));
setSub($('.tab-btn.active')?.dataset.tab || 'fields');

/* --- Pastille « champs restants » sur l'onglet Contenu --- */
const fieldsTab = $('.tab-btn[data-tab="fields"]');
const badge = document.createElement('b');
badge.className = 'dz-badge';
badge.hidden = true;
fieldsTab?.append(badge);
const ring = $('#ringText');
function syncBadge() {
  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(ring?.textContent.trim() || '');
  if (!m) return;
  const left = Number(m[2]) - Number(m[1]);
  badge.textContent = String(left);
  badge.hidden = left <= 0;
  badge.title = `${left} champ${left > 1 ? 's' : ''} à personnaliser`;
}
if (ring) { new MutationObserver(syncBadge).observe(ring, { childList: true, characterData: true, subtree: true }); syncBadge(); }

/* --- Anneau de progression cliquable --- */
const prog = $('#appProgress');
if (prog) {
  prog.setAttribute('role', 'button');
  prog.tabIndex = 0;
  prog.title = 'Voir les champs à personnaliser';
  const go = () => {
    const panel = $('#editorSidebar');
    const onFields = $('#tab-fields')?.classList.contains('active');
    const visible = !MOBILE.matches || panel?.classList.contains('open');
    if (!(onFields && visible)) fieldsTab?.click();
    if (!MOBILE.matches) $('#field-search')?.focus();
  };
  prog.addEventListener('click', go);
  prog.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
}

/* --- Zones modifiables --- */
const body = document.body;
const zonesBtn = $('#dz-zones');
let pulseTimer = null;
function setZones(on) {
  body.classList.toggle('dz-show-edit', on);
  zonesBtn?.setAttribute('aria-pressed', String(on));
}
function pulse() {
  if (body.classList.contains('dz-show-edit')) return;
  setZones(true);
  body.classList.add('dz-pulse');
  clearTimeout(pulseTimer);
  pulseTimer = setTimeout(() => { body.classList.remove('dz-pulse'); setZones(false); }, 2600);
}
zonesBtn?.addEventListener('click', () => { clearTimeout(pulseTimer); body.classList.remove('dz-pulse'); setZones(!body.classList.contains('dz-show-edit')); });

/* --- Astuce de départ (disparaît dès qu'on modifie le document ou qu'on la ferme) --- */
const hint = $('#dz-hint');
const dismissHint = () => { if (hint) hint.hidden = true; write(HINT_KEY); };
$('#dz-hint-close')?.addEventListener('click', dismissHint);
$('#document-canvas')?.addEventListener('input', dismissHint, { once: true });
if (hint) hint.hidden = read(HINT_KEY);

/* Quand le document est prêt, on fait clignoter les zones modifiables une seule fois */
let tries = 0;
const waiter = setInterval(() => {
  tries += 1;
  if ($('#document-canvas .direct-editable')) {
    clearInterval(waiter);
    if (!read(HINT_KEY)) pulse();
  } else if (tries > 50) clearInterval(waiter);
}, 400);

/* --- Fenêtre « Astuces » --- */
const overlay = $('#dz-help');
let lastFocus = null;
function openHelp() {
  if (!overlay) return;
  const taki = $('#taki-container');
  const takiCard = $('[data-dz-card="taki"]', overlay);
  if (takiCard) takiCard.hidden = !taki || taki.hidden;
  lastFocus = document.activeElement;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  $('#dz-help-close')?.focus();
}
function closeHelp() {
  if (!overlay?.classList.contains('open')) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  lastFocus?.focus?.();
}
$('#dz-help-btn')?.addEventListener('click', openHelp);
$('#dz-help-close')?.addEventListener('click', closeHelp);
overlay?.addEventListener('mousedown', e => { if (e.target === overlay) closeHelp(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeHelp();
  if (e.key === '?' && !e.ctrlKey && !e.metaKey && !/^(input|textarea|select)$/i.test(e.target.localName) && !e.target.isContentEditable) openHelp();
});

const ACTIONS = {
  zones: () => { clearTimeout(pulseTimer); body.classList.remove('dz-pulse'); setZones(true); },
  fields: () => $('.tab-btn[data-tab="fields"]')?.click(),
  design: () => $('.tab-btn[data-tab="design"]')?.click(),
  export: () => $('.tab-btn[data-tab="export"]')?.click(),
  fit: () => $('#btn-zoom-fit')?.click(),
  save: () => $('#btn-save-draft')?.click(),
  taki: () => $('#taki-container')?.click()
};
overlay?.addEventListener('click', e => {
  const btn = e.target.closest('[data-dz]');
  if (!btn) return;
  closeHelp();
  setTimeout(() => ACTIONS[btn.dataset.dz]?.(), 120);
});
