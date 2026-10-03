// ============================================
// TAKIDOC - LOGIQUE DE L'ÉDITEUR
// L'équipe Meurphy
// ============================================

import { fetchTemplateById, createPendingPurchase } from './supabase-config.js';
import { templatesRegistry } from './templates-registry.js';

// URLs OpenPay par montant
const OPENPAY_LINKS = {
    800: 'https://openpay.cg/pay/f70b59c1f63e0e6a2d55b5dbde5203fe5bb6d73645b7c2cf8fc9a60117c9282b',
    1000: 'https://openpay.cg/pay/d244c8900efd9f3a73c98436fe4ffcae61ed413c99ede74a6de8bd705b91dc2c',
    1200: 'https://openpay.cg/pay/bb6a4ec95996eaed88ba07272e00756803f63fa4af7f134d2accb492ebdf6e59',
    1500: 'https://openpay.cg/pay/be4cd427a7983f19eef52bc147df73a661c3858e4498a1cc0212892429f79bfa',
    2000: 'https://openpay.cg/pay/77983426652c9016148a17667af0c89b9957ed04eac76e4a4ec6922859f31a1e'
};

// État global de l'éditeur
const editorState = {
    template: null,
    templateRender: null,
    zoom: 100,
    customData: {},
    primaryColor: '#0F172A',
    photoDataUrl: null
};

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('id');
    
    if (!templateId) {
        showError();
        return;
    }
    
    const template = await fetchTemplateById(templateId);
    
    if (!template) {
        showError();
        return;
    }
    
    // Trouver le rendu visuel dans le registry JS (peut être null)
    const templateRender = templatesRegistry.find(t => t.id === templateId);
    
    editorState.template = template;
    editorState.templateRender = templateRender; // Peut être null
    editorState.primaryColor = '#0F172A';
    
    initEditor();
});

// ============================================
// INITIALISATION DE L'INTERFACE
// ============================================
function initEditor() {
    const { template, templateRender } = editorState;
    
    document.getElementById('editor-loading').style.display = 'none';
    document.getElementById('editor-interface').style.display = 'grid';
    
    document.getElementById('doc-title').textContent = template.name;
    document.getElementById('doc-category').textContent = template.category?.name || 'Document';
    document.getElementById('doc-price').textContent = `${template.price_xaf} FCFA`;
    
    if (template.has_photo) {
        document.getElementById('photo-section').style.display = 'block';
        setupPhotoUpload();
    }
    
    if (template.has_color_picker) {
        document.getElementById('color-section').style.display = 'block';
        setupColorPicker();
    }
    
    setupFields(template.fields || []);
    
    renderDocument();
    
    setupZoomControls();
    setupDownloadButton();
    setupBuyButton();
    setupPaymentModal();
}

// ============================================
// RENDU DU DOCUMENT
// ============================================
function renderDocument() {
    const canvas = document.getElementById('document-canvas');
    const { templateRender, template } = editorState;
    
    let styleTag = document.getElementById('template-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'template-style';
        document.head.appendChild(styleTag);
    }
    
    // Si pas de rendu personnalisé, afficher un aperçu générique
    if (templateRender) {
        styleTag.textContent = templateRender.cssStyles || '';
        canvas.innerHTML = templateRender.htmlStructure || '<p>Aperçu non disponible</p>';
    } else {
        // Aperçu générique pour les templates sans rendu
        styleTag.textContent = `
            .generic-preview { 
                width: 210mm; 
                min-height: 297mm; 
                background: white; 
                padding: 40px; 
                box-shadow: 0 0 15px rgba(0,0,0,0.1);
                font-family: 'Inter', sans-serif;
            }
            .generic-preview h1 { color: var(--doc-primary-color, #0F172A); margin-bottom: 20px; }
            .generic-preview .field { margin: 15px 0; padding: 10px; background: #f8fafc; border-radius: 4px; }
            .generic-preview .field-label { font-weight: 600; color: #64748b; font-size: 0.9rem; }
            .generic-preview .field-value { margin-top: 5px; min-height: 20px; }
        `;
        
        let fieldsHtml = '';
        if (template.fields && template.fields.length > 0) {
            fieldsHtml = template.fields.map(field => `
                <div class="field">
                    <div class="field-label">${field.field_label}</div>
                    <div class="field-value" id="field-${field.field_name}" contenteditable="true">
                        ${field.default_value || `[${field.field_label}]`}
                    </div>
                </div>
            `).join('');
        } else {
            fieldsHtml = '<p style="color: #94a3b8; text-align: center; margin-top: 50px;">Aucun champ personnalisable pour ce document</p>';
        }
        
        canvas.innerHTML = `
            <div class="generic-preview">
                <h1>${template.name}</h1>
                <p style="color: #64748b; margin-bottom: 30px;">${template.description || ''}</p>
                ${fieldsHtml}
            </div>
        `;
    }
    
    applyPrimaryColor();
    syncEditableFields();
}

// ============================================
// GESTION DES COULEURS
// ============================================
function setupColorPicker() {
    const picker = document.getElementById('color-picker');
    const presets = document.querySelectorAll('.color-preset');
    
    picker.addEventListener('input', (e) => {
        editorState.primaryColor = e.target.value;
        applyPrimaryColor();
    });
    
    presets.forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.dataset.color;
            editorState.primaryColor = color;
            picker.value = color;
            applyPrimaryColor();
        });
    });
}

function applyPrimaryColor() {
    const canvas = document.getElementById('document-canvas');
    canvas.style.setProperty('--doc-primary-color', editorState.primaryColor);
}

