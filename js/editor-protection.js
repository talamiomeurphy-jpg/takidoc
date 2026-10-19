/* ============================================
   TAKIDOC — FILIGRANE DE L'ÉDITEUR (v4)

   Deux couches, dans UN seul élément placé HORS de #document-canvas
   (donc jamais exporté dans le PDF) :

   1) Couche « marque » : grand « TakiDoc » très pâle, bien espacé.
   2) Couche « traçabilité » : longues lignes de texte (email, code du
      compte, date) presque invisibles, répétées partout. Elles se
      révèlent en augmentant le contraste d'une capture.

   - Aucun blocage : le document reste visible, modifiable, téléchargeable.
   - Les comptes « admin » n'ont pas de filigrane.
   - « Fail closed » : filigrane affiché par défaut, retiré seulement
     si le rôle admin est confirmé par Supabase.
   - La vraie sécurité du rôle est le trigger SQL protect_profile_role.

   Réglages rapides : section « Réglages » ci-dessous.
============================================ */

const WRAPPER_ID = 'document-wrapper';
const WATERMARK_ID = 'takidoc-watermark';
const STYLE_ID = 'takidoc-protection-style';

/* ---------- Réglages ---------- */

// Couche marque (visible, discrète)
const BRAND_TEXT = 'TakiDoc';
const BRAND_SIZE = 26;        // taille du mot
const BRAND_W = 360;          // largeur d'une tuile (2 marques par tuile)
const BRAND_H = 240;          // hauteur d'une tuile
const BRAND_OPACITY = 0.07;   // 0.05 = plus discret, 0.10 = plus visible

// Couche traçabilité (quasi invisible)
const TRACE_SIZE = 40;        // taille du texte
const TRACE_ROW_H = 26;       // distance entre deux lignes
const TRACE_ROWS = 12;         // lignes par motif (alternées, décalées)
const TRACE_OPACITY = 0.055;  // 0.035 = presque invisible, 0.08 = visible

/* ---------- État ---------- */

let active = true;
let roleCheckToken = 0;
let watermarkObserver = null;
let integrityTimer = null;
let currentLabel = { brand: BRAND_TEXT, trace: 'TakiDoc • Aperçu' };

const getWrapper = () => document.getElementById(WRAPPER_ID);

function escapeXML(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  })[c]);
}

/* ---------- Style ---------- */

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;

  style.textContent = `
    #${WRAPPER_ID} { position: relative; }

    #${WATERMARK_ID} {
      position: absolute;
      inset: 0;
      z-index: 50;
      pointer-events: none;   /* ne bloque ni les clics, ni la saisie */
      user-select: none;
      display: none;
    }

    body.takidoc-protected #${WATERMARK_ID} { display: block !important; }
  `;

  document.head.appendChild(style);
}

/* ---------- Mesure du texte (pour que le motif se raccorde sans coupure) ---------- */

let measureCtx = null;

function textWidth(text, size) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = `700 ${size}px Arial, sans-serif`;
  return Math.ceil(measureCtx.measureText(text).width);
}

/* ---------- Couche 1 : marque ---------- */

function brandLayer(label) {
  const text = escapeXML(label.brand);

  // Deux marques par tuile, décalées en quinconce :
  // la couverture reste régulière sur toute la hauteur du document
  const points = [
    [BRAND_W * 0.25, BRAND_H * 0.25],
    [BRAND_W * 0.75, BRAND_H * 0.75]
  ];

  const marks = points.map(([x, y]) =>
    `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" ` +
    `transform="rotate(-28 ${x} ${y})">${text}</text>`
  ).join('');

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BRAND_W}" height="${BRAND_H}">` +
    `<g font-family="Arial, sans-serif" font-size="${BRAND_SIZE}" font-weight="800" ` +
    `letter-spacing="2" fill="#0F172A" fill-opacity="${BRAND_OPACITY}" ` +
    `stroke="#FFFFFF" stroke-opacity="${BRAND_OPACITY}" stroke-width="2" ` +
    `paint-order="stroke">${marks}</g></svg>`;

  return {
    image: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    size: `${BRAND_W}px ${BRAND_H}px`
  };
}

/* ---------- Couche 2 : traçabilité ---------- */

