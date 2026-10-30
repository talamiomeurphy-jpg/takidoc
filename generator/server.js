/* ============================================================
TAKIDOC — GÉNÉRATEUR DE DOCUMENTS (Version 3.0)
Endpoint POST /api/generate avec Puppeteer — formats PDF et DOCX (Word)
Mode « instantané » : reçoit le document édité par l'utilisateur (data.snapshot),
le nettoie, puis l'applique sur le CSS d'origine du modèle.

Flux :
 1. Reçoit nonce + template_id + format + données
 2. Valide strictement les paramètres (avant de toucher au nonce)
 3. Valide et consomme le nonce via validate_and_consume_nonce (SQL)
 4. Récupère le modèle de confiance depuis Supabase
 5. Injecte les données (champs, couleur, photo) de façon sécurisée
 6. Génère le PDF avec un navigateur Chromium partagé (file d'attente)
 7. Renvoie le PDF en binaire (Buffer) — corrige le bug du Uint8Array
    qui était sérialisé en JSON par Express et rendait le PDF illisible

Correctifs majeurs par rapport à la v1.1 :
 - Conversion Uint8Array -> Buffer (cause du PDF « impossible à ouvrir »)
 - Navigateur réutilisé entre les requêtes (bien plus rapide)
 - File d'attente + limite de rendus simultanés (protège la RAM de Render)
 - Remplacement des champs via fonction (les « $1 », « $& » dans les
   données ne cassent plus le HTML)
 - Couleur injectée aussi dans le CSS du modèle, et validée (anti-injection)
 - Photo validée (data URL image uniquement) et injectée proprement
 - Requêtes réseau de Chromium filtrées (anti-SSRF / file://)
 - Limitation de débit par IP, identifiant de requête, arrêt propre
============================================================ */

'use strict';

require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const { buildSnapshotDocument, SnapshotError } = require('./lib/snapshot');

/* ============================================================
   CONFIGURATION
============================================================ */
const IS_PROD = process.env.NODE_ENV === 'production';

// Nettoie une variable d'environnement : espaces et guillemets collés par erreur
function cleanEnv(value) {
  return String(value ?? '').trim().replace(/^['"]+|['"]+$/g, '').trim();
}

const CONFIG = {
  port: Number(process.env.PORT) || 3001,
  supabaseUrl: cleanEnv(process.env.SUPABASE_URL) || 'https://wyfkogowsdbxctbpfuud.supabase.co',
  supabaseKey: cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),

  allowedOrigins: (process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5500', 'http://localhost:3000', 'https://takidoc.onrender.com']
  ).map(o => cleanEnv(o).replace(/\/$/, '')).filter(Boolean),

  // Rendu
  maxConcurrentRenders: Math.max(1, Number(process.env.MAX_CONCURRENT_RENDERS) || 2),
  queueTimeoutMs: Number(process.env.QUEUE_TIMEOUT_MS) || 45000,
  renderTimeoutMs: Number(process.env.RENDER_TIMEOUT_MS) || 30000,
  browserRecycleAfter: Number(process.env.BROWSER_RECYCLE_AFTER) || 100,
  // Word : convertit les mises en page en colonnes (flex/grid) en tableaux Word
  docxLayoutTables: process.env.DOCX_LAYOUT_TABLES !== 'false',

  // Limitation de débit (par IP)
  rateLimitWindowMs: 60 * 1000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 30,

  // Limites des données
  maxFieldLength: 5000,
  maxPhotoChars: 7000000,

  defaultColorFallback: '#0F172A'
};

// Hôtes autorisés à charger des ressources dans le document (polices, images…)
function hostOf(url) {
  try { return new URL(url).hostname; } catch { return null; }
}
const ALLOWED_ASSET_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  hostOf(CONFIG.supabaseUrl),
  ...(process.env.ASSET_HOSTS || '').split(',').map(h => h.trim())
].filter(Boolean));

const ID_RE = /^[A-Za-z0-9_-]{4,128}$/;
const HEX_COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const PHOTO_DATA_URL_RE = /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;

if (!/^https?:\/\//i.test(CONFIG.supabaseUrl)) {
  console.error('');
  console.error('❌ SUPABASE_URL est invalide (début de la valeur reçue : « ' + CONFIG.supabaseUrl.slice(0, 12) + '… »).');
  console.error('   Elle doit ressembler à : https://xxxxxxxx.supabase.co  (sans guillemets, sans espace).');
  console.error('   Corrige-la dans Render > Environment, puis redéploie.');
  console.error('');
  process.exit(1);
}

if (!CONFIG.supabaseKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY est vide : /api/generate renverra une erreur de configuration.');
}