// ============================================
// GESTION DE LA PHOTO
// ============================================
function setupPhotoUpload() {
    const input = document.getElementById('photo-input');
    const label = document.getElementById('photo-label');
    const removeBtn = document.getElementById('photo-remove');
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            editorState.photoDataUrl = event.target.result;
            label.textContent = '✓ Photo ajoutée';
            removeBtn.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
    
    removeBtn.addEventListener('click', () => {
        editorState.photoDataUrl = null;
        input.value = '';
        label.textContent = '+ Ajouter une photo';
        removeBtn.style.display = 'none';
    });
}

// ============================================
// GESTION DES CHAMPS DE TEXTE
// ============================================
function setupFields(fields) {
    const container = document.getElementById('fields-container');
    container.innerHTML = '';
    
    fields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'form-field';
        
        const label = document.createElement('label');
        label.textContent = field.field_label + (field.is_required ? ' *' : '');
        fieldDiv.appendChild(label);
        
        let input;
        if (field.field_type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 4;
        } else {
            input = document.createElement('input');
            input.type = field.field_type === 'color' ? 'color' : 'text';
        }
        
        input.id = `field-${field.field_name}`;
        input.value = field.default_value || '';
        input.placeholder = `Entrez ${field.field_label.toLowerCase()}`;
        
        input.addEventListener('input', (e) => {
            editorState.customData[field.field_name] = e.target.value;
            updateFieldInDocument(field.field_name, e.target.value);
        });
        
        fieldDiv.appendChild(input);
        container.appendChild(fieldDiv);
    });
}

function updateFieldInDocument(fieldName, value) {
    const fieldEl = document.getElementById(`field-${fieldName}`);
    if (fieldEl) {
        fieldEl.textContent = value;
    }
}

function syncEditableFields() {
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        const fieldId = el.id;
        if (fieldId && fieldId.startsWith('field-')) {
            const fieldName = fieldId.replace('field-', '');
            el.addEventListener('input', () => {
                editorState.customData[fieldName] = el.textContent;
                const input = document.getElementById(`field-${fieldName}`);
                if (input && input.tagName !== 'DIV') {
                    input.value = el.textContent;
                }
            });
        }
    });
}

// ============================================
// ZOOM
// ============================================
function setupZoomControls() {
    const zoomIn = document.getElementById('btn-zoom-in');
    const zoomOut = document.getElementById('btn-zoom-out');
    const zoomLevel = document.getElementById('zoom-level');
    const canvas = document.getElementById('document-canvas');
    
    zoomIn.addEventListener('click', () => {
        if (editorState.zoom < 150) {
            editorState.zoom += 10;
            canvas.style.transform = `scale(${editorState.zoom / 100})`;
            zoomLevel.textContent = `${editorState.zoom}%`;
        }
    });
    
    zoomOut.addEventListener('click', () => {
        if (editorState.zoom > 50) {
            editorState.zoom -= 10;
            canvas.style.transform = `scale(${editorState.zoom / 100})`;
            zoomLevel.textContent = `${editorState.zoom}%`;
        }
    });
}

// ============================================
// TÉLÉCHARGEMENT PDF
// ============================================
function setupDownloadButton() {
    const btn = document.getElementById('btn-download');
    btn.addEventListener('click', () => {
        alert('Téléchargement disponible après paiement. Cliquez sur "Acheter et télécharger" pour procéder au paiement.');
    });
}

// ============================================
// ACHAT ET PAIEMENT
// ============================================
function setupBuyButton() {
    const btn = document.getElementById('btn-buy');
    btn.addEventListener('click', () => {
        openPaymentModal();
    });
}

function setupPaymentModal() {
    const modal = document.getElementById('payment-modal');
    const closeBtn = document.getElementById('modal-close');
    const form = document.getElementById('payment-form');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await processPayment();
    });
}

function openPaymentModal() {
    const modal = document.getElementById('payment-modal');
    const { template } = editorState;
    
    document.getElementById('payment-doc-name').textContent = template.name;
    document.getElementById('payment-amount').textContent = `${template.price_xaf} FCFA`;
    
    modal.style.display = 'flex';
}

async function processPayment() {
    const { template } = editorState;
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
    const phone = document.getElementById('pay-phone').value;
    const email = document.getElementById('pay-email').value;
    
    if (!phone || !email) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    const purchaseToken = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pendingPurchase = await createPendingPurchase({
        purchase_token: purchaseToken,
        template_id: template.id,
        guest_email: email,
        guest_phone: phone,
        amount: template.price_xaf,
        payment_method: paymentMethod === 'MTN_MOMO' ? 'MTN' : 'AIRTEL'
    });
    
    if (pendingPurchase) {
        localStorage.setItem('takidoc_pending_token', purchaseToken);
        localStorage.setItem('takidoc_pending_email', email);
        localStorage.setItem('takidoc_pending_phone', phone);
        
        const openPayUrl = OPENPAY_LINKS[template.price_xaf];
        
        if (openPayUrl) {
            window.location.href = openPayUrl;
        } else {
            alert('Erreur: Montant non configuré pour le paiement');
        }
    } else {
        alert('Erreur lors de l\'enregistrement de votre demande de paiement. Veuillez réessayer.');
    }
}

// ============================================
// UTILITAIRES
// ============================================
function showError() {
    document.getElementById('editor-loading').style.display = 'none';
    document.getElementById('editor-error').style.display = 'flex';
}