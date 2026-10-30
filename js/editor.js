/* ============================================================
   TAKIDOC — MOTEUR D'ÉDITION PROFESSIONNEL (v7.0)
   Supabase • CSS isolé • A4 multi-pages • PDF / Word • Brouillons
   Paiement Mobile Money • Génération par le serveur Render
============================================================ */

import "../components/taki/taki.js";
import { initProtection } from './editor-protection.js';
import './editor-underline-fix.js';
import { initPagination, refreshPages } from './editor-pagination.js';
import { supabase } from './supabase-config.js';

// =========================================
// TAKI — INITIALISATION DANS L'ÉDITEUR
// =========================================

let takiMascot = null;

async function initTakiMascot() {
  const container = document.getElementById("taki-container");

  if (!container || !window.TakiMascot) {
    console.warn("Taki : assistant indisponible.");
    return;
  }

  try {
    takiMascot = await window.TakiMascot.mount(container, {
      initialState: "idle"
    });
  } catch (error) {
    console.warn("Taki : impossible de charger l'assistant.", error);
  }
}

initTakiMascot();

/* ------------------------------------------------------------
   1. CONFIGURATION
------------------------------------------------------------ */
const CONFIG = Object.freeze({
  generatorUrl: 'https://takidoc-generator.onrender.com',
  functionsUrl: 'https://wyfkogowsdbxctbpfuud.supabase.co/functions/v1',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM',
  currency: 'XAF',
  countryDialCode: '+242',
  phoneDigits: 9,
  generateTimeoutMs: 120000,   // Render (offre gratuite) peut mettre ~50 s à se réveiller
  generateRetries: 1,
  pollIntervalMs: 2000,
  pollMaxAttempts: 180,        // 6 minutes
  pendingMaxAgeMs: 6 * 60 * 60 * 1000,
  autoSaveDelayMs: 900,
  zoomMin: 0.3,
  zoomMax: 2.5,
  zoomStep: 0.1,
  maxPhotoBytes: 5 * 1024 * 1024
});

const FORMATS = Object.freeze({
  pdf: { label: 'PDF', desc: 'Format universel, prêt à imprimer', icon: 'fa-file-pdf', ext: 'pdf' },
  docx: { label: 'Word', desc: 'Modifiable dans Word', icon: 'fa-file-word', ext: 'docx' }
});

const PROTECT_BRAND = true;
const BRAND_TEXTS = [
  'Document personnalisable généré par TakiDoc',
  'www.takidoc.onrender.com'
];

const DEFAULT_FONT = "'Inter', sans-serif";
const DEFAULT_COLOR = '#0F172A';

const DOWNLOAD_BUTTONS = '#btn-download-pdf, #btn-download-docx, #header-download-btn, #mobileBtnDownload, #btn-download';

/* ------------------------------------------------------------
   2. ÉTAT
------------------------------------------------------------ */
const state = {
  template: null,
  user: null,
  zoom: 1,
  primaryColor: DEFAULT_COLOR,
  colorActive: false,
  fontFamily: DEFAULT_FONT,
  fontCustom: false,
  photoDataUrl: null,
  draftKey: null,
  isDirty: false,
  autoSaveTimer: null,
  refreshTimer: null,
  initialized: false,
  originalCss: '',
  downloading: false,
  watching: new Set()
};

/* ------------------------------------------------------------
   3. OUTILS
------------------------------------------------------------ */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const getCanvas = () => $('#document-canvas');
const getTemplateFieldElement = name => document.getElementById(`field-${name}`);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Création DOM sûre : tout le texte passe par textContent (aucun risque d'injection). */
function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  node.append(...children.flat().filter(child => child !== null && child !== undefined && child !== false));
  return node;
}

const icon = classes => h('i', { class: `fas ${classes}`, 'aria-hidden': 'true' });

function toast(message, type = 'success') {
  const el = $('#editorToast');
  if (!el) { console.log(`[TakiDoc] ${message}`); return; }
  const icons = { success: 'fa-check-circle', error: 'fa-circle-exclamation', info: 'fa-info-circle' };
  el.className = `editor-toast ${type} show`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  el.replaceChildren(icon(icons[type] || icons.info), document.createTextNode(` ${message}`));
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), type === 'error' ? 6500 : 3500);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '';
}

function setDocStatus(text, className = 'doc-status') {
  const status = $('#header-doc-status');
  if (status) { status.className = className; status.textContent = text; }
}

function formatPrice(value) {
  return `${new Intl.NumberFormat('fr-FR').format(Number(value) || 0)} ${CONFIG.currency}`;
}

function safeFileBase(name) {
  return String(name || 'document')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'document';
}

function isFreeTemplate() {
  const price = state.template?.price;
  return price !== null && price !== undefined && price !== '' && Number(price) === 0;
}

function isBrandNode(el) {
  if (!PROTECT_BRAND || !el || el.nodeType !== 1) return false;
  if (el.matches('[data-takidoc-brand], .takidoc-brand, #takidoc-brand')) return true;
  const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join(' ').replace(/\s+/g, ' ');
  return BRAND_TEXTS.some(b => own.includes(b));
}

function isBrandElement(el) {
  if (!el || !PROTECT_BRAND) return false;
  const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
  return BRAND_TEXTS.some(b => text.includes(b)) || el.matches('[data-takidoc-brand], .takidoc-brand, #takidoc-brand');
}

function scheduleRefreshPages() {
  clearTimeout(state.refreshTimer);
  state.refreshTimer = setTimeout(() => refreshPages(), 120);
}

function markDirty() {
  state.isDirty = true;
  setDocStatus('Modifications en cours…', 'doc-status saving');
  scheduleRefreshPages();
  clearTimeout(state.autoSaveTimer);
  state.autoSaveTimer = setTimeout(() => saveDraft({ quiet: true }), CONFIG.autoSaveDelayMs);
}

/* ------------------------------------------------------------
   4. AUTHENTIFICATION ET CHARGEMENT DU MODÈLE
------------------------------------------------------------ */
async function getAccessToken() {
  if (!supabase) return CONFIG.anonKey;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || CONFIG.anonKey;
  } catch (error) {
    console.warn('Session indisponible, utilisation de la clé publique :', error);
    return CONFIG.anonKey;
  }
}

async function checkAuth() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    state.user = data.session?.user ?? null;
  } catch (error) {
    console.warn('Session utilisateur indisponible :', error);
    state.user = null;
  }
}

async function loadTemplate(id) {
  if (!id) throw new Error("Identifiant de document manquant dans l'URL.");
  if (!supabase) throw new Error("Supabase ne s'est pas chargé.");

  const { data, error } = await supabase
    .from('templates')
    .select(`id, name, description, price_xaf, category_id, has_photo, has_color_picker, html_structure, css_styles,
             template_fields (field_name, field_label, field_type, default_value, is_required, display_order)`)
    .eq('id', id).eq('is_active', true).single();

  if (error) throw new Error(`Impossible de charger le modèle : ${error.message}`);
  if (!data) throw new Error('Ce modèle est introuvable ou inactif.');

  state.template = {
    id: data.id,
    name: data.name,
    description: data.description,
    price: data.price_xaf,
    category: data.category_id,
    hasPhoto: Boolean(data.has_photo),
    hasColorPicker: Boolean(data.has_color_picker),
    html: data.html_structure || '',
    css: data.css_styles || '',
    fields: (data.template_fields || [])
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(f => ({
        name: f.field_name,
        label: f.field_label,
        type: f.field_type,
        defaultValue: f.default_value ?? '',
        required: Boolean(f.is_required)
      }))
  };
  state.originalCss = state.template.css;
  state.draftKey = `takidoc_draft_${data.id}`;
  return state.template;
}

