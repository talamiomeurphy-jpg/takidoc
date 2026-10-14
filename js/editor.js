// ============================================
// TAKIDOC - ÉDITEUR PROFESSIONNEL (VERSION PRODUCTION)
// L'équipe Meurphy - 2026
// ============================================

import { templatesRegistry } from './templates-registry.js';

const SUPABASE_URL = 'https://wyfkogowsdbxctbpfuud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// État global de l'éditeur
const editorState = {
    template: null,
    zoom: 1.0,
    primaryColor: '#0F172A',
    fontFamily: "'Inter', sans-serif",
    photoDataUrl: null,
    currentUser: null,
    isDirty: false,
    draftKey: null
};

// ============================================
// UTILITAIRES
// ============================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('editorToast');
    if (!toast) return;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-circle-exclamation',
        info: 'fa-info-circle'
    };
    
    toast.className = `editor-toast ${type} show`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
    
    setTimeout(() => toast.classList.remove('show'), 3500);
}

function setupTypography() {
    const fontSelect = document.getElementById('font-family-select');
    if (!fontSelect) return;
    
    fontSelect.addEventListener('change', (e) => {
        editorState.fontFamily = e.target.value;
        const canvas = document.getElementById('document-canvas');
        if (canvas) {
            canvas.style.fontFamily = editorState.fontFamily;
        }
        markAsDirty(); // Indique qu'il y a des modifications non sauvegardées
    });
}
function markAsDirty() {
    editorState.isDirty = true;
    const statusEl = document.getElementById('header-doc-status');
    if (statusEl) {
        statusEl.className = 'doc-status saving';
        statusEl.innerHTML = '<i class="fas fa-sync fa-spin" style="color: var(--primary);"></i><span>Modification en cours...</span>';
    }
    
    // Auto-save local après 1 seconde d'inactivité
    clearTimeout(editorState.autoSaveTimer);
    editorState.autoSaveTimer = setTimeout(() => {
        saveDraftToLocal();
    }, 1000);
}

// ============================================
// AUTHENTIFICATION
// ============================================
async function checkAuth() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        editorState.currentUser = session?.user || null;
    } catch (error) {
        console.error('Erreur auth:', error);
        editorState.currentUser = null;
    }
}

// ============================================
// CHARGEMENT DU TEMPLATE
// ============================================
async function loadTemplate(templateId) {
    
    showToast('Chargement du document...', 'info');
    
    // 1. Essayer Supabase en premier
    try {
        const { data, error } = await supabase
            .from('templates')
            .select(`
                id, name, description, price_xaf, category_id,
                has_photo, has_color_picker, html_structure, css_styles,
                template_fields(field_name, field_label, field_type, default_value, is_required, display_order)
            `)
            .eq('id', templateId)
            .eq('is_active', true)
            .single();
            
        if (data && !error) {
            editorState.template = {
            id: data.id,
               name: data.name,
              description: data.description,
                price: data.price_xaf,
                category: data.category_id,
                hasPhoto: data.has_photo,
                hasColorPicker: data.has_color_picker,
                htmlStructure: data.html_structure,
                cssStyles: data.css_styles,
                fields: (data.template_fields || [])
                    .sort((a, b) => a.display_order - b.display_order)
                    .map(f => ({
                        name: f.field_name,
                        label: f.field_label,
                        type: f.field_type,
                        default: f.default_value,
                        required: f.is_required
                    }))
            };
            console.log('✅ Template chargé depuis Supabase');
            return;
        }
    } catch (e) {
        console.warn('⚠️ Supabase indisponible, fallback local...');
    }
    
    // 2. Fallback sur le registre local
    const localTemplate = templatesRegistry.find(t => t.id === templateId);
    if (localTemplate) {
        editorState.template = localTemplate;
        console.log('✅ Template chargé depuis le registre local');
        return;
    }
    
    // 3. Échec total
    showToast('Document introuvable', 'error');
    setTimeout(() => window.location.href = 'index.html', 2000);
}

