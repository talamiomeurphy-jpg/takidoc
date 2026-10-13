// ============================================
// TAKIDOC ADMIN DASHBOARD - VERSION COMPLÈTE
// L'équipe Meurphy - 2026
// ============================================

(function() {
    'use strict';

    // Configuration
    const SUPABASE_URL = 'https://wyfkogowsdbxctbpfuud.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM';

    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // État global
    const AppState = {
        user: null,
        profile: null,
        currentTemplateId: null,
        editors: { html: null, css: null, fields: null },
        charts: {},
        logs: JSON.parse(localStorage.getItem('admin_logs') || '[]')
    };

    // ============================================
    // UTILITAIRES
    // ============================================
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const msgEl = document.getElementById('toast-msg');
        const iconEl = toast?.querySelector('i');
        
        if (!toast || !msgEl) return;
        
        msgEl.textContent = message;
        toast.className = `toast ${type} show`;
        if (iconEl) {
            iconEl.className = type === 'error' ? 'fas fa-circle-exclamation' : 
                              type === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle';
        }
        
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    function getInitials(name) {
        return (String(name || 'AD').trim().split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'AD');
    }

    function formatDate(date) {
        if (!date) return '—';
        const d = new Date(date);
        return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
    }

    function formatMoney(amount, currency = 'FCFA') {
        return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' ' + currency;
    }

    function addLog(action, details = '') {
        const log = {
            time: new Date().toISOString(),
            action,
            details,
            user: AppState.profile?.email || 'unknown'
        };
        AppState.logs.unshift(log);
        if (AppState.logs.length > 100) AppState.logs = AppState.logs.slice(0, 100);
        localStorage.setItem('admin_logs', JSON.stringify(AppState.logs));
        renderLogs();
    }

    // ============================================
    // INITIALISATION
    // ============================================
    async function init() {
        console.log('🚀 Initialisation Admin Dashboard...');
        
        try {
            const { data: { session }, error: authError } = await db.auth.getSession();
            
            if (authError || !session) {
                window.location.href = 'auth.html?action=login&next=admin.html';
                return;
            }

            const { data: profile, error: profileError } = await db
                .from('profiles')
                .select('role, email, full_name')
                .eq('id', session.user.id)
                .single();
            
            if (profileError || !profile || profile.role !== 'admin') {
                alert('Accès refusé. Droits d\'administrateur requis.');
                window.location.href = 'index.html';
                return;
            }

            AppState.user = session.user;
            AppState.profile = profile;

            const avatarEl = document.getElementById('admin-avatar');
            const emailEl = document.getElementById('admin-email');
            if (avatarEl) avatarEl.textContent = getInitials(profile.full_name || profile.email);
            if (emailEl) emailEl.textContent = profile.email;
            
            console.log('✅ Admin authentifié:', profile.email);
            
            initCodeMirror();
            await loadDashboardStats();
            await loadTemplatesList();
            await loadCategories();
            setupEventListeners();
            renderLogs();
            
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            
            console.log('✅ Admin Dashboard prêt');
            
        } catch (error) {
            console.error('❌ Erreur init:', error);
            showToast('Erreur de chargement: ' + error.message, 'error');
        }
    }

    // ============================================
    // CODEMIRROR
    // ============================================
    function initCodeMirror() {
        if (typeof CodeMirror === 'undefined') {
            console.warn('⚠️ CodeMirror non chargé');
            return;
        }

        const commonOptions = {
            lineNumbers: true,
            theme: 'dracula',
            lineWrapping: true,
            tabSize: 2,
            matchBrackets: true,
            autoCloseBrackets: true
        };

        const htmlTextarea = document.getElementById('editor-html');
        const cssTextarea = document.getElementById('editor-css');
        const fieldsTextarea = document.getElementById('editor-fields');

        if (htmlTextarea) {
            AppState.editors.html = CodeMirror.fromTextArea(htmlTextarea, {
                ...commonOptions, mode: 'htmlmixed'
            });
        }

        if (cssTextarea) {
            AppState.editors.css = CodeMirror.fromTextArea(cssTextarea, {
                ...commonOptions, mode: 'css'
            });
        }

        if (fieldsTextarea) {
            AppState.editors.fields = CodeMirror.fromTextArea(fieldsTextarea, {
                ...commonOptions, mode: 'application/json'
            });
        }

        Object.values(AppState.editors).forEach(editor => {
            if (editor) {
                editor.on('change', () => {
                    const editorView = document.getElementById('view-editor');
                    if (editorView && editorView.classList.contains('active')) {
                        updatePreview();
                    }
                });
            }
        });
    }

    function getEditorContent(type) {
        const editor = AppState.editors[type];
        if (editor) return editor.getValue();
        const textarea = document.getElementById(`editor-${type}`);
        return textarea ? textarea.value : '';
    }

    function setEditorContent(type, content) {
        const editor = AppState.editors[type];
        if (editor) {
            editor.setValue(content || '');
            editor.refresh();
        } else {
            const textarea = document.getElementById(`editor-${type}`);
            if (textarea) textarea.value = content || '';
        }
    }

    // ============================================
    // NAVIGATION
    // ============================================
    function switchView(viewName, templateId = null) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) targetView.classList.add('active');
        
        const activeNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);
        if (activeNav) activeNav.classList.add('active');
        
        const titles = {
            dashboard: ['Tableau de bord', 'Vue d\'ensemble'],
            templates: ['Templates', 'Gestion des templates'],
            editor: [templateId ? 'Modifier Template' : 'Nouveau Template', 'Éditeur de code'],
            import: ['Import Registry', 'Importer depuis templates-registry.js'],
            categories: ['Catégories', 'Gestion des catégories'],
            orders: ['Commandes', 'Historique des achats'],
            users: ['Utilisateurs', 'Gestion des utilisateurs'],
            notifications: ['Notifications', 'Centre de notifications'],
            media: ['Médias', 'Gestion des fichiers'],
            logs: ['Journal d\'audit', 'Historique des actions'],
            settings: ['Paramètres', 'Configuration du site'],
            backup: ['Sauvegarde', 'Export/Import de données']
        };
        
        const [title, breadcrumb] = titles[viewName] || ['Admin', ''];
        const headerTitle = document.getElementById('header-title');
        const headerBreadcrumb = document.getElementById('header-breadcrumb');
        if (headerTitle) headerTitle.textContent = title;
        if (headerBreadcrumb) headerBreadcrumb.textContent = breadcrumb;
        
        if (viewName === 'editor') {
            AppState.currentTemplateId = templateId;
            const editorTitle = document.getElementById('editor-title');
            if (editorTitle) editorTitle.textContent = templateId ? `Modifier: ${templateId}` : 'Nouveau Template';
            
            if (templateId) loadTemplateForEdit(templateId);
            else resetEditor();
            
            setTimeout(() => {
                Object.values(AppState.editors).forEach(e => e?.refresh());
                updatePreview();
            }, 100);
        }
        
        if (viewName === 'dashboard') loadDashboardStats();
        if (viewName === 'templates') loadTemplatesList();
        if (viewName === 'categories') loadCategories();
        if (viewName === 'orders') loadOrders();
        if (viewName === 'users') loadUsers();
        if (viewName === 'notifications') loadNotifications();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function setupEventListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                if (view) switchView(view);
            });
        });
        
        document.querySelectorAll('.editor-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const type = tab.dataset.tab;
                ['html', 'css', 'fields'].forEach(t => {
                    const textarea = document.getElementById(`editor-${t}`);
                    if (textarea) textarea.style.display = (t === type) ? 'block' : 'none';
                });
                
                setTimeout(() => AppState.editors[type]?.refresh(), 50);
            });
        });
        
        const btnNewTemplate = document.getElementById('btn-new-template');
        if (btnNewTemplate) btnNewTemplate.addEventListener('click', () => switchView('editor', null));
        
        const btnSaveTemplate = document.getElementById('btn-save-template');
        if (btnSaveTemplate) btnSaveTemplate.addEventListener('click', saveTemplate);
        
        const btnCancelEditor = document.getElementById('btn-cancel-editor');
        if (btnCancelEditor) btnCancelEditor.addEventListener('click', () => switchView('templates'));
        
        const btnRefreshPreview = document.getElementById('btn-refresh-preview');
        if (btnRefreshPreview) btnRefreshPreview.addEventListener('click', updatePreview);
        
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) btnLogout.addEventListener('click', handleLogout);
        
        const btnNewCategory = document.getElementById('btn-new-category');
        if (btnNewCategory) btnNewCategory.addEventListener('click', () => openModal('modal-category'));
        
        const btnSaveCategory = document.getElementById('btn-save-category');
        if (btnSaveCategory) btnSaveCategory.addEventListener('click', saveCategory);
        
        const btnNewNotification = document.getElementById('btn-new-notification');
        if (btnNewNotification) btnNewNotification.addEventListener('click', () => openModal('modal-notification'));
        
        const btnSendNotification = document.getElementById('btn-send-notification');
        if (btnSendNotification) btnSendNotification.addEventListener('click', sendNotification);
        
        const btnExportTemplates = document.getElementById('btn-export-templates');
        if (btnExportTemplates) btnExportTemplates.addEventListener('click', exportTemplates);
        
        const btnExportOrders = document.getElementById('btn-export-orders');
        if (btnExportOrders) btnExportOrders.addEventListener('click', exportOrders);
        
        const btnExportAll = document.getElementById('btn-export-all');
        if (btnExportAll) btnExportAll.addEventListener('click', exportAllData);
        
        const btnClearLogs = document.getElementById('btn-clear-logs');
        if (btnClearLogs) btnClearLogs.addEventListener('click', clearLogs);
        
        // Import zone
        const importZone = document.getElementById('import-zone');
        const importFile = document.getElementById('import-file');
        if (importZone && importFile) {
            importZone.addEventListener('click', () => importFile.click());
            importZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                importZone.classList.add('dragover');
            });
            importZone.addEventListener('dragleave', () => importZone.classList.remove('dragover'));
            importZone.addEventListener('drop', (e) => {
                e.preventDefault();
                importZone.classList.remove('dragover');
                if (e.dataTransfer.files[0]) handleImportFile(e.dataTransfer.files[0]);
            });
            importFile.addEventListener('change', (e) => {
                if (e.target.files[0]) handleImportFile(e.target.files[0]);
            });
        }
        
        // Media upload
        const mediaZone = document.getElementById('media-upload-zone');
        const mediaFile = document.getElementById('media-file');
        if (mediaZone && mediaFile) {
            mediaZone.addEventListener('click', () => mediaFile.click());
            mediaFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) uploadMedia(e.target.files);
            });
        }
        
        // Filtres
        const filterStatus = document.getElementById('filter-status');
        if (filterStatus) filterStatus.addEventListener('change', loadTemplatesList);
        
        const filterCategory = document.getElementById('filter-category');
        if (filterCategory) filterCategory.addEventListener('change', loadTemplatesList);
        
        const filterOrderStatus = document.getElementById('filter-order-status');
        if (filterOrderStatus) filterOrderStatus.addEventListener('change', loadOrders);
        
        const filterUserRole = document.getElementById('filter-user-role');
        if (filterUserRole) filterUserRole.addEventListener('change', loadUsers);
        
        const btnResetFilters = document.getElementById('btn-reset-filters');
        if (btnResetFilters) btnResetFilters.addEventListener('click', () => {
            document.getElementById('filter-status').value = '';
            document.getElementById('filter-category').value = '';
            loadTemplatesList();
        });
        
        console.log('✅ Event listeners configurés');
    }

    // ============================================
    // DASHBOARD STATS
    // ============================================
    async function loadDashboardStats() {
        try {
            const [tplRes, userRes, orderRes, docRes] = await Promise.all([
                db.from('templates').select('id, is_active', { count: 'exact' }),
                db.from('profiles').select('id', { count: 'exact', head: true }),
                db.from('purchases').select('id, amount_paid, payment_status, created_at, template_id'),
                db.from('user_documents').select('id', { count: 'exact', head: true })
            ]);
            
            const templates = tplRes.data || [];
            const activeTemplates = templates.filter(t => t.is_active).length;
            const userCount = userRes.count || 0;
            const orders = orderRes.data || [];
            const orderCount = orders.length;
            const revenue = orders.reduce((sum, o) => sum + (o.amount_paid || 0), 0);
            const docCount = docRes.count || 0;
            
            const setEl = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val;
            };
            
            setEl('stat-templates', activeTemplates);
            setEl('stat-users', userCount);
            setEl('stat-orders', orderCount);
            setEl('stat-revenue', revenue.toLocaleString('fr-FR'));
            setEl('stat-documents', docCount);
            setEl('nav-tpl-count', templates.length);
            setEl('nav-order-count', orderCount);
            
            // Graphique des revenus
            renderRevenueChart(orders);
            
            // Activité récente
            renderRecentActivity(orders);
            
            // Top templates
            renderTopTemplates(orders, templates);
            
        } catch (e) {
            console.error('Erreur stats:', e);
        }
    }

    function renderRevenueChart(orders) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        
        if (AppState.charts.revenue) AppState.charts.revenue.destroy();
        
        const last7Days = [];
        const revenues = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last7Days.push(date.toLocaleDateString('fr-FR', { weekday: 'short' }));
            
            const dayRevenue = orders
                .filter(o => o.created_at && o.created_at.startsWith(dateStr) && o.payment_status === 'completed')
                .reduce((sum, o) => sum + (o.amount_paid || 0), 0);
            revenues.push(dayRevenue);
        }
        
        AppState.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Revenus (FCFA)',
                    data: revenues,
                    borderColor: '#FF6B35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    function renderRecentActivity(orders) {
        const list = document.getElementById('activity-list');
        if (!list) return;
        
        const recent = orders.slice(0, 5);
        
        if (recent.length === 0) {
            list.innerHTML = `
                <li class="activity-item">
                    <div class="activity-icon"><i class="fas fa-inbox"></i></div>
                    <div class="activity-content">
                        <div class="activity-text">Aucune activité récente</div>
                    </div>
                </li>
            `;
            return;
        }
        
        list.innerHTML = recent.map(order => `
            <li class="activity-item">
                <div class="activity-icon" style="background: var(--success-light); color: var(--success);">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">
                        <strong>Nouvelle commande</strong> - ${formatMoney(order.amount_paid)}
                    </div>
                    <div class="activity-time">${formatDate(order.created_at)}</div>
                </div>
            </li>
        `).join('');
    }

    function renderTopTemplates(orders, templates) {
        const tbody = document.getElementById('top-templates-body');
        if (!tbody) return;
        
        const templateStats = {};
        orders.forEach(order => {
            if (!templateStats[order.template_id]) {
                templateStats[order.template_id] = { count: 0, revenue: 0 };
            }
            templateStats[order.template_id].count++;
            templateStats[order.template_id].revenue += order.amount_paid || 0;
        });
        
        const sorted = Object.entries(templateStats)
            .sort((a, b) => b[1].revenue - a[1].revenue)
            .slice(0, 5);
        
        if (sorted.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-light);">Aucune donnée disponible</td></tr>';
            return;
        }
        
        tbody.innerHTML = sorted.map(([tplId, stats]) => {
            const tpl = templates.find(t => t.id === tplId);
            return `
                <tr>
                    <td><span class="table-title">${tpl?.name || tplId}</span></td>
                    <td><span class="table-sub">${tpl?.category_id || '-'}</span></td>
                    <td><strong>${formatMoney(tpl?.price_xaf || 0)}</strong></td>
                    <td>${stats.count}</td>
                    <td><strong style="color: var(--success);">${formatMoney(stats.revenue)}</strong></td>
                </tr>
            `;
        }).join('');
    }

    // ============================================
    // TEMPLATES CRUD
    // ============================================
    async function loadTemplatesList() {
        const tbody = document.getElementById('templates-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Chargement...</td></tr>';
        
        const { data: categories } = await db.from('template_categories').select('id, name');
        const filterCat = document.getElementById('filter-category');
        if (filterCat && categories) {
            const currentVal = filterCat.value;
            filterCat.innerHTML = '<option value="">Toutes</option>' + 
                categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            filterCat.value = currentVal;
        }
        
        let query = db.from('templates').select('id, name, category_id, price_xaf, is_active, created_at').order('created_at', { ascending: false });
        
        const statusFilter = document.getElementById('filter-status')?.value;
        if (statusFilter) query = query.eq('is_active', statusFilter === 'true');
        
        const catFilter = document.getElementById('filter-category')?.value;
        if (catFilter) query = query.eq('category_id', catFilter);
        
        const { data, error } = await query;
        
        if (error) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--error); padding: 40px;">Erreur: ${error.message}</td></tr>`;
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-light);">Aucun template trouvé</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(t => `
            <tr>
                <td style="font-family: monospace; font-size: 0.78rem; color: var(--text-light);">${t.id}</td>
                <td><span class="table-title">${t.name}</span></td>
                <td><span class="table-sub">${t.category_id || '-'}</span></td>
                <td><strong>${formatMoney(t.price_xaf)}</strong></td>
                <td>
                    <span class="status-badge ${t.is_active ? 'status-active' : 'status-inactive'}">
                        <i class="fas fa-${t.is_active ? 'check' : 'times'}-circle"></i>
                        ${t.is_active ? 'Actif' : 'Inactif'}
                    </span>
                </td>
                <td><span class="table-sub">${formatDate(t.created_at)}</span></td>
                <td style="text-align: right;">
                    <button class="btn btn-secondary btn-sm" onclick="window.editTpl('${t.id}')" style="margin-right: 6px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="window.deleteTpl('${t.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async function loadTemplateForEdit(id) {
        const { data, error } = await db.from('templates').select('*').eq('id', id).single();
        
        if (error || !data) {
            showToast('Template introuvable', 'error');
            switchView('templates');
            return;
        }
        
        document.getElementById('tpl-name').value = data.name || '';
        document.getElementById('tpl-category').value = data.category_id || '';
        document.getElementById('tpl-price').value = data.price_xaf || 0;
        document.getElementById('tpl-active').checked = data.is_active !== false;
        document.getElementById('tpl-description').value = data.description || '';
        document.getElementById('tpl-has-photo').checked = data.has_photo || false;
        document.getElementById('tpl-has-color').checked = data.has_color_picker !== false;
        document.getElementById('tpl-featured').checked = data.is_featured || false;
        
        setEditorContent('html', data.html_structure || '');
        setEditorContent('css', data.css_styles || '');
        
        const { data: fields } = await db
            .from('template_fields')
            .select('name, label, type, default_value, is_required, display_order')
            .eq('template_id', id)
            .order('display_order');
        
        setEditorContent('fields', JSON.stringify(fields || [], null, 2));
        
        setTimeout(() => {
            Object.values(AppState.editors).forEach(e => e?.refresh());
            updatePreview();
        }, 100);
    }

    function resetEditor() {
        document.getElementById('tpl-name').value = '';
        document.getElementById('tpl-category').value = '';
        document.getElementById('tpl-price').value = '';
        document.getElementById('tpl-active').checked = true;
        document.getElementById('tpl-description').value = '';
        document.getElementById('tpl-has-photo').checked = false;
        document.getElementById('tpl-has-color').checked = true;
        document.getElementById('tpl-featured').checked = false;
        
        setEditorContent('html', '<div class="cv-container">\n  <h1 id="field-titre">Mon Document</h1>\n  <p id="field-contenu">Contenu ici...</p>\n</div>');
        setEditorContent('css', '.cv-container {\n  padding: 40px;\n  font-family: Arial, sans-serif;\n}\nh1 { color: #0F172A; }');
        setEditorContent('fields', '[\n  {\n    "name": "titre",\n    "label": "Titre",\n    "type": "text",\n    "default": "Mon Document"\n  }\n]');
        
        setTimeout(() => {
            Object.values(AppState.editors).forEach(e => e?.refresh());
            updatePreview();
        }, 100);
    }

    async function saveTemplate() {
        const name = document.getElementById('tpl-name').value.trim();
        if (!name) {
            showToast('Le nom est obligatoire', 'error');
            return;
        }
        
        const payload = {
            name,
            category_id: document.getElementById('tpl-category').value.trim(),
            price_xaf: parseInt(document.getElementById('tpl-price').value) || 0,
            is_active: document.getElementById('tpl-active').checked,
            description: document.getElementById('tpl-description').value.trim(),
            has_photo: document.getElementById('tpl-has-photo').checked,
            has_color_picker: document.getElementById('tpl-has-color').checked,
            is_featured: document.getElementById('tpl-featured').checked,
            html_structure: getEditorContent('html'),
            css_styles: getEditorContent('css')
        };
        
        let templateId = AppState.currentTemplateId || `tpl_${Date.now()}`;
        payload.id = templateId;
        
        const { error: tplError } = await db.from('templates').upsert(payload);
        if (tplError) {
            showToast('Erreur sauvegarde: ' + tplError.message, 'error');
            return;
        }
        
        if (AppState.currentTemplateId) {
            await db.from('template_fields').delete().eq('template_id', AppState.currentTemplateId);
        }
        
        try {
            const fields = JSON.parse(getEditorContent('fields'));
            if (fields && fields.length > 0) {
                const fieldsPayload = fields.map((f, index) => ({
                    id: crypto.randomUUID(),
                    template_id: templateId,
                    field_name: f.name,
                    field_label: f.label,
                    field_type: f.type || 'text',
                    default_value: f.default || '',
                    is_required: f.is_required || false,
                    display_order: index
                }));
                await db.from('template_fields').insert(fieldsPayload);
            }
        } catch (e) {
            showToast('Erreur format JSON des champs', 'error');
            return;
        }
        
        AppState.currentTemplateId = templateId;
        addLog('Template sauvegardé', `ID: ${templateId}, Nom: ${name}`);
        showToast('✅ Template sauvegardé avec succès !');
        await loadTemplatesList();
        await loadDashboardStats();
    }

    // ============================================
    // IMPORT TEMPLATES-REGISTRY.JS
    // ============================================
    // ============================================
