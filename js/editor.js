// ============================================
// TAKIDOC - MOTEUR D'ÉDITION COMPLET (VERSION ULTIME UNIVERSAL)
// L'équipe Meurphy - 2026
// ============================================

import { fetchTemplateById, createPendingPurchase } from './supabase-config.js';
import { templatesRegistry } from './templates-registry.js';

// ============================================
// ÉTAT GLOBAL DE L'ÉDITEUR
// ============================================
const editorState = {
    template: null,
    zoom: window.innerWidth <= 768 ? 0.35 : 1.0,
    primaryColor: '#0F172A',
    photoDataUrl: null
};

// ============================================
// UTILITAIRE - TOAST NOTIFICATION
// ============================================
function showToast(message, duration = 5000) {
    const oldToast = document.querySelector('.editor-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'editor-toast';
    toast.innerHTML = `<i class="fas fa-lightbulb" style="color: #FF6B35; margin-right: 8px;"></i> ${message}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// ============================================
// 1. INITIALISATION PRINCIPALE
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const templateId = new URLSearchParams(window.location.search).get('id');
    
    let template = templatesRegistry.find(t => t.id === templateId);
    if (!template) template = await fetchTemplateById(templateId);
    
    if (!template) return showError();
    
    editorState.template = template;
    initEditor();
});

function initEditor() {
    const { template } = editorState;
    
    document.getElementById('editor-loading').style.display = 'none';
    document.getElementById('editor-interface').style.display = 'grid';
    
    document.getElementById('doc-title').textContent = template.name;
    document.getElementById('doc-category').textContent = template.category || 'Document';
    document.getElementById('doc-price').textContent = `${template.price || 0} FCFA`;
    
    if (template.hasPhoto) {
        document.getElementById('photo-section').style.display = 'block';
        setupPhotoUpload();
    }
    if (template.hasColorPicker) {
        document.getElementById('color-section').style.display = 'block';
        setupColorPicker();
    }
    
    renderDocument();
    buildSidebarFields(template.fields || []);
    setupZoomControls();
    setupActions();
    
    setTimeout(() => {
        updateZoomDisplay();
        applyMobileZoom();
        enableDirectEditing();
        showToast("✏️ Cliquez sur n'importe quel texte pour le modifier");
    }, 400);
}

// ============================================
// 2. RENDU DU DOCUMENT
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
// 3. CONSTRUCTION DYNAMIQUE DE LA SIDEBAR
// ============================================
function buildSidebarFields(fields) {
    const container = document.getElementById('fields-container');
    container.innerHTML = '';
    
    fields.forEach(field => {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-field';
        wrapper.style.marginBottom = '16px';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        label.style.cssText = 'display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; font-weight: 600;';
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
        
        input.style.cssText = 'width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem; transition: all 0.2s; font-family: inherit;';
        
        input.addEventListener('focus', () => {
            input.style.borderColor = 'var(--primary)';
            input.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)';
        });
        input.addEventListener('blur', () => {
            input.style.borderColor = 'var(--border)';
            input.style.boxShadow = 'none';
        });
        
        input.addEventListener('input', (e) => {
            const targetEl = document.getElementById(`field-${field.name}`);
            if (targetEl) targetEl.textContent = e.target.value;
        });
        
        wrapper.appendChild(input);
        container.appendChild(wrapper);
    });
}

// ============================================
// 4. ÉDITION DIRECTE UNIVERSELLE (TreeWalker)
// ============================================
function enableDirectEditing() {
    const canvas = document.getElementById('document-canvas');
    if (!canvas) {
        console.error('Canvas non trouvé');
        return;
    }

    let editableCount = 0;
    const processedParents = new Set(); // Éviter de traiter le même parent 2 fois

    //  TREEWALKER : parcourt TOUS les nœuds texte du document
    const treeWalker = document.createTreeWalker(
        canvas,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Ignorer les nœuds vides ou uniquement des espaces
                if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
                
                // Ignorer les nœuds dans les scripts/styles
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
        
        if (!parent || processedParents.has(parent)) continue;
        
        // 🔒 Protéger le footer TakiDoc
        const parentText = parent.textContent.trim();
        if (parentText.includes('TakiDoc') && parentText.includes('onrender.com')) {
            parent.contentEditable = false;
            parent.classList.add('takidoc-footer-protected');
            parent.setAttribute('data-protected', 'true');
            processedParents.add(parent);
            continue;
        }
        
        // Ignorer les conteneurs trop complexes (qui casseraient le layout)
        if (parent.children.length > 5) continue;
        
        // Ignorer les éléments déjà non-éditables explicitement
        if (parent.getAttribute('data-protected') === 'true') continue;
        
        // ✅ Rendre éditable
        parent.contentEditable = true;
        parent.classList.add('direct-editable');
        parent.style.cursor = 'text';
        parent.style.outline = 'none';
        
        // Effet visuel au survol
        parent.addEventListener('mouseenter', () => {
            if (parent.getAttribute('data-protected') === 'true') return;
            parent.style.backgroundColor = 'rgba(255,107,53,0.08)';
            parent.style.border = '1px dashed var(--primary)';
        });
        
        parent.addEventListener('mouseleave', () => {
            if (document.activeElement !== parent) {
                parent.style.backgroundColor = '';
                parent.style.border = '';
            }
        });
        
        parent.addEventListener('blur', () => {
            parent.style.backgroundColor = '';
            parent.style.border = '';
        });
        
        // Synchronisation BIDIRECTIONNELLE : Document -> Sidebar
        if (parent.id && parent.id.startsWith('field-')) {
            const fieldName = parent.id.replace('field-', '');
            const sidebarInput = document.getElementById(`input-${fieldName}`);
            
            parent.addEventListener('input', () => {
                if (sidebarInput) {
                    sidebarInput.value = parent.textContent;
                }
            });
        }
        
        processedParents.add(parent);
        editableCount++;
    }
    
    console.log(`✅ Édition universelle activée sur ${editableCount} éléments`);
}

// ============================================
// 5. ZOOM RESPONSIVE
// ============================================
function applyMobileZoom() {
    const canvas = document.getElementById('document-canvas');
    const container = document.getElementById('previewContainer');
    
    if (!canvas || !container) return;
    
    if (window.innerWidth <= 768) {
        const containerWidth = container.clientWidth - 20;
        const documentWidth = 794;
        const autoZoom = Math.min(1, containerWidth / documentWidth);
        
        editorState.zoom = autoZoom;
        updateZoomDisplay();
        
        container.style.justifyContent = 'center';
        container.style.alignItems = 'flex-start';
        
        console.log(`📱 Zoom mobile automatique : ${autoZoom}`);
    } else {
        editorState.zoom = 1.0;
        updateZoomDisplay();
        container.style.justifyContent = 'center';
        container.style.alignItems = 'flex-start';
    }
}

function updateZoomDisplay() {
    const canvas = document.getElementById('document-canvas');
    if (!canvas) return;
    
    canvas.style.transform = `scale(${editorState.zoom})`;
    canvas.style.transformOrigin = 'top center';
    
    const zoomLevel = document.getElementById('zoom-level');
    if (zoomLevel) {
        zoomLevel.textContent = `${Math.round(editorState.zoom * 100)}%`;
    }
}

// ============================================
// 6. FONCTIONNALITÉS SPÉCIALES
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

// ============================================
// 7. CONTRÔLES DE ZOOM
// ============================================
function setupZoomControls() {
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
        editorState.zoom = Math.min(2, +(editorState.zoom + 0.1).toFixed(2));
        updateZoomDisplay();
    });
    
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
        editorState.zoom = Math.max(0.1, +(editorState.zoom - 0.1).toFixed(2));
        updateZoomDisplay();
    });
    
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
        editorState.zoom = window.innerWidth <= 768 ? 0.35 : 1.0;
        updateZoomDisplay();
    });
    
    window.addEventListener('resize', () => {
        applyMobileZoom();
    });
}

// ============================================
// 8. ACTIONS (PDF, PAIEMENT)
// ============================================
function setupActions() {
    // --- GÉNÉRATION PDF ---
    document.getElementById('btn-download')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-download');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération...';
        btn.disabled = true;

        try {
            const canvas = document.getElementById('document-canvas');
            
            // Désactiver temporairement l'édition pour une capture propre
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

            // Réactiver l'édition
            editableElements.forEach(el => el.contentEditable = true);
            editorState.zoom = prevZoom;
            updateZoomDisplay();
        } catch (e) {
            console.error(e);
            alert('Erreur lors de la génération du PDF');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    // --- MODAL DE PAIEMENT ---
    const modal = document.getElementById('payment-modal');
    const openModal = () => {
        document.getElementById('payment-doc-name').textContent = editorState.template.name;
        document.getElementById('payment-amount').textContent = `${editorState.template.price || 0} FCFA`;
        modal.style.display = 'flex';
    };
    
    document.getElementById('btn-buy')?.addEventListener('click', openModal);
    document.getElementById('btn-buy-sidebar')?.addEventListener('click', openModal);
    document.getElementById('modal-close')?.addEventListener('click', () => modal.style.display = 'none');
    modal?.addEventListener('click', (e) => { 
        if (e.target === modal) modal.style.display = 'none'; 
    });

    document.getElementById('payment-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const phone = document.getElementById('pay-phone').value;
        const email = document.getElementById('pay-email').value;
        if (!phone || !email) return alert('Veuillez remplir tous les champs');
        alert(`Redirection vers le paiement sécurisé de ${editorState.template.price} FCFA...`);
    });
}

// ============================================
// 9. GESTION D'ERREUR
// ============================================
function showError() {
    document.getElementById('editor-loading').style.display = 'none';
    document.getElementById('editor-error').style.display = 'flex';
}