/* ============================================================
   CLIENT SUPABASE (service_role : contourne la RLS)
============================================================ */
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey || 'missing-key', {
  auth: { persistSession: false, autoRefreshToken: false }
});

/* ============================================================
   UTILITAIRES
============================================================ */
function log(reqId, ...args) {
  console.log(reqId ? `[${reqId}]` : '[srv]', ...args);
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text ?? '').replace(/[&<>"']/g, m => map[m]);
}

// Échappe puis conserve les retours à la ligne saisis par l'utilisateur
function toHtmlText(value) {
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Transforme n'importe quelle valeur reçue en texte propre et borné
function normalizeValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) value = value.map(v => normalizeValue(v)).filter(Boolean).join('\n');
  else if (typeof value === 'object') return '';
  return String(value).slice(0, CONFIG.maxFieldLength).trim();
}

function safeFileName(name) {
  return String(name || 'document')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'document';
}

/* ============================================================
   LIMITATION DE DÉBIT (en mémoire, sans dépendance)
============================================================ */
function rateLimit({ windowMs, max }) {
  const hits = new Map();

  const cleaner = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.reset <= now) hits.delete(key);
    }
  }, windowMs);
  cleaner.unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    let entry = hits.get(key);

    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ error: 'Trop de requêtes. Réessayez dans un instant.' });
    }
    next();
  };
}

/* ============================================================
   SÉMAPHORE (limite les rendus simultanés)
============================================================ */
class Semaphore {
  constructor(max) {
    this.max = max;
    this.active = 0;
    this.queue = [];
  }

  acquire(timeoutMs) {
    if (this.active < this.max) {
      this.active += 1;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const waiter = { resolve, timer: null };
      waiter.timer = setTimeout(() => {
        this.queue = this.queue.filter(w => w !== waiter);
        reject(new Error('QUEUE_TIMEOUT'));
      }, timeoutMs);
      this.queue.push(waiter);
    });
  }

  release() {
    const next = this.queue.shift();
    if (next) {
      clearTimeout(next.timer);
      next.resolve(); // le créneau est transmis, active reste inchangé
    } else {
      this.active = Math.max(0, this.active - 1);
    }
  }
}

const renderSlots = new Semaphore(CONFIG.maxConcurrentRenders);

/* ============================================================
   NAVIGATEUR CHROMIUM PARTAGÉ
============================================================ */
let browserPromise = null;
let renderCount = 0;

function findBrowserExecutable() {
  // 1. Chemin explicitement fourni
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  // 2. Windows : Chrome / Edge installés localement
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    return candidates.find(p => fs.existsSync(p)) || null;
  }

  // 3. Linux / macOS : Chromium téléchargé par Puppeteer
  return null;
}

function buildLaunchOptions() {
  const options = {
    headless: true,
    timeout: 30000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--no-first-run',
      '--font-render-hinting=none'
    ]
  };

  const executablePath = findBrowserExecutable();
  if (executablePath) {
    options.executablePath = executablePath;
    log(null, '🌐 Navigateur utilisé :', executablePath);
  }
  return options;
}

async function getBrowser() {
  if (browserPromise) {
    try {
      const existing = await browserPromise;
      if (existing.connected) return existing;
    } catch (_) { /* on relance ci-dessous */ }
    browserPromise = null;
  }

  log(null, '🖨️  Lancement de Chromium...');
  const launching = puppeteer.launch(buildLaunchOptions())
    .then(browser => {
      renderCount = 0;
      browser.on('disconnected', () => {
        log(null, '⚠️  Chromium déconnecté');
        if (browserPromise === launching) browserPromise = null;
      });
      log(null, '✅ Chromium prêt');
      return browser;
    })
    .catch(err => {
      if (browserPromise === launching) browserPromise = null;
      throw err;
    });

  browserPromise = launching;
  return launching;
}

async function closeBrowser() {
  if (!browserPromise) return;
  const pending = browserPromise;
  browserPromise = null;
  try {
    const browser = await pending;
    await browser.close();
    log(null, '🔒 Chromium fermé');
  } catch (_) { /* déjà fermé ou jamais lancé */ }
}

/* ============================================================
   RESTITUTION D'UN NONCE (si la génération échoue côté serveur,
   l'utilisateur ne perd pas un téléchargement)
============================================================ */
async function releaseNonce(reqId, nonce) {
  if (!nonce) return;

  try {
    const { data, error } = await supabase.rpc('release_generation_nonce', { p_nonce: nonce });
    if (error) throw error;
    log(reqId, '↩️  Nonce restitué :', data);
  } catch (error) {
    log(reqId, '⚠️  Restitution du nonce impossible :', error.message || error);
  }
}

