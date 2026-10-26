/* ============================================================
TAKIDOC — INSTANTANÉ DU DOCUMENT (mode « édition libre »)

L'éditeur permet de tout modifier : textes, sections ajoutées ou
supprimées, police, couleur, photo. Le navigateur envoie donc le
contenu de #document-canvas au serveur, qui :

  1. NE LUI FAIT PAS CONFIANCE : il le nettoie (liste blanche de
     balises, d'attributs et de styles) ;
  2. l'applique sur le CSS d'ORIGINE du modèle, lu en base de données
     et isolé exactement comme dans l'éditeur (scopeCSS) ;
  3. reproduit les réglages de couleur et de police de l'éditeur.
============================================================ */

'use strict';

const { scopeCSS } = require('./scope-css');

const MAX_SNAPSHOT_CHARS = 8000000;

const HEX6_RE = /^#[0-9a-f]{6}$/i;
const DATA_IMAGE_RE = /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const ID_RE = /^[A-Za-z][\w:.-]{0,80}$/;

// Mêmes valeurs que le sélecteur de police de l'éditeur
const ALLOWED_FONTS = new Set([
  "'Inter', sans-serif",
  "'Georgia', serif",
  "'Arial', sans-serif",
  "'Times New Roman', serif",
  "'Courier New', monospace"
]);

class SnapshotError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SnapshotError';
  }
}

/* ------------------------------------------------------------
   Liste blanche
------------------------------------------------------------ */
const HTML_TAGS = [
  'a', 'abbr', 'address', 'article', 'aside', 'b', 'bdi', 'blockquote', 'br',
  'caption', 'cite', 'code', 'col', 'colgroup', 'dd', 'del', 'details', 'dfn',
  'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'header', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'main',
  'mark', 'nav', 'ol', 'p', 'pre', 'q', 's', 'samp', 'section', 'small', 'span',
  'strike', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot',
  'th', 'thead', 'time', 'tr', 'u', 'ul', 'var', 'wbr'
];

// Icônes en SVG intégré (jamais de <script>, <use>, <foreignObject>…)
const SVG_TAGS = [
  'svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse',
  'defs', 'lineargradient', 'radialgradient', 'stop'
];

const SVG_SHAPE_ATTRS = [
  'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'fill-rule', 'clip-rule', 'opacity', 'transform', 'fill-opacity', 'stroke-opacity'
];

