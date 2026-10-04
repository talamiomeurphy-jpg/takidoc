// ============================================
// TAKIDOC - MOTEUR PRINCIPAL
// L'équipe Meurphy
// ============================================
import { fetchTemplates, fetchCategories } from './supabase-config.js';
import { templatesRegistry } from './templates-registry.js';

// État global
let allTemplates = [];
let allCategories = [];

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Charger les données depuis Supabase
    await loadData();
    
    // Afficher les catégories (filtres)
    renderCategories();
    
    // Afficher les templates
    renderTemplates(allTemplates);
    
    console.log("✅ Moteur TakiDoc initialisé. L'équipe Meurphy est en service.");
});

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================
async function loadData() {
    const [templates, categories] = await Promise.all([
        fetchTemplates(),
        fetchCategories()
    ]);
    
    allTemplates = templates;
    allCategories = categories;
    
    if (templates.length === 0) {
        console.warn('Aucun template trouvé dans la base de données');
    }
}

// ============================================
// AFFICHAGE DES CATÉGORIES (FILTRES)
// ============================================
function renderCategories() {
    const container = document.getElementById('categories-filter');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Bouton "Tous"
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.textContent = 'Tous';
    allBtn.dataset.category = 'all';
    allBtn.addEventListener('click', () => filterTemplates('all'));
    container.appendChild(allBtn);
    
    // Boutons par catégorie
    allCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = cat.name;
        btn.dataset.category = cat.id;
        btn.addEventListener('click', () => filterTemplates(cat.id));
        container.appendChild(btn);
    });
}

// ============================================
// FILTRAGE DES TEMPLATES
// ============================================
function filterTemplates(categoryId) {
    // Mettre à jour les boutons actifs
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === categoryId) {
            btn.classList.add('active');
        }
    });
    
    // Filtrer les templates
    const filtered = categoryId === 'all' 
        ? allTemplates 
        : allTemplates.filter(t => t.category_id === categoryId);
    
    renderTemplates(filtered);
}

// ============================================
// AFFICHAGE DES TEMPLATES
// ============================================

// ============================================
// AFFICHAGE DES DOCUMENTS POPULAIRES (PAGE D'ACCUEIL)
// ============================================
function renderPopularDocuments() {
    const grid = document.getElementById('popular-docs');
    if (!grid) return;
    
    // Prendre les 6 premiers documents du registre
    const popularDocs = templatesRegistry.slice(0, 6);
    
    grid.innerHTML = '';
    
    if (popularDocs.length === 0) {
        grid.innerHTML = '<div class="loading-text">Chargement des documents...</div>';
        return;
    }
    
    popularDocs.forEach(template => {
        const card = document.createElement('div');
        card.className = 'doc-item';
        card.style.cursor = 'pointer';
        
        // Générer l'aperçu réaliste du document
        const previewHtml = generateDocumentPreview(template);
        
        card.innerHTML = `
            <div class="template-preview" style="height: 180px; margin-bottom: 1rem; background: #f8fafc; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                <div class="preview-scaler" style="transform: scale(0.5); width: 100%; height: 100%;">
                    ${previewHtml}
                </div>
            </div>
            <h3>${template.name}</h3>
            <p>${template.description}</p>
            <div class="doc-price">${template.price.toLocaleString()} FCFA</div>
            <button class="btn-doc" onclick="window.location.href='editor.html?id=${template.id}'">
                Voir le document
            </button>
        `;
        
        // Clic sur toute la carte
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-doc')) {
                window.location.href = `editor.html?id=${template.id}`;
            }
        });
        
        grid.appendChild(card);
    });
}

// Icône par catégorie
function getCategoryIcon(category) {
    const icons = {
        'cv': 'fa-user',
        'lettre': 'fa-envelope-open-text',
        'attestation': 'fa-certificate',
        'contrat': 'fa-file-contract',
        'commercial': 'fa-file-invoice-dollar',
        'administratif': 'fa-building'
    };
    return icons[category] || 'fa-file-alt';
}

// ============================================
// INITIALISATION MODIFIÉE
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Charger les données depuis Supabase
    await loadData();
    
    // Afficher les documents populaires (page d'accueil)
    renderPopularDocuments();
    
    // Afficher les catégories (filtres) - si présent sur la page
    renderCategories();
    
    // Afficher TOUS les templates (si sur page documents.html)
    const allTemplatesGrid = document.getElementById('templates-grid');
    if (allTemplatesGrid) {
        renderTemplates(allTemplates);
    }
    
    console.log("✅ Moteur TakiDoc initialisé. L'équipe Meurphy est en service.");
});
// ============================================
// GÉNÉRATEUR D'APERÇUS VISUELS PAR TYPE DE DOCUMENT
// ============================================
// Générer l'aperçu basé sur le type de document
function generateDocumentPreview(template) {
    const name = template.name.toLowerCase();
    
    if (name.includes('cv')) {
        return `
            <div class="real-preview-cv">
                <div class="cv-header-real">
                    <div class="cv-name">Jean-Baptiste NKOUA</div>
                    <div class="cv-title">Directeur Général</div>
                </div>
                <div class="cv-body-real">
                    <div class="cv-section">
                        <div class="cv-section-title">PROFIL</div>
                        <div class="cv-text">Professionnel expérimenté...</div>
                    </div>
                    <div class="cv-section">
                        <div class="cv-section-title">EXPÉRIENCES</div>
                        <div class="cv-item">
                            <div class="cv-item-title">Directeur Général</div>
                            <div class="cv-item-company">Entreprise XYZ</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (name.includes('attestation')) {
        return `
            <div class="real-preview-attestation">
                <div class="attestation-real-header">ENTREPRISE XYZ</div>
                <div class="attestation-real-title">ATTESTATION DE TRAVAIL</div>
                <div class="attestation-real-body">
                    <p>Je soussigné certifie que...</p>
                </div>
            </div>
        `;
    }
    
    if (name.includes('lettre')) {
        return `
            <div class="real-preview-letter">
                <div class="letter-real-name">Meurphy TALAMIO</div>
                <div class="letter-real-objet">Objet : Candidature</div>
                <div class="letter-real-body">
                    <p>Madame, Monsieur...</p>
                </div>
            </div>
        `;
    }
    
    if (name.includes('contrat')) {
        return `
            <div class="real-preview-contract">
                <div class="contract-real-title">CONTRAT DE TRAVAIL</div>
                <div class="contract-real-parties">
                    <div class="contract-party"><strong>ENTREPRISE XYZ</strong></div>
                    <div class="contract-party"><strong>Meurphy TALAMIO</strong></div>
                </div>
            </div>
        `;
    }
    
    if (name.includes('devis') || name.includes('facture')) {
        return `
            <div class="real-preview-invoice">
                <div class="invoice-real-header">
                    <div class="invoice-real-company"><strong>ENTREPRISE XYZ</strong></div>
                    <div class="invoice-real-client"><strong>CLIENT</strong></div>
                </div>
                <div class="invoice-real-title">FACTURE</div>
                <div class="invoice-real-total">Total: 1 534 000 FCFA</div>
            </div>
        `;
    }
    
    // Document générique
    return `
        <div class="real-preview-generic">
            <div class="generic-real-title">${template.name.toUpperCase()}</div>
            <div class="generic-real-body">
                <p>Document professionnel...</p>
            </div>
        </div>
    `;
}