/* ============================================================
   CONSTRUCTION DU DOCUMENT HTML
============================================================ */
function injectFields(html, fields, fieldValues) {
  let out = html;

  for (const field of fields) {
    const name = field.field_name;
    if (!name || typeof name !== 'string') continue;

    const provided = Object.prototype.hasOwnProperty.call(fieldValues, name)
      ? normalizeValue(fieldValues[name])
      : '';
    const value = provided || normalizeValue(field.default_value);
    const safe = toHtmlText(value);
    const n = escapeRegex(name);

    // <span id="field-nom">…</span>
    out = out.replace(
      new RegExp(`(<[^>]*\\bid=["']field-${n}["'][^>]*>)([^<]*)(<)`, 'gi'),
      (m, open, _old, close) => `${open}${safe}${close}`
    );

    // <span data-field="nom">…</span>
    out = out.replace(
      new RegExp(`(<[^>]*\\bdata-field=["']${n}["'][^>]*>)([^<]*)(<)`, 'gi'),
      (m, open, _old, close) => `${open}${safe}${close}`
    );

    // {{nom}}
    out = out.replace(
      new RegExp(`\\{\\{\\s*${n}\\s*\\}\\}`, 'g'),
      () => safe
    );
  }

  return out;
}

function injectColor(text, color) {
  return text
    .replace(/(--doc-primary-color\s*:\s*)[^;}]+/gi, (m, p) => `${p}${color}`)
    .replace(/(--primary-color\s*:\s*)[^;}]+/gi, (m, p) => `${p}${color}`);
}

function injectPhoto(html, dataUrl) {
  const classMatch = `class=["'](?:[^"']*\\s)?doc-photo(?:\\s[^"']*)?["']`;
  const marker = `(?:id=["']doc-photo["']|${classMatch})`;

  // Cas 1 : <img id="doc-photo"> ou <img class="doc-photo"> — on garde la balise et ses styles
  let out = html.replace(
    new RegExp(`<img\\b[^>]*${marker}[^>]*>`, 'gi'),
    tag => tag
      .replace(/\s+src=("[^"]*"|'[^']*')/i, '')
      .replace(/<img\b/i, `<img src="${dataUrl}"`)
  );

  // Cas 2 : <div id="doc-photo"> ou <div class="doc-photo"> — on remplace son contenu
  const imgTag = `<img src="${dataUrl}" alt="Photo" style="width:100%;height:100%;object-fit:cover;display:block;">`;
  out = out.replace(
    new RegExp(`(<div\\b[^>]*${marker}[^>]*>)([\\s\\S]*?)(<\\/div>)`, 'gi'),
    (m, open, _inner, close) => `${open}${imgTag}${close}`
  );

  return out;
}


/* ------------------------------------------------------------
   Mode « instantané » : réapplique la couleur et la police choisies.
   Le navigateur n'envoie que le HTML du document ; la couleur (variable CSS
   portée par l'éditeur) et la police ne voyageaient donc pas jusqu'ici.
   Les valeurs sont validées strictement avant d'être injectées.
------------------------------------------------------------ */
const FONT_FAMILY_RE = /^[A-Za-z0-9 ,'"\-]{1,200}$/;

function applySnapshotOverrides(html, data) {
  let out = html;
  let css = '';

  if (typeof data.primary_color === 'string' && HEX_COLOR_RE.test(data.primary_color.trim())) {
    const c = data.primary_color.trim();
    out = injectColor(out, c); // réécrit les déclarations --doc-primary-color / --primary-color du modèle
    css += `:root{--doc-primary-color:${c};--primary-color:${c};}`
      + `.primary,.accent,.accent-color,.section-title,.title-accent,h1,h2{border-color:${c};}`
      + `.text-primary,.primary-color,.accent-text{color:${c};}`
      + `.bg-primary,.primary-bg,.accent-bg{background-color:${c};}`;
  }

  if (typeof data.font_family === 'string' && FONT_FAMILY_RE.test(data.font_family.trim())) {
    const f = data.font_family.trim();
    css += `body,body *:not(svg):not(path):not(.fa):not(.fas):not(.far):not(.fab):not([class*="fa-"]){font-family:${f} !important;}`;
  }

  if (!css) return out;
  const tag = `<style>${css}</style>`;
  return /<\/head>/i.test(out) ? out.replace(/<\/head>/i, () => tag + '</head>') : tag + out;
}

function buildDocumentHtml(template, data) {
  const fields = Array.isArray(template.template_fields) ? template.template_fields : [];

  // Valeurs : data.fields prioritaire, sinon data directement
  const fieldValues = (data.fields && typeof data.fields === 'object' && !Array.isArray(data.fields))
    ? data.fields
    : data;

  let bodyHtml = String(template.html_structure || '');
  let css = String(template.css_styles || '');

  bodyHtml = injectFields(bodyHtml, fields, fieldValues);

  // Couleur principale — uniquement si fournie ET valide
  let colorOverride = '';
  if (typeof data.primary_color === 'string' && HEX_COLOR_RE.test(data.primary_color.trim())) {
    const color = data.primary_color.trim();
    bodyHtml = injectColor(bodyHtml, color);
    css = injectColor(css, color);
    colorOverride = `:root{--doc-primary-color:${color};--primary-color:${color};}`;
  }

  // Photo — uniquement une data URL image valide et de taille raisonnable
  if (typeof data.photo_data_url === 'string' && data.photo_data_url) {
    const photo = data.photo_data_url.trim();
    if (photo.length <= CONFIG.maxPhotoChars && PHOTO_DATA_URL_RE.test(photo)) {
      bodyHtml = injectPhoto(bodyHtml, photo);
    }
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @page { size: A4; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body {
      width: 210mm;
      min-height: 297mm;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    #doc-photo img, .doc-photo img, img#doc-photo, img.doc-photo {
      object-fit: cover;
    }
  </style>
  <style>
${css}
${colorOverride}
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/* ============================================================
   RENDU (PDF / DOCX) — page Chromium isolée et filtrée
============================================================ */
async function withRenderedPage(html, reqId, task) {
  await renderSlots.acquire(CONFIG.queueTimeoutMs);

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    page.setDefaultTimeout(CONFIG.renderTimeoutMs);

    // Filtrage réseau : seules les ressources de confiance sont chargées
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = request.url();

      if (url.startsWith('data:') || url.startsWith('about:') || url.startsWith('blob:')) {
        return request.continue();
      }

      try {
        const parsed = new URL(url);
        if (parsed.protocol === 'https:' && ALLOWED_ASSET_HOSTS.has(parsed.hostname)) {
          return request.continue();
        }
      } catch (_) { /* URL invalide : bloquée ci-dessous */ }

      log(reqId, '🚫 Ressource bloquée :', url.slice(0, 120));
      return request.abort('blockedbyclient');
    });

    log(reqId, '📄 Chargement du contenu dans le navigateur...');
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: CONFIG.renderTimeoutMs
    });

    // Attendre que les polices soient prêtes
    await page.evaluate(() => document.fonts.ready);

    const result = await task(page);
    renderCount += 1;
    return result;
  } finally {
    if (page) {
      try { await page.close(); } catch (_) { /* page déjà fermée */ }
    }

    // Recyclage périodique de Chromium pour éviter les fuites mémoire
    if (renderCount >= CONFIG.browserRecycleAfter
        && renderSlots.active === 1
        && renderSlots.queue.length === 0) {
      await closeBrowser();
    }

    renderSlots.release();
  }
}

