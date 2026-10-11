// ============================================
// TAKIDOC - MOTEUR PRINCIPAL (VERSION CORRIGÉE)
// L'équipe Meurphy - 2026
// ============================================
import { fetchTemplates, fetchCategories } from './supabase-config.js';
import { templatesRegistry } from './templates-registry.js';

// État global
let allTemplates = [];
let allCategories = [];

// ============================================
// INITIALISATION UNIQUE
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Démarrage du moteur TakiDoc...");
    
    // 1. Charger les données
    await loadData();
    
    // 2. Afficher les documents populaires (Page d'accueil)
    renderPopularDocuments();
    
    // 3. Afficher les catégories (Filtres)
    renderCategories();
    
    // 4. Afficher TOUS les templates (Page documents.html ou section catalogue)
    const allTemplatesGrid = document.getElementById('templates-grid') || document.getElementById('masonryGrid');
    if (allTemplatesGrid) {
        renderTemplates(allTemplates);
    }
    
    console.log("✅ Moteur TakiDoc initialisé. L'équipe Meurphy est en service.");
});

// ============================================
// CHARGEMENT DES DONNÉES (Avec Fallback Local)
// ============================================
async function loadData() {
    try {
        const [templates, categories] = await Promise.all([
            fetchTemplates(),
            fetchCategories()
        ]);
        
        // Si Supabase renvoie des données, on les utilise
        if (templates && templates.length > 0) {
            allTemplates = templates;
            allCategories = categories || [];
        } else {
            console.warn("⚠️ Base de données vide. Utilisation du registre local (templatesRegistry).");
            // Fallback sur le registre local
            allTemplates = templatesRegistry;
            // Extraire les catégories uniques du registre local
            const uniqueCats = [...new Set(templatesRegistry.map(t => t.category))];
            allCategories = uniqueCats.map(cat => ({ id: cat, name: cat.charAt(0).toUpperCase() + cat.slice(1) }));
        }
    } catch (error) {
        console.error("❌ Erreur de chargement Supabase:", error);
        console.log("🔄 Basculé sur le mode local (templatesRegistry).");
        allTemplates = templatesRegistry;
        const uniqueCats = [...new Set(templatesRegistry.map(t => t.category))];
        allCategories = uniqueCats.map(cat => ({ id: cat, name: cat.charAt(0).toUpperCase() + cat.slice(1) }));
    }
}

// ============================================
// AFFICHAGE DES CATÉGORIES (FILTRES)
// ============================================
function renderCategories() {
    const container = document.getElementById('categories-filter') || document.getElementById('categoriesNav');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Bouton "Tous"
    const allBtn = document.createElement('button');
    allBtn.className = 'cat-pill active'; // Utilise ta classe CSS actuelle
    allBtn.textContent = 'Tous';
    allBtn.dataset.category = 'all';
    allBtn.addEventListener('click', () => filterTemplates('all'));
    container.appendChild(allBtn);
    
    // Boutons par catégorie
    allCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'cat-pill';
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
    document.querySelectorAll('.cat-pill, .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === categoryId) {
            btn.classList.add('active');
        }
    });
    
    // Filtrer les templates
    const filtered = categoryId === 'all' 
        ? allTemplates 
        : allTemplates.filter(t => t.category === categoryId || t.category_id === categoryId);
    
    renderTemplates(filtered);
}

