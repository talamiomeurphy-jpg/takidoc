/* ============================================================
   TAKIDOC — PAGINATION A4 (éditeur + export PDF multi-pages)
   Ce module :
   - compte les pages A4 du document et les affiche dans l'éditeur
     (pastille « page courante / total » + repères de saut de page) ;
   - exporte un PDF de 1, 2, 3… pages selon la longueur réelle du document ;
   - coupe les pages dans un espace vide, jamais au milieu d'une ligne de texte.
   ============================================================ */

const TOLERANCE_PX = 22;        // dépassement toléré avant de créer une page de plus
const MAX_CANVAS_PX = 16000;    // limite sûre de hauteur de canvas (Safari / mobiles)

let ui = null;                  // état de l'interface de pagination
let refreshQueued = false;

const pageHeightPx = canvas => canvas.offsetWidth * 297 / 210;

export function countPages(canvas) {
  return canvas ? computeBreaks(canvas).length + 1 : 1;
}

/* ---------- Interface : pastille, repères, note dans l'onglet Export ---------- */

function injectStyles() {
  if (document.getElementById('td-pagination-css')) return;
  const style = document.createElement('style');
  style.id = 'td-pagination-css';
  style.textContent = `
    .td-guides{position:absolute;left:0;top:0;width:100%;height:0;pointer-events:none;z-index:3}
    .td-guide{position:absolute;left:-18px;right:-18px;height:0;border-top:2px dashed rgba(255,107,53,.9)}
    .td-guide::after{content:attr(data-label);position:absolute;right:18px;top:0;transform:translateY(-50%);
      padding:3px 12px;border-radius:999px;background:#FF6B35;color:#fff;font:700 11px/1.4 Inter,system-ui,sans-serif;
      letter-spacing:.02em;box-shadow:0 2px 8px rgba(0,0,0,.2);white-space:nowrap}
    .page-pill{display:inline-flex;align-items:center;gap:7px;padding:0 4px 0 12px;margin-left:2px;border-left:1px solid #E2E8F0;
      font:700 .85rem/1 Inter,system-ui,sans-serif;color:#0F172A;white-space:nowrap}
    .page-pill i{color:#FF6B35}.page-pill .sep{color:#94A3B8;font-weight:600}
    .page-note{display:flex;gap:10px;align-items:flex-start;margin-bottom:16px;padding:12px 14px;border-radius:12px;
      background:#FFF5F0;border:1px solid rgba(255,107,53,.25);color:#0F172A;font-size:.85rem;line-height:1.5}
    .page-note i{margin-top:3px;color:#FF6B35}
    @media(max-width:768px){.td-guide::after{right:24px;font-size:10px;padding:2px 9px}}`;
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
    pill.innerHTML = '<i class="fas fa-file-lines" aria-hidden="true"></i><span id="page-now">1</span><span class="sep">/</span><span id="page-count">1</span>';
    bar.appendChild(pill);
  }

  const quality = $('#pdf-quality');
  if (quality && !$('#page-note')) {
    const note = document.createElement('div');
    note.id = 'page-note';
    note.className = 'page-note';
    note.innerHTML = '<i class="fas fa-layer-group" aria-hidden="true"></i><span id="page-note-text"></span>';
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
  const area = $('#canvasArea'), wrapper = $('#document-wrapper'), canvas = ctx.getCanvas();
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

  const count = $('#page-count'), now = $('#page-now'), pill = $('#page-pill');
  if (count) count.textContent = total;
  if (now) now.textContent = currentPage(ui, total);
  if (pill) pill.title = `${total} page${total > 1 ? 's' : ''} A4`;

  const text = $('#page-note-text');
  if (text) {
    text.textContent = total > 1
      ? `Votre document fera ${total} pages A4 dans le PDF. Les pages sont coupées entre deux lignes, jamais au milieu d’un texte.`
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

/** À appeler une fois le document affiché : initPagination({ state, $, $$, getCanvas }) */
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
      document.getElementById(id)?.addEventListener('click', () => setTimeout(refreshPages, 350)));
  }
  refreshPages();
}

/* ---------- Découpage en pages (identique dans l'éditeur et dans le PDF) ---------- */

const MARGIN_MM = 12;           // marge haut/bas sur les pages 2, 3… du PDF

const marginPx = canvas => canvas.offsetWidth * MARGIN_MM / 210;

