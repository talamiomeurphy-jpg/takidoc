// TakiDoc — Dashboard admin v2 (L'équipe Meurphy)
(() => {
'use strict';
const URL_ = 'https://wyfkogowsdbxctbpfuud.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM'; // clé anon publique : la sécurité repose sur les RLS
const db = window.supabase.createClient(URL_, KEY);

const $ = id => document.getElementById(id);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n, c = 'FCFA') => new Intl.NumberFormat('fr-FR').format(n || 0) + ' ' + (c === 'XAF' ? 'FCFA' : c);
const date = d => d ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d)) : '—';
const initials = n => String(n || 'AD').split(/[\s._@-]+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'AD';
const empty = (icon, txt) => `<div class="empty"><i class="fas ${icon}"></i>${esc(txt)}</div>`;
const rowEmpty = (n, txt) => `<tr><td colspan="${n}"><div class="empty">${esc(txt)}</div></td></tr>`;

const S = {
  me: null, tplId: null, ed: {}, chart: null, cats: [], pvTimer: null,
  logs: JSON.parse(localStorage.getItem('td_logs') || '[]'),
  cfg: Object.assign({ rows: 100, days: 14 }, JSON.parse(localStorage.getItem('td_cfg') || '{}'))
};

function toast(msg, type = 'success') {
  const t = $('toast'); t.textContent = msg; t.className = `toast ${type} show`;
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3500);
}
const fail = (ctx, e) => { console.error(ctx, e); toast(`${ctx} : ${e.message || e}`, 'error'); };
function log(action, details = '') {
  S.logs.unshift({ time: new Date().toISOString(), action, details, user: S.me?.email || '?' });
  S.logs = S.logs.slice(0, 200); localStorage.setItem('td_logs', JSON.stringify(S.logs)); renderLogs();
}
async function busy(btn, fn) {
  btn.disabled = true;
  try { await fn(); } catch (e) { fail('Erreur', e); } finally { btn.disabled = false; }
}
function download(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const csvCell = v => { v = String(v ?? ''); return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
const toCsv = (head, rows) => '\uFEFF' + [head, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
const openM = id => $(id).classList.add('on');
const closeM = id => $(id).classList.remove('on');

// ---------- Init ----------
async function init() {
  try {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return location.replace('auth.html?action=login&next=admin.html');
    const { data: p, error } = await db.from('profiles').select('id, role, email, full_name').eq('id', session.user.id).single();
    if (error || p?.role !== 'admin') { alert('Accès refusé : droits administrateur requis.'); return location.replace('index.html'); }
    S.me = p;
    $('me-av').textContent = initials(p.full_name || p.email);
    $('me-name').textContent = p.full_name || p.email;
    $('set-rows').value = S.cfg.rows; $('set-days').value = S.cfg.days;
    initEditors(); bind(); renderLogs();
    await Promise.all([loadCats(), loadDashboard()]);
    $('load').classList.add('off');
  } catch (e) { fail('Chargement impossible', e); $('load').classList.add('off'); }
}

// ---------- Navigation ----------
const TITLES = { dashboard: 'Tableau de bord', templates: 'Templates', editor: 'Éditeur', import: 'Import registry', categories: 'Catégories', orders: 'Commandes', users: 'Utilisateurs', messages: 'Messages', notifications: 'Notifications', media: 'Médias', logs: 'Journal d\'audit', settings: 'Paramètres', backup: 'Sauvegarde' };
const LOADERS = { dashboard: () => loadDashboard(), templates: () => loadTemplates(), categories: () => loadCats(true), orders: () => loadOrders(), users: () => loadUsers(), messages: () => loadMessages(), notifications: () => loadNotifs(), media: () => loadMedia(), logs: () => renderLogs() };

function go(view, id = null) {
  $$('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + view));
  $$('.ni').forEach(n => n.classList.toggle('on', n.dataset.view === view));
  $('title').textContent = view === 'editor' ? (id ? 'Modifier le template' : 'Nouveau template') : TITLES[view];
  $('gsearch').value = ''; $('sb').classList.remove('open');
  if (view === 'editor') openEditor(id); else LOADERS[view]?.();
  scrollTo({ top: 0 });
}

function bind() {
  $$('.ni').forEach(n => n.onclick = () => go(n.dataset.view));
  $('burger').onclick = () => $('sb').classList.toggle('open');
  $('logout').onclick = async () => { if (confirm('Se déconnecter ?')) { await db.auth.signOut(); location.href = 'index.html'; } };
  $$('[data-close]').forEach(b => b.onclick = () => closeM(b.closest('.ov').id));
  $$('.ov').forEach(o => o.onclick = e => { if (e.target === o) closeM(o.id); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.ov.on').forEach(o => closeM(o.id)); });

  // Recherche globale : filtre les lignes visibles
  $('gsearch').oninput = e => {
    const q = e.target.value.toLowerCase();
    $$('.view.on tbody tr, .view.on .ni2').forEach(r => r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none');
  };

  // Templates
  $('new-tpl').onclick = () => go('editor');
  $('exp-tpl').onclick = async () => { const { data, error } = await db.from('templates').select('*'); if (error) return fail('Export', error); download(`takidoc-templates-${Date.now()}.json`, JSON.stringify(data, null, 2), 'application/json'); log('Export templates', `${data.length} lignes`); };
  ['f-status', 'f-cat'].forEach(i => $(i).onchange = loadTemplates);
  $('tb-tpl').onclick = tplActions;

  // Editor
  $('ed-cancel').onclick = () => go('templates');
  $('ed-save').onclick = e => busy(e.currentTarget, saveTemplate);
  $('pv-refresh').onclick = preview;
  $('t-photo').onchange = $('t-color').onchange = check;
  $('t-thumb-file').onchange = e => { const f = e.target.files[0]; if (f) setThumb(URL.createObjectURL(f)); };
  $('css-var').onclick = () => {
    const css = val('css');
    if (css.includes('--doc-primary-color')) return toast('Le CSS utilise déjà --doc-primary-color', 'warning');
    const cnt = {};
    for (const m of css.matchAll(/#([0-9a-f]{6})\b/gi)) { const h = '#' + m[1].toLowerCase(); cnt[h] = (cnt[h] || 0) + 1; }
    const vivid = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); return Math.max(...c) - Math.min(...c) > 60; };
    const top = Object.entries(cnt).filter(([h]) => vivid(h)).sort((a, b) => b[1] - a[1])[0];
    if (!top) return toast('Aucune couleur vive (#rrggbb) trouvée dans le CSS', 'warning');
    if (!confirm(`Remplacer les ${top[1]} occurrence(s) de ${top[0]} par var(--doc-primary-color, ${top[0]}) ?\nLe document gardera cette couleur tant que l'utilisateur n'en choisit pas une autre.`)) return;
    S.ed.css.setValue(css.replace(new RegExp(top[0], 'gi'), `var(--doc-primary-color, ${top[0]})`));
    $('t-color').checked = true; toast('Couleur convertie : pensez à enregistrer');
  };
  $('pv-color').oninput = preview; $('pv-a4').onchange = preview;
  $('fform').addEventListener('input', formEdit); $('fform').addEventListener('change', formEdit); $('fform').addEventListener('click', formClick);
  $$('.tab').forEach(t => t.onclick = () => showTab(t.dataset.tab));

  // Import
  const drop = $('drop');
  drop.onclick = () => $('imp-file').click();
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('dz'); };
  drop.ondragleave = () => drop.classList.remove('dz');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('dz'); if (e.dataTransfer.files[0]) importRegistry(e.dataTransfer.files[0]); };
  $('imp-file').onchange = e => { if (e.target.files[0]) importRegistry(e.target.files[0]); e.target.value = ''; };

  // Catégories
  $('new-cat').onclick = () => catModal();
  $('c-save').onclick = e => busy(e.currentTarget, saveCat);
  $('tb-cat').onclick = e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'edit') catModal(S.cats.find(c => c.id === b.dataset.id)); else delCat(b.dataset.id);
  };

  // Commandes / utilisateurs
  ['f-ostatus', 'f-omethod'].forEach(i => $(i).onchange = loadOrders);
  $('exp-ord').onclick = exportOrders;
  $('tb-ord').onchange = e => { if (e.target.dataset.status) setOrderStatus(e.target.dataset.status, e.target.value); };
  $('f-role').onchange = loadUsers;
  $('exp-usr').onclick = exportUsers;
  $('tb-usr').onclick = e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'view') viewUser(b.dataset.id); else toggleRole(b.dataset.id, b.dataset.role);
  };

  // Notifications / messages
  $('new-notif').onclick = () => openM('m-notif');
  $('n-send').onclick = e => busy(e.currentTarget, sendNotif);
  $('notifs').onclick = e => { const b = e.target.closest('[data-del]'); if (b) delNotifGroup(b.dataset.del); };
  $('msgs').onclick = e => { const b = e.target.closest('[data-del]'); if (b) delMessage(b.dataset.del); };

  // Médias
  $('m-drop').onclick = () => $('m-file').click();
  $('m-file').onchange = e => { if (e.target.files.length) uploadMedia([...e.target.files]); e.target.value = ''; };
  $('gal').onclick = e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'copy') navigator.clipboard.writeText(b.dataset.url).then(() => toast('URL copiée')); else delMedia(b.dataset.name);
  };

  // Divers
  $('clear-logs').onclick = () => { if (confirm('Vider le journal ?')) { S.logs = []; localStorage.removeItem('td_logs'); renderLogs(); } };
  $('set-save').onclick = () => { S.cfg = { rows: +$('set-rows').value, days: +$('set-days').value }; localStorage.setItem('td_cfg', JSON.stringify(S.cfg)); toast('Paramètres enregistrés'); };
  $('bk-exp').onclick = e => busy(e.currentTarget, exportAll);
  $('bk-imp').onclick = e => busy(e.currentTarget, importBackup);
}

