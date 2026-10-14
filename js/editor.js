
/* ============================================
   TAKIDOC — MOTEUR D'ÉDITION PROFESSIONNEL
   Supabase • CSS isolé • A4 • PDF • Brouillons
   Téléchargement actuellement gratuit
============================================ */

const SUPABASE_URL = 'https://wyfkogowsdbxctbpfuud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM';

if (!window.supabase) {
  console.error('TakiDoc : la bibliothèque Supabase n’est pas chargée.');
}
const supabase = window.supabase?.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
) || null;

const BRAND_TEXT =
  'Document personnalisable généré par TakiDoc · www.takidoc.onrender.com';

const state = {
  template: null,
  user: null,
  zoom: 1,
  primaryColor: '#0F172A',
  fontFamily: "'Inter', sans-serif",
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
const getTemplateFieldElement = name =>
  document.getElementById(`field-${name}`);

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
  if (!el) return false;

  const text = (el.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    text.includes('Document personnalisable généré par TakiDoc') ||
    text.includes('www.takidoc.onrender.com') ||
    el.matches('[data-takidoc-brand], .takidoc-brand, #takidoc-brand')
  );
}

function markDirty() {
  state.isDirty = true;

  const status = $('#header-doc-status');
  if (status) {
    status.className = 'doc-status saving';
    status.textContent = 'Modifications en cours…';
  }

  clearTimeout(state.autoSaveTimer);

  state.autoSaveTimer = setTimeout(() => {
    saveDraft({ quiet: true });
  }, 900);
}

/* ============================================
   AUTHENTIFICATION
   Facultative pour le téléchargement gratuit
============================================ */

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

/* ============================================
   CHARGEMENT DU MODÈLE SUPABASE
============================================ */

