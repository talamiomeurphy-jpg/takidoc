/* ============================================================
   TAKIDOC — js/editor-app.js : interface « application » de l'éditeur
   - panneau d'outils (réductible sur ordinateur, feuille sur mobile)
   - recherche de champ et progression de la personnalisation
   - Taki compagnon : bulle, menu rapide, mode discret
   Ce module ne touche jamais au document ni à l'export : il ne
   manipule que l'interface autour (editor.js garde la logique).
============================================================ */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const QUIET_KEY = 'takidoc_taki_quiet';
const PANEL_KEY = 'takidoc_panel_collapsed';
const MOBILE = window.matchMedia('(max-width: 900px)');

const readFlag = key => { try { return localStorage.getItem(key) === '1'; } catch (_) { return false; } };
const writeFlag = (key, on) => { try { localStorage.setItem(key, on ? '1' : '0'); } catch (_) { /* ignoré */ } };
const plain = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/* ------------------------------------------------------------
   Progression : anneau de la barre + jauge du panneau
------------------------------------------------------------ */
export function renderProgress(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const full = total > 0 && done >= total;
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  set('ringText', `${done}/${total}`);
  set('fprog-text', `${done} / ${total}`);
  set('fprog-pct', `${pct} %`);
  $('#ringFill')?.style.setProperty('--p', String(pct));
  const fill = $('#fprog-fill');
  if (fill) fill.style.width = `${pct}%`;
  $('#fprog')?.classList.toggle('full', full);
  $('#appProgress')?.classList.toggle('full', full);
  const bar = $('#appProgress');
  if (bar) bar.hidden = total === 0;
  const prog = $('#fprog');
  if (prog) prog.hidden = total === 0;
}