// ---------- Dashboard ----------
async function loadDashboard() {
  const [t, u, o, d] = await Promise.all([
    db.from('templates').select('id, name, category_id, price_xaf, is_active'),
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('purchases').select('id, amount_paid, currency, payment_status, created_at, template_id').order('created_at', { ascending: false }),
    db.from('user_documents').select('id', { count: 'exact', head: true })
  ]);
  const err = t.error || u.error || o.error || d.error; if (err) return fail('Statistiques', err);
  const tpls = t.data, orders = o.data, paid = orders.filter(x => x.payment_status === 'completed');
  const set = (id, v) => $(id).textContent = v;
  set('s-tpl', tpls.filter(x => x.is_active).length); set('s-usr', u.count || 0);
  set('s-ord', paid.length); set('s-rev', new Intl.NumberFormat('fr-FR').format(paid.reduce((s, x) => s + x.amount_paid, 0)));
  set('s-doc', d.count || 0); set('s-pen', orders.filter(x => x.payment_status === 'pending').length);
  set('c-tpl', tpls.length); set('c-ord', orders.length);

  // Graphique
  const n = S.cfg.days, labels = [], vals = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(); dt.setDate(dt.getDate() - i);
    const key = dt.toLocaleDateString('sv-SE');
    labels.push(dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
    vals.push(paid.filter(x => new Date(x.created_at).toLocaleDateString('sv-SE') === key).reduce((s, x) => s + x.amount_paid, 0));
  }
  S.chart?.destroy();
  S.chart = new Chart($('chart'), { type: 'bar', data: { labels, datasets: [{ data: vals, backgroundColor: '#FF6B35', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => money(c.parsed.y) } } }, scales: { y: { beginAtZero: true } } } });

  // Dernières commandes
  const name = id => tpls.find(x => x.id === id)?.name || id;
  $('recent').innerHTML = orders.slice(0, 6).map(x => `<div class="act"><div style="flex:1"><span class="t">${esc(name(x.template_id))}</span><span class="s">${date(x.created_at)}</span></div><div><strong>${money(x.amount_paid, x.currency)}</strong><br>${statusBadge(x.payment_status)}</div></div>`).join('') || empty('fa-inbox', 'Aucune commande pour le moment');

  // Top templates
  const agg = {};
  paid.forEach(x => { (agg[x.template_id] ||= { n: 0, r: 0 }); agg[x.template_id].n++; agg[x.template_id].r += x.amount_paid; });
  const top = Object.entries(agg).sort((a, b) => b[1].r - a[1].r).slice(0, 5);
  $('top').innerHTML = top.map(([id, s]) => { const x = tpls.find(t => t.id === id); return `<tr><td><span class="t">${esc(x?.name || id)}</span></td><td>${esc(x?.category_id || '—')}</td><td>${money(x?.price_xaf)}</td><td>${s.n}</td><td><strong>${money(s.r)}</strong></td></tr>`; }).join('') || rowEmpty(5, 'Aucune vente enregistrée');
}
const statusBadge = s => `<span class="bdg ${s === 'completed' ? 'b-ok' : s === 'pending' ? 'b-wa' : 'b-er'}">${({ completed: 'Payé', pending: 'En attente', failed: 'Échoué' })[s] || esc(s)}</span>`;