// ============================================
// INITIALISATION DE L'ÉDITEUR
// ============================================
async function initEditor() {
     const { template } = editorState;
    
    // Zoom automatique : 48% sur mobile, 95% sur desktop
    editorState.zoom = window.innerWidth <= 768 ? 0.48 : 0.95;
    editorState.draftKey = `takidoc_draft_${template.id}`;
    
    // Mettre à jour le header
    document.title = `${template.name} - Éditeur TakiDoc`;
    document.getElementById('header-doc-title').textContent = template.name;
    document.getElementById('sidebar-template-name').textContent = template.name;
    document.getElementById('sidebar-template-desc').textContent = template.description || 'Document professionnel personnalisable.';

    document.getElementById('btn-save-draft')?.addEventListener('click', saveDraftToLocal);
document.getElementById('btn-load-draft')?.addEventListener('click', loadDraftFromLocal);
    
    // Rendu initial
    renderDocument();
    buildFieldsForm();
    setupZoomControls();
    setupSidebarTabs();
    setupDesignControls();
    setupPhotoUpload();
    setupExportControls();
    setupDirectEditing();
    setupKeyboardShortcuts();
    setupTypography();
    
    // Charger un brouillon existant si présent
    loadDraftFromLocal();
    
    // Statut prêt
    const statusEl = document.getElementById('header-doc-status');
    if (statusEl) {
        statusEl.className = 'doc-status';
        statusEl.innerHTML = '<i class="fas fa-check-circle" style="color: var(--success);"></i><span>Toutes les modifications sont sauvegardées</span>';
    }
    
    showToast('Document chargé avec succès', 'success');
}

// ============================================
// RENDU DU DOCUMENT
// ============================================
function renderDocument() {
    const canvas = document.getElementById('document-canvas');
    const { template } = editorState;
    
    if (!canvas) return;
    
    // 1. Injecter les styles
    let styleTag = document.getElementById('template-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'template-style';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent = template.cssStyles || '';
    
    // 2. Injecter le HTML
    if (template.htmlStructure) {
        canvas.innerHTML = template.htmlStructure;
    } else {
        canvas.innerHTML = '<div style="padding: 60px; text-align: center; color: var(--text-muted);"><i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 16px; color: var(--warning);"></i><p>Aperçu non disponible pour ce modèle.</p></div>';
        return;
    }
    
    // 3. Appliquer les valeurs par défaut
    if (template.fields) {
        template.fields.forEach(field => {
            const el = document.getElementById(`field-${field.name}`);
            if (el && field.default) {
                el.textContent = field.default;
            }
        });
    }
    
    // 4. Gérer l'affichage des sections conditionnelles
    const photoSection = document.getElementById('design-photo-section');
    if (photoSection) photoSection.style.display = template.hasPhoto ? 'block' : 'none';
    
    const colorSection = document.getElementById('design-color-section');
    if (colorSection) colorSection.style.display = template.hasColorPicker ? 'block' : 'none';
    
    // 5. Placeholder photo si nécessaire
    if (template.hasPhoto) {
        const photoContainer = document.getElementById('doc-photo');
        if (photoContainer && !photoContainer.querySelector('img')) {
            photoContainer.innerHTML = `<span class="cv-photo-placeholder" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:rgba(255,255,255,0.6);font-size:0.9rem;">Photo</span>`;
        }
    }
}

// ============================================
// GESTION DES CHAMPS (FORMULAIRE)
// ============================================
function buildFieldsForm() {
    const container = document.getElementById('fields-form');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!editorState.template.fields || editorState.template.fields.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Ce document ne contient pas de champs modifiables.</p>';
        return;
    }
    
    editorState.template.fields.forEach(field => {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        
        const label = document.createElement('label');
        label.innerHTML = `${field.label} ${field.required ? '<span class="required">*</span>' : ''}`;
        wrapper.appendChild(label);
        
        let input;
        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 3;
            input.textContent = field.default || '';
        } else {
            input = document.createElement('input');
            input.type = field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text';
            input.value = field.default || '';
        }
        
        input.id = `input-${field.name}`;
        input.className = 'form-control';
        input.placeholder = `Entrez ${field.label.toLowerCase()}...`;
        
        // Synchronisation bidirectionnelle : Formulaire -> Canvas
        input.addEventListener('input', (e) => {
            const targetEl = document.getElementById(`field-${field.name}`);
            if (targetEl) {
                targetEl.textContent = e.target.value;
            }
            markAsDirty();
        });
        
        wrapper.appendChild(input);
        container.appendChild(wrapper);
    });
}