/* ------------------------------------------------------------
   5. CSS ISOLÉ (le style du modèle ne déborde jamais sur l'éditeur)
------------------------------------------------------------ */
function splitSelectors(selectorText) {
  const result = [];
  let current = ''; let depth = 0; let quote = '';
  for (const char of selectorText) {
    if (quote) { current += char; if (char === quote) quote = ''; continue; }
    if (char === '"' || char === "'") { quote = char; current += char; continue; }
    if (char === '(' || char === '[') depth++;
    if (char === ')' || char === ']') depth--;
    if (char === ',' && depth === 0) { if (current.trim()) result.push(current.trim()); current = ''; }
    else current += char;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function scopeSelector(selector) {
  const root = '#document-canvas';
  selector = selector.trim();
  if (/^(html|body|:root)(?=$|[\s.#:[>+~])/i.test(selector)) {
    selector = selector.replace(/^(html|body|:root)\b/i, root).replace(/#document-canvas\s+#document-canvas/g, root);
  }
  if (selector === '*') return `${root} *`;
  if (selector.startsWith(root)) return selector;
  return `${root} ${selector}`;
}

function scopeCSS(css) {
  css = String(css || '').replace(/^\uFEFF/, '').replace(/<\/?style\b[^>]*>/gi, '').replace(/@import\b[^;]*;?/gi, '');
  let output = ''; let i = 0;
  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) output += css[i++];
    if (i >= css.length) break;
    const open = css.indexOf('{', i);
    const semicolon = css.indexOf(';', i);
    if (open === -1 || (semicolon !== -1 && semicolon < open)) {
      output += css.slice(i, semicolon === -1 ? css.length : semicolon + 1);
      i = semicolon === -1 ? css.length : semicolon + 1;
      continue;
    }
    const header = css.slice(i, open).trim();
    let depth = 1; let j = open + 1; let quote = ''; let comment = false;
    for (; j < css.length && depth > 0; j++) {
      const char = css[j]; const next = css[j + 1];
      if (comment) { if (char === '*' && next === '/') { comment = false; j++; } continue; }
      if (!quote && char === '/' && next === '*') { comment = true; j++; continue; }
      if (quote) { if (char === '\\') j++; else if (char === quote) quote = ''; continue; }
      if (char === '"' || char === "'") { quote = char; continue; }
      if (char === '{') depth++;
      if (char === '}') depth--;
    }
    const body = css.slice(open + 1, j - 1);
    if (header.startsWith('@')) {
      output += /^@(media|supports|container|layer|document)\b/i.test(header)
        ? `${header}{${scopeCSS(body)}}`
        : `${header}{${body}}`;
    } else {
      output += `${splitSelectors(header).map(scopeSelector).join(', ')}{${body}}`;
    }
    i = j;
  }
  return output;
}

const loadedFontLinks = new Set();
function loadTemplateFonts(css) {
  const re = /@import\s+(?:url\(\s*)?['"]?(https:\/\/fonts\.googleapis\.com\/[^'")\s;]+)/gi;
  let match;
  while ((match = re.exec(String(css || '')))) {
    const href = match[1].replace(/&amp;/g, '&');
    if (loadedFontLinks.has(href)) continue;
    loadedFontLinks.add(href);
    document.head.appendChild(h('link', { rel: 'stylesheet', href }));
  }
}

function scopeInlineStyles(canvas) {
  $$('style', canvas).forEach(style => { style.textContent = scopeCSS(style.textContent); });
}

function getOrCreateStyle(id) {
  let style = document.getElementById(id);
  if (!style) { style = document.createElement('style'); style.id = id; document.head.appendChild(style); }
  return style;
}

function installTemplateCSS() {
  if (!state.template) return;
  getOrCreateStyle('template-dynamic-css').textContent = scopeCSS(state.template.css);
  loadTemplateFonts(state.template.css);
}

/* ------------------------------------------------------------
   6. COULEUR PRINCIPALE ET POLICE
------------------------------------------------------------ */
function toHex(value) {
  const v = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
  const short = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toUpperCase();
  return '';
}

function initTemplateColor() {
  const canvas = getCanvas();
  const css = state.template?.css || '';
  if (!canvas) return;
  const computed = getComputedStyle(canvas);
  let found = '';
  for (const name of ['--doc-primary-color', '--primary-color']) {
    found = toHex(computed.getPropertyValue(name));
    if (found) break;
  }
  if (!found) {
    const fallback = css.match(/var\(\s*--(?:doc-)?primary-color\s*,\s*(#[0-9a-f]{3,8})/i);
    if (fallback) found = toHex(fallback[1]);
  }
  if (found) { state.primaryColor = found; state.colorActive = false; }
  else state.colorActive = /var\(\s*--(?:doc-)?primary-color/.test(css);
  syncColorUI();
}

function syncColorUI() {
  const picker = $('#color-picker');
  const hex = $('#color-hex');
  if (picker) picker.value = state.primaryColor;
  if (hex) hex.textContent = state.primaryColor;
  $$('.color-preset').forEach(button => {
    button.classList.toggle('active', (button.dataset.color || '').toUpperCase() === state.primaryColor);
  });
}

function installColorOverrides() {
  const canvas = getCanvas();
  const style = getOrCreateStyle('takidoc-color-overrides');
  if (!state.colorActive) {
    style.textContent = '';
    canvas?.style.removeProperty('--doc-primary-color');
    canvas?.style.removeProperty('--primary-color');
    return;
  }
  const c = state.primaryColor;
  canvas?.style.setProperty('--doc-primary-color', c);
  canvas?.style.setProperty('--primary-color', c);
  style.textContent = `
    #document-canvas { --doc-primary-color: ${c}; --primary-color: ${c}; }
    #document-canvas .primary, #document-canvas .accent, #document-canvas .accent-color, #document-canvas .section-title, #document-canvas .title-accent, #document-canvas h1, #document-canvas h2 { border-color: ${c}; }
    #document-canvas .text-primary, #document-canvas .primary-color, #document-canvas .accent-text { color: ${c}; }
    #document-canvas .bg-primary, #document-canvas .primary-bg, #document-canvas .accent-bg { background-color: ${c}; }
  `;
}

function applyPrimaryColor(color, options = {}) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return;
  state.primaryColor = color.toUpperCase();
  state.colorActive = true;
  syncColorUI();
  installColorOverrides();
  if (!options.silent) markDirty();
}

function applyFontFamily() {
  const canvas = getCanvas();
  if (!canvas) return;
  const style = getOrCreateStyle('takidoc-font-overrides');
  if (!state.fontCustom) { canvas.style.removeProperty('font-family'); style.textContent = ''; return; }
  canvas.style.fontFamily = state.fontFamily;
  style.textContent = `#document-canvas, #document-canvas *:not(svg):not(path):not(.fa):not(.fas):not(.far):not(.fab):not([class*="fa-"]) { font-family: ${state.fontFamily} !important; }`;
}

function setupDesignControls() {
  $('#color-picker')?.addEventListener('input', event => applyPrimaryColor(event.target.value));
  $$('.color-preset').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      if (button.dataset.color) applyPrimaryColor(button.dataset.color);
    });
  });
  $('#font-family-select')?.addEventListener('change', event => {
    state.fontFamily = event.target.value || DEFAULT_FONT;
    state.fontCustom = true;
    applyFontFamily();
    markDirty();
  });
  $('#btn-reset-design')?.addEventListener('click', event => {
    event.preventDefault();
    state.colorActive = false; state.fontCustom = false; state.fontFamily = DEFAULT_FONT;
    initTemplateColor(); installColorOverrides(); applyFontFamily();
    const select = $('#font-family-select');
    if (select) select.value = DEFAULT_FONT;
    markDirty();
    toast('Design du modèle rétabli.', 'info');
  });
}

/* ------------------------------------------------------------
   7. AFFICHAGE DU DOCUMENT ET CHAMPS
------------------------------------------------------------ */
function renderDocument() {
  const canvas = getCanvas();
  if (!canvas || !state.template) throw new Error("La zone d'aperçu du document est introuvable.");
  canvas.innerHTML = state.template.html || '<div style="padding:40px;text-align:center">Aperçu du document indisponible.</div>';
  scopeInlineStyles(canvas);
  installTemplateCSS();
  initTemplateColor();
  installColorOverrides();
  state.template.fields.forEach(field => {
    const el = getTemplateFieldElement(field.name);
    if (el && field.defaultValue !== '' && !el.textContent.trim()) el.textContent = field.defaultValue;
  });
  const photoSection = $('#design-photo-section');
  const colorSection = $('#design-color-section');
  if (photoSection) photoSection.style.display = state.template.hasPhoto ? '' : 'none';
  if (colorSection) colorSection.style.display = state.template.hasColorPicker ? '' : 'none';
  if (!state.template.hasPhoto) state.photoDataUrl = null;
  if (state.photoDataUrl) updateDocumentPhoto(state.photoDataUrl);
  applySavedFieldValues();
  enableFieldEditing();
  applyFontFamily();
}

function getFieldValue(name) {
  const input = document.getElementById(`input-${name}`);
  const element = getTemplateFieldElement(name);
  return input ? input.value : (element?.textContent ?? '');
}

function setFieldValue(name, value) {
  const input = document.getElementById(`input-${name}`);
  const element = getTemplateFieldElement(name);
  if (input) input.value = value ?? '';
  if (element) element.textContent = value ?? '';
}

function applySavedFieldValues() {
  state.template?.fields.forEach(field => {
    const input = document.getElementById(`input-${field.name}`);
    const element = getTemplateFieldElement(field.name);
    if (input && element && input.value !== '') element.textContent = input.value;
  });
}

function buildFieldsForm() {
  const container = $('#fields-form');
  if (!container || !state.template) return;
  container.replaceChildren();
  if (!state.template.fields.length) {
    container.appendChild(h('p', {
      text: 'Ce document ne contient aucun champ personnalisable. Vous pouvez modifier directement les textes dans l’aperçu.'
    }));
    return;
  }
  const allowedTypes = ['text', 'email', 'tel', 'url', 'date', 'number'];
  state.template.fields.forEach(field => {
    const inputId = `input-${field.name}`;
    const common = {
      id: inputId,
      name: field.name,
      class: 'form-control',
      value: field.defaultValue,
      placeholder: `Entrez ${String(field.label || '').toLowerCase()}`,
      required: field.required
    };
    const input = field.type === 'textarea'
      ? h('textarea', { ...common, rows: 3 })
      : h('input', { ...common, type: allowedTypes.includes(field.type) ? field.type : 'text' });
    input.addEventListener('input', () => {
      const target = getTemplateFieldElement(field.name);
      if (target && !isBrandElement(target)) target.textContent = input.value;
      markDirty();
    });
    container.appendChild(h('div', { class: 'form-group' },
      h('label', { htmlFor: inputId, text: `${field.label}${field.required ? ' *' : ''}` }),
      input
    ));
  });
}

/* ------------------------------------------------------------
   8. ÉDITION DIRECTE DANS L'APERÇU
------------------------------------------------------------ */
const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'template', 'head', 'title', 'meta', 'link', 'svg', 'canvas', 'iframe', 'video', 'audio', 'object', 'embed', 'img', 'br', 'hr', 'button', 'input', 'textarea', 'select', 'option']);
const MEDIA_TAGS = new Set(['img', 'svg', 'canvas', 'video', 'iframe', 'input', 'button', 'select', 'textarea']);

function isBlockLevel(el) {
  const display = getComputedStyle(el).display;
  return !(display === 'none' || display === 'contents' || display.startsWith('inline'));
}

function collectEditableHosts(canvas) {
  const hosts = [];
  const visit = el => {
    if (SKIP_TAGS.has(el.localName) || isBrandNode(el)) return;
    const nodes = [...el.childNodes];
    const texts = nodes.filter(n => n.nodeType === 3 && n.nodeValue.trim() !== '');
    const kids = nodes.filter(n => n.nodeType === 1 && n.localName !== 'br');
    if (texts.length) {
      if (!kids.some(isBlockLevel)) { hosts.push(el); return; }
      texts.forEach(textNode => {
        const span = h('span', { class: 'takidoc-text' });
        textNode.before(span);
        span.appendChild(textNode);
        hosts.push(span);
      });
    }
    kids.forEach(visit);
  };
  [...canvas.children].forEach(visit);
  (state.template?.fields || []).forEach(field => {
    const el = getTemplateFieldElement(field.name);
    if (!el || SKIP_TAGS.has(el.localName) || isBrandNode(el)) return;
    if (hosts.some(host => host === el || host.contains(el) || el.contains(host))) return;
    if (!el.children.length) hosts.push(el);
  });
  return hosts;
}

function lockInside(host) {
  $$('*', host).forEach(node => {
    const isIcon = node.localName === 'i' && !node.textContent.trim();
    if (MEDIA_TAGS.has(node.localName) || isIcon || isBrandNode(node)) node.contentEditable = 'false';
  });
}

function fieldForElement(el) {
  return (state.template?.fields || []).find(field => getTemplateFieldElement(field.name) === el);
}

function syncFieldInputsFrom(host) {
  (state.template?.fields || []).forEach(field => {
    const el = getTemplateFieldElement(field.name);
    const input = document.getElementById(`input-${field.name}`);
    if (el && input && (el === host || host.contains(el))) input.value = el.textContent;
  });
}

function bindEditingEvents(canvas) {
  if (canvas.dataset.editBound) return;
  canvas.dataset.editBound = '1';
  const hostOf = event => event.target?.closest?.('.direct-editable') || null;
  canvas.addEventListener('input', event => {
    const host = hostOf(event);
    if (!host) return;
    if (host.innerHTML.toLowerCase() === '<br>') host.innerHTML = '';
    syncFieldInputsFrom(host);
    markDirty();
  });
  canvas.addEventListener('keydown', event => {
    if (hostOf(event) && event.key === 'Enter') {
      event.preventDefault();
      document.execCommand('insertLineBreak');
    }
  });
  canvas.addEventListener('paste', event => {
    if (!hostOf(event)) return;
    event.preventDefault();
    const text = (event.clipboardData || window.clipboardData)?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  });
  canvas.addEventListener('click', event => {
    if (event.target?.closest?.('a')) event.preventDefault();
  });
}

function enableFieldEditing() {
  const canvas = getCanvas();
  if (!canvas) return;
  bindEditingEvents(canvas);
  $$('.direct-editable', canvas).forEach(el => {
    el.removeAttribute('contenteditable');
    el.classList.remove('direct-editable');
  });
  collectEditableHosts(canvas).forEach((el, index) => {
    if (!el.dataset.takidocEditId) {
      const field = fieldForElement(el);
      el.dataset.takidocEditId = field ? `field-${field.name}` : `t-${index}`;
    }
    el.contentEditable = 'true';
    el.classList.add('direct-editable');
    el.spellcheck = true;
    el.setAttribute('aria-label', 'Texte modifiable du document');
    lockInside(el);
  });
}

/* ------------------------------------------------------------
   9. PHOTO
------------------------------------------------------------ */
function updateDocumentPhoto(dataUrl) {
  if (!state.template?.hasPhoto) return;
  const canvas = getCanvas() || document;
  const container = $('#doc-photo', canvas) || $('[data-photo-placeholder], .doc-photo, .cv-photo, .photo-placeholder', canvas);
  if (!container) { console.warn('Emplacement photo introuvable.'); return; }
  container.replaceChildren();
  if (!dataUrl) {
    container.appendChild(h('span', { class: 'cv-photo-placeholder', text: 'Photo' }));
    return;
  }
  container.appendChild(h('img', {
    src: dataUrl, alt: 'Photo du document',
    style: 'width:100%;height:100%;object-fit:cover;'
  }));
}

function renderPhotoPreview(dataUrl) {
  const preview = $('#photo-preview-area');
  if (!preview) return;
  if (!dataUrl) {
    preview.classList.remove('has-image');
    preview.replaceChildren(icon('fa-user-circle'), h('span', { text: 'Aucune photo' }));
    return;
  }
  preview.replaceChildren(h('img', { src: dataUrl, alt: 'Aperçu de la photo' }));
  preview.classList.add('has-image');
}

/** Réduit les grandes photos (max 900 px, JPEG) : brouillons plus légers, envoi plus rapide. */
function downscaleImage(dataUrl, maxSide = 900, quality = 0.88) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
      if (ratio === 1 && dataUrl.length < 400000) { resolve(dataUrl); return; }
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * ratio);
      canvas.height = Math.round(image.height * ratio);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      try { resolve(canvas.toDataURL('image/jpeg', quality)); } catch (_) { resolve(dataUrl); }
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function setupPhotoUpload() {
  const input = $('#photo-input');
  const remove = $('#photo-remove');
  if (!input) return;
  input.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Choisis un fichier image valide.', 'error'); input.value = ''; return; }
    if (file.size > CONFIG.maxPhotoBytes) { toast('La photo ne doit pas dépasser 5 Mo.', 'error'); input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = async () => {
      state.photoDataUrl = await downscaleImage(String(reader.result || ''));
      renderPhotoPreview(state.photoDataUrl);
      updateDocumentPhoto(state.photoDataUrl);
      if (remove) remove.style.display = 'inline-flex';
      markDirty();
      toast('Photo ajoutée au document.', 'success');
    };
    reader.onerror = () => toast('Impossible de lire cette image.', 'error');
    reader.readAsDataURL(file);
  });
  remove?.addEventListener('click', event => {
    event.preventDefault();
    state.photoDataUrl = null;
    input.value = '';
    renderPhotoPreview(null);
    updateDocumentPhoto(null);
    remove.style.display = 'none';
    markDirty();
  });
}