// ---------- Catégories ----------
async function loadCats(render) {
  const { data, error } = await db.from('template_categories').select('*').order('display_order');
  if (error) return fail('Catégories', error);
  S.cats = data;
  const opts = data.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
  const cur = $('f-cat').value; $('f-cat').innerHTML = '<option value="">Toutes les catégories</option>' + opts; $('f-cat').value = cur;
  $('cat-list').innerHTML = data.map(c => `<option value="${esc(c.name)}"></option>`).join('');
  if (!render) return;
  const { data: t } = await db.from('templates').select('category_id');
  const cnt = {}; (t || []).forEach(x => cnt[x.category_id] = (cnt[x.category_id] || 0) + 1);
  $('tb-cat').innerHTML = data.map(c => `<tr><td class="mono">${esc(c.id)}</td><td><span class="t"><i class="fas ${esc(c.icon || 'fa-folder')}" style="color:var(--p);margin-right:8px"></i>${esc(c.name)}</span></td><td class="s">${esc(c.description || '—')}</td><td>${c.display_order ?? 0}</td><td>${cnt[c.id] || 0}</td><td class="r"><button class="btn sm" data-act="edit" data-id="${esc(c.id)}" aria-label="Modifier"><i class="fas fa-edit"></i></button> <button class="btn sm dg" data-act="del" data-id="${esc(c.id)}" aria-label="Supprimer"><i class="fas fa-trash"></i></button></td></tr>`).join('') || rowEmpty(6, 'Aucune catégorie');
}
function catModal(c) {
  $('c-id').value = c?.id || ''; $('c-id').disabled = !!c; $('c-name').value = c?.name || '';
  $('c-desc').value = c?.description || ''; $('c-icon').value = c?.icon || 'fa-folder'; $('c-order').value = c?.display_order ?? 0;
  openM('m-cat');
}
async function saveCat() {
  const id = $('c-id').value.trim().toLowerCase(), name = $('c-name').value.trim();
  if (!/^[a-z0-9_-]+$/.test(id)) return toast('ID invalide (lettres, chiffres, - et _)', 'error');
  if (!name) return toast('Le nom est obligatoire', 'error');
  const { error } = await db.from('template_categories').upsert({ id, name, description: $('c-desc').value.trim(), icon: $('c-icon').value.trim() || 'fa-folder', display_order: +$('c-order').value || 0 });
  if (error) return fail('Enregistrement', error);
  log('Catégorie enregistrée', `${id} — ${name}`); toast('Catégorie enregistrée'); closeM('m-cat'); loadCats(true);
}
async function delCat(id) {
  const { count } = await db.from('templates').select('id', { count: 'exact', head: true }).eq('category_id', id);
  if (count) return toast(`Impossible : ${count} template(s) utilisent cette catégorie`, 'warning');
  if (!confirm(`Supprimer la catégorie « ${id} » ?`)) return;
  const { error } = await db.from('template_categories').delete().eq('id', id);
  if (error) return fail('Suppression', error);
  log('Catégorie supprimée', id); toast('Catégorie supprimée'); loadCats(true);
}

// ---------- Templates ----------
async function loadTemplates() {
  await loadCats();
  let q = db.from('templates').select('id, name, category_id, price_xaf, is_active, is_featured, created_at').order('created_at', { ascending: false }).limit(S.cfg.rows);
  if ($('f-status').value) q = q.eq('is_active', $('f-status').value === 'true');
  if ($('f-cat').value) q = q.eq('category_id', $('f-cat').value);
  const { data, error } = await q; if (error) return fail('Templates', error);
  const cn = id => S.cats.find(c => c.id === id)?.name || id || '—';
  $('tb-tpl').innerHTML = data.map(t => `<tr><td><span class="t">${esc(t.name)}${t.is_featured ? ' <i class="fas fa-star" style="color:var(--wa)" title="Mis en avant"></i>' : ''}</span><span class="mono">${esc(t.id)}</span></td><td>${esc(cn(t.category_id))}</td><td>${money(t.price_xaf)}</td><td><span class="bdg ${t.is_active ? 'b-ok' : 'b-wa'}">${t.is_active ? 'Actif' : 'Inactif'}</span></td><td class="s">${date(t.created_at)}</td><td class="r"><button class="btn sm" data-act="toggle" data-id="${esc(t.id)}" data-on="${t.is_active}" title="${t.is_active ? 'Désactiver' : 'Activer'}"><i class="fas fa-${t.is_active ? 'eye-slash' : 'eye'}"></i></button> <button class="btn sm" data-act="dup" data-id="${esc(t.id)}" title="Dupliquer"><i class="fas fa-copy"></i></button> <button class="btn sm" data-act="edit" data-id="${esc(t.id)}" title="Modifier"><i class="fas fa-edit"></i></button> <button class="btn sm dg" data-act="del" data-id="${esc(t.id)}" title="Supprimer"><i class="fas fa-trash"></i></button></td></tr>`).join('') || rowEmpty(6, 'Aucun template trouvé');
  $('c-tpl').textContent = data.length;
}
async function tplActions(e) {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const id = b.dataset.id;
  if (b.dataset.act === 'edit') return go('editor', id);
  if (b.dataset.act === 'toggle') {
    const { error } = await db.from('templates').update({ is_active: b.dataset.on !== 'true' }).eq('id', id);
    if (error) return fail('Mise à jour', error); log('Statut template modifié', id); return loadTemplates();
  }
  if (b.dataset.act === 'dup') {
    const { data: t, error } = await db.from('templates').select('*').eq('id', id).single(); if (error) return fail('Duplication', error);
    const { data: f } = await db.from('template_fields').select('*').eq('template_id', id);
    const nid = `tpl_${Date.now()}`;
    const { created_at, updated_at, ...rest } = t;
    const r = await db.from('templates').insert({ ...rest, id: nid, name: t.name + ' (copie)', is_active: false });
    if (r.error) return fail('Duplication', r.error);
    if (f?.length) await db.from('template_fields').insert(f.map(({ id: _i, created_at: _c, ...x }) => ({ ...x, template_id: nid })));
    log('Template dupliqué', `${id} → ${nid}`); toast('Template dupliqué (inactif)'); return loadTemplates();
  }
  if (b.dataset.act === 'del') {
    const { count } = await db.from('purchases').select('id', { count: 'exact', head: true }).eq('template_id', id);
    if (count) return toast(`${count} achat(s) liés : désactivez le template plutôt que de le supprimer`, 'warning');
    if (!confirm('Supprimer définitivement ce template et ses champs ?')) return;
    let r = await db.from('template_fields').delete().eq('template_id', id); if (r.error) return fail('Suppression', r.error);
    r = await db.from('templates').delete().eq('id', id); if (r.error) return fail('Suppression', r.error);
    log('Template supprimé', id); toast('Template supprimé'); loadTemplates();
  }
}

