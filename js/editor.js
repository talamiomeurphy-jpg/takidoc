/* ============================================
   TAKIDOC — MOTEUR D'ÉDITION PROFESSIONNEL (v6.0)
   Supabase • CSS isolé • A4 • PDF multi-pages • Brouillons
   Modale de paiement dédiée avec Payment Intents (sans redirection)

   v6.0 :
   - Modale de paiement dédiée avec formulaire complet
   - L'utilisateur saisit email, téléphone et choisit l'opérateur
   - Intégration YabetooPay via Payment Intents (reste sur le site)
   - Confirmation automatique et polling du statut de paiement
   - Génération PDF via serveur Render (Puppeteer)
============================================ */

// ✅ IMPORTS UNIQUES ET CENTRALISÉS
import { initProtection } from './editor-protection.js';
import './editor-underline-fix.js';
import {
  initPagination,
  refreshPages,
  exportPagedPDF
} from './editor-pagination.js';
import { supabase } from './supabase-config.js';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM';

const PROTECT_BRAND = true;
const BRAND_TEXTS = [
  'Document personnalisable généré par TakiDoc',
  'www.takidoc.onrender.com'
];

const DEFAULT_FONT = "'Inter', sans-serif";
const DEFAULT_COLOR = '#0F172A';

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
  initialized: false,
  originalCss: ''
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const getCanvas = () => $('#document-canvas');
const getTemplateFieldElement = name => document.getElementById(`field-${name}`);

function toast(message, type = 'success') {
  const el = $('#editorToast');
  if (!el) {
    console.log(`[TakiDoc] ${message}`);
    return;
  }
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-circle-exclamation',
    info: 'fa-info-circle'
  };
  el.className = `editor-toast ${type} show`;
  const icon = document.createElement('i');
  icon.className = `fas ${icons[type] || icons.info}`;
  el.replaceChildren(icon, document.createTextNode(` ${message}`));
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 3500);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '';
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
}

function isBrandElement(el) {
  if (!el || !PROTECT_BRAND) return false;
  const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
  return BRAND_TEXTS.some(b => text.includes(b)) || el.matches('[data-takidoc-brand], .takidoc-brand, #takidoc-brand');
}

function ownText(el) {
  return [...el.childNodes]
    .filter(n => n.nodeType === 3)
    .map(n => n.nodeValue)
    .join(' ')
    .replace(/\s+/g, ' ');
}

function isBrandNode(el) {
  if (!PROTECT_BRAND || !el || el.nodeType !== 1) return false;
  if (el.matches('[data-takidoc-brand], .takidoc-brand, #takidoc-brand')) return true;
  return BRAND_TEXTS.some(b => ownText(el).includes(b));
}

function markDirty() {
  state.isDirty = true;
  const status = $('#header-doc-status');
  if (status) {
    status.className = 'doc-status saving';
    status.textContent = 'Modifications en cours…';
  }
  refreshPages();
  clearTimeout(state.autoSaveTimer);
  state.autoSaveTimer = setTimeout(() => { saveDraft({ quiet: true }); }, 900);
}

async function checkAuth() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    state.user = data.session?.user ?? null;
    
    // Debug : vérifier si l'utilisateur est bien connecté
    if (state.user) {
      console.log('✅ Utilisateur connecté:', state.user.email);
    } else {
      console.warn('⚠️ Aucun utilisateur connecté');
    }
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    state.user = null;
  }
}

async function loadTemplate(id) {
  if (!id) throw new Error('Identifiant de document manquant dans l\'URL.');
  if (!supabase) throw new Error('Supabase ne s\'est pas chargé. Vérifie les scripts dans editor.html.');

  const { data, error } = await supabase
    .from('templates')
    .select(`id, name, description, price_xaf, category_id, has_photo, has_color_picker, html_structure, css_styles, template_fields (field_name, field_label, field_type, default_value, is_required, display_order)`)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Erreur Supabase lors du chargement du modèle :', error);
    throw new Error(`Impossible de charger le modèle : ${error.message}`);
  }
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
      .map(field => ({
        name: field.field_name,
        label: field.field_label,
        type: field.field_type,
        defaultValue: field.default_value ?? '',
        required: Boolean(field.is_required)
      }))
  };

  state.originalCss = state.template.css;
  state.draftKey = `takidoc_draft_${data.id}`;
  return state.template;
}