function traceLayer(label) {
  // Une unité de texte, répétée avec un séparateur, assez longue pour remplir la ligne
  const unit = `${label.trace}     ///     `;
  const unitW = textWidth(unit, TRACE_SIZE);
  const repeats = Math.max(2, Math.ceil(900 / unitW));
  const line = escapeXML(unit.repeat(repeats));
  const tileW = unitW * repeats;
  const tileH = TRACE_ROW_H * TRACE_ROWS;

  let rows = '';

  for (let i = 0; i < TRACE_ROWS; i++) {
    const y = TRACE_ROW_H * i + TRACE_ROW_H * 0.7;
    // Lignes impaires décalées d'une demi-unité ; copie à gauche pour raccorder le motif
    const offset = i % 2 ? unitW / 2 : 0;

    rows +=
      `<text x="${-offset}" y="${y}">${line}</text>` +
      `<text x="${-offset + tileW}" y="${y}">${line}</text>`;
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}">` +
    `<g font-family="Arial, sans-serif" font-size="${TRACE_SIZE}" font-weight="700" ` +
    `xml:space="preserve" fill="#0F172A" fill-opacity="${TRACE_OPACITY}" ` +
    `stroke="#FFFFFF" stroke-opacity="${TRACE_OPACITY}" stroke-width="1" ` +
    `paint-order="stroke">${rows}</g></svg>`;

  return {
    image: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    size: `${tileW}px ${tileH}px`
  };
}

/* ---------- Application ---------- */

function applyWatermarkStyle(el, label) {
  const brand = brandLayer(label);

  el.style.backgroundImage = brand.image;
  el.style.backgroundSize = brand.size;
  el.style.backgroundRepeat = 'repeat';
}

function attachWatermark(label) {
  const wrapper = getWrapper();
  if (!wrapper) return;

  let el = document.getElementById(WATERMARK_ID);

  if (!el) {
    el = document.createElement('div');
    el.id = WATERMARK_ID;
    el.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(el);
  }

  applyWatermarkStyle(el, label);
}

/* Le filigrane est-il présent et visible ? Sinon on le remet. */
function ensureWatermark() {
  if (!active) return;

  const el = document.getElementById(WATERMARK_ID);

  if (!el) {
    attachWatermark(currentLabel);
    return;
  }

  const css = getComputedStyle(el);

  const tampered =
    css.display === 'none' ||
    css.visibility === 'hidden' ||
    Number(css.opacity) < 0.9 ||
    !el.style.backgroundImage;

  if (tampered) {
    el.removeAttribute('style');
    applyWatermarkStyle(el, currentLabel);
  }
}

/* Suppression / masquage depuis la console : remis aussitôt, et contrôlé toutes les 2 s */
function watchWatermark() {
  const wrapper = getWrapper();
  if (!wrapper || watermarkObserver) return;

  watermarkObserver = new MutationObserver(ensureWatermark);

  watermarkObserver.observe(wrapper, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  integrityTimer = setInterval(ensureWatermark, 2000);
}

function unwatchWatermark() {
  watermarkObserver?.disconnect();
  watermarkObserver = null;

  clearInterval(integrityTimer);
  integrityTimer = null;
}

/* ---------- Activation / désactivation ---------- */

function setProtection(on, label) {
  active = on;
  document.body.classList.toggle('takidoc-protected', on);

  if (on) {
    currentLabel = label || currentLabel;
    attachWatermark(currentLabel);
    watchWatermark();
  } else {
    unwatchWatermark();
    document.getElementById(WATERMARK_ID)?.remove();
  }
}

/* Texte de traçabilité : email + code du compte + date.
   Retrouver un compte à partir du code :
   select email from profiles where replace(id::text, '-', '') like 'a1b2c3%'; */
function labelFor(user) {
  const date = new Date().toLocaleDateString('fr-FR');

  if (!user?.id) {
    return { brand: BRAND_TEXT, trace: `TakiDoc • Aperçu • ${date}` };
  }

  const code = String(user.id).replace(/-/g, '').slice(0, 6);
  const email = user.email || 'compte';

  return {
    brand: BRAND_TEXT,
    trace: `${email} • #${code} • ${date} • TakiDoc`
  };
}

async function fetchRole(supabase, user) {
  if (!supabase || !user) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data?.role ?? null;
  } catch (error) {
    console.warn('TakiDoc : rôle indisponible, filigrane maintenu.', error);
    return null;
  }
}

async function applyForUser(supabase, user) {
  const token = ++roleCheckToken;

  // Filigrane d'abord (fail closed), retiré seulement si admin confirmé
  setProtection(true, labelFor(user));

  const role = await fetchRole(supabase, user);

  if (token !== roleCheckToken) return;   // une vérification plus récente a pris le relais

  if (role === 'admin') setProtection(false);
}

/* ============================================
   POINT D'ENTRÉE
   À appeler dans initEditor() juste après checkAuth()
   (signature inchangée : editor.js n'a pas à être modifié)
============================================ */

export function initProtection({ supabase, state }) {
  injectStyle();

  // Pas d'await : l'éditeur n'attend pas la vérification du rôle
  applyForUser(supabase, state?.user ?? null);

  // Connexion / déconnexion (y compris dans un autre onglet)
  supabase?.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    if (state) state.user = user;

    // setTimeout : on ne lance pas d'appel Supabase directement dans ce callback
    setTimeout(() => applyForUser(supabase, user), 0);
  });
}