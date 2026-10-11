


// ============================================
// TAKIDOC - ÉDITEUR PLEIN ÉCRAN
// L'équipe Meurphy - 2026
// ============================================

import { fetchTemplateById, createPendingPurchase } from './supabase-config.js';
import { templatesRegistry } from './templates-registry.js';

const SUPABASE_URL = 'https://wyfkogowsdbxctbpfuud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const editorState = {
    template: null,
    zoom: window.innerWidth <= 768 ? 0.45 : 0.95, // ← 45% sur mobile, 95% sur desktop
    primaryColor: '#0F172A',
    photoDataUrl: null,
    currentUser: null
};
// ============================================
// UTILITAIRES
// ============================================
function showToast(message) {
    const toast = document.getElementById('editorToast');
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
        updateHeaderUI();
    } catch (error) {
        console.error('Erreur auth:', error);
    }
}

function updateHeaderUI() {
    const authContainer = document.getElementById('headerAuth');
    
    if (editorState.currentUser) {
        const metaData = editorState.currentUser.user_metadata || {};
        const fullName = metaData.full_name || editorState.currentUser.email || 'U';
        const initials = fullName.split('@')[0].split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        
        authContainer.innerHTML = `
            <a href="profile.html" class="btn btn-secondary" style="border-radius: 50%; width: 40px; height: 40px; padding: 0; justify-content: center;">
                <span style="font-weight: 800; font-size: 0.85rem;">${initials}</span>
            </a>
        `;
    } else {
        authContainer.innerHTML = `
            <a href="auth.html?action=signup" class="btn btn-secondary">
                <i class="fas fa-user-plus"></i>
                <span>S'inscrire</span>
            </a>
            <a href="auth.html?action=login" class="btn btn-primary">
                <i class="fas fa-sign-in-alt"></i>
                <span>Connexion</span>
            </a>
        `;
    }
}

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    
    const templateId = new URLSearchParams(window.location.search).get('id');
    
    let template = templatesRegistry.find(t => t.id === templateId);
    if (!template) template = await fetchTemplateById(templateId);
    
    if (!template) {
        window.location.href = 'index.html';
        return;
    }
    
    editorState.template = template;
    initEditor();
});

function initEditor() {
    const { template } = editorState;
    
    document.getElementById('docNameText').textContent = template.name;
    document.getElementById('docCategoryText').textContent = template.category ? `• ${template.category}` : '';
    
    renderDocument();
    buildSidebarFields(template.fields || []);
    setupZoomControls();
    setupSidebar();
    setupSearch();
    setupDownload();
    setupMobileFABs(); // ← NOUVEAU : Configure les boutons flottants
    
    if (template.hasPhoto) {
        document.getElementById('photo-section').style.display = 'block';
        setupPhotoUpload();
    }
    if (template.hasColorPicker) {
        document.getElementById('color-section').style.display = 'block';
        setupColorPicker();
    }
    
    setTimeout(() => {
        updateZoomDisplay();
        enableDirectEditing();
        showToast("Document chargé");
    }, 300);
}

// ============================================
// BOUTONS FLOTTANTS MOBILE
// ============================================
function setupMobileFABs() {
    const customizeBtn = document.getElementById('mobileBtnCustomize');
    const downloadBtn = document.getElementById('mobileBtnDownload');
    const desktopCustomizeBtn = document.getElementById('btn-customize');
    const desktopDownloadBtn = document.getElementById('btn-download');
    
    // ✅ Utilise 'click' avec preventDefault pour éviter les conflits
    if (customizeBtn && desktopCustomizeBtn) {
        customizeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            desktopCustomizeBtn.click();
        });
        
        // ✅ Support tactile explicite
        customizeBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            desktopCustomizeBtn.click();
        });
    }
    
    if (downloadBtn && desktopDownloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            desktopDownloadBtn.click();
        });
        
        // ✅ Support tactile explicite
        downloadBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            desktopDownloadBtn.click();
        });
    }
    
    console.log('✅ Boutons flottants mobiles configurés');
}

// ============================================
// RENDU DU DOCUMENT
// ============================================
function renderDocument() {
    const canvas = document.getElementById('document-canvas');
    const { template } = editorState;
    
    let styleTag = document.getElementById('template-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'template-style';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent = template.cssStyles || '';
    
    canvas.innerHTML = template.htmlStructure || '<p>Aperçu non disponible</p>';
    
    if (template.fields) {
        template.fields.forEach(field => {
            const el = document.getElementById(`field-${field.name}`);
            if (el && field.default) el.textContent = field.default;
        });
    }
    
    if (template.hasPhoto) {
        const photoContainer = document.getElementById('doc-photo');
        if (photoContainer && !photoContainer.querySelector('img')) {
            photoContainer.innerHTML = `<span class="cv-photo-placeholder" style="font-size: 2rem; font-weight: 700; color: white;">TD</span>`;
        }
    }
}

// ============================================
// SIDEBAR
// ============================================
function setupSidebar() {
    const btn = document.getElementById('btn-customize');
    const sidebar = document.getElementById('customizationSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const close = document.getElementById('sidebarClose');
    
    function openSidebar() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        btn.innerHTML = '<i class="fas fa-times"></i><span>Fermer</span>';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    }
    
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-sliders-h"></i><span>Personnaliser</span>';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
    }
    
    btn.addEventListener('click', () => {
        if (sidebar.classList.contains('active')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });
    
    overlay.addEventListener('click', closeSidebar);
    close.addEventListener('click', closeSidebar);
}

// ============================================
// CHAMPS
// ============================================
function buildSidebarFields(fields) {
    const container = document.getElementById('fields-container');
    container.innerHTML = '';
    
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
            if (targetEl) targetEl.textContent = e.target.value;
        });
        
        wrapper.appendChild(input);
        container.appendChild(wrapper);
    });
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



