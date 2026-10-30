/* ============================================================
TAKIDOC — PAGINATION A4 (éditeur + export PDF multi-pages)
Version 2.0 — Robustesse améliorée

Ce module :
- compte les pages A4 du document et les affiche dans l'éditeur
  (pastille « page courante / total » + repères de saut de page) ;
- exporte un PDF de 1, 2, 3… pages selon la longueur réelle ;
- coupe les pages dans un espace vide, jamais au milieu d'une ligne ;
- gère les images externes (CORS) et les polices Google Fonts ;
- applique des timeouts pour éviter les blocages ;
- affiche une progression pendant l'export.

Dépendances globales :
  window.html2canvas, window.jspdf.jsPDF
============================================================ */

const TOLERANCE_PX = 22;        // dépassement toléré avant de créer une page de plus
const MAX_CANVAS_PX = 16000;    // limite sûre de hauteur de canvas (Safari / mobiles)
const IMAGE_LOAD_TIMEOUT = 5000;   // 5s max par image
const TOTAL_IMAGE_TIMEOUT = 10000; // 10s max pour toutes les images
const EXPORT_TIMEOUT = 30000;      // 30s max pour l'export complet

let ui = null;                  // état de l'interface de pagination
let refreshQueued = false;

const pageHeightPx = canvas => canvas.offsetWidth * 297 / 210;

/* ============================================================
   COMPTEUR DE PAGES
============================================================ */
export function countPages(canvas) {
  return canvas ? computeBreaks(canvas).length + 1 : 1;
}

/* ============================================================
   INTERFACE : pastille, repères, note dans l'onglet Export
============================================================ */
function injectStyles() {
  if (document.getElementById('td-pagination-css')) return;
  const style = document.createElement('style');
  style.id = 'td-pagination-css';
  style.textContent = `
    .td-guides {
      position: absolute; left: 0; top: 0; width: 100%; height: 0;
      pointer-events: none; z-index: 3;
    }
    .td-guide {
      position: absolute; left: -18px; right: -18px; height: 0;
      border-top: 2px dashed rgba(255, 107, 53, 0.9);
    }
    .td-guide::after {
      content: attr(data-label);
      position: absolute; right: 18px; top: 0;
      transform: translateY(-50%);
      padding: 3px 12px; border-radius: 999px;
      background: #FF6B35; color: #fff;
      font: 700 11px/1.4 Inter, system-ui, sans-serif;
      letter-spacing: 0.02em;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      white-space: nowrap;
    }
    .page-pill {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 0 4px 0 12px; margin-left: 2px;
      border-left: 1px solid #E2E8F0;
      font: 700 0.85rem/1 Inter, system-ui, sans-serif;
      color: #0F172A; white-space: nowrap;
    }
    .page-pill i { color: #FF6B35; }
    .page-pill .sep { color: #94A3B8; font-weight: 600; }
    .page-note {
      display: flex; gap: 10px; align-items: flex-start;
      margin-bottom: 16px; padding: 12px 14px;
      border-radius: 12px;
      background: #FFF5F0;
      border: 1px solid rgba(255, 107, 53, 0.25);
      color: #0F172A; font-size: 0.85rem; line-height: 1.5;
    }
    .page-note i { margin-top: 3px; color: #FF6B35; }
    @media (max-width: 768px) {
      .td-guide::after { right: 24px; font-size: 10px; padding: 2px 9px; }
    }
  `;
  document.head.appendChild(style);
}

function buildUI(ctx) {
  injectStyles();
  const { $ } = ctx;

  const bar = $('.zoom-controls-floating');
  if (bar && !$('#page-pill')) {
    const pill = document.createElement('span');
    pill.id = 'page-pill';
    pill.className = 'page-pill';
    pill.setAttribute('role', 'status');
    pill.innerHTML = `
      <i class="fas fa-file-lines" aria-hidden="true"></i>
      <span id="page-now">1</span>
      <span class="sep">/</span>
      <span id="page-count">1</span>
    `;
    bar.appendChild(pill);
  }

  const quality = $('#pdf-quality');
  if (quality && !$('#page-note')) {
    const note = document.createElement('div');
    note.id = 'page-note';
    note.className = 'page-note';
    note.innerHTML = `
      <i class="fas fa-layer-group" aria-hidden="true"></i>
      <span id="page-note-text"></span>
    `;
    quality.closest('.form-group')?.before(note);
  }

  const wrapper = $('#document-wrapper');
  if (wrapper && !$('#td-guides')) {
    const guides = document.createElement('div');
    guides.id = 'td-guides';
    guides.className = 'td-guides';
    guides.setAttribute('data-html2canvas-ignore', 'true');
    guides.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(guides);
  }
}

