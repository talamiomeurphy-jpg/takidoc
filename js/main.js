// ============================================
// TAKIDOC - MOTEUR PRINCIPAL
// L'équipe Meurphy
// ============================================
import { fetchTemplates, fetchCategories } from './supabase-config.js';

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
// AFFICHAGE DES TEMPLATES (AVEC MINIATURES RÉALISTES)
// ============================================
function renderTemplates(templates) {
    const grid = document.getElementById('templates-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (templates.length === 0) {
        grid.innerHTML = '<div class="loading-text">Aucun document disponible pour cette catégorie.</div>';
        return;
    }
    
    templates.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card';
        
        // Badge "Populaire" pour les featured
        const badgeHtml = template.is_featured ? 
            '<span class="template-badge"><i class="fas fa-star"></i> Populaire</span>' : '';
        
        // Générer l'aperçu en fonction du type de document
        const previewHtml = generateDocumentPreview(template);
        
        card.innerHTML = `
            <div class="template-preview">
                ${badgeHtml}
                ${previewHtml}
            </div>
            <div class="template-card-body">
                <div class="template-category">${template.category?.name || 'Document'}</div>
                <h3 class="template-title">${template.name}</h3>
                <p class="template-description">${template.description || 'Document professionnel personnalisable'}</p>
                <div class="template-footer">
                    <div class="template-price">
                        ${template.price_xaf} <span>FCFA</span>
                    </div>
                    <a href="editor.html?id=${template.id}" class="btn btn-primary" style="padding: 0.7rem 1.5rem; font-size: 0.9rem;">
                        Prévisualiser
                    </a>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// ============================================
// GÉNÉRATEUR D'APERÇUS VISUELS PAR TYPE DE DOCUMENT
// ============================================
// ============================================
// GÉNÉRATEUR D'APERÇUS AVEC VRAI TEXTE
// ============================================
function generateDocumentPreview(template) {
    const name = template.name.toLowerCase();
    
    // CV - Avec vrai texte
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
                        <div class="cv-text">Professionnel expérimenté avec plus de 10 ans d'expérience...</div>
                    </div>
                    <div class="cv-section">
                        <div class="cv-section-title">EXPÉRIENCES</div>
                        <div class="cv-item">
                            <div class="cv-item-title">Directeur Général - 2020-Présent</div>
                            <div class="cv-item-company">Entreprise XYZ - Brazzaville</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Lettres de motivation
    if (name.includes('lettre')) {
        return `
            <div class="real-preview-letter">
                <div class="letter-real-header">
                    <div class="letter-real-name">Meurphy TALAMIO</div>
                    <div class="letter-real-contact">brazzamarket.infos@gmail.com | +242 06 518 69 67</div>
                </div>
                <div class="letter-real-date">Brazzaville, le 04 octobre 2026</div>
                <div class="letter-real-objet">Objet : Candidature au poste de Directeur Général</div>
                <div class="letter-real-body">
                    <p>Madame, Monsieur,</p>
                    <p>Par la présente, je me permets de vous adresser ma candidature pour le poste mentionné ci-dessus...</p>
                    <p>Au cours de mon parcours professionnel, j'ai développé des compétences clés...</p>
                </div>
                <div class="letter-real-signature">Cordialement,<br>Meurphy TALAMIO</div>
            </div>
        `;
    }
    
    // Contrats
    if (name.includes('contrat')) {
        return `
            <div class="real-preview-contract">
                <div class="contract-real-title">CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE</div>
                <div class="contract-real-parties">
                    <div class="contract-party">
                        <strong>ENTREPRISE XYZ</strong><br>
                        123 Avenue de l'Indépendance<br>
                        Brazzaville
                    </div>
                    <div class="contract-party">
                        <strong>Meurphy TALAMIO</strong><br>
                        Né le 01/01/1990 à Brazzaville<br>
                        CNI n° 123456789
                    </div>
                </div>
                <div class="contract-real-article">
                    <strong>Article 1 - Objet</strong><br>
                    Le présent contrat a pour objet de définir les conditions d'emploi de Monsieur/Madame...
                </div>
                <div class="contract-real-article">
                    <strong>Article 2 - Fonctions</strong><br>
                    Le salarié est engagé en qualité de Directeur Général...
                </div>
            </div>
        `;
    }
    
    // Attestations
    if (name.includes('attestation')) {
        return `
            <div class="real-preview-attestation">
                <div class="attestation-real-header">ENTREPRISE XYZ</div>
                <div class="attestation-real-title">ATTESTATION DE TRAVAIL</div>
                <div class="attestation-real-body">
                    <p>Je soussigné, Monsieur le Directeur Général, agissant en qualité de Directeur Général de la société ENTREPRISE XYZ,</p>
                    <p>Certifie par la présente que <strong>Meurphy TALAMIO</strong>, occupant le poste de <strong>Directeur Général</strong> au sein de notre entreprise depuis le 01/01/2020,</p>
                    <p>Cette attestation est délivrée à l'intéressé pour servir et valoir ce que de droit.</p>
                </div>
                <div class="attestation-real-footer">
                    Fait à Brazzaville, le 04 octobre 2026<br>
                    <strong>Le Directeur Général</strong>
                </div>
            </div>
        `;
    }
    
    // Devis/Factures
    if (name.includes('devis') || name.includes('facture')) {
        return `
            <div class="real-preview-invoice">
                <div class="invoice-real-header">
                    <div class="invoice-real-company">
                        <strong>ENTREPRISE XYZ</strong><br>
                        123 Avenue de l'Indépendance<br>
                        Tél: +242 06 000 00 00
                    </div>
                    <div class="invoice-real-client">
                        <strong>CLIENT</strong><br>
                        Monsieur le Client<br>
                        Adresse du client
                    </div>
                </div>
                <div class="invoice-real-title">DEVIS N° DEV-2026-001</div>
                <table class="invoice-real-table">
                    <tr>
                        <th>Désignation</th>
                        <th>Qté</th>
                        <th>Prix</th>
                        <th>Total</th>
                    </tr>
                    <tr>
                        <td>Prestation 1</td>
                        <td>1</td>
                        <td>500 000</td>
                        <td>500 000 FCFA</td>
                    </tr>
                    <tr>
                        <td>Prestation 2</td>
                        <td>2</td>
                        <td>300 000</td>
                        <td>600 000 FCFA</td>
                    </tr>
                </table>
                <div class="invoice-real-total">
                    <strong>Total TTC : 1 534 000 FCFA</strong>
                </div>
            </div>
        `;
    }
    
    // Autres documents (rapport, procuration, etc.)
    return `
        <div class="real-preview-generic">
            <div class="generic-real-title">${template.name.toUpperCase()}</div>
            <div class="generic-real-body">
                <p>Je soussigné, <strong>Meurphy TALAMIO</strong>, né le 01/01/1990 à Brazzaville, titulaire de la CNI n° 123456789,</p>
                <p>Déclare par la présente que...</p>
                <p>Cette déclaration est établie pour servir et valoir ce que de droit.</p>
            </div>
            <div class="generic-real-footer">
                Fait à Brazzaville, le 04 octobre 2026<br>
                <strong>Signature</strong>
            </div>
        </div>
    `;
}