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

// --- DOCUMENT 4 : CV Étudiant Stage ---
export function getTemplate_CV_Etudiant_Stage() {
    return {
        id: 'cv_etudiant_stage',
        name: 'CV Étudiant Stage',
        category: 'cv',
        price: 1000,
        hasPhoto: true,
        hasColorPicker: true,
        description: 'Design simple et clair, mettant en avant la formation et le potentiel.',
        cssStyles: `
            .cv-etudiant-container { width: 210mm; min-height: 297mm; background: white; padding: 50px; font-family: 'Inter', sans-serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .cv-etudiant-header { display: flex; align-items: center; gap: 30px; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .cv-etudiant-photo { width: 120px; height: 120px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 3px solid var(--doc-primary-color, #0F172A); flex-shrink: 0; }
            .cv-etudiant-photo img { width: 100%; height: 100%; object-fit: cover; }
            .cv-etudiant-photo-placeholder { font-size: 2rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); }
            .cv-etudiant-info h1 { font-size: 2.2rem; font-weight: 800; color: var(--doc-primary-color, #0F172A); margin-bottom: 5px; }
            .cv-etudiant-info h2 { font-size: 1.2rem; color: #64748b; font-weight: 500; margin-bottom: 10px; }
            .cv-etudiant-contact { font-size: 0.9rem; color: #475569; display: flex; gap: 15px; flex-wrap: wrap; }
            .cv-etudiant-section { margin-bottom: 25px; }
            .cv-etudiant-title { font-size: 1.1rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e2e8f0; }
            .cv-etudiant-text { font-size: 0.95rem; line-height: 1.6; color: #475569; text-align: justify; }
            .cv-etudiant-item { margin-bottom: 15px; }
            .cv-etudiant-item-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .cv-etudiant-item-title { font-weight: 700; color: #0f172a; }
            .cv-etudiant-item-date { font-size: 0.85rem; color: #64748b; font-style: italic; }
            .cv-etudiant-item-subtitle { font-size: 0.95rem; color: var(--doc-primary-color, #0F172A); font-weight: 600; margin-bottom: 5px; }
            .cv-etudiant-skills { display: flex; flex-wrap: wrap; gap: 10px; }
            .cv-etudiant-skill-tag { background: #f1f5f9; color: #0f172a; padding: 5px 12px; border-radius: 20px; font-size: 0.9rem; font-weight: 500; border-left: 3px solid var(--doc-primary-color, #0F172A); }
        `,
        htmlStructure: `
            <div class="cv-etudiant-container">
                <header class="cv-etudiant-header">
                    <div class="cv-etudiant-photo" id="doc-photo"><span class="cv-etudiant-photo-placeholder" id="photo-initials">MT</span></div>
                    <div class="cv-etudiant-info">
                        <h1 id="field-nom">Meurphy TALAMIO</h1>
                        <h2 id="field-poste">Étudiant en Master Management</h2>
                        <div class="cv-etudiant-contact">
                            <span>✉ <span id="field-email">brazzamarket.infos@gmail.com</span></span>
                            <span>☎ <span id="field-telephone">+242 06 518 69 67</span></span>
                            <span>⌖ <span id="field-adresse">Brazzaville, Congo</span></span>
                        </div>
                    </div>
                </header>
                <section class="cv-etudiant-section">
                    <div class="cv-etudiant-title">Objectif</div>
                    <p class="cv-etudiant-text" id="field-profil">Étudiant sérieux et motivé, je recherche un stage de fin d'études de 6 mois pour mettre en pratique mes connaissances en gestion et contribuer activement aux projets de votre entreprise.</p>
                </section>
                <section class="cv-etudiant-section">
                    <div class="cv-etudiant-title">Formation</div>
                    <div class="cv-etudiant-item">
                        <div class="cv-etudiant-item-header"><div class="cv-etudiant-item-title" id="field-form1_diplome">Master 1 en Management</div><div class="cv-etudiant-item-date" id="field-form1_date">2025 - Présent</div></div>
                        <div class="cv-etudiant-item-subtitle" id="field-form1_ecole">Université Marien Ngouabi, Brazzaville</div>
                    </div>
                    <div class="cv-etudiant-item">
                        <div class="cv-etudiant-item-header"><div class="cv-etudiant-item-title" id="field-form2_diplome">Licence en Gestion</div><div class="cv-etudiant-item-date" id="field-form2_date">2022 - 2025</div></div>
                        <div class="cv-etudiant-item-subtitle" id="field-form2_ecole">Université de Brazzaville</div>
                    </div>
                </section>
                <section class="cv-etudiant-section">
                    <div class="cv-etudiant-title">Expériences & Bénévolat</div>
                    <div class="cv-etudiant-item">
                        <div class="cv-etudiant-item-header"><div class="cv-etudiant-item-title" id="field-exp1_titre">Stagiaire Assistant Administratif</div><div class="cv-etudiant-item-date" id="field-exp1_date">Juin 2024 - Août 2024</div></div>
                        <div class="cv-etudiant-item-subtitle" id="field-exp1_entreprise">Mairie de Brazzaville</div>
                        <p class="cv-etudiant-text" id="field-exp1_desc">Classement de dossiers, accueil du public, rédaction de comptes-rendus de réunion.</p>
                    </div>
                </section>
                <section class="cv-etudiant-section">
                    <div class="cv-etudiant-title">Compétences</div>
                    <div class="cv-etudiant-skills">
                        <span class="cv-etudiant-skill-tag" id="field-skill1_name">Pack Office</span>
                        <span class="cv-etudiant-skill-tag" id="field-skill2_name">Travail d'équipe</span>
                        <span class="cv-etudiant-skill-tag" id="field-skill3_name">Rédaction</span>
                        <span class="cv-etudiant-skill-tag" id="field-skill4_name">Organisation</span>
                    </div>
                </section>
                <section class="cv-etudiant-section">
                    <div class="cv-etudiant-title">Langues & Centres d'intérêt</div>
                    <p class="cv-etudiant-text"><strong id="field-lang1_name">Français</strong> : <span id="field-lang1_level">Courant</span> | <strong id="field-lang2_name">Anglais</strong> : <span id="field-lang2_level">Scolaire</span></p>
                    <p class="cv-etudiant-text" style="margin-top: 10px;" id="field-interets">Lecture, Sport collectif, Bénévolat associatif</p>
                </option>
            </div>
        `
    };
}

// --- DOCUMENT 5 : CV Créatif Design ---
export function getTemplate_CV_Creatif_Design() {
    return {
        id: 'cv_creatif_design',
        name: 'CV Créatif Design',
        category: 'cv',
        price: 1500,
        hasPhoto: true,
        hasColorPicker: true,
        description: 'Design moderne et audacieux, idéal pour les métiers du web, du graphisme ou du marketing.',
        cssStyles: `
            .cv-creatif-container { width: 210mm; min-height: 297mm; background: white; font-family: 'Inter', sans-serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); display: grid; grid-template-columns: 30% 70%; }
            .cv-creatif-sidebar { background: var(--doc-primary-color, #0F172A); color: white; padding: 40px 25px; }
            .cv-creatif-photo { width: 130px; height: 130px; border-radius: 12px; background: rgba(255,255,255,0.2); margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .cv-creatif-photo img { width: 100%; height: 100%; object-fit: cover; }
            .cv-creatif-photo-placeholder { font-size: 2.5rem; font-weight: 800; color: white; }
            .cv-creatif-sidebar-title { font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid rgba(255,255,255,0.3); }
            .cv-creatif-contact-item { font-size: 0.9rem; margin-bottom: 12px; word-break: break-word; }
            .cv-creatif-skill-bar { margin-bottom: 15px; }
            .cv-creatif-skill-name { font-size: 0.9rem; margin-bottom: 5px; }
            .cv-creatif-skill-track { height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden; }
            .cv-creatif-skill-fill { height: 100%; background: white; border-radius: 4px; }
            .cv-creatif-main { padding: 40px 35px; }
            .cv-creatif-name { font-size: 2.5rem; font-weight: 800; color: var(--doc-primary-color, #0F172A); line-height: 1; margin-bottom: 10px; }
            .cv-creatif-title { font-size: 1.2rem; color: #64748b; font-weight: 600; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .cv-creatif-section { margin-bottom: 30px; }
            .cv-creatif-section-title { font-size: 1.1rem; font-weight: 800; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
            .cv-creatif-text { font-size: 0.95rem; line-height: 1.6; color: #475569; }
            .cv-creatif-item { margin-bottom: 20px; padding-left: 15px; border-left: 3px solid #e2e8f0; }
            .cv-creatif-item-title { font-weight: 700; color: #0f172a; font-size: 1.05rem; }
            .cv-creatif-item-date { font-size: 0.85rem; color: #64748b; font-style: italic; margin-bottom: 5px; }
            .cv-creatif-item-subtitle { font-size: 0.95rem; color: var(--doc-primary-color, #0F172A); font-weight: 600; margin-bottom: 8px; }
        `,
        htmlStructure: `
            <div class="cv-creatif-container">
                <aside class="cv-creatif-sidebar">
                    <div class="cv-creatif-photo" id="doc-photo"><span class="cv-creatif-photo-placeholder" id="photo-initials">MT</span></div>
                    <div class="cv-creatif-sidebar-title">Contact</div>
                    <div class="cv-creatif-contact-item">✉ <span id="field-email">brazzamarket.infos@gmail.com</span></div>
                    <div class="cv-creatif-contact-item">☎ <span id="field-telephone">+242 06 518 69 67</span></div>
                    <div class="cv-creatif-contact-item">⌖ <span id="field-adresse">Brazzaville, Congo</span></div>
                    <div class="cv-creatif-contact-item">🔗 <span id="field-portfolio">www.monportfolio.com</span></div>
                    
                    <div class="cv-creatif-sidebar-title">Logiciels</div>
                    <div class="cv-creatif-skill-bar"><div class="cv-creatif-skill-name" id="field-logiciel1_name">Photoshop</div><div class="cv-creatif-skill-track"><div class="cv-creatif-skill-fill" style="width: 90%"></div></div></div>
                    <div class="cv-creatif-skill-bar"><div class="cv-creatif-skill-name" id="field-logiciel2_name">Illustrator</div><div class="cv-creatif-skill-track"><div class="cv-creatif-skill-fill" style="width: 85%"></div></div></div>
                    <div class="cv-creatif-skill-bar"><div class="cv-creatif-skill-name" id="field-logiciel3_name">Figma</div><div class="cv-creatif-skill-track"><div class="cv-creatif-skill-fill" style="width: 80%"></div></div></div>
                    
                    <div class="cv-creatif-sidebar-title">Langues</div>
                    <div class="cv-creatif-contact-item"><strong id="field-lang1_name">Français</strong> : <span id="field-lang1_level">Courant</span></div>
                    <div class="cv-creatif-contact-item"><strong id="field-lang2_name">Anglais</strong> : <span id="field-lang2_level">Professionnel</span></div>
                </aside>
                <main class="cv-creatif-main">
                    <h1 class="cv-creatif-name" id="field-nom">Meurphy TALAMIO</h1>
                    <div class="cv-creatif-title" id="field-poste">Directeur Artistique / Graphiste</div>
                    
                    <section class="cv-creatif-section">
                        <div class="cv-creatif-section-title">Profil</div>
                        <p class="cv-creatif-text" id="field-profil">Créatif passionné avec 5 ans d'expérience dans la conception d'identités visuelles percutantes. J'aime transformer des idées complexes en designs simples et élégants.</p>
                    </section>
                    
                    <section class="cv-creatif-section">
                        <div class="cv-creatif-section-title">Expériences</div>
                        <div class="cv-creatif-item">
                            <div class="cv-creatif-item-title" id="field-exp1_titre">Graphiste Senior</div>
                            <div class="cv-creatif-item-date" id="field-exp1_date">2021 - Présent</div>
                            <div class="cv-creatif-item-subtitle" id="field-exp1_entreprise">Agence Créative XYZ</div>
                            <p class="cv-creatif-text" id="field-exp1_desc">Direction artistique de campagnes publicitaires. Création de maquettes web et print. Management d'un junior designer.</p>
                        </div>
                        <div class="cv-creatif-item">
                            <div class="cv-creatif-item-title" id="field-exp2_titre">Designer Freelance</div>
                            <div class="cv-creatif-item-date" id="field-exp2_date">2019 - 2021</div>
                            <div class="cv-creatif-item-subtitle" id="field-exp2_entreprise">Indépendant</div>
                            <p class="cv-creatif-text" id="field-exp2_desc">Réalisation de logos, chartes graphiques et supports de communication pour des PME locales.</p>
                        </div>
                    </section>
                    
                    <section class="cv-creatif-section">
                        <div class="cv-creatif-section-title">Formation</div>
                        <div class="cv-creatif-item">
                            <div class="cv-creatif-item-title" id="field-form1_diplome">Master en Design Graphique</div>
                            <div class="cv-creatif-item-date" id="field-form1_date">2017 - 2019</div>
                            <div class="cv-creatif-item-subtitle" id="field-form1_ecole">École des Beaux-Arts</div>
                        </div>
                    </section>
                </main>
            </div>
        `
    };
}