// IMPORT TEMPLATES-REGISTRY.JS (VERSION CORRIGÉE)
// ============================================
// ============================================
// IMPORT TEMPLATES-REGISTRY.JS (VERSION FINALE CORRIGÉE)
// Exécute le fichier entier pour préserver toutes les dépendances
// ============================================
async function handleImportFile(file) {
    if (!file.name.endsWith('.js')) {
        showToast('Veuillez sélectionner un fichier .js', 'error');
        return;
    }
    
    const progressDiv = document.getElementById('import-progress');
    const progressBar = document.getElementById('import-progress-bar');
    const progressText = document.getElementById('import-progress-text');
    const importLog = document.getElementById('import-log');
    const resultsDiv = document.getElementById('import-results');
    
    progressDiv.style.display = 'block';
    resultsDiv.style.display = 'none';
    importLog.innerHTML = '';
    
    const log = (msg, type = 'info') => {
        const color = type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--text)';
        importLog.innerHTML += `<div style="color: ${color}; margin-bottom: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.82rem;">[${new Date().toLocaleTimeString()}] ${msg}</div>`;
        importLog.scrollTop = importLog.scrollHeight;
    };
    
    log('📄 Lecture du fichier...');
    
    try {
        let content = await file.text();
        log(`✅ Fichier lu: ${content.length} caractères`);
        
        // ÉTAPE 1 : Nettoyer le code pour l'exécution
        // Supprimer les 'export' pour rendre le code exécutable en contexte global
        content = content.replace(/export\s+function\s+/g, 'function ');
        content = content.replace(/export\s+const\s+/g, 'const ');
        content = content.replace(/export\s+let\s+/g, 'let ');
        content = content.replace(/export\s+var\s+/g, 'var ');
        
        // ÉTAPE 2 : Extraire uniquement le tableau templatesRegistry à la fin
        // On cherche la déclaration du tableau et on l'extrait
        const registryMatch = content.match(/const\s+templatesRegistry\s*=\s*\[([\s\S]*?)\];/);
        
        if (!registryMatch) {
            log('❌ Impossible de trouver le tableau templatesRegistry', 'error');
            showToast('Format de fichier invalide', 'error');
            return;
        }
        
        log(' Tableau templatesRegistry trouvé');
        
        // ÉTAPE 3 : Construire le code exécutable
        // On garde TOUT le fichier (fonctions helpers incluses) + on retourne le tableau
        const executableCode = content + '\n\nreturn typeof templatesRegistry !== "undefined" ? templatesRegistry : [];';
        
        log('️ Compilation du code...');
        
        // ÉTAPE 4 : Exécuter dans un contexte isolé
        const templateLoader = new Function(executableCode);
        const templates = templateLoader();
        
        if (!Array.isArray(templates) || templates.length === 0) {
            log('❌ Aucun template trouvé dans le registre', 'error');
            showToast('Aucun template valide trouvé', 'error');
            return;
        }
        
        log(`✅ ${templates.length} templates compilés avec succès`, 'success');
        
        // ÉTAPE 5 : Importer chaque template dans Supabase
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        const skipped = [];
        
        for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            const progress = ((i + 1) / templates.length) * 100;
            
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${i + 1} / ${templates.length} templates`;
            
            if (!template || !template.id) {
                errorCount++;
                errors.push(`Template ${i}: ID manquant`);
                log(`❌ Template ${i}: ID manquant`, 'error');
                continue;
            }
            
            try {
                log(` Import: ${template.name || template.id}...`);
                
                // Vérifier si le template existe déjà
                const { data: existing } = await db
                    .from('templates')
                    .select('id')
                    .eq('id', template.id)
                    .single();
                
                // Préparer le payload
                const payload = {
                    id: template.id,
                    name: template.name,
                    category_id: template.category || 'general',
                    price_xaf: template.price || 0,
                    description: template.description || '',
                    has_photo: template.hasPhoto || false,
                    has_color_picker: template.hasColorPicker !== false,
                    is_active: true,
                    is_featured: false,
                    html_structure: template.htmlStructure || '',
                    css_styles: template.cssStyles || ''
                };
                
                // Upsert (insert ou update)
                const { error: tplError } = await db.from('templates').upsert(payload);
                
                if (tplError) {
                    // Si erreur de contrainte, essayer un update simple
                    const { error: updateError } = await db
                        .from('templates')
                        .update(payload)
                        .eq('id', template.id);
                    
                    if (updateError) throw updateError;
                }
                
                // Gérer les champs
                if (template.fields && Array.isArray(template.fields) && template.fields.length > 0) {
                    // Supprimer les anciens champs
                    await db.from('template_fields').delete().eq('template_id', template.id);
                    
                    const fieldsPayload = template.fields.map((f, index) => ({
                        id: crypto.randomUUID(),
                        template_id: template.id,
                        field_name: f.name,
                        field_label: f.label,
                        field_type: f.type || 'text',
                        default_value: f.default || '',
                        is_required: f.required || f.is_required || false,
                        display_order: index
                    }));
                    
                    const { error: fieldError } = await db.from('template_fields').insert(fieldsPayload);
                    if (fieldError) {
                        log(`⚠️ Champs non importés pour ${template.name}`, 'error');
                    }
                }
                
                successCount++;
                const action = existing ? 'mis à jour' : 'importé';
                log(`✅ ${template.name} ${action}`, 'success');
                
            } catch (e) {
                errorCount++;
                errors.push(`${template.name || template.id}: ${e.message}`);
                log(`❌ ${template.name || template.id}: ${e.message}`, 'error');
            }
        }
        
        // Résultat final
        resultsDiv.style.display = 'block';
        const isSuccess = errorCount === 0;
        resultsDiv.innerHTML = `
            <div style="background: ${isSuccess ? 'var(--success-light)' : 'var(--warning-light)'}; padding: 20px; border-radius: var(--radius-md); border: 1px solid ${isSuccess ? 'var(--success)' : 'var(--warning)'};">
                <h3 style="margin-bottom: 12px; color: ${isSuccess ? 'var(--success)' : 'var(--warning)'};">
                    <i class="fas fa-${isSuccess ? 'check-circle' : 'exclamation-triangle'}"></i>
                    Import terminé
                </h3>
                <p style="margin-bottom: 8px;"><strong>${successCount}</strong> templates importés/mis à jour avec succès</p>
                ${errorCount > 0 ? `<p style="margin-bottom: 8px;"><strong>${errorCount}</strong> erreurs</p>` : ''}
                ${errors.length > 0 ? `
                    <details style="margin-top: 12px;">
                        <summary style="cursor: pointer; font-weight: 600;">Voir les erreurs</summary>
                        <ul style="margin-top: 8px; padding-left: 20px; font-size: 0.85rem; color: var(--error); max-height: 200px; overflow-y: auto;">
                            ${errors.map(e => `<li>${e}</li>`).join('')}
                        </ul>
                    </details>
                ` : ''}
            </div>
        `;
        
        addLog('Import templates-registry.js', `${successCount} succès, ${errorCount} erreurs`);
        showToast(`Import terminé: ${successCount} succès, ${errorCount} erreurs`, errorCount > 0 ? 'warning' : 'success');
        
        await loadTemplatesList();
        await loadDashboardStats();
        
    } catch (e) {
        log(`❌ Erreur fatale: ${e.message}`, 'error');
        console.error('Import error:', e);
        showToast('Erreur lors de l\'import: ' + e.message, 'error');
    }
}

    // ============================================
    // CATEGORIES
    // ============================================
    async function loadCategories() {
        const tbody = document.getElementById('categories-table-body');
        if (!tbody) return;
        
        const { data: categories, error } = await db.from('template_categories').select('*').order('display_order');
        
        if (error) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--error);">Erreur: ${error.message}</td></tr>`;
            return;
        }
        
        if (!categories || categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Aucune catégorie</td></tr>';
            return;
        }
        
        // Compter les templates par catégorie
        const { data: templates } = await db.from('templates').select('category_id');
        const counts = {};
        templates?.forEach(t => { counts[t.category_id] = (counts[t.category_id] || 0) + 1; });
        
        tbody.innerHTML = categories.map(c => `
            <tr>
                <td style="font-family: monospace; font-size: 0.78rem;">${c.id}</td>
                <td><span class="table-title">${c.name}</span></td>
                <td><span class="table-sub">${c.description || '-'}</span></td>
                <td><i class="fas ${c.icon || 'fa-folder'}"></i> ${c.icon || '-'}</td>
                <td><span class="badge" style="background: var(--primary-light); color: var(--primary); padding: 4px 10px; border-radius: 99px; font-weight: 700;">${counts[c.id] || 0}</span></td>
                <td style="text-align: right;">
                    <button class="btn btn-danger btn-sm" onclick="window.deleteCategory('${c.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async function saveCategory() {
        const id = document.getElementById('cat-id').value.trim();
        const name = document.getElementById('cat-name').value.trim();
        
        if (!id || !name) {
            showToast('ID et nom sont obligatoires', 'error');
            return;
        }
        
        const payload = {
            id,
            name,
            description: document.getElementById('cat-description').value.trim(),
            icon: document.getElementById('cat-icon').value.trim() || 'fa-folder',
            display_order: 0
        };
        
        const { error } = await db.from('template_categories').upsert(payload);
        
        if (error) {
            showToast('Erreur: ' + error.message, 'error');
            return;
        }
        
        addLog('Catégorie créée', `ID: ${id}, Nom: ${name}`);
        showToast('✅ Catégorie enregistrée');
        closeModal('modal-category');
        await loadCategories();
        
        document.getElementById('cat-id').value = '';
        document.getElementById('cat-name').value = '';
        document.getElementById('cat-description').value = '';
    }

    // ============================================
    // ORDERS
    // ============================================
    async function loadOrders() {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;
        
        let query = db.from('purchases').select('*, profiles(full_name, email), templates(name)').order('created_at', { ascending: false });
        
        const statusFilter = document.getElementById('filter-order-status')?.value;
        if (statusFilter) query = query.eq('payment_status', statusFilter);
        
        const methodFilter = document.getElementById('filter-order-method')?.value;
        if (methodFilter) query = query.eq('payment_method', methodFilter);
        
        const { data, error } = await query.limit(100);
        
        if (error) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--error);">Erreur: ${error.message}</td></tr>`;
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Aucune commande</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(o => {
            const statusClass = o.payment_status === 'completed' ? 'status-completed' : 
                               o.payment_status === 'pending' ? 'status-pending' : 'status-failed';
            return `
                <tr>
                    <td style="font-family: monospace; font-size: 0.78rem;">${o.id.slice(0, 8)}</td>
                    <td>
                        <div class="user-card">
                            <div class="user-avatar-sm">${getInitials(o.profiles?.full_name || o.guest_email)}</div>
                            <div>
                                <div class="table-title">${o.profiles?.full_name || 'Invité'}</div>
                                <div class="table-sub">${o.guest_email || o.profiles?.email || '-'}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="table-title">${o.templates?.name || '-'}</span></td>
                    <td><strong>${formatMoney(o.amount_paid, o.currency)}</strong></td>
                    <td><span class="table-sub">${o.payment_method}</span></td>
                    <td><span class="status-badge ${statusClass}">${o.payment_status}</span></td>
                    <td><span class="table-sub">${formatDate(o.created_at)}</span></td>
                </tr>
            `;
        }).join('');
    }

    // ============================================
    // USERS
    // ============================================
    async function loadUsers() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        let query = db.from('profiles').select('*, purchases(count)').order('created_at', { ascending: false });
        
        const roleFilter = document.getElementById('filter-user-role')?.value;
        if (roleFilter) query = query.eq('role', roleFilter);
        
        const { data, error } = await query.limit(100);
        
        if (error) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--error);">Erreur: ${error.message}</td></tr>`;
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Aucun utilisateur</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(u => `
            <tr>
                <td>
                    <div class="user-card">
                        <div class="user-avatar-sm">${getInitials(u.full_name || u.email)}</div>
                        <div>
                            <div class="table-title">${u.full_name || 'Utilisateur'}</div>
                        </div>
                    </div>
                </td>
                <td><span class="table-sub">${u.email}</span></td>
                <td>
                    <span class="status-badge ${u.role === 'admin' ? 'status-info' : 'status-active'}">
                        ${u.role || 'user'}
                    </span>
                </td>
                <td><span class="table-sub">${formatDate(u.created_at)}</span></td>
                <td><strong>${u.purchases?.[0]?.count || 0}</strong></td>
                <td style="text-align: right;">
                    <button class="btn btn-secondary btn-sm" onclick="window.viewUser('${u.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // ============================================
    // NOTIFICATIONS
    // ============================================
    async function loadNotifications() {
        const container = document.getElementById('notifications-list');
        if (!container) return;
        
        const { data, error } = await db.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
        
        if (error) {
            container.innerHTML = `<div class="empty-state"><p style="color: var(--error);">Erreur: ${error.message}</p></div>`;
            return;
        }
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-bell-slash"></i></div>
                    <h3>Aucune notification</h3>
                    <p>Créez votre première notification pour informer les utilisateurs.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.map(n => `
            <div class="notification-item">
                <div class="activity-icon" style="background: ${n.type === 'success' ? 'var(--success-light)' : n.type === 'error' ? 'var(--error-light)' : n.type === 'warning' ? 'var(--warning-light)' : 'var(--info-light)'}; color: ${n.type === 'success' ? 'var(--success)' : n.type === 'error' ? 'var(--error)' : n.type === 'warning' ? 'var(--warning)' : 'var(--info)'};">
                    <i class="fas fa-${n.type === 'success' ? 'check' : n.type === 'error' ? 'exclamation' : n.type === 'warning' ? 'exclamation-triangle' : 'info'}-circle"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; color: var(--dark); margin-bottom: 4px;">${n.title}</div>
                    <div style="font-size: 0.88rem; color: var(--text-light); margin-bottom: 8px;">${n.message}</div>
                    <div style="font-size: 0.75rem; color: var(--text-lighter);">${formatDate(n.created_at)}</div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="window.deleteNotification('${n.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    async function sendNotification() {
        const title = document.getElementById('notif-title').value.trim();
        const message = document.getElementById('notif-message').value.trim();
        
        if (!title || !message) {
            showToast('Titre et message sont obligatoires', 'error');
            return;
        }
        
        const target = document.getElementById('notif-target').value;
        const type = document.getElementById('notif-type').value;
        const link = document.getElementById('notif-link').value.trim();
        
        let userIds = [];
        
        if (target === 'all') {
            const { data: users } = await db.from('profiles').select('id');
            userIds = users?.map(u => u.id) || [];
        } else if (target === 'admins') {
            const { data: admins } = await db.from('profiles').select('id').eq('role', 'admin');
            userIds = admins?.map(a => a.id) || [];
        }
        
        const notifications = userIds.map(userId => ({
            id: crypto.randomUUID(),
            user_id: userId,
            title,
            message,
            type,
            is_read: false,
            link: link || null
        }));
        
        const { error } = await db.from('notifications').insert(notifications);
        
        if (error) {
            showToast('Erreur: ' + error.message, 'error');
            return;
        }
        
        addLog('Notification envoyée', `${title} à ${userIds.length} utilisateur(s)`);
        showToast(`✅ Notification envoyée à ${userIds.length} utilisateur(s)`);
        closeModal('modal-notification');
        await loadNotifications();
        
        document.getElementById('notif-title').value = '';
        document.getElementById('notif-message').value = '';
        document.getElementById('notif-link').value = '';
    }

    // ============================================
    // MEDIA UPLOAD
    // ============================================
    async function uploadMedia(files) {
        for (const file of files) {
            const fileName = `assets/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const { data, error } = await db.storage.from('template-assets').upload(fileName, file);
            
            if (error) {
                showToast(`Erreur upload ${file.name}: ${error.message}`, 'error');
                continue;
            }
            
            const { data: { publicUrl } } = db.storage.from('template-assets').getPublicUrl(fileName);
            
            const gallery = document.getElementById('media-gallery');
            if (gallery) {
                const isImage = file.type.startsWith('image/');
                gallery.innerHTML += `
                    <div style="border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; background: var(--white);">
                        ${isImage ? `<img src="${publicUrl}" style="width: 100%; height: 120px; object-fit: cover;">` : `<div style="width: 100%; height: 120px; background: var(--bg); display: flex; align-items: center; justify-content: center; color: var(--text-light);"><i class="fas fa-file" style="font-size: 2rem;"></i></div>`}
                        <div style="padding: 8px;">
                            <div style="font-size: 0.75rem; font-weight: 600; color: var(--dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${file.name}</div>
                            <button class="btn btn-secondary btn-xs" style="width: 100%; margin-top: 4px;" onclick="navigator.clipboard.writeText('${publicUrl}'); showToast('URL copiée !')">
                                <i class="fas fa-copy"></i> Copier URL
                            </button>
                        </div>
                    </div>
                `;
            }
        }
        
        addLog('Médias uploadés', `${files.length} fichier(s)`);
        showToast(`${files.length} fichier(s) uploadé(s)`);
    }

    // ============================================
    // LOGS
    // ============================================
    function renderLogs() {
        const container = document.getElementById('logs-container');
        if (!container) return;
        
        if (AppState.logs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-clipboard-list"></i></div>
                    <h3>Journal vide</h3>
                    <p>Les actions administratives seront enregistrées ici.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = AppState.logs.slice(0, 50).map(log => `
            <div class="log-entry">
                <div class="log-time">${new Date(log.time).toLocaleString('fr-FR')}</div>
                <div class="log-action"><strong>${log.action}</strong> - ${log.details}</div>
                <div class="log-user">${log.user}</div>
            </div>
        `).join('');
    }

    function clearLogs() {
        if (!confirm('Effacer tout le journal ?')) return;
        AppState.logs = [];
        localStorage.removeItem('admin_logs');
        renderLogs();
        showToast('Journal effacé');
    }

    // ============================================
    // EXPORT/IMPORT
    // ============================================
    async function exportTemplates() {
        const { data } = await db.from('templates').select('*');
        if (!data) return;
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `takidoc-templates-${Date.now()}.json`;
        a.click();
        
        addLog('Export templates', `${data.length} templates exportés`);
        showToast('Templates exportés');
    }

    async function exportOrders() {
        const { data } = await db.from('purchases').select('*');
        if (!data) return;
        
        const csv = [
            ['ID', 'User ID', 'Template ID', 'Amount', 'Currency', 'Method', 'Status', 'Date'].join(','),
            ...data.map(o => [o.id, o.user_id, o.template_id, o.amount_paid, o.currency, o.payment_method, o.payment_status, o.created_at].join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `takidoc-orders-${Date.now()}.csv`;
        a.click();
        
        addLog('Export commandes', `${data.length} commandes exportées`);
        showToast('Commandes exportées');
    }

    async function exportAllData() {
        const [templates, fields, categories, users, orders, docs] = await Promise.all([
            db.from('templates').select('*'),
            db.from('template_fields').select('*'),
            db.from('template_categories').select('*'),
            db.from('profiles').select('*'),
            db.from('purchases').select('*'),
            db.from('user_documents').select('*')
        ]);
        
        const backup = {
            exportDate: new Date().toISOString(),
            templates: templates.data,
            template_fields: fields.data,
            template_categories: categories.data,
            profiles: users.data,
            purchases: orders.data,
            user_documents: docs.data
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `takidoc-backup-${Date.now()}.json`;
        a.click();
        
        addLog('Sauvegarde complète', 'Toutes les données exportées');
        showToast('Sauvegarde complète exportée');
    }

    // ============================================
    // PREVIEW
    // ============================================
    function updatePreview() {
        const html = getEditorContent('html');
        const css = getEditorContent('css');
        const frame = document.getElementById('preview-frame');
        
        if (!frame) return;
        
        const doc = frame.contentDocument || frame.contentWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
                <style>
                    body { margin: 0; padding: 20px; font-family: 'Inter', sans-serif; background: #f8fafc; }
                    ${css}
                    :root { --doc-primary-color: #0F172A; }
                </style>
            </head>
            <body>${html}</body>
            </html>
        `);
        doc.close();
    }

    // ============================================
    // MODALS
    // ============================================
    window.openModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    };

    window.closeModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    };

    // ============================================
    // LOGOUT
    // ============================================
    async function handleLogout() {
        if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
        await db.auth.signOut();
        window.location.href = 'index.html';
    }

    // ============================================
    // GLOBAL FUNCTIONS
    // ============================================
    window.editTpl = (id) => switchView('editor', id);
    
    window.deleteTpl = async (id) => {
        if (!confirm('Supprimer définitivement ce template ?')) return;
        await db.from('templates').delete().eq('id', id);
        await db.from('template_fields').delete().eq('template_id', id);
        addLog('Template supprimé', `ID: ${id}`);
        showToast('Template supprimé');
        await loadTemplatesList();
        await loadDashboardStats();
    };
    
    window.deleteCategory = async (id) => {
        if (!confirm('Supprimer cette catégorie ?')) return;
        await db.from('template_categories').delete().eq('id', id);
        addLog('Catégorie supprimée', `ID: ${id}`);
        showToast('Catégorie supprimée');
        await loadCategories();
    };
    
    window.viewUser = async (id) => {
        const { data: user } = await db.from('profiles').select('*').eq('id', id).single();
        const { data: orders } = await db.from('purchases').select('*').eq('user_id', id);
        const { data: docs } = await db.from('user_documents').select('*').eq('user_id', id);
        
        const content = document.getElementById('user-details-content');
        if (content && user) {
            content.innerHTML = `
                <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                    <div class="user-avatar-sm" style="width: 64px; height: 64px; font-size: 1.5rem;">${getInitials(user.full_name || user.email)}</div>
                    <div>
                        <h3 style="margin-bottom: 4px;">${user.full_name || 'Utilisateur'}</h3>
                        <p style="color: var(--text-light);">${user.email}</p>
                        <span class="status-badge ${user.role === 'admin' ? 'status-info' : 'status-active'}">${user.role || 'user'}</span>
                    </div>
                </div>
                <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
                    <div class="stat-card" style="padding: 16px;">
                        <div class="stat-value" style="font-size: 1.5rem;">${orders?.length || 0}</div>
                        <div class="stat-label">Achats</div>
                    </div>
                    <div class="stat-card" style="padding: 16px;">
                        <div class="stat-value" style="font-size: 1.5rem;">${docs?.length || 0}</div>
                        <div class="stat-label">Documents</div>
                    </div>
                    <div class="stat-card" style="padding: 16px;">
                        <div class="stat-value" style="font-size: 1.5rem;">${formatMoney(orders?.reduce((s, o) => s + (o.amount_paid || 0), 0))}</div>
                        <div class="stat-label">Dépensé</div>
                    </div>
                </div>
                <div style="margin-top: 16px; padding: 16px; background: var(--bg); border-radius: var(--radius-md);">
                    <div style="font-size: 0.82rem; color: var(--text-light); margin-bottom: 4px;">Inscrit le</div>
                    <div style="font-weight: 600;">${formatDate(user.created_at)}</div>
                </div>
            `;
        }
        
        openModal('modal-user');
    };
    
    window.deleteNotification = async (id) => {
        if (!confirm('Supprimer cette notification ?')) return;
        await db.from('notifications').delete().eq('id', id);
        showToast('Notification supprimée');
        await loadNotifications();
    };

    // ============================================
    // START
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();