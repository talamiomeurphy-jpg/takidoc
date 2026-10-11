// ============================================
// TAKIDOC - HEADER ULTRA PREMIUM
// L'équipe Meurphy - 2026
// ============================================

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION COMPLÈTE
    // ============================================
    const NAVIGATION = {
        main: [
            { id: 'index', name: 'Accueil', url: 'index.html', icon: 'fa-home' },
            { 
                id: 'models', 
                name: 'Modèles', 
                url: 'index.html#documents', 
                icon: 'fa-folder-open',
                dropdown: [
                    { name: 'CV', url: 'index.html?cat=cv', icon: 'fa-user-tie' },
                    { name: 'Lettres', url: 'index.html?cat=lettre', icon: 'fa-envelope' },
                    { name: 'Contrats', url: 'index.html?cat=contrat', icon: 'fa-file-contract' },
                    { name: 'Factures & Devis', url: 'index.html?cat=facture', icon: 'fa-file-invoice' },
                    { name: 'Attestations', url: 'index.html?cat=attestation', icon: 'fa-certificate' },
                    { name: 'Administratif', url: 'index.html?cat=administratif', icon: 'fa-building' }
                ]
            },
            { id: 'comment-ca-marche', name: 'Comment ça marche', url: 'comment-ca-marche.html', icon: 'fa-question-circle' },
            { id: 'a-propos', name: 'À propos', url: 'a-propos.html', icon: 'fa-info-circle' },
            { id: 'contact', name: 'Contact', url: 'contact.html', icon: 'fa-envelope' }
        ],
        legal: [
            { name: 'Conditions d\'utilisation', url: 'conditions.html' },
            { name: 'CGV', url: 'cgv.html' },
            { name: 'Confidentialité', url: 'confidentialite.html' },
            { name: 'Mentions légales', url: 'mentions-legales.html' },
            { name: 'Cookies', url: 'cookies.html' },
            { name: 'Licence', url: 'licence.html' },
            { name: 'Réclamations & Remboursements', url: 'reclamations-remboursements.html' }
        ]
    };

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
        const isEditor = currentPage === 'editor';
        const isAuthPage = ['auth', 'profile'].includes(currentPage);

        const logoHTML = `
            <a href="index.html" class="td-logo" aria-label="TakiDoc - Accueil">
                <img src="favicon-32x32.png" alt="T" class="td-logo-img" onerror="this.style.display='none'">
                <span class="td-logo-text"><span class="td-logo-taki">Taki</span><span class="td-logo-doc">Doc</span></span>
            </a>
        `;

        const navHTML = `
            <nav class="td-nav" aria-label="Navigation principale">
                ${NAVIGATION.main.map(item => {
                    if (item.dropdown) {
                        return `
                            <div class="td-nav-item td-has-dropdown">
                                <a href="${item.url}" class="td-nav-link ${currentPage === item.id ? 'active' : ''}">
                                    ${item.name}
                                    <i class="fas fa-chevron-down td-dropdown-icon"></i>
                                </a>
                                <div class="td-dropdown">
                                    ${item.dropdown.map(sub => `
                                        <a href="${sub.url}" class="td-dropdown-item">
                                            <i class="fas ${sub.icon}"></i>
                                            <span>${sub.name}</span>
                                        </a>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }
                    return `
                        <a href="${item.url}" class="td-nav-link ${currentPage === item.id ? 'active' : ''}">
                            ${item.name}
                        </a>
                    `;
                }).join('')}
                
                <div class="td-nav-item td-has-dropdown">
                    <a href="#" class="td-nav-link">
                        Plus
                        <i class="fas fa-chevron-down td-dropdown-icon"></i>
                    </a>
                    <div class="td-dropdown td-dropdown-legal">
                        ${NAVIGATION.legal.map(item => `
                            <a href="${item.url}" class="td-dropdown-item">
                                <i class="fas fa-file-alt"></i>
                                <span>${item.name}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </nav>
        `;

        const searchHTML = !isEditor && !isAuthPage ? `
            <div class="td-search">
                <form class="td-search-form" action="index.html" method="get">
                    <i class="fas fa-search td-search-icon"></i>
                    <input type="text" class="td-search-input" name="q" placeholder="Rechercher un document..." autocomplete="off">
                </form>
            </div>
        ` : '';

        const actionsHTML = currentUser 
            ? renderConnectedActions() 
            : renderGuestActions();

        const mobileToggleHTML = `
            <button class="td-mobile-toggle" id="td-mobile-toggle" aria-label="Menu">
                <i class="fas fa-bars"></i>
            </button>
        `;

        const mobileMenuHTML = `
            <div class="td-mobile-menu" id="td-mobile-menu">
                <div class="td-mobile-header">
                    <a href="index.html" class="td-logo td-mobile-logo">
                        <img src="favicon-32x32.png" alt="T" class="td-logo-img">
                        <span><span class="td-logo-taki">Taki</span><span class="td-logo-doc">Doc</span></span>
                    </a>
                    <button class="td-mobile-close" id="td-mobile-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                ${!isEditor && !isAuthPage ? `
                    <div class="td-mobile-search">
                        <form action="index.html" method="get">
                            <i class="fas fa-search"></i>
                            <input type="text" name="q" placeholder="Rechercher un document...">
                        </form>
                    </div>
                ` : ''}
                
                <nav class="td-mobile-nav">
                    ${NAVIGATION.main.map(item => `
                        <a href="${item.url}" class="td-mobile-link ${currentPage === item.id ? 'active' : ''}">
                            <i class="fas ${item.icon}"></i>
                            <span>${item.name}</span>
                        </a>
                    `).join('')}
                    
                    <div class="td-mobile-section-title">Catégories</div>
                    ${NAVIGATION.main.find(i => i.dropdown)?.dropdown.map(sub => `
                        <a href="${sub.url}" class="td-mobile-link td-mobile-sub">
                            <i class="fas ${sub.icon}"></i>
                            <span>${sub.name}</span>
                        </a>
                    `).join('')}
                    
                    <div class="td-mobile-section-title">Informations</div>
                    ${NAVIGATION.legal.map(item => `
                        <a href="${item.url}" class="td-mobile-link td-mobile-legal">
                            <i class="fas fa-file-alt"></i>
                            <span>${item.name}</span>
                        </a>
                    `).join('')}
                </nav>
                
                <div class="td-mobile-footer">
                    ${currentUser ? renderMobileConnectedActions() : renderMobileGuestActions()}
                </div>
            </div>
            <div class="td-mobile-overlay" id="td-mobile-overlay"></div>
        `;

        container.innerHTML = `
            <header class="td-header" role="banner">
                <div class="td-header-inner">
                    ${logoHTML}
                    ${!isAuthPage ? navHTML : ''}
                    ${searchHTML}
                    <div class="td-header-actions">
                        ${actionsHTML}
                    </div>
                    ${mobileToggleHTML}
                </div>
                ${mobileMenuHTML}
            </header>
        `;

        initInteractions();
    }

    function renderConnectedActions() {
        const name = currentUser.user_metadata?.full_name || currentUser.email || 'Utilisateur';
        const initials = getInitials(name);
        
        return `
            <button class="td-icon-btn td-notif-btn" aria-label="Notifications">
                <i class="fas fa-bell"></i>
            </button>
            
            <div class="td-user-menu">
                <button class="td-user-btn" aria-label="Menu utilisateur">
                    <span class="td-user-avatar">${initials}</span>
                    <span class="td-user-name">${escapeHTML(name.split(' ')[0])}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="td-user-dropdown">
                    <div class="td-user-header">
                        <div class="td-user-avatar-lg">${initials}</div>
                        <div>
                            <div class="td-user-name-lg">${escapeHTML(name)}</div>
                            <div class="td-user-email">${escapeHTML(currentUser.email)}</div>
                        </div>
                    </div>
                    <div class="td-user-divider"></div>
                    <a href="profile.html" class="td-user-link">
                        <i class="fas fa-user"></i> Mon profil
                    </a>
                    <a href="profile.html#documents" class="td-user-link">
                        <i class="fas fa-file-alt"></i> Mes documents
                    </a>
                    <a href="profile.html#favorites" class="td-user-link">
                        <i class="fas fa-heart"></i> Mes favoris
                    </a>
                    <a href="profile.html#settings" class="td-user-link">
                        <i class="fas fa-cog"></i> Paramètres
                    </a>
                    <a href="contact.html" class="td-user-link">
                        <i class="fas fa-question-circle"></i> Aide & Support
                    </a>
                    <div class="td-user-divider"></div>
                    <button class="td-user-link td-logout-btn">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                </div>
            </div>
        `;
    }

    function renderMobileConnectedActions() {
        const name = currentUser.user_metadata?.full_name || currentUser.email || 'Utilisateur';
        const initials = getInitials(name);
        
        return `
            <div class="td-mobile-user-card">
                <div class="td-user-avatar-lg">${initials}</div>
                <div>
                    <div class="td-user-name-lg">${escapeHTML(name)}</div>
                    <div class="td-user-email">${escapeHTML(currentUser.email)}</div>
                </div>
            </div>
            <a href="profile.html" class="td-mobile-link">
                <i class="fas fa-user"></i> Mon profil
            </a>
            <a href="profile.html#documents" class="td-mobile-link">
                <i class="fas fa-file-alt"></i> Mes documents
            </a>
            <a href="profile.html#favorites" class="td-mobile-link">
                <i class="fas fa-heart"></i> Mes favoris
            </a>
            <a href="profile.html#settings" class="td-mobile-link">
                <i class="fas fa-cog"></i> Paramètres
            </a>
            <button class="td-mobile-link td-logout-btn">
                <i class="fas fa-sign-out-alt"></i> Déconnexion
            </button>
        `;
    }

    function renderGuestActions() {
        return `
            <a href="auth.html?action=login" class="td-btn td-btn-ghost">
                <i class="fas fa-sign-in-alt"></i>
                <span>Connexion</span>
            </a>
            <a href="auth.html?action=signup" class="td-btn td-btn-primary">
                <i class="fas fa-user-plus"></i>
                <span>S'inscrire</span>
            </a>
        `;
    }

    function renderMobileGuestActions() {
        return `
            <a href="auth.html?action=login" class="td-mobile-link">
                <i class="fas fa-sign-in-alt"></i>
                <span>Connexion</span>
            </a>
            <a href="auth.html?action=signup" class="td-mobile-link td-mobile-cta">
                <i class="fas fa-user-plus"></i>
                <span>Créer un compte</span>
            </a>
        `;
    }

    function initInteractions() {
        const mobileToggle = document.getElementById('td-mobile-toggle');
        const mobileMenu = document.getElementById('td-mobile-menu');
        const mobileOverlay = document.getElementById('td-mobile-overlay');
        const mobileClose = document.getElementById('td-mobile-close');
        
        if (mobileToggle && mobileMenu) {
            mobileToggle.addEventListener('click', () => {
                mobileMenu.classList.add('open');
                if (mobileOverlay) mobileOverlay.classList.add('open');
                document.body.style.overflow = 'hidden';
            });
        }
        
        if (mobileClose && mobileMenu) {
            mobileClose.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                if (mobileOverlay) mobileOverlay.classList.remove('open');
                document.body.style.overflow = '';
            });
        }

        if (mobileOverlay && mobileMenu) {
            mobileOverlay.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                mobileOverlay.classList.remove('open');
                document.body.style.overflow = '';
            });
        }

        document.querySelectorAll('.td-has-dropdown').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.classList.add('open');
            });
            item.addEventListener('mouseleave', () => {
                item.classList.remove('open');
            });
        });

        const userBtn = document.querySelector('.td-user-btn');
        const userDropdown = document.querySelector('.td-user-dropdown');
        
        if (userBtn && userDropdown) {
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('open');
            });
            
            document.addEventListener('click', () => {
                userDropdown.classList.remove('open');
            });
        }

        document.querySelectorAll('.td-logout-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (supabase) {
                    await supabase.auth.signOut();
                    window.location.href = 'index.html';
                }
            });
        });
    }

    async function init() {
        await initSupabase();
        renderHeader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.TakiDocHeader = {
        refresh: renderHeader,
        getUser: () => currentUser
    };

})();