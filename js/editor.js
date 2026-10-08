// ============================================
// TAKIDOC - LOGIQUE DE L'ÉDITEUR (VERSION FINALE & ROBUSTE)
// L'équipe Meurphy
// ============================================

import { fetchTemplateById, createPendingPurchase } from './supabase-config.js';
import { templatesRegistry } from './templates-registry.js';

const OPENPAY_LINKS = {
    800: 'https://openpay.cg/pay/f70b59c1f63e0e6a2d55b5dbde5203fe5bb6d73645b7c2cf8fc9a60117c9282b',
    1000: 'https://openpay.cg/pay/d244c8900efd9f3a73c98436fe4ffcae61ed413c99ede74a6de8bd705b91dc2c',
    1200: 'https://openpay.cg/pay/bb6a4ec95996eaed88ba07272e00756803f63fa4af7f134d2accb492ebdf6e59',
    1500: 'https://openpay.cg/pay/be4cd427a7983f19eef52bc147df73a661c3858e4498a1cc0212892429f79bfa',
    2000: 'https://openpay.cg/pay/77983426652c9016148a17667af0c89b9957ed04eac76e4a4ec6922859f31a1e'
};

const editorState = {
    template: null,
    templateRender: null,
    zoom: window.innerWidth <= 768 ? 0.20 : 1.0, // ← 20% sur mobile, 100% sur PC
    customData: {},
    primaryColor: '#0F172A',
    photoDataUrl: null
};

const DEFAULT_VALUES = {
    'nom': 'Meurphy TALAMIO', 'poste': 'Directeur Général', 'email': 'brazzamarket.infos@gmail.com',
    'telephone': '+242 06 518 69 67', 'adresse': 'Brazzaville, Congo',
    'profil': 'Professionnel expérimenté avec plus de 10 ans d\'expérience.',
    'exp1_titre': 'Directeur Général', 'exp1_date': '2020 - Présent', 'exp1_entreprise': 'Entreprise XYZ', 'exp1_desc': 'Direction stratégique.',
    'exp2_titre': 'Chef de Projet', 'exp2_date': '2015 - 2020', 'exp2_entreprise': 'Société ABC', 'exp2_desc': 'Gestion de projets.',
    'form1_diplome': 'Master en Management', 'form1_ecole': 'Université Marien Ngouabi', 'form1_date': '2013 - 2015',
    'skill1_name': 'Gestion de projet', 'skill2_name': 'Leadership', 'skill3_name': 'Communication', 'skill4_name': 'Analyse',
    'lang1_name': 'Français', 'lang1_level': 'Courant', 'lang2_name': 'Anglais', 'lang2_level': 'Professionnel',
    'interets': 'Lecture, Voyages, Technologie',
    'expediteur_nom': 'Meurphy TALAMIO', 'expediteur_adresse': 'Brazzaville, Congo', 'expediteur_telephone': '+242 06 518 69 67', 'expediteur_email': 'brazzamarket.infos@gmail.com',
    'destinataire_nom': 'Monsieur le Directeur', 'destinataire_fonction': 'DRH', 'destinataire_entreprise': 'Entreprise Cible', 'destinataire_adresse': 'Brazzaville',
    'objet': 'Candidature au poste', 'paragraphe1': 'Madame, Monsieur,', 'paragraphe2': 'Je me permets de vous adresser ma candidature.', 'paragraphe3': 'Mes compétences correspondent à vos besoins.', 'paragraphe4': 'Dans l\'attente de votre réponse, cordialement.', 'signature': 'Meurphy TALAMIO'
};

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('id');
    
    if (!templateId) { showError(); return; }
    
    const template = await fetchTemplateById(templateId);
    if (!template) { showError(); return; }
    
    const templateRender = templatesRegistry.find(t => t.id === templateId);
    
    editorState.template = template;
    editorState.templateRender = templateRender;
    
    initEditor();
});

function initEditor() {
    const { template, templateRender } = editorState;
    
    document.getElementById('editor-loading').style.display = 'none';
    document.getElementById('editor-interface').style.display = 'grid';
    
    document.getElementById('doc-title').textContent = template.name;
    document.getElementById('doc-category').textContent = template.category?.name || 'Document';
    document.getElementById('doc-price').textContent = `${template.price_xaf} FCFA`;
    
    if (template.hasPhoto) {
        document.getElementById('photo-section').style.display = 'block';
        setupPhotoUpload();
    }
    if (template.hasColorPicker) {
        document.getElementById('color-section').style.display = 'block';
        setupColorPicker();
    }
    
    initializeDefaultData();
    renderDocument();
    setupFields(template.fields || []);
    
    // Initialisation du zoom
    setupZoomControls();
    updateZoomDisplay(); // Applique le 20% sur mobile immédiatement
    
    setupDownloadButton();
    setupBuyButton();
    setupPaymentModal();
}

