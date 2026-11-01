/* ============================================================
   TAKIDOC — js/editor-responsive.js : responsivité absolue
   - la boîte du document suit son échelle (plus de défilement horizontal ni de vide)
   - le document se recale tout seul à chaque changement de taille (fenêtre, panneau, rotation)
     tant que tu n'as pas choisi un zoom toi-même
   - pincement à deux doigts et Ctrl + molette pour zoomer
   Il ne fait que lire le zoom d'editor.js et cliquer sur ses boutons.
============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const wrap = $('#document-wrapper');
const area = $('#canvasArea');
if (wrap && area) init();

function init() {
  let userZoomed = false;      // vrai dès que la personne choisit elle-même un niveau de zoom

  /* --- 1. Un cadre qui a exactement la taille VISIBLE du document ---
     transform: scale() ne change pas la place occupée, et le navigateur compte la boîte non réduite
     dans la zone défilante (faux défilement horizontal, grand vide). On place donc le document dans
     un cadre dimensionné à l'échelle réelle ; ce qui dépasse du cadre est masqué (rien de visible). */
  const doc = $('#document-canvas');
  const frame = document.createElement('div');
  frame.className = 'doc-fit';
  wrap.parentNode.insertBefore(frame, wrap);
  frame.appendChild(wrap);

  let lastKey = '', raf = 0;
  function syncBox() {
    raf = 0;
    const m = /scale\(([\d.]+)\)/.exec(wrap.style.transform || '');
    const s = m ? parseFloat(m[1]) : 1;
    const w = doc ? doc.offsetWidth : wrap.offsetWidth;    // mesures de mise en page : non affectées par transform
    const h = doc ? doc.offsetHeight : wrap.offsetHeight;
    const key = `${s}|${w}|${h}`;
    if (!w || key === lastKey) return;
    lastKey = key;
    frame.style.width = `${w * s}px`;
    frame.style.height = `${h * s}px`;
  }
  // Un seul recalcul par image : aucune boucle possible entre observateurs et mise en page
  const schedule = () => { if (!raf) raf = requestAnimationFrame(syncBox); };
  new MutationObserver(schedule).observe(wrap, { attributes: true, attributeFilter: ['style'] });
  if ('ResizeObserver' in window && doc) new ResizeObserver(schedule).observe(doc);   // le document change de hauteur (pages)
  syncBox();

  /* --- 2. Recalage automatique --- */
  const fitBtn = $('#btn-zoom-fit');
  const refit = () => fitBtn?.click();
  let lastWidth = 0, timer = null;
  const onAreaResize = () => {
    const width = area.clientWidth;
    if (Math.abs(width - lastWidth) < 4) return;          // ignore les changements de hauteur seule
    lastWidth = width;
    if (userZoomed) return;
    clearTimeout(timer);
    timer = setTimeout(refit, 120);
  };
  if ('ResizeObserver' in window) new ResizeObserver(onAreaResize).observe(area);
  window.addEventListener('orientationchange', () => setTimeout(() => { if (!userZoomed) refit(); }, 250));

  /* Dès que la personne zoome elle-même, on arrête de recaler ; « Ajuster » relance le recalage */
  const manual = () => { userZoomed = true; };
  $('#btn-zoom-in')?.addEventListener('click', e => { if (e.isTrusted) manual(); });
  $('#btn-zoom-out')?.addEventListener('click', e => { if (e.isTrusted) manual(); });
  fitBtn?.addEventListener('click', e => { if (e.isTrusted) userZoomed = false; });
  document.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key === '+' || e.key === '=' || e.key === '-') manual();
    else if (e.key === '0') userZoomed = false;
  });

  /* --- 3. Zoom au pincement et Ctrl + molette --- */
  const readZoom = () => (parseInt($('#zoom-level')?.textContent, 10) || 100) / 100;
  const step = n => {
    const btn = n > 0 ? $('#btn-zoom-in') : $('#btn-zoom-out');
    for (let i = 0; i < Math.min(Math.abs(n), 2); i++) btn?.click();
    manual();
  };

  const touches = new Map();
  let startDist = 0, startZoom = 1;
  const dist = () => { const [a, b] = [...touches.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  area.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) { startDist = dist() || 1; startZoom = readZoom(); }
  });
  area.addEventListener('pointermove', e => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size !== 2) return;
    const target = startZoom * (dist() / startDist);
    const n = Math.round((target - readZoom()) / 0.1);
    if (n) step(n);
  });
  const release = e => touches.delete(e.pointerId);
  area.addEventListener('pointerup', release);
  area.addEventListener('pointercancel', release);

  let wheelAt = 0;
  area.addEventListener('wheel', e => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const now = Date.now();
    if (now - wheelAt < 90) return;
    wheelAt = now;
    step(e.deltaY < 0 ? 1 : -1);
  }, { passive: false });
}