/* ------------------------------------------------------------
   PDF
------------------------------------------------------------ */
async function renderPdf(html, reqId) {
  return withRenderedPage(html, reqId, async page => {
    log(reqId, '🖨️  Génération du PDF...');
    const pdfRaw = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    // CORRECTIF CLÉ : Puppeteer ≥ 22 renvoie un Uint8Array.
    // Express le sérialiserait en JSON ; il faut un vrai Buffer.
    const pdf = Buffer.from(pdfRaw);

    if (pdf.subarray(0, 4).toString('latin1') !== '%PDF') {
      throw new Error("Le fichier généré n'est pas un PDF valide");
    }
    return pdf;
  });
}

/* ------------------------------------------------------------
   DOCX (Word)

   Principe : Word ne comprend ni les classes CSS, ni les variables CSS,
   ni flex/grid. On demande donc à Chromium (qui sait tout calculer) de
   « figer » chaque élément avec ses styles réels en ligne (couleurs,
   tailles, graisses…), et de transformer les colonnes côte à côte
   (ex. barre latérale + contenu) en tableau Word. Le HTML obtenu est
   ensuite converti en .docx par la bibliothèque html-to-docx.
------------------------------------------------------------ */
function isNativeDocxAvailable() {
  try { require.resolve('docx'); require.resolve('./docx-native'); return true; } catch (_) { return false; }
}

function isLegacyDocxAvailable() {
  try { require.resolve('html-to-docx'); return true; } catch (_) { return false; }
}

function isDocxAvailable() {
  return isNativeDocxAvailable() || isLegacyDocxAvailable();
}