/* ------------------------------------------------------------
   10. ZOOM, ONGLETS, RACCOURCIS
------------------------------------------------------------ */
function clampZoom(value) {
  return Math.min(CONFIG.zoomMax, Math.max(CONFIG.zoomMin, value));
}

function updateZoom() {
  const wrapper = $('#document-wrapper');
  if (wrapper) { wrapper.style.transform = `scale(${state.zoom})`; wrapper.style.transformOrigin = 'top center'; }
  setText('zoom-level', `${Math.round(state.zoom * 100)}%`);
  refreshPages();
}

function fitZoom() {
  const container = $('.editor-canvas-area') || $('.preview-container');
  const canvas = getCanvas();
  if (!container || !canvas) return window.innerWidth <= 768 ? 0.48 : 0.85;
  const available = Math.max(220, container.clientWidth - 80);
  return Math.max(CONFIG.zoomMin, Math.min(1.2, available / (canvas.offsetWidth || 794)));
}

function stepZoom(delta) {
  state.zoom = clampZoom(state.zoom + delta);
  updateZoom();
}

function setupZoomControls() {
  state.zoom = fitZoom();
  $('#btn-zoom-in')?.addEventListener('click', () => stepZoom(CONFIG.zoomStep));
  $('#btn-zoom-out')?.addEventListener('click', () => stepZoom(-CONFIG.zoomStep));
  $('#btn-zoom-fit')?.addEventListener('click', () => { state.zoom = fitZoom(); updateZoom(); });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (state.zoom < 0.6) { state.zoom = fitZoom(); updateZoom(); } }, 150);
  });
  updateZoom();
}

