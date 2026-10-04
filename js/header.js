// ============================================
// TAKIDOC - HEADER DYNAMIQUE
// L'équipe Meurphy
// ============================================

class TakiDocHeader {
    constructor() {
        this.currentUser = null;
        this.cartCount = 0;
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    async init() {
        // Vérifier l'état de connexion
        await this.checkAuthState();
        
        // Charger le panier depuis localStorage
        this.loadCartCount();
        
        // Générer le header
        this.render();
        
        // Attacher les événements
        this.attachEvents();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('index.html') || path === '/' || path.endsWith('/')) return 'accueil';
        if (path.includes('documents.html')) return 'documents';
        if (path.includes('editor.html')) return 'editor';
        if (path.includes('contact.html')) return 'contact';
        if (path.includes('about.html')) return 'about';
        return 'accueil';
    }

    async checkAuthState() {
        // Vérifier si Supabase est disponible
        if (typeof supabase !== 'undefined') {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                this.currentUser = session?.user || null;
            } catch (error) {
                console.warn('Supabase non disponible, vérification locale');
                this.checkLocalAuth();
            }
        } else {
            this.checkLocalAuth();
        }
    }

    checkLocalAuth() {
        // Fallback : vérifier localStorage
        const userStr = localStorage.getItem('takidoc_user');
        if (userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
            } catch (e) {
                this.currentUser = null;
            }
        }
    }

    loadCartCount() {
        const cart = localStorage.getItem('takidoc_cart');
        if (cart) {
            try {
                const cartItems = JSON.parse(cart);
                this.cartCount = Array.isArray(cartItems) ? cartItems.length : 0;
            } catch (e) {
                this.cartCount = 0;
            }
        }
    }

    getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    render() {
        const container = document.getElementById('header-container');
        if (!container) {
            console.error('Container #header-container introuvable');
            return;
        }

        container.innerHTML = `
            <header class="takidoc-header">
                <div class="header-container">
                    <!-- Logo -->
                    <a href="index.html" class="header-logo">
                        Taki<span>Doc</span>
                    </a>

                    <!-- Navigation Desktop -->
                    <ul class="header-nav">
                        <li><a href="index.html" class="${this.currentPage === 'accueil' ? 'active' : ''}">Accueil</a></li>
                        <li><a href="documents.html" class="${this.currentPage === 'documents' ? 'active' : ''}">Documents</a></li>
                        <li><a href="documents.html#categories">Catégories</a></li>
                        <li><a href="index.html#how-it-works">Comment ça marche ?</a></li>
                    </ul>

                    <!-- Actions Droite -->
                    <div class="header-actions">
                        <!-- Panier -->
                        <div class="cart-wrapper" onclick="window.location.href='cart.html'">
                            <i class="fas fa-shopping-cart cart-icon"></i>
                            ${this.cartCount > 0 ? `<span class="cart-badge">${this.cartCount}</span>` : ''}
                        </div>

                        ${this.currentUser ? this.renderUserMenu() : this.renderAuthButtons()}

                        <!-- Menu Mobile -->
                        <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Menu">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>

                <!-- Panel Mobile -->
                <div class="mobile-nav-panel" id="mobileNavPanel">
                    ${this.currentUser ? this.renderMobileUserInfo() : ''}
                    <ul class="mobile-nav-links">
                        <li><a href="index.html" class="${this.currentPage === 'accueil' ? 'active' : ''}">Accueil</a></li>
                        <li><a href="documents.html" class="${this.currentPage === 'documents' ? 'active' : ''}">Documents</a></li>
                        <li><a href="documents.html#categories">Catégories</a></li>
                        <li><a href="index.html#how-it-works">Comment ça marche ?</a></li>
                        ${this.currentUser ? '<li><a href="dashboard.html">Mon tableau de bord</a></li>' : ''}
                    </ul>
                    ${this.currentUser ? this.renderMobileUserActions() : this.renderMobileAuthButtons()}
                </div>
            </header>
        `;
    }

    renderAuthButtons() {
        return `
            <a href="login.html" class="btn-auth btn-login">
                <i class="fas fa-sign-in-alt"></i> Se connecter
            </a>
            <a href="register.html" class="btn-auth btn-signup">
                Créer un compte
            </a>
        `;
    }

    renderUserMenu() {
        const name = this.currentUser.name || this.currentUser.email?.split('@')[0] || 'Utilisateur';
        const email = this.currentUser.email || '';
        const initials = this.getInitials(name);

        return `
            <div class="user-menu" id="userMenu">
                <button class="user-button" id="userButton">
                    <div class="user-avatar">${initials}</div>
                    <span class="user-name">${name}</span>
                    <i class="fas fa-chevron-down user-dropdown-icon"></i>
                </button>
                <div class="user-dropdown">
                    <div class="dropdown-header">
                        <div class="user-name" style="max-width:none; font-weight:700;">${name}</div>
                        <div class="user-email">${email}</div>
                    </div>
                    <a href="dashboard.html" class="dropdown-item">
                        <i class="fas fa-tachometer-alt"></i> Tableau de bord
                    </a>
                    <a href="my-documents.html" class="dropdown-item">
                        <i class="fas fa-folder"></i> Mes documents
                    </a>
                    <a href="my-purchases.html" class="dropdown-item">
                        <i class="fas fa-receipt"></i> Mes achats
                    </a>
                    <a href="profile.html" class="dropdown-item">
                        <i class="fas fa-user"></i> Mon profil
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item logout" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i> Se déconnecter
                    </a>
                </div>
            </div>
        `;
    }

    renderMobileUserInfo() {
        const name = this.currentUser.name || this.currentUser.email?.split('@')[0] || 'Utilisateur';
        const email = this.currentUser.email || '';
        const initials = this.getInitials(name);

        return `
            <div class="mobile-user-info">
                <div class="user-avatar">${initials}</div>
                <div class="user-details">
                    <div class="user-name">${name}</div>
                    <div class="user-email">${email}</div>
                </div>
            </div>
        `;
    }

    renderMobileAuthButtons() {
        return `
            <div class="mobile-auth-buttons">
                <a href="login.html" class="btn-auth btn-login">
                    <i class="fas fa-sign-in-alt"></i> Se connecter
                </a>
                <a href="register.html" class="btn-auth btn-signup">
                    Créer un compte
                </a>
            </div>
        `;
    }

    renderMobileUserActions() {
        return `
            <div class="mobile-auth-buttons">
                <a href="dashboard.html" class="btn-auth btn-login">
                    <i class="fas fa-tachometer-alt"></i> Tableau de bord
                </a>
                <a href="#" class="btn-auth btn-login" id="mobileLogoutBtn" style="color:#ef4444; border-color:#ef4444;">
                    <i class="fas fa-sign-out-alt"></i> Se déconnecter
                </a>
            </div>
        `;
    }

    attachEvents() {
        // Menu mobile
        const mobileBtn = document.getElementById('mobileMenuBtn');
        const mobilePanel = document.getElementById('mobileNavPanel');
        
        if (mobileBtn && mobilePanel) {
            mobileBtn.addEventListener('click', () => {
                mobileBtn.classList.toggle('active');
                mobilePanel.classList.toggle('active');
            });
        }

        // User dropdown (desktop)
        const userMenu = document.getElementById('userMenu');
        const userButton = document.getElementById('userButton');
        
        if (userMenu && userButton) {
            userButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.classList.toggle('open');
            });

            // Fermer au clic extérieur
            document.addEventListener('click', (e) => {
                if (!userMenu.contains(e.target)) {
                    userMenu.classList.remove('open');
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        
        const handleLogout = async (e) => {
            e.preventDefault();
            if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
                try {
                    if (typeof supabase !== 'undefined') {
                        await supabase.auth.signOut();
                    }
                } catch (err) {
                    console.error('Erreur logout:', err);
                }
                
                localStorage.removeItem('takidoc_user');
                localStorage.removeItem('takidoc_session');
                window.location.href = 'index.html';
            }
        };

        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
        if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);
    }

    // Méthode publique pour mettre à jour le compteur panier
    updateCartCount(count) {
        this.cartCount = count;
        const badge = document.querySelector('.cart-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        } else if (count > 0) {
            const cartWrapper = document.querySelector('.cart-wrapper');
            if (cartWrapper) {
                const newBadge = document.createElement('span');
                newBadge.className = 'cart-badge';
                newBadge.textContent = count;
                cartWrapper.appendChild(newBadge);
            }
        }
    }
}

// Auto-initialisation quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.takidocHeader = new TakiDocHeader();
});