// ⚠️ Cette fonction s'exécute DANS Chromium : elle ne doit utiliser
// aucune variable du serveur Node.
function wordifyInPage(opts) {
  const SAFE_FONTS = ['arial', 'calibri', 'cambria', 'courier new', 'georgia',
    'segoe ui', 'tahoma', 'times new roman', 'trebuchet ms', 'verdana'];

  const toHex = value => {
    const m = /rgba?\(([^)]+)\)/.exec(value || '');
    if (!m) return null;
    const p = m[1].split(',').map(x => parseFloat(x));
    if (p.length > 3 && p[3] === 0) return null; // transparent
    return '#' + p.slice(0, 3).map(n => Math.round(n).toString(16).padStart(2, '0')).join('');
  };

  const body = document.body;

  // Éléments sans équivalent Word
  body.querySelectorAll('script, style, link, noscript, svg, canvas, video, audio, iframe')
    .forEach(n => n.remove());

  const pageWidth = body.getBoundingClientRect().width || 794;
  const all = Array.from(body.querySelectorAll('*'));

  // 1. Repérer les mises en page en colonnes (mesures AVANT toute modification)
  const layouts = [];
  if (opts && opts.layoutTables) {
    const handled = [];
    for (const el of all) {
      if (handled.some(h => h.contains(el))) continue;

      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const kids = Array.from(el.children).filter(k => getComputedStyle(k).display !== 'none');
      if (kids.length < 2 || rect.width < pageWidth * 0.6) continue;

      const isFlexRow = (cs.display === 'flex' || cs.display === 'inline-flex')
        && !cs.flexDirection.startsWith('column');
      const isGrid = cs.display === 'grid'
        && cs.gridTemplateColumns.trim().split(/\s+/).length >= 2;
      if (!isFlexRow && !isGrid) continue;

      // Les enfants doivent vraiment être côte à côte
      const rects = kids.map(k => k.getBoundingClientRect());
      const sideBySide = rects.every((r, i) => i === 0 || r.left >= rects[i - 1].right - 2);
      if (!sideBySide) continue;

      handled.push(el);
      layouts.push({
        el,
        total: rect.width,
        cols: kids.map((k, i) => {
          const kcs = getComputedStyle(k);
          return {
            el: k,
            width: rects[i].width,
            bg: toHex(kcs.backgroundColor),
            pad: [kcs.paddingTop, kcs.paddingRight, kcs.paddingBottom, kcs.paddingLeft]
              .map(v => Math.round(parseFloat(v) || 0))
          };
        })
      });
    }
  }

  // 2. Figer les styles calculés en styles en ligne
  for (const el of all) {
    if (!el.isConnected) continue;
    const cs = getComputedStyle(el);

    if (cs.display === 'none' || cs.visibility === 'hidden') {
      el.remove();
      continue;
    }

    const css = [];

    const color = toHex(cs.color);
    if (color) css.push('color:' + color);

    const bg = toHex(cs.backgroundColor);
    if (bg) css.push('background-color:' + bg);

    css.push('font-size:' + (parseFloat(cs.fontSize) * 0.75).toFixed(1) + 'pt');

    const family = (cs.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim();
    css.push('font-family:' + (SAFE_FONTS.includes(family.toLowerCase()) ? family : 'Calibri'));

    if (parseInt(cs.fontWeight, 10) >= 600 || cs.fontWeight === 'bold') css.push('font-weight:bold');
    if (cs.fontStyle === 'italic') css.push('font-style:italic');
    if (cs.textDecorationLine && cs.textDecorationLine.indexOf('underline') !== -1) {
      css.push('text-decoration:underline');
    }
    if (['center', 'right', 'justify'].indexOf(cs.textAlign) !== -1) {
      css.push('text-align:' + cs.textAlign);
    }

    // Word ne gère pas text-transform : on applique la mise en majuscules au texte
    if (cs.textTransform === 'uppercase') {
      el.childNodes.forEach(n => {
        if (n.nodeType === 3) n.textContent = n.textContent.toUpperCase();
      });
    }

    // Espacement vertical des blocs de texte
    const hasOwnText = Array.from(el.childNodes)
      .some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasOwnText && (cs.display === 'block' || cs.display === 'list-item')) {
      const mt = Math.min(40, Math.max(0, Math.round(parseFloat(cs.marginTop) || 0)));
      const mb = Math.min(40, Math.max(0, Math.round(parseFloat(cs.marginBottom) || 0)));
      if (mt) css.push('margin-top:' + mt + 'px');
      if (mb) css.push('margin-bottom:' + mb + 'px');
    }

    if (el.tagName === 'IMG') {
      const r = el.getBoundingClientRect();
      if (r.width) el.setAttribute('width', String(Math.round(r.width)));
      if (r.height) el.setAttribute('height', String(Math.round(r.height)));
    }

    el.setAttribute('style', css.join(';'));
    el.removeAttribute('class');
  }

  // 3. Colonnes -> tableau Word (une ligne, une cellule par colonne)
  for (const layout of layouts) {
    if (!layout.el.isConnected) continue;

    const table = document.createElement('table');
    table.setAttribute('width', String(Math.round(layout.total)));
    table.setAttribute('style', 'width:' + Math.round(layout.total) + 'px;border-collapse:collapse;');

    const tr = document.createElement('tr');
    for (const col of layout.cols) {
      const td = document.createElement('td');
      const w = Math.round(col.width);
      td.setAttribute('width', String(w));
      td.setAttribute('style',
        'width:' + w + 'px;vertical-align:top;'
        + 'padding:' + col.pad.map(v => v + 'px').join(' ') + ';'
        + (col.bg ? 'background-color:' + col.bg + ';' : ''));

      if (col.el.isConnected) {
        col.el.style.removeProperty('background-color'); // le fond est porté par la cellule
        while (col.el.firstChild) td.appendChild(col.el.firstChild);
      }
      tr.appendChild(td);
    }
    table.appendChild(tr);
    layout.el.replaceWith(table);
  }

  return { html: body.innerHTML, tables: layouts.length };
}