// ---------- Éditeur ----------
function initEditors() {
  const base = { lineNumbers: true, theme: 'dracula', lineWrapping: true, tabSize: 2, matchBrackets: true };
  const modes = { html: 'htmlmixed', css: 'css', fields: { name: 'javascript', json: true } };
  for (const k of Object.keys(modes)) {
    S.ed[k] = CodeMirror.fromTextArea($('e-' + k), { ...base, mode: modes[k] });
    S.ed[k].on('change', () => { clearTimeout(S.pvTimer); S.pvTimer = setTimeout(preview, 300); });
  }
  showTab('html');
}
function showTab(t) {
  $$('.tab').forEach(x => x.classList.toggle('on', x.dataset.tab === t));
  for (const k in S.ed) S.ed[k].getWrapperElement().style.display = k === t ? '' : 'none';
  $('fform').style.display = t === 'form' ? 'block' : 'none';
  if (t === 'form') renderForm(); else S.ed[t].refresh();
}
const FTYPES = ['text', 'textarea', 'email', 'tel', 'date', 'number', 'url', 'image'];
function curFields() { try { const f = JSON.parse(val('fields')); return Array.isArray(f) ? f : null; } catch { return null; } }
function renderForm() {
  const f = curFields();
  if (f === null) { $('fform').innerHTML = empty('fa-triangle-exclamation', 'JSON invalide : corrigez-le dans l\'onglet JSON'); return; }
  $('fform').innerHTML = f.map((x, i) => `<div class="frow" data-i="${i}"><input class="fc" data-k="name" placeholder="nom (ex: titre)" value="${esc(x.name)}" aria-label="Nom"><input class="fc" data-k="label" placeholder="Libellé affiché" value="${esc(x.label)}" aria-label="Libellé"><div class="l2"><select class="fc" data-k="type" style="max-width:120px" aria-label="Type">${[...new Set([...FTYPES, x.type || 'text'])].map(t => `<option ${t === (x.type || 'text') ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select><input class="fc" data-k="default" placeholder="Valeur par défaut" value="${esc(x.default)}" aria-label="Valeur par défaut"><label style="display:flex;gap:4px;align-items:center;white-space:nowrap"><input type="checkbox" data-k="is_required" ${x.is_required ? 'checked' : ''}>Requis</label><button class="btn sm dg" data-rm="${i}" aria-label="Retirer"><i class="fas fa-trash"></i></button></div></div>`).join('') + '<button class="btn sm" id="f-add"><i class="fas fa-plus"></i>Ajouter un champ</button>';
}
function formEdit(e) {
  const row = e.target.closest('.frow'), k = e.target.dataset.k; if (!row || !k) return;
  const f = curFields(); if (!f) return;
  f[row.dataset.i][k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  S.ed.fields.setValue(JSON.stringify(f, null, 2));
}
function formClick(e) {
  const f = curFields(); if (!f) return;
  if (e.target.closest('#f-add')) f.push({ name: '', label: '', type: 'text', default: '', is_required: false });
  else { const r = e.target.closest('[data-rm]'); if (!r) return; f.splice(+r.dataset.rm, 1); }
  S.ed.fields.setValue(JSON.stringify(f, null, 2)); renderForm();
}
// Vérifie la cohérence champs JSON <-> id="field-xxx" du HTML. Retourne le nombre de problèmes.
function check() {
  const f = curFields(), box = $('chk');
  if (f === null) { box.innerHTML = '<p class="s" style="color:var(--er)">⚠ JSON des champs invalide</p>'; return 1; }
  const names = f.map(x => x.name).filter(Boolean), ids = [...new Set([...val('html').matchAll(/id=["']field-([\w-]+)["']/g)].map(m => m[1]))];
  const msgs = [];
  const a = names.filter(n => !ids.includes(n)), b = ids.filter(i => !names.includes(i)), d = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
  if (a.length) msgs.push(`Champs sans élément HTML : ${a.map(n => 'field-' + n).join(', ')}`);
  if (b.length) msgs.push(`Éléments HTML sans champ : ${b.map(i => 'field-' + i).join(', ')}`);
  if (d.length) msgs.push(`Noms de champs en double : ${d.join(', ')}`);
  if ($('t-photo').checked && !/<img\b/i.test(val('html')) && !f.some(x => x.type === 'image')) msgs.push('« Photo » est coché mais le HTML ne contient aucune balise <img> ni champ de type image');
  if ($('t-color').checked && !val('css').includes('--doc-primary-color')) msgs.push('« Couleur » est coché mais le CSS n\'utilise jamais var(--doc-primary-color)');
  box.innerHTML = msgs.length ? msgs.map(m => `<p class="s" style="color:var(--wa)">⚠ ${esc(m)}</p>`).join('') : '<p class="s" style="color:var(--ok)">✓ Champs et HTML cohérents</p>';
  return msgs.length;
}
const val = k => S.ed[k].getValue();
async function openEditor(id) {
  S.tplId = id;
  $('ed-title').textContent = id ? `Modifier : ${id}` : 'Nouveau template';
  await loadCats();
  const set = (t = {}, fields = null) => {
    $('t-name').value = t.name || ''; $('t-cat').value = S.cats.find(c => c.id === t.category_id)?.name || t.category_id || '';
    $('t-id').value = t.id || ''; $('t-id').disabled = !!t.id; $('t-order').value = t.display_order ?? 0; $('t-thumb-url').value = t.preview_image_url || ''; $('t-thumb-file').value = ''; setThumb(t.preview_image_url); $('t-price').value = t.price_xaf ?? '';
    $('t-desc').value = t.description || ''; $('t-active').checked = t.is_active !== false;
    $('t-photo').checked = !!t.has_photo; $('t-color').checked = t.has_color_picker !== false; $('t-feat').checked = !!t.is_featured;
    S.ed.html.setValue(t.html_structure ?? '<div class="doc">\n  <h1 id="field-titre">Mon document</h1>\n  <p id="field-contenu">Contenu…</p>\n</div>');
    S.ed.css.setValue(t.css_styles ?? '.doc { padding: 40px; font-family: Arial, sans-serif; }\nh1 { color: #0F172A; }');
    S.ed.fields.setValue(JSON.stringify(fields ?? [{ name: 'titre', label: 'Titre', type: 'text', default: 'Mon document', is_required: true }], null, 2));
    showTab('html'); preview();
  };
  if (!id) return set();
  const [t, f] = await Promise.all([db.from('templates').select('*').eq('id', id).single(), db.from('template_fields').select('field_name, field_label, field_type, default_value, is_required, display_order').eq('template_id', id).order('display_order')]);
  if (t.error) { fail('Template introuvable', t.error); return go('templates'); }
  set(t.data, (f.data || []).map(x => ({ name: x.field_name, label: x.field_label, type: x.field_type, default: x.default_value || '', is_required: !!x.is_required })));
}
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function setThumb(url) { const i = $('t-thumb'); if (url) i.src = url; else i.removeAttribute('src'); i.style.visibility = url ? 'visible' : 'hidden'; }
// Retrouve la catégorie par id ou nom ; sinon la crée (après confirmation). Retourne null si annulé.
async function resolveCat(v) {
  const k = v.toLowerCase(), f = S.cats.find(c => c.id.toLowerCase() === k || c.name.toLowerCase() === k);
  if (f) return f.id;
  const id = slug(v); if (!id) throw new Error('Nom de catégorie invalide');
  if (S.cats.some(c => c.id === id)) return id;
  if (!confirm(`La catégorie « ${v} » n'existe pas encore. La créer ?`)) return null;
  const { error } = await db.from('template_categories').insert({ id, name: v, icon: 'fa-folder', display_order: 99 });
  if (error) throw error;
  S.cats.push({ id, name: v }); log('Catégorie créée', `${id} — ${v}`); return id;
}
function preview() {
  const f = curFields() || [], doc = new DOMParser().parseFromString(`<body>${val('html')}</body>`, 'text/html');
  f.forEach(x => { const el = x.name && doc.getElementById('field-' + x.name); if (!el || !x.default) return; if (el.tagName === 'IMG') el.setAttribute('src', x.default); else el.textContent = x.default; });
  const a4 = $('pv-a4').checked, zoom = Math.min(1, ($('pv').clientWidth - 24) / 794) || 1;
  const wrap = a4 ? `body{margin:0;background:#E5E7EB;padding:12px 0}.pg{zoom:${zoom};width:794px;min-height:1123px;margin:0 auto;background-color:#fff;background-image:linear-gradient(to bottom,transparent 1121px,rgba(239,68,68,.55) 1121px 1123px);background-size:100% 1123px;box-shadow:0 2px 12px rgba(0,0,0,.2);overflow:hidden}` : 'body{margin:0;padding:16px}';
  $('pv').srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"><style>:root{--doc-primary-color:${$('pv-color').value}}${wrap}${val('css')}</style></head><body><div class="pg">${doc.body.innerHTML}</div></body></html>`;
  check();
}
async function saveTemplate() {
  const name = $('t-name').value.trim(), catIn = $('t-cat').value.trim(), price = parseInt($('t-price').value, 10);
  if (!name) return toast('Le nom est obligatoire', 'error');
  if (!catIn) return toast('Indiquez une catégorie', 'error');
  if (isNaN(price) || price < 0) return toast('Prix invalide', 'error');
  let fields;
  try { fields = JSON.parse(val('fields')); if (!Array.isArray(fields)) throw 0; } catch { showTab('fields'); return toast('Le JSON des champs doit être un tableau valide', 'error'); }
  const bad = fields.findIndex(f => !f.name || !f.label); if (bad >= 0) { showTab('fields'); return toast(`Champ n°${bad + 1} : « name » et « label » requis`, 'error'); }
  if (check() && !confirm('Des incohérences existent entre les champs et le HTML (voir sous l\'éditeur). Enregistrer quand même ?')) return;
  const cat = await resolveCat(catIn); if (cat === null) return;
  const id = S.tplId || slug($('t-id').value) || `tpl_${Date.now()}`;
  if (!S.tplId) { const { data: ex } = await db.from('templates').select('id').eq('id', id).maybeSingle(); if (ex) return toast(`L'identifiant « ${id} » existe déjà`, 'error'); }
  let thumb = $('t-thumb-url').value || null; const tf = $('t-thumb-file').files[0];
  if (tf) {
    if (tf.size > 5 * 1024 * 1024) return toast('Vignette trop lourde (5 Mo max)', 'error');
    const path = `assets/thumbs/${id}_${Date.now()}.${(tf.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const up = await db.storage.from(BUCKET).upload(path, tf); if (up.error) return fail('Vignette', up.error);
    thumb = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  const { error } = await db.from('templates').upsert({ id, name, category_id: cat, display_order: +$('t-order').value || 0, preview_image_url: thumb, price_xaf: price, description: $('t-desc').value.trim(), is_active: $('t-active').checked, has_photo: $('t-photo').checked, has_color_picker: $('t-color').checked, is_featured: $('t-feat').checked, html_structure: val('html'), css_styles: val('css'), updated_at: new Date().toISOString() });
  if (error) return fail('Enregistrement', error);
  const r = await replaceFields(id, fields); if (r) return fail('Champs', r);
  S.tplId = id; $('ed-title').textContent = `Modifier : ${id}`; $('t-id').value = id; $('t-id').disabled = true; $('t-thumb-url').value = thumb || ''; $('t-thumb-file').value = ''; setThumb(thumb); await loadCats();
  log('Template enregistré', `${id} — ${name}`); toast('Template enregistré');
}
async function replaceFields(templateId, fields) {
  const d = await db.from('template_fields').delete().eq('template_id', templateId); if (d.error) return d.error;
  if (!fields.length) return null;
  const { error } = await db.from('template_fields').insert(fields.map((f, i) => ({ template_id: templateId, field_name: f.name, field_label: f.label, field_type: f.type || 'text', default_value: f.default ?? '', is_required: !!(f.is_required ?? f.required), display_order: i })));
  return error;
}

// ---------- Import registry ----------
async function importRegistry(file) {
  if (!file.name.endsWith('.js')) return toast('Sélectionnez un fichier .js', 'error');
  const box = $('imp-box'), lg = $('imp-log'); box.hidden = false; lg.innerHTML = '';
  const say = (m, c = '') => { lg.insertAdjacentHTML('beforeend', `<div style="color:${c || 'inherit'}">${esc(m)}</div>`); lg.scrollTop = lg.scrollHeight; };
  try {
    let src = (await file.text()).replace(/export\s+default\s+/g, 'var __default = ').replace(/\bexport\s+(?=function|const|let|var|async)/g, '');
    let tpls;
    try { tpls = new Function(src + '\n;return typeof templatesRegistry!=="undefined"?templatesRegistry:(typeof __default!=="undefined"?__default:[]);')(); }
    catch (e) { return say('Fichier illisible : ' + e.message, 'var(--er)'); }
    if (!Array.isArray(tpls) || !tpls.length) return say('Aucun tableau templatesRegistry trouvé', 'var(--er)');
    say(`${tpls.length} templates détectés`);
    const known = new Set(S.cats.map(c => c.id)); let ok = 0, ko = 0;
    for (let i = 0; i < tpls.length; i++) {
      const t = tpls[i];
      $('imp-bar').style.width = ((i + 1) / tpls.length * 100) + '%'; $('imp-txt').textContent = `${i + 1} / ${tpls.length}`;
      try {
        if (!t?.id) throw new Error('ID manquant');
        const cat = t.category || 'general';
        if (!known.has(cat)) { const r = await db.from('template_categories').upsert({ id: cat, name: cat.charAt(0).toUpperCase() + cat.slice(1), icon: 'fa-folder', display_order: 99 }); if (r.error) throw r.error; known.add(cat); say(`Catégorie créée : ${cat}`); }
        const r = await db.from('templates').upsert({ id: t.id, name: t.name || t.id, category_id: cat, price_xaf: t.price || 0, description: t.description || '', has_photo: !!t.hasPhoto, has_color_picker: t.hasColorPicker !== false, is_active: true, html_structure: t.htmlStructure || '', css_styles: t.cssStyles || '' });
        if (r.error) throw r.error;
        if (Array.isArray(t.fields)) { const fe = await replaceFields(t.id, t.fields.map(f => ({ name: f.name, label: f.label || f.name, type: f.type, default: f.default, is_required: f.required ?? f.is_required }))); if (fe) say(`Champs non importés pour ${t.id} : ${fe.message}`, 'var(--wa)'); }
        ok++; say(`✓ ${t.name || t.id}`, 'var(--ok)');
      } catch (e) { ko++; say(`✗ ${t?.name || t?.id || '#' + i} : ${e.message}`, 'var(--er)'); }
    }
    log('Import registry', `${ok} succès, ${ko} erreurs`); toast(`Import terminé : ${ok} succès, ${ko} erreurs`, ko ? 'warning' : 'success');
    loadCats(); loadDashboard();
  } catch (e) { say(e.message, 'var(--er)'); }
}

// ---------- Commandes ----------
async function loadOrders() {
  let q = db.from('purchases').select('*, profiles(full_name, email), templates(name)').order('created_at', { ascending: false }).limit(S.cfg.rows);
  if ($('f-ostatus').value) q = q.eq('payment_status', $('f-ostatus').value);
  if ($('f-omethod').value) q = q.eq('payment_method', $('f-omethod').value);
  const { data, error } = await q; if (error) return fail('Commandes', error);
  if (!$('f-omethod').dataset.ok) {
    const { data: m } = await db.from('purchases').select('payment_method');
    const set = [...new Set((m || []).map(x => x.payment_method))];
    $('f-omethod').insertAdjacentHTML('beforeend', set.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('')); $('f-omethod').dataset.ok = 1;
  }
  $('tb-ord').innerHTML = data.map(o => {
    const who = o.profiles?.full_name || o.guest_email || 'Invité', mail = o.profiles?.email || o.guest_email || o.guest_phone || '—';
    return `<tr><td class="mono">${esc(o.id.slice(0, 8))}</td><td><span class="t">${esc(who)}</span><span class="s">${esc(mail)}</span></td><td>${esc(o.templates?.name || o.template_id)}</td><td><strong>${money(o.amount_paid, o.currency)}</strong></td><td class="s">${esc(o.payment_method)}</td><td>${statusBadge(o.payment_status)}<br><select class="fc" style="margin-top:4px;padding:3px 6px;font-size:.75rem" data-status="${esc(o.id)}" aria-label="Changer le statut"><option value="">Changer…</option><option value="completed">Payé</option><option value="pending">En attente</option><option value="failed">Échoué</option></select></td><td class="s">${date(o.created_at)}</td></tr>`;
  }).join('') || rowEmpty(7, 'Aucune commande');
}
async function setOrderStatus(id, status) {
  if (!status || !confirm('Modifier le statut de cette commande ?')) return loadOrders();
  const { error } = await db.from('purchases').update({ payment_status: status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) fail('Mise à jour', error); else { log('Statut commande modifié', `${id.slice(0, 8)} → ${status}`); toast('Statut mis à jour'); }
  loadOrders();
}
async function exportOrders() {
  const { data, error } = await db.from('purchases').select('*').order('created_at', { ascending: false }); if (error) return fail('Export', error);
  download(`takidoc-commandes-${Date.now()}.csv`, toCsv(['ID', 'Utilisateur', 'Email invité', 'Template', 'Montant', 'Devise', 'Méthode', 'Référence', 'Statut', 'Date'], data.map(o => [o.id, o.user_id, o.guest_email, o.template_id, o.amount_paid, o.currency, o.payment_method, o.payment_reference, o.payment_status, o.created_at])), 'text/csv');
  log('Export commandes', `${data.length} lignes`);
}

// ---------- Utilisateurs ----------
async function loadUsers() {
  let q = db.from('profiles').select('*').order('created_at', { ascending: false }).limit(S.cfg.rows);
  if ($('f-role').value) q = q.eq('role', $('f-role').value);
  const { data, error } = await q; if (error) return fail('Utilisateurs', error);
  $('tb-usr').innerHTML = data.map(u => `<tr><td><div style="display:flex;gap:10px;align-items:center"><div class="av" style="background:var(--ink)">${esc(initials(u.full_name || u.email))}</div><div><span class="t">${esc(u.full_name || 'Sans nom')}</span><span class="s">${esc(u.email)}</span></div></div></td><td class="s">${esc(u.phone_number || '—')}</td><td><span class="bdg ${u.role === 'admin' ? 'b-in' : 'b-ok'}">${esc(u.role)}</span></td><td class="s">${date(u.created_at)}</td><td class="r"><button class="btn sm" data-act="view" data-id="${esc(u.id)}" aria-label="Détails"><i class="fas fa-eye"></i></button> ${u.id === S.me.id ? '' : `<button class="btn sm" data-act="role" data-id="${esc(u.id)}" data-role="${u.role}">${u.role === 'admin' ? 'Retirer admin' : 'Passer admin'}</button>`}</td></tr>`).join('') || rowEmpty(5, 'Aucun utilisateur');
}
async function toggleRole(id, role) {
  const next = role === 'admin' ? 'user' : 'admin';
  if (!confirm(`Passer cet utilisateur en « ${next} » ?`)) return;
  const { error } = await db.from('profiles').update({ role: next }).eq('id', id);
  if (error) return fail('Changement de rôle', error); log('Rôle modifié', `${id} → ${next}`); toast('Rôle mis à jour'); loadUsers();
}
async function viewUser(id) {
  openM('m-user'); $('usr-detail').innerHTML = 'Chargement…';
  const [u, o, d] = await Promise.all([db.from('profiles').select('*').eq('id', id).single(), db.from('purchases').select('amount_paid, payment_status, created_at').eq('user_id', id), db.from('user_documents').select('id', { count: 'exact', head: true }).eq('user_id', id)]);
  if (u.error) return $('usr-detail').innerHTML = empty('fa-triangle-exclamation', u.error.message);
  const paid = (o.data || []).filter(x => x.payment_status === 'completed');
  $('usr-detail').innerHTML = `<h3>${esc(u.data.full_name || 'Sans nom')}</h3><p class="s" style="margin-bottom:14px">${esc(u.data.email)} · ${esc(u.data.phone_number || 'pas de téléphone')}</p><div class="stats" style="grid-template-columns:repeat(3,1fr)"><div class="stat"><span>Achats</span><strong style="font-size:1.4rem">${paid.length}</strong></div><div class="stat"><span>Documents</span><strong style="font-size:1.4rem">${d.count || 0}</strong></div><div class="stat"><span>Dépensé</span><strong style="font-size:1.1rem">${money(paid.reduce((s, x) => s + x.amount_paid, 0))}</strong></div></div><p class="s">Inscrit le ${date(u.data.created_at)}</p>`;
}
async function exportUsers() {
  const { data, error } = await db.from('profiles').select('*'); if (error) return fail('Export', error);
  download(`takidoc-utilisateurs-${Date.now()}.csv`, toCsv(['ID', 'Nom', 'Email', 'Téléphone', 'Rôle', 'Inscrit le'], data.map(u => [u.id, u.full_name, u.email, u.phone_number, u.role, u.created_at])), 'text/csv');
  log('Export utilisateurs', `${data.length} lignes`);
}

// ---------- Messages ----------
async function loadMessages() {
  const { data, error } = await db.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(S.cfg.rows);
  if (error) return fail('Messages', error);
  $('msgs').innerHTML = data.map(m => `<div class="ni2"><i class="fas fa-envelope" style="color:var(--p);margin-top:4px"></i><div><span class="t">${esc(m.subject)}</span><span class="s">${esc(m.name)} · <a href="mailto:${esc(m.email)}">${esc(m.email)}</a> · ${date(m.created_at)}</span><p style="margin-top:6px;white-space:pre-wrap">${esc(m.message)}</p></div><button class="btn sm dg" data-del="${esc(m.id)}" aria-label="Supprimer"><i class="fas fa-trash"></i></button></div>`).join('') || empty('fa-inbox', 'Aucun message reçu');
}
async function delMessage(id) {
  if (!confirm('Supprimer ce message ?')) return;
  const { error } = await db.from('contact_messages').delete().eq('id', id); if (error) return fail('Suppression', error);
  log('Message supprimé', id); loadMessages();
}

// ---------- Notifications ----------
async function loadNotifs() {
  const { data, error } = await db.from('notifications').select('id, title, message, type, link, created_at').order('created_at', { ascending: false }).limit(1000);
  if (error) return fail('Notifications', error);
  const groups = new Map();
  data.forEach(n => { const k = [n.title, n.message, n.type, n.created_at.slice(0, 16)].join('|'); const g = groups.get(k) || { ...n, count: 0 }; g.count++; groups.set(k, g); });
  const cls = { success: 'b-ok', warning: 'b-wa', error: 'b-er', info: 'b-in' };
  $('notifs').innerHTML = [...groups.entries()].slice(0, 50).map(([k, g]) => `<div class="ni2"><div><span class="t">${esc(g.title)} <span class="bdg ${cls[g.type] || 'b-in'}">${esc(g.type)}</span></span><p>${esc(g.message)}</p><span class="s">${date(g.created_at)} · ${g.count} destinataire(s)</span></div><button class="btn sm dg" data-del="${esc(k)}" aria-label="Supprimer pour tous"><i class="fas fa-trash"></i></button></div>`).join('') || empty('fa-bell-slash', 'Aucune notification envoyée');
  S.notifGroups = groups;
}
async function sendNotif() {
  const title = $('n-title').value.trim(), message = $('n-msg').value.trim(), link = $('n-link').value.trim();
  if (!title || !message) return toast('Titre et message obligatoires', 'error');
  if (link && !/^(https?:\/\/|\/|[\w-]+\.html)/.test(link)) return toast('Lien invalide', 'error');
  let q = db.from('profiles').select('id'); if ($('n-target').value === 'admins') q = q.eq('role', 'admin');
  const { data: users, error } = await q; if (error) return fail('Destinataires', error);
  if (!users.length) return toast('Aucun destinataire', 'warning');
  const rows = users.map(u => ({ user_id: u.id, title, message, type: $('n-type').value, is_read: false, link: link || null }));
  for (let i = 0; i < rows.length; i += 200) { const r = await db.from('notifications').insert(rows.slice(i, i + 200)); if (r.error) return fail('Envoi', r.error); }
  log('Notification envoyée', `« ${title} » à ${rows.length} utilisateur(s)`); toast(`Envoyée à ${rows.length} utilisateur(s)`);
  closeM('m-notif'); ['n-title', 'n-msg', 'n-link'].forEach(i => $(i).value = ''); loadNotifs();
}
async function delNotifGroup(key) {
  const g = S.notifGroups?.get(key); if (!g || !confirm(`Supprimer cette notification pour ${g.count} destinataire(s) ?`)) return;
  const start = g.created_at.slice(0, 16), d = new Date(start + ':00Z');
  const { error } = await db.from('notifications').delete().eq('title', g.title).eq('message', g.message).eq('type', g.type).gte('created_at', new Date(d.getTime() - 60000).toISOString()).lte('created_at', new Date(d.getTime() + 120000).toISOString());
  if (error) return fail('Suppression', error); log('Notification supprimée', g.title); loadNotifs();
}

// ---------- Médias ----------
const BUCKET = 'template-assets';
async function loadMedia() {
  const { data, error } = await db.storage.from(BUCKET).list('assets', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) return fail('Médias', error);
  const files = data.filter(f => f.name !== '.emptyFolderPlaceholder');
  $('gal').innerHTML = files.map(f => {
    const path = `assets/${f.name}`, url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const img = /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name);
    return `<div>${img ? `<img src="${esc(url)}" alt="" loading="lazy">` : '<div class="ph"><i class="fas fa-file"></i></div>'}<p title="${esc(f.name)}">${esc(f.name)}</p><div class="a"><button class="btn sm" data-act="copy" data-url="${esc(url)}">Copier l'URL</button><button class="btn sm dg" data-act="del" data-name="${esc(path)}" aria-label="Supprimer"><i class="fas fa-trash"></i></button></div></div>`;
  }).join('') || empty('fa-images', 'Aucun fichier. Ajoutez votre premier média.');
}
async function uploadMedia(files) {
  let ok = 0;
  for (const f of files) {
    if (f.size > 5 * 1024 * 1024) { toast(`${f.name} dépasse 5 Mo`, 'warning'); continue; }
    const { error } = await db.storage.from(BUCKET).upload(`assets/${Date.now()}_${f.name.replace(/[^\w.-]+/g, '_')}`, f);
    if (error) fail(f.name, error); else ok++;
  }
  if (ok) { log('Médias ajoutés', `${ok} fichier(s)`); toast(`${ok} fichier(s) ajouté(s)`); }
  loadMedia();
}
async function delMedia(path) {
  if (!confirm('Supprimer ce fichier ? Les templates qui l\'utilisent perdront l\'image.')) return;
  const { error } = await db.storage.from(BUCKET).remove([path]); if (error) return fail('Suppression', error);
  log('Média supprimé', path); loadMedia();
}

// ---------- Journal ----------
function renderLogs() {
  $('logs').innerHTML = S.logs.slice(0, 100).map(l => `<div class="act"><span class="mono" style="min-width:150px">${new Date(l.time).toLocaleString('fr-FR')}</span><div style="flex:1"><strong>${esc(l.action)}</strong> <span class="s">${esc(l.details)}</span></div><span class="s">${esc(l.user)}</span></div>`).join('') || empty('fa-clipboard-list', 'Les actions administratives apparaîtront ici.');
}

// ---------- Sauvegarde ----------
const TABLES = ['template_categories', 'templates', 'template_fields', 'profiles', 'purchases', 'user_documents', 'favorites', 'notifications', 'contact_messages'];
async function exportAll() {
  const out = { exportDate: new Date().toISOString(), version: 2 };
  for (const t of TABLES) { const { data, error } = await db.from(t).select('*'); if (error) return fail(`Export ${t}`, error); out[t] = data; }
  download(`takidoc-backup-${Date.now()}.json`, JSON.stringify(out, null, 2), 'application/json'); log('Sauvegarde complète', TABLES.length + ' tables');
}
async function importBackup() {
  const f = $('bk-file').files[0]; if (!f) return toast('Choisissez un fichier JSON', 'error');
  let b; try { b = JSON.parse(await f.text()); } catch { return toast('JSON invalide', 'error'); }
  const restorable = ['template_categories', 'templates', 'template_fields', 'contact_messages'];
  if (!confirm(`Restaurer ${restorable.join(', ')} ? Les lignes existantes seront écrasées.\n(Profils, achats et documents ne sont jamais restaurés depuis l'interface.)`)) return;
  for (const t of restorable) {
    const rows = b[t]; if (!Array.isArray(rows) || !rows.length) continue;
    for (let i = 0; i < rows.length; i += 200) { const r = await db.from(t).upsert(rows.slice(i, i + 200)); if (r.error) return fail(`Restauration ${t}`, r.error); }
  }
  log('Sauvegarde restaurée', f.name); toast('Restauration terminée'); loadDashboard();
}

document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