// --- DOCUMENT 6 : Lettre de Motivation Stage ---
export function getTemplate_Lettre_Motivation_Stage() {
    return {
        id: 'lettre_motivation_stage',
        name: 'Lettre de Motivation Stage',
        category: 'lettre',
        price: 800,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Format dynamique et adapté aux étudiants recherchant un stage.',
        cssStyles: `
            .lettre-stage-container { width: 210mm; min-height: 297mm; background: white; padding: 50px 60px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .lettre-stage-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .lettre-stage-expediteur { font-size: 0.95rem; line-height: 1.5; }
            .lettre-stage-destinataire { text-align: right; font-size: 0.95rem; line-height: 1.5; }
            .lettre-stage-date { text-align: right; margin-bottom: 30px; font-weight: 600; color: var(--doc-primary-color, #0F172A); }
            .lettre-stage-objet { font-weight: 700; margin-bottom: 25px; color: var(--doc-primary-color, #0F172A); font-size: 1.05rem; text-decoration: underline; text-underline-offset: 4px; }
            .lettre-stage-corps { margin-bottom: 20px; text-align: justify; font-size: 1rem; }
            .lettre-stage-corps p { margin-bottom: 15px; }
            .lettre-stage-formule { margin-top: 30px; font-style: italic; }
            .lettre-stage-signature { margin-top: 40px; text-align: right; font-weight: 700; color: var(--doc-primary-color, #0F172A); }
        `,
        htmlStructure: `
            <div class="lettre-stage-container">
                <div class="lettre-stage-header">
                    <div class="lettre-stage-expediteur">
                        <strong id="field-expediteur_nom">Meurphy TALAMIO</strong><br>
                        <span id="field-expediteur_adresse">Brazzaville, Congo</span><br>
                        <span id="field-expediteur_telephone">+242 06 518 69 67</span><br>
                        <span id="field-expediteur_email">brazzamarket.infos@gmail.com</span>
                    </div>
                    <div class="lettre-stage-destinataire">
                        <strong id="field-destinataire_nom">Monsieur le Responsable RH</strong><br>
                        <span id="field-destinataire_fonction">Responsable des Stages</span><br>
                        <span id="field-destinataire_entreprise">Entreprise Cible</span><br>
                        <span id="field-destinataire_adresse">Brazzaville, Congo</span>
                    </div>
                </div>
                
                <div class="lettre-stage-date">Brazzaville, le <span id="field-date">04 octobre 2026</span></div>
                
                <div class="lettre-stage-objet">Objet : <span id="field-objet">Candidature pour un stage de fin d'études</span></div>
                
                <div class="lettre-stage-corps">
                    <p id="field-paragraphe1">Madame, Monsieur,</p>
                    <p id="field-paragraphe2">Actuellement étudiant en <span id="field-formation">Master Management</span> à l'Université Marien Ngouabi, je suis à la recherche d'un stage de fin d'études d'une durée de <span id="field-duree">6 mois</span> à partir de <span id="field-date_debut">janvier 2027</span>.</p>
                    <p id="field-paragraphe3">Votre entreprise, reconnue pour <span id="field-raison_interet">son innovation et son excellence</span>, représente pour moi l'environnement idéal pour mettre en pratique mes connaissances et développer de nouvelles compétences. Sérieux, motivé et doté d'un bon esprit d'équipe, je suis prêt à m'investir pleinement dans les missions que vous voudrez bien me confier.</p>
                    <p id="field-paragraphe4">Je me tiens à votre entière disposition pour un entretien afin de vous exposer plus en détail mes motivations. Dans cette attente, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
                </div>
                
                <div class="lettre-stage-formule">Cordialement,</div>
                <div class="lettre-stage-signature" id="field-signature">Meurphy TALAMIO</div>
            </div>
        `
    };
}

// --- DOCUMENT 3 : Attestation de Travail ---
export function getTemplate_Attestation_Travail() {
    return {
        id: 'attestation_travail',
        name: 'Attestation de Travail',
        category: 'attestation',
        price: 1000,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Modèle officiel d\'attestation de travail pour justifier de l\'emploi.',
        cssStyles: `
            .attestation-container { width: 210mm; min-height: 297mm; background: white; padding: 60px 70px; font-family: 'Times New Roman', 'Georgia', serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); line-height: 1.8; }
            .attestation-header { text-align: center; margin-bottom: 50px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .attestation-entreprise-nom { font-size: 1.8rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
            .attestation-entreprise-info { font-size: 0.95rem; color: #64748b; line-height: 1.6; }
            .attestation-titre { text-align: center; font-size: 2rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 3px; margin: 40px 0; text-decoration: underline; text-underline-offset: 8px; }
            .attestation-corps { font-size: 1.1rem; line-height: 2; text-align: justify; margin-bottom: 30px; }
            .attestation-corps p { margin-bottom: 20px; text-indent: 40px; }
            .attestation-info-employe { font-weight: 700; color: var(--doc-primary-color, #0F172A); }
            .attestation-date-lieu { text-align: right; font-size: 1.05rem; margin: 40px 0; font-style: italic; }
            .attestation-signature { margin-top: 60px; text-align: right; }
            .attestation-signature-label { font-size: 1rem; color: #64748b; margin-bottom: 80px; }
            .attestation-signature-nom { font-size: 1.1rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); border-top: 2px solid var(--doc-primary-color, #0F172A); display: inline-block; padding-top: 10px; min-width: 200px; }
            .attestation-signature-fonction { font-size: 0.95rem; color: #64748b; margin-top: 5px; }
            .attestation-footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.85rem; color: #94a3b8; font-style: italic; }
        `,
        htmlStructure: `
            <div class="attestation-container">
                <header class="attestation-header">
                    <div class="attestation-entreprise-nom" id="field-entreprise_nom">ENTREPRISE XYZ</div>
                    <div class="attestation-entreprise-info">
                        <div id="field-entreprise_adresse">123 Avenue de l'Indépendance, Brazzaville</div>
                        <div>Tél: <span id="field-entreprise_telephone">+242 06 000 00 00</span> | Email: <span id="field-entreprise_email">contact@entreprise.com</span></div>
                    </div>
                </header>
                <h1 class="attestation-titre">Attestation de Travail</h1>
                <div class="attestation-corps">
                    <p>Je soussigné(e), <span class="attestation-info-employe" id="field-signataire_nom">Monsieur le Directeur Général</span>, agissant en qualité de <span class="attestation-info-employe" id="field-signataire_fonction">Directeur Général</span> de la société <span class="attestation-info-employe" id="field-entreprise_nom2">ENTREPRISE XYZ</span>,</p>
                    <p>Certifie par la présente que <span class="attestation-info-employe" id="field-employe_nom">Meurphy TALAMIO</span>, né(e) le <span class="attestation-info-employe" id="field-employe_naissance">01/01/1990</span> à <span class="attestation-info-employe" id="field-employe_lieu_naissance">Brazzaville</span>, titulaire de la CNI n° <span class="attestation-info-employe" id="field-employe_cni">123456789</span>,</p>
                    <p>Est employé(e) au sein de notre entreprise depuis le <span class="attestation-info-employe" id="field-employe_date_embauche">01/01/2020</span> en qualité de <span class="attestation-info-employe" id="field-employe_poste">Directeur Général</span>, et y occupe actuellement les fonctions de <span class="attestation-info-employe" id="field-employe_fonction_actuelle">Directeur Général</span>.</p>
                    <p>Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.</p>
                </div>
                <div class="attestation-date-lieu">Fait à <span id="field-ville">Brazzaville</span>, le <span id="field-date">04 octobre 2026</span></div>
                <div class="attestation-signature">
                    <div class="attestation-signature-label">Le Signataire</div>
                    <div class="attestation-signature-nom" id="field-signataire_nom2">Monsieur le Directeur Général</div>
                    <div class="attestation-signature-fonction" id="field-signataire_fonction2">Directeur Général</div>
                </div>
                <div class="attestation-footer">Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com</div>
            </div>
        `
    };
}


