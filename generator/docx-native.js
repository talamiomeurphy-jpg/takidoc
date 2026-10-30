/* ============================================================
   TAKIDOC — WORD NATIF (.docx) SANS DÉPENDANCE PAYANTE
   Principe : Chromium (qui connaît déjà la mise en page exacte) mesure le
   document ; on transforme ensuite chaque bloc en VRAI contenu Word :
   paragraphes, tableaux (colonnes), fonds colorés, bordures, barres de
   compétences, photo rognée en rond… via la bibliothèque libre « docx ».
============================================================ */
'use strict';

/* ------------------------------------------------------------
   1. EXTRACTION — s'exécute DANS Chromium (aucune variable Node ici)
------------------------------------------------------------ */
function extractInPage() {
  const PAGE_W = 794;
  const SAFE_FONTS = ['arial', 'calibri', 'cambria', 'courier new', 'georgia', 'segoe ui',
    'tahoma', 'times new roman', 'trebuchet ms', 'verdana', 'garamond', 'comic sans ms'];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'TITLE', 'META', 'LINK',
    'SVG', 'CANVAS', 'IFRAME', 'VIDEO', 'AUDIO', 'OBJECT', 'EMBED', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);

  const num = v => parseFloat(v) || 0;
  const cssOf = el => getComputedStyle(el);

  function rgbaParts(value) {
    const m = /rgba?\(([^)]+)\)/.exec(value || '');
    if (!m) return null;
    const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(x => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function effectiveBackdrop(el) {
    const layers = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const c = rgbaParts(cssOf(n).backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let base = { r: 255, g: 255, b: 255 };
    for (let i = layers.length - 1; i >= 0; i--) {
      const c = layers[i];
      base = { r: c.r * c.a + base.r * (1 - c.a), g: c.g * c.a + base.g * (1 - c.a), b: c.b * c.a + base.b * (1 - c.a) };
    }
    return base;
  }
  function hex3(r, g, b) {
    return [r, g, b].map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  /** Couleur CSS -> hexadécimal ; si elle est translucide, on la mélange avec le fond réel (Word ignore la transparence). */
  function toHex(value, backdropEl) {
    const c = rgbaParts(value);
    if (!c || c.a === 0 || [c.r, c.g, c.b].some(Number.isNaN)) return null;
    if (c.a >= 1 || !backdropEl) return hex3(c.r, c.g, c.b);
    const bd = effectiveBackdrop(backdropEl);
    return hex3(c.r * c.a + bd.r * (1 - c.a), c.g * c.a + bd.g * (1 - c.a), c.b * c.a + bd.b * (1 - c.a));
  }
  function bgOf(cs, el) {
    const solid = toHex(cs.backgroundColor, el && el.parentElement);
    if (solid) return solid;
    if (/gradient/i.test(cs.backgroundImage || '')) {
      const m = /rgba?\([^)]+\)/.exec(cs.backgroundImage);
      if (m) return toHex(m[0], el && el.parentElement);
    }
    return null;
  }

  const isIcon = el => {
    if (el.localName !== 'i' && !/\bfa[srlb]?\b|fa-/.test(el.className && el.className.baseVal === undefined ? String(el.className) : '')) {
      return false;
    }
    return !el.textContent.trim() || /\bfa[srlb]?\b|fa-/.test(String(el.className));
  };

  function isHidden(el, cs) {
    if (cs.display === 'none' || cs.visibility === 'hidden') return true;
    const r = el.getBoundingClientRect();
    return r.width === 0 && r.height === 0 && !el.textContent.trim();
  }

  function hasContent(el) {
    return !!el.textContent.trim() || !!el.querySelector('img');
  }

  const isInlineDisplay = d => d.startsWith('inline') || d === 'contents';

  /** Élément « en ligne » : il reste dans le paragraphe courant. */
  function isInlineEl(el) {
    if (el.localName === 'br') return true;
    if (el.localName === 'img') return false;
    const cs = cssOf(el);
    if (!isInlineDisplay(cs.display)) return false;
    if (cs.display !== 'inline') {
      // inline-block / inline-flex : en ligne seulement s'il ne contient pas de bloc
      return ![...el.querySelectorAll('*')].some(d => !isInlineDisplay(cssOf(d).display) && d.localName !== 'br');
    }
    return !el.querySelector('img');
  }

  /* ---------- Runs de texte ---------- */
  function runStyle(el) {
    const cs = cssOf(el);
    const family = (cs.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim();
    const decoration = cs.textDecorationLine || '';
    return {
      color: toHex(cs.color, el) || '000000',
      size: Math.max(2, Math.round(num(cs.fontSize) * 1.5)),
      bold: parseInt(cs.fontWeight, 10) >= 600 || cs.fontWeight === 'bold',
      italic: cs.fontStyle === 'italic',
      underline: decoration.indexOf('underline') !== -1,
      strike: decoration.indexOf('line-through') !== -1,
      font: SAFE_FONTS.includes(family.toLowerCase()) ? family : 'Calibri',
      transform: cs.textTransform,
      spacing: Math.round(num(cs.letterSpacing) * 15) // twips
    };
  }

  function collectRuns(nodes, out) {
    for (const node of nodes) {
      if (node.nodeType === 3) {
        const parent = node.parentElement;
        if (!parent) continue;
        let text = node.nodeValue.replace(/[ \t\r\n\f]+/g, ' ');
        const st = runStyle(parent);
        if (st.transform === 'uppercase') text = text.toUpperCase();
        else if (st.transform === 'lowercase') text = text.toLowerCase();
        out.push({ text, ...st });
      } else if (node.nodeType === 1) {
        if (node.localName === 'br') { out.push({ br: true }); continue; }
        if (SKIP.has(node.tagName) || isIcon(node)) continue;
        const cs = cssOf(node);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        collectRuns(node.childNodes, out);
      }
    }
  }

  function cleanRuns(runs) {
    // espaces début/fin de paragraphe et doublons
    const res = [];
    for (const run of runs) {
      if (run.br) { res.push(run); continue; }
      let text = run.text;
      const prev = res[res.length - 1];
      if (!prev || prev.br) text = text.replace(/^ +/, '');
      else if (prev.text.endsWith(' ')) text = text.replace(/^ +/, '');
      if (text) res.push({ ...run, text });
    }
    while (res.length && (res[res.length - 1].br || !res[res.length - 1].text.trim())) {
      if (res[res.length - 1].br) res.pop();
      else break;
    }
    const last = res[res.length - 1];
    if (last && !last.br) last.text = last.text.replace(/ +$/, '');
    return res.filter(r => r.br || r.text);
  }

  /* ---------- Géométrie ---------- */
  function box(el) {
    const cs = cssOf(el);
    const r = el.getBoundingClientRect();
    const pad = [num(cs.paddingTop), num(cs.paddingRight), num(cs.paddingBottom), num(cs.paddingLeft)];
    const bw = [num(cs.borderTopWidth), num(cs.borderRightWidth), num(cs.borderBottomWidth), num(cs.borderLeftWidth)];
    return {
      cs, r, pad, bw,
      top: r.top + window.scrollY, bottom: r.bottom + window.scrollY,
      left: r.left, right: r.right,
      cLeft: r.left + pad[3] + bw[3], cRight: r.right - pad[1] - bw[1]
    };
  }

  function borderSpec(cs, side, el) {
    const w = num(cs['border' + side + 'Width']);
    const style = cs['border' + side + 'Style'];
    const color = toHex(cs['border' + side + 'Color'], el);
    if (!w || style === 'none' || style === 'hidden' || !color) return null;
    return { px: w, color, dashed: style === 'dashed' || style === 'dotted' };
  }

  function alignOf(b, textRect, ctx) {
    const ta = b.cs.textAlign;
    if (ta === 'center' || ta === 'right' || ta === 'justify') return { align: ta, explicit: true };
    if (textRect && textRect.width > 0) {
      const lg = textRect.left - ctx.left;
      const rg = ctx.right - textRect.right;
      if (lg + rg > 14) {
        if (Math.abs(lg - rg) < 5 && lg > 6) return { align: 'center', explicit: false };
        if (rg < 3 && lg > 8) return { align: 'right', explicit: false };
      }
    }
    return { align: 'left', explicit: true };
  }

  function textRectOf(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0);
    if (!rects.length) return null;
    const left = Math.min(...rects.map(r => r.left));
    const right = Math.max(...rects.map(r => r.right));
    const lines = new Set(rects.map(r => Math.round(r.top / 4))).size;
    return { left, right, width: right - left, lines };
  }

  /* ---------- Images (photo rognée / ronde) ---------- */
  function imageNode(img, ctx) {
    const b = box(img);
    const w = Math.round(b.r.width);
    const h = Math.round(b.r.height);
    if (!w || !h || !img.complete || !img.naturalWidth) return null;
    let radius = 0;
    let probe = img;
    for (let i = 0; i < 3 && probe && probe !== document.body; i++, probe = probe.parentElement) {
      const pcs = cssOf(probe);
      const rr = pcs.borderTopLeftRadius || '0px';
      const val = rr.endsWith('%') ? (num(rr) / 100) * Math.min(w, h) : num(rr);
      if (val > radius && (probe === img || pcs.overflow !== 'visible')) radius = val;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = w * 2; canvas.height = h * 2;           // ×2 : meilleure netteté dans Word
      const g = canvas.getContext('2d');
      g.scale(2, 2);
      if (radius > 0) {
        const rad = Math.min(radius, w / 2, h / 2);
        g.beginPath();
        g.moveTo(rad, 0); g.arcTo(w, 0, w, h, rad); g.arcTo(w, h, 0, h, rad);
        g.arcTo(0, h, 0, 0, rad); g.arcTo(0, 0, w, 0, rad); g.closePath(); g.clip();
      }
      const fit = b.cs.objectFit;
      const nw = img.naturalWidth; const nh = img.naturalHeight;
      let dw = w; let dh = h;
      if (fit === 'cover') { const s = Math.max(w / nw, h / nh); dw = nw * s; dh = nh * s; }
      else if (fit === 'contain') { const s = Math.min(w / nw, h / nh); dw = nw * s; dh = nh * s; }
      g.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      const dataUrl = canvas.toDataURL('image/png');
      const lg = b.left - ctx.left;
      const rg = ctx.right - b.right;
      let align = 'left';
      if (lg > 8 && Math.abs(lg - rg) < 6) align = 'center';
      else if (lg > 8 && rg < 4) align = 'right';
      return { t: 'img', dataUrl, w, h, align, left: Math.max(0, Math.round(lg)), top: b.top, bottom: b.bottom };
    } catch (_) {
      return null; // image d'une autre origine : non exportable
    }
  }

  /* ---------- Détections ---------- */
  const hasDirectText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim() !== '');
  const isFlexRowEl = cs => (cs.display === 'flex' || cs.display === 'inline-flex') && !cs.flexDirection.startsWith('column');
  const blockInside = el => [...el.querySelectorAll('*')].some(d => d.localName === 'img'
    || (!isInlineDisplay(cssOf(d).display) && d.localName !== 'br'));

  /** Ligne flex qui mélange du texte brut et des <b>/<span> (ex. « Fait à <b>Ville</b>, le <b>date</b> ») :
   *  c'est une simple phrase, pas des colonnes -> un seul paragraphe Word. */
  function inlineFlow(el) {
    if (el === document.body || !isFlexRowEl(cssOf(el)) || !hasDirectText(el)) return false;
    return [...el.children].every(k => SKIP.has(k.tagName) || isIcon(k) || !blockInside(k));
  }

  function collectFor(el, runs) {
    if (!inlineFlow(el)) { collectRuns(el.childNodes, runs); return; }
    const gap = num(cssOf(el).columnGap);
    let first = true;
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && !node.nodeValue.trim()) continue;
      const tmp = [];
      collectRuns([node], tmp);
      const head = tmp.find(r => !r.br);
      if (!head) continue;
      const last = runs[runs.length - 1];
      if (!first && gap > 0 && last && !last.br && !/\s$/.test(last.text) && !/^[\s,.;:!?)\]]/.test(head.text)) {
        runs.push({ ...last, text: ' ', bold: false, underline: false });
      }
      runs.push(...tmp);
      first = false;
    }
  }

  function isInlineOnly(el) {
    if (inlineFlow(el)) return true;
    return [...el.childNodes].filter(n => n.nodeType === 3 || n.nodeType === 1).every(n => n.nodeType === 3
      || (n.nodeType === 1 && (SKIP.has(n.tagName) || isIcon(n) || isHidden(n, cssOf(n)) || isInlineEl(n))));
  }

  /** Renvoie une liste de lignes (chaque ligne = colonnes côte à côte) ou null. Gère flex en ligne ET grilles à plusieurs rangées. */
  function sideBySide(el, b) {
    if (inlineFlow(el)) return null;
    const isFlexRow = isFlexRowEl(b.cs);
    const isGrid = b.cs.display === 'grid' && b.cs.gridTemplateColumns.trim().split(/\s+/).length >= 2;
    if (!isFlexRow && !isGrid) return null;
    const kids = [...el.children].filter(k => {
      const kcs = cssOf(k);
      return !SKIP.has(k.tagName) && kcs.display !== 'none' && kcs.position !== 'absolute' && kcs.position !== 'fixed';
    });
    if (kids.length < 2) return null;
    const rects = kids.map(k => k.getBoundingClientRect());
    if (!rects.every(r => r.width > 0)) return null;
    let rows;
    if (isGrid) {
      const groups = [];
      kids.forEach((k, i) => {
        const t = rects[i].top;
        let g = groups.find(x => Math.abs(x.top - t) <= 3);
        if (!g) { g = { top: t, kids: [] }; groups.push(g); }
        g.kids.push(k);
      });
      rows = groups.sort((a, c) => a.top - c.top).map(g => g.kids);
    } else rows = [kids];
    const ordered = rows.every(rk => {
      const rr = rk.map(k => k.getBoundingClientRect());
      return rr.every((r, i) => i === 0 || r.left >= rr[i - 1].right - 2);
    });
    if (!ordered) return null;
    const meaningful = kids.filter(k => hasContent(k) || bgOf(cssOf(k), k));
    if (meaningful.length < 2) return null;
    return rows;
  }

  function barOf(el, b) {
    if (hasContent(el) || b.r.height > 26 || b.r.height < 1) return null;
    const track = bgOf(b.cs, el);
    const kids = [...el.children].filter(k => cssOf(k).display !== 'none');
    if (!track || kids.length !== 1 || hasContent(kids[0])) return null;
    const fillBox = box(kids[0]);
    const fillColor = bgOf(fillBox.cs, kids[0]);
    if (!fillColor || fillBox.r.height > 26) return null;
    return {
      t: 'bar', total: Math.round(b.r.width), fill: Math.round(Math.min(fillBox.r.width, b.r.width)),
      fillColor, trackColor: track, height: Math.max(2, Math.round(b.r.height)),
      left: b.left, top: b.top, bottom: b.bottom
    };
  }

  /* ---------- Parcours ---------- */
  function emit(node, ctx, out) {
    node.before = Math.max(0, Math.round(node.top - ctx.cursor.y));
    ctx.cursor.y = Math.max(ctx.cursor.y, node.bottom);
    out.push(node);
  }

  function paragraphFrom(el, b, runs, ctx, flush) {
    const clean = cleanRuns(runs);
    if (!clean.length) return null;
    const tr = textRectOf(el);
    const al = alignOf(b, tr, ctx);
    const lh = b.cs.lineHeight === 'normal' ? 0 : num(b.cs.lineHeight);
    const borders = {};
    let padTop = b.pad[0]; let padBottom = b.pad[2];
    for (const [side, key] of [['Top', 'top'], ['Bottom', 'bottom'], ['Left', 'left'], ['Right', 'right']]) {
      const spec = borderSpec(b.cs, side, el);
      if (spec) borders[key] = spec;
    }
    if (ctx.skipOwn) { for (const k of Object.keys(borders)) delete borders[k]; }
    const own = flush ? { top: b.top, bottom: b.bottom } : { top: b.top + b.pad[0], bottom: b.bottom - b.pad[2] };
    return {
      t: 'p', runs: clean, align: al.align, line: lh,
      indentLeft: al.explicit ? Math.round(b.cLeft - ctx.left) : 0,
      // Toujours retenir la marge droite : Word (vraie police) est plus large que Chromium, sinon une ligne unique déborde de la page
      indentRight: (al.explicit && ((ctx.root && ctx.right - b.cRight > 4) || al.align !== 'left' || (tr && tr.lines > 1) || ctx.shd || Object.keys(borders).length)) ? Math.max(0, Math.round(ctx.right - b.cRight)) : 0,
      shd: ctx.shd || null, borders: flush ? borders : {},
      padTop: flush ? padTop : 0, padBottom: flush ? padBottom : 0, padLeft: flush ? b.pad[3] : 0,
      bullet: b.cs.display === 'list-item' && b.cs.listStyleType !== 'none',
      top: own.top, bottom: own.bottom
    };
  }

  function walk(el, ctx, out) {
    if (SKIP.has(el.tagName) || isIcon(el)) return;
    const b = box(el);
    if (isHidden(el, b.cs)) return;
    if (!el.querySelector('img') && (/placeholder/i.test(String(el.className))
        || (/photo/i.test(String(el.className)) && el.textContent.trim().toLowerCase() === 'photo'))) {
      ctx.cursor.y = Math.max(ctx.cursor.y, b.bottom); // « Photo » sans image : on n'imprime rien
      return;
    }
    if ((b.cs.position === 'absolute' || b.cs.position === 'fixed') && !el.textContent.trim()) return;

    if (el.localName === 'img') {
      const node = imageNode(el, ctx);
      if (node) emit(node, ctx, out);
      return;
    }

    const bar = barOf(el, b);
    if (bar) { bar.left = Math.round(bar.left - ctx.left); emit(bar, ctx, out); return; }

    // Bloc vide plus haut qu'un trait (zone de signature : hauteur + bordure basse) -> on garde le trait
    if (!hasContent(el) && b.r.height > 8 && b.r.width > 12) {
      const bT = borderSpec(b.cs, 'Top', el); const bB = borderSpec(b.cs, 'Bottom', el);
      if (bT || bB) {
        const side = { left: Math.round(b.left - ctx.left), right: Math.round(ctx.right - b.right) };
        if (bT) emit({ t: 'rule', color: bT.color, px: Math.max(1, bT.px), ...side, top: b.top, bottom: b.top + bT.px }, ctx, out);
        if (bB) emit({ t: 'rule', color: bB.color, px: Math.max(1, bB.px), ...side, top: b.bottom - bB.px, bottom: b.bottom }, ctx, out);
        return;
      }
    }

    // Carte encadrée (bordure gauche/droite, ou fond + colonnes) : un tableau 1 cellule qui porte fond et bordures
    const frame = frameOf(el, b);
    if (frame) { emitFrame(el, b, frame, ctx, out); return; }

    const rows = sideBySide(el, b);
    if (rows) { emitRows(el, b, rows, ctx, out, false); return; }

    const nodes = [...el.childNodes].filter(n => n.nodeType === 3 ? n.nodeValue.trim() !== '' || true : n.nodeType === 1);
    const inlineOnly = isInlineOnly(el);

    // Trait décoratif (div vide avec fond ou bordure fine)
    if (!hasContent(el) && b.r.height <= 8 && b.r.width > 12) {
      const bg = bgOf(b.cs, el);
      const bb = borderSpec(b.cs, 'Bottom', el) || borderSpec(b.cs, 'Top', el);
      const color = bg || (bb && bb.color);
      const thick = bg ? b.r.height : (bb ? bb.px : 0);
      if (color && thick > 0) {
        emit({ t: 'rule', color, px: Math.max(1, thick), left: Math.round(b.left - ctx.left),
          right: Math.round(ctx.right - b.right), top: b.top, bottom: b.top + Math.max(1, thick) }, ctx, out);
      }
      return;
    }

    const isCard = bgOf(b.cs, el) && !(b.r.width >= PAGE_W * 0.95 && b.r.height > 500);
    const childCtx = { ...ctx };
    if (!inlineOnly && isCard) childCtx.shd = bgOf(b.cs, el);
    if (inlineOnly && isCard) childCtx.shd = bgOf(b.cs, el);
    if (!inlineOnly && b.cs.listStyleType && b.cs.display === 'list-item') childCtx.bullet = true;

    if (inlineOnly) {
      const runs = [];
      collectFor(el, runs);
      const p = paragraphFrom(el, b, runs, childCtx, true);
      if (p) emit(p, ctx, out);
      return;
    }

    // Bloc contenant des blocs : on regroupe les textes/inline consécutifs
    let buffer = [];
    const flushBuffer = () => {
      if (!buffer.length) return;
      const runs = [];
      collectRuns(buffer, runs);
      buffer = [];
      const p = paragraphFrom(el, b, runs, childCtx, false);
      if (p) emit(p, ctx, out);
    };
    for (const n of nodes) {
      if (n.nodeType === 3) { buffer.push(n); continue; }
      if (SKIP.has(n.tagName) || isIcon(n)) continue;
      if (isInlineEl(n)) { buffer.push(n); continue; }
      flushBuffer();
      walk(n, childCtx, out);
    }
    flushBuffer();
  }

  function frameOf(el, b) {
    if (b.r.width >= PAGE_W * 0.95 && b.r.height > 500) return null;
    if (b.r.width < 20 || b.r.height < 8 || !hasContent(el) || isInlineOnly(el)) return null;
    const borders = {}; let sideBorder = false;
    for (const [side, key] of [['Top', 'top'], ['Right', 'right'], ['Bottom', 'bottom'], ['Left', 'left']]) {
      const spec = borderSpec(b.cs, side, el);
      if (spec) { borders[key] = spec; if (key === 'left' || key === 'right') sideBorder = true; }
    }
    const bg = bgOf(b.cs, el);
    if (sideBorder || (bg && sideBySide(el, b))) return borders;
    return null;
  }

  function emitFrame(el, b, borders, ctx, out) {
    const cellCtx = { left: b.cLeft, right: b.cRight, cursor: { y: b.top + b.bw[0] + b.pad[0] }, shd: null };
    const children = [];
    walkContent(el, b, cellCtx, children, true);
    const width = Math.round(b.r.width);
    emit({
      t: 'table', indent: Math.round(b.left - ctx.left), width, minHeight: 0,
      cols: [{ width, bg: bgOf(b.cs, el), borders, valign: 'top', left: b.left, pad: b.pad.slice(), children }],
      top: b.top, bottom: b.bottom
    }, ctx, out);
  }

  function emitRows(el, b, rows, ctx, out, skipBorder) {
    rows.forEach((kids, idx) => emitTable(el, b, kids, ctx, out,
      { first: idx === 0, last: idx === rows.length - 1, single: rows.length === 1, skipBorder }));
  }

  function emitTable(el, b, kids, ctx, out, opt) {
    opt = opt || { first: true, last: true, single: true };
    const rects = kids.map(k => k.getBoundingClientRect());
    const startX = rects[0].left;
    const endX = Math.max(b.cRight, rects[rects.length - 1].right);

    // Petits traits décoratifs (ex. « — TITRE — ») : un trait dans la cellule, pas un bloc plein
    const decor = kids.map(k => {
      const r = k.getBoundingClientRect();
      return !hasContent(k) && r.height > 0 && r.height <= 8 && r.width > 4 && !!bgOf(cssOf(k), k);
    });
    const ai = b.cs.alignItems;
    const valign = ai === 'center' ? 'center' : (ai === 'flex-end' || ai === 'end') ? 'bottom' : 'top';

    // Pastille / logo : petite boîte avec fond ou bordure -> elle garde sa largeur, l'espace qui la suit va à la colonne suivante
    const boxed = kids.map((k, i) => {
      if (decor[i] || !hasContent(k)) return false;
      const kcs = cssOf(k);
      const r = rects[i];
      if (r.width > 60 || r.height > 60) return false;
      return !!bgOf(kcs, k) || ['Top', 'Right', 'Bottom', 'Left'].some(sd => borderSpec(kcs, sd, k));
    });
    // Marge de sécurité : Word (vraie police, ex. Georgia) est plus large que Chromium (police de repli sur le serveur).
    // Une colonne gagne de la place prise sur l'espace vide qui la précède (ou sur un trait décoratif voisin),
    // proportionnelle à la largeur de sa boîte, pour que les textes d'une seule ligne ne passent pas à la ligne.
    const want = i => Math.max(8, Math.min(26, Math.round(rects[i].width * 0.14)));
    const slack = kids.map((k, i) => {
      if (i === 0) return 0;
      const gapPx = Math.max(0, rects[i].left - rects[i - 1].right);
      if (decor[i]) return -Math.min(want(i - 1), Math.floor(rects[i].width * 0.6));
      if (boxed[i - 1]) return Math.floor(gapPx);
      if (decor[i - 1]) return Math.floor(gapPx) + Math.min(want(i), Math.floor(rects[i - 1].width * 0.6));
      const cap = Math.max(32, Math.round(rects[i].width * 0.4));
      const sl = Math.min(cap, Math.floor(gapPx * 0.85));
      return sl >= 4 ? sl : 0;
    });

    // Dernière colonne alignée à gauche (ex. nom + slogan à côté d'un logo) : on lui laisse de la place à droite
    let endExt = 0;
    {
      const li = kids.length - 1; const lk = kids[li]; const lcs = cssOf(lk);
      const ta = lcs.textAlign;
      if (!decor[li] && !boxed[li] && (ta === 'left' || ta === 'start') && rects[li].right >= endX - 1) {
        const tr = textRectOf(lk);
        if (tr && tr.lines === 1) endExt = Math.max(0, Math.min(Math.max(10, Math.min(60, Math.round(rects[li].width * 0.25))), Math.floor(ctx.right - endX) - 2));
      }
    }
    const endXs = endX + endExt;

    const columns = kids.map((k, i) => {
      const kb = box(k);
      const left = rects[i].left - slack[i];
      const nextLeft = (i < kids.length - 1 ? rects[i + 1].left - slack[i + 1] : endXs);
      const width = Math.max(10, Math.round(nextLeft - left));
      if (decor[i]) {
        const h = Math.max(1, Math.round(kb.r.height));
        return {
          width, bg: null, valign, left,
          pad: [0, Math.max(0, Math.round(nextLeft - rects[i].right)), 0, Math.max(0, Math.round(rects[i].left - left))],
          children: [{ t: 'rule', color: bgOf(kb.cs, k), px: h, left: 0, right: 0, before: 0, top: 0, bottom: h }]
        };
      }
      // Petit badge encadré (ex. pastille « i ») : bordure portée par la cellule
      let cellBorders = null;
      if (boxed[i]) {
        for (const [side, key] of [['Top', 'top'], ['Right', 'right'], ['Bottom', 'bottom'], ['Left', 'left']]) {
          const spec = borderSpec(kb.cs, side, k);
          if (spec) { cellBorders = cellBorders || {}; cellBorders[key] = spec; }
        }
      }
      const cellCtx = {
        left: kb.cLeft - slack[i],
        right: nextLeft - kb.pad[1] - kb.bw[1],
        cursor: { y: kb.top + kb.pad[0] + kb.bw[0] }, shd: null, skipOwn: !!cellBorders
      };
      const children = [];
      walkContent(k, kb, cellCtx, children);
      return {
        width, bg: bgOf(kb.cs, k), valign, borders: cellBorders,
        pad: cellBorders ? kb.pad.slice() : [kb.pad[0] + kb.bw[0], kb.pad[1] + kb.bw[1], kb.pad[2] + kb.bw[2], kb.pad[3] + kb.bw[3]],
        children, left
      };
    });

    const rowTop = Math.min(...rects.map(r => r.top)) + window.scrollY;
    const rowBottom = Math.max(...rects.map(r => r.bottom)) + window.scrollY;
    const node = {
      t: 'table', indent: Math.round(columns[0].left - ctx.left), cols: columns,
      width: Math.round(endXs - columns[0].left),
      minHeight: opt.single && b.r.height > 200 ? Math.round(b.r.height) : 0,
      top: opt.first ? b.top + b.pad[0] + b.bw[0] : rowTop,
      bottom: opt.last ? b.bottom - b.pad[2] - b.bw[2] : rowBottom
    };
    if (node.minHeight) { node.top = b.top; node.bottom = b.bottom; }
    emit(node, ctx, out);

    // Trait sous la rangée (ex. en-tête avec bordure inférieure)
    const lineBelow = opt.last && !opt.skipBorder ? borderSpec(b.cs, 'Bottom', el) : null;
    if (lineBelow) {
      emit({
        t: 'rule', color: lineBelow.color, px: Math.max(1, lineBelow.px),
        left: Math.round(b.left - ctx.left), right: Math.round(ctx.right - b.right),
        top: b.bottom - lineBelow.px, bottom: b.bottom
      }, ctx, out);
    }
  }

  /** Contenu d'un conteneur (colonne) : on traite l'élément comme racine sans re-détecter son propre cadre. */
  function walkContent(el, b, ctx, out, skipBorder) {
    // La colonne est elle-même une ligne flex/grille (logo + nom, etc.) : tableau imbriqué
    if (el !== document.body) {
      const rows = sideBySide(el, b);
      if (rows) { emitRows(el, b, rows, ctx, out, !!skipBorder); return; }
    }
    const nodes = [...el.childNodes].filter(n => n.nodeType === 3 || n.nodeType === 1);
    const inlineOnly = isInlineOnly(el);
    if (inlineOnly) {
      const runs = [];
      collectFor(el, runs);
      const p = paragraphFrom(el, { ...b, pad: [0, 0, 0, 0], bw: [0, 0, 0, 0], cLeft: b.cLeft, cRight: b.cRight, top: b.top + b.pad[0], bottom: b.bottom - b.pad[2], cs: b.cs }, runs, ctx, true);
      if (p) emit(p, ctx, out);
      return;
    }
    let buffer = [];
    const flushBuffer = () => {
      if (!buffer.length) return;
      const runs = []; collectRuns(buffer, runs); buffer = [];
      const p = paragraphFrom(el, b, runs, ctx, false);
      if (p) emit(p, ctx, out);
    };
    for (const n of nodes) {
      if (n.nodeType === 3) { buffer.push(n); continue; }
      if (SKIP.has(n.tagName) || isIcon(n)) continue;
      if (isInlineEl(n)) { buffer.push(n); continue; }
      flushBuffer();
      walk(n, ctx, out);
    }
    flushBuffer();
  }

  /* ---------- Racine ---------- */
  const root = { left: 0, right: PAGE_W, cursor: { y: 0 }, shd: null, root: true };
  const nodes = [];
  const bodyBox = box(document.body);
  const rootCtx = { ...root, cursor: { y: 0 } };
  walkContent(document.body, { ...bodyBox, pad: [0, 0, 0, 0], bw: [0, 0, 0, 0], cLeft: 0, cRight: PAGE_W, top: 0 }, rootCtx, nodes);

  const fullBleed = nodes.some(n => n.t === 'table' && n.width >= PAGE_W * 0.9 && n.indent <= 4);
  return { nodes, pageWidth: PAGE_W, fullBleed };
}