async function renderDocx(html, title, reqId) {
  if (!isDocxAvailable()) throw new Error('DOCX_UNAVAILABLE');

  // 1) Rendu Word NATIF (vrais paragraphes, tableaux, fonds colorés…)
  if (isNativeDocxAvailable() && process.env.DOCX_NATIVE !== 'false') {
    try {
      return await renderDocxNative(html, title, reqId);
    } catch (error) {
      log(reqId, '⚠️  Rendu Word natif en échec, bascule sur html-to-docx :', error && error.message);
      if (!isLegacyDocxAvailable()) throw error;
    }
  }

  // 2) Secours : conversion HTML -> Word
  return renderDocxLegacy(html, title, reqId);
}

async function renderDocxNative(html, title, reqId) {
  const { extractInPage, buildDocxBuffer } = require('./docx-native');

  log(reqId, '📝 Analyse de la mise en page pour Word (rendu natif)...');
  const layout = await withRenderedPage(html, reqId, page => page.evaluate(extractInPage));

  if (!layout || !Array.isArray(layout.nodes) || !layout.nodes.length) {
    throw new Error('Aucun contenu exploitable pour le rendu Word natif');
  }

  log(reqId, '📝 Génération du DOCX natif... (' + layout.nodes.length + ' blocs)');
  const docx = Buffer.from(await buildDocxBuffer(layout, title));

  if (docx.subarray(0, 2).toString('latin1') !== 'PK') {
    throw new Error("Le fichier généré n'est pas un DOCX valide");
  }
  return docx;
}

async function renderDocxLegacy(html, title, reqId) {
  const HTMLtoDOCX = require('html-to-docx');

  log(reqId, '📝 Préparation du contenu pour Word...');
  const prepared = await withRenderedPage(html, reqId, page =>
    page.evaluate(wordifyInPage, { layoutTables: CONFIG.docxLayoutTables })
  );

  const wordHtml = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>'
    + escapeHtml(title)
    + '</title></head><body>' + prepared.html + '</body></html>';

  // Si une mise en page en colonnes pleine largeur a été conservée, on supprime
  // les marges de page ; sinon on garde 1,27 cm pour que le texte respire.
  const margin = prepared.tables > 0 ? 0 : 720;

  log(reqId, '📝 Génération du DOCX... (' + prepared.tables + ' mise(s) en page en colonnes)');
  const out = await HTMLtoDOCX(wordHtml, null, {
    orientation: 'portrait',
    pageSize: { width: 11906, height: 16838 }, // A4 en twips
    margins: { top: margin, right: margin, bottom: margin, left: margin, header: 0, footer: 0, gutter: 0 },
    title,
    creator: 'TakiDoc',
    font: 'Calibri',
    fontSize: 22, // demi-points : 11 pt
    table: { row: { cantSplit: true } }
  }, null);

  // Selon la version, la bibliothèque renvoie un Buffer, un ArrayBuffer ou un Blob
  let docx;
  if (Buffer.isBuffer(out)) docx = out;
  else if (out && typeof out.arrayBuffer === 'function') docx = Buffer.from(await out.arrayBuffer());
  else docx = Buffer.from(out);

  if (docx.subarray(0, 2).toString('latin1') !== 'PK') {
    throw new Error("Le fichier généré n'est pas un DOCX valide");
  }
  return docx;
}

/* ============================================================
   APPLICATION EXPRESS
============================================================ */
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Identifiant de requête (pratique pour retrouver une erreur dans les logs)
app.use((req, res, next) => {
  req.id = crypto.randomUUID().slice(0, 8);
  res.set('X-Request-Id', req.id);
  next();
});