// ============================================
// ÉDITION DIRECTE SUR LE CANVAS
// ============================================
function setupDirectEditing() {
    const canvas = document.getElementById('document-canvas');
    if (!canvas) return;

    const editableElements = canvas.querySelectorAll('[id^="field-"]');
    
    editableElements.forEach(el => {
        el.contentEditable = true;
        el.classList.add('direct-editable');
        
        // Synchronisation bidirectionnelle : Canvas -> Formulaire
        el.addEventListener('input', () => {
            const fieldName = el.id.replace('field-', '');
            const sidebarInput = document.getElementById(`input-${fieldName}`);
            if (sidebarInput) {
                sidebarInput.value = el.textContent;
            }
            markAsDirty();
        });
        
        // Empêcher la perte de focus accidentelle
        el.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
    
    // Protéger les éléments TakiDoc
    const protectedElements = canvas.querySelectorAll('.takidoc-footer-protected, [contenteditable="false"]');
    protectedElements.forEach(el => {
        el.contentEditable = false;
        el.style.pointerEvents = 'none';
        el.style.opacity = '0.6';
    });
}

// ============================================
// CONTRÔLES DE DESIGN
// ============================================
function setupDesignControls() {
    // Sélecteur de police
    const fontSelect = document.getElementById('font-family-select');
    if (fontSelect) {
        fontSelect.addEventListener('change', (e) => {
            editorState.fontFamily = e.target.value;
            document.getElementById('document-canvas').style.fontFamily = editorState.fontFamily;
            markAsDirty();
        });
    }
    
    // Color Picker
    const colorPicker = document.getElementById('color-picker');
    const colorHex = document.getElementById('color-hex');
    
    if (colorPicker && colorHex) {
        const applyColor = (color) => {
            editorState.primaryColor = color;
            colorPicker.value = color;
            colorHex.textContent = color.toUpperCase();
            document.getElementById('document-canvas').style.setProperty('--doc-primary-color', color);
            
            // Mettre à jour les presets actifs
            document.querySelectorAll('.color-preset').forEach(p => {
                p.classList.toggle('active', p.dataset.color === color);
            });
            markAsDirty();
        };
        
        colorPicker.addEventListener('input', (e) => applyColor(e.target.value));
        
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => applyColor(preset.dataset.color));
        });
        
        // Initialiser avec la couleur par défaut
        applyColor(editorState.primaryColor);
    }
}

// ============================================
// GESTION DES PHOTOS
// ============================================
function setupPhotoUpload() {
    const input = document.getElementById('photo-input');
    const preview = document.getElementById('photo-preview-area');
    const removeBtn = document.getElementById('photo-remove');
    
    if (!input || !preview) return;
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            editorState.photoDataUrl = event.target.result;
            
            // Mise à jour de l'aperçu sidebar
            preview.innerHTML = `<img src="${editorState.photoDataUrl}" alt="Photo de profil">`;
            preview.classList.add('has-image');
            if (removeBtn) removeBtn.style.display = 'block';
            
            // Mise à jour du document
            const docPhotoContainer = document.getElementById('doc-photo');
            if (docPhotoContainer) {
                docPhotoContainer.innerHTML = `<img src="${editorState.photoDataUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            }
            markAsDirty();
        };
        reader.readAsDataURL(file);
    });
    
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            editorState.photoDataUrl = null;
            input.value = '';
            preview.innerHTML = `<i class="fas fa-user-circle"></i><span>Aucune photo</span>`;
            preview.classList.remove('has-image');
            removeBtn.style.display = 'none';
            
            const docPhotoContainer = document.getElementById('doc-photo');
            if (docPhotoContainer) {
                docPhotoContainer.innerHTML = `<span class="cv-photo-placeholder" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:rgba(255,255,255,0.6);font-size:0.9rem;">Photo</span>`;
            }
            markAsDirty();
        });
    }
}

// ============================================
// GESTION DES ONGLETS SIDEBAR
// ============================================
function setupSidebarTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });
    
    // Mobile sidebar toggle
    const mobileToggle = document.getElementById('mobileSidebarToggle');
    const sidebar = document.getElementById('editorSidebar');
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

// ============================================
// CONTRÔLES DE ZOOM
// ============================================
function setupZoomControls() {
    const updateZoom = () => {
        const wrapper = document.getElementById('document-wrapper');
        if (wrapper) {
            wrapper.style.transform = `scale(${editorState.zoom})`;
        }
        const levelEl = document.getElementById('zoom-level');
        if (levelEl) {
            levelEl.textContent = `${Math.round(editorState.zoom * 100)}%`;
        }
    };
    
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
        editorState.zoom = Math.min(2.5, +(editorState.zoom + 0.1).toFixed(2));
        updateZoom();
    });
    
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
        editorState.zoom = Math.max(0.3, +(editorState.zoom - 0.1).toFixed(2));
        updateZoom();
    });
    
    document.getElementById('btn-zoom-fit')?.addEventListener('click', () => {
        editorState.zoom = 1.0;
        updateZoom();
    });
    
    // Zoom avec la molette de la souris (Ctrl + Scroll)
    document.getElementById('canvasArea')?.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                editorState.zoom = Math.min(2.5, +(editorState.zoom + 0.05).toFixed(2));
            } else {
                editorState.zoom = Math.max(0.3, +(editorState.zoom - 0.05).toFixed(2));
            }
            updateZoom();
        }
    });
    
    updateZoom();
}