function openFieldsTab() {
  $('#editorSidebar')?.classList.add('open');
  $('.tab-btn[data-tab="fields"]')?.click();
}

function setupSidebarTabs() {
  $$('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      $$('.tab-btn').forEach(item => item.classList.toggle('active', item === button));
      $$('.tab-pane').forEach(item => item.classList.toggle('active', item.id === `tab-${button.dataset.tab}`));
    });
  });
  $('#mobileSidebarToggle')?.addEventListener('click', () => $('#editorSidebar')?.classList.toggle('open'));
  $('#mobileBtnCustomize')?.addEventListener('click', openFieldsTab);
  $('#btn-customize')?.addEventListener('click', () => {
    openFieldsTab();
    $('#fields-form input, #fields-form textarea')?.focus();
  });
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', event => {
    const mod = event.ctrlKey || event.metaKey;
    if (!mod) return;
    const key = event.key.toLowerCase();
    if (key === 's') { event.preventDefault(); saveDraft(); }
    else if (key === '+' || key === '=') { event.preventDefault(); stepZoom(CONFIG.zoomStep); }
    else if (key === '-') { event.preventDefault(); stepZoom(-CONFIG.zoomStep); }
    else if (key === '0') { event.preventDefault(); state.zoom = fitZoom(); updateZoom(); }
  });
  window.addEventListener('beforeunload', event => {
    if (!state.isDirty) return;
    // On tente une sauvegarde silencieuse : si elle réussit, aucune alerte n'est nécessaire.
    if (!saveDraft({ quiet: true })) { event.preventDefault(); event.returnValue = ''; }
  });
}

/* ------------------------------------------------------------
   11. BROUILLONS (localStorage)
------------------------------------------------------------ */
function sanitizeHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html || '');
  tpl.content.querySelectorAll('script,style,iframe,object,embed,link,meta,base,form').forEach(node => node.remove());
  tpl.content.querySelectorAll('*').forEach(node => {
    [...node.attributes].forEach(attr => {
      const value = attr.value.trim().toLowerCase();
      const dangerousUrl = ['href', 'src', 'xlink:href', 'action', 'formaction'].includes(attr.name)
        && (value.startsWith('javascript:') || value.startsWith('data:text/html'));
      if (attr.name.startsWith('on') || dangerousUrl) node.removeAttribute(attr.name);
    });
  });
  return tpl.innerHTML;
}