// Dans setupZoomControls(), ajuste le reset :
function setupZoomControls() {
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
        editorState.zoom = Math.min(3, +(editorState.zoom + 0.1).toFixed(2));
        updateZoomDisplay();
    });
    
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
        editorState.zoom = Math.max(0.2, +(editorState.zoom - 0.1).toFixed(2));
        updateZoomDisplay();
    });
    
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
        // Reset intelligent selon la taille d'écran
        editorState.zoom = window.innerWidth <= 768 ? 0.45 : 0.95;
        updateZoomDisplay();
    });
}

// ============================================
// RECHERCHE (REDIRECTION VERS INDEX)
// ============================================
function setupSearch() {
    const form = document.getElementById('searchForm');
    const input = document.getElementById('headerSearch');
    
    if (!form || !input) return;
    
    // Soumission du formulaire (Entrée)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = input.value.trim();
        if (query.length >= 2) {
            window.location.href = `index.html?q=${encodeURIComponent(query)}`;
        }
    });
    
    // Recherche en temps réel (optionnel - affiche suggestions)
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) return;
        
        const results = templatesRegistry.filter(t => 
            t.name.toLowerCase().includes(query) || 
            t.category.toLowerCase().includes(query)
        );
        
        // Log pour debug
        console.log('Suggestions:', results.map(r => r.name));
    });
}

// ============================================
// TÉLÉCHARGEMENT
// ============================================
function setupDownload() {
    const btn = document.getElementById('btn-download');
    
    btn.addEventListener('click', async () => {
        if (!editorState.currentUser) {
            // Afficher modal non-bloquante
            document.getElementById('loginModal').classList.add('active');
            
            // Attendre fermeture
            await new Promise(resolve => {
                const closeModal = () => {
                    document.getElementById('loginModal').classList.remove('active');
                    document.getElementById('loginModalClose').removeEventListener('click', closeModal);
                    resolve();
                };
                document.getElementById('loginModalClose').addEventListener('click', closeModal);
            });
        }
        
        await generatePDF();
    });
}

async function generatePDF() {
    const canvas = document.getElementById('document-canvas');
    
    try {
        const editableElements = canvas.querySelectorAll('[contenteditable="true"]');
        editableElements.forEach(el => el.contentEditable = false);
        
        const prevZoom = editorState.zoom;
        editorState.zoom = 1.0;
        updateZoomDisplay();
        await new Promise(r => setTimeout(r, 300));

        const canvasImage = await html2canvas(canvas, { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff' 
        });
        
        const pdf = new jspdf.jsPDF({ 
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
        
        pdf.save(`TakiDoc_${editorState.template.id}_${Date.now()}.pdf`);

        editableElements.forEach(el => el.contentEditable = true);
        editorState.zoom = prevZoom;
        updateZoomDisplay();
        
        showToast('PDF téléchargé avec succès !');
    } catch (e) {
        console.error(e);
        alert('Erreur lors de la génération du PDF');
    }
}

// ============================================
// ÉDITION DIRECTE
// ============================================
function enableDirectEditing() {
    const canvas = document.getElementById('document-canvas');
    if (!canvas) return;

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
        
        const parentText = parent.textContent.trim();
        if (parentText.includes('TakiDoc') && parentText.includes('onrender.com')) {
            parent.contentEditable = false;
            parent.classList.add('takidoc-footer-protected');
            continue;
        }
        
        if (parent.children.length > 5) continue;
        
        parent.contentEditable = true;
        parent.classList.add('direct-editable');
        
        if (parent.id && parent.id.startsWith('field-')) {
            const fieldName = parent.id.replace('field-', '');
            const sidebarInput = document.getElementById(`input-${fieldName}`);
            
            parent.addEventListener('input', () => {
                if (sidebarInput) sidebarInput.value = parent.textContent;
            });
        }
    }
}

// ============================================
// PHOTO & COULEUR
// ============================================
function setupPhotoUpload() {
    const input = document.getElementById('photo-input');
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            editorState.photoDataUrl = event.target.result;
            const container = document.getElementById('doc-photo');
            if (container) {
                container.innerHTML = `<img src="${editorState.photoDataUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            }
            document.getElementById('photo-label').textContent = '✓ Photo ajoutée';
            document.getElementById('photo-remove').style.display = 'block';
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('photo-remove').addEventListener('click', () => {
        editorState.photoDataUrl = null;
        input.value = '';
        const container = document.getElementById('doc-photo');
        if (container) container.innerHTML = `<span class="cv-photo-placeholder" style="font-size:2rem; font-weight:700; color:white;">TD</span>`;
        document.getElementById('photo-label').textContent = 'Ajouter une photo';
        document.getElementById('photo-remove').style.display = 'none';
    });
}

function setupColorPicker() {
    const picker = document.getElementById('color-picker');
    const hexDisplay = document.getElementById('color-hex');
    
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
}

function updateColorPresets() {
    document.querySelectorAll('.color-preset').forEach(p => {
        p.classList.toggle('active', p.dataset.color === editorState.primaryColor);
    });
}
