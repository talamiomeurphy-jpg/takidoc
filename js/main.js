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
        card.innerHTML = `
            <div class="card-preview">
                <span style="font-weight: 600; color: var(--primary);">${template.category?.name || 'Document'}</span>
            </div>
            <div class="card-body">
                <h3 class="card-title">${template.name}</h3>
                <p class="card-description">${template.description || ''}</p>
                <div class="card-footer">
                    <div class="card-price">${template.price_xaf} <span>FCFA</span></div>
                    <a href="editor.html?id=${template.id}" class="btn btn-primary btn-customize">Prévisualiser</a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}