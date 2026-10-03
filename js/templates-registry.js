// ============================================
// TAKIDOC - REGISTRE DES DOCUMENTS
// Règle : Une fonction = Un document
// L'équipe Meurphy
// ============================================

// --- DOCUMENT 1 : CV Exécutif Moderne ---
export function getTemplate_CV_Executif_Moderne() {
    return {
        id: 'cv_executif_moderne',
        name: 'CV Exécutif Moderne',
        category: 'cv',
        price: 1500,
        hasPhoto: true,
        hasColorPicker: true,
        description: 'Design épuré et professionnel pour cadres et managers.',
        // Structure HTML spécifique à ce document (sera injectée dans l'éditeur)
        htmlStructure: `
            <div class="doc-container" id="doc-preview">
                <header class="doc-header" style="background-color: var(--doc-primary-color, #0F172A); color: white; padding: 30px; display: flex; align-items: center; gap: 25px;">
                    <div class="doc-photo-container" id="doc-photo">
                        <span class="photo-placeholder">Photo</span>
                    </div>
                    <div class="doc-title">
                        <h1 id="field-nom" contenteditable="true">PRÉNOM NOM</h1>
                        <p id="field-poste" contenteditable="true">Poste Visé</p>
                    </div>
                </header>
                <main class="doc-body" style="padding: 30px;">
                    <section>
                        <h3 style="color: var(--doc-primary-color, #0F172A); border-bottom: 2px solid var(--doc-primary-color, #0F172A); padding-bottom: 5px;">Profil</h3>
                        <p id="field-profil" contenteditable="true">Description du profil professionnel...</p>
                    </section>
                </main>
            </div>
        `,
        // CSS spécifique à ce document
        cssStyles: `
            .doc-container { width: 210mm; min-height: 297mm; background: white; margin: 0 auto; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: 'Inter', sans-serif; }
            .doc-photo-container { width: 120px; height: 120px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 3px solid white; }
            .doc-photo-container img { width: 100%; height: 100%; object-fit: cover; }
            .photo-placeholder { color: #64748b; font-size: 0.9rem; }
        `
    };
}

// --- DOCUMENT 2 : Lettre de Motivation Classique ---
export function getTemplate_Lettre_Motivation_Classique() {
    return {
        id: 'lettre_motivation_classique',
        name: 'Lettre de Motivation Classique',
        category: 'lettre',
        price: 1000,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Structure parfaite et traditionnelle pour convaincre les recruteurs.',
        htmlStructure: `
            <div class="doc-container" id="doc-preview" style="padding: 40px; font-family: 'Times New Roman', serif; line-height: 1.6;">
                <div class="letter-header" style="text-align: right; margin-bottom: 50px;">
                    <p id="field-expediteur" contenteditable="true">Votre Nom<br>Votre Adresse<br>Votre Téléphone<br>Votre Email</p>
                </div>
                <div class="letter-body">
                    <p style="font-weight: bold;">Objet : <span id="field-objet" contenteditable="true">Candidature au poste de...</span></p>
                    <br>
                    <p id="field-corps" contenteditable="true">Madame, Monsieur,<br><br>Par la présente, je me permets de vous adresser ma candidature...</p>
                </div>
            </div>
        `,
        cssStyles: `
            .doc-container { width: 210mm; min-height: 297mm; background: white; margin: 0 auto; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
        `
    };
}

// ============================================
// REGISTRE CENTRAL
// Maître Meurphy, pour ajouter un document, créez une nouvelle fonction ci-dessus 
// et ajoutez son appel dans ce tableau.
// ============================================
export const templatesRegistry = [
    getTemplate_CV_Executif_Moderne(),
    getTemplate_Lettre_Motivation_Classique()
    // Ajoutez ici : getTemplate_Nouveau_Document()
];