// ============================================
// RENDU ET DONNÉES
// ============================================
function initializeDefaultData() {
    Object.keys(DEFAULT_VALUES).forEach(key => {
        editorState.customData[key] = DEFAULT_VALUES[key];
    });
}

function renderDocument() {
    const canvas = document.getElementById('document-canvas');
    const { templateRender, template } = editorState;
    
    let styleTag = document.getElementById('template-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'template-style';
        document.head.appendChild(styleTag);
    }
    
    if (templateRender) {
        styleTag.textContent = templateRender.cssStyles || '';
        let html = templateRender.htmlStructure || '<p>Aperçu non disponible</p>';
        
        Object.keys(editorState.customData).forEach(key => {
            const regex = new RegExp(`id="field-${key}"[^>]*>[^<]*<`, 'g');
            const replacement = `id="field-${key}">${editorState.customData[key]}<`;
            html = html.replace(regex, replacement);
        });
        
        if (template.hasPhoto) {
            const photoRegex = /<div class="[^"]*photo[^"]*" id="doc-photo">[\s\S]*?<\/div>/;
            html = html.replace(photoRegex, `<div class="cv-photo" id="doc-photo"><span class="cv-photo-placeholder" id="photo-initials">MT</span></div>`);
        }
        
        canvas.innerHTML = html;
    } else {
        styleTag.textContent = `.generic-preview { width: 210mm; min-height: 297mm; background: white; padding: 40px; }`;
        canvas.innerHTML = `<div class="generic-preview"><h1>${template.name}</h1><p>${template.description || ''}</p></div>`;
    }
    
    applyPrimaryColor();
    attachFieldListeners();
}

function attachFieldListeners() {
    document.querySelectorAll('[id^="field-"]').forEach(el => {
        const fieldName = el.id.replace('field-', '');
        el.addEventListener('input', (e) => {
            editorState.customData[fieldName] = e.target.textContent;
            const input = document.getElementById(`input-field-${fieldName}`);
            if (input) input.value = e.target.textContent;
            if (fieldName === 'nom') updateInitials(e.target.textContent);
        });
    });
}

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
            input.type = 'text';
        }
        
        input.id = `input-field-${field.field_name}`;
        input.value = editorState.customData[field.field_name] || `[${field.field_label}]`;
        
        input.addEventListener('input', (e) => {
            editorState.customData[field.field_name] = e.target.value;
            const docField = document.getElementById(`field-${field.field_name}`);
            if (docField) docField.textContent = e.target.value;
            if (field.field_name === 'nom') updateInitials(e.target.value);
        });
        
        fieldDiv.appendChild(input);
        container.appendChild(fieldDiv);
    });
}

function updateInitials(nomComplet) {
    const initialsElement = document.getElementById('photo-initials');
    if (!initialsElement) return;
    const words = nomComplet.trim().split(/\s+/);
    let initials = 'MT';
    if (words.length >= 2) initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
    else if (words.length === 1 && words[0].length > 0) initials = words[0][0].toUpperCase();
    initialsElement.textContent = initials;
}

// ============================================
// FONCTIONNALITÉS (Photo, Couleur, Zoom)
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
        label.textContent = 'Ajouter une photo';
        removeBtn.style.display = 'none';
        updatePhotoInDocument();
    });
}

