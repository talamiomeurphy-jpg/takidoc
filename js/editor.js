// ============================================
// TAKIDOC - ÉDITEUR PLEIN ÉCRAN (VERSION CORRIGÉE)
// L'équipe Meurphy - 2026
// ============================================

import { fetchTemplateById } from './supabase-config.js';
import { templatesRegistry } from './templates-registry.js';

const SUPABASE_URL = 'https://wyfkogowsdbxctbpfuud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const editorState = {
    template: null,
    zoom: window.innerWidth <= 768 ? 0.45 : 0.95,
    primaryColor: '#0F172A',
    photoDataUrl: null,
    currentUser: null
};

// ============================================
// UTILITAIRES
// ============================================
function showToast(message) {
    const toast = document.getElementById('editorToast');
    if (!toast) return;
    toast.innerHTML = `<i class="fas fa-check-circle" style="color: #10B981;"></i> ${message}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// AUTHENTIFICATION
// ============================================
async function checkAuth() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        editorState.currentUser = session?.user || null;
        console.log('Auth status:', editorState.currentUser ? 'Connecté' : 'Non connecté');
    } catch (error) {
        console.error('Erreur auth:', error);
    }
}

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation de l\'éditeur...');
    
    await checkAuth();
    
    const templateId = new URLSearchParams(window.location.search).get('id');
    console.log('Template ID:', templateId);
    
    if (!templateId) {
        console.error('Aucun ID de template dans l\'URL');
        showToast('Erreur: Aucun document spécifié');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    let template = templatesRegistry.find(t => t.id === templateId);
    
    if (!template) {
        console.warn('Template non trouvé dans le registre local, tentative de récupération Supabase...');
        try {
            // template = await fetchTemplateById(templateId);
        } catch (e) {
            console.error('Erreur fetch template:', e);
        }
    }
    
    if (!template) {
        console.error('Template introuvable:', templateId);
        showToast('Document introuvable');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    console.log('✅ Template chargé:', template.name);
    editorState.template = template;
    initEditor();
});

function initEditor() {
    const { template } = editorState;
    
    // Mettre à jour le titre
    document.title = `${template.name} - Éditeur TakiDoc`;
    
    console.log(' Rendu du document...');
    renderDocument();
    
    console.log(' Construction des champs...');
    buildSidebarFields(template.fields || []);
    
    console.log('🔍 Configuration du zoom...');
    setupZoomControls();
    
    console.log(' Configuration de la sidebar...');
    setupSidebar();
    
    console.log('💾 Configuration du téléchargement...');
    setupDownload();
    
    console.log(' Configuration des boutons mobiles...');
    setupMobileFABs();
    
    if (template.hasPhoto) {
        console.log(' Configuration de la photo...');
        document.getElementById('photo-section').style.display = 'block';
        setupPhotoUpload();
    }
    
    if (template.hasColorPicker) {
        console.log('🎨 Configuration des couleurs...');
        document.getElementById('color-section').style.display = 'block';
        setupColorPicker();
    }
    
    setTimeout(() => {
        updateZoomDisplay();
        enableDirectEditing();
        showToast('Document chargé - Cliquez sur un texte pour modifier');
    }, 500);
}

// ============================================
// RENDU DU DOCUMENT
// ============================================
function renderDocument() {
    const canvas = document.getElementById('document-canvas');
    const { template } = editorState;
    
    if (!canvas) {
        console.error('Canvas non trouvé!');
        return;
    }
    
    // Styles
    let styleTag = document.getElementById('template-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'template-style';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent = template.cssStyles || '';
    
    // Contenu HTML
    canvas.innerHTML = template.htmlStructure || '<p style="padding: 40px; text-align: center; color: #64748B;">Aperçu non disponible</p>';
    
    // Champs par défaut
    if (template.fields) {
        template.fields.forEach(field => {
            const el = document.getElementById(`field-${field.name}`);
            if (el && field.default) {
                el.textContent = field.default;
            }
        });
    }
    
    // Photo placeholder
    if (template.hasPhoto) {
        const photoContainer = document.getElementById('doc-photo');
        if (photoContainer && !photoContainer.querySelector('img')) {
            photoContainer.innerHTML = `<span class="cv-photo-placeholder" style="font-size: 2rem; font-weight: 700; color: white; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">TD</span>`;
        }
    }
    
    console.log('✅ Document rendu');
}

// ============================================
// SIDEBAR
// ============================================
function setupSidebar() {
    const sidebar = document.getElementById('customizationSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const close = document.getElementById('sidebarClose');
    
    if (!sidebar || !overlay) {
        console.error('Sidebar ou overlay non trouvé');
        return;
    }
    
    // Fonction pour ouvrir
    window.openCustomizationSidebar = function() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        console.log('Sidebar ouverte');
    };
    
    // Fonction pour fermer
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
    
    // Événement sur le bouton du header (via delegation)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#btn-customize, #mobileBtnCustomize');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            window.openCustomizationSidebar();
        }
    });
    
    overlay.addEventListener('click', closeSidebar);
    if (close) close.addEventListener('click', closeSidebar);
    
    console.log('✅ Sidebar configurée');
}

// ============================================
// CHAMPS
// ============================================
function buildSidebarFields(fields) {
    const container = document.getElementById('fields-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!fields || fields.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Aucun champ à modifier pour ce document</p>';
        return;
    }
    
    fields.forEach(field => {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-field';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        wrapper.appendChild(label);
        
        const input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
        
        if (field.type !== 'textarea') {
            input.type = field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text';
        }
        
        input.id = `input-${field.name}`;
        const defaultValue = field.default || '';
        
        if (field.type === 'textarea') {
            input.textContent = defaultValue;
            input.rows = 3;
        } else {
            input.value = defaultValue;
        }
        
        input.addEventListener('input', (e) => {
            const targetEl = document.getElementById(`field-${field.name}`);
            if (targetEl) {
                targetEl.textContent = e.target.value;
            }
        });
        
        wrapper.appendChild(input);
        container.appendChild(wrapper);
    });
    
    console.log(`✅ ${fields.length} champs créés`);
}

// ============================================
// ZOOM
// ============================================
function updateZoomDisplay() {
    const wrapper = document.getElementById('documentWrapper');
    if (!wrapper) return;
    
    wrapper.style.transform = `scale(${editorState.zoom})`;
    
    const zoomLevel = document.getElementById('zoom-level');
    if (zoomLevel) {
        zoomLevel.textContent = `${Math.round(editorState.zoom * 100)}%`;
    }
}

function setupZoomControls() {
    const zoomIn = document.getElementById('btn-zoom-in');
    const zoomOut = document.getElementById('btn-zoom-out');
    const zoomReset = document.getElementById('btn-zoom-reset');
    
    if (zoomIn) {
        zoomIn.addEventListener('click', () => {
            editorState.zoom = Math.min(3, +(editorState.zoom + 0.1).toFixed(2));
            updateZoomDisplay();
        });
    }
    
    if (zoomOut) {
        zoomOut.addEventListener('click', () => {
            editorState.zoom = Math.max(0.2, +(editorState.zoom - 0.1).toFixed(2));
            updateZoomDisplay();
        });
    }
    
    if (zoomReset) {
        zoomReset.addEventListener('click', () => {
            editorState.zoom = window.innerWidth <= 768 ? 0.45 : 0.95;
            updateZoomDisplay();
        });
    }
    
    console.log('✅ Contrôles de zoom configurés');
}

// ============================================
// TÉLÉCHARGEMENT
// ============================================
function setupDownload() {
    const btn = document.getElementById('btn-download');
    if (!btn) {
        console.warn('Bouton téléchargement non trouvé');
        return;
    }
    
    btn.addEventListener('click', async () => {
        console.log('Bouton téléchargement cliqué');
        
        if (!editorState.currentUser) {
            console.log('Utilisateur non connecté, affichage de la modal');
            const modal = document.getElementById('loginModal');
            if (modal) {
                modal.classList.add('active');
                
                // Attendre que l'utilisateur ferme la modal
                await new Promise(resolve => {
                    const closeModal = () => {
                        modal.classList.remove('active');
                        document.getElementById('loginModalClose')?.removeEventListener('click', closeModal);
                        resolve();
                    };
                    document.getElementById('loginModalClose')?.addEventListener('click', closeModal);
                });
            }
        }
        
        await generatePDF();
    });
}

async function generatePDF() {
    const canvas = document.getElementById('document-canvas');
    if (!canvas) {
        showToast('Erreur: Canvas non trouvé');
        return;
    }
    
    try {
        showToast('Génération du PDF...');
        
        // Désactiver l'édition temporaire
        const editableElements = canvas.querySelectorAll('[contenteditable="true"]');
        editableElements.forEach(el => el.contentEditable = 'false');
        
        // Reset zoom pour le PDF
        const prevZoom = editorState.zoom;
        editorState.zoom = 1.0;
        updateZoomDisplay();
        await new Promise(r => setTimeout(r, 300));

        const canvasImage = await html2canvas(canvas, { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff',
            logging: false
        });
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ 
            orientation: 'portrait', 
            unit: 'mm', 
            format: 'a4' 
        });
        
        pdf.addImage(
            canvasImage.toDataURL('image/jpeg', 0.98), 
            'JPEG', 
            0, 0, 
            pdf.internal.pageSize.getWidth(), 
            pdf.internal.pageSize.getHeight()
        );
        
        const filename = `TakiDoc_${editorState.template.id}_${Date.now()}.pdf`;
        pdf.save(filename);
        
        // Réactiver l'édition
        editableElements.forEach(el => el.contentEditable = 'true');
        editorState.zoom = prevZoom;
        updateZoomDisplay();
        
        showToast('PDF téléchargé avec succès !');
        console.log('✅ PDF généré:', filename);
    } catch (e) {
        console.error('Erreur PDF:', e);
        showToast('Erreur lors de la génération du PDF');
    }
}

// ============================================
// BOUTONS FLOTTANTS MOBILE
// ============================================
function setupMobileFABs() {
    const customizeBtn = document.getElementById('mobileBtnCustomize');
    const downloadBtn = document.getElementById('mobileBtnDownload');
    
    if (customizeBtn) {
        customizeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.openCustomizationSidebar?.();
        });
        
        customizeBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            window.openCustomizationSidebar?.();
        });
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('btn-download')?.click();
        });
    }
    
    console.log('✅ Boutons mobiles configurés');
}

// ============================================
// ÉDITION DIRECTE
// ============================================
function enableDirectEditing() {
    const canvas = document.getElementById('document-canvas');
    if (!canvas) return;

    let editableCount = 0;
    const protectedKeywords = ['TakiDoc', 'onrender.com', 'takidoc'];

    const treeWalker = document.createTreeWalker(
        canvas,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
                const parent = node.parentElement;
                if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let textNode;
    while (textNode = treeWalker.nextNode()) {
        const parent = textNode.parentElement;
        if (!parent) continue;
        
        // Vérifier si protégé
        const parentText = parent.textContent.trim().toLowerCase();
        if (protectedKeywords.some(keyword => parentText.includes(keyword))) {
            parent.contentEditable = 'false';
            parent.classList.add('takidoc-footer-protected');
            continue;
        }
        
        if (parent.children.length > 5) continue;
        
        parent.contentEditable = 'true';
        parent.classList.add('direct-editable');
        editableCount++;
        
        // Sync avec sidebar
        if (parent.id && parent.id.startsWith('field-')) {
            const fieldName = parent.id.replace('field-', '');
            const sidebarInput = document.getElementById(`input-${fieldName}`);
            
            if (sidebarInput) {
                parent.addEventListener('input', () => {
                    sidebarInput.value = parent.textContent;
                });
            }
        }
    }
    
    console.log(`✅ Édition activée sur ${editableCount} éléments`);
}

// ============================================
// PHOTO
// ============================================
function setupPhotoUpload() {
    const input = document.getElementById('photo-input');
    if (!input) return;
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            editorState.photoDataUrl = event.target.result;
            const container = document.getElementById('doc-photo');
            if (container) {
                container.innerHTML = `<img src="${editorState.photoDataUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="Photo de profil">`;
            }
            document.getElementById('photo-label').textContent = '✓ Photo ajoutée';
            document.getElementById('photo-remove').style.display = 'block';
        };
        reader.readAsDataURL(file);
    });

    const removeBtn = document.getElementById('photo-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            editorState.photoDataUrl = null;
            input.value = '';
            const container = document.getElementById('doc-photo');
            if (container) {
                container.innerHTML = `<span class="cv-photo-placeholder" style="font-size:2rem; font-weight:700; color:white; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">TD</span>`;
            }
            document.getElementById('photo-label').textContent = 'Ajouter une photo';
            removeBtn.style.display = 'none';
        });
    }
}

// ============================================
// COULEUR
// ============================================
function setupColorPicker() {
    const picker = document.getElementById('color-picker');
    const hexDisplay = document.getElementById('color-hex');
    if (!picker) return;
    
    const applyColor = (color) => {
        editorState.primaryColor = color;
        picker.value = color;
        if (hexDisplay) hexDisplay.textContent = color.toUpperCase();
        document.getElementById('document-canvas').style.setProperty('--doc-primary-color', color);
        updateColorPresets();
    };
    
    picker.addEventListener('input', (e) => applyColor(e.target.value));
    
    document.querySelectorAll('.color-preset').forEach(preset => {
        preset.addEventListener('click', () => applyColor(preset.dataset.color));
    });
    
    applyColor(editorState.primaryColor);
    console.log('✅ Sélecteur de couleur configuré');
}

function updateColorPresets() {
    document.querySelectorAll('.color-preset').forEach(p => {
        p.classList.toggle('active', p.dataset.color === editorState.primaryColor);
    });
}