function currentPage(ctx, total) {
  const { $, state } = ctx;
  const area = $('#canvasArea');
  const wrapper = $('#document-wrapper');
  const canvas = ctx.getCanvas();
  if (!area || !wrapper || !canvas) return 1;

  const top = wrapper.getBoundingClientRect().top - area.getBoundingClientRect().top;
  const reference = area.clientHeight * 0.35;
  const docY = (reference - top) / (state.zoom || 1);
  return Math.min(total, Math.max(1, Math.floor(docY / pageHeightPx(canvas)) + 1));
}

function refresh() {
  refreshQueued = false;
  if (!ui) return;

  const { $, getCanvas } = ui;
  const canvas = getCanvas();
  if (!canvas) return;

  const breaks = computeBreaks(canvas);
  const total = breaks.length + 1;
  const ph = pageHeightPx(canvas);

  const count = $('#page-count');
  const now = $('#page-now');
  const pill = $('#page-pill');

  if (count) count.textContent = total;
  if (now) now.textContent = currentPage(ui, total);
  if (pill) pill.title = `${total} page${total > 1 ? 's' : ''} A4`;

  const text = $('#page-note-text');
  if (text) {
    text.textContent = total > 1
      ? `Votre document fera ${total} pages A4 dans le PDF. Les pages sont coupées entre deux lignes, jamais au milieu d'un texte.`
      : 'Votre document tient sur 1 page A4.';
  }

  const guides = $('#td-guides');
  if (guides) {
    guides.replaceChildren();
    breaks.forEach((at, i) => {
      const line = document.createElement('div');
      line.className = 'td-guide';
      line.style.top = `${at}px`;
      line.dataset.label = `Page ${i + 2}`;
      guides.appendChild(line);
    });
  }
}

export function refreshPages() {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(refresh);
}

/** À appeler une fois le document affiché :
 *  initPagination({ state, $, $$, getCanvas })
 */
export function initPagination(ctx) {
  ui = ctx;
  buildUI(ctx);
  const canvas = ctx.getCanvas();
  if (!canvas) return;

  if (!initPagination.bound) {
    initPagination.bound = true;
    new ResizeObserver(refreshPages).observe(canvas);
    canvas.addEventListener('input', refreshPages);
    ctx.$('#canvasArea')?.addEventListener('scroll', refreshPages, { passive: true });
    addEventListener('resize', refreshPages);
    ['btn-zoom-in', 'btn-zoom-out', 'btn-zoom-fit'].forEach(id =>
      document.getElementById(id)?.addEventListener('click', () => setTimeout(refreshPages, 350))
    );
  }
  refreshPages();
}

/* ============================================================
   DÉCOUPAGE EN PAGES (identique dans l'éditeur et dans le PDF)
============================================================ */
const MARGIN_MM = 12;           // marge haut/bas sur les pages 2, 3… du PDF
const marginPx = canvas => canvas.offsetWidth * MARGIN_MM / 210;

/**
 * Zones occupées (haut, bas) par le texte, les images et les graphiques, en px du document.
 */
function occupiedBands(canvas) {
  const box = canvas.getBoundingClientRect();
  const z = box.width / canvas.offsetWidth || 1;
  const bands = [];
  const add = r => {
    if (r.height > 0.5 && r.width > 0.5) {
      bands.push([(r.top - box.top) / z, (r.bottom - box.top) / z]);
    }
  };

  const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim() || n.parentElement?.closest('style,script')) continue;
    range.selectNodeContents(n);
    [...range.getClientRects()].forEach(add);
  }

  canvas.querySelectorAll('img,svg,canvas,hr').forEach(el => add(el.getBoundingClientRect()));
  return bands;
}

/**
 * Positions (px du document) où commence chaque nouvelle page.
 * Une coupure est toujours placée juste au-dessus d'une ligne :
 * aucune ligne n'est coupée en deux.
 */