async function loadTemplate(id) {
  if (!id) {
    throw new Error('Identifiant de document manquant dans l’URL.');
  }

  if (!supabase) {
    throw new Error(
      'Supabase ne s’est pas chargé. Vérifie les scripts dans editor.html.'
    );
  }

  const { data, error } = await supabase
    .from('templates')
    .select(`
      id,
      name,
      description,
      price_xaf,
      category_id,
      has_photo,
      has_color_picker,
      html_structure,
      css_styles,
      template_fields (
        field_name,
        field_label,
        field_type,
        default_value,
        is_required,
        display_order
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Erreur Supabase lors du chargement du modèle :', error);
    throw new Error(`Impossible de charger le modèle : ${error.message}`);
  }

  if (!data) {
    throw new Error('Ce modèle est introuvable ou inactif.');
  }

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

/* ============================================
   ISOLATION CSS DES MODÈLES
============================================ */

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
    selector = selector.replace(/^(html|body|:root)\b/i, root);

    return selector.replace(
      /#document-canvas\s+#document-canvas/g,
      root
    );
  }

  if (selector === '*') return `${root} *`;
  if (selector.startsWith(root)) return selector;

  return `${root} ${selector}`;
}

function scopeCSS(css) {
  css = String(css || '')
    .replace(/^\uFEFF/, '')
    .replace(/<\/?style\b[^>]*>/gi, '')
    .replace(/@import\b[^;]*;?/gi, '');

  let output = '';
  let i = 0;

  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) {
      output += css[i++];
    }

    if (i >= css.length) break;

    const open = css.indexOf('{', i);
    const semicolon = css.indexOf(';', i);

    if (open === -1 || (semicolon !== -1 && semicolon < open)) {
      output += css.slice(
        i,
        semicolon === -1 ? css.length : semicolon + 1
      );

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
        if (char === '*' && next === '/') {
          comment = false;
          j++;
        }
        continue;
      }

      if (!quote && char === '/' && next === '*') {
        comment = true;
        j++;
        continue;
      }

      if (quote) {
        if (char === '\\') j++;
        else if (char === quote) quote = '';
        continue;
      }

      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }

      if (char === '{') depth++;
      if (char === '}') depth--;
    }

    const body = css.slice(open + 1, j - 1);

    if (header.startsWith('@')) {
      if (/^@(media|supports|container|layer|document)\b/i.test(header)) {
        output += `${header}{${scopeCSS(body)}}`;
      } else {
        output += `${header}{${body}}`;
      }
    } else {
      output += `${splitSelectors(header)
        .map(scopeSelector)
        .join(', ')}{${body}}`;
    }

    i = j;
  }

  return output;
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

  const canvas = getCanvas();

  if (canvas) {
    canvas.style.setProperty('--doc-primary-color', state.primaryColor);
    canvas.style.setProperty('--primary-color', state.primaryColor);
    canvas.style.fontFamily = state.fontFamily;
  }

  installColorOverrides();
}

function installColorOverrides() {
  let style = $('#takidoc-color-overrides');

  if (!style) {
    style = document.createElement('style');
    style.id = 'takidoc-color-overrides';
    document.head.appendChild(style);
  }

  style.textContent = `
    #document-canvas {
      --doc-primary-color: ${state.primaryColor};
      --primary-color: ${state.primaryColor};
    }

    #document-canvas .primary,
    #document-canvas .accent,
    #document-canvas .accent-color,
    #document-canvas .section-title,
    #document-canvas .title-accent,
    #document-canvas h1,
    #document-canvas h2 {
      border-color: ${state.primaryColor};
    }

    #document-canvas .text-primary,
    #document-canvas .primary-color,
    #document-canvas .accent-text {
      color: ${state.primaryColor};
    }

    #document-canvas .bg-primary,
    #document-canvas .primary-bg,
    #document-canvas .accent-bg {
      background-color: ${state.primaryColor};
    }
  `;
}

/* ============================================
   RENDU DU DOCUMENT
============================================ */

function renderDocument() {
  const canvas = getCanvas();

  if (!canvas || !state.template) {
    throw new Error('La zone d’aperçu du document est introuvable.');
  }

  canvas.innerHTML = state.template.html ||
    '<div style="padding:40px;text-align:center">Aperçu du document indisponible.</div>';

  installTemplateCSS();

  state.template.fields.forEach(field => {
    const el = getTemplateFieldElement(field.name);

    if (el && field.defaultValue !== '' && !el.textContent.trim()) {
      el.textContent = field.defaultValue;
    }
  });

  const photoSection = $('#design-photo-section');
  const colorSection = $('#design-color-section');

  if (photoSection) {
    photoSection.style.display = state.template.hasPhoto ? '' : 'none';
  }

  if (colorSection) {
    colorSection.style.display = state.template.hasColorPicker ? '' : 'none';
  }

  if (!state.template.hasPhoto) state.photoDataUrl = null;

  if (state.photoDataUrl) {
    updateDocumentPhoto(state.photoDataUrl);
  }

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

    if (input && element && input.value !== '') {
      element.textContent = input.value;
    }
  });
}

/* ============================================
   FORMULAIRE DES CHAMPS
============================================ */

function buildFieldsForm() {
  const container = $('#fields-form');

  if (!container || !state.template) return;

  container.replaceChildren();

  if (!state.template.fields.length) {
    const message = document.createElement('p');

    message.textContent =
      'Ce document ne contient aucun champ personnalisable. Vous pouvez modifier directement les textes dans l’aperçu.';

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

      if (target && !isBrandElement(target)) {
        target.textContent = input.value;
      }

      markDirty();
    });

    wrapper.append(label, input);
    container.appendChild(wrapper);
  });
}

/* ============================================
   ÉDITION DIRECTE DES TEXTES
============================================ */

function enableFieldEditing() {
  const canvas = getCanvas();
  if (!canvas) return;

  $$('[contenteditable="true"]', canvas).forEach(el => {
    el.contentEditable = 'false';
    el.classList.remove('direct-editable');
  });

  const protectedSelector =
    'script,style,svg,path,button,input,textarea,select,option,img,iframe,video,audio,br,hr';

  const nodes = $$('*', canvas).filter(el => {
    if (el.matches(protectedSelector) || el.closest(protectedSelector)) {
      return false;
    }

    if (isBrandElement(el)) return false;

    const hasElementChildren = [...el.children].some(
      child => !child.matches('br')
    );

    return !hasElementChildren &&
      (el.textContent || '').trim().length > 0;
  });

  (state.template?.fields || []).forEach(field => {
    const el = getTemplateFieldElement(field.name);

    if (el && !isBrandElement(el) && !el.matches(protectedSelector)) {
      nodes.push(el);
    }
  });

  [...new Set(nodes)].forEach((el, index) => {
    if (isBrandElement(el)) return;

    if (!el.dataset.takidocEditId) {
      const field = (state.template?.fields || []).find(
        item => getTemplateFieldElement(item.name) === el
      );

      el.dataset.takidocEditId = field
        ? `field-${field.name}`
        : `text-${index}`;
    }

    el.contentEditable = 'true';
    el.classList.add('direct-editable');
    el.spellcheck = true;
    el.setAttribute('aria-label', 'Texte modifiable du document');

    el.oninput = () => {
      const field = (state.template?.fields || []).find(
        item => getTemplateFieldElement(item.name) === el
      );

      if (field) {
        const input = document.getElementById(`input-${field.name}`);
        if (input) input.value = el.textContent;
      }

      markDirty();
    };
  });
}

/* ============================================
   PHOTO
============================================ */

function updateDocumentPhoto(dataUrl) {
  if (!state.template?.hasPhoto) return;

  const canvas = getCanvas() || document;

  let container = $('#doc-photo', canvas);

  if (!container) {
    container = $(
      '[data-photo-placeholder], .doc-photo, .cv-photo, .photo-placeholder',
      canvas
    );
  }

  if (!container) {
    console.warn(
      'Ce modèle est marqué comme compatible avec une photo, mais aucun emplacement #doc-photo ou .doc-photo n’a été trouvé dans son HTML.'
    );
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

    reader.onerror = () => {
      toast('Impossible de lire cette image.', 'error');
    };

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

/* ============================================
   COULEURS ET TYPOGRAPHIE
============================================ */

function applyPrimaryColor(color) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return;

  state.primaryColor = color.toUpperCase();

  const canvas = getCanvas();

  if (canvas) {
    canvas.style.setProperty('--doc-primary-color', state.primaryColor);
    canvas.style.setProperty('--primary-color', state.primaryColor);
  }

  const picker = $('#color-picker');
  const hex = $('#color-hex');

  if (picker) picker.value = state.primaryColor;
  if (hex) hex.textContent = state.primaryColor;

  $$('.color-preset').forEach(button => {
    button.classList.toggle(
      'active',
      (button.dataset.color || '').toUpperCase() === state.primaryColor
    );
  });

  installColorOverrides();
  markDirty();
}

function applyFontFamily() {
  const canvas = getCanvas();
  if (!canvas) return;

  canvas.style.fontFamily = state.fontFamily;

  let style = $('#takidoc-font-overrides');

  if (!style) {
    style = document.createElement('style');
    style.id = 'takidoc-font-overrides';
    document.head.appendChild(style);
  }

  style.textContent = `
    #document-canvas,
    #document-canvas :not(i):not(svg):not(path) {
      font-family: ${state.fontFamily} !important;
    }
  `;
}

function setupDesignControls() {
  $('#color-picker')?.addEventListener('input', event => {
    applyPrimaryColor(event.target.value);
  });

  $$('.color-preset').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();

      if (button.dataset.color) {
        applyPrimaryColor(button.dataset.color);
      }
    });
  });

  $('#font-family-select')?.addEventListener('change', event => {
    state.fontFamily = event.target.value || "'Inter', sans-serif";

    applyFontFamily();
    markDirty();
  });
}

/* ============================================
   ZOOM
============================================ */

function updateZoom() {
  const wrapper = $('#document-wrapper');

  if (wrapper) {
    wrapper.style.transform = `scale(${state.zoom})`;
    wrapper.style.transformOrigin = 'top center';
  }

  setText('zoom-level', `${Math.round(state.zoom * 100)}%`);
}

function fitZoom() {
  const container = $('.preview-container');
  const canvas = getCanvas();

  if (!container || !canvas) {
    return window.innerWidth <= 768 ? 0.48 : 0.85;
  }

  const available = Math.max(220, container.clientWidth - 36);
  const canvasWidth =
    canvas.getBoundingClientRect().width || canvas.offsetWidth || 794;

  return Math.max(0.3, Math.min(1.2, available / canvasWidth));
}

function setupZoomControls() {
  state.zoom = fitZoom();

  $('#btn-zoom-in')?.addEventListener('click', () => {
    state.zoom = Math.min(2.5, state.zoom + 0.1);
    updateZoom();
  });

  $('#btn-zoom-out')?.addEventListener('click', () => {
    state.zoom = Math.max(0.3, state.zoom - 0.1);
    updateZoom();
  });

  $('#btn-zoom-fit')?.addEventListener('click', () => {
    state.zoom = fitZoom();
    updateZoom();
  });

  window.addEventListener('resize', () => {
    if (state.zoom < 0.6) {
      state.zoom = fitZoom();
      updateZoom();
    }
  });

  updateZoom();
}

/* ============================================
   ONGLETS ET PANNEAU MOBILE
============================================ */

function setupSidebarTabs() {
  $$('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      $$('.tab-btn').forEach(item => {
        item.classList.toggle('active', item === button);
      });

      $$('.tab-pane').forEach(item => {
        item.classList.toggle(
          'active',
          item.id === `tab-${button.dataset.tab}`
        );
      });
    });
  });

  const toggle = $('#mobileSidebarToggle');
  const sidebar = $('#editorSidebar');

  toggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });

  $('#mobileBtnCustomize')?.addEventListener('click', () => {
    sidebar?.classList.add('open');

    const fieldsTab = $('.tab-btn[data-tab="fields"]');
    fieldsTab?.click();
  });
}

/* ============================================
   BROUILLONS LOCAUX
============================================ */

function collectDraft() {
  const fields = {};

  state.template?.fields.forEach(field => {
    fields[field.name] = getFieldValue(field.name);
  });

  const directTexts = {};
  const canvas = getCanvas();

  if (canvas) {
    $$('[contenteditable="true"]', canvas).forEach((el, index) => {
      if (!isBrandElement(el)) {
        const id = el.dataset.takidocEditId ||
          (el.dataset.takidocEditId = `text-${index}`);

        directTexts[id] = el.textContent;
      }
    });
  }

  return {
    version: 2,
    timestamp: Date.now(),
    fields,
    directTexts,
    photoDataUrl: state.photoDataUrl,
    primaryColor: state.primaryColor,
    fontFamily: state.fontFamily
  };
}

function saveDraft(options = {}) {
  if (!state.draftKey) return false;

  try {
    localStorage.setItem(
      state.draftKey,
      JSON.stringify(collectDraft())
    );

    state.isDirty = false;

    const status = $('#header-doc-status');

    if (status) {
      status.className = 'doc-status';
      status.textContent = 'Modifications sauvegardées';
    }

    if (!options.quiet) {
      toast('Brouillon sauvegardé sur cet appareil.', 'success');
    }

    return true;
  } catch (error) {
    console.error('Sauvegarde du brouillon impossible :', error);

    if (!options.quiet) {
      toast('Stockage local plein. Essaie une photo plus légère.', 'error');
    }

    return false;
  }
}

function loadDraft() {
  if (!state.draftKey) return false;

  try {
    const raw = localStorage.getItem(state.draftKey);
    if (!raw) return false;

    const draft = JSON.parse(raw);

    Object.entries(draft.fields || {}).forEach(([name, value]) => {
      setFieldValue(name, value);
    });

    const canvas = getCanvas();

    if (canvas && draft.directTexts) {
      Object.entries(draft.directTexts).forEach(([id, value]) => {
        const el = $$('[contenteditable="true"]', canvas).find(
          node => node.dataset.takidocEditId === id
        );

        if (el && !isBrandElement(el)) {
          el.textContent = value;
        }
      });
    }

    if (draft.primaryColor) {
      applyPrimaryColor(draft.primaryColor);
    }

    if (draft.fontFamily) {
      state.fontFamily = draft.fontFamily;

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
   EXPORT PDF A4 — GRATUIT
============================================ */

async function generatePDF() {
  const canvas = getCanvas();

  if (!canvas || !state.template) {
    toast('Document introuvable.', 'error');
    return;
  }

  if (!window.html2canvas || !window.jspdf?.jsPDF) {
    toast('Les bibliothèques PDF ne sont pas chargées.', 'error');
    return;
  }

  toast('Préparation du PDF…', 'info');

  const wrapper = $('#document-wrapper');
  const originalTransform = wrapper?.style.transform || '';
  const editable = $$('[contenteditable="true"]', canvas);
  const originalContentEditable = editable.map(el => el.contentEditable);

  try {
    editable.forEach(el => {
      el.contentEditable = 'false';
    });

    if (wrapper) wrapper.style.transform = 'none';

    await Promise.all(
      $$('img', canvas).map(img => {
        if (img.complete) return Promise.resolve();

        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const imageCanvas = await window.html2canvas(canvas, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: canvas.scrollWidth,
      height: canvas.scrollHeight,
      windowWidth: Math.max(
        document.documentElement.clientWidth,
        canvas.scrollWidth
      )
    });

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;

    const ratio = Math.min(
      pageWidth / imageCanvas.width,
      pageHeight / imageCanvas.height
    );

    const width = imageCanvas.width * ratio;
    const height = imageCanvas.height * ratio;

    pdf.addImage(
      imageCanvas.toDataURL('image/jpeg', 0.96),
      'JPEG',
      (pageWidth - width) / 2,
      0,
      width,
      height
    );

    const safeName = (state.template.name || 'document')
      .replace(/[^a-z0-9_-]/gi, '_');

    pdf.save(`TakiDoc_${safeName}.pdf`);

    // Aucun achat fictif n’est créé :
    // le téléchargement est gratuit pendant la construction du site.
    saveDraft({ quiet: true });

    toast('PDF téléchargé avec succès.', 'success');
  } catch (error) {
    console.error('Erreur pendant la génération du PDF :', error);
    toast('Erreur pendant la génération du PDF. Réessaie.', 'error');
  } finally {
    if (wrapper) wrapper.style.transform = originalTransform;

    editable.forEach((el, index) => {
      el.contentEditable = originalContentEditable[index] || 'true';
    });
  }
}

function setupExportControls() {
  const download = event => {
    event?.preventDefault?.();
    generatePDF();
  };

  $('#btn-download-pdf')?.addEventListener('click', download);
  $('#header-download-btn')?.addEventListener('click', download);
  $('#mobileBtnDownload')?.addEventListener('click', download);

  $('#btn-save-draft')?.addEventListener('click', event => {
    event.preventDefault();
    saveDraft();
  });

  const loadButton = $('#btn-load-draft');

  if (loadButton) {
    const exists = state.draftKey &&
      localStorage.getItem(state.draftKey);

    loadButton.style.display = exists ? '' : 'none';

    loadButton.addEventListener('click', event => {
      event.preventDefault();

      if (loadDraft()) {
        toast('Brouillon restauré.', 'success');
      } else {
        toast('Aucun brouillon disponible.', 'info');
      }
    });
  }

  $('#loginModalClose')?.addEventListener('click', () => {
    $('#loginModal')?.classList.remove('active');
  });

  $('#loginModal')?.addEventListener('click', event => {
    if (event.target.id === 'loginModal') {
      event.currentTarget.classList.remove('active');
    }
  });
}

/* ============================================
   RACCOURCIS CLAVIER
============================================ */

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', event => {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === 's'
    ) {
      event.preventDefault();
      saveDraft();
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === '+' || event.key === '=')
    ) {
      event.preventDefault();
      state.zoom = Math.min(2.5, state.zoom + 0.1);
      updateZoom();
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === '-'
    ) {
      event.preventDefault();
      state.zoom = Math.max(0.3, state.zoom - 0.1);
      updateZoom();
    }

    if (event.key === 'Escape') {
      $('#loginModal')?.classList.remove('active');
    }
  });

  window.addEventListener('beforeunload', event => {
    if (state.isDirty) {
      saveDraft({ quiet: true });
      event.preventDefault();
      event.returnValue = '';
    }
  });
}

/* ============================================
   INITIALISATION
============================================ */

async function initEditor() {
  if (state.initialized) return;

  state.initialized = true;

  try {
    await checkAuth();

    const params = new URLSearchParams(window.location.search);

    await loadTemplate(params.get('id'));

    const template = state.template;

    document.title = `${template.name} - Éditeur TakiDoc`;

    setText('header-doc-title', template.name);
    setText('sidebar-template-name', template.name);

    setText(
      'sidebar-template-desc',
      template.description || 'Document professionnel personnalisable.'
    );

    renderDocument();
    buildFieldsForm();
    setupDesignControls();
    setupPhotoUpload();
    setupZoomControls();
    setupSidebarTabs();
    setupExportControls();
    setupKeyboardShortcuts();

    const restored = loadDraft();

    // Réactiver l’édition après la restauration du brouillon.
    applySavedFieldValues();
    enableFieldEditing();

    state.isDirty = false;

    const status = $('#header-doc-status');

    if (status) {
      status.className = 'doc-status';
      status.textContent = restored
        ? 'Brouillon restauré'
        : 'Document prêt';
    }

    toast('Document chargé avec succès.', 'success');
  } catch (error) {
    console.error('Initialisation de TakiDoc impossible :', error);

    state.initialized = false;

    toast(
      error.message || 'Erreur de chargement du document.',
      'error'
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEditor);
} else {
  initEditor();
}