function collectDraft() {
  const fields = {};
  state.template?.fields.forEach(field => { fields[field.name] = getFieldValue(field.name); });
  const directTexts = {};
  const canvas = getCanvas();
  if (canvas) {
    $$('.direct-editable', canvas).forEach(el => {
      const id = el.dataset.takidocEditId;
      if (!id || isBrandElement(el)) return;
      directTexts[id] = el.children.length ? { h: el.innerHTML } : { t: el.textContent };
    });
  }
  return {
    version: 3,
    timestamp: Date.now(),
    fields,
    directTexts,
    photoDataUrl: state.photoDataUrl,
    primaryColor: state.colorActive ? state.primaryColor : null,
    fontFamily: state.fontCustom ? state.fontFamily : null
  };
}

function saveDraft(options = {}) {
  if (!state.draftKey) return false;
  try {
    localStorage.setItem(state.draftKey, JSON.stringify(collectDraft()));
    state.isDirty = false;
    setDocStatus('Modifications sauvegardées');
    if (!options.quiet) toast('Brouillon sauvegardé sur cet appareil.', 'success');
    return true;
  } catch (error) {
    console.error('Sauvegarde du brouillon impossible :', error);
    if (!options.quiet) toast('Stockage local plein. Essaie une photo plus légère.', 'error');
    return false;
  }
}

function loadDraft() {
  if (!state.draftKey) return false;
  try {
    const raw = localStorage.getItem(state.draftKey);
    if (!raw) return false;
    const draft = JSON.parse(raw);
    const version = Number(draft.version) || 1;
    Object.entries(draft.fields || {}).forEach(([name, value]) => setFieldValue(name, value));
    const canvas = getCanvas();
    if (canvas && draft.directTexts) {
      Object.entries(draft.directTexts).forEach(([id, value]) => {
        const el = canvas.querySelector(`[data-takidoc-edit-id="${CSS.escape(id)}"]`);
        if (!el || isBrandElement(el)) return;
        if (typeof value === 'string') el.textContent = value;
        else if (value?.h !== undefined) el.innerHTML = sanitizeHTML(value.h);
        else if (value?.t !== undefined) el.textContent = value.t;
      });
    }
    if (draft.primaryColor && (version >= 3 || draft.primaryColor.toUpperCase() !== DEFAULT_COLOR)) {
      applyPrimaryColor(draft.primaryColor, { silent: true });
    }
    if (draft.fontFamily && (version >= 3 || draft.fontFamily !== DEFAULT_FONT)) {
      state.fontFamily = draft.fontFamily;
      state.fontCustom = true;
      const select = $('#font-family-select');
      if (select) select.value = state.fontFamily;
      applyFontFamily();
    }
    if (draft.photoDataUrl && state.template?.hasPhoto) {
      state.photoDataUrl = draft.photoDataUrl;
      renderPhotoPreview(state.photoDataUrl);
      updateDocumentPhoto(state.photoDataUrl);
      const remove = $('#photo-remove');
      if (remove) remove.style.display = 'inline-flex';
    }
    state.isDirty = false;
    setDocStatus('Brouillon restauré');
    return true;
  } catch (error) {
    console.error('Erreur restauration brouillon :', error);
    toast('Impossible de restaurer ce brouillon.', 'error');
    return false;
  }
}

/* ------------------------------------------------------------
   12. FENÊTRES MODALES (format, paiement)
------------------------------------------------------------ */
const MODAL_CSS = `
.td-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.72);backdrop-filter:blur(5px);animation:td-fade .18s ease}
.td-overlay.td-out{opacity:0;transition:opacity .18s ease}
.td-dialog{background:#fff;border-radius:20px;box-shadow:0 25px 50px rgba(0,0,0,.4);width:100%;max-width:480px;max-height:92vh;overflow-y:auto;animation:td-up .25s ease;font-family:inherit;color:#0F172A}
.td-head{background:linear-gradient(135deg,#FF6B35 0%,#F7931E 100%);color:#fff;padding:26px 24px;text-align:center;border-radius:20px 20px 0 0}
.td-head h3{margin:0 0 6px;font-size:22px;font-weight:700}
.td-head .td-amount{font-size:34px;font-weight:800;margin:10px 0 4px}
.td-head .td-tname{font-size:14px;opacity:.92}
.td-body{padding:24px}
.td-section{margin-bottom:22px}
.td-label{display:block;font-size:12px;font-weight:700;color:#64748B;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px}
.td-input{width:100%;padding:14px 16px;border:2px solid #E2E8F0;border-radius:12px;font-size:16px;font-weight:500;outline:none;transition:border-color .2s;box-sizing:border-box;font-family:inherit;background:#fff;color:#0F172A}
.td-input:focus{border-color:#FF6B35}
.td-phone{display:flex;align-items:center;gap:8px}
.td-phone .td-prefix{padding:14px 12px;border:2px solid #E2E8F0;border-radius:12px;background:#F8FAFC;font-weight:600;color:#475569}
.td-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.td-card{border:2px solid #E2E8F0;border-radius:12px;padding:16px 12px;text-align:center;cursor:pointer;transition:all .2s;background:#fff;font-family:inherit;color:inherit}
.td-card:hover:not(:disabled){border-color:#FF6B35;transform:translateY(-2px)}
.td-card:focus-visible{outline:3px solid rgba(255,107,53,.45);outline-offset:2px}
.td-card.td-selected{border-color:#FF6B35;background:#FFF5F0;box-shadow:0 4px 12px rgba(255,107,53,.2)}
.td-card:disabled{opacity:.6;cursor:not-allowed}
.td-card .td-ico{font-size:28px;display:block;margin-bottom:8px}
.td-card.td-pdf .td-ico{color:#DC2626}
.td-card.td-docx .td-ico{color:#2563EB}
.td-card .td-name{font-weight:700;font-size:14px}
.td-card .td-desc{font-size:11px;color:#64748B;margin-top:4px}
.td-op-logo{width:48px;height:48px;margin:0 auto 8px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff}
.td-mtn .td-op-logo{background:#FFCC00;color:#000}
.td-airtel .td-op-logo{background:#ED1C24}
.td-btn{width:100%;padding:16px;background:linear-gradient(135deg,#FF6B35 0%,#F7931E 100%);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit}
.td-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 20px rgba(255,107,53,.4)}
.td-btn:disabled{opacity:.6;cursor:not-allowed}
.td-link{width:100%;padding:12px;background:transparent;color:#64748B;border:none;font-size:14px;font-weight:500;cursor:pointer;margin-top:10px;font-family:inherit}
.td-link:hover{color:#0F172A}
.td-secure{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:14px;font-size:12px;color:#64748B}
.td-secure i{color:#10B981}
.td-status{display:none;text-align:center;padding:18px;border-radius:12px;margin-top:16px;font-weight:500;font-size:14px}
.td-status i{display:block;font-size:26px;margin-bottom:8px}
.td-status.td-processing{display:block;background:#EFF6FF;color:#1E40AF}
.td-status.td-success{display:block;background:#ECFDF5;color:#065F46}
.td-status.td-error{display:block;background:#FEF2F2;color:#991B1B}
.td-spinner{display:inline-block;width:18px;height:18px;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:td-spin .8s linear infinite}
.td-hint{font-size:12px;opacity:.85;margin-top:6px;font-weight:400}
.is-loading{opacity:.7;pointer-events:none}
@keyframes td-fade{from{opacity:0}to{opacity:1}}
@keyframes td-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes td-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.td-overlay,.td-dialog,.td-spinner{animation:none}}
`;