export function computeBreaks(canvas) {
  const ph = pageHeightPx(canvas);
  const m = marginPx(canvas);
  const total = canvas.scrollHeight;
  const bands = occupiedBands(canvas);
  const breaks = [];
  let y = 0;

  for (let guard = 0; guard < 200; guard++) {
    const remaining = total - y;
    if (remaining <= (y === 0 ? ph : ph - m) + TOLERANCE_PX) break;

    const target = y + (y === 0 ? ph - m : ph - 2 * m);
    const floor = y + ph * 0.5;
    let cut = target;

    for (let i = 0; i < 60; i++) {
      const crossing = bands.filter(([top, bottom]) => top < cut - 0.5 && bottom > cut + 0.5);
      if (!crossing.length) break;
      cut = Math.min(...crossing.map(([top]) => top)) - 4;
      if (cut <= floor) { cut = target; break; }
    }

    breaks.push(Math.round(cut));
    y = cut;
  }

  return breaks;
}

/* ============================================================
   EXPORT PDF — VERSION ROBUSTE
   - Préchargement des images avec timeout
   - Préchargement des polices Google Fonts
   - Timeout global de 30 secondes
   - Feedback de progression
   - Gestion d'erreurs explicite
============================================================ */

/**
 * Attend que toutes les images du canvas soient chargées.
 * Si une image échoue ou dépasse le timeout, elle est masquée
 * pour ne pas bloquer l'export.
 */
async function waitForImages(canvas, toast) {
  const images = [...canvas.querySelectorAll('img')];
  if (!images.length) return;

  const promises = images.map((img, index) => {
    // Image déjà chargée et valide
    if (img.complete && img.naturalHeight !== 0) {
      return Promise.resolve();
    }

    // Image avec src vide ou data: invalide
    if (!img.src || img.src === 'about:blank') {
      console.warn(`[TakiDoc] Image ${index + 1} sans source valide, masquée.`);
      img.style.display = 'none';
      return Promise.resolve();
    }

    return new Promise(resolve => {
      let settled = false;
      const done = (success) => {
        if (settled) return;
        settled = true;
        if (!success) {
          console.warn(`[TakiDoc] Image ${index + 1} (${img.src?.slice(0, 80)}…) non chargée, masquée.`);
          img.style.display = 'none';
        }
        resolve();
      };

      img.addEventListener('load', () => done(true), { once: true });
      img.addEventListener('error', () => done(false), { once: true });

      // Timeout par image
      setTimeout(() => done(false), IMAGE_LOAD_TIMEOUT);
    });
  });

  // Timeout global pour toutes les images
  await Promise.race([
    Promise.all(promises),
    new Promise(resolve => {
      setTimeout(() => {
        console.warn('[TakiDoc] Timeout global de chargement des images atteint.');
        resolve();
      }, TOTAL_IMAGE_TIMEOUT);
    })
  ]);
}

/**
 * Attend que toutes les polices Google Fonts soient chargées.
 * Les @import sont déjà convertis en <link> par editor.js.
 */
async function waitForFonts() {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('[TakiDoc] Erreur attente polices :', e);
    }
  }
  // Délai supplémentaire pour laisser le temps au rendu
  await new Promise(resolve => setTimeout(resolve, 200));
}