// --- DOCUMENT 7 : CV Ingénieur Tech ---
export function getTemplate_CV_Ingenieur_Tech() {
    return {
        id: 'cv_ingenieur_tech',
        name: 'CV Ingénieur Tech',
        category: 'cv',
        price: 1500,
        hasPhoto: true,
        hasColorPicker: true,
        description: 'Design moderne et technique, spécialisé pour les métiers IT et ingénierie.',
        cssStyles: `
            .cv-tech-container { width: 210mm; min-height: 297mm; background: white; font-family: 'Inter', sans-serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); display: grid; grid-template-columns: 35% 65%; }
            .cv-tech-sidebar { background: #1e293b; color: white; padding: 40px 25px; }
            .cv-tech-photo { width: 140px; height: 140px; border-radius: 50%; background: rgba(255,255,255,0.1); margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 4px solid var(--doc-primary-color, #0F172A); }
            .cv-tech-photo img { width: 100%; height: 100%; object-fit: cover; }
            .cv-tech-photo-placeholder { font-size: 2.5rem; font-weight: 800; color: white; }
            .cv-tech-sidebar-title { font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid var(--doc-primary-color, #0F172A); }
            .cv-tech-contact-item { font-size: 0.9rem; margin-bottom: 12px; word-break: break-word; }
            .cv-tech-skill-bar { margin-bottom: 15px; }
            .cv-tech-skill-name { font-size: 0.9rem; margin-bottom: 5px; }
            .cv-tech-skill-track { height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden; }
            .cv-tech-skill-fill { height: 100%; background: var(--doc-primary-color, #0F172A); border-radius: 4px; }
            .cv-tech-main { padding: 40px 35px; }
            .cv-tech-name { font-size: 2.5rem; font-weight: 800; color: #1e293b; line-height: 1; margin-bottom: 10px; }
            .cv-tech-title { font-size: 1.2rem; color: var(--doc-primary-color, #0F172A); font-weight: 600; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .cv-tech-section { margin-bottom: 30px; }
            .cv-tech-section-title { font-size: 1.1rem; font-weight: 800; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
            .cv-tech-section-title::before { content: ''; width: 4px; height: 20px; background: var(--doc-primary-color, #0F172A); border-radius: 2px; }
            .cv-tech-text { font-size: 0.95rem; line-height: 1.6; color: #475569; }
            .cv-tech-item { margin-bottom: 20px; padding-left: 15px; border-left: 3px solid #e2e8f0; }
            .cv-tech-item-title { font-weight: 700; color: #0f172a; font-size: 1.05rem; }
            .cv-tech-item-date { font-size: 0.85rem; color: #64748b; font-style: italic; margin-bottom: 5px; }
            .cv-tech-item-subtitle { font-size: 0.95rem; color: var(--doc-primary-color, #0F172A); font-weight: 600; margin-bottom: 8px; }
            .cv-tech-tech-stack { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
            .cv-tech-tech-tag { background: #f1f5f9; color: #0f172a; padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: 600; border-left: 3px solid var(--doc-primary-color, #0F172A); }
        `,
        htmlStructure: `
            <div class="cv-tech-container">
                <aside class="cv-tech-sidebar">
                    <div class="cv-tech-photo" id="doc-photo"><span class="cv-tech-photo-placeholder" id="photo-initials">MT</span></div>
                    <div class="cv-tech-sidebar-title">Contact</div>
                    <div class="cv-tech-contact-item"> <span id="field-email">brazzamarket.infos@gmail.com</span></div>
                    <div class="cv-tech-contact-item">☎ <span id="field-telephone">+242 06 518 69 67</span></div>
                    <div class="cv-tech-contact-item">⌖ <span id="field-adresse">Brazzaville, Congo</span></div>
                    <div class="cv-tech-contact-item">💻 <span id="field-github">github.com/meurphy</span></div>
                    
                    <div class="cv-tech-sidebar-title">Compétences Techniques</div>
                    <div class="cv-tech-skill-bar"><div class="cv-tech-skill-name" id="field-tech1_name">JavaScript/TypeScript</div><div class="cv-tech-skill-track"><div class="cv-tech-skill-fill" style="width: 90%"></div></div></div>
                    <div class="cv-tech-skill-bar"><div class="cv-tech-skill-name" id="field-tech2_name">React/Node.js</div><div class="cv-tech-skill-track"><div class="cv-tech-skill-fill" style="width: 85%"></div></div></div>
                    <div class="cv-tech-skill-bar"><div class="cv-tech-skill-name" id="field-tech3_name">Python/Django</div><div class="cv-tech-skill-track"><div class="cv-tech-skill-fill" style="width: 80%"></div></div></div>
                    <div class="cv-tech-skill-bar"><div class="cv-tech-skill-name" id="field-tech4_name">SQL/NoSQL</div><div class="cv-tech-skill-track"><div class="cv-tech-skill-fill" style="width: 75%"></div></div></div>
                    
                    <div class="cv-tech-sidebar-title">Langues</div>
                    <div class="cv-tech-contact-item"><strong id="field-lang1_name">Français</strong> : <span id="field-lang1_level">Courant</span></div>
                    <div class="cv-tech-contact-item"><strong id="field-lang2_name">Anglais</strong> : <span id="field-lang2_level">Technique</span></div>
                </aside>
                <main class="cv-tech-main">
                    <h1 class="cv-tech-name" id="field-nom">Meurphy TALAMIO</h1>
                    <div class="cv-tech-title" id="field-poste">Ingénieur Full Stack Senior</div>
                    
                    <section class="cv-tech-section">
                        <div class="cv-tech-section-title">Profil</div>
                        <p class="cv-tech-text" id="field-profil">Ingénieur passionné avec 7 ans d'expérience dans le développement d'applications web et mobiles. Spécialisé en architectures modernes et solutions cloud. Leader technique d'équipes agiles.</p>
                    </section>
                    
                    <section class="cv-tech-section">
                        <div class="cv-tech-section-title">Expériences</div>
                        <div class="cv-tech-item">
                            <div class="cv-tech-item-title" id="field-exp1_titre">Lead Developer Full Stack</div>
                            <div class="cv-tech-item-date" id="field-exp1_date">2021 - Présent</div>
                            <div class="cv-tech-item-subtitle" id="field-exp1_entreprise">TechCorp Solutions</div>
                            <p class="cv-tech-text" id="field-exp1_desc">Direction technique d'une équipe de 8 développeurs. Architecture microservices. Déploiement CI/CD. Réduction du temps de chargement de 40%.</p>
                            <div class="cv-tech-tech-stack">
                                <span class="cv-tech-tech-tag" id="field-exp1_tech1">React</span>
                                <span class="cv-tech-tech-tag" id="field-exp1_tech2">Node.js</span>
                                <span class="cv-tech-tech-tag" id="field-exp1_tech3">AWS</span>
                            </div>
                        </div>
                        <div class="cv-tech-item">
                            <div class="cv-tech-item-title" id="field-exp2_titre">Développeur Backend</div>
                            <div class="cv-tech-item-date" id="field-exp2_date">2018 - 2021</div>
                            <div class="cv-tech-item-subtitle" id="field-exp2_entreprise">StartupXYZ</div>
                            <p class="cv-tech-text" id="field-exp2_desc">Développement d'APIs RESTful. Optimisation de bases de données. Intégration de systèmes de paiement.</p>
                            <div class="cv-tech-tech-stack">
                                <span class="cv-tech-tech-tag" id="field-exp2_tech1">Python</span>
                                <span class="cv-tech-tech-tag" id="field-exp2_tech2">Django</span>
                                <span class="cv-tech-tech-tag" id="field-exp2_tech3">PostgreSQL</span>
                            </div>
                        </div>
                    </section>
                    
                    <section class="cv-tech-section">
                        <div class="cv-tech-section-title">Formation</div>
                        <div class="cv-tech-item">
                            <div class="cv-tech-item-title" id="field-form1_diplome">Master en Informatique</div>
                            <div class="cv-tech-item-date" id="field-form1_date">2016 - 2018</div>
                            <div class="cv-tech-item-subtitle" id="field-form1_ecole">Université Marien Ngouabi</div>
                        </div>
                    </section>
                </main>
            </div>
        `
    };
}

