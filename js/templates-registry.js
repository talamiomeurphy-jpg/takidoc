// ============================================
// TAKIDOC - REGISTRE DES DOCUMENTS (ARCHITECTURE DATA-DRIVEN)
// Règle : Chaque document décrit ses propres champs.
// L'équipe Meurphy - 2026
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
        
        // Configuration des champs pour l'éditeur générique
        fields: [
            { name: 'nom', label: 'Nom complet', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'poste', label: 'Poste visé / Titre actuel', type: 'text', default: 'Directeur Général' },
            { name: 'email', label: 'Adresse email', type: 'email', default: 'brazzamarket.infos@gmail.com' },
            { name: 'telephone', label: 'Numéro de téléphone', type: 'tel', default: '+242 06 518 69 67' },
            { name: 'adresse', label: 'Ville et Pays', type: 'text', default: 'Brazzaville, Congo' },
            { name: 'profil', label: 'Profil professionnel (Résumé)', type: 'textarea', default: 'Professionnel expérimenté avec plus de 10 ans d\'expérience dans mon domaine. Passionné par l\'innovation et la recherche de l\'excellence. Je cherche à mettre mes compétences au service d\'une entreprise dynamique.' },
            { name: 'exp1_titre', label: 'Expérience 1 : Titre du poste', type: 'text', default: 'Directeur Général' },
            { name: 'exp1_date', label: 'Expérience 1 : Période', type: 'text', default: '2020 - Présent' },
            { name: 'exp1_entreprise', label: 'Expérience 1 : Entreprise', type: 'text', default: 'Entreprise XYZ - Brazzaville' },
            { name: 'exp1_desc', label: 'Expérience 1 : Description', type: 'textarea', default: 'Direction stratégique de l\'entreprise. Management d\'une équipe de 50 personnes. Augmentation du chiffre d\'affaires de 30% en 2 ans.' },
            { name: 'exp2_titre', label: 'Expérience 2 : Titre du poste', type: 'text', default: 'Chef de Projet Senior' },
            { name: 'exp2_date', label: 'Expérience 2 : Période', type: 'text', default: '2015 - 2020' },
            { name: 'exp2_entreprise', label: 'Expérience 2 : Entreprise', type: 'text', default: 'Société ABC - Pointe-Noire' },
            { name: 'exp2_desc', label: 'Expérience 2 : Description', type: 'textarea', default: 'Gestion de projets majeurs. Coordination avec les parties prenantes. Livraison de 15 projets dans les délais et budgets impartis.' },
            { name: 'form1_diplome', label: 'Formation 1 : Diplôme', type: 'text', default: 'Master en Management' },
            { name: 'form1_ecole', label: 'Formation 1 : École', type: 'text', default: 'Université Marien Ngouabi' },
            { name: 'form1_date', label: 'Formation 1 : Période', type: 'text', default: '2013 - 2015' },
            { name: 'form2_diplome', label: 'Formation 2 : Diplôme', type: 'text', default: 'Licence en Gestion' },
            { name: 'form2_ecole', label: 'Formation 2 : École', type: 'text', default: 'Université de Brazzaville' },
            { name: 'form2_date', label: 'Formation 2 : Période', type: 'text', default: '2010 - 2013' },
            { name: 'skill1_name', label: 'Compétence 1', type: 'text', default: 'Gestion de projet' },
            { name: 'skill2_name', label: 'Compétence 2', type: 'text', default: 'Leadership' },
            { name: 'skill3_name', label: 'Compétence 3', type: 'text', default: 'Communication' },
            { name: 'skill4_name', label: 'Compétence 4', type: 'text', default: 'Analyse stratégique' },
            { name: 'lang1_name', label: 'Langue 1', type: 'text', default: 'Français' },
            { name: 'lang1_level', label: 'Niveau Langue 1', type: 'text', default: 'Courant' },
            { name: 'lang2_name', label: 'Langue 2', type: 'text', default: 'Anglais' },
            { name: 'lang2_level', label: 'Niveau Langue 2', type: 'text', default: 'Professionnel' },
            { name: 'interets', label: 'Centres d\'intérêt', type: 'text', default: 'Lecture, Voyages, Technologie, Sport' }
        ],

        cssStyles: `
            .cv-exec-container { width: 210mm; min-height: 297mm; background: white; font-family: 'Inter', 'Segoe UI', sans-serif; display: grid; grid-template-columns: 35% 65%; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .cv-sidebar { background: var(--doc-primary-color, #0F172A); color: white; padding: 40px 25px; }
            .cv-photo { width: 140px; height: 140px; border-radius: 50%; background: rgba(255,255,255,0.2); margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 4px solid rgba(255,255,255,0.3); }
            .cv-photo img { width: 100%; height: 100%; object-fit: cover; }
            .cv-photo-placeholder { color: rgba(255,255,255,0.6); font-size: 0.9rem; }
            .cv-sidebar-section { margin-bottom: 30px; }
            .cv-sidebar-title { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid rgba(255,255,255,0.3); }
            .cv-contact-item { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 0.9rem; word-break: break-word; }
            .cv-contact-icon { width: 20px; text-align: center; flex-shrink: 0; }
            .cv-skill-item { margin-bottom: 12px; }
            .cv-skill-name { font-size: 0.9rem; margin-bottom: 5px; }
            .cv-skill-bar { height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden; }
            .cv-skill-level { height: 100%; background: white; border-radius: 3px; }
            .cv-lang-item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem; }
            .cv-lang-level { opacity: 0.8; font-size: 0.85rem; }
            .cv-main { padding: 40px 35px; color: #1e293b; }
            .cv-header-name { font-size: 2.2rem; font-weight: 800; color: var(--doc-primary-color, #0F172A); margin-bottom: 5px; line-height: 1.1; }
            .cv-header-title { font-size: 1.1rem; color: #64748b; font-weight: 500; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .cv-main-section { margin-bottom: 28px; }
            .cv-main-title { font-size: 1.1rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
            .cv-main-title::before { content: ''; width: 4px; height: 20px; background: var(--doc-primary-color, #0F172A); border-radius: 2px; }
            .cv-profile-text { font-size: 0.95rem; line-height: 1.6; color: #475569; }
            .cv-experience-item { margin-bottom: 20px; padding-left: 15px; border-left: 2px solid #e2e8f0; }
            .cv-experience-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; flex-wrap: wrap; }
            .cv-experience-title { font-weight: 700; font-size: 1rem; color: #0f172a; }
            .cv-experience-date { font-size: 0.85rem; color: #64748b; font-style: italic; }
            .cv-experience-company { font-size: 0.9rem; color: var(--doc-primary-color, #0F172A); font-weight: 600; margin-bottom: 8px; }
            .cv-experience-desc { font-size: 0.9rem; color: #475569; line-height: 1.5; }
            .cv-education-item { margin-bottom: 15px; }
            .cv-education-degree { font-weight: 700; font-size: 1rem; color: #0f172a; }
            .cv-education-school { font-size: 0.9rem; color: var(--doc-primary-color, #0F172A); font-weight: 600; }
            .cv-education-date { font-size: 0.85rem; color: #64748b; }
        `,
        
        htmlStructure: `
            <div class="cv-exec-container">
                <aside class="cv-sidebar">
                    <div class="cv-photo" id="doc-photo"><span class="cv-photo-placeholder">Photo</span></div>
                    <div class="cv-sidebar-section">
                        <div class="cv-sidebar-title">Contact</div>
                        <div class="cv-contact-item"><span class="cv-contact-icon">✉</span><span id="field-email">email@exemple.com</span></div>
                        <div class="cv-contact-item"><span class="cv-contact-icon">☎</span><span id="field-telephone">+242 06 000 00 00</span></div>
                        <div class="cv-contact-item"><span class="cv-contact-icon">⌖</span><span id="field-adresse">Brazzaville, Congo</span></div>
                    </div>
                    <div class="cv-sidebar-section">
                        <div class="cv-sidebar-title">Compétences</div>
                        <div class="cv-skill-item"><div class="cv-skill-name" id="field-skill1_name">Gestion de projet</div><div class="cv-skill-bar"><div class="cv-skill-level" style="width: 90%"></div></div></div>
                        <div class="cv-skill-item"><div class="cv-skill-name" id="field-skill2_name">Leadership</div><div class="cv-skill-bar"><div class="cv-skill-level" style="width: 85%"></div></div></div>
                        <div class="cv-skill-item"><div class="cv-skill-name" id="field-skill3_name">Communication</div><div class="cv-skill-bar"><div class="cv-skill-level" style="width: 80%"></div></div></div>
                        <div class="cv-skill-item"><div class="cv-skill-name" id="field-skill4_name">Analyse stratégique</div><div class="cv-skill-bar"><div class="cv-skill-level" style="width: 75%"></div></div></div>
                    </div>
                    <div class="cv-sidebar-section">
                        <div class="cv-sidebar-title">Langues</div>
                        <div class="cv-lang-item"><span id="field-lang1_name">Français</span><span class="cv-lang-level" id="field-lang1_level">Courant</span></div>
                        <div class="cv-lang-item"><span id="field-lang2_name">Anglais</span><span class="cv-lang-level" id="field-lang2_level">Professionnel</span></div>
                    </div>
                    <div class="cv-sidebar-section">
                        <div class="cv-sidebar-title">Centres d'intérêt</div>
                        <div style="font-size: 0.9rem; line-height: 1.6;"><span id="field-interets">Lecture, Voyages, Technologie, Sport</span></div>
                    </div>
                </aside>
                <main class="cv-main">
                    <div class="cv-header">
                        <h1 class="cv-header-name" id="field-nom">PRÉNOM NOM</h1>
                        <div class="cv-header-title" id="field-poste">Poste visé / Titre professionnel</div>
                    </div>
                    <div class="cv-main-section">
                        <div class="cv-main-title">Profil</div>
                        <p class="cv-profile-text" id="field-profil">Professionnel expérimenté avec plus de 10 ans d'expérience dans mon domaine. Passionné par l'innovation et la recherche de l'excellence. Je cherche à mettre mes compétences au service d'une entreprise dynamique.</p>
                    </div>
                    <div class="cv-main-section">
                        <div class="cv-main-title">Expériences professionnelles</div>
                        <div class="cv-experience-item">
                            <div class="cv-experience-header">
                                <div class="cv-experience-title" id="field-exp1_titre">Directeur Général</div>
                                <div class="cv-experience-date" id="field-exp1_date">2020 - Présent</div>
                            </div>
                            <div class="cv-experience-company" id="field-exp1_entreprise">Entreprise XYZ - Brazzaville</div>
                            <div class="cv-experience-desc" id="field-exp1_desc">Direction stratégique de l'entreprise. Management d'une équipe de 50 personnes. Augmentation du chiffre d'affaires de 30% en 2 ans.</div>
                        </div>
                        <div class="cv-experience-item">
                            <div class="cv-experience-header">
                                <div class="cv-experience-title" id="field-exp2_titre">Chef de Projet Senior</div>
                                <div class="cv-experience-date" id="field-exp2_date">2015 - 2020</div>
                            </div>
                            <div class="cv-experience-company" id="field-exp2_entreprise">Société ABC - Pointe-Noire</div>
                            <div class="cv-experience-desc" id="field-exp2_desc">Gestion de projets majeurs. Coordination avec les parties prenantes. Livraison de 15 projets dans les délais et budgets impartis.</div>
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
        
        fields: [
            { name: 'expediteur_nom', label: 'Votre nom complet', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'expediteur_adresse', label: 'Votre adresse', type: 'text', default: '123 Quartier Poto-Poto, Brazzaville' },
            { name: 'expediteur_telephone', label: 'Votre téléphone', type: 'tel', default: '+242 06 518 69 67' },
            { name: 'expediteur_email', label: 'Votre email', type: 'email', default: 'brazzamarket.infos@gmail.com' },
            { name: 'destinataire_nom', label: 'Nom du destinataire', type: 'text', default: 'Monsieur le Responsable RH' },
            { name: 'destinataire_fonction', label: 'Fonction du destinataire', type: 'text', default: 'Responsable des Stages' },
            { name: 'destinataire_entreprise', label: 'Entreprise du destinataire', type: 'text', default: 'Entreprise Cible' },
            { name: 'destinataire_adresse', label: 'Adresse de l\'entreprise', type: 'text', default: 'Brazzaville, Congo' },
            { name: 'date_lieu', label: 'Ville', type: 'text', default: 'Brazzaville' },
            { name: 'date_jour', label: 'Date', type: 'text', default: '04 octobre 2026' },
            { name: 'objet', label: 'Objet de la lettre', type: 'text', default: 'Candidature au poste de Directeur Marketing' },
            { name: 'paragraphe1', label: 'Formule d\'appel', type: 'text', default: 'Madame, Monsieur,' },
            { name: 'paragraphe2', label: 'Paragraphe 1 : Introduction', type: 'textarea', default: 'Par la présente, je me permets de vous adresser ma candidature pour le poste mentionné ci-dessus. Fort d\'une expérience solide dans mon domaine, je suis convaincu de pouvoir apporter une contribution significative à votre entreprise.' },
            { name: 'paragraphe3', label: 'Paragraphe 2 : Vos atouts', type: 'textarea', default: 'Au cours de mon parcours professionnel, j\'ai développé des compétences clés qui correspondent parfaitement aux exigences de ce poste. Mon sens de l\'initiative, ma capacité d\'adaptation et mon esprit d\'équipe sont des atouts que je souhaite mettre à votre disposition.' },
            { name: 'paragraphe4', label: 'Paragraphe 3 : Conclusion et appel à l\'action', type: 'textarea', default: 'Je serais honoré de pouvoir vous exposer plus en détail mes motivations lors d\'un entretien. Dans l\'attente de votre réponse, je vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.' },
            { name: 'signature', label: 'Votre signature (Nom)', type: 'text', default: 'Meurphy TALAMIO' }
        ],

        cssStyles: `
            .lettre-container { width: 210mm; min-height: 297mm; background: white; padding: 50px 60px; font-family: 'Georgia', 'Times New Roman', serif; color: #1e293b; line-height: 1.6; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .lettre-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .lettre-expediteur { font-size: 0.95rem; line-height: 1.5; }
            .lettre-destinataire { text-align: right; font-size: 0.95rem; line-height: 1.5; }
            .lettre-date { text-align: right; margin-bottom: 30px; font-style: italic; color: #64748b; }
            .lettre-objet { font-weight: 700; margin-bottom: 25px; color: var(--doc-primary-color, #0F172A); font-size: 1.05rem; }
            .lettre-corps { margin-bottom: 25px; text-align: justify; font-size: 1rem; }
            .lettre-formule { margin-top: 30px; font-style: italic; }
            .lettre-signature { margin-top: 40px; text-align: right; font-weight: 600; }
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
                <div class="lettre-date"><span id="field-date_lieu">Brazzaville</span>, le <span id="field-date_jour">04 octobre 2026</span></div>
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

// --- DOCUMENT 3 : CV Classique Français ---
export function getTemplate_CV_Classique_Francais() {
    return {
        id: 'cv_classique_francais',
        name: 'CV Classique Français',
        category: 'cv',
        price: 1200,
        hasPhoto: true,
        hasColorPicker: true,
        description: 'Format traditionnel apprécié des recruteurs français et administrations.',
        
        fields: [
            { name: 'nom', label: 'Nom complet', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'poste', label: 'Titre du poste', type: 'text', default: 'Directeur Général' },
            { name: 'email', label: 'Adresse email', type: 'email', default: 'brazzamarket.infos@gmail.com' },
            { name: 'telephone', label: 'Numéro de téléphone', type: 'tel', default: '+242 06 518 69 67' },
            { name: 'adresse', label: 'Ville et Pays', type: 'text', default: 'Brazzaville, Congo' },
            { name: 'profil', label: 'Profil professionnel', type: 'textarea', default: 'Professionnel expérimenté avec plus de 10 ans d\'expérience dans mon domaine. Passionné par l\'innovation et la recherche de l\'excellence.' },
            { name: 'exp1_titre', label: 'Expérience 1 : Titre', type: 'text', default: 'Directeur Général' },
            { name: 'exp1_date', label: 'Expérience 1 : Dates', type: 'text', default: '2020 - Présent' },
            { name: 'exp1_entreprise', label: 'Expérience 1 : Entreprise', type: 'text', default: 'Entreprise XYZ - Brazzaville' },
            { name: 'exp1_desc', label: 'Expérience 1 : Description', type: 'textarea', default: 'Direction stratégique de l\'entreprise. Management d\'une équipe de 50 personnes.' },
            { name: 'exp2_titre', label: 'Expérience 2 : Titre', type: 'text', default: 'Chef de Projet Senior' },
            { name: 'exp2_date', label: 'Expérience 2 : Dates', type: 'text', default: '2015 - 2020' },
            { name: 'exp2_entreprise', label: 'Expérience 2 : Entreprise', type: 'text', default: 'Société ABC - Pointe-Noire' },
            { name: 'exp2_desc', label: 'Expérience 2 : Description', type: 'textarea', default: 'Gestion de projets majeurs. Coordination avec les parties prenantes.' },
            { name: 'form1_diplome', label: 'Formation 1 : Diplôme', type: 'text', default: 'Master en Management' },
            { name: 'form1_ecole', label: 'Formation 1 : École', type: 'text', default: 'Université Marien Ngouabi' },
            { name: 'form1_date', label: 'Formation 1 : Dates', type: 'text', default: '2013 - 2015' },
            { name: 'form2_diplome', label: 'Formation 2 : Diplôme', type: 'text', default: 'Licence en Gestion' },
            { name: 'form2_ecole', label: 'Formation 2 : École', type: 'text', default: 'Université de Brazzaville' },
            { name: 'form2_date', label: 'Formation 2 : Dates', type: 'text', default: '2010 - 2013' },
            { name: 'skill1_name', label: 'Compétence 1', type: 'text', default: 'Gestion de projet' },
            { name: 'skill2_name', label: 'Compétence 2', type: 'text', default: 'Leadership' },
            { name: 'skill3_name', label: 'Compétence 3', type: 'text', default: 'Communication' },
            { name: 'skill4_name', label: 'Compétence 4', type: 'text', default: 'Analyse stratégique' },
            { name: 'lang1_name', label: 'Langue 1', type: 'text', default: 'Français' },
            { name: 'lang1_level', label: 'Niveau Langue 1', type: 'text', default: 'Courant' },
            { name: 'lang2_name', label: 'Langue 2', type: 'text', default: 'Anglais' },
            { name: 'lang2_level', label: 'Niveau Langue 2', type: 'text', default: 'Professionnel' }
        ],

        cssStyles: `
            .cv-classique-container { width: 210mm; min-height: 297mm; background: white; padding: 50px 60px; font-family: 'Georgia', 'Times New Roman', serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .cv-classique-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 25px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .cv-classique-info { flex: 1; }
            .cv-classique-name { font-size: 2.5rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; line-height: 1.1; }
            .cv-classique-title { font-size: 1.3rem; color: #64748b; font-style: italic; margin-bottom: 20px; }
            .cv-classique-contact { font-size: 0.95rem; line-height: 1.6; color: #475569; }
            .cv-classique-contact div { margin-bottom: 5px; }
            .cv-classique-photo { width: 120px; height: 150px; background: #f1f5f9; border: 2px solid var(--doc-primary-color, #0F172A); margin-left: 30px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
            .cv-classique-photo img { width: 100%; height: 100%; object-fit: cover; }
            .cv-classique-photo-placeholder { color: #94a3b8; font-size: 2rem; font-weight: 700; }
            .cv-classique-section { margin-bottom: 30px; }
            .cv-classique-section-title { font-size: 1.2rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid var(--doc-primary-color, #0F172A); }
            .cv-classique-profile { font-size: 1rem; line-height: 1.7; color: #475569; text-align: justify; }
            .cv-classique-experience { margin-bottom: 20px; }
            .cv-classique-experience-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
            .cv-classique-experience-title { font-weight: 700; font-size: 1.1rem; color: #0f172a; }
            .cv-classique-experience-date { font-size: 0.9rem; color: #64748b; font-style: italic; }
            .cv-classique-experience-company { font-size: 1rem; color: var(--doc-primary-color, #0F172A); font-weight: 600; margin-bottom: 8px; }
            .cv-classique-experience-desc { font-size: 0.95rem; color: #475569; line-height: 1.6; text-align: justify; }
            .cv-classique-education { margin-bottom: 15px; }
            .cv-classique-education-degree { font-weight: 700; font-size: 1.05rem; color: #0f172a; }
            .cv-classique-education-school { font-size: 1rem; color: var(--doc-primary-color, #0F172A); font-weight: 600; }
            .cv-classique-education-date { font-size: 0.9rem; color: #64748b; }
            .cv-classique-skills-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .cv-classique-skill { font-size: 0.95rem; color: #475569; padding: 5px 0; }
            .cv-classique-skill::before { content: '• '; color: var(--doc-primary-color, #0F172A); font-weight: 700; }
            .cv-classique-languages { display: flex; flex-wrap: wrap; gap: 20px; }
            .cv-classique-language { font-size: 0.95rem; }
            .cv-classique-language strong { color: #0f172a; }
            .cv-classique-language span { color: #64748b; font-style: italic; }
        `,
        
        htmlStructure: `
            <div class="cv-classique-container">
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
                    <div class="cv-classique-photo" id="doc-photo"><span class="cv-classique-photo-placeholder" id="photo-initials">MT</span></div>
                </header>
                <section class="cv-classique-section">
                    <div class="cv-classique-section-title">Profil</div>
                    <p class="cv-classique-profile" id="field-profil">Professionnel expérimenté avec plus de 10 ans d'expérience dans mon domaine. Passionné par l'innovation et la recherche de l'excellence.</p>
                </section>
                <section class="cv-classique-section">
                    <div class="cv-classique-section-title">Expériences Professionnelles</div>
                    <div class="cv-classique-experience">
                        <div class="cv-classique-experience-header">
                            <div class="cv-classique-experience-title" id="field-exp1_titre">Directeur Général</div>
                            <div class="cv-classique-experience-date" id="field-exp1_date">2020 - Présent</div>
                        </div>
                        <div class="cv-classique-experience-company" id="field-exp1_entreprise">Entreprise XYZ - Brazzaville</div>
                        <div class="cv-classique-experience-desc" id="field-exp1_desc">Direction stratégique de l'entreprise. Management d'une équipe de 50 personnes.</div>
                    </div>
                    <div class="cv-classique-experience">
                        <div class="cv-classique-experience-header">
                            <div class="cv-classique-experience-title" id="field-exp2_titre">Chef de Projet Senior</div>
                            <div class="cv-classique-experience-date" id="field-exp2_date">2015 - 2020</div>
                        </div>
                        <div class="cv-classique-experience-company" id="field-exp2_entreprise">Société ABC - Pointe-Noire</div>
                        <div class="cv-classique-experience-desc" id="field-exp2_desc">Gestion de projets majeurs. Coordination avec les parties prenantes.</div>
                    </div>
                </section>
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
                <section class="cv-classique-section">
                    <div class="cv-classique-section-title">Compétences</div>
                    <div class="cv-classique-skills-list">
                        <div class="cv-classique-skill" id="field-skill1_name">Gestion de projet</div>
                        <div class="cv-classique-skill" id="field-skill2_name">Leadership</div>
                        <div class="cv-classique-skill" id="field-skill3_name">Communication</div>
                        <div class="cv-classique-skill" id="field-skill4_name">Analyse stratégique</div>
                    </div>
                </section>
                <section class="cv-classique-section">
                    <div class="cv-classique-section-title">Langues</div>
                    <div class="cv-classique-languages">
                        <div class="cv-classique-language"><strong id="field-lang1_name">Français</strong> - <span id="field-lang1_level">Courant</span></div>
                        <div class="cv-classique-language"><strong id="field-lang2_name">Anglais</strong> - <span id="field-lang2_level">Professionnel</span></div>
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
        
        fields: [
            { name: 'nom', label: 'Nom complet', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'poste', label: 'Formation actuelle / Stage recherché', type: 'text', default: 'Étudiant en Master Management' },
            { name: 'email', label: 'Adresse email', type: 'email', default: 'brazzamarket.infos@gmail.com' },
            { name: 'telephone', label: 'Numéro de téléphone', type: 'tel', default: '+242 06 518 69 67' },
            { name: 'adresse', label: 'Ville et Pays', type: 'text', default: 'Brazzaville, Congo' },
            { name: 'profil', label: 'Objectif du stage', type: 'textarea', default: 'Étudiant sérieux et motivé, je recherche un stage de fin d\'études de 6 mois pour mettre en pratique mes connaissances en gestion et contribuer activement aux projets de votre entreprise.' },
            { name: 'form1_diplome', label: 'Formation en cours : Diplôme', type: 'text', default: 'Master 1 en Management' },
            { name: 'form1_ecole', label: 'Formation en cours : École', type: 'text', default: 'Université Marien Ngouabi, Brazzaville' },
            { name: 'form1_date', label: 'Formation en cours : Période', type: 'text', default: '2025 - Présent' },
            { name: 'form2_diplome', label: 'Formation précédente : Diplôme', type: 'text', default: 'Licence en Gestion' },
            { name: 'form2_ecole', label: 'Formation précédente : École', type: 'text', default: 'Université de Brazzaville' },
            { name: 'form2_date', label: 'Formation précédente : Période', type: 'text', default: '2022 - 2025' },
            { name: 'exp1_titre', label: 'Expérience/Stage 1 : Titre', type: 'text', default: 'Stagiaire Assistant Administratif' },
            { name: 'exp1_date', label: 'Expérience/Stage 1 : Période', type: 'text', default: 'Juin 2024 - Août 2024' },
            { name: 'exp1_entreprise', label: 'Expérience/Stage 1 : Structure', type: 'text', default: 'Mairie de Brazzaville' },
            { name: 'exp1_desc', label: 'Expérience/Stage 1 : Missions', type: 'textarea', default: 'Classement de dossiers, accueil du public, rédaction de comptes-rendus de réunion.' },
            { name: 'skill1_name', label: 'Compétence 1', type: 'text', default: 'Pack Office' },
            { name: 'skill2_name', label: 'Compétence 2', type: 'text', default: 'Travail d\'équipe' },
            { name: 'skill3_name', label: 'Compétence 3', type: 'text', default: 'Rédaction' },
            { name: 'skill4_name', label: 'Compétence 4', type: 'text', default: 'Organisation' },
            { name: 'lang1_name', label: 'Langue 1', type: 'text', default: 'Français' },
            { name: 'lang1_level', label: 'Niveau Langue 1', type: 'text', default: 'Courant' },
            { name: 'lang2_name', label: 'Langue 2', type: 'text', default: 'Anglais' },
            { name: 'lang2_level', label: 'Niveau Langue 2', type: 'text', default: 'Scolaire' },
            { name: 'interets', label: 'Centres d\'intérêt', type: 'text', default: 'Lecture, Sport collectif, Bénévolat associatif' }
        ],

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
                </section>
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
        
        fields: [
            { name: 'nom', label: 'Nom complet', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'poste', label: 'Titre du poste', type: 'text', default: 'Directeur Artistique / Graphiste' },
            { name: 'email', label: 'Adresse email', type: 'email', default: 'brazzamarket.infos@gmail.com' },
            { name: 'telephone', label: 'Numéro de téléphone', type: 'tel', default: '+242 06 518 69 67' },
            { name: 'adresse', label: 'Ville et Pays', type: 'text', default: 'Brazzaville, Congo' },
            { name: 'portfolio', label: 'Lien Portfolio / Site web', type: 'text', default: 'www.monportfolio.com' },
            { name: 'profil', label: 'Profil créatif', type: 'textarea', default: 'Créatif passionné avec 5 ans d\'expérience dans la conception d\'identités visuelles percutantes. J\'aime transformer des idées complexes en designs simples et élégants.' },
            { name: 'exp1_titre', label: 'Expérience 1 : Titre', type: 'text', default: 'Graphiste Senior' },
            { name: 'exp1_date', label: 'Expérience 1 : Période', type: 'text', default: '2021 - Présent' },
            { name: 'exp1_entreprise', label: 'Expérience 1 : Entreprise', type: 'text', default: 'Agence Créative XYZ' },
            { name: 'exp1_desc', label: 'Expérience 1 : Description', type: 'textarea', default: 'Direction artistique de campagnes publicitaires. Création de maquettes web et print. Management d\'un junior designer.' },
            { name: 'exp2_titre', label: 'Expérience 2 : Titre', type: 'text', default: 'Designer Freelance' },
            { name: 'exp2_date', label: 'Expérience 2 : Période', type: 'text', default: '2019 - 2021' },
            { name: 'exp2_entreprise', label: 'Expérience 2 : Entreprise', type: 'text', default: 'Indépendant' },
            { name: 'exp2_desc', label: 'Expérience 2 : Description', type: 'textarea', default: 'Réalisation de logos, chartes graphiques et supports de communication pour des PME locales.' },
            { name: 'form1_diplome', label: 'Formation : Diplôme', type: 'text', default: 'Master en Design Graphique' },
            { name: 'form1_ecole', label: 'Formation : École', type: 'text', default: 'École des Beaux-Arts' },
            { name: 'form1_date', label: 'Formation : Période', type: 'text', default: '2017 - 2019' },
            { name: 'logiciel1_name', label: 'Logiciel 1', type: 'text', default: 'Photoshop' },
            { name: 'logiciel2_name', label: 'Logiciel 2', type: 'text', default: 'Illustrator' },
            { name: 'logiciel3_name', label: 'Logiciel 3', type: 'text', default: 'Figma' },
            { name: 'lang1_name', label: 'Langue 1', type: 'text', default: 'Français' },
            { name: 'lang1_level', label: 'Niveau Langue 1', type: 'text', default: 'Courant' },
            { name: 'lang2_name', label: 'Langue 2', type: 'text', default: 'Anglais' },
            { name: 'lang2_level', label: 'Niveau Langue 2', type: 'text', default: 'Professionnel' }
        ],

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
        
        fields: [
            { name: 'expediteur_nom', label: 'Votre nom complet', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'expediteur_adresse', label: 'Votre adresse', type: 'text', default: 'Brazzaville, Congo' },
            { name: 'expediteur_telephone', label: 'Votre téléphone', type: 'tel', default: '+242 06 518 69 67' },
            { name: 'expediteur_email', label: 'Votre email', type: 'email', default: 'brazzamarket.infos@gmail.com' },
            { name: 'destinataire_nom', label: 'Nom du destinataire', type: 'text', default: 'Monsieur le Responsable RH' },
            { name: 'destinataire_fonction', label: 'Fonction du destinataire', type: 'text', default: 'Responsable des Stages' },
            { name: 'destinataire_entreprise', label: 'Entreprise du destinataire', type: 'text', default: 'Entreprise Cible' },
            { name: 'destinataire_adresse', label: 'Adresse de l\'entreprise', type: 'text', default: 'Brazzaville, Congo' },
            { name: 'date', label: 'Date', type: 'text', default: '04 octobre 2026' },
            { name: 'objet', label: 'Objet de la lettre', type: 'text', default: 'Candidature pour un stage de fin d\'études' },
            { name: 'paragraphe1', label: 'Formule d\'appel', type: 'text', default: 'Madame, Monsieur,' },
            { name: 'paragraphe2', label: 'Paragraphe 1 : Votre formation et demande', type: 'textarea', default: 'Actuellement étudiant en Master Management à l\'Université Marien Ngouabi, je suis à la recherche d\'un stage de fin d\'études d\'une durée de 6 mois à partir de janvier 2027.' },
            { name: 'paragraphe3', label: 'Paragraphe 2 : Pourquoi cette entreprise', type: 'textarea', default: 'Votre entreprise, reconnue pour son innovation et son excellence, représente pour moi l\'environnement idéal pour mettre en pratique mes connaissances et développer de nouvelles compétences. Sérieux, motivé et doté d\'un bon esprit d\'équipe, je suis prêt à m\'investir pleinement dans les missions que vous voudrez bien me confier.' },
            { name: 'paragraphe4', label: 'Paragraphe 3 : Conclusion', type: 'textarea', default: 'Je me tiens à votre entière disposition pour un entretien afin de vous exposer plus en détail mes motivations. Dans cette attente, je vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.' },
            { name: 'signature', label: 'Votre signature (Nom)', type: 'text', default: 'Meurphy TALAMIO' }
        ],

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
                    <p id="field-paragraphe2">Actuellement étudiant en Master Management à l'Université Marien Ngouabi, je suis à la recherche d'un stage de fin d'études d'une durée de 6 mois à partir de janvier 2027.</p>
                    <p id="field-paragraphe3">Votre entreprise, reconnue pour son innovation et son excellence, représente pour moi l'environnement idéal pour mettre en pratique mes connaissances et développer de nouvelles compétences. Sérieux, motivé et doté d'un bon esprit d'équipe, je suis prêt à m'investir pleinement dans les missions que vous voudrez bien me confier.</p>
                    <p id="field-paragraphe4">Je me tiens à votre entière disposition pour un entretien afin de vous exposer plus en détail mes motivations. Dans cette attente, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
                </div>
                <div class="lettre-stage-formule">Cordialement,</div>
                <div class="lettre-stage-signature" id="field-signature">Meurphy TALAMIO</div>
            </div>
        `
    };
}

// --- DOCUMENT 7 : Attestation de Travail ---
export function getTemplate_Attestation_Travail() {
    return {
        id: 'attestation_travail',
        name: 'Attestation de Travail',
        category: 'attestation',
        price: 1000,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Modèle officiel d\'attestation de travail pour justifier de l\'emploi.',
        
        fields: [
            { name: 'entreprise_nom', label: 'Nom de l\'entreprise', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'entreprise_adresse', label: 'Adresse de l\'entreprise', type: 'text', default: '123 Avenue de l\'Indépendance, Brazzaville' },
            { name: 'entreprise_telephone', label: 'Téléphone de l\'entreprise', type: 'tel', default: '+242 06 000 00 00' },
            { name: 'entreprise_email', label: 'Email de l\'entreprise', type: 'email', default: 'contact@entreprise.com' },
            { name: 'signataire_nom', label: 'Nom du signataire', type: 'text', default: 'Monsieur le Directeur Général' },
            { name: 'signataire_fonction', label: 'Fonction du signataire', type: 'text', default: 'Directeur Général' },
            { name: 'employe_nom', label: 'Nom de l\'employé', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'employe_naissance', label: 'Date de naissance de l\'employé', type: 'text', default: '01/01/1990' },
            { name: 'employe_lieu_naissance', label: 'Lieu de naissance', type: 'text', default: 'Brazzaville' },
            { name: 'employe_cni', label: 'Numéro CNI de l\'employé', type: 'text', default: '123456789' },
            { name: 'employe_date_embauche', label: 'Date d\'embauche', type: 'text', default: '01/01/2020' },
            { name: 'employe_poste', label: 'Poste occupé', type: 'text', default: 'Directeur Général' },
            { name: 'ville', label: 'Ville de signature', type: 'text', default: 'Brazzaville' },
            { name: 'date', label: 'Date de signature', type: 'text', default: '04 octobre 2026' }
        ],

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
                    <p>Je soussigné(e), <span class="attestation-info-employe" id="field-signataire_nom">Monsieur le Directeur Général</span>, agissant en qualité de <span class="attestation-info-employe" id="field-signataire_fonction">Directeur Général</span> de la société <span class="attestation-info-employe" id="field-entreprise_nom">ENTREPRISE XYZ</span>,</p>
                    <p>Certifie par la présente que <span class="attestation-info-employe" id="field-employe_nom">Meurphy TALAMIO</span>, né(e) le <span class="attestation-info-employe" id="field-employe_naissance">01/01/1990</span> à <span class="attestation-info-employe" id="field-employe_lieu_naissance">Brazzaville</span>, titulaire de la CNI n° <span class="attestation-info-employe" id="field-employe_cni">123456789</span>,</p>
                    <p>Est employé(e) au sein de notre entreprise depuis le <span class="attestation-info-employe" id="field-employe_date_embauche">01/01/2020</span> en qualité de <span class="attestation-info-employe" id="field-employe_poste">Directeur Général</span>.</p>
                    <p>Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.</p>
                </div>
                <div class="attestation-date-lieu">Fait à <span id="field-ville">Brazzaville</span>, le <span id="field-date">04 octobre 2026</span></div>
                <div class="attestation-signature">
                    <div class="attestation-signature-label">Le Signataire</div>
                    <div class="attestation-signature-nom" id="field-signataire_nom">Monsieur le Directeur Général</div>
                    <div class="attestation-signature-fonction" id="field-signataire_fonction">Directeur Général</div>
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
        
        fields: [
            { name: 'nom', label: 'Nom complet', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'poste', label: 'Titre du poste', type: 'text', default: 'Ingénieur Full Stack Senior' },
            { name: 'email', label: 'Adresse email', type: 'email', default: 'brazzamarket.infos@gmail.com' },
            { name: 'telephone', label: 'Numéro de phone', type: 'tel', default: '+242 06 518 69 67' },
            { name: 'adresse', label: 'Ville et Pays', type: 'text', default: 'Brazzaville, Congo' },
            { name: 'github', label: 'Lien GitHub / Portfolio', type: 'text', default: 'github.com/meurphy' },
            { name: 'profil', label: 'Profil professionnel', type: 'textarea', default: 'Ingénieur passionné avec 7 ans d\'expérience dans le développement d\'applications web et mobiles. Spécialisé en architectures modernes et solutions cloud.' },
            { name: 'exp1_titre', label: 'Expérience 1 : Titre', type: 'text', default: 'Lead Developer Full Stack' },
            { name: 'exp1_date', label: 'Expérience 1 : Période', type: 'text', default: '2021 - Présent' },
            { name: 'exp1_entreprise', label: 'Expérience 1 : Entreprise', type: 'text', default: 'TechCorp Solutions' },
            { name: 'exp1_desc', label: 'Expérience 1 : Description', type: 'textarea', default: 'Direction technique d\'une équipe de 8 développeurs. Architecture microservices. Déploiement CI/CD.' },
            { name: 'exp1_tech1', label: 'Expérience 1 : Tech 1', type: 'text', default: 'React' },
            { name: 'exp1_tech2', label: 'Expérience 1 : Tech 2', type: 'text', default: 'Node.js' },
            { name: 'exp1_tech3', label: 'Expérience 1 : Tech 3', type: 'text', default: 'AWS' },
            { name: 'exp2_titre', label: 'Expérience 2 : Titre', type: 'text', default: 'Développeur Backend' },
            { name: 'exp2_date', label: 'Expérience 2 : Période', type: 'text', default: '2018 - 2021' },
            { name: 'exp2_entreprise', label: 'Expérience 2 : Entreprise', type: 'text', default: 'StartupXYZ' },
            { name: 'exp2_desc', label: 'Expérience 2 : Description', type: 'textarea', default: 'Développement d\'APIs RESTful. Optimisation de bases de données.' },
            { name: 'exp2_tech1', label: 'Expérience 2 : Tech 1', type: 'text', default: 'Python' },
            { name: 'exp2_tech2', label: 'Expérience 2 : Tech 2', type: 'text', default: 'Django' },
            { name: 'exp2_tech3', label: 'Expérience 2 : Tech 3', type: 'text', default: 'PostgreSQL' },
            { name: 'form1_diplome', label: 'Formation : Diplôme', type: 'text', default: 'Master en Informatique' },
            { name: 'form1_ecole', label: 'Formation : École', type: 'text', default: 'Université Marien Ngouabi' },
            { name: 'form1_date', label: 'Formation : Période', type: 'text', default: '2016 - 2018' },
            { name: 'tech1_name', label: 'Compétence Tech 1', type: 'text', default: 'JavaScript/TypeScript' },
            { name: 'tech2_name', label: 'Compétence Tech 2', type: 'text', default: 'React/Node.js' },
            { name: 'tech3_name', label: 'Compétence Tech 3', type: 'text', default: 'Python/Django' },
            { name: 'tech4_name', label: 'Compétence Tech 4', type: 'text', default: 'SQL/NoSQL' },
            { name: 'lang1_name', label: 'Langue 1', type: 'text', default: 'Français' },
            { name: 'lang1_level', label: 'Niveau Langue 1', type: 'text', default: 'Courant' },
            { name: 'lang2_name', label: 'Langue 2', type: 'text', default: 'Anglais' },
            { name: 'lang2_level', label: 'Niveau Langue 2', type: 'text', default: 'Technique' }
        ],

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
                    <div class="cv-tech-contact-item">✉ <span id="field-email">brazzamarket.infos@gmail.com</span></div>
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
        
        fields: [
            { name: 'expediteur_nom', label: 'Votre nom complet', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'expediteur_fonction', label: 'Votre fonction', type: 'text', default: 'Directeur Général' },
            { name: 'expediteur_entreprise', label: 'Votre entreprise', type: 'text', default: 'Entreprise XYZ' },
            { name: 'expediteur_adresse', label: 'Votre adresse', type: 'text', default: 'Brazzaville, Congo' },
            { name: 'expediteur_telephone', label: 'Votre téléphone', type: 'tel', default: '+242 06 518 69 67' },
            { name: 'expediteur_email', label: 'Votre email', type: 'email', default: 'brazzamarket.infos@gmail.com' },
            { name: 'destinataire_nom', label: 'Nom du destinataire', type: 'text', default: 'À qui de droit' },
            { name: 'destinataire_entreprise', label: 'Entreprise du destinataire', type: 'text', default: 'Entreprise Cible' },
            { name: 'destinataire_adresse', label: 'Adresse du destinataire', type: 'text', default: 'Brazzaville, Congo' },
            { name: 'date', label: 'Date', type: 'text', default: '04 octobre 2026' },
            { name: 'objet', label: 'Objet de la lettre', type: 'text', default: 'Lettre de recommandation pour [Nom de la personne]' },
            { name: 'paragraphe1', label: 'Formule d\'appel', type: 'text', default: 'Madame, Monsieur,' },
            { name: 'personne_nom', label: 'Nom de la personne recommandée', type: 'text', default: 'Monsieur/Madame [Nom]' },
            { name: 'duree_collaboration', label: 'Durée de collaboration', type: 'text', default: '3 ans' },
            { name: 'entreprise_nom2', label: 'Nom de votre entreprise (dans le texte)', type: 'text', default: 'Entreprise XYZ' },
            { name: 'paragraphe2', label: 'Paragraphe 2 : Contexte', type: 'textarea', default: 'Par la présente, je tiens à recommander vivement cette personne, que j\'ai eu le plaisir de connaître pendant 3 ans au sein de notre entreprise.' },
            { name: 'personne_pronom', label: 'Pronom (il/elle)', type: 'text', default: 'il/elle' },
            { name: 'personne_poste', label: 'Poste occupé par la personne', type: 'text', default: '[Poste occupé]' },
            { name: 'personne_pronom2', label: 'Pronom (Il/Elle)', type: 'text', default: 'Il/Elle' },
            { name: 'realisation_majeure', label: 'Réalisation majeure', type: 'text', default: '[Réalisation majeure]' },
            { name: 'paragraphe3', label: 'Paragraphe 3 : Qualités', type: 'textarea', default: 'Durant cette période, il/elle a occupé le poste de [Poste occupé] et a fait preuve d\'un professionnalisme exemplaire, d\'une grande rigueur et d\'un excellent esprit d\'équipe. Il/Elle a notamment contribué à [Réalisation majeure].' },
            { name: 'personne_pronom3', label: 'Pronom (il/elle)', type: 'text', default: 'il/elle' },
            { name: 'paragraphe4', label: 'Paragraphe 4 : Conclusion', type: 'textarea', default: 'Je suis convaincu que il/elle sera un atout précieux pour votre organisation et je le/la recommande sans réserve.' },
            { name: 'paragraphe5', label: 'Paragraphe 5 : Ouverture', type: 'textarea', default: 'Je reste à votre disposition pour tout complément d\'information.' },
            { name: 'expediteur_nom2', label: 'Signature : Votre nom', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'expediteur_fonction2', label: 'Signature : Votre fonction', type: 'text', default: 'Directeur Général' }
        ],

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
        description: 'Document officiel attestant du salaire d\'un employé.',
        
        fields: [
            { name: 'entreprise_nom', label: 'Nom de l\'entreprise', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'entreprise_adresse', label: 'Adresse de l\'entreprise', type: 'text', default: '123 Avenue de l\'Indépendance, Brazzaville' },
            { name: 'entreprise_telephone', label: 'Téléphone de l\'entreprise', type: 'tel', default: '+242 06 000 00 00' },
            { name: 'entreprise_email', label: 'Email de l\'entreprise', type: 'email', default: 'contact@entreprise.com' },
            { name: 'signataire_nom', label: 'Nom du signataire', type: 'text', default: 'Monsieur le Directeur Général' },
            { name: 'signataire_fonction', label: 'Fonction du signataire', type: 'text', default: 'Directeur Général' },
            { name: 'entreprise_nom2', label: 'Nom de l\'entreprise (dans le texte)', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'employe_nom', label: 'Nom de l\'employé', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'employe_poste', label: 'Poste de l\'employé', type: 'text', default: 'Directeur Général' },
            { name: 'employe_date_embauche', label: 'Date d\'embauche', type: 'text', default: '01/01/2020' },
            { name: 'salaire_montant', label: 'Rémunération mensuelle brute', type: 'text', default: '1 500 000 FCFA' },
            { name: 'salaire_base', label: 'Salaire de base', type: 'text', default: '1 200 000 FCFA' },
            { name: 'salaire_primes', label: 'Primes et indemnités', type: 'text', default: '300 000 FCFA' },
            { name: 'salaire_total', label: 'Total brut mensuel', type: 'text', default: '1 500 000 FCFA' },
            { name: 'ville', label: 'Ville', type: 'text', default: 'Brazzaville' },
            { name: 'date', label: 'Date', type: 'text', default: '04 octobre 2026' },
            { name: 'signataire_nom2', label: 'Signature : Nom', type: 'text', default: 'Monsieur le Directeur Général' },
            { name: 'signataire_fonction2', label: 'Signature : Fonction', type: 'text', default: 'Directeur Général' }
        ],

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
        
        fields: [
            { name: 'entreprise_nom', label: 'Nom de l\'entreprise', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'entreprise_adresse', label: 'Adresse de l\'entreprise', type: 'text', default: '123 Avenue de l\'Indépendance, Brazzaville' },
            { name: 'entreprise_telephone', label: 'Téléphone', type: 'tel', default: '+242 06 000 00 00' },
            { name: 'entreprise_email', label: 'Email', type: 'email', default: 'contact@entreprise.com' },
            { name: 'ville', label: 'Ville de signature', type: 'text', default: 'Brazzaville' },
            { name: 'date', label: 'Date de signature', type: 'text', default: '04 octobre 2026' },
            { name: 'entreprise_nom2', label: 'Nom de l\'entreprise (Partie 1)', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'entreprise_immatriculation', label: 'Numéro d\'immatriculation', type: 'text', default: '123456789' },
            { name: 'entreprise_siege', label: 'Siège social', type: 'text', default: '123 Avenue de l\'Indépendance, Brazzaville' },
            { name: 'employeur_nom', label: 'Nom du représentant', type: 'text', default: 'Monsieur le Directeur Général' },
            { name: 'employeur_fonction', label: 'Fonction du représentant', type: 'text', default: 'Directeur Général' },
            { name: 'employe_nom', label: 'Nom de l\'employé', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'employe_naissance', label: 'Date de naissance', type: 'text', default: '01/01/1990' },
            { name: 'employe_lieu_naissance', label: 'Lieu de naissance', type: 'text', default: 'Brazzaville' },
            { name: 'employe_cni', label: 'Numéro CNI', type: 'text', default: '123456789' },
            { name: 'employe_adresse', label: 'Adresse de l\'employé', type: 'text', default: 'Brazzaville, Congo' },
            { name: 'employe_nom2', label: 'Nom de l\'employé (Article 1)', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'entreprise_nom3', label: 'Nom de l\'entreprise (Article 1)', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'employe_poste', label: 'Poste occupé', type: 'text', default: 'Directeur Général' },
            { name: 'missions', label: 'Missions principales', type: 'textarea', default: 'Direction stratégique de l\'entreprise, management des équipes, développement commercial' },
            { name: 'superieur_hierarchique', label: 'Supérieur hiérarchique', type: 'text', default: 'Monsieur le Président du Conseil d\'Administration' },
            { name: 'date_debut', label: 'Date d\'entrée', type: 'text', default: '01/01/2027' },
            { name: 'duree_essai', label: 'Durée de la période d\'essai', type: 'text', default: '3 mois' },
            { name: 'salaire_montant', label: 'Rémunération mensuelle brute', type: 'text', default: '1 500 000 FCFA' },
            { name: 'salaire_base', label: 'Salaire de base', type: 'text', default: '1 200 000 FCFA' },
            { name: 'salaire_primes', label: 'Primes', type: 'text', default: '300 000 FCFA' },
            { name: 'duree_travail', label: 'Durée hebdomadaire du travail', type: 'text', default: '40 heures' },
            { name: 'lieu_travail', label: 'Lieu de travail', type: 'text', default: 'Brazzaville' },
            { name: 'jours_conges', label: 'Nombre de jours de congés', type: 'text', default: '30 jours' },
            { name: 'duree_preavis', label: 'Durée du préavis (Salarié)', type: 'text', default: '3 mois' },
            { name: 'duree_preavis_employeur', label: 'Durée du préavis (Employeur)', type: 'text', default: '6 mois' },
            { name: 'employeur_nom2', label: 'Signature Employeur', type: 'text', default: 'Monsieur le Directeur Général' },
            { name: 'employe_nom3', label: 'Signature Salarié', type: 'text', default: 'Meurphy TALAMIO' }
        ],

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
        
        fields: [
            { name: 'entreprise_nom', label: 'Nom de l\'entreprise', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'entreprise_adresse', label: 'Adresse', type: 'text', default: '123 Avenue de l\'Indépendance, Brazzaville' },
            { name: 'entreprise_telephone', label: 'Téléphone', type: 'tel', default: '+242 06 000 00 00' },
            { name: 'entreprise_email', label: 'Email', type: 'email', default: 'contact@entreprise.com' },
            { name: 'motif_recours', label: 'Motif de recours (Titre)', type: 'text', default: 'Accroissement temporaire d\'activité' },
            { name: 'date_debut', label: 'Date de début', type: 'text', default: '01/01/2027' },
            { name: 'date_fin', label: 'Date de fin', type: 'text', default: '30/06/2027' },
            { name: 'duree_totale', label: 'Durée totale', type: 'text', default: '6 mois' },
            { name: 'ville', label: 'Ville', type: 'text', default: 'Brazzaville' },
            { name: 'date', label: 'Date', type: 'text', default: '04 octobre 2026' },
            { name: 'entreprise_nom2', label: 'Nom de l\'entreprise (Partie 1)', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'entreprise_immatriculation', label: 'Numéro d\'immatriculation', type: 'text', default: '123456789' },
            { name: 'entreprise_siege', label: 'Siège social', type: 'text', default: '123 Avenue de l\'Indépendance, Brazzaville' },
            { name: 'employeur_nom', label: 'Nom du représentant', type: 'text', default: 'Monsieur le Directeur Général' },
            { name: 'employe_nom', label: 'Nom de l\'employé', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'employe_naissance', label: 'Date de naissance', type: 'text', default: '01/01/1990' },
            { name: 'employe_lieu_naissance', label: 'Lieu de naissance', type: 'text', default: 'Brazzaville' },
            { name: 'employe_cni', label: 'Numéro CNI', type: 'text', default: '123456789' },
            { name: 'motif_detail', label: 'Détail du motif', type: 'textarea', default: 'l\'accroissement temporaire d\'activité lié à un projet spécifique' },
            { name: 'employe_poste', label: 'Poste occupé', type: 'text', default: 'Chef de Projet' },
            { name: 'missions', label: 'Missions principales', type: 'textarea', default: 'Gestion du projet X, coordination des équipes, reporting' },
            { name: 'salaire_montant', label: 'Rémunération mensuelle brute', type: 'text', default: '1 200 000 FCFA' },
            { name: 'duree_travail', label: 'Durée hebdomadaire', type: 'text', default: '40 heures' },
            { name: 'nombre_renouvellements', label: 'Nombre de renouvellements', type: 'text', default: '1 fois' },
            { name: 'duree_renouvellement', label: 'Durée du renouvellement', type: 'text', default: '3 mois' },
            { name: 'taux_indemnite', label: 'Taux d\'indemnité de fin de contrat', type: 'text', default: '10%' },
            { name: 'employeur_nom2', label: 'Signature Employeur', type: 'text', default: 'Monsieur le Directeur Général' },
            { name: 'employe_nom2', label: 'Signature Salarié', type: 'text', default: 'Meurphy TALAMIO' }
        ],

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
        
        fields: [
            { name: 'entreprise_nom', label: 'Nom de l\'entreprise', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'entreprise_adresse', label: 'Adresse de l\'entreprise', type: 'text', default: '123 Avenue de l\'Indépendance, Brazzaville' },
            { name: 'entreprise_telephone', label: 'Téléphone', type: 'tel', default: '+242 06 000 00 00' },
            { name: 'entreprise_email', label: 'Email', type: 'email', default: 'contact@entreprise.com' },
            { name: 'date_debut', label: 'Date de début', type: 'text', default: '01/01/2027' },
            { name: 'date_fin', label: 'Date de fin', type: 'text', default: '30/06/2027' },
            { name: 'duree_totale', label: 'Durée totale', type: 'text', default: '6 mois' },
            { name: 'ville', label: 'Ville', type: 'text', default: 'Brazzaville' },
            { name: 'date', label: 'Date', type: 'text', default: '04 octobre 2026' },
            { name: 'entreprise_nom2', label: 'Nom de l\'entreprise (Partie 1)', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'employeur_nom', label: 'Représentant de l\'entreprise', type: 'text', default: 'Monsieur le Directeur' },
            { name: 'entreprise_siege', label: 'Siège social', type: 'text', default: '123 Avenue de l\'Indépendance' },
            { name: 'ecole_nom', label: 'Nom de l\'école', type: 'text', default: 'Université Marien Ngouabi' },
            { name: 'ecole_representant', label: 'Représentant de l\'école', type: 'text', default: 'Monsieur le Doyen' },
            { name: 'ecole_adresse', label: 'Adresse de l\'école', type: 'text', default: 'Brazzaville, Congo' },
            { name: 'stagiaire_nom', label: 'Nom du stagiaire', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'stagiaire_naissance', label: 'Date de naissance', type: 'text', default: '01/01/2000' },
            { name: 'stagiaire_formation', label: 'Formation en cours', type: 'text', default: 'Master Management' },
            { name: 'stagiaire_nom2', label: 'Nom du stagiaire (Article 1)', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'entreprise_nom3', label: 'Nom de l\'entreprise (Article 1)', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'objectif1', label: 'Objectif 1', type: 'text', default: 'Découverte du monde professionnel' },
            { name: 'objectif2', label: 'Objectif 2', type: 'text', default: 'Mise en pratique des connaissances acquises' },
            { name: 'objectif3', label: 'Objectif 3', type: 'text', default: 'Développement de compétences spécifiques' },
            { name: 'missions', label: 'Missions confiées', type: 'textarea', default: 'Assistance à la gestion de projet, analyse de données, rédaction de rapports' },
            { name: 'tuteur_nom', label: 'Nom du tuteur', type: 'text', default: 'Monsieur le Chef de Département' },
            { name: 'duree_hebdomadaire', label: 'Durée hebdomadaire', type: 'text', default: '35 heures' },
            { name: 'gratification', label: 'Gratification mensuelle', type: 'text', default: '150 000 FCFA' },
            { name: 'employeur_nom2', label: 'Signature Entreprise', type: 'text', default: 'Monsieur le Directeur' },
            { name: 'ecole_representant2', label: 'Signature École', type: 'text', default: 'Monsieur le Doyen' },
            { name: 'stagiaire_signature', label: 'Signature Stagiaire', type: 'text', default: 'Meurphy TALAMIO' }
        ],

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
                        <div class="stage-signature-line" id="field-stagiaire_signature">Meurphy TALAMIO</div>
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
        
        fields: [
            { name: 'entreprise_nom', label: 'Nom de votre entreprise', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'entreprise_adresse', label: 'Adresse de votre entreprise', type: 'text', default: '123 Avenue de l\'Indépendance, Brazzaville' },
            { name: 'entreprise_telephone', label: 'Téléphone', type: 'tel', default: '+242 06 000 00 00' },
            { name: 'entreprise_email', label: 'Email', type: 'email', default: 'contact@entreprise.com' },
            { name: 'client_nom', label: 'Nom du client', type: 'text', default: 'Monsieur le Client' },
            { name: 'client_adresse', label: 'Adresse du client', type: 'text', default: 'Adresse du client' },
            { name: 'client_telephone', label: 'Téléphone du client', type: 'tel', default: '+242 06 000 00 00' },
            { name: 'client_email', label: 'Email du client', type: 'email', default: 'client@email.com' },
            { name: 'devis_numero', label: 'Numéro du devis', type: 'text', default: 'DEV-2026-001' },
            { name: 'date_emission', label: 'Date d\'émission', type: 'text', default: '04/10/2026' },
            { name: 'date_validite', label: 'Validité du devis', type: 'text', default: '30 jours' },
            { name: 'prestation1_nom', label: 'Prestation 1 : Désignation', type: 'text', default: 'Prestation 1 - Description détaillée' },
            { name: 'prestation1_qty', label: 'Prestation 1 : Quantité', type: 'text', default: '1' },
            { name: 'prestation1_prix', label: 'Prestation 1 : Prix unitaire', type: 'text', default: '500 000 FCFA' },
            { name: 'prestation1_total', label: 'Prestation 1 : Total', type: 'text', default: '500 000 FCFA' },
            { name: 'prestation2_nom', label: 'Prestation 2 : Désignation', type: 'text', default: 'Prestation 2 - Description détaillée' },
            { name: 'prestation2_qty', label: 'Prestation 2 : Quantité', type: 'text', default: '2' },
            { name: 'prestation2_prix', label: 'Prestation 2 : Prix unitaire', type: 'text', default: '300 000 FCFA' },
            { name: 'prestation2_total', label: 'Prestation 2 : Total', type: 'text', default: '600 000 FCFA' },
            { name: 'prestation3_nom', label: 'Prestation 3 : Désignation', type: 'text', default: 'Prestation 3 - Description détaillée' },
            { name: 'prestation3_qty', label: 'Prestation 3 : Quantité', type: 'text', default: '1' },
            { name: 'prestation3_prix', label: 'Prestation 3 : Prix unitaire', type: 'text', default: '200 000 FCFA' },
            { name: 'prestation3_total', label: 'Prestation 3 : Total', type: 'text', default: '200 000 FCFA' },
            { name: 'total_ht', label: 'Total HT', type: 'text', default: '1 300 000 FCFA' },
            { name: 'tva', label: 'TVA (18%)', type: 'text', default: '234 000 FCFA' },
            { name: 'total_ttc', label: 'TOTAL TTC', type: 'text', default: '1 534 000 FCFA' },
            { name: 'conditions', label: 'Conditions générales', type: 'textarea', default: 'Mode de paiement : 50% à la commande, 50% à la livraison. Délai de réalisation : 30 jours. Ce devis est valable 30 jours à compter de sa date d\'émission.' }
        ],

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
                        <div class="devis-total-row"><span>Total HT</span><span id="field-total_ht">1 300 000 FCFA</span></div>
                        <div class="devis-total-row"><span>TVA (18%)</span><span id="field-tva">234 000 FCFA</span></div>
                        <div class="devis-total-row final"><span>TOTAL TTC</span><span id="field-total_ttc">1 534 000 FCFA</span></div>
                    </div>
                </div>
                <div class="devis-conditions">
                    <div class="devis-conditions-title">Conditions</div>
                    <div class="devis-conditions-text" id="field-conditions">Mode de paiement : 50% à la commande, 50% à la livraison. Délai de réalisation : 30 jours. Ce devis est valable 30 jours à compter de sa date d'émission.</div>
                </div>
                <div class="devis-footer">Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com</div>
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
        
        fields: [
            { name: 'entreprise_nom', label: 'Nom de votre entreprise', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'entreprise_adresse', label: 'Adresse', type: 'text', default: '123 Avenue de l\'Indépendance, Brazzaville' },
            { name: 'entreprise_telephone', label: 'Téléphone', type: 'tel', default: '+242 06 000 00 00' },
            { name: 'entreprise_email', label: 'Email', type: 'email', default: 'contact@entreprise.com' },
            { name: 'entreprise_nif', label: 'Numéro NIF', type: 'text', default: '123456789' },
            { name: 'client_nom', label: 'Nom du client', type: 'text', default: 'Monsieur le Client' },
            { name: 'client_adresse', label: 'Adresse du client', type: 'text', default: 'Adresse du client' },
            { name: 'client_telephone', label: 'Téléphone du client', type: 'tel', default: '+242 06 000 00 00' },
            { name: 'client_email', label: 'Email du client', type: 'email', default: 'client@email.com' },
            { name: 'facture_numero', label: 'Numéro de facture', type: 'text', default: 'FAC-2026-001' },
            { name: 'date_emission', label: 'Date d\'émission', type: 'text', default: '04/10/2026' },
            { name: 'date_echeance', label: 'Date d\'échéance', type: 'text', default: '04/11/2026' },
            { name: 'article1_nom', label: 'Article 1 : Désignation', type: 'text', default: 'Article 1 - Description' },
            { name: 'article1_qty', label: 'Article 1 : Quantité', type: 'text', default: '1' },
            { name: 'article1_prix', label: 'Article 1 : Prix unitaire', type: 'text', default: '500 000 FCFA' },
            { name: 'article1_total', label: 'Article 1 : Total', type: 'text', default: '500 000 FCFA' },
            { name: 'article2_nom', label: 'Article 2 : Désignation', type: 'text', default: 'Article 2 - Description' },
            { name: 'article2_qty', label: 'Article 2 : Quantité', type: 'text', default: '2' },
            { name: 'article2_prix', label: 'Article 2 : Prix unitaire', type: 'text', default: '300 000 FCFA' },
            { name: 'article2_total', label: 'Article 2 : Total', type: 'text', default: '600 000 FCFA' },
            { name: 'article3_nom', label: 'Article 3 : Désignation', type: 'text', default: 'Article 3 - Description' },
            { name: 'article3_qty', label: 'Article 3 : Quantité', type: 'text', default: '1' },
            { name: 'article3_prix', label: 'Article 3 : Prix unitaire', type: 'text', default: '200 000 FCFA' },
            { name: 'article3_total', label: 'Article 3 : Total', type: 'text', default: '200 000 FCFA' },
            { name: 'total_ht', label: 'Total HT', type: 'text', default: '1 300 000 FCFA' },
            { name: 'tva', label: 'TVA (18%)', type: 'text', default: '234 000 FCFA' },
            { name: 'total_ttc', label: 'TOTAL TTC', type: 'text', default: '1 534 000 FCFA' },
            { name: 'info_paiement', label: 'Informations de paiement', type: 'textarea', default: 'Mode de paiement : Virement bancaire ou Mobile Money. Compte : 1234567890. Banque : BICICI.' }
        ],

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
                        <div class="facture-total-row"><span>Total HT</span><span id="field-total_ht">1 300 000 FCFA</span></div>
                        <div class="facture-total-row"><span>TVA (18%)</span><span id="field-tva">234 000 FCFA</span></div>
                        <div class="facture-total-row final"><span>TOTAL TTC</span><span id="field-total_ttc">1 534 000 FCFA</span></div>
                    </div>
                </div>
                <div class="facture-paiement">
                    <div class="facture-paiement-title">Informations de paiement</div>
                    <div class="facture-paiement-info" id="field-info_paiement">Mode de paiement : Virement bancaire ou Mobile Money. Compte : 1234567890. Banque : BICICI.</div>
                </div>
                <div class="facture-footer">Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com</div>
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
        
        fields: [
            { name: 'mairie_nom', label: 'Nom de la mairie', type: 'text', default: 'Mairie de Brazzaville' },
            { name: 'signataire_nom', label: 'Nom du signataire', type: 'text', default: 'Monsieur le Maire' },
            { name: 'signataire_fonction', label: 'Fonction du signataire', type: 'text', default: 'Maire de la commune de Brazzaville' },
            { name: 'resident_nom', label: 'Nom du résident', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'resident_naissance', label: 'Date de naissance', type: 'text', default: '01/01/1990' },
            { name: 'resident_lieu_naissance', label: 'Lieu de naissance', type: 'text', default: 'Brazzaville' },
            { name: 'resident_cni', label: 'Numéro CNI', type: 'text', default: '123456789' },
            { name: 'resident_adresse', label: 'Adresse de résidence', type: 'text', default: '123 Quartier Poto-Poto, Brazzaville' },
            { name: 'resident_date_arrivee', label: 'Date d\'arrivée', type: 'text', default: '01/01/2020' },
            { name: 'resident_duree', label: 'Durée de résidence', type: 'text', default: '6 ans' },
            { name: 'quartier', label: 'Quartier', type: 'text', default: 'Poto-Poto' },
            { name: 'arrondissement', label: 'Arrondissement', type: 'text', default: '3ème' },
            { name: 'telephone_contact', label: 'Téléphone de contact', type: 'tel', default: '+242 06 518 69 67' },
            { name: 'ville', label: 'Ville', type: 'text', default: 'Brazzaville' },
            { name: 'date', label: 'Date', type: 'text', default: '04 octobre 2026' },
            { name: 'signataire_nom2', label: 'Signature : Nom', type: 'text', default: 'Monsieur le Maire' },
            { name: 'signataire_fonction2', label: 'Signature : Fonction', type: 'text', default: 'Maire de la commune' }
        ],

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

// --- DOCUMENT 17 : Certificat Médical ---
export function getTemplate_Certificat_Medical() {
    return {
        id: 'certificat_medical',
        name: 'Certificat Médical',
        category: 'attestation',
        price: 1000,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Modèle de certificat médical pour aptitude au travail ou au sport.',
        
        fields: [
            { name: 'medecin_nom', label: 'Nom du médecin (en-tête)', type: 'text', default: 'Dr. Meurphy TALAMIO' },
            { name: 'medecin_adresse', label: 'Adresse du cabinet', type: 'text', default: '123 Avenue de l\'Indépendance, Brazzaville' },
            { name: 'medecin_telephone', label: 'Téléphone du cabinet', type: 'tel', default: '+242 06 000 00 00' },
            { name: 'medecin_ordre', label: 'Numéro Ordre des Médecins', type: 'text', default: '12345' },
            { name: 'medecin_nom2', label: 'Nom du médecin (dans le texte)', type: 'text', default: 'Dr. Meurphy TALAMIO' },
            { name: 'patient_nom', label: 'Nom du patient', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'patient_naissance', label: 'Date de naissance du patient', type: 'text', default: '01/01/1990' },
            { name: 'patient_lieu', label: 'Lieu de naissance', type: 'text', default: 'Brazzaville' },
            { name: 'patient_cni', label: 'Numéro CNI du patient', type: 'text', default: '123456789' },
            { name: 'constat', label: 'Constatations et aptitude', type: 'textarea', default: 'L\'examen clinique ne révèle aucune contre-indication apparente à la pratique de l\'activité professionnelle / sportive demandée. L\'intéressé(e) est déclaré(e) apte à ce jour.' },
            { name: 'ville', label: 'Ville', type: 'text', default: 'Brazzaville' },
            { name: 'date', label: 'Date', type: 'text', default: '04 octobre 2026' },
            { name: 'medecin_nom3', label: 'Signature du médecin', type: 'text', default: 'Dr. Meurphy TALAMIO' }
        ],

        cssStyles: `
            .certif-med-container { width: 210mm; min-height: 297mm; background: white; padding: 60px 70px; font-family: 'Times New Roman', 'Georgia', serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); line-height: 1.8; }
            .certif-med-header { text-align: center; margin-bottom: 50px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .certif-med-doctor { font-size: 1.5rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; }
            .certif-med-info { font-size: 0.95rem; color: #64748b; line-height: 1.6; }
            .certif-med-titre { text-align: center; font-size: 2rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 3px; margin: 40px 0; text-decoration: underline; text-underline-offset: 8px; }
            .certif-med-corps { font-size: 1.1rem; line-height: 2; text-align: justify; margin-bottom: 30px; }
            .certif-med-corps p { margin-bottom: 20px; text-indent: 40px; }
            .certif-med-info-patient { font-weight: 700; color: var(--doc-primary-color, #0F172A); }
            .certif-med-constat { background: #f0fdf4; border: 2px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 8px; }
            .certif-med-constat-title { font-weight: 700; color: #065f46; margin-bottom: 10px; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px; }
            .certif-med-date-lieu { text-align: right; font-size: 1.05rem; margin: 40px 0; font-style: italic; }
            .certif-med-signature { margin-top: 60px; text-align: right; }
            .certif-med-signature-label { font-size: 1rem; color: #64748b; margin-bottom: 80px; }
            .certif-med-signature-nom { font-size: 1.1rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); border-top: 2px solid var(--doc-primary-color, #0F172A); display: inline-block; padding-top: 10px; min-width: 200px; }
            .certif-med-footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.85rem; color: #94a3b8; font-style: italic; }
        `,
        htmlStructure: `
            <div class="certif-med-container">
                <header class="certif-med-header">
                    <div class="certif-med-doctor" id="field-medecin_nom">Dr. Meurphy TALAMIO</div>
                    <div class="certif-med-info">
                        <div id="field-medecin_adresse">123 Avenue de l'Indépendance, Brazzaville</div>
                        <div>Tél: <span id="field-medecin_telephone">+242 06 000 00 00</span> | Ordre des Médecins n° <span id="field-medecin_ordre">12345</span></div>
                    </div>
                </header>
                <h1 class="certif-med-titre">Certificat Médical</h1>
                <div class="certif-med-corps">
                    <p>Je soussigné(e), <span class="certif-med-info-patient" id="field-medecin_nom2">Dr. Meurphy TALAMIO</span>, docteur en médecine, certifie avoir examiné ce jour :</p>
                    <p>Monsieur/Madame <span class="certif-med-info-patient" id="field-patient_nom">Meurphy TALAMIO</span>, né(e) le <span class="certif-med-info-patient" id="field-patient_naissance">01/01/1990</span> à <span class="certif-med-info-patient" id="field-patient_lieu">Brazzaville</span>, titulaire de la CNI n° <span class="certif-med-info-patient" id="field-patient_cni">123456789</span>.</p>
                </div>
                <div class="certif-med-constat">
                    <div class="certif-med-constat-title">Constatations et Aptitude</div>
                    <p style="margin: 0; color: #065f46;" id="field-constat">L'examen clinique ne révèle aucune contre-indication apparente à la pratique de l'activité professionnelle / sportive demandée. L'intéressé(e) est déclaré(e) apte à ce jour.</p>
                </div>
                <div class="certif-med-corps">
                    <p>Ce certificat est délivré à la demande de l'intéressé(e) pour servir et valoir ce que de droit.</p>
                </div>
                <div class="certif-med-date-lieu">Fait à <span id="field-ville">Brazzaville</span>, le <span id="field-date">04 octobre 2026</span></div>
                <div class="certif-med-signature">
                    <div class="certif-med-signature-label">Le Médecin</div>
                    <div class="certif-med-signature-nom" id="field-medecin_nom3">Dr. Meurphy TALAMIO</div>
                </div>
                <div class="certif-med-footer">Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com</div>
            </div>
        `
    };
}

// --- DOCUMENT 18 : Rapport d'Activité ---
export function getTemplate_Rapport_Activite() {
    return {
        id: 'rapport_activite',
        name: 'Rapport d\'Activité',
        category: 'administratif',
        price: 1200,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Modèle professionnel pour rendre compte d\'une période d\'activité.',
        
        fields: [
            { name: 'entreprise_nom', label: 'Nom de l\'entreprise', type: 'text', default: 'ENTREPRISE XYZ' },
            { name: 'employe_nom', label: 'Nom du rédacteur', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'employe_poste', label: 'Poste du rédacteur', type: 'text', default: 'Directeur Général' },
            { name: 'periode_debut', label: 'Date de début de période', type: 'text', default: '01/01/2026' },
            { name: 'periode_fin', label: 'Date de fin de période', type: 'text', default: '30/09/2026' },
            { name: 'introduction', label: 'Introduction', type: 'textarea', default: 'Ce rapport a pour objet de présenter les activités menées et les résultats obtenus au cours de la période spécifiée. Il met en lumière les réalisations majeures et les perspectives d\'avenir.' },
            { name: 'activite1', label: 'Activité principale 1', type: 'text', default: 'Mise en place de la nouvelle stratégie commerciale et augmentation du portefeuille client de 20%.' },
            { name: 'activite2', label: 'Activité principale 2', type: 'text', default: 'Optimisation des processus internes ayant permis une réduction des coûts opérationnels de 15%.' },
            { name: 'activite3', label: 'Activité principale 3', type: 'text', default: 'Recrutement et formation d\'une nouvelle équipe de 5 collaborateurs.' },
            { name: 'resultats', label: 'Résultats et bilan', type: 'textarea', default: 'Les objectifs fixés en début de période ont été globalement atteints. Le chiffre d\'affaires a connu une croissance de 12% par rapport à l\'année précédente, dépassant les prévisions initiales.' },
            { name: 'conclusion', label: 'Conclusion et perspectives', type: 'textarea', default: 'La période écoulée a été marquée par une croissance solide et une structuration efficace de l\'entreprise. Les perspectives pour le prochain trimestre sont encourageantes, avec plusieurs projets majeurs en cours de finalisation.' },
            { name: 'ville', label: 'Ville', type: 'text', default: 'Brazzaville' },
            { name: 'date', label: 'Date', type: 'text', default: '04 octobre 2026' }
        ],

        cssStyles: `
            .rapport-container { width: 210mm; min-height: 297mm; background: white; padding: 60px 70px; font-family: 'Inter', sans-serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); line-height: 1.7; }
            .rapport-header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid var(--doc-primary-color, #0F172A); }
            .rapport-entreprise { font-size: 1.5rem; font-weight: 800; color: var(--doc-primary-color, #0F172A); margin-bottom: 10px; }
            .rapport-titre { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 30px 0; text-transform: uppercase; letter-spacing: 1px; }
            .rapport-meta { display: flex; justify-content: space-between; margin-bottom: 40px; padding: 20px; background: #f8fafc; border-radius: 8px; }
            .rapport-meta-item { flex: 1; }
            .rapport-meta-label { font-size: 0.85rem; color: #64748b; text-transform: uppercase; margin-bottom: 5px; font-weight: 600; }
            .rapport-meta-value { font-size: 1rem; font-weight: 600; color: #0f172a; }
            .rapport-section { margin-bottom: 30px; }
            .rapport-section-title { font-size: 1.2rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
            .rapport-text { font-size: 1rem; line-height: 1.8; color: #475569; text-align: justify; }
            .rapport-list { list-style: disc; margin-left: 20px; margin-bottom: 15px; }
            .rapport-list li { margin-bottom: 8px; color: #475569; }
            .rapport-footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.85rem; color: #94a3b8; }
        `,
        htmlStructure: `
            <div class="rapport-container">
                <header class="rapport-header">
                    <div class="rapport-entreprise" id="field-entreprise_nom">ENTREPRISE XYZ</div>
                    <div class="rapport-titre">Rapport d'Activité</div>
                </header>
                <div class="rapport-meta">
                    <div class="rapport-meta-item">
                        <div class="rapport-meta-label">Rédigé par</div>
                        <div class="rapport-meta-value" id="field-employe_nom">Meurphy TALAMIO</div>
                        <div style="font-size: 0.9rem; color: #64748b;" id="field-employe_poste">Directeur Général</div>
                    </div>
                    <div class="rapport-meta-item">
                        <div class="rapport-meta-label">Période concernée</div>
                        <div class="rapport-meta-value">Du <span id="field-periode_debut">01/01/2026</span></div>
                        <div class="rapport-meta-value">Au <span id="field-periode_fin">30/09/2026</span></div>
                    </div>
                </div>
                <div class="rapport-section">
                    <div class="rapport-section-title">1. Introduction</div>
                    <p class="rapport-text" id="field-introduction">Ce rapport a pour objet de présenter les activités menées et les résultats obtenus au cours de la période spécifiée. Il met en lumière les réalisations majeures et les perspectives d'avenir.</p>
                </div>
                <div class="rapport-section">
                    <div class="rapport-section-title">2. Activités Principales</div>
                    <ul class="rapport-list">
                        <li id="field-activite1">Mise en place de la nouvelle stratégie commerciale et augmentation du portefeuille client de 20%.</li>
                        <li id="field-activite2">Optimisation des processus internes ayant permis une réduction des coûts opérationnels de 15%.</li>
                        <li id="field-activite3">Recrutement et formation d'une nouvelle équipe de 5 collaborateurs.</li>
                    </ul>
                </div>
                <div class="rapport-section">
                    <div class="rapport-section-title">3. Résultats et Bilan</div>
                    <p class="rapport-text" id="field-resultats">Les objectifs fixés en début de période ont été globalement atteints. Le chiffre d'affaires a connu une croissance de 12% par rapport à l'année précédente, dépassant les prévisions initiales.</p>
                </div>
                <div class="rapport-section">
                    <div class="rapport-section-title">4. Conclusion et Perspectives</div>
                    <p class="rapport-text" id="field-conclusion">La période écoulée a été marquée par une croissance solide et une structuration efficace de l'entreprise. Les perspectives pour le prochain trimestre sont encourageantes, avec plusieurs projets majeurs en cours de finalisation.</p>
                </div>
                <div style="text-align: right; margin-top: 40px; font-style: italic; color: #64748b;">
                    Fait à <span id="field-ville">Brazzaville</span>, le <span id="field-date">04 octobre 2026</span>
                </div>
                <div class="rapport-footer">Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com</div>
            </div>
        `
    };
}

// --- DOCUMENT 19 : Procuration ---
export function getTemplate_Procuration() {
    return {
        id: 'procuration',
        name: 'Procuration',
        category: 'administratif',
        price: 1000,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Modèle de procuration pour représenter une personne dans des démarches.',
        
        fields: [
            { name: 'mandant_nom', label: 'Nom du mandant', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'mandant_naissance', label: 'Date de naissance du mandant', type: 'text', default: '01/01/1990' },
            { name: 'mandant_lieu', label: 'Lieu de naissance du mandant', type: 'text', default: 'Brazzaville' },
            { name: 'mandant_cni', label: 'Numéro CNI du mandant', type: 'text', default: '123456789' },
            { name: 'mandant_adresse', label: 'Adresse du mandant', type: 'text', default: '123 Quartier Poto-Poto, Brazzaville' },
            { name: 'mandataire_nom', label: 'Nom du mandataire', type: 'text', default: 'Jean DUPONT' },
            { name: 'mandataire_naissance', label: 'Date de naissance du mandataire', type: 'text', default: '15/05/1985' },
            { name: 'mandataire_lieu', label: 'Lieu de naissance du mandataire', type: 'text', default: 'Pointe-Noire' },
            { name: 'mandataire_cni', label: 'Numéro CNI du mandataire', type: 'text', default: '987654321' },
            { name: 'mandataire_adresse', label: 'Adresse du mandataire', type: 'text', default: '456 Avenue de la Paix, Pointe-Noire' },
            { name: 'objet_procuration', label: 'Objet et étendue des pouvoirs', type: 'textarea', default: 'Effectuer toutes les démarches nécessaires auprès de l\'administration pour le retrait de mon passeport, signer tous les documents afférents à cette demande, et percevoir le document une fois établi.' },
            { name: 'duree_validite', label: 'Durée de validité', type: 'text', default: '3 mois' },
            { name: 'ville', label: 'Ville', type: 'text', default: 'Brazzaville' },
            { name: 'date', label: 'Date', type: 'text', default: '04 octobre 2026' },
            { name: 'mandant_nom2', label: 'Signature du mandant', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'mandataire_nom2', label: 'Signature du mandataire', type: 'text', default: 'Jean DUPONT' }
        ],

        cssStyles: `
            .procuration-container { width: 210mm; min-height: 297mm; background: white; padding: 60px 70px; font-family: 'Times New Roman', 'Georgia', serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); line-height: 1.8; }
            .procuration-titre { text-align: center; font-size: 2rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 3px; margin: 40px 0; text-decoration: underline; text-underline-offset: 8px; }
            .procuration-corps { font-size: 1.1rem; line-height: 2; text-align: justify; margin-bottom: 30px; }
            .procuration-corps p { margin-bottom: 20px; text-indent: 40px; }
            .procuration-info { font-weight: 700; color: var(--doc-primary-color, #0F172A); }
            .procuration-pouvoirs { background: #fef3c7; border-left: 4px solid #d97706; padding: 20px; margin: 30px 0; }
            .procuration-pouvoirs-title { font-weight: 700; color: #92400e; margin-bottom: 10px; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px; }
            .procuration-date-lieu { text-align: right; font-size: 1.05rem; margin: 40px 0; font-style: italic; }
            .procuration-signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .procuration-signature-block { text-align: center; }
            .procuration-signature-label { font-size: 1rem; color: #64748b; margin-bottom: 80px; font-weight: 600; }
            .procuration-signature-line { border-top: 2px solid var(--doc-primary-color, #0F172A); padding-top: 10px; font-weight: 700; color: var(--doc-primary-color, #0F172A); font-size: 1.1rem; }
            .procuration-footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.85rem; color: #94a3b8; font-style: italic; }
        `,
        htmlStructure: `
            <div class="procuration-container">
                <h1 class="procuration-titre">Procuration</h1>
                <div class="procuration-corps">
                    <p>Je soussigné(e), <span class="procuration-info" id="field-mandant_nom">Meurphy TALAMIO</span>, né(e) le <span class="procuration-info" id="field-mandant_naissance">01/01/1990</span> à <span class="procuration-info" id="field-mandant_lieu">Brazzaville</span>, titulaire de la CNI n° <span class="procuration-info" id="field-mandant_cni">123456789</span>, demeurant au <span class="procuration-info" id="field-mandant_adresse">123 Quartier Poto-Poto, Brazzaville</span>,</p>
                    <p>Donne par la présente procuration à :</p>
                    <p>Monsieur/Madame <span class="procuration-info" id="field-mandataire_nom">Jean DUPONT</span>, né(e) le <span class="procuration-info" id="field-mandataire_naissance">15/05/1985</span> à <span class="procuration-info" id="field-mandataire_lieu">Pointe-Noire</span>, titulaire de la CNI n° <span class="procuration-info" id="field-mandataire_cni">987654321</span>, demeurant au <span class="procuration-info" id="field-mandataire_adresse">456 Avenue de la Paix, Pointe-Noire</span>,</p>
                    <p>Pour me représenter et agir en mon nom et pour mon compte dans le cadre suivant :</p>
                </div>
                <div class="procuration-pouvoirs">
                    <div class="procuration-pouvoirs-title">Objet et étendue des pouvoirs</div>
                    <p style="margin: 0; color: #92400e; text-indent: 0;" id="field-objet_procuration">Effectuer toutes les démarches nécessaires auprès de l'administration pour le retrait de mon passeport, signer tous les documents afférents à cette demande, et percevoir le document une fois établi.</p>
                </div>
                <div class="procuration-corps">
                    <p>Cette procuration est valable pour une durée de <span class="procuration-info" id="field-duree_validite">3 mois</span> à compter de sa date de signature.</p>
                    <p>Pour servir et valoir ce que de droit.</p>
                </div>
                <div class="procuration-date-lieu">Fait à <span id="field-ville">Brazzaville</span>, le <span id="field-date">04 octobre 2026</span></div>
                <div class="procuration-signatures">
                    <div class="procuration-signature-block">
                        <div class="procuration-signature-label">Le Mandant (Signature précédée de "Bon pour pouvoir")</div>
                        <div class="procuration-signature-line" id="field-mandant_nom2">Meurphy TALAMIO</div>
                    </div>
                    <div class="procuration-signature-block">
                        <div class="procuration-signature-label">Le Mandataire (Signature précédée de "Bon pour acceptation")</div>
                        <div class="procuration-signature-line" id="field-mandataire_nom2">Jean DUPONT</div>
                    </div>
                </div>
                <div class="procuration-footer">Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com</div>
            </div>
        `
    };
}

// --- DOCUMENT 20 : Déclaration sur l'Honneur ---
export function getTemplate_Declaration_Honneur() {
    return {
        id: 'declaration_sur_honneur',
        name: 'Déclaration sur l\'Honneur',
        category: 'administratif',
        price: 800,
        hasPhoto: false,
        hasColorPicker: true,
        description: 'Modèle officiel de déclaration sur l\'honneur pour démarches administratives.',
        
        fields: [
            { name: 'declarant_nom', label: 'Nom du déclarant', type: 'text', default: 'Meurphy TALAMIO' },
            { name: 'declarant_naissance', label: 'Date de naissance', type: 'text', default: '01/01/1990' },
            { name: 'declarant_lieu', label: 'Lieu de naissance', type: 'text', default: 'Brazzaville' },
            { name: 'declarant_cni', label: 'Numéro CNI', type: 'text', default: '123456789' },
            { name: 'declarant_adresse', label: 'Adresse', type: 'text', default: '123 Quartier Poto-Poto, Brazzaville' },
            { name: 'objet_declaration', label: 'Objet de la déclaration', type: 'textarea', default: 'je suis actuellement sans emploi et ne perçois aucune rémunération professionnelle.' },
            { name: 'texte_complementaire', label: 'Texte complémentaire', type: 'textarea', default: 'Cette déclaration est établie pour servir et valoir ce que de droit, notamment dans le cadre de ma demande d\'inscription aux services sociaux.' },
            { name: 'ville', label: 'Ville', type: 'text', default: 'Brazzaville' },
            { name: 'date', label: 'Date', type: 'text', default: '04 octobre 2026' },
            { name: 'declarant_nom2', label: 'Signature du déclarant', type: 'text', default: 'Meurphy TALAMIO' }
        ],

        cssStyles: `
            .decl-container { width: 210mm; min-height: 297mm; background: white; padding: 60px 70px; font-family: 'Times New Roman', 'Georgia', serif; color: #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.1); line-height: 1.8; }
            .decl-titre { text-align: center; font-size: 2rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); text-transform: uppercase; letter-spacing: 3px; margin: 40px 0; text-decoration: underline; text-underline-offset: 8px; }
            .decl-corps { font-size: 1.1rem; line-height: 2; text-align: justify; margin-bottom: 30px; }
            .decl-corps p { margin-bottom: 20px; text-indent: 40px; }
            .decl-info { font-weight: 700; color: var(--doc-primary-color, #0F172A); }
            .decl-objet-box { background: #f0f9ff; border: 2px solid #0ea5e9; padding: 20px; margin: 30px 0; border-radius: 8px; text-align: center; }
            .decl-objet-title { font-weight: 700; color: #0369a1; margin-bottom: 10px; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px; }
            .decl-objet-text { font-size: 1.1rem; color: #0c4a6e; font-weight: 600; }
            .decl-mention-legale { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 30px 0; font-size: 0.95rem; color: #991b1b; font-style: italic; }
            .decl-date-lieu { text-align: right; font-size: 1.05rem; margin: 40px 0; font-style: italic; }
            .decl-signature { margin-top: 60px; text-align: right; }
            .decl-signature-label { font-size: 1rem; color: #64748b; margin-bottom: 80px; }
            .decl-signature-nom { font-size: 1.1rem; font-weight: 700; color: var(--doc-primary-color, #0F172A); border-top: 2px solid var(--doc-primary-color, #0F172A); display: inline-block; padding-top: 10px; min-width: 200px; }
            .decl-footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.85rem; color: #94a3b8; font-style: italic; }
        `,
        htmlStructure: `
            <div class="decl-container">
                <h1 class="decl-titre">Déclaration sur l'Honneur</h1>
                <div class="decl-corps">
                    <p>Je soussigné(e), <span class="decl-info" id="field-declarant_nom">Meurphy TALAMIO</span>, né(e) le <span class="decl-info" id="field-declarant_naissance">01/01/1990</span> à <span class="decl-info" id="field-declarant_lieu">Brazzaville</span>, titulaire de la CNI n° <span class="decl-info" id="field-declarant_cni">123456789</span>, demeurant au <span class="decl-info" id="field-declarant_adresse">123 Quartier Poto-Poto, Brazzaville</span>,</p>
                </div>
                <div class="decl-objet-box">
                    <div class="decl-objet-title">Déclare sur l'honneur que</div>
                    <div class="decl-objet-text" id="field-objet_declaration">je suis actuellement sans emploi et ne perçois aucune rémunération professionnelle.</div>
                </div>
                <div class="decl-corps">
                    <p id="field-texte_complementaire">Cette déclaration est établie pour servir et valoir ce que de droit, notamment dans le cadre de ma demande d'inscription aux services sociaux.</p>
                </div>
                <div class="decl-mention-legale">
                    J'ai pris connaissance que cette fausse déclaration m'expose aux sanctions pénales prévues par l'article 441-7 du Code pénal (fausse attestation ou certificat).
                </div>
                <div class="decl-date-lieu">Fait à <span id="field-ville">Brazzaville</span>, le <span id="field-date">04 octobre 2026</span></div>
                <div class="decl-signature">
                    <div class="decl-signature-label">Signature du déclarant</div>
                    <div class="decl-signature-nom" id="field-declarant_nom2">Meurphy TALAMIO</div>
                </div>
                <div class="decl-footer">Document généré par TakiDoc - L'équipe Meurphy | www.takidoc.onrender.com</div>
            </div>
        `
    };
}

// ============================================
// FONCTION GÉNÉRIQUE POUR LETTRES (Documents 21 à 30)
// Génère automatiquement le tableau fields à partir des sections
// ============================================
function buildTakiDocLetter({ id, name, price, description, title, intro, sections, closing = 'Je vous remercie de l\'attention portée à ma demande et vous prie d\'agréer l\'expression de mes salutations distinguées.' }) {
    const prefix = `td-${id.replace(/[^a-z0-9-]/gi, '-')}`;
    
    // Construction automatique du tableau fields
    const fields = [
        { name: `${id}_expediteur`, label: 'Nom de l\'expéditeur', type: 'text', default: 'Meurphy TALAMIO' },
        { name: `${id}_adresse`, label: 'Adresse de l\'expéditeur', type: 'text', default: '123 Quartier Poto-Poto, Brazzaville' },
        { name: `${id}_telephone`, label: 'Téléphone', type: 'tel', default: '+242 06 518 69 67' },
        { name: `${id}_email`, label: 'Email', type: 'email', default: 'brazzamarket.infos@gmail.com' },
        { name: `${id}_destinataire`, label: 'Nom du destinataire', type: 'text', default: 'Nom du destinataire / Service concerné' },
        { name: `${id}_organisation`, label: 'Organisation / Entreprise', type: 'text', default: 'Entreprise Cible' },
        { name: `${id}_adresse_destinataire`, label: 'Adresse du destinataire', type: 'text', default: 'Adresse du destinataire' },
        { name: `${id}_ville`, label: 'Ville', type: 'text', default: 'Brazzaville' },
        { name: `${id}_date`, label: 'Date', type: 'text', default: '04 octobre 2026' },
        { name: `${id}_objet`, label: 'Objet de la lettre', type: 'text', default: title }
    ];
    
    // Ajout des champs des sections
    sections.forEach((s, i) => {
        fields.push({
            name: s.key,
            label: `Paragraphe ${i + 1} : ${s.label || s.key.replace(id + '_', '')}`,
            type: 'textarea',
            default: s.value
        });
    });
    
    fields.push({ name: `${id}_signature`, label: 'Signature', type: 'text', default: 'Meurphy TALAMIO' });
    
    const field = (key, fallback) => `<span class="${prefix}-value" id="field-${key}">${fallback}</span>`;
    const bodySections = sections.map((s, i) => `
        <p>${s.before || ''}${field(s.key, s.value)}${s.after || ''}</p>`).join('');
    
    return {
        id, name, category: 'lettre', price,
        hasPhoto: false, hasColorPicker: true, description,
        fields, // ← LE TABLEAU GÉNÉRÉ AUTOMATIQUEMENT
        cssStyles: `
            .${prefix}-page { box-sizing: border-box; width: 210mm; min-height: 297mm; padding: 24mm 23mm; background: #fff; color: #1f2937; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.75; }
            .${prefix}-top { border-bottom: 3px solid var(--doc-primary-color, #ea580c); padding-bottom: 14px; margin-bottom: 30px; }
            .${prefix}-brand { color: var(--doc-primary-color, #ea580c); font-size: 9pt; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
            .${prefix}-sender { margin-top: 10px; font-size: 10pt; line-height: 1.55; }
            .${prefix}-recipient { margin: 26px 0 22px auto; width: 65%; padding: 12px 16px; background: #f8fafc; border-left: 3px solid var(--doc-primary-color, #ea580c); }
            .${prefix}-date { text-align: right; margin: 24px 0; font-style: italic; }
            .${prefix}-title { text-align: center; color: var(--doc-primary-color, #0f172a); font-size: 16pt; line-height: 1.35; margin: 28px 0; font-weight: 700; text-transform: uppercase; }
            .${prefix}-body p { margin: 0 0 15px; text-align: justify; }
            .${prefix}-subject { margin: 18px 0; font-weight: 700; }
            .${prefix}-signature { margin-top: 38px; margin-left: auto; width: 55%; text-align: center; min-height: 85px; }
            .${prefix}-signature-name { border-top: 1px solid #64748b; padding-top: 8px; font-weight: 700; }
            .${prefix}-footer { border-top: 1px solid #e5e7eb; margin-top: 40px; padding-top: 10px; text-align: center; color: #94a3b8; font-size: 8pt; }
        `,
        htmlStructure: `
            <article class="${prefix}-page">
                <header class="${prefix}-top">
                    <div class="${prefix}-brand">TakiDoc · Courrier professionnel</div>
                    <div class="${prefix}-sender">
                        <strong id="field-${id}_expediteur">Nom et prénom de l'expéditeur</strong><br>
                        <span id="field-${id}_adresse">Adresse complète</span><br>
                        Tél. : <span id="field-${id}_telephone">+242 06 000 00 00</span><br>
                        E-mail : <span id="field-${id}_email">adresse@email.com</span>
                    </div>
                </header>
                <div class="${prefix}-recipient">
                    <strong>À l'attention de :</strong><br>
                    <span id="field-${id}_destinataire">Nom du destinataire / Service concerné</span><br>
                    <span id="field-${id}_organisation">Organisation / Entreprise</span><br>
                    <span id="field-${id}_adresse_destinataire">Adresse du destinataire</span>
                </div>
                <div class="${prefix}-date">Fait à <span id="field-${id}_ville">Brazzaville</span>, le <span id="field-${id}_date">[date]</span></div>
                <h1 class="${prefix}-title">${title}</h1>
                <div class="${prefix}-subject">Objet : <span id="field-${id}_objet">${title}</span></div>
                <div class="${prefix}-body">
                    <p>${intro}</p>
                    ${bodySections}
                    <p>${closing}</p>
                </div>
                <div class="${prefix}-signature">
                    <div>Signature</div><br><br>
                    <div class="${prefix}-signature-name" id="field-${id}_signature">Nom et prénom</div>
                </div>
                <footer class="${prefix}-footer">Document personnalisable généré par TakiDoc · www.takidoc.onrender.com</footer>
            </article>
        `
    };
}

// DOCUMENT 21 — Lettre de démission
export function getTemplate_Lettre_Demission() {
    return buildTakiDocLetter({
        id: 'lettre_demission', name: 'Lettre de démission', price: 500,
        description: 'Modèle personnalisable de lettre de démission à adapter au contrat et aux règles applicables.',
        title: 'Lettre de démission',
        intro: 'Madame, Monsieur,',
        sections: [
            { key: 'lettre_demission_poste', value: 'Directeur Général', label: 'Poste occupé', before: 'Par la présente, je vous informe de ma décision de démissionner de mes fonctions de ', after: ' au sein de votre entreprise.' },
            { key: 'lettre_demission_preavis', value: '3 mois', label: 'Durée du préavis', before: 'Conformément aux dispositions applicables à ma situation, mon préavis est de ', after: '. La date envisagée de fin de fonctions est le [date à confirmer].' },
            { key: 'lettre_demission_transition', value: 'Je reste disponible pour organiser la transmission de mes dossiers et faciliter la continuité du travail.', label: 'Transition', before: '', after: '' }
        ],
        closing: 'Je vous remercie pour l\'expérience acquise au sein de l\'entreprise et vous prie d\'agréer, Madame, Monsieur, mes salutations distinguées.'
    });
}

// DOCUMENT 22 — Demande de congé professionnel
export function getTemplate_Demande_Conge_Professionnel() {
    return buildTakiDocLetter({
        id: 'demande_conge_professionnel', name: 'Demande de congé professionnel', price: 500,
        description: 'Demande de congé adressée à un responsable hiérarchique, avec dates et motif à personnaliser.',
        title: 'Demande de congé', intro: 'Madame, Monsieur,',
        sections: [
            { key: 'conge_type', value: 'congé annuel', label: 'Type de congé', before: 'Je sollicite votre autorisation pour bénéficier d\'un ', after: '.' },
            { key: 'conge_dates', value: '01/11/2026 au 15/11/2026', label: 'Dates du congé', before: 'La période souhaitée s\'étend du ', after: ', soit 15 jour(s).' },
            { key: 'conge_motif', value: 'Vacances familiales', label: 'Motif du congé', before: 'Le motif de cette demande est : ', after: '. Je veillerai, avant mon départ, à organiser les tâches en cours avec mon équipe.' }
        ]
    });
}

// DOCUMENT 23 — Demande d'autorisation d'absence
export function getTemplate_Autorisation_Absence() {
    return buildTakiDocLetter({
        id: 'autorisation_absence', name: 'Demande d\'autorisation d\'absence', price: 500,
        description: 'Courrier pour demander une absence ponctuelle à son employeur ou responsable.',
        title: 'Demande d\'autorisation d\'absence', intro: 'Madame, Monsieur,',
        sections: [
            { key: 'absence_date', value: '15 octobre 2026 de 14h à 17h', label: 'Date et horaires', before: 'Je sollicite une autorisation d\'absence le ', after: '.' },
            { key: 'absence_motif', value: 'Rendez-vous médical', label: 'Motif de l\'absence', before: 'Cette absence est motivée par : ', after: '.' },
            { key: 'absence_organisation', value: 'Mes dossiers urgents seront traités par mon collègue avant mon départ', label: 'Organisation du travail', before: 'Pour limiter les conséquences sur le service, je propose l\'organisation suivante : ', after: '.' }
        ]
    });
}

// DOCUMENT 24 — Lettre de demande de stage
export function getTemplate_Demande_Stage() {
    return buildTakiDocLetter({
        id: 'lettre_demande_stage', name: 'Lettre de demande de stage', price: 500,
        description: 'Lettre de candidature pour un stage académique ou professionnel.',
        title: 'Demande de stage', intro: 'Madame, Monsieur,',
        sections: [
            { key: 'stage_formation', value: 'Master Management à l\'Université Marien Ngouabi', label: 'Formation en cours', before: 'Actuellement en formation en ', after: ', je souhaite effectuer un stage afin de développer mes compétences pratiques.' },
            { key: 'stage_domaine', value: 'Ressources Humaines', label: 'Domaine ou service souhaité', before: 'Je souhaiterais intégrer votre structure au sein du service ', after: ', pour une période allant du 01/01/2027 au 30/06/2027.' },
            { key: 'stage_competences', value: 'Gestion de projet, analyse de données, travail d\'équipe', label: 'Compétences et motivations', before: 'Sérieux(se), motivé(e) et désireux(se) d\'apprendre, je pourrais notamment contribuer grâce à : ', after: '.' }
        ],
        closing: 'Je me tiens à votre disposition pour un entretien et pour tout renseignement complémentaire. Veuillez agréer, Madame, Monsieur, mes salutations distinguées.'
    });
}

// DOCUMENT 25 — Lettre de candidature spontanée
export function getTemplate_Candidature_Spontanee() {
    return buildTakiDocLetter({
        id: 'candidature_spontanee', name: 'Lettre de candidature spontanée', price: 500,
        description: 'Candidature spontanée pour proposer son profil à une entreprise.',
        title: 'Candidature spontanée', intro: 'Madame, Monsieur,',
        sections: [
            { key: 'candidature_poste', value: 'Directeur Marketing', label: 'Poste ou domaine recherché', before: 'Je me permets de vous soumettre ma candidature pour une opportunité en ', after: ' au sein de votre structure.' },
            { key: 'candidature_experience', value: '10 ans d\'expérience en management d\'équipe et stratégie commerciale', label: 'Expériences et compétences', before: 'Mon parcours m\'a permis de développer les compétences suivantes : ', after: '.' },
            { key: 'candidature_valeur', value: 'accroître votre présence sur le marché national', label: 'Contribution possible', before: 'Je souhaite mettre ces acquis au service de votre organisation, notamment pour ', after: '.' }
        ]
    });
}

// DOCUMENT 26 — Lettre de remerciement professionnel
export function getTemplate_Remerciement_Professionnel() {
    return buildTakiDocLetter({
        id: 'remerciement_professionnel', name: 'Lettre de remerciement professionnel', price: 500,
        description: 'Lettre de remerciement après un entretien, une collaboration ou un appui professionnel.',
        title: 'Remerciements professionnels', intro: 'Madame, Monsieur,',
        sections: [
            { key: 'remerciement_occasion', value: 'l\'entretien d\'embauche du 01/10/2026', label: 'Occasion du remerciement', before: 'Je tiens à vous remercier sincèrement à la suite de ', after: '.' },
            { key: 'remerciement_detail', value: 'la qualité de nos échanges et la présentation détaillée du poste', label: 'Élément précis à remercier', before: 'J\'ai particulièrement apprécié ', after: ', qui a contribué positivement à cette expérience.' },
            { key: 'remerciement_suite', value: 'cette opportunité de collaboration', label: 'Suite souhaitée', before: 'Je serais heureux(se) de pouvoir poursuivre nos échanges concernant ', after: '.' }
        ]
    });
}

// DOCUMENT 27 — Lettre d'excuses professionnelle
export function getTemplate_Excuses_Professionnelles() {
    return buildTakiDocLetter({
        id: 'excuses_professionnelles', name: 'Lettre d\'excuses professionnelle', price: 500,
        description: 'Courrier professionnel pour reconnaître un désagrément et présenter ses excuses.',
        title: 'Lettre d\'excuses', intro: 'Madame, Monsieur,',
        sections: [
            { key: 'excuses_situation', value: 'le retard de livraison de votre commande du 15/09/2026', label: 'Situation concernée', before: 'Je vous présente mes excuses concernant ', after: '.' },
            { key: 'excuses_explication', value: 'un problème technique imprévu dans notre chaîne de production', label: 'Explication concise', before: 'Je comprends les désagréments occasionnés. Voici les éléments permettant de clarifier la situation : ', after: '.' },
            { key: 'excuses_mesures', value: 'renforcer notre contrôle qualité et ajouter une équipe de production', label: 'Mesures correctives', before: 'Afin d\'éviter que cela ne se reproduise, je prévois de prendre les mesures suivantes : ', after: '.' }
        ],
        closing: 'Je regrette sincèrement cette situation et vous remercie de votre compréhension. Je vous prie d\'agréer, Madame, Monsieur, mes salutations distinguées.'
    });
}

// DOCUMENT 28 — Lettre de relance administrative
export function getTemplate_Relance_Administrative() {
    return buildTakiDocLetter({
        id: 'relance_administrative', name: 'Lettre de relance administrative', price: 600,
        description: 'Relance polie au sujet d\'un dossier ou d\'une demande restée sans réponse.',
        title: 'Relance concernant un dossier', intro: 'Madame, Monsieur,',
        sections: [
            { key: 'relance_dossier', value: 'ma demande de permis de construire (réf. PC-2026-045)', label: 'Objet et référence du dossier', before: 'Je me permets de revenir vers vos services au sujet de ', after: '.' },
            { key: 'relance_depot', value: '15/08/2026', label: 'Date de dépôt', before: 'Cette demande a été déposée / transmise le ', after: ' et, à ce jour, je n\'ai pas encore reçu de retour.' },
            { key: 'relance_action', value: 'l\'obtention du permis de construire pour ma parcelle sise au Quartier Poto-Poto', label: 'Action attendue', before: 'Je vous serais reconnaissant(e) de bien vouloir m\'indiquer l\'état d\'avancement du dossier ou les éventuelles pièces complémentaires à fournir. Ma demande porte plus précisément sur : ', after: '.' }
        ]
    });
}

// DOCUMENT 29 — Lettre de réclamation à une entreprise
export function getTemplate_Reclamation_Entreprise() {
    return buildTakiDocLetter({
        id: 'reclamation_entreprise', name: 'Lettre de réclamation à une entreprise', price: 600,
        description: 'Réclamation écrite pour signaler un problème de service, de livraison ou de prestation.',
        title: 'Réclamation', intro: 'Madame, Monsieur,',
        sections: [
            { key: 'reclamation_commande', value: 'CMD-2026-789', label: 'Numéro de commande/référence', before: 'Je vous contacte au sujet de la référence ', after: ', liée à votre produit ou prestation.' },
            { key: 'reclamation_probleme', value: 'le produit reçu ne correspond pas à la description et présente des défauts de fabrication', label: 'Description du problème', before: 'Le problème constaté est le suivant : ', after: '.' },
            { key: 'reclamation_solution', value: 'le remplacement du produit défectueux ou le remboursement intégral', label: 'Solution demandée', before: 'Au regard de ces éléments, je sollicite la solution suivante : ', after: '. Vous trouverez, si nécessaire, les justificatifs utiles en pièces jointes.' }
        ],
        closing: 'Dans l\'attente de votre réponse, je vous prie d\'agréer, Madame, Monsieur, mes salutations distinguées.'
    });
}

// DOCUMENT 30 — Lettre de demande de partenariat
export function getTemplate_Demande_Partenariat() {
    return buildTakiDocLetter({
        id: 'demande_partenariat', name: 'Lettre de demande de partenariat', price: 800,
        description: 'Proposition de partenariat entre deux entreprises, associations ou organisations.',
        title: 'Proposition de partenariat', intro: 'Madame, Monsieur,',
        sections: [
            { key: 'partenariat_structure', value: 'TakiDoc, plateforme de génération de documents professionnels basée à Brazzaville', label: 'Présentation de votre structure', before: 'Je vous écris au nom de ', after: ', dont les activités portent principalement sur la digitalisation des documents administratifs.' },
            { key: 'partenariat_objectif', value: 'la digitalisation des services administratifs au Congo', label: 'Objectif commun', before: 'Nous souhaitons explorer avec votre organisation une collaboration autour de ', after: '.' },
            { key: 'partenariat_apports', value: 'mise à disposition de notre plateforme, formation des utilisateurs, support technique', label: 'Contributions et bénéfices', before: 'Cette collaboration pourrait notamment prévoir : ', after: '.' },
            { key: 'partenariat_suivi', value: 'une réunion de travail la semaine du 20/10/2026', label: 'Prochaine étape', before: 'Nous serions disponibles pour une rencontre afin de préciser les modalités et les objectifs. Nous proposons comme prochaine étape : ', after: '.' }
        ],
        closing: 'Je vous remercie de l\'intérêt que vous porterez à cette proposition et vous prie d\'agréer, Madame, Monsieur, mes salutations distinguées.'
    });
}

// ============================================
// REGISTRE CENTRAL FINAL (30 DOCUMENTS)
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
    getTemplate_Devis_Prestation(),
    getTemplate_Facture_Simple(),
    getTemplate_Attestation_Residence(),
    getTemplate_Certificat_Medical(),
    getTemplate_Rapport_Activite(),
    getTemplate_Procuration(),
    getTemplate_Declaration_Honneur(),
    getTemplate_Lettre_Demission(),
    getTemplate_Demande_Conge_Professionnel(),
    getTemplate_Autorisation_Absence(),
    getTemplate_Demande_Stage(),
    getTemplate_Candidature_Spontanee(),
    getTemplate_Remerciement_Professionnel(),
    getTemplate_Excuses_Professionnelles(),
    getTemplate_Relance_Administrative(),
    getTemplate_Reclamation_Entreprise(),
    getTemplate_Demande_Partenariat()
];