/* ------------------------------------------------------------
   2. CONSTRUCTION DU .DOCX (Node)
------------------------------------------------------------ */
const PX = 15; // 1 px CSS = 15 twips (96 dpi)
const tw = px => Math.round(px * PX);

function buildDocxBuffer(layout, title) {
  const docx = require('docx');
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
    BorderStyle, AlignmentType, HeightRule, VerticalAlign, ImageRun, TableLayoutType, LineRuleType
  } = docx;

  const NONE = { style: BorderStyle.NONE, size: 0, color: 'auto' };
  const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE };
  const ALIGN = { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED };

  const tinyParagraph = () => new Paragraph({
    children: [new TextRun({ text: '', size: 2 })],
    spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT }
  });

  const makeRun = run => {
    if (run.br) return new TextRun({ break: 1 });
    return new TextRun({
      text: run.text, color: run.color, size: run.size, bold: run.bold || undefined,
      italics: run.italic || undefined, underline: run.underline ? {} : undefined,
      strike: run.strike || undefined, font: run.font,
      characterSpacing: run.spacing || undefined
    });
  };

  const borderOf = (spec, spacePx) => {
    if (!spec) return undefined;
    return {
      style: spec.dashed ? BorderStyle.DASHED : BorderStyle.SINGLE,
      size: Math.min(96, Math.max(2, Math.round(spec.px * 6))), // huitièmes de point
      color: spec.color,
      space: Math.min(31, Math.max(0, Math.round(spacePx * 0.75)))
    };
  };

  const cellBorder = spec => !spec ? NONE : {
    style: spec.dashed ? BorderStyle.DASHED : BorderStyle.SINGLE,
    size: Math.min(96, Math.max(2, Math.round(spec.px * 6))), color: spec.color
  };

  function paragraphNode(n, inCell) {
    const hasBorder = side => !!n.borders[side];
    const before = n.before + (hasBorder('top') ? 0 : Math.round(n.padTop || 0));
    const after = hasBorder('bottom') ? 0 : Math.round(n.padBottom || 0);
    const runs = n.runs.map(makeRun);
    if (n.bullet) runs.unshift(new TextRun({ text: '•  ', color: n.runs[0]?.color, size: n.runs[0]?.size, font: n.runs[0]?.font }));
    const rightIndent = inCell ? (n.indentRight > 20 ? n.indentRight : 0) : n.indentRight;
    const borderObj = {};
    for (const [side, spec] of Object.entries(n.borders)) {
      const space = side === 'top' ? n.padTop : side === 'bottom' ? n.padBottom : side === 'left' ? n.padLeft : 4;
      borderObj[side] = borderOf(spec, space);
    }
    return new Paragraph({
      children: runs,
      alignment: ALIGN[n.align] || AlignmentType.LEFT,
      spacing: {
        before: tw(before), after: tw(after),
        ...(n.line ? { line: tw(n.line), lineRule: LineRuleType.AT_LEAST } : {})
      },
      indent: {
        left: Math.max(0, tw(n.indentLeft)), right: Math.max(0, tw(rightIndent)),
        ...(n.bullet ? { hanging: 240 } : {})
      },
      shading: n.shd ? { type: ShadingType.CLEAR, color: 'auto', fill: n.shd } : undefined,
      border: Object.keys(borderObj).length ? borderObj : undefined
    });
  }

  function imageNodeToParagraph(n) {
    const base64 = n.dataUrl.split(',')[1];
    return new Paragraph({
      children: [new ImageRun({ type: 'png', data: Buffer.from(base64, 'base64'), transformation: { width: n.w, height: n.h } })],
      alignment: ALIGN[n.align] || AlignmentType.LEFT,
      spacing: { before: tw(n.before), after: 0 },
      indent: { left: n.align === 'left' ? tw(n.left) : 0 }
    });
  }

  function ruleToParagraph(n) {
    return new Paragraph({
      children: [new TextRun({ text: '', size: 2 })],
      spacing: { before: tw(n.before), after: 0, line: 20, lineRule: LineRuleType.EXACT },
      indent: { left: Math.max(0, tw(n.left)), right: Math.max(0, tw(n.right)) },
      border: { bottom: { style: BorderStyle.SINGLE, size: Math.min(96, Math.max(2, Math.round(n.px * 6))), color: n.color, space: 0 } }
    });
  }

  function barToTable(n) {
    const fill = Math.max(0, Math.min(n.total, n.fill));
    const rest = Math.max(0, n.total - fill);
    const cell = (width, color) => new TableCell({
      children: [tinyParagraph()],
      width: { size: Math.max(1, tw(width)), type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: color },
      borders: NO_BORDERS,
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    const cells = [];
    const widths = [];
    if (fill > 0) { cells.push(cell(fill, n.fillColor)); widths.push(Math.max(1, tw(fill))); }
    if (rest > 0) { cells.push(cell(rest, n.trackColor)); widths.push(Math.max(1, tw(rest))); }
    if (!cells.length) cells.push(cell(n.total, n.trackColor)), widths.push(tw(n.total));
    return new Table({
      width: { size: tw(n.total), type: WidthType.DXA },
      columnWidths: widths,
      layout: TableLayoutType.FIXED,
      indent: { size: tw(n.left), type: WidthType.DXA },
      borders: { ...NO_BORDERS, insideHorizontal: NONE, insideVertical: NONE },
      rows: [new TableRow({ children: cells, height: { value: Math.max(20, tw(n.height)), rule: HeightRule.EXACT }, cantSplit: true })]
    });
  }

  function spacerBefore(px) {
    return px > 1 ? new Paragraph({
      children: [new TextRun({ text: '', size: 2 })],
      spacing: { before: 0, after: 0, line: Math.max(20, tw(px)), lineRule: LineRuleType.EXACT }
    }) : null;
  }

  function tableNode(n) {
    const widths = n.cols.map(c => Math.max(1, tw(c.width)));
    const total = widths.reduce((a, b) => a + b, 0);
    const row = new TableRow({
      cantSplit: false,
      height: n.minHeight ? { value: Math.min(tw(n.minHeight), 16770), rule: HeightRule.ATLEAST } : undefined,
      children: n.cols.map((col, i) => new TableCell({
        children: nodesToChildren(col.children, true),
        width: { size: widths[i], type: WidthType.DXA },
        verticalAlign: col.valign === 'center' ? VerticalAlign.CENTER : col.valign === 'bottom' ? VerticalAlign.BOTTOM : VerticalAlign.TOP,
        shading: col.bg ? { type: ShadingType.CLEAR, color: 'auto', fill: col.bg } : undefined,
        borders: col.borders ? {
          top: cellBorder(col.borders.top), bottom: cellBorder(col.borders.bottom),
          left: cellBorder(col.borders.left), right: cellBorder(col.borders.right)
        } : NO_BORDERS,
        margins: { top: tw(col.pad[0]), right: tw(col.pad[1]), bottom: tw(col.pad[2]), left: tw(col.pad[3]) }
      }))
    });
    return new Table({
      width: { size: total, type: WidthType.DXA },
      columnWidths: widths,
      layout: TableLayoutType.FIXED,
      indent: { size: tw(n.indent), type: WidthType.DXA },
      borders: { ...NO_BORDERS, insideHorizontal: NONE, insideVertical: NONE },
      rows: [row]
    });
  }

  function nodesToChildren(nodes, inCell) {
    const out = [];
    for (const n of nodes) {
      const lastIsTable = out.length && out[out.length - 1] instanceof Table;
      if (n.t === 'p') {
        out.push(paragraphNode(n, inCell));
      } else if (n.t === 'img') {
        out.push(imageNodeToParagraph(n));
      } else if (n.t === 'rule') {
        out.push(ruleToParagraph(n));
      } else if (n.t === 'bar') {
        const gap = spacerBefore(n.before);
        if (gap) out.push(gap);
        else if (lastIsTable) out.push(tinyParagraph());
        out.push(barToTable(n));
      } else if (n.t === 'table') {
        const gap = spacerBefore(n.before);
        if (gap) out.push(gap);
        else if (lastIsTable) out.push(tinyParagraph());
        out.push(tableNode(n));
      }
    }
    // Word exige un paragraphe à la fin d'une cellule ; et évite une page blanche après un tableau pleine page
    if (!out.length || out[out.length - 1] instanceof Table) out.push(tinyParagraph());
    return out;
  }

  const children = nodesToChildren(layout.nodes || [], false);
  const fullBleed = !!layout.fullBleed;

  const doc = new Document({
    creator: 'TakiDoc',
    title: title || 'Document TakiDoc',
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 }, paragraph: { spacing: { before: 0, after: 0 } } }
      }
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: fullBleed ? 0 : 720, right: 0, bottom: fullBleed ? 0 : 720, left: 0, header: 0, footer: 0, gutter: 0 }
        }
      },
      children
    }]
  });
  return Packer.toBuffer(doc);
}

module.exports = { extractInPage, buildDocxBuffer };