/** Zones occupées (haut, bas) par le texte, les images et les graphiques, en px du document. */
function occupiedBands(canvas) {
  const box = canvas.getBoundingClientRect();
  const z = box.width / canvas.offsetWidth || 1;
  const bands = [];
  const add = r => { if (r.height > 0.5 && r.width > 0.5) bands.push([(r.top - box.top) / z, (r.bottom - box.top) / z]); };

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
 * Une coupure est toujours placée juste au-dessus d'une ligne : aucune ligne n'est coupée en deux.
 */
export function computeBreaks(canvas) {
  const ph = pageHeightPx(canvas), m = marginPx(canvas), total = canvas.scrollHeight;
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

/* ---------- Export PDF ---------- */

export async function exportPagedPDF({ state, $, $$, getCanvas, toast, saveDraft }) {
  const canvas = getCanvas();
  if (!canvas || !state.template) return toast('Document introuvable.', 'error');
  if (!window.html2canvas || !window.jspdf?.jsPDF) return toast('Les bibliothèques PDF ne sont pas chargées.', 'error');

  toast('Préparation du PDF…', 'info');

  const wrapper = $('#document-wrapper');
  const originalTransform = wrapper?.style.transform || '';
  const guides = $('#td-guides');
  const editable = $$('.direct-editable', canvas);

  try {
    document.activeElement?.blur?.();
    editable.forEach(el => { el.contentEditable = 'false'; });
    if (wrapper) wrapper.style.transform = 'none';
    if (guides) guides.style.display = 'none';

    await Promise.all($$('img', canvas).map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r; })));
    if (document.fonts?.ready) await document.fonts.ready;

    const height = canvas.scrollHeight;
    const wanted = parseFloat($('#pdf-quality')?.value) || 2;
    const scale = Math.max(0.75, Math.min(wanted, MAX_CANVAS_PX / height));

    const breaks = computeBreaks(canvas);
    const rendered = await window.html2canvas(canvas, {
      scale, useCORS: true, backgroundColor: '#ffffff', logging: false,
      width: canvas.scrollWidth, height,
      windowWidth: Math.max(document.documentElement.clientWidth, canvas.scrollWidth)
    });

    const k = rendered.width / canvas.scrollWidth;                 // px du rendu par px du document
    const cuts = [0, ...breaks.map(b => Math.round(b * k)), rendered.height];
    const W = rendered.width, mmPerPx = 210 / W;
    const band = Math.round(marginPx(canvas) * k);                 // marge haute des pages 2, 3…

    const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

    for (let i = 0; i < cuts.length - 1; i++) {
      const y = cuts[i], h = cuts[i + 1] - y, top = i === 0 ? 0 : band;
      const slice = document.createElement('canvas');
      slice.width = W; slice.height = h + top;
      const sctx = slice.getContext('2d');
      sctx.fillStyle = '#fff'; sctx.fillRect(0, 0, W, slice.height);
      // La marge haute prolonge la 1re ligne du rendu : blanche pour un texte, colorée pour un fond plein
      if (top) sctx.drawImage(rendered, 0, y, W, 1, 0, 0, W, top);
      sctx.drawImage(rendered, 0, y, W, h, 0, top, W, h);

      let mmW = 210, mmH = slice.height * mmPerPx;
      if (mmH > 297) { const f = 297 / mmH; mmW *= f; mmH = 297; }

      if (i > 0) pdf.addPage('a4', 'portrait');
      pdf.addImage(slice.toDataURL('image/jpeg', 0.96), 'JPEG', (210 - mmW) / 2, 0, mmW, mmH);
    }

    const safeName = (state.template.name || 'document').replace(/[^a-z0-9_-]/gi, '_');
    pdf.save(`TakiDoc_${safeName}.pdf`);
    saveDraft({ quiet: true });

    const n = cuts.length - 1;
    toast(`PDF téléchargé (${n} page${n > 1 ? 's' : ''}).`, 'success');
  } catch (error) {
    console.error('Erreur pendant la génération du PDF :', error);
    toast('Erreur pendant la génération du PDF. Réessaie.', 'error');
  } finally {
    if (wrapper) wrapper.style.transform = originalTransform;
    if (guides) guides.style.display = '';
    editable.forEach(el => { el.contentEditable = 'true'; });
  }
}
