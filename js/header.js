/* ============================================================
   TAKIDOC — EN-TÊTE DYNAMIQUE (v2.1)
   Utilisation : <div id="td-header-container"></div>
                 <link rel="stylesheet" href="css/header.css">
                 <script src="js/header.js" defer></script>
   Si le conteneur est absent, il est créé en haut de <body>.
   API : window.TakiDocHeader.{ refresh(), getUser(), setFavorites(ids), client }
   Client Supabase partagé : window.supabaseClient
   Événement écouté : "takidoc:favorites-changed" (met à jour le compteur)
   ============================================================ */
(function () {
  'use strict';

  const CFG = {
    supabaseUrl: 'https://wyfkogowsdbxctbpfuud.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM',
    favKey: 'takidoc_favorites',
    catKey: 'takidoc_categories_v2',
    home: 'index.html',
    fonts: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap',
    icons: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'
  };

  const MAIN = [
    { id: 'index', name: 'Accueil', url: 'index.html', icon: 'fa-house' },
    { id: 'models', name: 'Modèles', url: 'index.html#catalog', icon: 'fa-folder-open', menu: 'cats' },
    { id: 'comment-ca-marche', name: 'Comment ça marche', url: 'comment-ca-marche.html', icon: 'fa-circle-question', low: true },
    { id: 'a-propos', name: 'À propos', url: 'a-propos.html', icon: 'fa-circle-info', low: true },
    { id: 'contact', name: 'Contact', url: 'contact.html', icon: 'fa-envelope', low: true }
  ];
  const LEGAL = [
    ['Conditions d’utilisation', 'conditions.html'], ['CGV', 'cgv.html'], ['Confidentialité', 'confidentialite.html'],
    ['Mentions légales', 'mentions-legales.html'], ['Cookies', 'cookies.html'], ['Licence', 'licence.html'],
    ['Réclamations et remboursements', 'reclamations-remboursements.html']
  ];
  const FALLBACK_CATS = [['cv', 'CV'], ['lettre', 'Lettres'], ['contrat', 'Contrats'], ['facture', 'Factures'], ['devis', 'Devis'],
    ['attestation', 'Attestations'], ['administratif', 'Administratif']].map(([id, name]) => ({ id, name }));
  const ICONS = [['cv', 'fa-id-card'], ['lettre', 'fa-envelope'], ['contrat', 'fa-file-signature'], ['commercial', 'fa-briefcase'],
    ['attestation', 'fa-stamp'], ['administr', 'fa-building-columns'], ['facture', 'fa-receipt'], ['devis', 'fa-file-invoice-dollar'],
    ['rapport', 'fa-chart-column'], ['procuration', 'fa-signature'], ['declaration', 'fa-file-circle-check'], ['certificat', 'fa-award']];

  /* Client Supabase unique, créé tout de suite et partagé avec les autres scripts */
  let sbClient = window.supabaseClient || null;
  if (!sbClient && window.supabase?.createClient) {
    sbClient = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
    window.supabaseClient = sbClient;
  }

  const S = { sb: sbClient, user: null, cats: FALLBACK_CATS, notes: [], remoteFav: new Set(), bound: false };
  let box = null;

  /* ---------- Utilitaires ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const catIcon = n => (ICONS.find(([k]) => norm(n).includes(k)) || [0, 'fa-folder'])[1];
  const page = () => (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  const initials = n => (String(n || '').split(/[\s._@-]+/).filter(Boolean).map(p => p[0]).join('').toUpperCase().slice(0, 2)) || 'TD';
  const displayName = u => u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email || 'Mon compte';
  const catUrl = id => `index.html?categorie=${encodeURIComponent(id)}#catalog`;
  const ago = iso => {
    const s = Math.round((new Date(iso) - Date.now()) / 1000), f = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
    for (const [u, n] of [['day', 86400], ['hour', 3600], ['minute', 60]]) if (Math.abs(s) >= n) return f.format(Math.round(s / n), u);
    return 'à l’instant';
  };
  const localFav = () => { try { return JSON.parse(localStorage.getItem(CFG.favKey) || '[]').map(String); } catch (e) { return []; } };
  const favCount = () => new Set([...localFav(), ...S.remoteFav]).size;

  function ensureAssets() {
    const add = (href, test) => { if (!document.querySelector(test)) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); } };
    add(CFG.fonts, 'link[href*="Bricolage"]');
    add(CFG.icons, 'link[href*="font-awesome"],link[href*="fontawesome"]');
  }

  /* ---------- Rendu ---------- */
  



const logo = (cls = '') => `
  <a class="td-logo ${cls}" href="${CFG.home}" aria-label="TakiDoc, accueil">
    <img
      src="favicon-32x32.png"
      alt=""
      width="36"
      height="36"
    >
    <span class="td-logo-wordmark"><span class="td-logo-taki">Taki</span><span class="td-logo-doc">Doc</span></span>
  </a>`;








  const dd = (id, label, body, cls = '') => `<div class="td-dd ${cls}"><button class="td-nl" type="button" data-dd="${id}" aria-haspopup="true" aria-expanded="false">${label}<i class="fa-solid fa-chevron-down"></i></button><div class="td-menu" role="menu">${body}</div></div>`;
  const catLinks = () => S.cats.map(c => `<a class="td-mi" role="menuitem" href="${catUrl(c.id)}"><i class="fa-solid ${catIcon(c.name + ' ' + c.id)}"></i>${esc(c.name)}</a>`).join('') +
    `<a class="td-mi td-all" role="menuitem" href="index.html#catalog"><i class="fa-solid fa-border-all"></i>Tous les documents</a>`;

  
function nav(cur) {
  const information = MAIN
    .filter(m => m.low)
    .map(m => `
      <a class="td-mi" role="menuitem" href="${m.url}">
        <i class="fa-solid ${m.icon}"></i>${m.name}
      </a>
    `)
    .join('');

  const legalLinks = LEGAL
    .map(([name, url]) => `
      <a class="td-mi" role="menuitem" href="${url}">
        <i class="fa-regular fa-file-lines"></i>${name}
      </a>
    `)
    .join('');

  return `
    <nav class="td-nav" aria-label="Navigation principale">
      ${MAIN.filter(m => !m.low).map(m => m.menu
        ? dd('cats', 'Modèles', catLinks(), 'td-wide')
        : `<a class="td-nl${cur === m.id ? ' on' : ''}" href="${m.url}">${m.name}</a>`
      ).join('')}

      ${dd(
        'legal',
        'Plus',
        information + legalLinks,
        'td-right'
      )}
    </nav>`;
}


  function search(id) {
    const q = new URLSearchParams(location.search).get('q') || '';
    return `<form class="td-sf" action="index.html" method="get" role="search"><i class="fa-solid fa-magnifying-glass"></i>
      <input id="${id}" type="search" name="q" value="${esc(q)}" placeholder="Rechercher un CV, un contrat, une facture…" aria-label="Rechercher un document" autocomplete="off" enterkeyhint="search"></form>`;
  }

  function favBtn() {
    const n = favCount();
    return `<a class="td-ib" href="profile.html#favorites" aria-label="Mes favoris${n ? ` (${n})` : ''}" data-fav><i class="fa-${n ? 'solid' : 'regular'} fa-heart"></i><em ${n ? '' : 'hidden'}>${n}</em></a>`;
  }

  function bell() {
    const unread = S.notes.filter(n => !n.is_read).length;
    const list = S.notes.length ? S.notes.map(n => `<a class="td-note${n.is_read ? '' : ' new'}" href="${esc(n.link || 'profile.html')}" data-note="${esc(n.id)}"><b>${esc(n.title)}</b><span>${esc(n.message)}</span><small>${ago(n.created_at)}</small></a>`).join('')
      : '<p class="td-empty"><i class="fa-regular fa-bell"></i>Aucune notification pour le moment.</p>';
    return `<div class="td-dd td-right"><button class="td-ib" type="button" data-dd="notes" aria-haspopup="true" aria-expanded="false" aria-label="Notifications${unread ? ` (${unread} non lues)` : ''}"><i class="fa-regular fa-bell"></i><em ${unread ? '' : 'hidden'}>${unread}</em></button>
      <div class="td-menu td-notes"><div class="td-mh"><strong>Notifications</strong>${unread ? '<button type="button" data-readall>Tout marquer comme lu</button>' : ''}</div>${list}</div></div>`;
  }

  const userLinks = (c) => `<a class="${c}" href="profile.html"><i class="fa-regular fa-user"></i>Mon profil</a><a class="${c}" href="profile.html#documents"><i class="fa-regular fa-file-lines"></i>Mes documents</a><a class="${c}" href="profile.html#favorites"><i class="fa-regular fa-heart"></i>Mes favoris</a><a class="${c}" href="profile.html#settings"><i class="fa-solid fa-gear"></i>Paramètres</a><a class="${c}" href="contact.html"><i class="fa-regular fa-circle-question"></i>Aide et support</a>`;

  function account() {
    if (!S.user) return `<a class="td-bt td-g" href="auth.html?action=login">Se connecter</a><a class="td-bt td-p" href="auth.html?action=signup">S’inscrire</a>`;
    const n = displayName(S.user), i = initials(n);
    return `${bell()}<div class="td-dd td-right"><button class="td-ub" type="button" data-dd="user" aria-haspopup="true" aria-expanded="false" aria-label="Menu du compte"><span class="td-av">${esc(i)}</span><span class="td-un">${esc(n.split(' ')[0])}</span><i class="fa-solid fa-chevron-down"></i></button>
      <div class="td-menu td-user"><div class="td-uh"><span class="td-av lg">${esc(i)}</span><div><strong>${esc(n)}</strong><small>${esc(S.user.email)}</small></div></div>${userLinks('td-mi')}<button class="td-mi out" type="button" data-logout><i class="fa-solid fa-arrow-right-from-bracket"></i>Se déconnecter</button></div></div>`;
  }

  function drawer(cur, bare) {
    const u = S.user, n = u ? displayName(u) : '';
    return `<aside class="td-drawer" id="td-drawer" aria-label="Menu" aria-hidden="true"><div class="td-dh">${logo()}<button class="td-ib" type="button" data-close aria-label="Fermer le menu"><i class="fa-solid fa-xmark"></i></button></div>
      ${bare ? '' : search('td-q-m')}
      <div class="td-dn">${bare ? '' : MAIN.map(m => `<a class="td-dl${cur === m.id ? ' on' : ''}" href="${m.url}"><i class="fa-solid ${m.icon}"></i>${m.name}</a>`).join('')}
      ${bare ? '' : `<p class="td-st">Catégories</p>${S.cats.map(c => `<a class="td-dl sub" href="${catUrl(c.id)}"><i class="fa-solid ${catIcon(c.name + ' ' + c.id)}"></i>${esc(c.name)}</a>`).join('')}`}
      ${u ? `<p class="td-st">Mon compte</p>${userLinks('td-dl sub')}` : ''}
      <p class="td-st">Informations</p>${LEGAL.map(([t, l]) => `<a class="td-dl sub" href="${l}"><i class="fa-regular fa-file-lines"></i>${t}</a>`).join('')}</div>
      <div class="td-df">${u ? `<div class="td-uh"><span class="td-av lg">${esc(initials(n))}</span><div><strong>${esc(n)}</strong><small>${esc(u.email)}</small></div></div><button class="td-dl out" type="button" data-logout><i class="fa-solid fa-arrow-right-from-bracket"></i>Se déconnecter</button>`
        : `<a class="td-bt td-g" href="auth.html?action=login">Se connecter</a><a class="td-bt td-p" href="auth.html?action=signup">Créer un compte</a>`}</div></aside><div class="td-ov" data-close></div>`;
  }

  function render() {
    if (!box) return;
    // On mémorise l'état de l'interface pour le restaurer après le redessin
    const a = document.activeElement;
    const keep = a && box.contains(a) && a.id ? { id: a.id, v: a.value, s: a.selectionStart, e: a.selectionEnd } : null;
    const drawerWasOpen = !!$('#td-drawer.open', box);

    const cur = page(), bare = ['auth'].includes(cur), noSearch = cur === 'editor' || cur === 'profile';
    box.innerHTML = `<header class="td-h" role="banner"><div class="td-in">${logo()}
      ${bare ? '<a class="td-bt td-g td-back" href="index.html"><i class="fa-solid fa-arrow-left"></i>Retour à l’accueil</a>' : nav(cur) + (noSearch ? '<span class="td-sp"></span>' : search('td-q'))}
      ${bare ? '' : `<div class="td-act">${favBtn()}${account()}</div><button class="td-ib td-burger" type="button" data-open aria-label="Ouvrir le menu" aria-controls="td-drawer"><i class="fa-solid fa-bars"></i></button>`}
    </div></header>${drawer(cur, bare)}`;

    if (drawerWasOpen) {
      $('#td-drawer', box)?.classList.add('open'); $('.td-ov', box)?.classList.add('open');
      $('#td-drawer', box)?.setAttribute('aria-hidden', 'false');
    }
    if (keep) {
      const n = document.getElementById(keep.id);
      if (n) {
        n.focus({ preventScroll: true });
        if (keep.v !== undefined) { n.value = keep.v; try { n.setSelectionRange(keep.s, keep.e); } catch (e) { /* type non supporté */ } }
      }
    }
  }

  /* ---------- Interactions (écouteurs posés une seule fois) ---------- */
  function closeMenus(except) {
    $$('.td-dd.open', box).forEach(d => { if (d !== except) { d.classList.remove('open'); $('[data-dd]', d)?.setAttribute('aria-expanded', 'false'); } });
  }
  function setDrawer(open) {
    const d = $('#td-drawer', box); if (!d) return;
    d.classList.toggle('open', open); $('.td-ov', box)?.classList.toggle('open', open);
    d.setAttribute('aria-hidden', String(!open)); document.documentElement.classList.toggle('td-lock', open);
    if (open) $('[data-close]', d)?.focus();
  }
  async function markRead(ids) {
    if (!S.sb || !S.user || !ids.length) return;
    S.notes.forEach(n => { if (ids.includes(String(n.id))) n.is_read = true; });
    const { error } = await S.sb.from('notifications').update({ is_read: true }).in('id', ids).eq('user_id', S.user.id);
    if (error) console.warn('Notifications :', error.message);
  }
  function bind() {
    if (S.bound) return; S.bound = true;
    box.addEventListener('click', async e => {
      const t = e.target;
      const trg = t.closest('[data-dd]');
      if (trg) { const d = trg.closest('.td-dd'), o = !d.classList.contains('open'); closeMenus(d); d.classList.toggle('open', o); trg.setAttribute('aria-expanded', String(o)); return; }
      if (t.closest('[data-open]')) return setDrawer(true);
      if (t.closest('[data-close]')) return setDrawer(false);
      if (t.closest('[data-logout]')) { e.preventDefault(); try { await S.sb?.auth.signOut(); } finally { location.href = CFG.home; } return; }
      if (t.closest('[data-readall]')) { await markRead(S.notes.filter(n => !n.is_read).map(n => String(n.id))); render(); return; }
      const note = t.closest('[data-note]'); if (note) markRead([note.dataset.note]);
      if (t.closest('.td-drawer a')) setDrawer(false);
    });
    document.addEventListener('click', e => { if (!e.target.closest('.td-dd')) closeMenus(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeMenus(); setDrawer(false); }
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && $('#td-q')) { e.preventDefault(); $('#td-q').focus(); }
    });
    addEventListener('scroll', () => box.classList.toggle('td-sc', scrollY > 6), { passive: true });
    addEventListener('resize', () => { if (innerWidth > 1040) setDrawer(false); });
    addEventListener('storage', e => { if (e.key === CFG.favKey) render(); });
    addEventListener('takidoc:favorites-changed', render);
  }

  /* ---------- Données Supabase ---------- */
  async function loadCats() {
    try { const c = JSON.parse(sessionStorage.getItem(CFG.catKey)); if (c?.length) { S.cats = c; render(); } } catch (e) { /* cache absent */ }
    if (!S.sb) return;
    const { data, error } = await S.sb.from('template_categories').select('id,name,display_order').order('display_order', { ascending: true });
    if (error || !data?.length) return;
    S.cats = data; try { sessionStorage.setItem(CFG.catKey, JSON.stringify(data)); } catch (e) { /* stockage plein */ }
    render();
  }
  async function loadUserData() {
    if (!S.sb || !S.user) { S.notes = []; S.remoteFav = new Set(); render(); return; }
    const [f, n] = await Promise.all([
      S.sb.from('favorites').select('template_id').eq('user_id', S.user.id),
      S.sb.from('notifications').select('id,title,message,link,is_read,created_at').eq('user_id', S.user.id).order('created_at', { ascending: false }).limit(6)
    ]);
    S.remoteFav = new Set((f.data || []).map(r => String(r.template_id)));
    S.notes = n.data || [];
    render();
  }

  async function init() {
    ensureAssets();
    box = $('#td-header-container');
    if (!box) { box = document.createElement('div'); box.id = 'td-header-container'; document.body.prepend(box); }
    render(); bind();                       // affichage immédiat, avant tout appel réseau
    if (S.sb) {
      try { S.user = (await S.sb.auth.getSession()).data.session?.user || null; } catch (e) { console.warn('En-tête : session indisponible', e); }
      S.sb.auth.onAuthStateChange((_ev, session) => {
        const id = session?.user?.id; if (id === S.user?.id) return;
        S.user = session?.user || null; render(); setTimeout(loadUserData, 0);
      });
    }
    render(); loadCats(); loadUserData();
  }

  window.TakiDocHeader = {
    refresh: render,
    getUser: () => S.user,
    client: sbClient,
    setFavorites: ids => { S.remoteFav = new Set((ids || []).map(String)); render(); }
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