// --- DOCUMENT 8 : Lettre de Recommandation ---
export function getTemplate_Lettre_Recommandation() {
    return {
        id: 'lettre_recommandation',
        name: 'Lettre de Recommandation',
        category: 'lettre',
        price: 800,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Format professionnel pour recommander un candidat ou un collaborateur.',
        cssStyles: `
            .lettre-reco-container { width: 210mm; min-height: 297mm; background: white; padding: 50px 60px; font-family: 'Georgia', 'Times New Roman', serif; color: #1e293b; line-height: 1.8; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .lettre-reco-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .lettre-reco-expediteur { font-size: 0.95rem; line-height: 1.5; }
            .lettre-reco-destinataire { text-align: right; font-size: 0.95rem; line-height: 1.5; }
            .lettre-reco-date { text-align: right; margin-bottom: 30px; font-weight: 600; color: var(--doc-primary-color, #0F172A); }
            .lettre-reco-objet { font-weight: 700; margin-bottom: 25px; color: var(--doc-primary-color, #0F172A); font-size: 1.05rem; text-decoration: underline; text-underline-offset: 4px; }
            .lettre-reco-corps { margin-bottom: 20px; text-align: justify; font-size: 1rem; }
            .lettre-reco-corps p { margin-bottom: 15px; }
            .lettre-reco-info-personne { font-weight: 700; color: var(--doc-primary-color, #0F172A); }
            .lettre-reco-formule { margin-top: 30px; font-style: italic; }
            .lettre-reco-signature { margin-top: 40px; text-align: right; }
            .lettre-reco-signature-nom { font-weight: 700; color: var(--doc-primary-color, #0F172A); font-size: 1.1rem; }
            .lettre-reco-signature-fonction { font-size: 0.95rem; color: #64748b; margin-top: 5px; }
        `,
        htmlStructure: `
            <div class="lettre-reco-container">
                <div class="lettre-reco-header">
                    <div class="lettre-reco-expediteur">
                        <strong id="field-expediteur_nom">Meurphy TALAMIO</strong><br>
                        <span id="field-expediteur_fonction">Directeur Général</span><br>
                        <span id="field-expediteur_entreprise">Entreprise XYZ</span><br>
                        <span id="field-expediteur_adresse">Brazzaville, Congo</span><br>
                        <span id="field-expediteur_telephone">+242 06 518 69 67</span><br>
                        <span id="field-expediteur_email">brazzamarket.infos@gmail.com</span>
                    </div>
                    <div class="lettre-reco-destinataire">
                        <strong id="field-destinataire_nom">À qui de droit</strong><br>
                        <span id="field-destinataire_entreprise">Entreprise Cible</span><br>
                        <span id="field-destinataire_adresse">Brazzaville, Congo</span>
                    </div>
                </div>
                
                <div class="lettre-reco-date">Brazzaville, le <span id="field-date">04 octobre 2026</span></div>
                
                <div class="lettre-reco-objet">Objet : <span id="field-objet">Lettre de recommandation pour [Nom de la personne]</span></div>
                
                <div class="lettre-reco-corps">
                    <p id="field-paragraphe1">Madame, Monsieur,</p>
                    <p id="field-paragraphe2">Par la présente, je tiens à recommander vivement <span class="lettre-reco-info-personne" id="field-personne_nom">Monsieur/Madame [Nom]</span>, que j'ai eu le plaisir de connaître pendant <span class="lettre-reco-info-personne" id="field-duree_collaboration">3 ans</span> au sein de notre entreprise <span class="lettre-reco-info-personne" id="field-entreprise_nom2">Entreprise XYZ</span>.</p>
                    <p id="field-paragraphe3">Durant cette période, <span class="lettre-reco-info-personne" id="field-personne_pronom">il/elle</span> a occupé le poste de <span class="lettre-reco-info-personne" id="field-personne_poste">[Poste occupé]</span> et a fait preuve d'un professionnalisme exemplaire, d'une grande rigueur et d'un excellent esprit d'équipe. <span class="lettre-reco-info-personne" id="field-personne_pronom2">Il/Elle</span> a notamment contribué à <span class="lettre-reco-info-personne" id="field-realisation_majeure">[Réalisation majeure]</span>.</p>
                    <p id="field-paragraphe4">Je suis convaincu que <span class="lettre-reco-info-personne" id="field-personne_pronom3">il/elle</span> sera un atout précieux pour votre organisation et je le/la recommande sans réserve.</p>
                    <p id="field-paragraphe5">Je reste à votre disposition pour tout complément d'information.</p>
                </div>
                
                <div class="lettre-reco-formule">Cordialement,</div>
                <div class="lettre-reco-signature">
                    <div class="lettre-reco-signature-nom" id="field-expediteur_nom2">Meurphy TALAMIO</div>
                    <div class="lettre-reco-signature-fonction" id="field-expediteur_fonction2">Directeur Général</div>
                </div>
            </div>
        `
    };
}

// --- DOCUMENT 9 : Attestation de Salaire ---
export function getTemplate_Attestation_Salaire() {
    return {
        id: 'attestation_salaire',
        name: 'Attestation de Salaire',
        category: 'attestation',
        price: 1000,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Document officiel attestant du salaire d\'un employé .',
        cssStyles: `
            .att-salaire-container { width: 210mm; min-height: 297mm; background: white; padding: 60px 70px; font-family: 'Times New Roman', 'Georgia', serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); line-height: 1.8; }
            .att-salaire-header { text-align: center; margin-bottom: 50px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .att-salaire-entreprise-nom { font-size: 1.8rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
            .att-salaire-entreprise-info { font-size: 0.95rem; color: #64748b; line-height: 1.6; }
            .att-salaire-titre { text-align: center; font-size: 2rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 3px; margin: 40px 0; text-decoration: underline; text-underline-offset: 8px; }
            .att-salaire-corps { font-size: 1.1rem; line-height: 2; text-align: justify; margin-bottom: 30px; }
            .att-salaire-corps p { margin-bottom: 20px; text-indent: 40px; }
            .att-salaire-info { font-weight: 700; color: var(--doc-primary-color, #0F172A); }
            .att-salaire-tableau { width: 100%; margin: 30px 0; border-collapse: collapse; }
            .att-salaire-tableau td { padding: 12px 15px; border: 1px solid #e2e8f0; }
            .att-salaire-tableau td:first-child { font-weight: 600; background: #f8fafc; width: 40%; }
            .att-salaire-date-lieu { text-align: right; font-size: 1.05rem; margin: 40px 0; font-style: italic; }
            .att-salaire-signature { margin-top: 60px; text-align: right; }
            .att-salaire-signature-label { font-size: 1rem; color: #64748b; margin-bottom: 80px; }
            .att-salaire-signature-nom { font-size: 1.1rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); border-top: 2px solid var(--doc-primary-color, #0F172A); display: inline-block; padding-top: 10px; min-width: 200px; }
            .att-salaire-signature-fonction { font-size: 0.95rem; color: #64748b; margin-top: 5px; }
            .att-salaire-footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.85rem; color: #94a3b8; font-style: italic; }
        `,
        htmlStructure: `
            <div class="att-salaire-container">
                <header class="att-salaire-header">
                    <div class="att-salaire-entreprise-nom" id="field-entreprise_nom">ENTREPRISE XYZ</div>
                    <div class="att-salaire-entreprise-info">
                        <div id="field-entreprise_adresse">123 Avenue de l'Indépendance, Brazzaville</div>
                        <div>Tél: <span id="field-entreprise_telephone">+242 06 000 00 00</span> | Email: <span id="field-entreprise_email">contact@entreprise.com</span></div>
                    </div>
                </header>
                
                <h1 class="att-salaire-titre">Attestation de Salaire</h1>
                
                <div class="att-salaire-corps">
                    <p>Je soussigné(e), <span class="att-salaire-info" id="field-signataire_nom">Monsieur le Directeur Général</span>, agissant en qualité de <span class="att-salaire-info" id="field-signataire_fonction">Directeur Général</span> de la société <span class="att-salaire-info" id="field-entreprise_nom2">ENTREPRISE XYZ</span>,</p>
                    
                    <p>Certifie par la présente que <span class="att-salaire-info" id="field-employe_nom">Meurphy TALAMIO</span>, occupant le poste de <span class="att-salaire-info" id="field-employe_poste">Directeur Général</span> au sein de notre entreprise depuis le <span class="att-salaire-info" id="field-employe_date_embauche">01/01/2020</span>, perçoit une rémunération mensuelle brute de <span class="att-salaire-info" id="field-salaire_montant">1 500 000 FCFA</span>.</p>
                    
                    <p>Cette rémunération se décompose comme suit :</p>
                </div>
                
                <table class="att-salaire-tableau">
                    <tr><td>Salaire de base</td><td id="field-salaire_base">1 200 000 FCFA</td></tr>
                    <tr><td>Primes et indemnités</td><td id="field-salaire_primes">300 000 FCFA</td></tr>
                    <tr><td><strong>Total brut mensuel</strong></td><td><strong id="field-salaire_total">1 500 000 FCFA</strong></td></tr>
                </table>
                
                <div class="att-salaire-corps">
                    <p>Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit, notamment pour faciliter ses démarches administratives et bancaires.</p>
                </div>
                
                <div class="att-salaire-date-lieu">Fait à <span id="field-ville">Brazzaville</span>, le <span id="field-date">04 octobre 2026</span></div>
                
                <div class="att-salaire-signature">
                    <div class="att-salaire-signature-label">Le Signataire</div>
                    <div class="att-salaire-signature-nom" id="field-signataire_nom2">Monsieur le Directeur Général</div>
                    <div class="att-salaire-signature-fonction" id="field-signataire_fonction2">Directeur Général</div>
                </div>
                
                <div class="att-salaire-footer">Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com</div>
            </div>
        `
    };
}