const ALLOWED_ATTRIBUTES = {
  '*': ['class', 'style', 'id', 'title', 'lang', 'dir', 'role', 'aria-label', 'aria-hidden', 'data-field'],
  a: ['href', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
  td: ['colspan', 'rowspan', 'width', 'height', 'align', 'valign'],
  th: ['colspan', 'rowspan', 'width', 'height', 'align', 'valign'],
  col: ['span', 'width'],
  colgroup: ['span'],
  table: ['width', 'cellpadding', 'cellspacing', 'border', 'align'],
  ol: ['start', 'type'],
  li: ['value'],
  // sanitize-html met les noms d'attributs en minuscules ; Chromium rétablit la casse SVG à l'analyse
  svg: ['xmlns', 'viewbox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'preserveaspectratio', 'focusable'],
  g: SVG_SHAPE_ATTRS,
  path: ['d', ...SVG_SHAPE_ATTRS],
  circle: ['cx', 'cy', 'r', ...SVG_SHAPE_ATTRS],
  ellipse: ['cx', 'cy', 'rx', 'ry', ...SVG_SHAPE_ATTRS],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry', ...SVG_SHAPE_ATTRS],
  line: ['x1', 'y1', 'x2', 'y2', ...SVG_SHAPE_ATTRS],
  polyline: ['points', ...SVG_SHAPE_ATTRS],
  polygon: ['points', ...SVG_SHAPE_ATTRS],
  lineargradient: ['id', 'x1', 'y1', 'x2', 'y2', 'gradientunits', 'gradienttransform'],
  radialgradient: ['id', 'cx', 'cy', 'r', 'fx', 'fy', 'gradientunits', 'gradienttransform'],
  stop: ['offset', 'stop-color', 'stop-opacity']
};

/* Un attribut style est conservé tel quel s'il est « propre »,
   sinon il est supprimé en entier. */
const DATA_URL_IN_STYLE =
  /url\(\s*(['"]?)data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+\1\s*\)/gi;

function cleanStyle(value) {
  const style = String(value || '').trim();

  if (!style || style.length > 3000000) return '';

  const stripped = style.replace(DATA_URL_IN_STYLE, 'url(x)');

  // Toute URL qui n'est pas une image intégrée est refusée (pas de fuite réseau)
  if (/url\s*\(\s*(?!x\))/i.test(stripped)) return '';

  if (/expression\s*\(|@import|javascript:|vbscript:|behavior\s*:|-moz-binding|image-set\s*\(|cross-fade\s*\(|\/\*|[<>\\]/i
    .test(stripped)) {
    return '';
  }

  return style;
}

function sanitizeSnapshotHtml(html, allowedHosts) {
  // Chargé ici pour que le reste du serveur démarre même si le module manque
  let sanitizeHtml;

  try {
    sanitizeHtml = require('sanitize-html');
  } catch (error) {
    throw new Error('Module sanitize-html manquant : lance « npm install » dans le dossier du générateur.');
  }

  const hosts = allowedHosts instanceof Set ? allowedHosts : new Set(allowedHosts || []);

  const transform = (tagName, attribs) => {
    const attrs = { ...attribs };

    if (attrs.style !== undefined) {
      const style = cleanStyle(attrs.style);
      if (style) attrs.style = style;
      else delete attrs.style;
    }

    if (attrs.id !== undefined && !ID_RE.test(attrs.id)) delete attrs.id;

    if (tagName === 'img' && attrs.src !== undefined) {
      const src = String(attrs.src).trim();

      if (src.startsWith('data:')) {
        if (DATA_IMAGE_RE.test(src)) attrs.src = src;
        else delete attrs.src;
      } else {
        try {
          const url = new URL(src);
          if (url.protocol === 'https:' && hosts.has(url.hostname)) attrs.src = src;
          else delete attrs.src;
        } catch (_) {
          delete attrs.src;
        }
      }
    }

    if (tagName === 'a') attrs.rel = 'noopener noreferrer';

    return { tagName, attribs: attrs };
  };

  return sanitizeHtml(String(html || ''), {
    allowedTags: [...HTML_TAGS, ...SVG_TAGS],
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['data', 'https'] },
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    parseStyleAttributes: false,
    transformTags: { '*': transform },
    // Une image sans source valide est retirée
    exclusiveFilter: frame => frame.tag === 'img' && !frame.attribs.src
  });
}

/* ------------------------------------------------------------
   Aides pour le CSS du modèle
------------------------------------------------------------ */
function extractStyleBlocks(html) {
  const blocks = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let match;

  while ((match = re.exec(String(html || '')))) blocks.push(match[1]);

  return blocks;
}

// Même détection que loadTemplateFonts() de l'éditeur
function extractGoogleFontLinks(css) {
  const links = [];
  const re = /@import\s+(?:url\(\s*)?['"]?(https:\/\/fonts\.googleapis\.com\/[^'")\s;]+)/gi;
  let match;

  while ((match = re.exec(String(css || '')))) {
    links.push(match[1].replace(/&amp;/g, '&'));
  }

  return links;
}

function escapeAttr(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[c]);
}

function escapeText(value) {
  return String(value || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}

/* Réglages de couleur : copie de installColorOverrides() de l'éditeur */
function colorOverridesCss(color) {
  return `
    #document-canvas {
      --doc-primary-color: ${color};
      --primary-color: ${color};
    }
    #document-canvas .primary,
    #document-canvas .accent,
    #document-canvas .accent-color,
    #document-canvas .section-title,
    #document-canvas .title-accent,
    #document-canvas h1,
    #document-canvas h2 {
      border-color: ${color};
    }
    #document-canvas .text-primary,
    #document-canvas .primary-color,
    #document-canvas .accent-text {
      color: ${color};
    }
    #document-canvas .bg-primary,
    #document-canvas .primary-bg,
    #document-canvas .accent-bg {
      background-color: ${color};
    }
  `;
}

/* Réglages de police : copie de applyFontFamily() de l'éditeur */
function fontOverridesCss(font) {
  return `
    #document-canvas,
    #document-canvas *:not(svg):not(path):not(.fa):not(.fas):not(.far):not(.fab):not([class*="fa-"]) {
      font-family: ${font} !important;
    }
  `;
}

/* Environnement de base identique à celui de l'éditeur
   (remise à zéro, police Inter, interligne 1.5) */
const BASE_CSS = `
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #0F172A;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  #document-canvas {
    width: 210mm;
    min-height: 1122px;   /* un cheveu sous 297 mm : évite une page blanche en trop */
    background: #fff;
    position: relative;
  }
  tr, img { break-inside: avoid; }
  h1, h2, h3, h4 { break-after: avoid-page; }
  p, li { orphans: 3; widows: 3; }
`;

/* ------------------------------------------------------------
   Assemblage du document complet
------------------------------------------------------------ */
function buildSnapshotDocument(template, snapshot, options = {}) {
  const rawHtml = String(snapshot?.html || '');

  if (!rawHtml.trim()) throw new SnapshotError('Le document est vide.');
  if (rawHtml.length > MAX_SNAPSHOT_CHARS) throw new SnapshotError('Le document est trop volumineux.');

  const body = sanitizeSnapshotHtml(rawHtml, options.allowedHosts);

  if (!body.trim()) throw new SnapshotError('Le document ne contient aucun contenu valide.');

  // CSS d'ORIGINE du modèle (base de données = source de confiance)
  const inlineBlocks = extractStyleBlocks(template.html_structure);
  const fontLinks = new Set([
    ...extractGoogleFontLinks(template.css_styles),
    ...inlineBlocks.flatMap(extractGoogleFontLinks)
  ]);

  const templateCss = [
    scopeCSS(template.css_styles),
    ...inlineBlocks.map(block => scopeCSS(block))
  ].join('\n');

  // Réglages choisis par l'utilisateur dans l'éditeur
  const color = snapshot.color_active && HEX6_RE.test(String(snapshot.primary_color || '').trim())
    ? String(snapshot.primary_color).trim().toUpperCase()
    : null;

  const font = snapshot.font_custom && ALLOWED_FONTS.has(snapshot.font_family)
    ? snapshot.font_family
    : null;

  const canvasStyle = [
    color ? `--doc-primary-color:${color};--primary-color:${color};` : '',
    font ? `font-family:${font};` : ''
  ].join('');

  const links = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
    ...fontLinks
  ].map(href => `<link rel="stylesheet" href="${escapeAttr(href)}">`).join('\n  ');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${escapeText(template.name)}</title>
  ${links}
  <style>${BASE_CSS}</style>
  <style>
${templateCss}
  </style>
  <style>
${color ? colorOverridesCss(color) : ''}
${font ? fontOverridesCss(font) : ''}
  </style>
</head>
<body>
  <div id="document-canvas" style="${escapeAttr(canvasStyle)}">
${body}
  </div>
</body>
</html>`;
}

module.exports = {
  buildSnapshotDocument,
  sanitizeSnapshotHtml,
  cleanStyle,
  SnapshotError,
  MAX_SNAPSHOT_CHARS
};