// ============================================
// AFFICHAGE DES TEMPLATES (LA FONCTION MANQUANTE !)
// ============================================
function renderTemplates(templatesToRender) {
    // Cherche la grille principale (s'adapte à index.html ou documents.html)
    const grid = document.getElementById('popular-docs') || document.getElementById('templates-grid') || document.getElementById('masonryGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!templatesToRender || templatesToRender.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px;"><h3>Aucun document trouvé</h3></div>';
        return;
    }
    
    templatesToRender.forEach(template => {
        const card = document.createElement('div');
        card.className = 'pin-card';
        card.style.cursor = 'pointer';
        
        const previewHtml = generateDocumentPreview(template);
        const categoryName = template.category ? template.category.charAt(0).toUpperCase() + template.category.slice(1) : 'Document';
        const price = template.price ? template.price.toLocaleString() : '0';
        
        card.innerHTML = `
            <div class="document-preview">
                <div class="category-badge">${categoryName}</div>
                <div class="preview-scaler" style="transform: scale(0.35); transform-origin: top left; width: 285%; height: 285%; overflow: hidden; pointer-events: none;">
                    ${previewHtml}
                </div>
                <div class="pin-overlay">
                    <div class="overlay-bottom">
                        <h3 class="overlay-title">${template.name}</h3>
                        <div class="overlay-price">${price} FCFA</div>
                        <button class="btn-customize-overlay" onclick="event.stopPropagation(); window.location.href='editor.html?id=${template.id}'">
                            <i class="fas fa-edit"></i> Personnaliser
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Clic sur toute la carte redirige vers l'éditeur
        card.addEventListener('click', () => {
            window.location.href = `editor.html?id=${template.id}`;
        });
        
        grid.appendChild(card);
    });
}

// ============================================
// AFFICHAGE DES DOCUMENTS POPULAIRES (PAGE D'ACCUEIL)
// ============================================
function renderPopularDocuments() {
    const grid = document.getElementById('popular-docs');
    if (!grid) return; // Si on n'est pas sur la page d'accueil, on sort
    
    // Prendre les 6 premiers documents du registre
    const popularDocs = allTemplates.slice(0, 6);
    renderTemplates(popularDocs); // Réutilise la fonction principale pour éviter la duplication de code
}

// ============================================
// GÉNÉRATEUR D'APERÇUS VISUELS PAR TYPE DE DOCUMENT
// ============================================
function generateDocumentPreview(template) {
    const name = template.name.toLowerCase();
    
    if (name.includes('cv')) {
        return `
            <div style="padding: 20px; font-family: sans-serif; font-size: 12px;">
                <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #FF6B35; padding-bottom: 10px; margin-bottom: 15px;">
                    <div><strong style="font-size: 18px; color: #0F172A;">Meurphy TALAMIO</strong><br><span style="color: #64748B;">Directeur Général</span></div>
                    <div style="width: 40px; height: 40px; background: #E2E8F0; border-radius: 50%;"></div>
                </div>
                <div style="color: #FF6B35; font-weight: bold; margin-bottom: 5px;">PROFIL</div>
                <div style="height: 4px; background: #E2E8F0; width: 100%; margin-bottom: 4px;"></div>
                <div style="height: 4px; background: #E2E8F0; width: 80%; margin-bottom: 15px;"></div>
                <div style="color: #FF6B35; font-weight: bold; margin-bottom: 5px;">EXPÉRIENCES</div>
                <div style="height: 4px; background: #0F172A; width: 60%; margin-bottom: 4px;"></div>
                <div style="height: 4px; background: #E2E8F0; width: 90%; margin-bottom: 4px;"></div>
            </div>
        `;
    }
    
    if (name.includes('attestation') || name.includes('certificat')) {
        return `
            <div style="padding: 20px; font-family: serif; text-align: center; font-size: 12px;">
                <div style="font-weight: bold; color: #FF6B35; font-size: 16px; margin-bottom: 20px;">ENTREPRISE XYZ</div>
                <div style="font-weight: bold; font-size: 14px; text-decoration: underline; margin-bottom: 20px;">ATTESTATION</div>
                <div style="text-align: left; color: #334155;">
                    <div style="height: 4px; background: #E2E8F0; width: 100%; margin-bottom: 6px;"></div>
                    <div style="height: 4px; background: #E2E8F0; width: 90%; margin-bottom: 6px;"></div>
                    <div style="height: 4px; background: #E2E8F0; width: 95%; margin-bottom: 20px;"></div>
                    <div style="text-align: right; font-weight: bold; color: #FF6B35;">Signature</div>
                </div>
            </div>
        `;
    }
    
    if (name.includes('contrat')) {
        return `
            <div style="padding: 20px; font-family: serif; font-size: 11px;">
                <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 15px; color: #0F172A;">CONTRAT DE TRAVAIL</div>
                <div style="border: 1px solid #E2E8F0; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                    <strong>EMPLOYEUR :</strong> Entreprise XYZ
                </div>
                <div style="border: 1px solid #E2E8F0; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                    <strong>SALARIÉ :</strong> Meurphy TALAMIO
                </div>
                <div style="height: 4px; background: #E2E8F0; width: 100%; margin-bottom: 4px;"></div>
                <div style="height: 4px; background: #E2E8F0; width: 80%;"></div>
            </div>
        `;
    }
    
    // Document générique (Lettre, Devis, etc.)
    return `
        <div style="padding: 20px; font-family: sans-serif; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div style="font-weight: bold; color: #FF6B35;">TakiDoc</div>
                <div style="color: #64748B;">${new Date().toLocaleDateString()}</div>
            </div>
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 15px; color: #0F172A;">${template.name.toUpperCase()}</div>
            <div style="height: 4px; background: #E2E8F0; width: 100%; margin-bottom: 6px;"></div>
            <div style="height: 4px; background: #E2E8F0; width: 90%; margin-bottom: 6px;"></div>
            <div style="height: 4px; background: #E2E8F0; width: 95%; margin-bottom: 6px;"></div>
            <div style="height: 4px; background: #E2E8F0; width: 70%; margin-bottom: 6px;"></div>
        </div>
    `;
}