app.use(cors({
  origin(origin, callback) {
    // Pas d'origine = curl, PowerShell, serveur à serveur : autorisé
    if (!origin || CONFIG.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition', 'X-Request-Id'],
  credentials: false,
  maxAge: 86400
}));

app.use(express.json({ limit: '10mb' }));

/* ------------------------------------------------------------
   GET / et GET /health
------------------------------------------------------------ */
app.get('/', (req, res) => {
  res.json({ service: 'takidoc-generator', version: '3.0.0', status: 'ok' });
});

app.get('/health', async (req, res) => {
  let browserConnected = false;
  if (browserPromise) {
    try { browserConnected = (await browserPromise).connected; } catch (_) { /* ignoré */ }
  }

  res.json({
    status: 'ok',
    service: 'takidoc-generator',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    puppeteer: !!puppeteer,
    docx: isDocxAvailable(),
    browser: browserConnected ? 'connected' : 'idle',
    renders: {
      active: renderSlots.active,
      queued: renderSlots.queue.length,
      max: CONFIG.maxConcurrentRenders
    },
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
  });
});

/* ------------------------------------------------------------
   POST /api/generate
------------------------------------------------------------ */
function parseGenerateRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Corps de requête invalide' };
  }

  const { nonce, template_id: templateId, format } = body;

  if (!nonce || !templateId || !format) {
    return { error: 'nonce, template_id et format requis' };
  }
  if (typeof nonce !== 'string' || !ID_RE.test(nonce)) {
    return { error: 'nonce invalide' };
  }
  if (typeof templateId !== 'string' || !ID_RE.test(templateId)) {
    return { error: 'template_id invalide' };
  }

  const fmt = String(format).toLowerCase();
  if (!['pdf', 'docx'].includes(fmt)) {
    return { error: 'Format non supporté. Utilisez pdf ou docx.' };
  }

  const data = (body.data && typeof body.data === 'object' && !Array.isArray(body.data))
    ? body.data
    : {};

  return { nonce, templateId, format: fmt, data };
}

