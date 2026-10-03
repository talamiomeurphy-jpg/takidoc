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
        
        // CSS spécifique à ce document
        cssStyles: `
            .cv-exec-container {
                width: 210mm;
                min-height: 297mm;
                background: white;
                font-family: 'Inter', 'Segoe UI', sans-serif;
                display: grid;
                grid-template-columns: 35% 65%;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            
            /* Colonne gauche (colorée) */
            .cv-sidebar {
                background: var(--doc-primary-color, #0F172A);
                color: white;
                padding: 40px 25px;
            }
            
            .cv-photo {
                width: 140px;
                height: 140px;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                margin: 0 auto 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                border: 4px solid rgba(255,255,255,0.3);
            }
            
            .cv-photo img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .cv-photo-placeholder {
                color: rgba(255,255,255,0.6);
                font-size: 0.9rem;
            }
            
            .cv-sidebar-section {
                margin-bottom: 30px;
            }
            
            .cv-sidebar-title {
                font-size: 0.85rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 2px solid rgba(255,255,255,0.3);
            }
            
            .cv-contact-item {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
                font-size: 0.9rem;
                word-break: break-word;
            }
            
            .cv-contact-icon {
                width: 20px;
                text-align: center;
                flex-shrink: 0;
            }
            
            .cv-skill-item {
                margin-bottom: 12px;
            }
            
            .cv-skill-name {
                font-size: 0.9rem;
                margin-bottom: 5px;
            }
            
            .cv-skill-bar {
                height: 6px;
                background: rgba(255,255,255,0.2);
                border-radius: 3px;
                overflow: hidden;
            }
            
            .cv-skill-level {
                height: 100%;
                background: white;
                border-radius: 3px;
            }
            
            .cv-lang-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 0.9rem;
            }
            
            .cv-lang-level {
                opacity: 0.8;
                font-size: 0.85rem;
            }
            
            /* Colonne droite (blanche) */
            .cv-main {
                padding: 40px 35px;
                color: #1e293b;
            }
            
            .cv-header-name {
                font-size: 2.2rem;
                font-weight: 800;
                color: var(--doc-primary-color, #0F172A);
                margin-bottom: 5px;
                line-height: 1.1;
            }
            
            .cv-header-title {
                font-size: 1.1rem;
                color: #64748b;
                font-weight: 500;
                margin-bottom: 25px;
                padding-bottom: 20px;
                border-bottom: 3px solid var(--doc-primary-color, #0F172A);
            }
            
            .cv-main-section {
                margin-bottom: 28px;
            }
            
            .cv-main-title {
                font-size: 1.1rem;
                font-weight: 700;
                color: var(--doc-primary-color, #0F172A);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .cv-main-title::before {
                content: '';
                width: 4px;
                height: 20px;
                background: var(--doc-primary-color, #0F172A);
                border-radius: 2px;
            }
            
            .cv-profile-text {
                font-size: 0.95rem;
                line-height: 1.6;
                color: #475569;
            }
            
            .cv-experience-item {
                margin-bottom: 20px;
                padding-left: 15px;
                border-left: 2px solid #e2e8f0;
            }
            
            .cv-experience-header {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                margin-bottom: 5px;
                flex-wrap: wrap;
            }
            
            .cv-experience-title {
                font-weight: 700;
                font-size: 1rem;
                color: #0f172a;
            }
            
            .cv-experience-date {
                font-size: 0.85rem;
                color: #64748b;
                font-style: italic;
            }
            
            .cv-experience-company {
                font-size: 0.9rem;
                color: var(--doc-primary-color, #0F172A);
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .cv-experience-desc {
                font-size: 0.9rem;
                color: #475569;
                line-height: 1.5;
            }
            
            .cv-education-item {
                margin-bottom: 15px;
            }
            
            .cv-education-degree {
                font-weight: 700;
                font-size: 1rem;
                color: #0f172a;
            }
            
            .cv-education-school {
                font-size: 0.9rem;
                color: var(--doc-primary-color, #0F172A);
                font-weight: 600;
            }
            
            .cv-education-date {
                font-size: 0.85rem;
                color: #64748b;
            }
        `,
        
        // HTML du document
        htmlStructure: `
            <div class="cv-exec-container">
                <!-- Colonne gauche -->
                <aside class="cv-sidebar">
                    <div class="cv-photo" id="doc-photo">
                        <span class="cv-photo-placeholder">Photo</span>
                    </div>
                    
                    <div class="cv-sidebar-section">
                        <div class="cv-sidebar-title">Contact</div>
                        <div class="cv-contact-item">
                            <span class="cv-contact-icon">✉</span>
                            <span id="field-email">email@exemple.com</span>
                        </div>
                        <div class="cv-contact-item">
                            <span class="cv-contact-icon">☎</span>
                            <span id="field-telephone">+242 06 000 00 00</span>
                        </div>
                        <div class="cv-contact-item">
                            <span class="cv-contact-icon">⌖</span>
                            <span id="field-adresse">Brazzaville, Congo</span>
                        </div>
                    </div>
                    
                    <div class="cv-sidebar-section">
                        <div class="cv-sidebar-title">Compétences</div>
                        <div class="cv-skill-item">
                            <div class="cv-skill-name" id="field-skill1_name">Gestion de projet</div>
                            <div class="cv-skill-bar">
                                <div class="cv-skill-level" style="width: 90%"></div>
                            </div>
                        </div>
                        <div class="cv-skill-item">
                            <div class="cv-skill-name" id="field-skill2_name">Leadership</div>
                            <div class="cv-skill-bar">
                                <div class="cv-skill-level" style="width: 85%"></div>
                            </div>
                        </div>
                        <div class="cv-skill-item">
                            <div class="cv-skill-name" id="field-skill3_name">Communication</div>
                            <div class="cv-skill-bar">
                                <div class="cv-skill-level" style="width: 80%"></div>
                            </div>
                        </div>
                        <div class="cv-skill-item">
                            <div class="cv-skill-name" id="field-skill4_name">Analyse stratégique</div>
                            <div class="cv-skill-bar">
                                <div class="cv-skill-level" style="width: 75%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="cv-sidebar-section">
                        <div class="cv-sidebar-title">Langues</div>
                        <div class="cv-lang-item">
                            <span id="field-lang1_name">Français</span>
                            <span class="cv-lang-level" id="field-lang1_level">Courant</span>
                        </div>
                        <div class="cv-lang-item">
                            <span id="field-lang2_name">Anglais</span>
                            <span class="cv-lang-level" id="field-lang2_level">Professionnel</span>
                        </div>
                    </div>
                    
                    <div class="cv-sidebar-section">
                        <div class="cv-sidebar-title">Centres d'intérêt</div>
                        <div style="font-size: 0.9rem; line-height: 1.6;">
                            <span id="field-interets">Lecture, Voyages, Technologie, Sport</span>
                        </div>
                    </div>
                </aside>
                
                <!-- Colonne droite -->
                <main class="cv-main">
                    <div class="cv-header">
                        <h1 class="cv-header-name" id="field-nom">PRÉNOM NOM</h1>
                        <div class="cv-header-title" id="field-poste">Poste visé / Titre professionnel</div>
                    </div>
                    
                    <div class="cv-main-section">
                        <div class="cv-main-title">Profil</div>
                        <p class="cv-profile-text" id="field-profil">
                            Professionnel expérimenté avec plus de 10 ans d'expérience dans mon domaine. 
                            Passionné par l'innovation et la recherche de l'excellence. 
                            Je cherche à mettre mes compétences au service d'une entreprise dynamique.
                        </p>
                    </div>
                    
                    <div class="cv-main-section">
                        <div class="cv-main-title">Expériences professionnelles</div>
                        
                        <div class="cv-experience-item">
                            <div class="cv-experience-header">
                                <div class="cv-experience-title" id="field-exp1_titre">Directeur Général</div>
                                <div class="cv-experience-date" id="field-exp1_date">2020 - Présent</div>
                            </div>
                            <div class="cv-experience-company" id="field-exp1_entreprise">Entreprise XYZ - Brazzaville</div>
                            <div class="cv-experience-desc" id="field-exp1_desc">
                                Direction stratégique de l'entreprise. Management d'une équipe de 50 personnes. 
                                Augmentation du chiffre d'affaires de 30% en 2 ans.
                            </div>
                        </div>
                        
                        <div class="cv-experience-item">
                            <div class="cv-experience-header">
                                <div class="cv-experience-title" id="field-exp2_titre">Chef de Projet Senior</div>
                                <div class="cv-experience-date" id="field-exp2_date">2015 - 2020</div>
                            </div>
                            <div class="cv-experience-company" id="field-exp2_entreprise">Société ABC - Pointe-Noire</div>
                            <div class="cv-experience-desc" id="field-exp2_desc">
                                Gestion de projets majeurs. Coordination avec les parties prenantes. 
                                Livraison de 15 projets dans les délais et budgets impartis.
                            </div>
                        </div>
                    </div>
                    
                    <div class="cv-main-section">
                        <div class="cv-main-title">Formation</div>
                        
                        <div class="cv-education-item">
                            <div class="cv-education-degree" id="field-form1_diplome">Master en Management</div>
                            <div class="cv-education-school" id="field-form1_ecole">Université Marien Ngouabi</div>
                            <div class="cv-education-date" id="field-form1_date">2013 - 2015</div>
                        </div>
                        
                        <div class="cv-education-item">
                            <div class="cv-education-degree" id="field-form2_diplome">Licence en Gestion</div>
                            <div class="cv-education-school" id="field-form2_ecole">Université de Brazzaville</div>
                            <div class="cv-education-date" id="field-form2_date">2010 - 2013</div>
                        </div>
                    </div>
                </main>
            </div>
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
        cssStyles: `
            .lettre-container {
                width: 210mm;
                min-height: 297mm;
                background: white;
                padding: 50px 60px;
                font-family: 'Georgia', 'Times New Roman', serif;
                color: #1e293b;
                line-height: 1.6;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .lettre-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
            }
            .lettre-expediteur {
                font-size: 0.95rem;
                line-height: 1.5;
            }
            .lettre-destinataire {
                text-align: right;
                font-size: 0.95rem;
                line-height: 1.5;
            }
            .lettre-date {
                text-align: right;
                margin-bottom: 30px;
                font-style: italic;
                color: #64748b;
            }
            .lettre-objet {
                font-weight: 700;
                margin-bottom: 25px;
                color: var(--doc-primary-color, #0F172A);
                font-size: 1.05rem;
            }
            .lettre-corps {
                margin-bottom: 25px;
                text-align: justify;
                font-size: 1rem;
            }
            .lettre-formule {
                margin-top: 30px;
                font-style: italic;
            }
            .lettre-signature {
                margin-top: 40px;
                text-align: right;
                font-weight: 600;
            }
        `,
        htmlStructure: `
            <div class="lettre-container">
                <div class="lettre-header">
                    <div class="lettre-expediteur">
                        <strong id="field-expediteur_nom">Prénom NOM</strong><br>
                        <span id="field-expediteur_adresse">Adresse complète</span><br>
                        <span id="field-expediteur_telephone">Téléphone</span><br>
                        <span id="field-expediteur_email">email@exemple.com</span>
                    </div>
                    <div class="lettre-destinataire">
                        <strong id="field-destinataire_nom">Nom du destinataire</strong><br>
                        <span id="field-destinataire_fonction">Fonction</span><br>
                        <span id="field-destinataire_entreprise">Nom de l'entreprise</span><br>
                        <span id="field-destinataire_adresse">Adresse de l'entreprise</span>
                    </div>
                </div>
                
                <div class="lettre-date" id="field-date">Brazzaville, le <span id="field-date-text">04 octobre 2026</span></div>
                
                <div class="lettre-objet">Objet : <span id="field-objet">Candidature au poste de...</span></div>
                
                <div class="lettre-corps">
                    <p id="field-paragraphe1">Madame, Monsieur,</p>
                    <p id="field-paragraphe2">Par la présente, je me permets de vous adresser ma candidature pour le poste mentionné ci-dessus. Fort d'une expérience solide dans mon domaine, je suis convaincu de pouvoir apporter une contribution significative à votre entreprise.</p>
                    <p id="field-paragraphe3">Au cours de mon parcours professionnel, j'ai développé des compétences clés qui correspondent parfaitement aux exigences de ce poste. Mon sens de l'initiative, ma capacité d'adaptation et mon esprit d'équipe sont des atouts que je souhaite mettre à votre disposition.</p>
                    <p id="field-paragraphe4">Je serais honoré de pouvoir vous exposer plus en détail mes motivations lors d'un entretien. Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
                </div>
                
                <div class="lettre-formule">Cordialement,</div>
                
                <div class="lettre-signature" id="field-signature">Prénom NOM</div>
            </div>
        `
    };
}


// --- DOCUMENT 2 : CV Classique Français ---
export function getTemplate_CV_Classique_Francais() {
    return {
        id: 'cv_classique_francais',
        name: 'CV Classique Français',
        category: 'cv',
        price: 1200,
        hasPhoto: true,
        hasColorPicker: true,
        description: 'Format traditionnel apprécié des recruteurs français et administrations.',
        
        cssStyles: `
            .cv-classique-container {
                width: 210mm;
                min-height: 297mm;
                background: white;
                padding: 50px 60px;
                font-family: 'Georgia', 'Times New Roman', serif;
                color: #1e293b;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            
            .cv-classique-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                padding-bottom: 25px;
                border-bottom: 3px solid var(--doc-primary-color, #0F172A);
            }
            
            .cv-classique-info {
                flex: 1;
            }
            
            .cv-classique-name {
                font-size: 2.5rem;
                font-weight: 700;
                color: var(--doc-primary-color, #0F172A);
                margin-bottom: 10px;
                line-height: 1.1;
            }
            
            .cv-classique-title {
                font-size: 1.3rem;
                color: #64748b;
                font-style: italic;
                margin-bottom: 20px;
            }
            
            .cv-classique-contact {
                font-size: 0.95rem;
                line-height: 1.6;
                color: #475569;
            }
            
            .cv-classique-contact div {
                margin-bottom: 5px;
            }
            
            .cv-classique-photo {
                width: 120px;
                height: 150px;
                background: #f1f5f9;
                border: 2px solid var(--doc-primary-color, #0F172A);
                margin-left: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                flex-shrink: 0;
            }
            
            .cv-classique-photo img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .cv-classique-photo-placeholder {
                color: #94a3b8;
                font-size: 2rem;
                font-weight: 700;
            }
            
            .cv-classique-section {
                margin-bottom: 30px;
            }
            
            .cv-classique-section-title {
                font-size: 1.2rem;
                font-weight: 700;
                color: var(--doc-primary-color, #0F172A);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 2px solid var(--doc-primary-color, #0F172A);
            }
            
            .cv-classique-profile {
                font-size: 1rem;
                line-height: 1.7;
                color: #475569;
                text-align: justify;
            }
            
            .cv-classique-experience {
                margin-bottom: 20px;
            }
            
            .cv-classique-experience-header {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                margin-bottom: 5px;
            }
            
            .cv-classique-experience-title {
                font-weight: 700;
                font-size: 1.1rem;
                color: #0f172a;
            }
            
            .cv-classique-experience-date {
                font-size: 0.9rem;
                color: #64748b;
                font-style: italic;
            }
            
            .cv-classique-experience-company {
                font-size: 1rem;
                color: var(--doc-primary-color, #0F172A);
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .cv-classique-experience-desc {
                font-size: 0.95rem;
                color: #475569;
                line-height: 1.6;
                text-align: justify;
            }
            
            .cv-classique-education {
                margin-bottom: 15px;
            }
            
            .cv-classique-education-degree {
                font-weight: 700;
                font-size: 1.05rem;
                color: #0f172a;
            }
            
            .cv-classique-education-school {
                font-size: 1rem;
                color: var(--doc-primary-color, #0F172A);
                font-weight: 600;
            }
            
            .cv-classique-education-date {
                font-size: 0.9rem;
                color: #64748b;
            }
            
            .cv-classique-skills-list {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            
            .cv-classique-skill {
                font-size: 0.95rem;
                color: #475569;
                padding: 5px 0;
            }
            
            .cv-classique-skill::before {
                content: '• ';
                color: var(--doc-primary-color, #0F172A);
                font-weight: 700;
            }
            
            .cv-classique-languages {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
            }
            
            .cv-classique-language {
                font-size: 0.95rem;
            }
            
            .cv-classique-language strong {
                color: #0f172a;
            }
            
            .cv-classique-language span {
                color: #64748b;
                font-style: italic;
            }
        `,
        
        htmlStructure: `
            <div class="cv-classique-container">
                <!-- En-tête -->
                <header class="cv-classique-header">
                    <div class="cv-classique-info">
                        <h1 class="cv-classique-name" id="field-nom">Meurphy TALAMIO</h1>
                        <div class="cv-classique-title" id="field-poste">Directeur Général</div>
                        <div class="cv-classique-contact">
                            <div>✉ <span id="field-email">brazzamarket.infos@gmail.com</span></div>
                            <div>☎ <span id="field-telephone">+242 06 518 69 67</span></div>
                            <div>⌖ <span id="field-adresse">Brazzaville, Congo</span></div>
                        </div>
                    </div>
                    <div class="cv-classique-photo" id="doc-photo">
                        <span class="cv-classique-photo-placeholder" id="photo-initials">MT</span>
                    </div>
                </header>
                
                <!-- Profil -->
                <section class="cv-classique-section">
                    <div class="cv-classique-section-title">Profil</div>
                    <p class="cv-classique-profile" id="field-profil">
                        Professionnel expérimenté avec plus de 10 ans d'expérience dans mon domaine. 
                        Passionné par l'innovation et la recherche de l'excellence. 
                        Je cherche à mettre mes compétences au service d'une entreprise dynamique.
                    </p>
                </section>
                
                <!-- Expériences -->
                <section class="cv-classique-section">
                    <div class="cv-classique-section-title">Expériences Professionnelles</div>
                    
                    <div class="cv-classique-experience">
                        <div class="cv-classique-experience-header">
                            <div class="cv-classique-experience-title" id="field-exp1_titre">Directeur Général</div>
                            <div class="cv-classique-experience-date" id="field-exp1_date">2020 - Présent</div>
                        </div>
                        <div class="cv-classique-experience-company" id="field-exp1_entreprise">Entreprise XYZ - Brazzaville</div>
                        <div class="cv-classique-experience-desc" id="field-exp1_desc">
                            Direction stratégique de l'entreprise. Management d'une équipe de 50 personnes. 
                            Augmentation du chiffre d'affaires de 30% en 2 ans.
                        </div>
                    </div>
                    
                    <div class="cv-classique-experience">
                        <div class="cv-classique-experience-header">
                            <div class="cv-classique-experience-title" id="field-exp2_titre">Chef de Projet Senior</div>
                            <div class="cv-classique-experience-date" id="field-exp2_date">2015 - 2020</div>
                        </div>
                        <div class="cv-classique-experience-company" id="field-exp2_entreprise">Société ABC - Pointe-Noire</div>
                        <div class="cv-classique-experience-desc" id="field-exp2_desc">
                            Gestion de projets majeurs. Coordination avec les parties prenantes. 
                            Livraison de 15 projets dans les délais et budgets impartis.
                        </div>
                    </div>
                </section>
                
                <!-- Formation -->
                <section class="cv-classique-section">
                    <div class="cv-classique-section-title">Formation</div>
                    
                    <div class="cv-classique-education">
                        <div class="cv-classique-education-degree" id="field-form1_diplome">Master en Management</div>
                        <div class="cv-classique-education-school" id="field-form1_ecole">Université Marien Ngouabi</div>
                        <div class="cv-classique-education-date" id="field-form1_date">2013 - 2015</div>
                    </div>
                    
                    <div class="cv-classique-education">
                        <div class="cv-classique-education-degree" id="field-form2_diplome">Licence en Gestion</div>
                        <div class="cv-classique-education-school" id="field-form2_ecole">Université de Brazzaville</div>
                        <div class="cv-classique-education-date" id="field-form2_date">2010 - 2013</div>
                    </div>
                </section>
                
                <!-- Compétences -->
                <section class="cv-classique-section">
                    <div class="cv-classique-section-title">Compétences</div>
                    <div class="cv-classique-skills-list">
                        <div class="cv-classique-skill" id="field-skill1_name">Gestion de projet</div>
                        <div class="cv-classique-skill" id="field-skill2_name">Leadership</div>
                        <div class="cv-classique-skill" id="field-skill3_name">Communication</div>
                        <div class="cv-classique-skill" id="field-skill4_name">Analyse stratégique</div>
                    </div>
                </section>
                
                <!-- Langues -->
                <section class="cv-classique-section">
                    <div class="cv-classique-section-title">Langues</div>
                    <div class="cv-classique-languages">
                        <div class="cv-classique-language">
                            <strong id="field-lang1_name">Français</strong> - <span id="field-lang1_level">Courant</span>
                        </div>
                        <div class="cv-classique-language">
                            <strong id="field-lang2_name">Anglais</strong> - <span id="field-lang2_level">Professionnel</span>
                        </div>
                    </div>
                </section>
            </div>
        `
    };
}



// ============================================
// REGISTRE CENTRAL
// ============================================
export const templatesRegistry = [
    getTemplate_CV_Executif_Moderne(),
     getTemplate_CV_Classique_Francais(),
    getTemplate_Lettre_Motivation_Classique()
];