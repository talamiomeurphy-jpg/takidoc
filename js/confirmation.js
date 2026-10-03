// ============================================
// TAKIDOC - PAGE DE CONFIRMATION
// L'équipe Meurphy
// ============================================

import { getCompletedPurchase } from './supabase-config.js';

const form = document.getElementById('confirmation-form');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const successState = document.getElementById('success-state');
const downloadBtn = document.getElementById('download-btn');

let currentPurchase = null;

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('confirm-email').value;
    const phone = document.getElementById('confirm-phone').value;
    
    // Cacher les états précédents
    errorState.style.display = 'none';
    successState.style.display = 'none';
    loadingState.style.display = 'block';
    
    // Rechercher l'achat
    const purchase = await getCompletedPurchase(email, phone);
    
    loadingState.style.display = 'none';
    
    if (purchase) {
        currentPurchase = purchase;
        showSuccess(purchase);
    } else {
        errorState.style.display = 'block';
    }
});

function showSuccess(purchase) {
    document.getElementById('success-doc-name').textContent = purchase.template?.name || 'Votre document';
    successState.style.display = 'block';
    
    downloadBtn.addEventListener('click', () => {
        generatePDF(purchase);
    });
}

async function generatePDF(purchase) {
    // Importer html2pdf dynamiquement
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = async () => {
        // Créer un élément temporaire avec le contenu du document
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = purchase.template?.html_structure || '<p>Document non disponible</p>';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        const opt = {
            margin: 0,
            filename: `TakiDoc_${purchase.template?.id}_${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        try {
            await html2pdf().set(opt).from(tempDiv).save();
            alert('PDF téléchargé avec succès !');
        } catch (error) {
            console.error('Erreur PDF:', error);
            alert('Erreur lors du téléchargement du PDF');
        }
        
        document.body.removeChild(tempDiv);
    };
    document.head.appendChild(script);
}