app.post(
  '/api/generate',
  rateLimit({ windowMs: CONFIG.rateLimitWindowMs, max: CONFIG.rateLimitMax }),
  async (req, res) => {
    const reqId = req.id;
    let consumedNonce = null;

    try {
      if (!CONFIG.supabaseKey) {
        log(reqId, '❌ SUPABASE_SERVICE_ROLE_KEY manquante');
        return res.status(500).json({ error: 'Service mal configuré', requestId: reqId });
      }

      // 1. Validation des paramètres (avant de consommer le nonce)
      const parsed = parseGenerateRequest(req.body);
      if (parsed.error) {
        return res.status(400).json({ error: parsed.error });
      }
      const { nonce, templateId, format, data } = parsed;

      log(reqId, '📥 Requête de génération :', {
        nonce: nonce.slice(0, 8) + '...',
        template_id: templateId,
        format,
        hasData: Object.keys(data).length > 0
      });

      // Word : on vérifie que le module est installé AVANT de brûler le nonce
      if (format === 'docx' && !isDocxAvailable()) {
        return res.status(501).json({
          error: "Le module Word n'est pas installé sur le serveur (npm install docx).",
          format
        });
      }

      // 2. Validation et consommation du nonce
      log(reqId, '🔐 Validation du nonce...');
      const { data: isValid, error: nonceError } = await supabase.rpc(
        'validate_and_consume_nonce',
        { p_nonce: nonce, p_template_id: templateId, p_format: format }
      );

      if (nonceError) {
        log(reqId, '❌ Erreur validation nonce :', nonceError.message || nonceError);
        return res.status(500).json({ error: 'Erreur de validation du nonce', requestId: reqId });
      }
      if (!isValid) {
        log(reqId, '⚠️  Nonce invalide, expiré ou déjà utilisé');
        return res.status(403).json({ error: 'Jeton invalide, expiré ou déjà utilisé' });
      }
      log(reqId, '✅ Nonce validé et consommé');
      consumedNonce = nonce;

      // 3. Récupération du modèle de confiance
      log(reqId, '📄 Récupération du modèle :', templateId);
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('id, name, html_structure, css_styles, template_fields(*)')
        .eq('id', templateId)
        .eq('is_active', true)
        .maybeSingle();

      if (templateError || !template) {
        log(reqId, '❌ Template introuvable :', templateError?.message || 'aucun résultat');
        await releaseNonce(reqId, consumedNonce);
        return res.status(404).json({ error: 'Template introuvable ou inactif' });
      }
      log(reqId, '✅ Modèle récupéré :', template.name);

      // 4. Injection des données
      const snapshot = (data.snapshot && typeof data.snapshot === 'object' && !Array.isArray(data.snapshot))
        ? data.snapshot
        : null;

      let html = snapshot
        ? buildSnapshotDocument(template, snapshot, { allowedHosts: ALLOWED_ASSET_HOSTS })
        : buildDocumentHtml(template, data);
      if (snapshot) html = applySnapshotOverrides(html, data);

      // Diagnostic couleur : le modèle utilise-t-il la variable CSS de couleur principale ?
      if (snapshot && typeof data.primary_color === 'string') {
        const css = String(template.css_styles || '') + String(template.html_structure || '');
        const usesVar = (css.match(/var\(\s*--(?:doc-)?primary-color/gi) || []).length;
        log(reqId, '🎨 Couleur ' + data.primary_color + ' — le modèle utilise la variable CSS ' + usesVar + ' fois'
          + (usesVar === 0 ? ' (⚠️ couleurs écrites en dur : la couleur choisie ne peut pas s\'appliquer)' : ''));
      }

      log(reqId, snapshot
        ? '🎨 Instantané du document nettoyé et appliqué au modèle'
        : '🎨 Données injectées dans le HTML');

      // 5. Génération du fichier
      let fileBuffer;
      let contentType;
      let extension;

      if (format === 'pdf') {
        fileBuffer = await renderPdf(html, reqId);
        contentType = 'application/pdf';
        extension = 'pdf';
      } else {
        fileBuffer = await renderDocx(html, template.name, reqId);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        extension = 'docx';
      }
      log(reqId, '✅ ' + extension.toUpperCase() + ' généré :', fileBuffer.length, 'octets');

      // 6. Envoi binaire
      const fileName = `TakiDoc_${safeFileName(template.name)}.${extension}`;
      res.status(200);
      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length,
        'Cache-Control': 'no-store'
      });
      return res.end(fileBuffer);

    } catch (error) {
      // Toute erreur après la consommation du nonce : l'utilisateur ne perd rien
      await releaseNonce(reqId, consumedNonce);

      if (error instanceof SnapshotError) {
        return res.status(400).json({ error: error.message, requestId: reqId });
      }

      if (error && error.message === 'DOCX_UNAVAILABLE') {
        return res.status(501).json({
          error: "Le module Word n'est pas installé sur le serveur (npm install docx).",
          requestId: reqId
        });
      }

      if (error && error.message === 'QUEUE_TIMEOUT') {
        log(reqId, '⏳ File d\'attente saturée');
        res.set('Retry-After', '5');
        return res.status(503).json({
          error: 'Le générateur est très sollicité. Réessayez dans quelques secondes.',
          requestId: reqId
        });
      }

      console.error(`[${reqId}] 💥 Erreur génération :`, error);
      return res.status(500).json({
        error: IS_PROD
          ? 'Erreur interne du générateur'
          : 'Erreur interne du générateur : ' + (error && error.message),
        requestId: reqId
      });
    }
  }
);

/* ------------------------------------------------------------
   Routes inconnues
------------------------------------------------------------ */
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

/* ------------------------------------------------------------
   Gestion des erreurs globales
------------------------------------------------------------ */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Données trop volumineuses (10 Mo maximum)' });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalide dans le corps de la requête' });
  }
  console.error(`[${req.id || 'srv'}] [Erreur serveur]`, err && err.message);
  res.status(500).json({ error: 'Erreur interne du serveur', requestId: req.id });
});

/* ============================================================
   DÉMARRAGE ET ARRÊT PROPRE
============================================================ */
const server = app.listen(CONFIG.port, () => {
  console.log(`🚀 TakiDoc Generator v3.0 démarré sur le port ${CONFIG.port}`);
  console.log(`   Health check   : http://localhost:${CONFIG.port}/health`);
  console.log(`   Génération PDF : POST http://localhost:${CONFIG.port}/api/generate`);
  console.log(`   NODE_ENV       : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Rendus max     : ${CONFIG.maxConcurrentRenders} simultanés`);
  console.log(`   Origines CORS  : ${CONFIG.allowedOrigins.join(', ')}`);

  // Préchauffage : le premier PDF sera instantané
  if (process.env.PREWARM_BROWSER !== 'false') {
    getBrowser().catch(err => {
      console.warn('⚠️  Préchauffage de Chromium impossible :', err.message);
    });
  }
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} reçu : arrêt en cours...`);

  const force = setTimeout(() => process.exit(1), 10000);
  force.unref();

  server.close(async () => {
    await closeBrowser();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', reason => {
  console.error('⚠️  Promesse rejetée non gérée :', reason);
});
process.on('uncaughtException', err => {
  console.error('💥 Exception non interceptée :', err);
});
