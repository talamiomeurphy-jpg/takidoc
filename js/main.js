// ============================================
// TAKIDOC - MOTEUR PRINCIPAL
// L'équipe Meurphy
// ============================================
import { templatesRegistry } from './templates-registry.js';

// Fonction pour afficher les modèles sur la page d'accueil
function renderTemplates() {
    const grid = document.getElementById('templates-grid');
    if (!grid) return; // Sécurité si on n'est pas sur la page d'accueil

    grid.innerHTML = ''; // Vider le texte de chargement

    templatesRegistry.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `
            <div class="card-preview">
                <span style="font-weight: 600; color: var(--primary);">${template.category.toUpperCase()}</span>
            </div>
            <div class="card-body">
                <h3 class="card-title">${template.name}</h3>
                <p class="card-description">${template.description}</p>
                <div class="card-footer">
                    <div class="card-price">${template.price} <span>FCFA</span></div>
                    <a href="editor.html?id=${template.id}" class="btn btn-primary btn-customize">Personnaliser</a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    renderTemplates();
    console.log("✅ Moteur TakiDoc initialisé. L'équipe Meurphy est en service.");
});