// ============================================
// EXPORT ET SAUVEGARDE
// ============================================
function setupExportControls() {
    // Boutons de téléchargement
    const downloadActions = [
        document.getElementById('btn-download-pdf'),
        document.getElementById('header-download-btn')
    ];
    
    downloadActions.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', async () => {
                if (!editorState.currentUser) {
                    document.getElementById('loginModal').classList.add('active');
                    
                    // Attendre que l'utilisateur ferme la modal
                    await new Promise(resolve => {
                        const closeModal = () => {
                            document.getElementById('loginModal').classList.remove('active');
                            document.getElementById('loginModalClose')?.removeEventListener('click', closeModal);
                            resolve();
                        };
                        document.getElementById('loginModalClose')?.addEventListener('click', closeModal);
                    });
                }
                await generatePDF();
            });
        }
    });
    
    // Sauvegarde brouillon
    document.getElementById('btn-save-draft')?.addEventListener('click', () => {
        saveDraftToLocal();
        showToast('Brouillon enregistré localement', 'success');
    });
    
    document.getElementById('btn-load-draft')?.addEventListener('click', () => {
        loadDraftFromLocal();
        showToast('Brouillon restauré', 'success');
    });
}

async function generatePDF() {
    const canvas = document.getElementById('document-canvas');
    if (!canvas) return showToast('Erreur: Document introuvable', 'error');

    showToast('Génération du document en cours...', 'info');

    try {
        // 1. Préparer le document pour la capture
        const editableElements = canvas.querySelectorAll('[contenteditable="true"]');
        editableElements.forEach(el => el.contentEditable = 'false');

        // 2. Reset du zoom pour une capture précise
        const wrapper = document.getElementById('document-wrapper');
        const originalTransform = wrapper.style.transform;
        wrapper.style.transform = 'scale(1)';
        
        await new Promise(r => setTimeout(r, 300));

        // 3. Capture
        // Récupérer la qualité choisie par l'utilisateur (1, 1.5 ou 2)
const qualitySelect = document.getElementById('pdf-quality');
const scale = qualitySelect ? parseFloat(qualitySelect.value) : 2;

const canvasImage = await html2canvas(canvas, { 
    scale: scale, // <-- C'est ici que la qualité est appliquée
    useCORS: true, 
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: canvas.scrollWidth,
    windowHeight: canvas.scrollHeight
});

        // 4. Restaurer l'état
        editableElements.forEach(el => el.contentEditable = 'true');
        wrapper.style.transform = originalTransform;

        // 5. Générer le PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ 
            orientation: 'portrait', 
            unit: 'mm', 
            format: 'a4' 
        });
        
        const imgData = canvasImage.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        
        const filename = `TakiDoc_${editorState.template.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        pdf.save(filename);

        // 6. Sauvegarder dans l'historique Supabase si connecté
        if (editorState.currentUser) {
            await saveDocumentToHistory(filename);
        }

        showToast('Document téléchargé avec succès !', 'success');

    } catch (error) {
        console.error('Erreur génération PDF:', error);
        showToast('Erreur lors de la génération du PDF', 'error');
    }
}

async function saveDocumentToHistory(filename) {
    try {
        // Récupérer les données actuelles des champs
        const documentData = {};
        if (editorState.template.fields) {
            editorState.template.fields.forEach(field => {
                const el = document.getElementById(`field-${field.name}`);
                if (el) documentData[field.name] = el.textContent;
            });
        }
        
        documentData.photoDataUrl = editorState.photoDataUrl;
        documentData.primaryColor = editorState.primaryColor;
        documentData.fontFamily = editorState.fontFamily;
        documentData.generatedAt = new Date().toISOString();

        // 1. Créer une entrée d'achat (gratuite pour l'instant)
        const { data: purchaseData, error: purchaseError } = await supabase
            .from('purchases')
            .insert({
                user_id: editorState.currentUser.id,
                template_id: editorState.template.id,
                amount_paid: editorState.template.price || 0,
                currency: 'XAF',
                payment_method: 'free_download',
                payment_status: 'completed',
                payment_reference: `FREE_${Date.now()}`
            })
            .select()
            .single();
            
        if (purchaseError) throw purchaseError;

        // 2. Créer l'entrée du document généré
        const { error: docError } = await supabase
            .from('user_documents')
            .insert({
                purchase_id: purchaseData.id,
                user_id: editorState.currentUser.id,
                template_id: editorState.template.id,
                document_data: documentData,
                generated_pdf_url: null // Pourra être mis à jour si on upload le PDF vers Storage
            });
            
        if (docError) throw docError;
        
        console.log('✅ Document enregistré dans l\'historique');
    } catch (error) {
        console.error('Erreur sauvegarde historique:', error);
    }
}

// ============================================
// GESTION DES BROUILLONS (LOCALSTORAGE)
// ============================================
function saveDraftToLocal() {
    if (!editorState.draftKey) return;
    
    const draftData = {
        timestamp: Date.now(),
        fields: {},
        photoDataUrl: editorState.photoDataUrl,
        primaryColor: editorState.primaryColor,
        fontFamily: editorState.fontFamily
    };
    
    if (editorState.template.fields) {
        editorState.template.fields.forEach(field => {
            const el = document.getElementById(`input-${field.name}`);
            if (el) draftData.fields[field.name] = el.value;
        });
    }
    
    localStorage.setItem(editorState.draftKey, JSON.stringify(draftData));
    
    const statusEl = document.getElementById('header-doc-status');
    if (statusEl) {
        statusEl.className = 'doc-status';
        statusEl.innerHTML = '<i class="fas fa-check-circle" style="color: var(--success);"></i><span>Toutes les modifications sont sauvegardées</span>';
    }
    editorState.isDirty = false;
    
    // Afficher le bouton de restauration
    const loadBtn = document.getElementById('btn-load-draft');
    if (loadBtn) loadBtn.style.display = 'block';
}

function loadDraftFromLocal() {
    if (!editorState.draftKey) return;
    
    const saved = localStorage.getItem(editorState.draftKey);
    if (!saved) return;
    
    try {
        const draftData = JSON.parse(saved);
        
        // Restaurer les champs
        if (draftData.fields) {
            Object.keys(draftData.fields).forEach(fieldName => {
                const input = document.getElementById(`input-${fieldName}`);
                const canvasEl = document.getElementById(`field-${fieldName}`);
                if (input) input.value = draftData.fields[fieldName];
                if (canvasEl) canvasEl.textContent = draftData.fields[fieldName];
            });
        }
        
        // Restaurer le design
        if (draftData.primaryColor) {
            editorState.primaryColor = draftData.primaryColor;
            document.getElementById('document-canvas').style.setProperty('--doc-primary-color', editorState.primaryColor);
            const colorPicker = document.getElementById('color-picker');
            const colorHex = document.getElementById('color-hex');
            if (colorPicker) colorPicker.value = editorState.primaryColor;
            if (colorHex) colorHex.textContent = editorState.primaryColor.toUpperCase();
        }
        
        if (draftData.fontFamily) {
            editorState.fontFamily = draftData.fontFamily;
            document.getElementById('document-canvas').style.fontFamily = editorState.fontFamily;
            const fontSelect = document.getElementById('font-family-select');
            if (fontSelect) fontSelect.value = editorState.fontFamily;
        }
        
        // Restaurer la photo
        if (draftData.photoDataUrl) {
            editorState.photoDataUrl = draftData.photoDataUrl;
            const preview = document.getElementById('photo-preview-area');
            const removeBtn = document.getElementById('photo-remove');
            if (preview) {
                preview.innerHTML = `<img src="${editorState.photoDataUrl}" alt="Photo de profil">`;
                preview.classList.add('has-image');
            }
            if (removeBtn) removeBtn.style.display = 'block';
            
            const docPhotoContainer = document.getElementById('doc-photo');
            if (docPhotoContainer) {
                docPhotoContainer.innerHTML = `<img src="${editorState.photoDataUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            }
        }
        
        showToast('Brouillon restauré avec succès', 'success');
    } catch (e) {
        console.error('Erreur restauration brouillon:', e);
    }
}

// ============================================
// RACCOURCIS CLAVIER
// ============================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+S ou Cmd+S : Sauvegarder le brouillon
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveDraftToLocal();
            showToast('Brouillon sauvegardé (Ctrl+S)', 'success');
        }
        
        // Ctrl+P ou Cmd+P : Télécharger le PDF
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            document.getElementById('header-download-btn')?.click();
        }
    });
}


// ============================================
// INITIALISATION GLOBALE
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation de l\'éditeur TakiDoc...');
    
    await checkAuth();
    
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('id');
    
    if (!templateId) {
        console.error('❌ Aucun ID de template dans l\'URL');
        showToast('Erreur: Aucun document spécifié', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    await loadTemplate(templateId);
    
    if (editorState.template) {
        await initEditor();
    }
    
    // Avertissement avant de quitter si des modifications non sauvegardées existent
    window.addEventListener('beforeunload', (e) => {
        if (editorState.isDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});