function splitSelectors(selectorText) {
  const result = [];
  let current = '';
  let depth = 0;
  let quote = '';
  for (const char of selectorText) {
    if (quote) {
      current += char;
      if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === '(' || char === '[') depth++;
    if (char === ')' || char === ']') depth--;
    if (char === ',' && depth === 0) {
      if (current.trim()) result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
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
  let output = '';
  let i = 0;
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
    let depth = 1;
    let j = open + 1;
    let quote = '';
    let comment = false;
    for (; j < css.length && depth > 0; j++) {
      const char = css[j];
      const next = css[j + 1];
      if (comment) {
        if (char === '*' && next === '/') { comment = false; j++; }
        continue;
      }
      if (!quote && char === '/' && next === '*') { comment = true; j++; continue; }
      if (quote) {
        if (char === '\\') j++;
        else if (char === quote) quote = '';
        continue;
      }
      if (char === '"' || char === "'") { quote = char; continue; }
      if (char === '{') depth++;
      if (char === '}') depth--;
    }
    const body = css.slice(open + 1, j - 1);
    if (header.startsWith('@')) {
      if (/^@(media|supports|container|layer|document)\b/i.test(header)) output += `${header}{${scopeCSS(body)}}`;
      else output += `${header}{${body}}`;
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
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}

function scopeInlineStyles(canvas) {
  $$('style', canvas).forEach(style => { style.textContent = scopeCSS(style.textContent); });
}

function installTemplateCSS() {
  if (!state.template) return;
  let style = $('#template-dynamic-css');
  if (!style) {
    style = document.createElement('style');
    style.id = 'template-dynamic-css';
    document.head.appendChild(style);
  }
  style.textContent = scopeCSS(state.template.css);
  loadTemplateFonts(state.template.css);
}

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
  if (found) {
    state.primaryColor = found;
    state.colorActive = false;
  } else {
    state.colorActive = /var\(\s*--(?:doc-)?primary-color/.test(css);
  }
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
  let style = $('#takidoc-color-overrides');
  if (!style) {
    style = document.createElement('style');
    style.id = 'takidoc-color-overrides';
    document.head.appendChild(style);
  }
  if (!state.colorActive) {
    style.textContent = '';
    canvas?.style.removeProperty('--doc-primary-color');
    canvas?.style.removeProperty('--primary-color');
    return;
  }
  canvas?.style.setProperty('--doc-primary-color', state.primaryColor);
  canvas?.style.setProperty('--primary-color', state.primaryColor);
  style.textContent = `
    #document-canvas { --doc-primary-color: ${state.primaryColor}; --primary-color: ${state.primaryColor}; }
    #document-canvas .primary, #document-canvas .accent, #document-canvas .accent-color, #document-canvas .section-title, #document-canvas .title-accent, #document-canvas h1, #document-canvas h2 { border-color: ${state.primaryColor}; }
    #document-canvas .text-primary, #document-canvas .primary-color, #document-canvas .accent-text { color: ${state.primaryColor}; }
    #document-canvas .bg-primary, #document-canvas .primary-bg, #document-canvas .accent-bg { background-color: ${state.primaryColor}; }
  `;
}

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
  if (!state.template) return;
  state.template.fields.forEach(field => {
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
    const message = document.createElement('p');
    message.textContent = "Ce document ne contient aucun champ personnalisable. Vous pouvez modifier directement les textes dans l'aperçu.";
    container.appendChild(message);
    return;
  }
  state.template.fields.forEach(field => {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';
    const label = document.createElement('label');
    label.htmlFor = `input-${field.name}`;
    label.textContent = `${field.label}${field.required ? ' *' : ''}`;
    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 3;
    } else {
      input = document.createElement('input');
      const allowed = ['text', 'email', 'tel', 'url', 'date', 'number'];
      input.type = allowed.includes(field.type) ? field.type : 'text';
    }
    input.id = `input-${field.name}`;
    input.name = field.name;
    input.className = 'form-control';
    input.value = field.defaultValue;
    input.placeholder = `Entrez ${field.label.toLowerCase()}`;
    if (field.required) input.required = true;
    input.addEventListener('input', () => {
      const target = getTemplateFieldElement(field.name);
      if (target && !isBrandElement(target)) target.textContent = input.value;
      markDirty();
    });
    wrapper.append(label, input);
    container.appendChild(wrapper);
  });
}

const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'template', 'head', 'title', 'meta', 'link', 'svg', 'canvas', 'iframe', 'video', 'audio', 'object', 'embed', 'img', 'br', 'hr', 'button', 'input', 'textarea', 'select', 'option']);

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
        const span = document.createElement('span');
        span.className = 'takidoc-text';
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
    if (hosts.some(h => h === el || h.contains(el) || el.contains(h))) return;
    if (!el.children.length) hosts.push(el);
  });
  return hosts;
}