// --- DOCUMENT 10 : Contrat CDI ---
export function getTemplate_Contrat_CDI() {
    return {
        id: 'contrat_cdi',
        name: 'Contrat de Travail CDI',
        category: 'contrat',
        price: 2000,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Modèle complet de contrat à durée indéterminée conforme au droit du travail.',
        cssStyles: `
            .contrat-container { width: 210mm; min-height: 297mm; background: white; padding: 50px 60px; font-family: 'Times New Roman', 'Georgia', serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); line-height: 1.8; }
            .contrat-header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .contrat-entreprise-nom { font-size: 1.8rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
            .contrat-entreprise-info { font-size: 0.95rem; color: #64748b; line-height: 1.6; }
            .contrat-titre { text-align: center; font-size: 1.8rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 2px; margin: 40px 0; text-decoration: underline; text-underline-offset: 8px; }
            .contrat-parties { margin-bottom: 30px; }
            .contrat-partie { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-left: 4px solid var(--doc-primary-color, #0F172A); }
            .contrat-partie-title { font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; font-size: 1.05rem; }
            .contrat-partie-info { font-size: 0.95rem; line-height: 1.6; }
            .contrat-article { margin-bottom: 25px; }
            .contrat-article-title { font-size: 1.1rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; text-transform: uppercase; }
            .contrat-article-content { font-size: 0.95rem; line-height: 1.7; text-align: justify; }
            .contrat-article-content p { margin-bottom: 10px; }
            .contrat-info { font-weight: 700; color: var(--doc-primary-color, #0F172A); }
            .contrat-signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .contrat-signature-block { text-align: center; }
            .contrat-signature-label { font-size: 0.95rem; color: #64748b; margin-bottom: 60px; font-weight: 600; }
            .contrat-signature-line { border-top: 2px solid var(--doc-primary-color, #0F172A); padding-top: 10px; font-weight: 700; color: var(--doc-primary-color, #0F172A); }
            .contrat-date-lieu { text-align: right; font-size: 1rem; margin: 30px 0; font-style: italic; }
            .contrat-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.85rem; color: #94a3b8; font-style: italic; }
        `,
        htmlStructure: `
            <div class="contrat-container">
                <header class="contrat-header">
                    <div class="contrat-entreprise-nom" id="field-entreprise_nom">ENTREPRISE XYZ</div>
                    <div class="contrat-entreprise-info">
                        <div id="field-entreprise_adresse">123 Avenue de l'Indépendance, Brazzaville</div>
                        <div>Tél: <span id="field-entreprise_telephone">+242 06 000 00 00</span> | Email: <span id="field-entreprise_email">contact@entreprise.com</span></div>
                    </div>
                </header>
                
                <h1 class="contrat-titre">Contrat de Travail à Durée Indéterminée</h1>
                
                <div class="contrat-date-lieu">Fait à <span id="field-ville">Brazzaville</span>, le <span id="field-date">04 octobre 2026</span></div>
                
                <div class="contrat-parties">
                    <div class="contrat-partie">
                        <div class="contrat-partie-title">ENTRE LES SOUSSIGNÉS</div>
                        <div class="contrat-partie-info">
                            La société <span class="contrat-info" id="field-entreprise_nom2">ENTREPRISE XYZ</span>, immatriculée sous le numéro <span class="contrat-info" id="field-entreprise_immatriculation">123456789</span>, dont le siège social est situé au <span class="contrat-info" id="field-entreprise_siege">123 Avenue de l'Indépendance, Brazzaville</span>, représentée par <span class="contrat-info" id="field-employeur_nom">Monsieur le Directeur Général</span>, agissant en qualité de <span class="contrat-info" id="field-employeur_fonction">Directeur Général</span>,<br><br>
                            Ci-après dénommée "<strong>l'Employeur</strong>",
                        </div>
                    </div>
                    
                    <div class="contrat-partie">
                        <div class="contrat-partie-title">ET</div>
                        <div class="contrat-partie-info">
                            Monsieur/Madame <span class="contrat-info" id="field-employe_nom">Meurphy TALAMIO</span>, né(e) le <span class="contrat-info" id="field-employe_naissance">01/01/1990</span> à <span class="contrat-info" id="field-employe_lieu_naissance">Brazzaville</span>, titulaire de la CNI n° <span class="contrat-info" id="field-employe_cni">123456789</span>, demeurant au <span class="contrat-info" id="field-employe_adresse">Brazzaville, Congo</span>,<br><br>
                            Ci-après dénommé(e) "<strong>le Salarié</strong>",
                        </div>
                    </div>
                </div>
                
                <div class="contrat-article">
                    <div class="contrat-article-title">Article 1 - Objet du contrat</div>
                    <div class="contrat-article-content">
                        <p>Le présent contrat a pour objet de définir les conditions dans lesquelles <span class="contrat-info" id="field-employe_nom2">Meurphy TALAMIO</span> est engagé(e) par la société <span class="contrat-info" id="field-entreprise_nom3">ENTREPRISE XYZ</span> dans le cadre d'un contrat de travail à durée indéterminée.</p>
                    </div>
                </div>
                
                <div class="contrat-article">
                    <div class="contrat-article-title">Article 2 - Fonctions et missions</div>
                    <div class="contrat-article-content">
                        <p>Le Salarié est engagé en qualité de <span class="contrat-info" id="field-employe_poste">Directeur Général</span>. Il/Elle aura pour missions principales : <span class="contrat-info" id="field-missions">Direction stratégique de l'entreprise, management des équipes, développement commercial</span>.</p>
                        <p>Le Salarié sera placé sous l'autorité de <span class="contrat-info" id="field-superieur_hierarchique">Monsieur le Président du Conseil d'Administration</span>.</p>
                    </div>
                </div>
                
                <div class="contrat-article">
                    <div class="contrat-article-title">Article 3 - Date d'entrée et période d'essai</div>
                    <div class="contrat-article-content">
                        <p>Le présent contrat prend effet à compter du <span class="contrat-info" id="field-date_debut">01/01/2027</span>.</p>
                        <p>Le Salarié sera soumis à une période d'essai de <span class="contrat-info" id="field-duree_essai">3 mois</span>, renouvelable une fois pour une durée équivalente.</p>
                    </div>
                </div>
                
                <div class="contrat-article">
                    <div class="contrat-article-title">Article 4 - Rémunération</div>
                    <div class="contrat-article-content">
                        <p>En contrepartie de son travail, le Salarié percevra une rémunération mensuelle brute de <span class="contrat-info" id="field-salaire_montant">1 500 000 FCFA</span>, composée d'un salaire de base de <span class="contrat-info" id="field-salaire_base">1 200 000 FCFA</span> et de primes pour un montant de <span class="contrat-info" id="field-salaire_primes">300 000 FCFA</span>.</p>
                    </div>
                </div>
                
                <div class="contrat-article">
                    <div class="contrat-article-title">Article 5 - Durée du travail</div>
                    <div class="contrat-article-content">
                        <p>La durée du travail est fixée à <span class="contrat-info" id="field-duree_travail">40 heures</span> par semaine, réparties selon l'organisation de l'entreprise.</p>
                    </div>
                </div>
                
                <div class="contrat-article">
                    <div class="contrat-article-title">Article 6 - Lieu de travail</div>
                    <div class="contrat-article-content">
                        <p>Le Salarié exercera ses fonctions au siège social de l'entreprise situé à <span class="contrat-info" id="field-lieu_travail">Brazzaville</span>. Des déplacements professionnels pourront être demandés.</p>
                    </div>
                </div>
                
                <div class="contrat-article">
                    <div class="contrat-article-title">Article 7 - Congés payés</div>
                    <div class="contrat-article-content">
                        <p>Le Salarié bénéficiera de <span class="contrat-info" id="field-jours_conges">30 jours</span> de congés payés par an, conformément à la législation en vigueur.</p>
                    </div>
                </div>
                
                <div class="contrat-article">
                    <div class="contrat-article-title">Article 8 - Résiliation du contrat</div>
                    <div class="contrat-article-content">
                        <p>Chacune des parties pourra mettre fin au présent contrat à tout moment, sous réserve de respecter un préavis de <span class="contrat-info" id="field-duree_preavis">3 mois</span> pour le Salarié et de <span class="contrat-info" id="field-duree_preavis_employeur">6 mois</span> pour l'Employeur.</p>
                    </div>
                </div>
                
                <div class="contrat-signatures">
                    <div class="contrat-signature-block">
                        <div class="contrat-signature-label">L'Employeur</div>
                        <div class="contrat-signature-line" id="field-employeur_nom2">Monsieur le Directeur Général</div>
                    </div>
                    <div class="contrat-signature-block">
                        <div class="contrat-signature-label">Le Salarié</div>
                        <div class="contrat-signature-line" id="field-employe_nom3">Meurphy TALAMIO</div>
                    </div>
                </div>
                
                <div class="contrat-footer">Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com</div>
            </div>
        `
    };
}