export async function exportPagedPDF({ state, $, $$, getCanvas, toast, saveDraft }) {
  const canvas = getCanvas();
  if (!canvas || !state.template) {
    return toast('Document introuvable.', 'error');
  }
  if (!window.html2canvas || !window.jspdf?.jsPDF) {
    return toast('Les bibliothèques PDF ne sont pas chargées.', 'error');
  }

  toast('Préparation du PDF…', 'info');

  const wrapper = $('#document-wrapper');
  const originalTransform = wrapper?.style.transform || '';
  const guides = $('#td-guides');
  const editable = $$('.direct-editable', canvas);

  // Sauvegarde des états d'origine des images (pour restauration en cas d'erreur)
  const imageStates = new Map();
  $$('img', canvas).forEach(img => {
    imageStates.set(img, img.style.display);
  });

  try {
    // 1. Désactiver l'édition pendant l'export
    document.activeElement?.blur?.();
    editable.forEach(el => { el.contentEditable = 'false'; });
    if (wrapper) wrapper.style.transform = 'none';
    if (guides) guides.style.display = 'none';

    // 2. Précharger les images (avec gestion CORS et timeout)
    await waitForImages(canvas, toast);

    // 3. Précharger les polices
    await waitForFonts();

    // 4. Calculer la hauteur et la qualité
    const height = canvas.scrollHeight;
    const wanted = parseFloat($('#pdf-quality')?.value) || 2;
    const scale = Math.max(0.75, Math.min(wanted, MAX_CANVAS_PX / height));

    // 5. Calculer les sauts de page
    const breaks = computeBreaks(canvas);

    // 6. Export avec timeout global de 30 secondes
    const exportPromise = (async () => {
      // Rendu html2canvas
      const rendered = await window.html2canvas(canvas, {
        scale,
        useCORS: true,
        allowTaint: false,  // false pour permettre toDataURL
        backgroundColor: '#ffffff',
        logging: false,
        width: canvas.scrollWidth,
        height,
        windowWidth: Math.max(document.documentElement.clientWidth, canvas.scrollWidth),
        onclone: (clonedDoc) => {
          // Forcer le display des images dans le clone (au cas où)
          clonedDoc.querySelectorAll('img').forEach(img => {
            if (img.style.display === 'none') {
              img.style.display = '';
            }
          });
        }
      });

      // Découpe en tranches selon les sauts de page
      const k = rendered.width / canvas.scrollWidth;
      const cuts = [0, ...breaks.map(b => Math.round(b * k)), rendered.height];
      const W = rendered.width;
      const mmPerPx = 210 / W;
      const band = Math.round(marginPx(canvas) * k);

      const pdf = new window.jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const totalPages = cuts.length - 1;

      for (let i = 0; i < cuts.length - 1; i++) {
        const y = cuts[i];
        const h = cuts[i + 1] - y;
        const top = i === 0 ? 0 : band;

        const slice = document.createElement('canvas');
        slice.width = W;
        slice.height = h + top;

        const sctx = slice.getContext('2d');
        sctx.fillStyle = '#fff';
        sctx.fillRect(0, 0, W, slice.height);

        // La marge haute prolonge la 1re ligne du rendu
        if (top) sctx.drawImage(rendered, 0, y, W, 1, 0, 0, W, top);
        sctx.drawImage(rendered, 0, y, W, h, 0, top, W, h);

        let mmW = 210;
        let mmH = slice.height * mmPerPx;
        if (mmH > 297) {
          const f = 297 / mmH;
          mmW *= f;
          mmH = 297;
        }

        if (i > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(
          slice.toDataURL('image/jpeg', 0.96),
          'JPEG',
          (210 - mmW) / 2,
          0,
          mmW,
          mmH
        );

        // Feedback de progression
        if (totalPages > 1) {
          toast(`Génération page ${i + 1}/${totalPages}…`, 'info');
          // Petit délai pour laisser le UI se mettre à jour
          await new Promise(r => setTimeout(r, 50));
        }
      }

      return pdf;
    })();

    const pdf = await Promise.race([
      exportPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), EXPORT_TIMEOUT)
      )
    ]);

    // 7. Téléchargement
    const safeName = (state.template.name || 'document').replace(/[^a-z0-9_-]/gi, '_');
    pdf.save(`TakiDoc_${safeName}.pdf`);

    // 8. Sauvegarder le brouillon
    saveDraft({ quiet: true });

    // 9. Message de succès
    const n = cuts => cuts.length - 1;
    const pageCount = breaks.length + 1;
    toast(`PDF téléchargé (${pageCount} page${pageCount > 1 ? 's' : ''}).`, 'success');

  } catch (error) {
    console.error('[TakiDoc] Erreur pendant la génération du PDF :', error);

    let message = 'Erreur pendant la génération du PDF. Réessaie.';
    if (error.message === 'TIMEOUT') {
      message = 'L\'export a pris trop de temps (30s). Réduis la qualité ou la taille du document.';
    } else if (error.message?.includes('tainted')) {
      message = 'Une image externe bloque l\'export. Retire les images non hébergées sur TakiDoc.';
    }

    toast(message, 'error');

  } finally {
    // 10. Restaurer l'état initial
    if (wrapper) wrapper.style.transform = originalTransform;
    if (guides) guides.style.display = '';
    editable.forEach(el => { el.contentEditable = 'true'; });

    // Restaurer l'affichage des images
    imageStates.forEach((display, img) => {
      img.style.display = display;
    });
  }
}