/* ------------------------------------------------------------
   Taki compagnon : bulle de paroles avec cooldown et mode discret
------------------------------------------------------------ */
export function createCoach(taki) {
  const seen = new Set();
  let quiet = readFlag(QUIET_KEY);
  let lastAt = 0;
  let hideTimer = null;
  let moodTimer = null;

  function bubble(text, ms) {
    const el = $('#tkBubble');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  /**
   * @param {string} text
   * @param {'idle'|'thinking'|'working'|'celebrating'|'error'} mood
   * @param {{key?: string, ms?: number, force?: boolean}} options
   *   key   : un message avec la même clé n'est dit qu'une fois par visite
   *   force : ignore le mode discret, la clé et le délai entre deux messages
   */
  function say(text, mood = 'idle', { key = null, ms = 5200, force = false } = {}) {
    if (!text || !taki.available) return false;
    if (document.body.classList.contains('taki-story')) return false;
    if (!force) {
      if (quiet) return false;
      if (key && seen.has(key)) return false;
      if (Date.now() - lastAt < 4500) return false;
    }
    if (key) seen.add(key);
    lastAt = Date.now();
    taki.mood(mood);
    bubble(text, ms);
    clearTimeout(moodTimer);
    if (mood !== 'idle') moodTimer = setTimeout(() => taki.mood('idle'), Math.min(ms, 3800));
    return true;
  }

  function setQuiet(value) {
    quiet = Boolean(value);
    writeFlag(QUIET_KEY, quiet);
    if (quiet) $('#tkBubble')?.classList.remove('show');
  }

  return { say, setQuiet, get quiet() { return quiet; } };
}

/* ------------------------------------------------------------
   Espace de travail
------------------------------------------------------------ */
export function initWorkspace({ coach, taki }) {
  const panel = $('#editorSidebar');
  const body = document.body;
  let currentTab = $('.tab-btn.active')?.dataset.tab || 'fields';

  const fit = () => $('#btn-zoom-fit')?.click();
  const sheetOpen = () => panel?.classList.contains('open');

  /* --- Retour : revient à la page précédente du site, sinon à l'accueil --- */
  $('#ab-back')?.addEventListener('click', event => {
    try {
      if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) {
        event.preventDefault();
        history.back();
      }
    } catch (_) { /* lien normal */ }
  });

  /* --- Panneau réductible (ordinateur) --- */
  const collapse = (on, { remember = true } = {}) => {
    body.classList.toggle('panel-collapsed', on);
    $('#panel-toggle')?.setAttribute('aria-pressed', String(on));
    if (remember) writeFlag(PANEL_KEY, on);
    setTimeout(fit, 320);   // le document se recale sur la nouvelle largeur
  };
  if (!MOBILE.matches && readFlag(PANEL_KEY)) collapse(true, { remember: false });
  $('#panel-toggle')?.addEventListener('click', () => collapse(!body.classList.contains('panel-collapsed')));

  /* --- Feuille (mobile) --- */
  const setSheet = open => {
    if (!panel) return;
    panel.classList.toggle('open', open);
  };
  new MutationObserver(() => body.classList.toggle('sheet-open', MOBILE.matches && sheetOpen()))
    .observe(panel, { attributes: true, attributeFilter: ['class'] });

  $('#sheetClose')?.addEventListener('click', () => setSheet(false));
  $('#canvasArea')?.addEventListener('pointerdown', () => { if (MOBILE.matches && sheetOpen()) setSheet(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && MOBILE.matches && sheetOpen()) setSheet(false);
  });
  let touchY = null;
  const head = $('.panel-head'), handle = $('#sheetHandle');
  [head, handle].forEach(el => {
    el?.addEventListener('touchstart', event => { touchY = event.touches[0].clientY; }, { passive: true });
    el?.addEventListener('touchend', event => {
      if (touchY !== null && event.changedTouches[0].clientY - touchY > 60) setSheet(false);
      touchY = null;
    }, { passive: true });
  });
  MOBILE.addEventListener?.('change', () => { setSheet(false); body.classList.remove('sheet-open'); if (!MOBILE.matches && readFlag(PANEL_KEY)) collapse(true, { remember: false }); });

  /* --- Onglets : titre du panneau, ouverture de la feuille, petite phrase de Taki --- */
  const TAB_HINTS = {
    design: 'Ici tu changes la couleur, la police et la photo.',
    export: 'Choisis PDF ou Word : je prépare le fichier.'
  };
  $$('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;
      const same = tab === currentTab;
      currentTab = tab;
      const title = $('#panelTitle');
      if (title) title.textContent = button.dataset.title || button.textContent.trim();
      if (MOBILE.matches) setSheet(same && sheetOpen() ? false : true);
      else if (body.classList.contains('panel-collapsed')) collapse(false);
      if (TAB_HINTS[tab]) coach.say(TAB_HINTS[tab], 'thinking', { key: `tab-${tab}` });
    });
  });

  /* --- Enregistrer depuis la barre --- */
  $('#app-save')?.addEventListener('click', () => $('#btn-save-draft')?.click());

  /* --- Recherche de champ --- */
  const search = $('#field-search');
  search?.addEventListener('input', () => {
    const q = plain(search.value.trim());
    let visible = 0;
    $$('#fields-form .form-group').forEach(group => {
      const hit = !q || plain(group.textContent).includes(q) || plain($('input,textarea', group)?.value).includes(q);
      group.hidden = !hit;
      if (hit) visible += 1;
    });
    const empty = $('#field-empty');
    if (empty) empty.hidden = visible > 0 || !q;
  });

  /* --- Taki : menu rapide et mode discret --- */
  const host = $('#taki-container');
  const menu = $('#tkPanel');
  const TIPS = [
    'Clique directement sur le texte du document pour le modifier.',
    'Le champ que tu modifies s’éclaire dans le document.',
    'Ton brouillon s’enregistre tout seul sur cet appareil.',
    'Une couleur principale change tout le document d’un clic.'
  ];
  let tip = 0;
  const toggleMenu = open => {
    if (!menu) return;
    const show = open ?? menu.hidden;
    menu.hidden = !show;
    if (show) {
      $('#tkTip').textContent = TIPS[tip++ % TIPS.length];
      $('#tkBubble')?.classList.remove('show');
      taki.mood('thinking');
      setTimeout(() => taki.mood('idle'), 1800);
    }
  };
  host?.addEventListener('click', () => { if (!host.classList.contains('is-center')) toggleMenu(); });
  document.addEventListener('click', event => {
    if (menu && !menu.hidden && !event.target.closest('#tkPanel, #taki-container')) toggleMenu(false);
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu && !menu.hidden) toggleMenu(false); });
  menu?.addEventListener('click', event => {
    const item = event.target.closest('[data-tk]');
    if (!item) return;
    toggleMenu(false);
    if (item.dataset.tk === 'download') ($(MOBILE.matches ? '#mobileBtnDownload' : '#header-download-btn'))?.click();
    else if (item.dataset.tk === 'save') $('#btn-save-draft')?.click();
    else if (item.dataset.tk === 'fit') fit();
  });
  const talk = $('#tkTalk');
  if (talk) {
    talk.checked = !coach.quiet;
    talk.addEventListener('change', () => {
      coach.setQuiet(!talk.checked);
      if (talk.checked) coach.say('Je reprends la parole !', 'celebrating', { force: true, ms: 3000 });
    });
  }
}