function updatePhotoInDocument() {
    const photoContainer = document.getElementById('doc-photo');
    if (!photoContainer) return;
    if (editorState.photoDataUrl) {
        photoContainer.innerHTML = `<img src="${editorState.photoDataUrl}" alt="Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
        const nom = editorState.customData['nom'] || 'Meurphy TALAMIO';
        const words = nom.trim().split(/\s+/);
        let initials = 'MT';
        if (words.length >= 2) initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
        photoContainer.innerHTML = `<span class="cv-photo-placeholder" id="photo-initials" style="font-size: 2rem; font-weight: 700; color: white;">${initials}</span>`;
    }
}

function setupColorPicker() {
    const picker = document.getElementById('color-picker');
    picker.addEventListener('input', (e) => {
        editorState.primaryColor = e.target.value;
        applyPrimaryColor();
    });
    document.querySelectorAll('.color-preset').forEach(preset => {
        preset.addEventListener('click', () => {
            editorState.primaryColor = preset.dataset.color;
            picker.value = preset.dataset.color;
            applyPrimaryColor();
        });
    });
}

function applyPrimaryColor() {
    document.getElementById('document-canvas').style.setProperty('--doc-primary-color', editorState.primaryColor);
}

// ============================================
// ZOOM (LOGIQUE ROBUSTE ET UNIQUE)
// ============================================
function updateZoomDisplay() {
    const canvas = document.getElementById('document-canvas');
    const zoomLevelEl = document.getElementById('zoom-level');
    if (!canvas) return;

    // Le secret : transform-origin: top center garde le document centré horizontalement
    canvas.style.transform = `scale(${editorState.zoom})`;
    canvas.style.transformOrigin = 'top center';

    if (zoomLevelEl) {
        zoomLevelEl.textContent = `${Math.round(editorState.zoom * 100)}%`;
    }
}

function setupZoomControls() {
    const btnIn = document.getElementById('btn-zoom-in');
    const btnOut = document.getElementById('btn-zoom-out');
    const btnReset = document.getElementById('btn-zoom-reset');

    if (btnIn) {
        btnIn.addEventListener('click', (e) => {
            e.preventDefault();
            if (editorState.zoom < 2.0) {
                editorState.zoom = parseFloat((editorState.zoom + 0.1).toFixed(2));
                updateZoomDisplay();
            }
        });
    }

    if (btnOut) {
        btnOut.addEventListener('click', (e) => {
            e.preventDefault();
            if (editorState.zoom > 0.2) { // ← MINIMUM 20% GARANTI
                editorState.zoom = parseFloat((editorState.zoom - 0.1).toFixed(2));
                updateZoomDisplay();
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', (e) => {
            e.preventDefault();
            editorState.zoom = window.innerWidth <= 768 ? 0.20 : 1.0;
            updateZoomDisplay();
        });
    }
}

// ============================================
// PDF, ACHAT & UTILITAIRES
// ============================================
function setupDownloadButton() {
    document.getElementById('btn-download').addEventListener('click', generatePDF);
}

async function generatePDF() {
    const { template } = editorState;
    const canvas = document.getElementById('document-canvas');
    const btn = document.getElementById('btn-download');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération...';
    btn.disabled = true;
    
    try {
        const previousZoom = editorState.zoom;
        editorState.zoom = 1.0; // Zoom à 100% pour une capture HD
        updateZoomDisplay();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const canvasImage = await html2canvas(canvas, {
            scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: '#ffffff'
        });
        
        const imgData = canvasImage.toDataURL('image/jpeg', 0.98);
        const pdf = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`TakiDoc_${template.id}_${Date.now()}.pdf`);
        
        editorState.zoom = previousZoom; // Restaurer le zoom de l'utilisateur
        updateZoomDisplay();
        
    } catch (error) {
        console.error('Erreur PDF:', error);
        alert('Erreur lors du téléchargement du PDF.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function setupBuyButton() {
    document.getElementById('btn-buy').addEventListener('click', openPaymentModal);
    document.getElementById('btn-buy-sidebar').addEventListener('click', openPaymentModal);
}

function setupPaymentModal() {
    document.getElementById('modal-close').addEventListener('click', () => {
        document.getElementById('payment-modal').style.display = 'none';
    });
    document.getElementById('payment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await processPayment();
    });
}

function openPaymentModal() {
    const { template } = editorState;
    document.getElementById('payment-doc-name').textContent = template.name;
    document.getElementById('payment-amount').textContent = `${template.price_xaf} FCFA`;
    document.getElementById('payment-modal').style.display = 'flex';
}

async function processPayment() {
    const { template } = editorState;
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
    const phone = document.getElementById('pay-phone').value;
    const email = document.getElementById('pay-email').value;
    
    if (!phone || !email) { alert('Veuillez remplir tous les champs.'); return; }
    
    const purchaseToken = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pendingPurchase = await createPendingPurchase({
        purchase_token: purchaseToken, template_id: template.id, guest_email: email,
        guest_phone: phone, amount: template.price_xaf, payment_method: paymentMethod === 'MTN_MOMO' ? 'MTN' : 'AIRTEL'
    });
    
    if (pendingPurchase) {
        localStorage.setItem('takidoc_pending_token', purchaseToken);
        const openPayUrl = OPENPAY_LINKS[template.price_xaf] || OPENPAY_LINKS[1000];
        if (openPayUrl) window.location.href = openPayUrl;
        else alert('Erreur: Montant non configuré.');
    } else {
        alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    }
}

function showError() {
    document.getElementById('editor-loading').style.display = 'none';
    document.getElementById('editor-error').style.display = 'flex';
}