// ============================================
// TAKIDOC - CONFIGURATION SUPABASE
// L'équipe Meurphy
// ============================================

const SUPABASE_URL = 'https://wyfkogowsdbxctbpfuud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM';

// Initialisation du client Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fonction utilitaire pour récupérer tous les templates actifs
export async function fetchTemplates() {
    const { data, error } = await supabase
        .from('templates')
        .select(`
            *,
            category:template_categories(*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
    
    if (error) {
        console.error('Erreur lors du chargement des templates:', error);
        return [];
    }
    return data;
}

// Fonction pour récupérer un template par son ID
export async function fetchTemplateById(id) {
    const { data, error } = await supabase
        .from('templates')
        .select(`
            *,
            category:template_categories(*),
            fields:template_fields(*)
        `)
        .eq('id', id)
        .single();
    
    if (error) {
        console.error('Erreur lors du chargement du template:', error);
        return null;
    }
    return data;
}

// Fonction pour récupérer les catégories
export async function fetchCategories() {
    const { data, error } = await supabase
        .from('template_categories')
        .select('*')
        .order('display_order', { ascending: true });
    
    if (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        return [];
    }
    return data;
}

// Fonction pour créer un achat (invité ou utilisateur)
export async function createPurchase(purchaseData) {
    const { data, error } = await supabase
        .from('purchases')
        .insert([purchaseData])
        .select()
        .single();
    
    if (error) {
        console.error('Erreur lors de la création de l\'achat:', error);
        return null;
    }
    return data;
}

// Fonction pour sauvegarder un document personnalisé
export async function saveUserDocument(documentData) {
    const { data, error } = await supabase
        .from('user_documents')
        .insert([documentData])
        .select()
        .single();
    
    if (error) {
        console.error('Erreur lors de la sauvegarde du document:', error);
        return null;
    }
    return data;
}