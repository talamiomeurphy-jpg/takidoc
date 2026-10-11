// ============================================
// TAKIDOC - HEADER DYNAMIQUE UNIVERSEL
// L'équipe Meurphy - 2026
// ============================================

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION DES PAGES
    // ============================================
    const PUBLIC_PAGES = [
        { id: 'index', name: 'Accueil', url: 'index.html', icon: 'fa-home' },
        { id: 'comment-ca-marche', name: 'Comment ça marche', url: 'comment-ca-marche.html', icon: 'fa-question-circle' },
        { id: 'a-propos', name: 'À propos', url: 'a-propos.html', icon: 'fa-info-circle' },
        { id: 'contact', name: 'Contact', url: 'contact.html', icon: 'fa-envelope' }
    ];

    const LEGAL_PAGES = [
        { name: 'Conditions', url: 'conditions.html' },
        { name: 'Confidentialité', url: 'confidentialite.html' },
        { name: 'Mentions légales', url: 'mentions-legales.html' },
        { name: 'Cookies', url: 'cookies.html' }
    ];

    const AUTH_PAGES = {
        login: 'auth.html?action=login',
        signup: 'auth.html?action=signup',
        profile: 'profile.html',
        favorites: 'profile.html#favorites',
        documents: 'profile.html#documents'
    };

    // ============================================
    // CONFIGURATION SUPABASE
    // ============================================
    const SUPABASE_URL = 'https://wyfkogowsdbxctbpfuud.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM';

    let supabase = null;
    let currentUser = null;

    // ============================================
    // UTILITAIRES
    // ============================================
    function escapeHTML(str) {
        return String(str || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function getCurrentPageId() {
        const path = window.location.pathname.split('/').pop() || 'index.html';
        return path.replace('.html', '');
    }

    function getInitials(name) {
        if (!name) return 'TD';
        return name.split(/[\s._-]+/).filter(Boolean)
            .map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }

    // ============================================
    // INITIALISATION SUPABASE
    // ============================================
    async function initSupabase() {
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            try {
                const { data: { session } } = await supabase.auth.getSession();
                currentUser = session?.user || null;
            } catch (e) {
                console.warn('Header: Session non disponible', e);
                currentUser = null;
            }

            // Écouter les changements d'auth
            supabase.auth.onAuthStateChange((_event, session) => {
                currentUser = session?.user || null;
                renderHeader();
            });
        }
    }

    // ============================================
    // GÉNÉRATION DU HEADER
    // ============================================
    function renderHeader() {
        const container = document.getElementById('td-header-container');
        if (!container) return;

        const currentPage = getCurrentPageId();
        const isAuthPage = ['auth', 'editor', 'profile'].includes(currentPage);
        const showSearch = !isAuthPage;

        container.innerHTML = `
            <header class="td-header" role="banner">
                <div class="td-header-container">
                    <!-- Logo -->
                    <a href="index.html" class="td-logo" aria-label="TakiDoc - Accueil">
                        <span class="td-logo-icon" aria-hidden="true"></span>
                        <span class="td-logo-text-taki">Taki</span><span class="td-logo-text-doc">Doc</span>
                    </a>

                    <!-- Navigation Desktop -->
                    <nav class="td-nav" aria-label="Navigation principale">
                        ${PUBLIC_PAGES.map(page => `
                            <a href="${page.url}" 
                               class="td-nav-link ${currentPage === page.id ? 'active' : ''}"
                               ${currentPage === page.id ? 'aria-current="page"' : ''}>
                                ${page.name}
                            </a>
                        `).join('')}
                    </nav>

                    <!-- Recherche Desktop -->
                    ${showSearch ? `
                        <div class="td-search">
                            <form class="td-search-form" action="index.html" method="get" role="search">
                                <i class="fas fa-search td-search-icon" aria-hidden="true"></i>
                                <input 
                                    type="text" 
                                    class="td-search-input" 
                                    name="q"
                                    placeholder="Rechercher un CV, un contrat, une facture..."
                                    aria-label="Rechercher un document"
                                    autocomplete="off">
                            </form>
                        </div>
                    ` : ''}

                    <!-- Actions Droite -->
                    <div class="td-actions">
                        ${currentUser ? renderConnectedActions() : renderGuestActions()}
                    </div>

                    <!-- Bouton Menu Mobile -->
                    <button 
                        class="td-mobile-toggle" 
                        id="td-mobile-toggle"
                        aria-label="Ouvrir le menu"
                        aria-expanded="false"
                        aria-controls="td-mobile-menu">
                        <i class="fas fa-bars" aria-hidden="true"></i>
                    </button>
                </div>

                <!-- Menu Mobile -->
                <div class="td-mobile-menu" id="td-mobile-menu" role="menu">
                    ${showSearch ? `
                        <div class="td-mobile-search">
                            <form class="td-search-form" action="index.html" method="get">
                                <i class="fas fa-search td-search-icon" aria-hidden="true"></i>
                                <input type="text" class="td-search-input" name="q" placeholder="Rechercher..." autocomplete="off">
                            </form>
                        </div>
                    ` : ''}
                    
                    <nav aria-label="Navigation mobile">
                        ${PUBLIC_PAGES.map(page => `
                            <a href="${page.url}" 
                               class="td-nav-link ${currentPage === page.id ? 'active' : ''}"
                               role="menuitem">
                                <i class="fas ${page.icon}" aria-hidden="true"></i>
                                ${page.name}
                            </a>
                        `).join('')}
                    </nav>

                    ${currentUser ? renderMobileConnectedActions() : renderMobileGuestActions()}
                </div>
            </header>
        `;

        // Initialiser les événements
        initMobileMenu();
        initSearch();
    }

    // ============================================
    // ACTIONS UTILISATEUR CONNECTÉ
    // ============================================
    function renderConnectedActions() {
        const name = currentUser.user_metadata?.full_name || currentUser.email || 'Utilisateur';
        const initials = getInitials(name);
        
        return `
            <a href="${AUTH_PAGES.profile}" class="td-btn td-btn-profile" aria-label="Mon compte">
                <span class="td-profile-initials" aria-hidden="true">${initials}</span>
                <span>Mon compte</span>
            </a>
        `;
    }

    function renderMobileConnectedActions() {
        const name = currentUser.user_metadata?.full_name || currentUser.email || 'Utilisateur';
        const initials = getInitials(name);
        
        return `
            <a href="${AUTH_PAGES.profile}" class="td-btn td-btn-profile" role="menuitem">
                <span class="td-profile-initials">${initials}</span>
                <span>Mon compte</span>
            </a>
            <a href="${AUTH_PAGES.favorites}" class="td-btn td-btn-secondary" role="menuitem">
                <i class="fas fa-heart"></i>
                <span>Mes favoris</span>
            </a>
            <a href="${AUTH_PAGES.documents}" class="td-btn td-btn-secondary" role="menuitem">
                <i class="fas fa-file-alt"></i>
                <span>Mes documents</span>
            </a>
            <button class="td-btn td-btn-secondary" id="td-logout-btn" role="menuitem">
                <i class="fas fa-sign-out-alt"></i>
                <span>Déconnexion</span>
            </button>
        `;
    }

    // ============================================
    // ACTIONS VISITEUR (NON CONNECTÉ)
    // ============================================
    function renderGuestActions() {
        return `
            <a href="${AUTH_PAGES.signup}" class="td-btn td-btn-secondary">
                <i class="fas fa-user-plus"></i>
                <span>S'inscrire</span>
            </a>
            <a href="${AUTH_PAGES.login}" class="td-btn td-btn-primary">
                <i class="fas fa-sign-in-alt"></i>
                <span>Connexion</span>
            </a>
        `;
    }

    function renderMobileGuestActions() {
        return `
            <a href="${AUTH_PAGES.signup}" class="td-btn td-btn-secondary" role="menuitem">
                <i class="fas fa-user-plus"></i>
                <span>S'inscrire</span>
            </a>
            <a href="${AUTH_PAGES.login}" class="td-btn td-btn-primary" role="menuitem">
                <i class="fas fa-sign-in-alt"></i>
                <span>Connexion</span>
            </a>
        `;
    }

    // ============================================
    // MENU MOBILE
    // ============================================
    function initMobileMenu() {
        const toggle = document.getElementById('td-mobile-toggle');
        const menu = document.getElementById('td-mobile-menu');
        const logoutBtn = document.getElementById('td-logout-btn');

        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                const isOpen = menu.classList.toggle('open');
                toggle.setAttribute('aria-expanded', isOpen);
                toggle.innerHTML = isOpen 
                    ? '<i class="fas fa-times" aria-hidden="true"></i>' 
                    : '<i class="fas fa-bars" aria-hidden="true"></i>';
            });

            // Fermer le menu en cliquant à l'extérieur
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && !toggle.contains(e.target)) {
                    menu.classList.remove('open');
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
                }
            });
        }

        // Déconnexion
        if (logoutBtn && supabase) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await supabase.auth.signOut();
                    window.location.href = 'index.html';
                } catch (e) {
                    console.error('Erreur déconnexion:', e);
                }
            });
        }
    }

    // ============================================
    // RECHERCHE
    // ============================================
    function initSearch() {
        const forms = document.querySelectorAll('.td-search-form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const input = form.querySelector('input[name="q"]');
                if (input && !input.value.trim()) {
                    e.preventDefault();
                }
            });
        });
    }

    // ============================================
    // DÉMARRAGE
    // ============================================
    async function init() {
        await initSupabase();
        renderHeader();
    }

    // Lancer quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Exposer pour usage externe si besoin
    window.TakiDocHeader = {
        refresh: renderHeader,
        getUser: () => currentUser
    };

})();