function openModal({ label = 'Fenêtre', dismissible = true, onClose } = {}) {
  getOrCreateStyle('takidoc-modal-styles').textContent = MODAL_CSS;
  const dialog = h('div', { class: 'td-dialog' });
  const overlay = h('div', { class: 'td-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': label }, dialog);
  const previouslyFocused = document.activeElement;
  let closed = false;

  const onKey = event => {
    if (event.key === 'Escape' && dismissible) { event.stopPropagation(); close('escape'); return; }
    if (event.key !== 'Tab') return;
    const focusable = $$('button:not(:disabled), input:not(:disabled), [href], select, textarea', dialog);
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  function close(reason = 'close') {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey, true);
    overlay.classList.add('td-out');
    setTimeout(() => overlay.remove(), 180);
    if (previouslyFocused?.focus) previouslyFocused.focus();
    onClose?.(reason);
  }

  overlay.addEventListener('mousedown', event => { if (event.target === overlay && dismissible) close('backdrop'); });
  document.addEventListener('keydown', onKey, true);
  document.body.appendChild(overlay);
  return { dialog, close, isClosed: () => closed };
}

function formatCard(key, { selected = false, onSelect } = {}) {
  const f = FORMATS[key];
  const card = h('button', {
    type: 'button',
    class: `td-card td-${key}${selected ? ' td-selected' : ''}`,
    dataset: { format: key },
    'aria-pressed': String(selected)
  }, h('i', { class: `fas ${f.icon} td-ico`, 'aria-hidden': 'true' }),
     h('div', { class: 'td-name', text: f.label }),
     h('div', { class: 'td-desc', text: f.desc }));
  card.addEventListener('click', () => onSelect?.(key));
  return card;
}

/** Fenêtre « Choisir le format » (documents gratuits). */
function openFormatChooser() {
  const modal = openModal({ label: 'Choisir le format' });
  const choose = key => { modal.close('chosen'); requestDownload(key); };
  modal.dialog.append(
    h('div', { class: 'td-head' },
      h('h3', { text: 'Télécharger le document' }),
      h('div', { class: 'td-tname', text: state.template?.name || '' })),
    h('div', { class: 'td-body' },
      h('span', { class: 'td-label', text: 'Choisissez un format' }),
      h('div', { class: 'td-grid' }, Object.keys(FORMATS).map(key => formatCard(key, { onSelect: choose }))),
      h('button', { type: 'button', class: 'td-link', text: 'Annuler', onclick: () => modal.close('cancel') }))
  );
  $('.td-card', modal.dialog)?.focus();
}

