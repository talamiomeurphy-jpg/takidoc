// ============================================
// TAKIDOC - LOGIQUE DE L'ÉDITEUR (VERSION FINALE)
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

// Valeurs par défaut pour TOUS les champs
const DEFAULT_VALUES = {
    'nom': 'Meurphy TALAMIO',
    'poste': 'Directeur Général',
    'email': 'brazzamarket.infos@gmail.com',
    'telephone': '+242 06 518 69 67',
    'adresse': 'Brazzaville, Congo',
    'profil': 'Professionnel expérimenté avec plus de 10 ans d\'expérience dans mon domaine. Passionné par l\'innovation et la recherche de l\'excellence. Je cherche à mettre mes compétences au service d\'une entreprise dynamique.',
    'exp1_titre': 'Directeur Général',
    'exp1_date': '2020 - Présent',
    'exp1_entreprise': 'Entreprise XYZ - Brazzaville',
    'exp1_desc': 'Direction stratégique de l\'entreprise. Management d\'une équipe de 50 personnes. Augmentation du chiffre d\'affaires de 30% en 2 ans.',
    'exp2_titre': 'Chef de Projet Senior',
    'exp2_date': '2015 - 2020',
    'exp2_entreprise': 'Société ABC - Pointe-Noire',
    'exp2_desc': 'Gestion de projets majeurs. Coordination avec les parties prenantes. Livraison de 15 projets dans les délais et budgets impartis.',
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
    'expediteur_adresse': 'Brazzaville, Congo',
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
    
    // Initialiser les données par défaut
    initializeDefaultData();
    
    // Rendu du document AVEC les valeurs par défaut
    renderDocument();
    
    // Setup des champs de formulaire
    setupFields(template.fields || []);
    
    setupZoomControls();
    setupDownloadButton();
    setupBuyButton();
    setupPaymentModal();
}

// ============================================
// INITIALISATION DES DONNÉES PAR DÉFAUT
// ============================================
function initializeDefaultData() {
    // Initialiser customData avec les valeurs par défaut
    Object.keys(DEFAULT_VALUES).forEach(key => {
        editorState.customData[key] = DEFAULT_VALUES[key];
    });
}

// ============================================
// RENDU DU DOCUMENT (AVEC VALEURS PAR DÉFAUT)
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
        
        // Injecter le HTML avec les valeurs par défaut REMPLACÉES
        let html = templateRender.htmlStructure || '<p>Aperçu non disponible</p>';
        
        // Remplacer tous les placeholders par les valeurs par défaut
        Object.keys(editorState.customData).forEach(key => {
            const regex = new RegExp(`id="field-${key}"[^>]*>[^<]*<`, 'g');
            const replacement = `id="field-${key}">${editorState.customData[key]}<`;
            html = html.replace(regex, replacement);
        });
        
        // Gérer la photo/initials
        if (template.has_photo) {
            const photoRegex = /<div class="cv-photo" id="doc-photo">[\s\S]*?<\/div>/;
            const photoReplacement = `<div class="cv-photo" id="doc-photo"><span class="cv-photo-placeholder" id="photo-initials">MT</span></div>`;
            html = html.replace(photoRegex, photoReplacement);
        }
        
        canvas.innerHTML = html;
    } else {
        // Rendu générique pour les templates sans design personnalisé
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
            fieldsHtml = template.fields.map(field => {
                const value = editorState.customData[field.field_name] || `[${field.field_label}]`;
                return `
                    <div class="field">
                        <div class="field-label">${field.field_label}</div>
                        <div class="field-value" id="field-${field.field_name}">${value}</div>
                    </div>
                `;
            }).join('');
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
    attachFieldListeners();
}

// ============================================
// ATTACHER LES ÉCOUTEURS D'ÉVÉNEMENTS (SYNCHRONISATION TEMPS RÉEL)
// ============================================
function attachFieldListeners() {
    // Pour chaque champ dans le document (id="field-xxx")
    document.querySelectorAll('[id^="field-"]').forEach(el => {
        const fieldName = el.id.replace('field-', '');
        
        // Écouter les modifications dans le document (contenteditable)
        el.addEventListener('input', (e) => {
            const newValue = e.target.textContent;
            editorState.customData[fieldName] = newValue;
            
            // Mettre à jour le champ de formulaire correspondant
            const input = document.getElementById(`input-field-${fieldName}`);
            if (input) {
                input.value = newValue;
            }
            
            // Mettre à jour les initiales si c'est le champ nom
            if (fieldName === 'nom') {
                updateInitials(newValue);
            }
        });
    });
}

// ============================================
// GESTION DES CHAMPS DE FORMULAIRE
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
        
        input.id = `input-field-${field.field_name}`;
        input.value = editorState.customData[field.field_name] || DEFAULT_VALUES[field.field_name] || `[${field.field_label}]`;
        input.placeholder = `Entrez ${field.field_label.toLowerCase()}`;
        
        // Synchronisation TEMPS RÉEL caractère par caractère
        input.addEventListener('input', (e) => {
            const newValue = e.target.value;
            editorState.customData[field.field_name] = newValue;
            
            // Mettre à jour le document immédiatement
            const docField = document.getElementById(`field-${field.field_name}`);
            if (docField) {
                docField.textContent = newValue;
            }
            
            // Mettre à jour les initiales si c'est le champ nom
            if (field.field_name === 'nom') {
                updateInitials(newValue);
            }
        });
        
        fieldDiv.appendChild(input);
        container.appendChild(fieldDiv);
    });
}

// ============================================
// MISE À JOUR DES INITIALES
// ============================================
function updateInitials(nomComplet) {
    const initialsElement = document.getElementById('photo-initials');
    if (!initialsElement) return;
    
    // Extraire les initiales (première lettre de chaque mot)
    const words = nomComplet.trim().split(/\s+/);
    let initials = '';
    
    if (words.length >= 2) {
        // Prendre la première lettre du premier et dernier mot
        initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length > 0) {
        initials = words[0][0].toUpperCase();
    } else {
        initials = '??';
    }
    
    initialsElement.textContent = initials;
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
        // Afficher la photo
        photoContainer.innerHTML = `<img src="${editorState.photoDataUrl}" alt="Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
        // Afficher les initiales
        const nom = editorState.customData['nom'] || 'Meurphy TALAMIO';
        const words = nom.trim().split(/\s+/);
        let initials = 'MT';
        if (words.length >= 2) {
            initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
        }
        photoContainer.innerHTML = `<span class="cv-photo-placeholder" id="photo-initials" style="font-size: 2rem; font-weight: 700; color: white;">${initials}</span>`;
    }
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
// TÉLÉCHARGEMENT PDF (CORRIGÉ)
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
    
    // Message de chargement
    const btn = document.getElementById('btn-download');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Génération en cours...';
    btn.disabled = true;
    
    try {
        // Capturer le document avec html2canvas
        const canvasImage = await html2canvas(canvas, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: canvas.scrollWidth,
            windowHeight: canvas.scrollHeight
        });
        
        // Créer le PDF avec jsPDF
        const imgData = canvasImage.toDataURL('image/jpeg', 0.98);
        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Calculer les dimensions pour A4
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvasImage.width;
        const imgHeight = canvasImage.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;
        
        pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        
        // Télécharger le PDF
        pdf.save(`TakiDoc_${template.id}_${Date.now()}.pdf`);
        
    } catch (error) {
        console.error('Erreur PDF:', error);
        alert('Erreur lors du téléchargement du PDF: ' + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
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