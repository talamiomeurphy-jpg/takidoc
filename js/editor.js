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
    // Récupérer l'ID du template depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('id');
    
    if (!templateId) {
        showError();
        return;
    }
    
    // Charger le template depuis Supabase
    const template = await fetchTemplateById(templateId);
    
    if (!template) {
        showError();
        return;
    }
    
    // Trouver le rendu visuel dans le registry JS
    const templateRender = templatesRegistry.find(t => t.id === templateId);
    
    if (!templateRender) {
        console.error('Template trouvé dans la BDD mais pas dans le registry JS');
        showError();
        return;
    }
    
    // Initialiser l'éditeur
    editorState.template = template;
    editorState.templateRender = templateRender;
    editorState.primaryColor = '#0F172A';
    
    initEditor();
});

// ============================================
// INITIALISATION DE L'INTERFACE
// ============================================
function initEditor() {
    const { template, templateRender } = editorState;
    
    // Cacher le loading, montrer l'interface
    document.getElementById('editor-loading').style.display = 'none';
    document.getElementById('editor-interface').style.display = 'grid';
    
    // Titre et catégorie
    document.getElementById('doc-title').textContent = template.name;
    document.getElementById('doc-category').textContent = template.category?.name || 'Document';
    document.getElementById('doc-price').textContent = `${template.price_xaf} FCFA`;
    
    // Section photo
    if (template.has_photo) {
        document.getElementById('photo-section').style.display = 'block';
        setupPhotoUpload();
    }
    
    // Section couleur
    if (template.has_color_picker) {
        document.getElementById('color-section').style.display = 'block';
        setupColorPicker();
    }
    
    // Champs personnalisables
    setupFields(template.fields || []);
    
    // Rendu du document
    renderDocument();
    
    // Boutons
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
    const { templateRender } = editorState;
    
    // Injecter le CSS spécifique au template
    let styleTag = document.getElementById('template-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'template-style';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent = templateRender.cssStyles || '';
    
    // Injecter le HTML du document
    canvas.innerHTML = templateRender.htmlStructure || '<p>Aperçu non disponible</p>';
    
    // Appliquer la couleur primaire
    applyPrimaryColor();
    
    // Rendre les champs éditables synchronisés
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
    
    // Mettre à jour les éléments avec la couleur inline
    canvas.querySelectorAll('[style*="var(--doc-primary-color"]').forEach(el => {
        el.style.color = editorState.primaryColor;
        el.style.borderColor = editorState.primaryColor;
        el.style.backgroundColor = editorState.primaryColor;
    });
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
            updatePhotoInDocument();
        };
        reader.readAsDataURL(file);
    });
    
    removeBtn.addEventListener('click', () => {
        editorState.photoDataUrl = null;
        input.value = '';
        label.textContent = '+ Ajouter une photo';
        removeBtn.style.display = 'none';
        updatePhotoInDocument();
    });
}

function updatePhotoInDocument() {
    const photoContainer = document.getElementById('doc-photo');
    if (!photoContainer) return;
    
    if (editorState.photoDataUrl) {
        photoContainer.innerHTML = `<img src="${editorState.photoDataUrl}" alt="Photo">`;
    } else {
        photoContainer.innerHTML = '<span class="photo-placeholder">Photo</span>';
    }
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
    // Synchroniser les champs contenteditable avec les inputs
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
    
    // Validation
    if (!phone || !email) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    // Générer un token unique
    const purchaseToken = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Créer l'intention d'achat dans Supabase
    const pendingPurchase = await createPendingPurchase({
        purchase_token: purchaseToken,
        template_id: template.id,
        guest_email: email,
        guest_phone: phone,
        amount: template.price_xaf,
        payment_method: paymentMethod === 'MTN_MOMO' ? 'MTN' : 'AIRTEL'
    });
    
    if (pendingPurchase) {
        // Stocker le token dans localStorage pour la page de confirmation
        localStorage.setItem('takidoc_pending_token', purchaseToken);
        localStorage.setItem('takidoc_pending_email', email);
        localStorage.setItem('takidoc_pending_phone', phone);
        
        // Obtenir l'URL OpenPay correspondante au montant
        const openPayUrl = OPENPAY_LINKS[template.price_xaf];
        
        if (openPayUrl) {
            // Rediriger vers OpenPay
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