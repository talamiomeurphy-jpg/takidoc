-- ============================================
-- TAKIDOC - BASE DE DONNÉES SUPABASE
-- L'équipe Meurphy
-- ============================================

-- 1. Table des profils utilisateurs
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des templates (documents)
CREATE TABLE templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    price_xaf INTEGER NOT NULL,
    has_photo BOOLEAN DEFAULT false,
    has_color_picker BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des achats
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    guest_email TEXT,
    guest_phone TEXT,
    template_id TEXT NOT NULL REFERENCES templates(id),
    amount_paid INTEGER NOT NULL,
    payment_method TEXT NOT NULL, -- 'MTN_MOMO' ou 'AIRTEL_MONEY'
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    generated_pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_template_id ON purchases(template_id);
CREATE INDEX idx_purchases_payment_status ON purchases(payment_status);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_active ON templates(is_active);

-- Row Level Security (RLS) - Activation
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent insérer leur propre profil"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Politiques RLS pour templates (lecture publique)
CREATE POLICY "Tout le monde peut voir les templates actifs"
    ON templates FOR SELECT
    USING (is_active = true);

-- Politiques RLS pour purchases
CREATE POLICY "Les utilisateurs peuvent voir leurs propres achats"
    ON purchases FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent créer leurs achats"
    ON purchases FOR INSERT
    WITH CHECK (user_id = auth.uid() OR guest_email IS NOT NULL);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
    BEFORE UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertion des templates initiaux (20 documents)
INSERT INTO templates (id, name, category, description, price_xaf, has_photo, has_color_picker) VALUES
('cv_executif_moderne', 'CV Exécutif Moderne', 'cv', 'Design épuré et professionnel pour cadres et managers', 1500, true, true),
('cv_classique_francais', 'CV Classique Français', 'cv', 'Format traditionnel apprécié des recruteurs français', 1200, true, true),
('cv_creatif_design', 'CV Créatif Design', 'cv', 'Pour les métiers de la créativité et du design', 1500, true, true),
('cv_etudiant_stage', 'CV Étudiant Stage', 'cv', 'Idéal pour les étudiants recherchant un stage', 1000, true, true),
('cv_ingenieur_tech', 'CV Ingénieur Tech', 'cv', 'Spécialisé pour les métiers techniques et IT', 1500, true, true),
('lettre_motivation_classique', 'Lettre de Motivation Classique', 'lettre', 'Structure parfaite pour convaincre les recruteurs', 1000, false, true),
('lettre_motivation_stage', 'Lettre de Motivation Stage', 'lettre', 'Adaptée pour les demandes de stage', 800, false, true),
('lettre_recommandation', 'Lettre de Recommandation', 'lettre', 'Template pour demander une recommandation', 800, false, true),
('attestation_travail', 'Attestation de Travail', 'attestation', 'Modèle officiel d''attestation de travail', 1000, false, true),
('attestation_salaire', 'Attestation de Salaire', 'attestation', 'Pour justifier de vos revenus', 1000, false, true),
('attestation_residence', 'Attestation de Résidence', 'attestation', 'Justificatif de domicile standard', 800, false, true),
('certificat_medical', 'Certificat Médical', 'attestation', 'Template de certificat médical', 1000, false, true),
('devis_prestation', 'Devis de Prestation', 'commercial', 'Devis professionnel pour freelances', 1200, false, true),
('facture_simple', 'Facture Simple', 'commercial', 'Facture conforme aux normes', 1200, false, true),
('contrat_cdi', 'Contrat de Travail CDI', 'contrat', 'Modèle de contrat à durée indéterminée', 2000, false, true),
('contrat_cdd', 'Contrat de Travail CDD', 'contrat', 'Modèle de contrat à durée déterminée', 2000, false, true),
('contrat_stage', 'Contrat de Stage', 'contrat', 'Convention de stage tripartite', 1500, false, true),
('rapport_activite', 'Rapport d''Activité', 'rapport', 'Template de rapport professionnel', 1200, false, true),
('procuration', 'Procuration', 'administratif', 'Modèle de procuration standard', 1000, false, true),
('declaration_sur_honneur', 'Déclaration sur l''Honneur', 'administratif', 'Déclaration sur l''honneur officielle', 800, false, true);

-- Message de confirmation
SELECT '✅ Base de données TakiDoc créée avec succès !' as status;