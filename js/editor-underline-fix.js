/* ============================================
   TAKIDOC — CORRECTIF DES SOULIGNEMENTS DANS LE PDF

   Problème : html2canvas dessine tout soulignement (text-decoration: underline)
   à la même place, collé à la ligne de base, en ignorant
   `text-underline-offset` et `text-decoration-thickness`. Résultat : dans le PDF
   le trait touche (ou traverse) les lettres alors qu'il est bien espacé
   dans l'éditeur.

   Solution : au moment de la capture, et SEULEMENT dans la copie du document
   utilisée par html2canvas (l'éditeur n'est jamais modifié), on retire les
   soulignements et on les redessine à la bonne position, ligne par ligne,
   en reprenant l'écart, l'épaisseur, la couleur et le style du CSS du modèle.

   Utilisation : importer ce fichier AVANT editor-pagination.js dans editor.js :
     import './editor-underline-fix.js';
============================================ */

(() => {
  'use strict';

  const original = window.html2canvas;

  if (typeof original !== 'function' || original.__takidocUnderlineFix) {
    return;
  }

  /* ---------- Métriques de police (pour retrouver la ligne de base) ---------- */

  const metricsCache = new Map();
  let measureCtx = null;

  function getMetrics(cs) {
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;

    if (metricsCache.has(font)) return metricsCache.get(font);

    const size = parseFloat(cs.fontSize) || 16;
    let ascent = size * 0.8;
    let descent = size * 0.2;

    try {
      measureCtx = measureCtx || document.createElement('canvas').getContext('2d');
      measureCtx.font = font;

      const m = measureCtx.measureText('Hg');

      if (m.fontBoundingBoxAscent && m.fontBoundingBoxDescent) {
        ascent = m.fontBoundingBoxAscent;
        descent = m.fontBoundingBoxDescent;
      }
    } catch (error) {
      /* valeurs approximatives conservées */
    }

    const result = { ascent, descent };
    metricsCache.set(font, result);
    return result;
  }

  /* Le soulignement d'un parent ne s'applique pas aux enfants « inline-block »,
     flottants ou positionnés en absolu : on les ignore, comme le fait le navigateur */
  function receivesDecoration(textNode, decorator, win) {
    for (
      let node = textNode.parentElement;
      node && node !== decorator;
      node = node.parentElement
    ) {
      const s = win.getComputedStyle(node);

      if (
        /^inline-(block|flex|grid|table)$/.test(s.display) ||
        s.position === 'absolute' ||
        s.position === 'fixed' ||
        (s.cssFloat || s.float) !== 'none'
      ) {
        return false;
      }
    }

    return true;
  }

  /* ---------- Redessin des soulignements dans la copie du document ---------- */

  function paintUnderlines(doc, root) {
    const win = doc.defaultView;
    if (!win) return;

    root = root || doc.getElementById('document-canvas') || doc.body;

    const rootRect = root.getBoundingClientRect();
    const scale = (root.offsetWidth ? rootRect.width / root.offsetWidth : 1) || 1;

    if (win.getComputedStyle(root).position === 'static') {
      root.style.position = 'relative';
    }

    const decorators = [root, ...root.querySelectorAll('*')].filter(el => {
      const s = win.getComputedStyle(el);
      return /underline/.test(s.textDecorationLine || s.textDecoration || '');
    });

    if (!decorators.length) return;

    const seen = new WeakSet();
    const lines = [];

    decorators.forEach(el => {
      const cs = win.getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize) || 16;

      const thicknessRaw = cs.textDecorationThickness || '';
      const thickness = /px$/.test(thicknessRaw)
        ? parseFloat(thicknessRaw)
        : Math.max(1, fontSize * 0.06);

      const offsetRaw = cs.textUnderlineOffset || '';
      const offset = /px$/.test(offsetRaw)
        ? parseFloat(offsetRaw)
        : fontSize * 0.1;

      const deco = {
        thickness,
        color: cs.textDecorationColor || cs.color,
        style: cs.textDecorationStyle || 'solid'
      };

      const walker = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */);
      let node;

      while ((node = walker.nextNode())) {
        if (seen.has(node) || !node.nodeValue) continue;
        if (!receivesDecoration(node, el, win)) continue;

        seen.add(node);

        const { descent } = getMetrics(win.getComputedStyle(node.parentElement));

        const range = doc.createRange();
        range.selectNodeContents(node);

        [...range.getClientRects()].forEach(rect => {
          if (rect.width < 0.5 || rect.height < 0.5) return;

          lines.push({
            deco,
            left: (rect.left - rootRect.left) / scale,
            // bas du texte → ligne de base → + écart demandé par le CSS
            top: (rect.bottom - rootRect.top) / scale - descent + offset,
            width: rect.width / scale
          });
        });
      }
    });

    // On retire les soulignements natifs (laids) de la copie…
    decorators.forEach(el => {
      const others = (win.getComputedStyle(el).textDecorationLine || '')
        .split(/\s+/)
        .filter(v => v && v !== 'underline' && v !== 'none');

      el.style.setProperty(
        'text-decoration-line',
        others.length ? others.join(' ') : 'none',
        'important'
      );
    });

    // …et on redessine les nôtres
    const addLine = (line, extraTop = 0) => {
      const div = doc.createElement('div');
      div.setAttribute('data-takidoc-underline', '1');

      const { deco } = line;
      const dashed = deco.style === 'dashed' || deco.style === 'dotted';

      Object.assign(div.style, {
        position: 'absolute',
        left: `${line.left}px`,
        top: `${line.top + extraTop}px`,
        width: `${line.width}px`,
        height: dashed ? '0' : `${deco.thickness}px`,
        background: dashed ? 'none' : deco.color,
        borderTop: dashed ? `${deco.thickness}px ${deco.style} ${deco.color}` : '0',
        pointerEvents: 'none',
        zIndex: '9999'
      });

      root.appendChild(div);
    };

    lines.forEach(line => {
      addLine(line);

      if (line.deco.style === 'double') {
        addLine(line, line.deco.thickness * 2);
      }
    });
  }

  /* ---------- Branchement sur html2canvas ---------- */

  const patched = function (element, options = {}) {
    const userOnclone = options.onclone;

    return original(element, {
      ...options,
      onclone: async (doc, clonedElement) => {
        if (typeof userOnclone === 'function') {
          await userOnclone(doc, clonedElement);
        }

        try {
          paintUnderlines(doc, clonedElement);
        } catch (error) {
          console.warn('TakiDoc : correction des soulignements impossible', error);
        }
      }
    });
  };

  Object.assign(patched, original);
  patched.__takidocUnderlineFix = true;

  window.html2canvas = patched;
})();