function lockInside(host) {
  $$('*', host).forEach(node => {
    const tag = node.localName;
    const isMedia = ['img', 'svg', 'canvas', 'video', 'iframe', 'input', 'button', 'select', 'textarea'].includes(tag);
    const isIcon = tag === 'i' && !node.textContent.trim();
    if (isMedia || isIcon || isBrandNode(node)) node.contentEditable = 'false';
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
    if (!hostOf(event)) return;
    if (event.key === 'Enter') { event.preventDefault(); document.execCommand('insertLineBreak'); }
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
  const hosts = collectEditableHosts(canvas);
  hosts.forEach((el, index) => {
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

function updateDocumentPhoto(dataUrl) {
  if (!state.template?.hasPhoto) return;
  const canvas = getCanvas() || document;
  let container = $('#doc-photo', canvas);
  if (!container) container = $('[data-photo-placeholder], .doc-photo, .cv-photo, .photo-placeholder', canvas);
  if (!container) {
    console.warn("Ce modèle est marqué comme compatible avec une photo, mais aucun emplacement #doc-photo ou .doc-photo n'a été trouvé dans son HTML.");
    return;
  }
  container.replaceChildren();
  if (!dataUrl) {
    const placeholder = document.createElement('span');
    placeholder.className = 'cv-photo-placeholder';
    placeholder.textContent = 'Photo';
    container.appendChild(placeholder);
    return;
  }
  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = 'Photo du document';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  container.appendChild(img);
}

function renderPhotoPreview(dataUrl) {
  const preview = $('#photo-preview-area');
  if (!preview) return;
  if (!dataUrl) {
    preview.classList.remove('has-image');
    preview.replaceChildren();
    const icon = document.createElement('i');
    icon.className = 'fas fa-user-circle';
    const span = document.createElement('span');
    span.textContent = 'Aucune photo';
    preview.append(icon, span);
    return;
  }
  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = 'Aperçu de la photo';
  preview.replaceChildren(img);
  preview.classList.add('has-image');
}

function setupPhotoUpload() {
  const input = $('#photo-input');
  const remove = $('#photo-remove');
  if (!input) return;
  input.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Choisis un fichier image valide.', 'error');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('La photo ne doit pas dépasser 5 Mo.', 'error');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      state.photoDataUrl = String(reader.result || '');
      renderPhotoPreview(state.photoDataUrl);
      updateDocumentPhoto(state.photoDataUrl);
      if (remove) remove.style.display = 'inline-flex';
      markDirty();
      toast('Photo ajoutée au document.', 'success');
    };
    reader.onerror = () => { toast('Impossible de lire cette image.', 'error'); };
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
  let style = $('#takidoc-font-overrides');
  if (!style) {
    style = document.createElement('style');
    style.id = 'takidoc-font-overrides';
    document.head.appendChild(style);
  }
  if (!state.fontCustom) {
    canvas.style.removeProperty('font-family');
    style.textContent = '';
    return;
  }
  canvas.style.fontFamily = state.fontFamily;
  style.textContent = `#document-canvas, #document-canvas *:not(svg):not(path):not(.fa):not(.fas):not(.far):not(.fab):not([class*="fa-"]) { font-family: ${state.fontFamily} !important; }`;
}

function setupDesignControls() {
  $('#color-picker')?.addEventListener('input', event => { applyPrimaryColor(event.target.value); });
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
}

function updateZoom() {
  const wrapper = $('#document-wrapper');
  if (wrapper) {
    wrapper.style.transform = `scale(${state.zoom})`;
    wrapper.style.transformOrigin = 'top center';
  }
  setText('zoom-level', `${Math.round(state.zoom * 100)}%`);
  refreshPages();
}

function fitZoom() {
  const container = $('.editor-canvas-area') || $('.preview-container');
  const canvas = getCanvas();
  if (!container || !canvas) return window.innerWidth <= 768 ? 0.48 : 0.85;
  const available = Math.max(220, container.clientWidth - 80);
  const canvasWidth = canvas.offsetWidth || 794;
  return Math.max(0.3, Math.min(1.2, available / canvasWidth));
}

function setupZoomControls() {
  state.zoom = fitZoom();
  $('#btn-zoom-in')?.addEventListener('click', () => { state.zoom = Math.min(2.5, state.zoom + 0.1); updateZoom(); });
  $('#btn-zoom-out')?.addEventListener('click', () => { state.zoom = Math.max(0.3, state.zoom - 0.1); updateZoom(); });
  $('#btn-zoom-fit')?.addEventListener('click', () => { state.zoom = fitZoom(); updateZoom(); });
  window.addEventListener('resize', () => {
    if (state.zoom < 0.6) { state.zoom = fitZoom(); updateZoom(); }
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
      $$('.tab-btn').forEach(item => { item.classList.toggle('active', item === button); });
      $$('.tab-pane').forEach(item => { item.classList.toggle('active', item.id === `tab-${button.dataset.tab}`); });
    });
  });
  const toggle = $('#mobileSidebarToggle');
  const sidebar = $('#editorSidebar');
  toggle?.addEventListener('click', () => { sidebar?.classList.toggle('open'); });
  $('#mobileBtnCustomize')?.addEventListener('click', openFieldsTab);
  $('#btn-customize')?.addEventListener('click', () => {
    openFieldsTab();
    $('#fields-form input, #fields-form textarea')?.focus();
  });
}

function sanitizeHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html || '');
  tpl.content.querySelectorAll('script,style,iframe,object,embed,link,meta,base,form').forEach(node => node.remove());
  tpl.content.querySelectorAll('*').forEach(node => {
    [...node.attributes].forEach(attr => {
      const value = attr.value.trim().toLowerCase();
      const dangerousUrl = ['href', 'src', 'xlink:href'].includes(attr.name) && value.startsWith('javascript:');
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
    const status = $('#header-doc-status');
    if (status) {
      status.className = 'doc-status';
      status.textContent = 'Modifications sauvegardées';
    }
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
    Object.entries(draft.fields || {}).forEach(([name, value]) => { setFieldValue(name, value); });
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
    const status = $('#header-doc-status');
    if (status) {
      status.className = 'doc-status';
      status.textContent = 'Brouillon restauré';
    }
    return true;
  } catch (error) {
    console.error('Erreur restauration brouillon :', error);
    toast('Impossible de restaurer ce brouillon.', 'error');
    return false;
  }
}

/* ============================================
   MODALE DE PAIEMENT DÉDIÉE (PAYMENT INTENTS)
   L'utilisateur saisit email, téléphone et choisit l'opérateur
============================================ */
function showPaymentModal() {
  const existing = document.getElementById('takidoc-payment-modal');
  if (existing) existing.remove();

  const price = state.template.price;
  const templateName = state.template.name;

  const modalHtml = `
    <div id="takidoc-payment-modal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);padding:20px;">
      <div style="background:white;border-radius:20px;box-shadow:0 25px 50px rgba(0,0,0,0.4);max-width:480px;width:100%;max-height:90vh;overflow-y:auto;animation:slideUp 0.3s ease;">
        <style>
          @keyframes slideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
          @keyframes spin { to { transform:rotate(360deg); } }
          .pay-header { background:linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color:white; padding:28px 24px; text-align:center; border-radius:20px 20px 0 0; }
          .pay-header h3 { margin:0 0 8px; font-size:22px; font-weight:700; }
          .pay-header .amount { font-size:36px; font-weight:800; margin:12px 0 4px; }
          .pay-header .template-name { font-size:14px; opacity:0.9; }
          .pay-body { padding:28px 24px; }
          .pay-section { margin-bottom:24px; }
          .pay-label { display:block; font-size:13px; font-weight:600; color:#64748B; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px; }
          .pay-input { width:100%; padding:14px 16px; border:2px solid #E2E8F0; border-radius:12px; font-size:16px; font-weight:500; outline:none; transition:border-color 0.2s; box-sizing:border-box; font-family:inherit; }
          .pay-input:focus { border-color:#FF6B35; }
          .format-selector { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
          .format-option { border:2px solid #E2E8F0; border-radius:12px; padding:16px; text-align:center; cursor:pointer; transition:all 0.2s; background:white; }
          .format-option:hover { border-color:#FF6B35; transform:translateY(-2px); }
          .format-option.selected { border-color:#FF6B35; background:#FFF5F0; box-shadow:0 4px 12px rgba(255,107,53,0.2); }
          .format-option i { font-size:28px; margin-bottom:8px; display:block; }
          .format-option.pdf i { color:#DC2626; }
          .format-option.docx i { color:#2563EB; }
          .format-option .name { font-weight:600; font-size:14px; color:#0F172A; }
          .format-option .desc { font-size:11px; color:#64748B; margin-top:4px; }
          .operators { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
          .operator { border:2px solid #E2E8F0; border-radius:12px; padding:16px; text-align:center; cursor:pointer; transition:all 0.2s; background:white; }
          .operator:hover { border-color:#FF6B35; transform:translateY(-2px); }
          .operator.selected { border-color:#FF6B35; background:#FFF5F0; box-shadow:0 4px 12px rgba(255,107,53,0.2); }
          .operator .logo { width:48px; height:48px; margin:0 auto 8px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; color:white; }
          .operator.mtn .logo { background:#FFCC00; color:#000; }
          .operator.airtel .logo { background:#ED1C24; }
          .operator .name { font-weight:600; font-size:14px; color:#0F172A; }
          .pay-btn { width:100%; padding:16px; background:linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color:white; border:none; border-radius:12px; font-size:16px; font-weight:700; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; }
          .pay-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 20px rgba(255,107,53,0.4); }
          .pay-btn:disabled { opacity:0.6; cursor:not-allowed; }
          .pay-cancel { width:100%; padding:12px; background:transparent; color:#64748B; border:none; font-size:14px; font-weight:500; cursor:pointer; margin-top:12px; font-family:inherit; }
          .pay-cancel:hover { color:#0F172A; }
          .pay-status { text-align:center; padding:20px; border-radius:12px; margin-top:16px; font-weight:500; display:none; }
          .pay-status.processing { background:#EFF6FF; color:#1E40AF; display:block; }
          .pay-status.success { background:#ECFDF5; color:#065F46; display:block; }
          .pay-status.error { background:#FEF2F2; color:#991B1B; display:block; }
          .spinner { display:inline-block; width:20px; height:20px; border:3px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.8s linear infinite; }
          .loader-overlay { position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10001;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white; }
          .loader-overlay .spinner-big { width:60px; height:60px; border:4px solid rgba(255,255,255,0.3); border-top-color:#FF6B35; border-radius:50%; animation:spin 1s linear infinite; margin-bottom:20px; }
          .loader-overlay h3 { margin:0 0 8px; font-size:20px; }
          .loader-overlay p { margin:0; opacity:0.9; }
          .secure-badge { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:16px; font-size:12px; color:#64748B; }
          .secure-badge i { color:#10B981; }
        </style>

        <div class="pay-header">
          <h3>TakiDoc</h3>
          <div class="amount">${price} XAF</div>
          <div class="template-name">${templateName}</div>
        </div>

        <div class="pay-body" id="pay-form-container">
          <div class="pay-section">
            <span class="pay-label">Format du document *</span>
            <div class="format-selector">
              <div class="format-option pdf selected" data-format="pdf" onclick="selectFormat('pdf')">
                <i class="fas fa-file-pdf"></i>
                <div class="name">PDF</div>
                <div class="desc">Format universel</div>
              </div>
              <div class="format-option docx" data-format="docx" onclick="selectFormat('docx')">
                <i class="fas fa-file-word"></i>
                <div class="name">Word</div>
                <div class="desc">Modifiable</div>
              </div>
            </div>
          </div>

          <div class="pay-section">
            <label class="pay-label" for="pay-email">Adresse e-mail *</label>
            <input type="email" id="pay-email" class="pay-input" placeholder="exemple@email.com" required>
          </div>

          <div class="pay-section">
            <label class="pay-label" for="pay-phone">Numéro de téléphone *</label>
            <input type="tel" id="pay-phone" class="pay-input" placeholder="06 518 69 67" maxlength="14" required>
          </div>

          <div class="pay-section">
            <span class="pay-label">Opérateur Mobile Money *</span>
            <div class="operators">
              <div class="operator mtn" data-op="MTN" id="operator-mtn">
                <div class="logo">MTN</div>
                <div class="name">MTN MoMo</div>
              </div>
              <div class="operator airtel" data-op="AIRTEL" id="operator-airtel">
                <div class="logo">A</div>
                <div class="name">Airtel Money</div>
              </div>
            </div>
          </div>

          <button class="pay-btn" id="pay-submit-btn" disabled>
            <i class="fas fa-lock"></i> Payer ${price} XAF
          </button>
          <button class="pay-cancel" id="pay-cancel-btn">Annuler</button>

          <div class="secure-badge">
            <i class="fas fa-shield-alt"></i>
            Paiement sécurisé par YabetooPay
          </div>

          <div id="pay-status-msg" class="pay-status"></div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Variables globales pour la modale
  let selectedFormat = 'pdf';
  let paymentCompleted = false;

  window.selectFormat = (format) => {
    selectedFormat = format;
    document.querySelectorAll('.format-option').forEach(el => el.classList.remove('selected'));
    document.querySelector(`.format-option[data-format="${format}"]`).classList.add('selected');
  };

  window.selectPayOperator = (op) => {
    document.querySelectorAll('.operator').forEach(el => el.classList.remove('selected'));
    const selectedOp = document.querySelector(`.operator[data-op="${op}"]`);
    if (selectedOp) selectedOp.classList.add('selected');
    checkPayForm();
  };

  window.checkPayForm = () => {
    const selectedOp = document.querySelector('.operator.selected');
    const emailInput = document.getElementById('pay-email');
    const phoneInput = document.getElementById('pay-phone');
    const btn = document.getElementById('pay-submit-btn');
    
    if (!emailInput || !phoneInput || !btn) return;
    
    const email = emailInput.value.trim();
    const phone = phoneInput.value.replace(/\D/g, '');
    
    btn.disabled = !(selectedOp && email.includes('@') && email.includes('.') && phone.length === 9);
  };

  window.closePaymentModal = () => {
    if (paymentCompleted) return; // Ne pas fermer si le paiement est en cours/complété
    
    const modal = document.getElementById('takidoc-payment-modal');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.remove();
        delete window.selectPayOperator;
        delete window.checkPayForm;
        delete window.closePaymentModal;
        delete window.processPayment;
        delete window.selectFormat;
        toast('Paiement annulé.', 'info');
      }, 200);
    }
  };

  window.processPayment = async () => {
    const emailInput = document.getElementById('pay-email');
    const phoneInput = document.getElementById('pay-phone');
    const selectedOp = document.querySelector('.operator.selected');
    
    if (!emailInput || !phoneInput || !selectedOp) {
      toast('Veuillez remplir tous les champs', 'error');
      return;
    }

    const email = emailInput.value.trim();
    const phoneRaw = phoneInput.value.replace(/\D/g, '');
    const op = selectedOp.dataset.op;
    const phone = `+242${phoneRaw}`;

    const btn = document.getElementById('pay-submit-btn');
    const formContainer = document.getElementById('pay-form-container');
    const statusMsg = document.getElementById('pay-status-msg');

    paymentCompleted = true; // Empêcher la fermeture accidentelle
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Traitement en cours...';

    try {
      // 1. Créer l'intention de paiement
      const documentData = {
        fields: {},
        primary_color: state.colorActive ? state.primaryColor : null,
        photo_data_url: state.photoDataUrl || null,
        font_family: state.fontCustom ? state.fontFamily : null
      };
      state.template.fields.forEach(field => { documentData.fields[field.name] = getFieldValue(field.name); });

      const createResponse = await fetch('https://wyfkogowsdbxctbpfuud.supabase.co/functions/v1/create-purchase-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          template_id: state.template.id,
          guest_email: email,
          guest_phone: phone,
          customer_name: state.user?.user_metadata?.full_name || 'Client TakiDoc',
          document_data: documentData
        })
      });

      const createData = await createResponse.json();
      if (!createResponse.ok) throw new Error(createData.message || "Erreur de création du paiement");

      if (createData.mode === 'free') {
        await downloadDocument(selectedFormat);
        closePaymentModal();
        return;
      }

      if (createData.mode !== 'checkout' || !createData.payment_intent_id || !createData.client_secret) {
        throw new Error("Réponse inattendue du serveur");
      }

      // 2. Confirmer le paiement avec les détails Mobile Money
      statusMsg.className = 'pay-status processing';
      statusMsg.style.display = 'block';
      statusMsg.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><p>Initiation du paiement...</p>';

      const confirmResponse = await fetch('https://wyfkogowsdbxctbpfuud.supabase.co/functions/v1/confirm-yabetoo-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          payment_intent_id: createData.payment_intent_id,
          client_secret: createData.client_secret,
          operator: op,
          phone: phone,
          purchase_token: createData.purchase_token
        })
      });

      const confirmData = await confirmResponse.json();
      if (!confirmResponse.ok) {
        throw new Error(confirmData.message || "Le paiement a été refusé. Vérifiez votre numéro et réessayez.");
      }

      // 3. Afficher le loader de génération
      statusMsg.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><p>Veuillez valider le paiement sur votre téléphone...</p>';
      
      // Attendre la confirmation du paiement
      await pollPaymentStatus(createData.purchase_token, selectedFormat);

    } catch (error) {
      console.error('Erreur paiement:', error);
      statusMsg.className = 'pay-status error';
      statusMsg.style.display = 'block';
      statusMsg.innerHTML = `<i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><p>${error.message}</p><button class="pay-cancel" id="pay-error-close-btn" style="margin-top:12px;">Fermer</button>`;
      
      setTimeout(() => {
        const errorCloseBtn = document.getElementById('pay-error-close-btn');
        if (errorCloseBtn) errorCloseBtn.onclick = closePaymentModal;
      }, 100);
      
      paymentCompleted = false;
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-lock"></i> Payer ${state.template.price} XAF`;
    }
  };

  window.pollPaymentStatus = async (token, format) => {
  let attempts = 0;
  const maxAttempts = 180; // 6 minutes (2s * 180)
  const statusMsg = document.getElementById('pay-status-msg');
  
  const pollInterval = setInterval(async () => {
    attempts++;
    try {
      const res = await fetch('https://wyfkogowsdbxctbpfuud.supabase.co/functions/v1/purchase-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ purchase_token: token })
      });
      const resData = await res.json();
      
      if (resData.status === 'completed') {
        clearInterval(pollInterval);
        
        // 1. Mettre à jour le message de succès dans la modale
        statusMsg.className = 'pay-status success';
        statusMsg.innerHTML = '<i class="fas fa-check-circle" style="font-size:32px;color:#10B981;margin-bottom:8px;"></i><p style="font-size:18px;font-weight:700;">Paiement réussi !</p><p style="font-size:12px;margin-top:4px;">Fermeture...</p>';
        
        // 2. Attendre 1 seconde pour que l'utilisateur voie le succès
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 3. Fermer la modale
        const modal = document.getElementById('takidoc-payment-modal');
        if (modal) {
          modal.style.opacity = '0';
          await new Promise(resolve => setTimeout(resolve, 200));
          modal.remove();
        }
        
        // 4. Nettoyer les fonctions globales
        delete window.selectPayOperator;
        delete window.checkPayForm;
        delete window.closePaymentModal;
        delete window.processPayment;
        delete window.pollPaymentStatus;
        delete window.selectFormat;
        
        // 5. Afficher le toast de génération
        toast('Paiement confirmé ! Génération de votre document...', 'success');
        
        // 6. Télécharger le document
        await downloadDocument(format, token);
        
        return;
      }
      
      if (resData.status === 'failed' || resData.status === 'cancelled') {
        clearInterval(pollInterval);
        throw new Error('Le paiement a échoué ou a été annulé.');
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        throw new Error('Délai de vérification dépassé. Veuillez vérifier votre compte.');
      }
    } catch (error) {
      clearInterval(pollInterval);
      
      statusMsg.className = 'pay-status error';
      statusMsg.innerHTML = `<i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><p>${error.message}</p><button class="pay-cancel" id="pay-error-close-btn" style="margin-top:12px;">Fermer</button>`;
      
      setTimeout(() => {
        const errorCloseBtn = document.getElementById('pay-error-close-btn');
        if (errorCloseBtn) errorCloseBtn.onclick = closePaymentModal;
      }, 100);
      
      paymentCompleted = false;
    }
  }, 2000);
};

  // Fonction de téléchargement selon le format
  async function downloadDocument(format, purchaseToken = null) {
  try {
    const documentData = {
      fields: {},
      primary_color: state.colorActive ? state.primaryColor : null,
      photo_data_url: state.photoDataUrl || null,
      font_family: state.fontCustom ? state.fontFamily : null,
      snapshot: {
        html: getCanvas().innerHTML,
        css: getCanvas().querySelectorAll('style').length > 0 
          ? Array.from(getCanvas().querySelectorAll('style')).map(s => s.textContent).join('\n') 
          : null
      }
    };
    state.template.fields.forEach(field => { documentData.fields[field.name] = getFieldValue(field.name); });

    const generatorUrl = 'https://takidoc-generator.onrender.com';
    
    // Obtenir le token de session
    let authToken = SUPABASE_ANON_KEY;
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) authToken = session.access_token;
      } catch (err) {
        console.warn('⚠️ Erreur récupération session:', err);
      }
    }

    const authBody = purchaseToken 
      ? { purchase_token: purchaseToken, format: format }
      : { template_id: state.template.id, format: format };

    const authResponse = await fetch('https://wyfkogowsdbxctbpfuud.supabase.co/functions/v1/authorize-download', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(authBody)
    });

    const authData = await authResponse.json();
    if (!authResponse.ok) {
      throw new Error(authData.message || `Erreur d'autorisation (${authResponse.status})`);
    }

    // Afficher le loader de téléchargement
    const loaderHtml = `
      <div id="download-loader" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10001;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;backdrop-filter:blur(5px);">
        <div style="width:60px;height:60px;border:4px solid rgba(255,255,255,0.3);border-top-color:#FF6B35;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:20px;"></div>
        <h3 style="margin:0 0 8px;font-size:20px;">Génération de votre document...</h3>
        <p style="margin:0;opacity:0.9;">Veuillez patienter, cela peut prendre quelques instants</p>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loaderHtml);

    // Générer le document
    const docResponse = await fetch(`${generatorUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nonce: authData.nonce, 
        template_id: state.template.id, 
        format: format, 
        data: documentData 
      })
    });

    if (!docResponse.ok) {
      const errorText = await docResponse.text();
      throw new Error(`Erreur serveur: ${docResponse.status} - ${errorText}`);
    }

    // Télécharger le fichier
    const blob = await docResponse.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const extension = format === 'pdf' ? 'pdf' : 'docx';
    a.download = `TakiDoc_${(state.template.name || 'document').replace(/[^a-z0-9_-]/gi, '_')}.${extension}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    // Supprimer le loader
    const loader = document.getElementById('download-loader');
    if (loader) loader.remove();

    saveDraft({ quiet: true });
    toast(`Document ${format.toUpperCase()} téléchargé avec succès.`, 'success');
  } catch (error) {
    console.error("Erreur génération:", error);
    
    // Supprimer le loader en cas d'erreur
    const loader = document.getElementById('download-loader');
    if (loader) loader.remove();
    
    toast(error.message || `Erreur lors de la génération du ${format.toUpperCase()}.`, 'error');
  }
}

  // Ajouter les écouteurs d'événements
  setTimeout(() => {
    const emailInput = document.getElementById('pay-email');
    const phoneInput = document.getElementById('pay-phone');
    const operatorMtn = document.getElementById('operator-mtn');
    const operatorAirtel = document.getElementById('operator-airtel');
    const submitBtn = document.getElementById('pay-submit-btn');
    const cancelBtn = document.getElementById('pay-cancel-btn');
    const modal = document.getElementById('takidoc-payment-modal');

    if (emailInput) emailInput.addEventListener('input', checkPayForm);
    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        let val = phoneInput.value.replace(/\D/g, '');
        if (val.length > 9) val = val.slice(0, 9);
        phoneInput.value = val;
        checkPayForm();
      });
    }
    
    if (operatorMtn) operatorMtn.addEventListener('click', () => selectPayOperator('MTN'));
    if (operatorAirtel) operatorAirtel.addEventListener('click', () => selectPayOperator('AIRTEL'));
    if (submitBtn) submitBtn.addEventListener('click', processPayment);
    if (cancelBtn) cancelBtn.addEventListener('click', closePaymentModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'takidoc-payment-modal') closePaymentModal();
      });
    }
    
    if (emailInput) emailInput.focus();
  }, 100);
}

  // Ajouter les écouteurs d'événements
  setTimeout(() => {
    const emailInput = document.getElementById('pay-email');
    const phoneInput = document.getElementById('pay-phone');
    const operatorMtn = document.getElementById('operator-mtn');
    const operatorAirtel = document.getElementById('operator-airtel');
    const submitBtn = document.getElementById('pay-submit-btn');
    const cancelBtn = document.getElementById('pay-cancel-btn');
    const modal = document.getElementById('takidoc-payment-modal');

    if (emailInput) emailInput.addEventListener('input', checkPayForm);
    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        let val = phoneInput.value.replace(/\D/g, '');
        if (val.length > 9) val = val.slice(0, 9);
        phoneInput.value = val;
        checkPayForm();
      });
    }
    
    if (operatorMtn) operatorMtn.addEventListener('click', () => selectPayOperator('MTN'));
    if (operatorAirtel) operatorAirtel.addEventListener('click', () => selectPayOperator('AIRTEL'));
    if (submitBtn) submitBtn.addEventListener('click', processPayment);
    if (cancelBtn) cancelBtn.addEventListener('click', closePaymentModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'takidoc-payment-modal') closePaymentModal();
      });
    }
    
    if (emailInput) emailInput.focus();
  }, 100);


async function initiatePayment() {
  if (!state.template) return;

  // Document gratuit → téléchargement direct
  if (state.template.price === 0) {
    await downloadFromServer();
    return;
  }

  // Vérifier la connexion
  if (!state.user) {
    toast('Veuillez vous connecter pour effectuer un paiement.', 'error');
    // Optionnel : rediriger vers la page de connexion
    // window.location.href = 'auth.html?action=login';
    return;
  }

  // Afficher la modale de paiement
  showPaymentModal();
}

async function generatePDF() {
  if (!state.template) return;
  
  // DEBUG : log du prix du template
  console.log('📄 Template:', state.template.name, '| Prix:', state.template.price, 'XAF');
  
  // 1. Si le document est GRATUIT → téléchargement direct
  if (state.template.price === 0) {
    console.log('✅ Template gratuit → downloadFromServer()');
    await downloadFromServer();
    return;
  }
  
  // 2. Si le document est PAYANT → flux de paiement Yabetoo
  console.log('💰 Template payant → initiatePayment()');
  await initiatePayment();
}


async function downloadFromServer(purchaseToken = null) {
  toast("Génération du PDF en cours...", "info");
  try {
    const documentData = {
      fields: {},
      primary_color: state.colorActive ? state.primaryColor : null,
      photo_data_url: state.photoDataUrl || null,
      font_family: state.fontCustom ? state.fontFamily : null,
      snapshot: {
        html: getCanvas().innerHTML,
        css: getCanvas().querySelectorAll('style').length > 0 
          ? Array.from(getCanvas().querySelectorAll('style')).map(s => s.textContent).join('\n') 
          : null
      }
    };
    state.template.fields.forEach(field => { 
      documentData.fields[field.name] = getFieldValue(field.name); 
    });

    const generatorUrl = 'https://takidoc-generator.onrender.com';
    
    // Obtenir le token de session
    let authToken = SUPABASE_ANON_KEY;
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) authToken = session.access_token;
      } catch (err) {
        console.warn('⚠️ Erreur récupération session:', err);
      }
    }

    // Appeler authorize-download avec purchase_token SI disponible
    const authBody = purchaseToken 
      ? { purchase_token: purchaseToken, format: 'pdf' }
      : { template_id: state.template.id, format: 'pdf' };

    const authResponse = await fetch('https://wyfkogowsdbxctbpfuud.supabase.co/functions/v1/authorize-download', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(authBody)
    });

    const authData = await authResponse.json();
    
    if (!authResponse.ok) {
      console.error('❌ authorize-download erreur:', authResponse.status, authData);
      throw new Error(authData.message || `Erreur d'autorisation (${authResponse.status})`);
    }

    console.log('✅ Nonce obtenu:', authData.nonce?.slice(0, 8) + '...');

    const pdfResponse = await fetch(`${generatorUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nonce: authData.nonce, 
        template_id: state.template.id, 
        format: 'pdf', 
        data: documentData 
      })
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      throw new Error(`Erreur serveur: ${pdfResponse.status} - ${errorText}`);
    }

    const blob = await pdfResponse.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TakiDoc_${(state.template.name || 'document').replace(/[^a-z0-9_-]/gi, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    saveDraft({ quiet: true });
    toast("PDF téléchargé avec succès.", "success");
  } catch (error) {
    console.error("Erreur génération serveur:", error);
    toast(error.message || "Erreur lors de la génération du PDF.", "error");
  }
}

function setupExportControls() {
  const download = event => { event?.preventDefault?.(); generatePDF(); };
  $('#btn-download-pdf')?.addEventListener('click', download);
  $('#header-download-btn')?.addEventListener('click', download);
  $('#mobileBtnDownload')?.addEventListener('click', download);
  $('#btn-download')?.addEventListener('click', download);

  $('#btn-save-draft')?.addEventListener('click', event => { event.preventDefault(); saveDraft(); });

  const loadButton = $('#btn-load-draft');
  if (loadButton) {
    const exists = state.draftKey && localStorage.getItem(state.draftKey);
    loadButton.style.display = exists ? '' : 'none';
    loadButton.addEventListener('click', event => {
      event.preventDefault();
      if (loadDraft()) { refreshPages(); toast("Brouillon restauré.", "success"); }
      else { toast("Aucun brouillon disponible.", "info"); }
    });
  }

  $('#loginModalClose')?.addEventListener('click', () => { $('#loginModal')?.classList.remove('active'); });
  $('#loginModal')?.addEventListener('click', event => {
    if (event.target.id === 'loginModal') event.currentTarget.classList.remove('active');
  });
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveDraft(); }
    if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '=')) { event.preventDefault(); state.zoom = Math.min(2.5, state.zoom + 0.1); updateZoom(); }
    if ((event.ctrlKey || event.metaKey) && event.key === '-') { event.preventDefault(); state.zoom = Math.max(0.3, state.zoom - 0.1); updateZoom(); }
    if (event.key === 'Escape') { $('#loginModal')?.classList.remove('active'); }
  });
  window.addEventListener('beforeunload', event => {
    if (state.isDirty) { saveDraft({ quiet: true }); event.preventDefault(); event.returnValue = ''; }
  });
}

async function initEditor() {
  if (state.initialized) return;
  state.initialized = true;
  try {
    await checkAuth();
    initProtection({ supabase, state, toast });
    const params = new URLSearchParams(window.location.search);
    await loadTemplate(params.get('id') || params.get('template'));
    const template = state.template;
    document.title = `${template.name} - Éditeur TakiDoc`;
    setText('header-doc-title', template.name);
    setText('sidebar-template-name', template.name);
    setText('sidebar-template-desc', template.description || "Document professionnel personnalisable.");
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
    const status = $('#header-doc-status');
    if (status) {
      status.className = 'doc-status';
      status.textContent = restored ? "Brouillon restauré" : "Document prêt";
    }
    toast("Document chargé avec succès.", "success");
  } catch (error) {
    console.error("Initialisation de TakiDoc impossible :", error);
    state.initialized = false;
    toast(error.message || "Erreur de chargement du document.", 'error');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEditor);
} else {
  initEditor();
}