/* ------------------------------------------------------------
   13. ÉCHANGES AVEC SUPABASE (fonctions Edge)
------------------------------------------------------------ */
async function postFunction(name, body, token = CONFIG.anonKey) {
  const response = await fetch(`${CONFIG.functionsUrl}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: CONFIG.anonKey, Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  let data = {};
  try { data = await response.json(); } catch (_) { /* réponse non JSON */ }
  return { ok: response.ok, status: response.status, data };
}

const errorMessageOf = (data, fallback) => data?.message || data?.error || fallback;

/* ------------------------------------------------------------
   14. SUIVI DES PAIEMENTS
------------------------------------------------------------ */
const pendingKey = () => `takidoc_pending_${state.template?.id}`;

function savePending(token, format) {
  try { localStorage.setItem(pendingKey(), JSON.stringify({ token, format, ts: Date.now() })); } catch (_) { /* ignoré */ }
}
function clearPending() {
  try { localStorage.removeItem(pendingKey()); } catch (_) { /* ignoré */ }
}
function readPending() {
  try {
    const pending = JSON.parse(localStorage.getItem(pendingKey()) || 'null');
    if (!pending?.token) return null;
    if (Date.now() - Number(pending.ts) > CONFIG.pendingMaxAgeMs) { clearPending(); return null; }
    return pending;
  } catch (_) { return null; }
}

async function fetchPurchaseStatus(token) {
  try {
    const { ok, status, data } = await postFunction('purchase-status', { purchase_token: token });
    if (ok) return String(data.status || 'pending');
    return status >= 400 && status < 500 && status !== 429 ? 'failed' : 'pending';
  } catch (_) {
    return 'pending'; // coupure réseau passagère : on réessaiera
  }
}

/** Attend la validation du paiement. Résultat : completed | failed | cancelled | timeout. */
async function watchPurchase(token, onTick) {
  if (state.watching.has(token)) return 'pending';
  state.watching.add(token);
  try {
    for (let attempt = 0; attempt < CONFIG.pollMaxAttempts; attempt++) {
      const status = await fetchPurchaseStatus(token);
      onTick?.(status, attempt);
      if (status === 'completed' || status === 'failed' || status === 'cancelled') return status;
      await sleep(CONFIG.pollIntervalMs);
    }
    return 'timeout';
  } finally {
    state.watching.delete(token);
  }
}

/** Reprend un paiement interrompu (onglet fermé, rechargement de la page…). */
async function recoverPendingPurchase() {
  const pending = readPending();
  if (!pending) return;
  const status = await fetchPurchaseStatus(pending.token);
  if (status === 'completed') {
    toast('Paiement retrouvé : génération de votre document…', 'info');
    await downloadDocument(pending.format, pending.token);
  } else if (status === 'pending' || status === 'processing') {
    toast('Un paiement est en attente de validation sur votre téléphone.', 'info');
    const outcome = await watchPurchase(pending.token);
    if (outcome === 'completed') await downloadDocument(pending.format, pending.token);
    else clearPending();
  } else {
    clearPending();
  }
}

/* ------------------------------------------------------------
   15. FENÊTRE DE PAIEMENT
------------------------------------------------------------ */
function buildPaymentDocumentData() {
  const data = {
    fields: {},
    primary_color: state.colorActive ? state.primaryColor : null,
    photo_data_url: state.photoDataUrl || null,
    font_family: state.fontCustom ? state.fontFamily : null
  };
  state.template.fields.forEach(field => { data.fields[field.name] = getFieldValue(field.name); });
  return data;
}

function showPaymentModal(initialFormat = 'pdf') {
  const price = state.template.price;
  let format = FORMATS[initialFormat] ? initialFormat : 'pdf';
  let operator = '';
  let busy = false;

  const modal = openModal({ label: 'Paiement sécurisé' });

  const formatCards = Object.keys(FORMATS).map(key => formatCard(key, {
    selected: key === format,
    onSelect: selected => {
      if (busy) return;
      format = selected;
      formatCards.forEach(card => {
        const on = card.dataset.format === format;
        card.classList.toggle('td-selected', on);
        card.setAttribute('aria-pressed', String(on));
      });
    }
  }));

  const emailInput = h('input', {
    type: 'email', id: 'pay-email', class: 'td-input', placeholder: 'exemple@email.com',
    autocomplete: 'email', required: true, value: state.user?.email || ''
  });
  const phoneInput = h('input', {
    type: 'tel', id: 'pay-phone', class: 'td-input', placeholder: '06 518 69 67',
    inputMode: 'numeric', autocomplete: 'tel-national', maxLength: 14, required: true
  });

  const operatorButton = (code, cssClass, logo, name) => h('button', {
    type: 'button', class: `td-card ${cssClass}`, dataset: { op: code }, 'aria-pressed': 'false',
    onclick: () => {
      if (busy) return;
      operator = code;
      $$('[data-op]', modal.dialog).forEach(el => {
        const on = el.dataset.op === code;
        el.classList.toggle('td-selected', on);
        el.setAttribute('aria-pressed', String(on));
      });
      validate();
    }
  }, h('div', { class: 'td-op-logo', text: logo }), h('div', { class: 'td-name', text: name }));

  const submitLabel = () => [icon('fa-lock'), ` Payer ${formatPrice(price)}`];
  const submitBtn = h('button', { type: 'button', class: 'td-btn', disabled: true }, ...submitLabel());
  const cancelBtn = h('button', { type: 'button', class: 'td-link', text: 'Annuler', onclick: () => modal.close('cancel') });
  const statusBox = h('div', { class: 'td-status', role: 'status', 'aria-live': 'polite' });

  function setStatus(kind, iconClass, message, hint) {
    statusBox.className = `td-status td-${kind}`;
    statusBox.replaceChildren(icon(iconClass), h('div', { text: message }),
      hint ? h('div', { class: 'td-hint', text: hint }) : null);
  }

  function lockForm(locked) {
    busy = locked;
    [emailInput, phoneInput].forEach(input => { input.disabled = locked; });
    $$('.td-card', modal.dialog).forEach(card => { card.disabled = locked; });
  }

  function validate() {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
    const phoneOk = phoneInput.value.replace(/\D/g, '').length === CONFIG.phoneDigits;
    submitBtn.disabled = busy || !(operator && emailOk && phoneOk);
  }

  emailInput.addEventListener('input', validate);
  phoneInput.addEventListener('input', () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, CONFIG.phoneDigits);
    validate();
  });

  async function processPayment() {
    const email = emailInput.value.trim();
    const phone = `${CONFIG.countryDialCode}${phoneInput.value.replace(/\D/g, '')}`;
    lockForm(true);
    submitBtn.disabled = true;
    submitBtn.replaceChildren(h('span', { class: 'td-spinner' }), ' Traitement en cours…');
    setStatus('processing', 'fa-spinner fa-spin', 'Initiation du paiement…');

    try {
      const created = await postFunction('create-purchase-intent', {
        template_id: state.template.id,
        guest_email: email,
        guest_phone: phone,
        customer_name: state.user?.user_metadata?.full_name || 'Client TakiDoc',
        document_data: buildPaymentDocumentData()
      });
      if (!created.ok) throw new Error(errorMessageOf(created.data, 'Erreur de création du paiement.'));
      const { payment_intent_id: intentId, client_secret: clientSecret, purchase_token: token } = created.data;

      savePending(token, format);

      const confirmed = await postFunction('confirm-yabetoo-payment', {
        payment_intent_id: intentId, client_secret: clientSecret, operator, phone, purchase_token: token
      });
      if (!confirmed.ok) throw new Error(errorMessageOf(confirmed.data, 'Le paiement a été refusé.'));

      setStatus('processing', 'fa-mobile-alt', 'Validez le paiement sur votre téléphone…',
        'Vous pouvez fermer cette fenêtre : votre document se téléchargera dès la validation.');

      const outcome = await watchPurchase(token);

      if (outcome === 'completed') {
        const wasOpen = !modal.isClosed();
        if (wasOpen) {
          setStatus('success', 'fa-check-circle', 'Paiement réussi !');
          await sleep(900);
          modal.close('paid');
        }
        toast('Paiement confirmé ! Génération de votre document…', 'success');
        await downloadDocument(format, token);
        return;
      }
      clearPending();
      throw new Error(outcome === 'timeout'
        ? 'Délai de validation dépassé. Si vous avez été débité, contactez le support.'
        : 'Le paiement a échoué ou a été annulé.');
    } catch (error) {
      console.error('Erreur paiement :', error);
      if (modal.isClosed()) { toast(error.message, 'error'); return; }
      setStatus('error', 'fa-exclamation-circle', error.message || 'Erreur de paiement.');
      lockForm(false);
      submitBtn.replaceChildren(...submitLabel());
      validate();
    }
  }
  submitBtn.addEventListener('click', processPayment);

  modal.dialog.append(
    h('div', { class: 'td-head' },
      h('h3', { text: 'TakiDoc' }),
      h('div', { class: 'td-amount', text: formatPrice(price) }),
      h('div', { class: 'td-tname', text: state.template.name })),
    h('div', { class: 'td-body' },
      h('div', { class: 'td-section' },
        h('span', { class: 'td-label', text: 'Format du document *' }),
        h('div', { class: 'td-grid' }, formatCards)),
      h('div', { class: 'td-section' },
        h('label', { class: 'td-label', htmlFor: 'pay-email', text: 'Adresse e-mail *' }), emailInput),
      h('div', { class: 'td-section' },
        h('label', { class: 'td-label', htmlFor: 'pay-phone', text: 'Numéro de téléphone *' }),
        h('div', { class: 'td-phone' }, h('span', { class: 'td-prefix', text: CONFIG.countryDialCode }), phoneInput)),
      h('div', { class: 'td-section' },
        h('span', { class: 'td-label', text: 'Opérateur Mobile Money *' }),
        h('div', { class: 'td-grid' },
          operatorButton('MTN', 'td-mtn', 'MTN', 'MTN MoMo'),
          operatorButton('AIRTEL', 'td-airtel', 'A', 'Airtel Money'))),
      submitBtn,
      cancelBtn,
      h('div', { class: 'td-secure' }, icon('fa-shield-alt'), h('span', { text: 'Paiement sécurisé par YabetooPay' })),
      statusBox)
  );

  validate();
  (emailInput.value ? phoneInput : emailInput).focus();
}

/* ------------------------------------------------------------
   16. TÉLÉCHARGEMENT DU DOCUMENT
------------------------------------------------------------ */
function setExportBusy(busy) {
  $$(DOWNLOAD_BUTTONS).forEach(button => {
    button.classList.toggle('is-loading', busy);
    button.setAttribute('aria-busy', String(busy));
    if ('disabled' in button) button.disabled = busy;
  });
  setDocStatus(busy ? 'Génération du document…' : 'Document prêt', busy ? 'doc-status saving' : 'doc-status');
}

function buildSnapshotData() {
  const canvas = getCanvas();
  const styles = $$('style', canvas);
  const data = buildPaymentDocumentData();
  data.snapshot = {
    html: canvas.innerHTML,
    css: styles.length ? styles.map(style => style.textContent).join('\n') : null
  };
  return data;
}

async function readServerError(response) {
  const text = await response.text().catch(() => '');
  let payload = null;
  try { payload = JSON.parse(text); } catch (_) { /* texte brut */ }
  const base = payload?.error || payload?.message || '';
  const ref = payload?.requestId ? ` (réf. ${payload.requestId})` : '';
  switch (response.status) {
    case 413: return 'Document trop volumineux : essayez avec une photo plus légère.';
    case 429: return 'Trop de demandes en peu de temps. Patientez une minute puis réessayez.';
    case 501: return (base || 'Ce format est momentanément indisponible sur le serveur.') + ref;
    default: return (base || `Erreur serveur (${response.status})`) + ref;
  }
}

/** Appel au générateur avec délai maximal et une nouvelle tentative (serveur gratuit en veille). */
async function requestGeneration(payload) {
  let lastError = null;
  for (let attempt = 0; attempt <= CONFIG.generateRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.generateTimeoutMs);
    try {
      const response = await fetch(`${CONFIG.generatorUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if ([502, 503, 504].includes(response.status) && attempt < CONFIG.generateRetries) {
        toast('Le serveur de génération démarre, nouvelle tentative…', 'info');
        await sleep(4000);
        continue;
      }
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Le serveur met trop de temps à répondre. Réessayez dans un instant.');
      }
      lastError = error;
      if (attempt < CONFIG.generateRetries) {
        toast('Le serveur de génération se réveille, patientez quelques secondes…', 'info');
        await sleep(4000);
      }
    } finally {
      clearTimeout(timer);
    }
  }
  console.error('Générateur injoignable :', lastError);
  throw new Error('Impossible de joindre le serveur de génération. Vérifiez votre connexion.');
}

function triggerBrowserDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = h('a', { href: url, download: fileName, style: 'display:none' });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function downloadDocument(format, purchaseToken = null) {
  if (!state.template) return false;
  if (!FORMATS[format]) format = 'pdf';
  if (state.downloading) { toast('Un téléchargement est déjà en cours…', 'info'); return false; }
  if (!navigator.onLine) { toast('Pas de connexion Internet. Réessayez une fois reconnecté.', 'error'); return false; }

  const { label, ext } = FORMATS[format];
  state.downloading = true;
  showTaki(
  "thinking",
  "Je prépare ton document…"
);
  setExportBusy(true);
  toast(`Génération de votre document ${label} en cours…`, 'info');

  try {
    const documentData = buildSnapshotData();

    const auth = await postFunction(
      'authorize-download',
      purchaseToken
        ? { purchase_token: purchaseToken, format }
        : { template_id: state.template.id, format },
      await getAccessToken()
    );
    if (!auth.ok) throw new Error(errorMessageOf(auth.data, `Erreur d'autorisation (${auth.status})`));

    const response = await requestGeneration({
      nonce: auth.data.nonce,
      template_id: state.template.id,
      format,
      data: documentData
    });
    if (!response.ok) throw new Error(await readServerError(response));

    const blob = await response.blob();
    showTaki(
  "working",
  "Je travaille sur ton document. Un instant…"
);
showTaki(
  "working",
  "Ton document est prêt. Je prépare le téléchargement…"
);
    if (!blob.size) throw new Error('Le fichier généré est vide. Réessayez.');

    triggerBrowserDownload(blob, `TakiDoc_${safeFileBase(state.template.name)}.${ext}`);
    showTaki(
  "celebrating",
  "Et voilà ! Ton document est prêt. 🎉"
);

hideTaki(3500);
    if (purchaseToken) clearPending();
    saveDraft({ quiet: true });
    toast(`Document ${label} téléchargé avec succès.`, 'success');
    return true;
  } catch (error) {
    showTaki(
  "error",
  "Un petit souci est survenu. On va regarder ça."
);

hideTaki(5000);
    console.error('Erreur génération :', error);
    toast(error.message || `Erreur lors de la génération du ${label}.`, 'error');
    return false;
  } finally {
    state.downloading = false;
    setExportBusy(false);
  }
}

/** Point d'entrée unique : choisit entre téléchargement direct, choix du format et paiement. */
function requestDownload(format = null) {
  if (!state.template) return;
  if (format && !FORMATS[format]) format = null;
  if (isFreeTemplate()) {
    if (format) downloadDocument(format);
    else openFormatChooser();
    return;
  }
  showPaymentModal(format || 'pdf');
}

function setupExportControls() {
  const bound = new Set();
  const bind = (element, format) => {
    if (!element || bound.has(element)) return;
    bound.add(element);
    element.addEventListener('click', event => { event.preventDefault(); requestDownload(format); });
  };

  bind($('#btn-download-pdf'), 'pdf');
  bind($('#btn-download-docx'), 'docx');
  $$('[data-export-format]').forEach(el => bind(el, el.dataset.exportFormat));
  ['#header-download-btn', '#mobileBtnDownload', '#btn-download'].forEach(selector => bind($(selector), null));

  $('#btn-save-draft')?.addEventListener('click', event => { event.preventDefault(); saveDraft(); });

  const loadButton = $('#btn-load-draft');
  if (loadButton) {
    loadButton.style.display = state.draftKey && localStorage.getItem(state.draftKey) ? '' : 'none';
    loadButton.addEventListener('click', event => {
      event.preventDefault();
      if (loadDraft()) { refreshPages(); toast('Brouillon restauré.', 'success'); }
      else toast('Aucun brouillon disponible.', 'info');
    });
  }

  $('#loginModalClose')?.addEventListener('click', () => $('#loginModal')?.classList.remove('active'));
  $('#loginModal')?.addEventListener('click', event => {
    if (event.target.id === 'loginModal') event.currentTarget.classList.remove('active');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') $('#loginModal')?.classList.remove('active');
  });
}

/** Réveille le serveur Render dès l'ouverture de l'éditeur : le premier téléchargement est beaucoup plus rapide. */
function warmUpGenerator() {
  fetch(`${CONFIG.generatorUrl}/health`, { mode: 'no-cors', cache: 'no-store' }).catch(() => { /* sans importance */ });
}

/* ------------------------------------------------------------
   17. INITIALISATION
------------------------------------------------------------ */
async function initEditor() {
  if (state.initialized) return;
  state.initialized = true;
  try {
    warmUpGenerator();
    await checkAuth();
    initProtection({ supabase, state, toast });

    const params = new URLSearchParams(window.location.search);
    await loadTemplate(params.get('id') || params.get('template'));
    const { template } = state;

    document.title = `${template.name} - Éditeur TakiDoc`;
    setText('header-doc-title', template.name);
    setText('sidebar-template-name', template.name);
    setText('sidebar-template-desc', template.description || 'Document professionnel personnalisable.');

    renderDocument();
    buildFieldsForm();
    setupDesignControls();
    setupPhotoUpload();
    setupZoomControls();
    setupSidebarTabs();
    setupExportControls();
    setupKeyboardShortcuts();

    const restored = loadDraft();
    applySavedFieldValues();
    enableFieldEditing();
    initPagination({ state, $, $$, getCanvas });

    state.isDirty = false;
    setDocStatus(restored ? 'Brouillon restauré' : 'Document prêt');
    toast('Document chargé avec succès.', 'success');

    recoverPendingPurchase().catch(error => console.warn('Reprise du paiement impossible :', error));
  } catch (error) {
    console.error("Initialisation de TakiDoc impossible :", error);
    state.initialized = false;
    toast(error.message || 'Erreur de chargement du document.', 'error');
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initEditor);
else initEditor();

let takiHideTimer = null;

function showTaki(state, message) {
  const container = document.getElementById("taki-container");

  if (!container || !takiMascot) return;

  window.clearTimeout(takiHideTimer);
  container.hidden = false;

  takiMascot.setState(state, message);
}

function hideTaki(delay = 0) {
  window.clearTimeout(takiHideTimer);

  takiHideTimer = window.setTimeout(() => {
    const container = document.getElementById("taki-container");

    if (container) {
      container.hidden = true;
    }
  }, delay);
}