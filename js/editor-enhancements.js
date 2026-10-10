/* TakiDoc — améliorations autonomes de l'éditeur.
   Ne remplace pas js/editor.js et n'intervient pas dans le paiement ou le rendu initial. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const canvas = () => $('#document-canvas');
  const sectionNames = new Set();
  let sectionCounter = 0;

  function initColorControls() {
    const section = $('#color-section');
    const picker = $('#color-picker');
    const target = canvas();
    if (!section || !picker || !target) return;
    section.style.display = 'block';
    section.querySelector('h3').innerHTML = '<i class="fas fa-palette"></i> Couleurs du document';
    if (!$('#color-help')) {
      const help = document.createElement('p');
      help.id = 'color-help';
      help.className = 'editor-hint';
      help.textContent = 'Choisissez une couleur pour les accents, titres et éléments principaux compatibles avec ce modèle.';
      picker.insertAdjacentElement('afterend', help);
    }
    const apply = color => {
      if (!/^#[0-9a-f]{6}$/i.test(color)) return;
      picker.value = color;
      target.style.setProperty('--doc-primary-color', color);
      target.style.setProperty('--primary-color', color);
      target.style.setProperty('--accent-color', color);
      target.style.setProperty('--theme-color', color);
      // Certaines maquettes utilisent des couleurs en dur : ne recolore que les accents identifiables.
      $$('[data-takidoc-accent]', target).forEach(el => { el.style.color = color; });
      $$('.color-preset', section).forEach(b => {
        b.setAttribute('aria-pressed', String(b.dataset.color?.toLowerCase() === color.toLowerCase()));
      });
    };
    if (!picker.dataset.enhanced) {
      picker.dataset.enhanced = '1';
      picker.addEventListener('input', () => apply(picker.value));
      $$('.color-preset', section).forEach(button => {
        button.type = 'button';
        button.setAttribute('aria-label', `Appliquer la couleur ${button.dataset.color || ''}`);
        button.addEventListener('click', () => apply(button.dataset.color || picker.value));
      });
    }
    apply(picker.value || '#0F172A');
  }

  function getHeadingBlocks() {
    const root = canvas();
    if (!root) return [];
    const headings = $$('h1,h2,h3,h4,h5,h6', root).filter(h => h.textContent.trim());
    return headings.map((heading, index) => {
      // Les sections personnalisées ont une cible explicite, donc leur suppression est toujours sûre.
      if (heading.closest('[data-takidoc-custom-section]')) {
        return { heading, block: heading.closest('[data-takidoc-custom-section]'), title: heading.textContent.trim(), custom: true, index };
      }
      // Détecter un bloc de section raisonnable sans jamais proposer de supprimer tout le document.
      const semanticBlock = heading.closest('section, article, [data-section], .document-section, .section-block');
      const parent = heading.parentElement;
      let block = semanticBlock && semanticBlock !== root ? semanticBlock : null;
      if (!block && parent && parent !== root && parent.children.length >= 2 && parent.children.length <= 5) {
        block = parent;
      }
      // Refuser les conteneurs trop larges : la sécurité du modèle prime sur la suppression.
      if (block && (block === root || block.contains(root) || block.textContent.trim().length > 4500)) block = null;
      return { heading, block, title: heading.textContent.trim(), custom: false, index };
    });
  }

  function ensureSectionManager() {
    const fieldsSection = $('#fields-section');
    if (!fieldsSection || $('#section-manager')) return;
    const panel = document.createElement('section');
    panel.id = 'section-manager';
    panel.className = 'sidebar-section section-manager';
    panel.innerHTML = `
      <h3><i class="fas fa-layer-group"></i> Sections du document</h3>
      <p class="editor-hint">Ajoutez vos propres rubriques ou retirez une section. Les modifications restent dans l’aperçu et le PDF de cette session.</p>
      <div id="section-list" class="section-list" aria-live="polite"></div>
      <form id="add-section-form" class="add-section-form">
        <label for="new-section-title">Nouvelle section</label>
        <input id="new-section-title" type="text" maxlength="60" placeholder="Ex. : Réalisations" required>
        <textarea id="new-section-content" rows="3" maxlength="1200" placeholder="Saisissez le contenu de cette rubrique…"></textarea>
        <button class="btn btn-primary btn-full" type="submit"><i class="fas fa-plus"></i> Ajouter la section</button>
      </form>`;
    fieldsSection.insertAdjacentElement('afterend', panel);
    $('#add-section-form', panel).addEventListener('submit', event => {
      event.preventDefault();
      const titleInput = $('#new-section-title');
      const contentInput = $('#new-section-content');
      const title = titleInput.value.trim();
      const content = contentInput.value.trim();
      if (!title) { titleInput.focus(); return; }
      const root = canvas();
      if (!root) return;
      const block = document.createElement('section');
      block.className = 'takidoc-custom-section';
      block.dataset.takidocCustomSection = 'true';
      block.dataset.sectionId = `custom-section-${++sectionCounter}`;
      const heading = document.createElement('h2');
      heading.textContent = title;
      heading.contentEditable = 'true';
      heading.setAttribute('aria-label', 'Titre de la section, modifiable');
      const paragraph = document.createElement('p');
      paragraph.contentEditable = 'true';
      paragraph.setAttribute('aria-label', 'Contenu de la section, modifiable');
      paragraph.textContent = content || 'Cliquez ici pour saisir le contenu.';
      block.append(heading, paragraph);
      root.appendChild(block);
      titleInput.value = '';
      contentInput.value = '';
      refreshSectionList();
      paragraph.focus();
    });
    refreshSectionList();
  }

  function refreshSectionList() {
    const list = $('#section-list');
    if (!list) return;
    list.replaceChildren();
    const sections = getHeadingBlocks();
    if (!sections.length) {
      const empty = document.createElement('p');
      empty.className = 'editor-hint';
      empty.textContent = 'Aucune rubrique détectée dans ce modèle. Vous pouvez en ajouter ci-dessous.';
      list.appendChild(empty);
      return;
    }
    sections.forEach(({ heading, block, title, custom }, index) => {
      const row = document.createElement('div');
      row.className = 'section-list-row';
      const label = document.createElement('span');
      label.className = 'section-list-title';
      label.textContent = title;
      label.title = title;
      const actions = document.createElement('div');
      actions.className = 'section-list-actions';
      const focus = document.createElement('button');
      focus.type = 'button'; focus.className = 'section-action section-focus';
      focus.title = 'Afficher cette section'; focus.setAttribute('aria-label', `Afficher ${title}`);
      focus.innerHTML = '<i class="fas fa-eye"></i>';
      focus.addEventListener('click', () => {
        heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
        heading.focus?.({ preventScroll: true });
        heading.style.outline = '2px solid var(--primary)';
        setTimeout(() => { heading.style.outline = ''; }, 1200);
      });
      actions.appendChild(focus);
      if (block) {
        const remove = document.createElement('button');
        remove.type = 'button'; remove.className = 'section-action section-remove';
        remove.title = 'Supprimer cette section'; remove.setAttribute('aria-label', `Supprimer ${title}`);
        remove.innerHTML = '<i class="fas fa-trash-alt"></i>';
        remove.addEventListener('click', () => {
          if (!window.confirm(`Supprimer la section « ${heading.textContent.trim()} » ? Cette action retire son contenu de l’aperçu.`)) return;
          block.remove(); refreshSectionList();
        });
        actions.appendChild(remove);
      } else {
        const hint = document.createElement('span');
        hint.className = 'section-lock'; hint.title = 'Bloc non supprimable automatiquement pour éviter d’endommager la mise en page de ce modèle.';
        hint.innerHTML = '<i class="fas fa-lock"></i>';
        actions.appendChild(hint);
      }
      row.append(label, actions);
      list.appendChild(row);
    });
  }

  function addInlineFieldTools() {
    const container = $('#fields-container');
    if (!container || container.dataset.toolsAdded) return;
    container.dataset.toolsAdded = '1';
    const observer = new MutationObserver(() => {
      $$('.form-field', container).forEach(field => {
        if ($('.field-inline-tools', field)) return;
        const input = $('input,textarea', field);
        const label = $('label', field);
        if (!input || !label) return;
        const line = document.createElement('div');
        line.className = 'field-input-row';
        const tools = document.createElement('div');
        tools.className = 'field-inline-tools';
        const copy = document.createElement('button');
        copy.type = 'button'; copy.className = 'field-tool'; copy.title = 'Effacer le champ';
        copy.setAttribute('aria-label', `Effacer ${label.textContent}`); copy.innerHTML = '<i class="fas fa-eraser"></i>';
        copy.addEventListener('click', () => { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); });
        tools.appendChild(copy);
        input.parentNode.insertBefore(line, input);
        line.append(tools, input);
      });
    });
    observer.observe(container, { childList: true, subtree: true });
    observer.takeRecords();
    $$('.form-field', container).forEach(field => {
      const input = $('input,textarea', field); const label = $('label', field);
      if (!input || !label || $('.field-input-row', field)) return;
      const line = document.createElement('div'); line.className = 'field-input-row';
      const tools = document.createElement('div'); tools.className = 'field-inline-tools';
      const clear = document.createElement('button'); clear.type = 'button'; clear.className = 'field-tool'; clear.title = 'Effacer le champ'; clear.setAttribute('aria-label', `Effacer ${label.textContent}`); clear.innerHTML = '<i class="fas fa-eraser"></i>';
      clear.addEventListener('click', () => { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); });
      tools.appendChild(clear); input.parentNode.insertBefore(line, input); line.append(tools, input);
    });
  }

  function observeCanvas() {
    const root = canvas();
    if (!root || root.dataset.enhancementsObserved) return;
    root.dataset.enhancementsObserved = '1';
    const observer = new MutationObserver(() => refreshSectionList());
    observer.observe(root, { childList: true, subtree: true });
  }

  function init() {
    if (!$('#editor-interface')) return;
    initColorControls();
    ensureSectionManager();
    addInlineFieldTools();
    observeCanvas();
    // editor.js rend le document de façon asynchrone après la lecture du modèle.
    const interfaceObserver = new MutationObserver(() => {
      if (canvas()?.children.length) {
        initColorControls(); ensureSectionManager(); addInlineFieldTools(); refreshSectionList(); observeCanvas();
      }
    });
    interfaceObserver.observe($('#editor-interface'), { childList: true, subtree: true });
    setTimeout(() => { initColorControls(); ensureSectionManager(); addInlineFieldTools(); refreshSectionList(); observeCanvas(); }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