// --- DOCUMENT 11 : Contrat CDD ---
export function getTemplate_Contrat_CDD() {
    return {
        id: 'contrat_cdd',
        name: 'Contrat de Travail CDD',
        category: 'contrat',
        price: 2000,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Modèle de contrat à durée déterminée avec motif de recours.',
        cssStyles: `
            .contrat-cdd-container { width: 210mm; min-height: 297mm; background: white; padding: 50px 60px; font-family: 'Times New Roman', 'Georgia', serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); line-height: 1.8; }
            .contrat-cdd-header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .contrat-cdd-entreprise-nom { font-size: 1.8rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
            .contrat-cdd-entreprise-info { font-size: 0.95rem; color: #64748b; line-height: 1.6; }
            .contrat-cdd-titre { text-align: center; font-size: 1.8rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 2px; margin: 40px 0; text-decoration: underline; text-underline-offset: 8px; }
            .contrat-cdd-motif { background: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin-bottom: 30px; font-size: 0.95rem; }
            .contrat-cdd-motif strong { color: #92400e; }
            .contrat-cdd-parties { margin-bottom: 30px; }
            .contrat-cdd-partie { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-left: 4px solid var(--doc-primary-color, #0F172A); }
            .contrat-cdd-partie-title { font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; font-size: 1.05rem; }
            .contrat-cdd-partie-info { font-size: 0.95rem; line-height: 1.6; }
            .contrat-cdd-article { margin-bottom: 25px; }
            .contrat-cdd-article-title { font-size: 1.1rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; text-transform: uppercase; }
            .contrat-cdd-article-content { font-size: 0.95rem; line-height: 1.7; text-align: justify; }
            .contrat-cdd-article-content p { margin-bottom: 10px; }
            .contrat-cdd-info { font-weight: 700; color: var(--doc-primary-color, #0F172A); }
            .contrat-cdd-duree-box { background: #dbeafe; border: 2px solid #3b82f6; padding: 20px; margin: 30px 0; text-align: center; }
            .contrat-cdd-duree-box .label { font-size: 0.9rem; color: #64748b; margin-bottom: 5px; }
            .contrat-cdd-duree-box .value { font-size: 1.3rem; font-weight: 700; color: #1e40af; }
            .contrat-cdd-signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .contrat-cdd-signature-block { text-align: center; }
            .contrat-cdd-signature-label { font-size: 0.95rem; color: #64748b; margin-bottom: 60px; font-weight: 600; }
            .contrat-cdd-signature-line { border-top: 2px solid var(--doc-primary-color, #0F172A); padding-top: 10px; font-weight: 700; color: var(--doc-primary-color, #0F172A); }
            .contrat-cdd-date-lieu { text-align: right; font-size: 1rem; margin: 30px 0; font-style: italic; }
            .contrat-cdd-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.85rem; color: #94a3b8; font-style: italic; }
        `,
        htmlStructure: `
            <div class="contrat-cdd-container">
                <header class="contrat-cdd-header">
                    <div class="contrat-cdd-entreprise-nom" id="field-entreprise_nom">ENTREPRISE XYZ</div>
                    <div class="contrat-cdd-entreprise-info">
                        <div id="field-entreprise_adresse">123 Avenue de l'Indépendance, Brazzaville</div>
                        <div>Tél: <span id="field-entreprise_telephone">+242 06 000 00 00</span> | Email: <span id="field-entreprise_email">contact@entreprise.com</span></div>
                    </div>
                </header>
                
                <h1 class="contrat-cdd-titre">Contrat de Travail à Durée Déterminée</h1>
                
                <div class="contrat-cdd-motif">
                    <strong>Motif de recours :</strong> <span id="field-motif_recours">Accroissement temporaire d'activité</span>
                </div>
                
                <div class="contrat-cdd-duree-box">
                    <div class="label">Durée du contrat</div>
                    <div class="value">Du <span id="field-date_debut">01/01/2027</span> au <span id="field-date_fin">30/06/2027</span> (<span id="field-duree_totale">6 mois</span>)</div>
                </div>
                
                <div class="contrat-cdd-date-lieu">Fait à <span id="field-ville">Brazzaville</span>, le <span id="field-date">04 octobre 2026</span></div>
                
                <div class="contrat-cdd-parties">
                    <div class="contrat-cdd-partie">
                        <div class="contrat-cdd-partie-title">ENTRE LES SOUSSIGNÉS</div>
                        <div class="contrat-cdd-partie-info">
                            La société <span class="contrat-cdd-info" id="field-entreprise_nom2">ENTREPRISE XYZ</span>, immatriculée sous le numéro <span class="contrat-cdd-info" id="field-entreprise_immatriculation">123456789</span>, dont le siège social est situé au <span class="contrat-cdd-info" id="field-entreprise_siege">123 Avenue de l'Indépendance, Brazzaville</span>, représentée par <span class="contrat-cdd-info" id="field-employeur_nom">Monsieur le Directeur Général</span>,<br><br>
                            Ci-après dénommée "<strong>l'Employeur</strong>",
                        </div>
                    </div>
                    
                    <div class="contrat-cdd-partie">
                        <div class="contrat-cdd-partie-title">ET</div>
                        <div class="contrat-cdd-partie-info">
                            Monsieur/Madame <span class="contrat-cdd-info" id="field-employe_nom">Meurphy TALAMIO</span>, né(e) le <span class="contrat-cdd-info" id="field-employe_naissance">01/01/1990</span> à <span class="contrat-cdd-info" id="field-employe_lieu_naissance">Brazzaville</span>, titulaire de la CNI n° <span class="contrat-cdd-info" id="field-employe_cni">123456789</span>,<br><br>
                            Ci-après dénommé(e) "<strong>le Salarié</strong>",
                        </div>
                    </div>
                </div>
                
                <div class="contrat-cdd-article">
                    <div class="contrat-cdd-article-title">Article 1 - Objet et motif du contrat</div>
                    <div class="contrat-cdd-article-content">
                        <p>Le présent contrat est conclu pour une durée déterminée en raison de <span class="contrat-cdd-info" id="field-motif_detail">l'accroissement temporaire d'activité lié à un projet spécifique</span>.</p>
                    </div>
                </div>
                
                <div class="contrat-cdd-article">
                    <div class="contrat-cdd-article-title">Article 2 - Fonctions</div>
                    <div class="contrat-cdd-article-content">
                        <p>Le Salarié est engagé en qualité de <span class="contrat-cdd-info" id="field-employe_poste">Chef de Projet</span>. Ses missions principales sont : <span class="contrat-cdd-info" id="field-missions">Gestion du projet X, coordination des équipes, reporting</span>.</p>
                    </div>
                </div>
                
                <div class="contrat-cdd-article">
                    <div class="contrat-cdd-article-title">Article 3 - Rémunération</div>
                    <div class="contrat-cdd-article-content">
                        <p>Le Salarié percevra une rémunération mensuelle brute de <span class="contrat-cdd-info" id="field-salaire_montant">1 200 000 FCFA</span>.</p>
                    </div>
                </div>
                
                <div class="contrat-cdd-article">
                    <div class="contrat-cdd-article-title">Article 4 - Durée du travail</div>
                    <div class="contrat-cdd-article-content">
                        <p>La durée du travail est fixée à <span class="contrat-cdd-info" id="field-duree_travail">40 heures</span> par semaine.</p>
                    </div>
                </div>
                
                <div class="contrat-cdd-article">
                    <div class="contrat-cdd-article-title">Article 5 - Renouvellement</div>
                    <div class="contrat-cdd-article-content">
                        <p>Le présent contrat pourra être renouvelé <span class="contrat-cdd-info" id="field-nombre_renouvellements">1 fois</span> pour une durée de <span class="contrat-cdd-info" id="field-duree_renouvellement">3 mois</span>, dans la limite de la durée maximale légale.</p>
                    </div>
                </div>
                
                <div class="contrat-cdd-article">
                    <div class="contrat-cdd-article-title">Article 6 - Indemnité de fin de contrat</div>
                    <div class="contrat-cdd-article-content">
                        <p>À l'issue du contrat, le Salarié percevra une indemnité de fin de contrat égale à <span class="contrat-cdd-info" id="field-taux_indemnite">10%</span> de la rémunération totale brute versée.</p>
                    </div>
                </div>
                
                <div class="contrat-cdd-signatures">
                    <div class="contrat-cdd-signature-block">
                        <div class="contrat-cdd-signature-label">L'Employeur</div>
                        <div class="contrat-cdd-signature-line" id="field-employeur_nom2">Monsieur le Directeur Général</div>
                    </div>
                    <div class="contrat-cdd-signature-block">
                        <div class="contrat-cdd-signature-label">Le Salarié</div>
                        <div class="contrat-cdd-signature-line" id="field-employe_nom2">Meurphy TALAMIO</div>
                    </div>
                </div>
                
                <div class="contrat-cdd-footer">Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com</div>
            </div>
        `
    };
}

// --- DOCUMENT 12 : Contrat Stage ---
export function getTemplate_Contrat_Stage() {
    return {
        id: 'contrat_stage',
        name: 'Convention de Stage',
        category: 'contrat',
        price: 1500,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Convention tripartite pour stage étudiant (école, entreprise, stagiaire).',
        cssStyles: `
            .stage-container { width: 210mm; min-height: 297mm; background: white; padding: 50px 60px; font-family: 'Times New Roman', 'Georgia', serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); line-height: 1.8; }
            .stage-header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .stage-entreprise-nom { font-size: 1.8rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
            .stage-entreprise-info { font-size: 0.95rem; color: #64748b; line-height: 1.6; }
            .stage-titre { text-align: center; font-size: 1.8rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 2px; margin: 40px 0; text-decoration: underline; text-underline-offset: 8px; }
            .stage-tripartite { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .stage-partie { padding: 15px; background: #f8fafc; border-left: 4px solid var(--doc-primary-color, #0F172A); }
            .stage-partie-title { font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; font-size: 0.95rem; text-transform: uppercase; }
            .stage-partie-info { font-size: 0.9rem; line-height: 1.6; }
            .stage-duree-box { background: #dbeafe; border: 2px solid #3b82f6; padding: 20px; margin: 30px 0; text-align: center; }
            .stage-duree-box .label { font-size: 0.9rem; color: #64748b; margin-bottom: 5px; }
            .stage-duree-box .value { font-size: 1.3rem; font-weight: 700; color: #1e40af; }
            .stage-article { margin-bottom: 25px; }
            .stage-article-title { font-size: 1.1rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; text-transform: uppercase; }
            .stage-article-content { font-size: 0.95rem; line-height: 1.7; text-align: justify; }
            .stage-article-content p { margin-bottom: 10px; }
            .stage-info { font-weight: 700; color: var(--doc-primary-color, #0F172A); }
            .stage-objectifs { background: #f0fdf4; border: 2px solid #10b981; padding: 20px; margin: 30px 0; }
            .stage-objectifs-title { font-weight: 700; color: #065f46; margin-bottom: 10px; }
            .stage-objectifs-list { list-style: disc; margin-left: 20px; }
            .stage-objectifs-list li { margin-bottom: 8px; font-size: 0.95rem; }
            .stage-signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; }
            .stage-signature-block { text-align: center; }
            .stage-signature-label { font-size: 0.9rem; color: #64748b; margin-bottom: 60px; font-weight: 600; }
            .stage-signature-line { border-top: 2px solid var(--doc-primary-color, #0F172A); padding-top: 10px; font-weight: 700; color: var(--doc-primary-color, #0F172A); font-size: 0.9rem; }
            .stage-date-lieu { text-align: right; font-size: 1rem; margin: 30px 0; font-style: italic; }
            .stage-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.85rem; color: #94a3b8; font-style: italic; }
        `,
        htmlStructure: `
            <div class="stage-container">
                <header class="stage-header">
                    <div class="stage-entreprise-nom" id="field-entreprise_nom">ENTREPRISE XYZ</div>
                    <div class="stage-entreprise-info">
                        <div id="field-entreprise_adresse">123 Avenue de l'Indépendance, Brazzaville</div>
                        <div>Tél: <span id="field-entreprise_telephone">+242 06 000 00 00</span> | Email: <span id="field-entreprise_email">contact@entreprise.com</span></div>
                    </div>
                </header>
                
                <h1 class="stage-titre">Convention de Stage</h1>
                
                <div class="stage-duree-box">
                    <div class="label">Durée du stage</div>
                    <div class="value">Du <span id="field-date_debut">01/01/2027</span> au <span id="field-date_fin">30/06/2027</span> (<span id="field-duree_totale">6 mois</span>)</div>
                </div>
                
                <div class="stage-date-lieu">Fait à <span id="field-ville">Brazzaville</span>, le <span id="field-date">04 octobre 2026</span></div>
                
                <div class="stage-tripartite">
                    <div class="stage-partie">
                        <div class="stage-partie-title">L'Entreprise</div>
                        <div class="stage-partie-info">
                            <span class="stage-info" id="field-entreprise_nom2">ENTREPRISE XYZ</span><br>
                            Représentée par <span class="stage-info" id="field-employeur_nom">Monsieur le Directeur</span><br>
                            <span class="stage-info" id="field-entreprise_siege">123 Avenue de l'Indépendance</span>
                        </div>
                    </div>
                    
                    <div class="stage-partie">
                        <div class="stage-partie-title">L'École</div>
                        <div class="stage-partie-info">
                            <span class="stage-info" id="field-ecole_nom">Université Marien Ngouabi</span><br>
                            Représentée par <span class="stage-info" id="field-ecole_representant">Monsieur le Doyen</span><br>
                            <span class="stage-info" id="field-ecole_adresse">Brazzaville, Congo</span>
                        </div>
                    </div>
                    
                    <div class="stage-partie">
                        <div class="stage-partie-title">Le Stagiaire</div>
                        <div class="stage-partie-info">
                            <span class="stage-info" id="field-stagiaire_nom">Meurphy TALAMIO</span><br>
                            Né(e) le <span class="stage-info" id="field-stagiaire_naissance">01/01/2000</span><br>
                            <span class="stage-info" id="field-stagiaire_formation">Master Management</span>
                        </div>
                    </div>
                </div>
                
                <div class="stage-article">
                    <div class="stage-article-title">Article 1 - Objet de la convention</div>
                    <div class="stage-article-content">
                        <p>La présente convention a pour objet de définir les conditions dans lesquelles <span class="stage-info" id="field-stagiaire_nom2">Meurphy TALAMIO</span> effectuera un stage au sein de la société <span class="stage-info" id="field-entreprise_nom3">ENTREPRISE XYZ</span>.</p>
                    </div>
                </div>
                
                <div class="stage-objectifs">
                    <div class="stage-objectifs-title">Objectifs du stage</div>
                    <ul class="stage-objectifs-list">
                        <li id="field-objectif1">Découverte du monde professionnel</li>
                        <li id="field-objectif2">Mise en pratique des connaissances acquises</li>
                        <li id="field-objectif3">Développement de compétences spécifiques</li>
                    </ul>
                </div>
                
                <div class="stage-article">
                    <div class="stage-article-title">Article 2 - Missions confiées</div>
                    <div class="stage-article-content">
                        <p>Le stagiaire se verra confier les missions suivantes : <span class="stage-info" id="field-missions">Assistance à la gestion de projet, analyse de données, rédaction de rapports</span>.</p>
                        <p>Il/Elle sera placé(e) sous la responsabilité de <span class="stage-info" id="field-tuteur_nom">Monsieur le Chef de Département</span>, agissant en qualité de tuteur.</p>
                    </div>
                </div>
                
                <div class="stage-article">
                    <div class="stage-article-title">Article 3 - Durée et horaires</div>
                    <div class="stage-article-content">
                        <p>Le stage se déroulera sur une période de <span class="stage-info" id="field-duree_hebdomadaire">35 heures</span> par semaine, du lundi au vendredi.</p>
                    </div>
                </div>
                
                <div class="stage-article">
                    <div class="stage-article-title">Article 4 - Gratification</div>
                    <div class="stage-article-content">
                        <p>Le stagiaire percevra une gratification mensuelle de <span class="stage-info" id="field-gratification">150 000 FCFA</span>.</p>
                    </div>
                </div>
                
                <div class="stage-article">
                    <div class="stage-article-title">Article 5 - Évaluation</div>
                    <div class="stage-article-content">
                        <p>Une évaluation du stage sera réalisée par le tuteur en fin de stage. Un rapport de stage devra être remis par le stagiaire à l'issue de la période.</p>
                    </div>
                </div>
                
                <div class="stage-signatures">
                    <div class="stage-signature-block">
                        <div class="stage-signature-label">L'Entreprise</div>
                        <div class="stage-signature-line" id="field-employeur_nom2">Monsieur le Directeur</div>
                    </div>
                    <div class="stage-signature-block">
                        <div class="stage-signature-label">L'École</div>
                        <div class="stage-signature-line" id="field-ecole_representant2">Monsieur le Doyen</div>
                    </div>
                    <div class="stage-signature-block">
                        <div class="stage-signature-label">Le Stagiaire</div>
                        <div class="stage-signature-line" id="field-stagiaire_nom2">Meurphy TALAMIO</div>
                    </div>
                </div>
                
                <div class="stage-footer">Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com</div>
            </div>
        `
    };
}

