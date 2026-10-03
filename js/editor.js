// ============================================
// TAKIDOC - LOGIQUE DE L'ÉDITEUR (VERSION CORRIGÉE)
// L'équipe Meurphy
// ============================================

import { fetchTemplateById, createPendingPurchase } from './supabase-config.js';
import { templatesRegistry } from './templates-registry.js';

// URLs OpenPay par montant
const OPENPAY_LINKS = {
    100: 'https://openpay.cg/pay/4c2d33bc4576c2978c1ceee857019d18245b36646eacf33abcb6ec7b8c6337bd',
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
    
    const templateRender = templatesRegistry.find(t => t.id === templateId);
    
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
    
    if (templateRender) {
        styleTag.textContent = templateRender.cssStyles || '';
        canvas.innerHTML = templateRender.htmlStructure || '<p>Aperçu non disponible</p>';
    } else {
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
    
    // Mettre à jour tous les éléments qui utilisent la couleur
    canvas.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.color.includes('var(--doc-primary-color)') || 
            style.backgroundColor.includes('var(--doc-primary-color)') ||
            style.borderColor.includes('var(--doc-primary-color)')) {
            el.style.color = editorState.primaryColor;
            el.style.backgroundColor = editorState.primaryColor;
            el.style.borderColor = editorState.primaryColor;
        }
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
        photoContainer.innerHTML = `<img src="${editorState.photoDataUrl}" alt="Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
        photoContainer.innerHTML = '<span class="cv-photo-placeholder">Photo</span>';
    }
}

// ============================================
// GESTION DES CHAMPS DE TEXTE (CORRIGÉ)
// ============================================
function setupFields(fields) {
    const container = document.getElementById('fields-container');
    container.innerHTML = '';
    
    // Valeurs par défaut pour les champs courants
    const defaultValues = {
        'nom': 'Meurphy TALAMIO',
        'poste': 'Directeur Général',
        'email': 'brazzamarket.infos@gmail.com',
        'telephone': '+242 06 518 69 67',
        'adresse': 'Brazzaville, Congo',
        'profil': 'Professionnel expérimenté avec plus de 10 ans d\'expérience dans mon domaine. Passionné par l\'innovation et la recherche de l\'excellence.',
        'exp1_titre': 'Directeur Général',
        'exp1_date': '2020 - Présent',
        'exp1_entreprise': 'Entreprise XYZ - Brazzaville',
        'exp1_desc': 'Direction stratégique de l\'entreprise. Management d\'une équipe de 50 personnes.',
        'exp2_titre': 'Chef de Projet Senior',
        'exp2_date': '2015 - 2020',
        'exp2_entreprise': 'Société ABC - Pointe-Noire',
        'exp2_desc': 'Gestion de projets majeurs. Coordination avec les parties prenantes.',
        'form1_diplome': 'Master en Management',
        'form1_ecole': 'Université Marien Ngouabi',
        'form1_date': '2013 - 2015',
        'form2_diplome': 'Licence en Gestion',
        'form2_ecole': 'Université de Brazzaville',
        'form2_date': '2010 - 2013',
        'skill1_name': 'Gestion de projet',
        'skill2_name': 'Leadership',
        'skill3_name': 'Communication',
        'skill4_name': 'Analyse stratégique',
        'lang1_name': 'Français',
        'lang1_level': 'Courant',
        'lang2_name': 'Anglais',
        'lang2_level': 'Professionnel',
        'interets': 'Lecture, Voyages, Technologie, Sport',
        'expediteur_nom': 'Meurphy TALAMIO',
        'expediteur_adresse': 'Brazzaville, Congo\nTéléphone: +242 06 518 69 67',
        'expediteur_telephone': '+242 06 518 69 67',
        'expediteur_email': 'brazzamarket.infos@gmail.com',
        'destinataire_nom': 'Monsieur le Directeur',
        'destinataire_fonction': 'Directeur des Ressources Humaines',
        'destinataire_entreprise': 'Entreprise Cible',
        'destinataire_adresse': 'Brazzaville, Congo',
        'objet': 'Candidature au poste de Directeur Général',
        'paragraphe1': 'Madame, Monsieur,',
        'paragraphe2': 'Par la présente, je me permets de vous adresser ma candidature pour le poste mentionné ci-dessus. Fort d\'une expérience solide dans mon domaine, je suis convaincu de pouvoir apporter une contribution significative à votre entreprise.',
        'paragraphe3': 'Au cours de mon parcours professionnel, j\'ai développé des compétences clés qui correspondent parfaitement aux exigences de ce poste. Mon sens de l\'initiative, ma capacité d\'adaptation et mon esprit d\'équipe sont des atouts que je souhaite mettre à votre disposition.',
        'paragraphe4': 'Je serais honoré de pouvoir vous exposer plus en détail mes motivations lors d\'un entretien. Dans l\'attente de votre réponse, je vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.',
        'signature': 'Meurphy TALAMIO'
    };
    
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
        // Utiliser la valeur par défaut si elle existe, sinon une valeur générique
        input.value = field.default_value || defaultValues[field.field_name] || `[${field.field_label}]`;
        input.placeholder = `Entrez ${field.field_label.toLowerCase()}`;
        
        // Stocker la valeur initiale
        editorState.customData[field.field_name] = input.value;
        
        // Écouter les changements en temps réel
        input.addEventListener('input', (e) => {
            editorState.customData[field.field_name] = e.target.value;
            updateFieldInDocument(field.field_name, e.target.value);
        });
        
        fieldDiv.appendChild(input);
        container.appendChild(fieldDiv);
    });
    
    // Initialiser le document avec les valeurs par défaut
    setTimeout(() => {
        fields.forEach(field => {
            const input = document.getElementById(`field-${field.field_name}`);
            if (input) {
                updateFieldInDocument(field.field_name, input.value);
            }
        });
    }, 100);
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
// TÉLÉCHARGEMENT PDF (GRATUIT EN MODE TEST)
// ============================================
function setupDownloadButton() {
    const btn = document.getElementById('btn-download');
    btn.addEventListener('click', () => {
        generatePDF();
    });
}

async function generatePDF() {
    const { template } = editorState;
    const canvas = document.getElementById('document-canvas');
    
    // Créer un clone du document pour le PDF
    const clone = canvas.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.transform = 'none';
    document.body.appendChild(clone);
    
    const opt = {
        margin: 0,
        filename: `TakiDoc_${template.id}_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    try {
        await html2pdf().set(opt).from(clone).save();
        alert('PDF téléchargé avec succès !');
    } catch (error) {
        console.error('Erreur PDF:', error);
        alert('Erreur lors du téléchargement du PDF');
    }
    
    document.body.removeChild(clone);
}

// ============================================
// ACHAT ET PAIEMENT (OPTIONNEL EN MODE TEST)
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