// --- DOCUMENT 13 : Devis de Prestation ---
export function getTemplate_Devis_Prestation() {
    return {
        id: 'devis_prestation',
        name: 'Devis de Prestation',
        category: 'commercial',
        price: 1200,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Devis professionnel pour freelances et entreprises.',
        cssStyles: `
            .devis-container { width: 210mm; min-height: 297mm; background: white; padding: 50px 60px; font-family: 'Inter', sans-serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .devis-header { display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .devis-entreprise { flex: 1; }
            .devis-entreprise-nom { font-size: 1.8rem; font-weight: 800; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; }
            .devis-entreprise-info { font-size: 0.9rem; color: #64748b; line-height: 1.6; }
            .devis-client { flex: 1; text-align: right; }
            .devis-client-label { font-size: 0.85rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 600; }
            .devis-client-nom { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 5px; }
            .devis-client-info { font-size: 0.9rem; color: #475569; line-height: 1.5; }
            .devis-titre-box { background: var(--doc-primary-color, #0F172A); color: white; padding: 20px 30px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .devis-titre { font-size: 1.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
            .devis-numero { font-size: 1rem; font-weight: 600; }
            .devis-dates { display: flex; gap: 30px; margin-bottom: 30px; padding: 15px; background: #f8fafc; border-radius: 8px; }
            .devis-date-item { flex: 1; }
            .devis-date-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
            .devis-date-value { font-size: 1rem; font-weight: 600; color: #0f172a; }
            .devis-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .devis-table th { background: var(--doc-primary-color, #0F172A); color: white; padding: 12px 15px; text-align: left; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; }
            .devis-table td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 0.95rem; }
            .devis-table tr:nth-child(even) { background: #f8fafc; }
            .devis-table .col-designation { width: 50%; }
            .devis-table .col-qty { width: 10%; text-align: center; }
            .devis-table .col-price { width: 20%; text-align: right; }
            .devis-table .col-total { width: 20%; text-align: right; font-weight: 600; }
            .devis-totaux { display: flex; justify-content: flex-end; margin-bottom: 30px; }
            .devis-totaux-box { width: 300px; }
            .devis-total-row { display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; }
            .devis-total-row.final { background: var(--doc-primary-color, #0F172A); color: white; font-size: 1.2rem; font-weight: 700; border-radius: 4px; }
            .devis-conditions { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; font-size: 0.9rem; }
            .devis-conditions-title { font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; }
            .devis-conditions-text { color: #475569; line-height: 1.6; }
            .devis-footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #94a3b8; }
        `,
        htmlStructure: `
            <div class="devis-container">
                <header class="devis-header">
                    <div class="devis-entreprise">
                        <div class="devis-entreprise-nom" id="field-entreprise_nom">ENTREPRISE XYZ</div>
                        <div class="devis-entreprise-info">
                            <div id="field-entreprise_adresse">123 Avenue de l'Indépendance, Brazzaville</div>
                            <div>Tél: <span id="field-entreprise_telephone">+242 06 000 00 00</span></div>
                            <div>Email: <span id="field-entreprise_email">contact@entreprise.com</span></div>
                        </div>
                    </div>
                    <div class="devis-client">
                        <div class="devis-client-label">Client</div>
                        <div class="devis-client-nom" id="field-client_nom">Monsieur le Client</div>
                        <div class="devis-client-info">
                            <div id="field-client_adresse">Adresse du client</div>
                            <div>Tél: <span id="field-client_telephone">+242 06 000 00 00</span></div>
                            <div>Email: <span id="field-client_email">client@email.com</span></div>
                        </div>
                    </div>
                </header>
                
                <div class="devis-titre-box">
                    <div class="devis-titre">DEVIS</div>
                    <div class="devis-numero">N° <span id="field-devis_numero">DEV-2026-001</span></div>
                </div>
                
                <div class="devis-dates">
                    <div class="devis-date-item">
                        <div class="devis-date-label">Date d'émission</div>
                        <div class="devis-date-value" id="field-date_emission">04/10/2026</div>
                    </div>
                    <div class="devis-date-item">
                        <div class="devis-date-label">Validité</div>
                        <div class="devis-date-value" id="field-date_validite">30 jours</div>
                    </div>
                </div>
                
                <table class="devis-table">
                    <thead>
                        <tr>
                            <th class="col-designation">Désignation</th>
                            <th class="col-qty">Qté</th>
                            <th class="col-price">Prix unitaire</th>
                            <th class="col-total">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td id="field-prestation1_nom">Prestation 1 - Description détaillée</td>
                            <td class="col-qty" id="field-prestation1_qty">1</td>
                            <td class="col-price" id="field-prestation1_prix">500 000 FCFA</td>
                            <td class="col-total" id="field-prestation1_total">500 000 FCFA</td>
                        </tr>
                        <tr>
                            <td id="field-prestation2_nom">Prestation 2 - Description détaillée</td>
                            <td class="col-qty" id="field-prestation2_qty">2</td>
                            <td class="col-price" id="field-prestation2_prix">300 000 FCFA</td>
                            <td class="col-total" id="field-prestation2_total">600 000 FCFA</td>
                        </tr>
                        <tr>
                            <td id="field-prestation3_nom">Prestation 3 - Description détaillée</td>
                            <td class="col-qty" id="field-prestation3_qty">1</td>
                            <td class="col-price" id="field-prestation3_prix">200 000 FCFA</td>
                            <td class="col-total" id="field-prestation3_total">200 000 FCFA</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="devis-totaux">
                    <div class="devis-totaux-box">
                        <div class="devis-total-row">
                            <span>Total HT</span>
                            <span id="field-total_ht">1 300 000 FCFA</span>
                        </div>
                        <div class="devis-total-row">
                            <span>TVA (18%)</span>
                            <span id="field-tva">234 000 FCFA</span>
                        </div>
                        <div class="devis-total-row final">
                            <span>TOTAL TTC</span>
                            <span id="field-total_ttc">1 534 000 FCFA</span>
                        </div>
                    </div>
                </div>
                
                <div class="devis-conditions">
                    <div class="devis-conditions-title">Conditions</div>
                    <div class="devis-conditions-text" id="field-conditions">
                        Mode de paiement : 50% à la commande, 50% à la livraison. Délai de réalisation : 30 jours. Ce devis est valable 30 jours à compter de sa date d'émission.
                    </div>
                </div>
                
                <div class="devis-footer">
                    Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com
                </div>
            </div>
        `
    };
}

// --- DOCUMENT 14 : Facture Simple ---
export function getTemplate_Facture_Simple() {
    return {
        id: 'facture_simple',
        name: 'Facture Simple',
        category: 'commercial',
        price: 1200,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Facture conforme aux normes commerciales.',
        cssStyles: `
            .facture-container { width: 210mm; min-height: 297mm; background: white; padding: 50px 60px; font-family: 'Inter', sans-serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .facture-header { display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .facture-entreprise-nom { font-size: 1.8rem; font-weight: 800; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; }
            .facture-entreprise-info { font-size: 0.9rem; color: #64748b; line-height: 1.6; }
            .facture-client-box { text-align: right; }
            .facture-client-label { font-size: 0.85rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 600; }
            .facture-client-nom { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 5px; }
            .facture-client-info { font-size: 0.9rem; color: #475569; line-height: 1.5; }
            .facture-titre-box { background: var(--doc-primary-color, #0F172A); color: white; padding: 20px 30px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .facture-titre { font-size: 1.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
            .facture-numero { font-size: 1rem; font-weight: 600; }
            .facture-dates { display: flex; gap: 30px; margin-bottom: 30px; padding: 15px; background: #f8fafc; border-radius: 8px; }
            .facture-date-item { flex: 1; }
            .facture-date-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
            .facture-date-value { font-size: 1rem; font-weight: 600; color: #0f172a; }
            .facture-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .facture-table th { background: var(--doc-primary-color, #0F172A); color: white; padding: 12px 15px; text-align: left; font-size: 0.9rem; text-transform: uppercase; }
            .facture-table td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 0.95rem; }
            .facture-table tr:nth-child(even) { background: #f8fafc; }
            .facture-totaux { display: flex; justify-content: flex-end; margin-bottom: 30px; }
            .facture-totaux-box { width: 300px; }
            .facture-total-row { display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; }
            .facture-total-row.final { background: var(--doc-primary-color, #0F172A); color: white; font-size: 1.2rem; font-weight: 700; border-radius: 4px; }
            .facture-paiement { background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .facture-paiement-title { font-weight: 700; color: #065f46; margin-bottom: 10px; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; }
            .facture-paiement-info { color: #065f46; line-height: 1.6; }
            .facture-footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #94a3b8; }
        `,
        htmlStructure: `
            <div class="facture-container">
                <header class="facture-header">
                    <div>
                        <div class="facture-entreprise-nom" id="field-entreprise_nom">ENTREPRISE XYZ</div>
                        <div class="facture-entreprise-info">
                            <div id="field-entreprise_adresse">123 Avenue de l'Indépendance, Brazzaville</div>
                            <div>Tél: <span id="field-entreprise_telephone">+242 06 000 00 00</span></div>
                            <div>Email: <span id="field-entreprise_email">contact@entreprise.com</span></div>
                            <div>NIF: <span id="field-entreprise_nif">123456789</span></div>
                        </div>
                    </div>
                    <div class="facture-client-box">
                        <div class="facture-client-label">Facturé à</div>
                        <div class="facture-client-nom" id="field-client_nom">Monsieur le Client</div>
                        <div class="facture-client-info">
                            <div id="field-client_adresse">Adresse du client</div>
                            <div>Tél: <span id="field-client_telephone">+242 06 000 00 00</span></div>
                            <div>Email: <span id="field-client_email">client@email.com</span></div>
                        </div>
                    </div>
                </header>
                
                <div class="facture-titre-box">
                    <div class="facture-titre">FACTURE</div>
                    <div class="facture-numero">N° <span id="field-facture_numero">FAC-2026-001</span></div>
                </div>
                
                <div class="facture-dates">
                    <div class="facture-date-item">
                        <div class="facture-date-label">Date d'émission</div>
                        <div class="facture-date-value" id="field-date_emission">04/10/2026</div>
                    </div>
                    <div class="facture-date-item">
                        <div class="facture-date-label">Date d'échéance</div>
                        <div class="facture-date-value" id="field-date_echeance">04/11/2026</div>
                    </div>
                </div>
                
                <table class="facture-table">
                    <thead>
                        <tr>
                            <th style="width: 50%">Désignation</th>
                            <th style="width: 10%">Qté</th>
                            <th style="width: 20%">Prix unitaire</th>
                            <th style="width: 20%">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td id="field-article1_nom">Article 1 - Description</td>
                            <td id="field-article1_qty">1</td>
                            <td id="field-article1_prix">500 000 FCFA</td>
                            <td id="field-article1_total">500 000 FCFA</td>
                        </tr>
                        <tr>
                            <td id="field-article2_nom">Article 2 - Description</td>
                            <td id="field-article2_qty">2</td>
                            <td id="field-article2_prix">300 000 FCFA</td>
                            <td id="field-article2_total">600 000 FCFA</td>
                        </tr>
                        <tr>
                            <td id="field-article3_nom">Article 3 - Description</td>
                            <td id="field-article3_qty">1</td>
                            <td id="field-article3_prix">200 000 FCFA</td>
                            <td id="field-article3_total">200 000 FCFA</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="facture-totaux">
                    <div class="facture-totaux-box">
                        <div class="facture-total-row">
                            <span>Total HT</span>
                            <span id="field-total_ht">1 300 000 FCFA</span>
                        </div>
                        <div class="facture-total-row">
                            <span>TVA (18%)</span>
                            <span id="field-tva">234 000 FCFA</span>
                        </div>
                        <div class="facture-total-row final">
                            <span>TOTAL TTC</span>
                            <span id="field-total_ttc">1 534 000 FCFA</span>
                        </div>
                    </div>
                </div>
                
                <div class="facture-paiement">
                    <div class="facture-paiement-title">Informations de paiement</div>
                    <div class="facture-paiement-info" id="field-info_paiement">
                        Mode de paiement : Virement bancaire ou Mobile Money. Compte : 1234567890. Banque : BICICI.
                    </div>
                </div>
                
                <div class="facture-footer">
                    Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com
                </div>
            </div>
        `
    };
}

// --- DOCUMENT 15 : Attestation de Résidence ---
export function getTemplate_Attestation_Residence() {
    return {
        id: 'attestation_residence',
        name: 'Attestation de Résidence',
        category: 'attestation',
        price: 800,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Justificatif de domicile officiel.',
        cssStyles: `
            .att-res-container { width: 210mm; min-height: 297mm; background: white; padding: 60px 70px; font-family: 'Times New Roman', 'Georgia', serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); line-height: 1.8; }
            .att-res-header { text-align: center; margin-bottom: 50px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .att-res-republique { font-size: 1rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; }
            .att-res-devise { font-size: 0.9rem; font-style: italic; color: #64748b; margin-bottom: 15px; }
            .att-res-mairie { font-size: 1.3rem; font-weight: 700; color: #0f172a; }
            .att-res-titre { text-align: center; font-size: 2rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 3px; margin: 40px 0; text-decoration: underline; text-underline-offset: 8px; }
            .att-res-corps { font-size: 1.1rem; line-height: 2; text-align: justify; margin-bottom: 30px; }
            .att-res-corps p { margin-bottom: 20px; text-indent: 40px; }
            .att-res-info { font-weight: 700; color: var(--doc-primary-color, #0F172A); }
            .att-res-box { background: #f8fafc; border-left: 4px solid var(--doc-primary-color, #0F172A); padding: 20px; margin: 30px 0; }
            .att-res-box-title { font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px; }
            .att-res-box-content { font-size: 1rem; line-height: 1.8; }
            .att-res-date-lieu { text-align: right; font-size: 1.05rem; margin: 40px 0; font-style: italic; }
            .att-res-signature { margin-top: 60px; text-align: right; }
            .att-res-signature-label { font-size: 1rem; color: #64748b; margin-bottom: 80px; }
            .att-res-signature-nom { font-size: 1.1rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); border-top: 2px solid var(--doc-primary-color, #0F172A); display: inline-block; padding-top: 10px; min-width: 200px; }
            .att-res-signature-fonction { font-size: 0.95rem; color: #64748b; margin-top: 5px; }
            .att-res-footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.85rem; color: #94a3b8; font-style: italic; }
        `,
        htmlStructure: `
            <div class="att-res-container">
                <header class="att-res-header">
                    <div class="att-res-republique">République du Congo</div>
                    <div class="att-res-devise">Unité - Travail - Progrès</div>
                    <div class="att-res-mairie" id="field-mairie_nom">Mairie de Brazzaville</div>
                </header>
                
                <h1 class="att-res-titre">Attestation de Résidence</h1>
                
                <div class="att-res-corps">
                    <p>Je soussigné(e), <span class="att-res-info" id="field-signataire_nom">Monsieur le Maire</span>, agissant en qualité de <span class="att-res-info" id="field-signataire_fonction">Maire de la commune de Brazzaville</span>,</p>
                    
                    <p>Certifie par la présente que <span class="att-res-info" id="field-resident_nom">Meurphy TALAMIO</span>, né(e) le <span class="att-res-info" id="field-resident_naissance">01/01/1990</span> à <span class="att-res-info" id="field-resident_lieu_naissance">Brazzaville</span>, titulaire de la CNI n° <span class="att-res-info" id="field-resident_cni">123456789</span>,</p>
                    
                    <p>Demeure effectivement au <span class="att-res-info" id="field-resident_adresse">123 Quartier Poto-Poto, Brazzaville</span> depuis le <span class="att-res-info" id="field-resident_date_arrivee">01/01/2020</span>, soit depuis <span class="att-res-info" id="field-resident_duree">6 ans</span>.</p>
                </div>
                
                <div class="att-res-box">
                    <div class="att-res-box-title">Informations complémentaires</div>
                    <div class="att-res-box-content">
                        <div><strong>Quartier :</strong> <span id="field-quartier">Poto-Poto</span></div>
                        <div><strong>Arrondissement :</strong> <span id="field-arrondissement">3ème</span></div>
                        <div><strong>Téléphone de contact :</strong> <span id="field-telephone_contact">+242 06 518 69 67</span></div>
                    </div>
                </div>
                
                <div class="att-res-corps">
                    <p>Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit, notamment pour ses démarches administratives.</p>
                </div>
                
                <div class="att-res-date-lieu">Fait à <span id="field-ville">Brazzaville</span>, le <span id="field-date">04 octobre 2026</span></div>
                
                <div class="att-res-signature">
                    <div class="att-res-signature-label">Le Maire</div>
                    <div class="att-res-signature-nom" id="field-signataire_nom2">Monsieur le Maire</div>
                    <div class="att-res-signature-fonction" id="field-signataire_fonction2">Maire de la commune</div>
                </div>
                
                <div class="att-res-footer">Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com</div>
            </div>
        `
    };
}

// ============================================
// REGISTRE CENTRAL MIS À JOUR
// ============================================
export const templatesRegistry = [
    getTemplate_CV_Executif_Moderne(),
    getTemplate_CV_Classique_Francais(),
    getTemplate_Attestation_Travail(),
    getTemplate_CV_Etudiant_Stage(),
    getTemplate_CV_Creatif_Design(),
    getTemplate_Lettre_Motivation_Stage(),
    getTemplate_Lettre_Motivation_Classique(),
    getTemplate_CV_Ingenieur_Tech(),
    getTemplate_Lettre_Recommandation(),
    getTemplate_Attestation_Salaire(),
    getTemplate_Contrat_CDI(),
    getTemplate_Contrat_CDD(),
    getTemplate_Contrat_Stage(),
    getTemplate_Devis_Prestation(),              // ← AJOUTÉ
    getTemplate_Facture_Simple(),                // ← AJOUTÉ
    getTemplate_Attestation_Residence()          // ← AJOUTÉ
];