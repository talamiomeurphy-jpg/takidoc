(()=>{'use strict';
const CFG={url:'https://wyfkogowsdbxctbpfuud.supabase.co',key:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmtvZ293c2RieGN0YnBmdXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDc3MjAsImV4cCI6MjEwNjI4MzcyMH0.231eQ38RFvFaH3O6D-ReA8rlf3TehvWfcM-LBWocNEM',page:200,favKey:'takidoc_favorites',editor:'editor.html',params:['id','template']};
const ICONS=[['cv','fa-id-card'],['lettre','fa-envelope'],['contrat','fa-file-signature'],['commercial','fa-briefcase'],['attestation','fa-stamp'],['administr','fa-building-columns'],['facture','fa-receipt'],['devis','fa-file-invoice-dollar'],['rapport','fa-chart-column'],['procuration','fa-signature'],['declaration','fa-file-circle-check'],['certificat','fa-award']];
const STUB=document.createElement('div'),RT=[1.414,1.15,1.3,1,1.414,1.22,1.1],$=s=>document.querySelector(s)||STUB,grid=$('#grid');
const S={cats:[],sb:null,user:null,all:[],list:[],cur:0,cat:'all',q:'',favOnly:false,fav:new Set(),cols:0,colW:200,hs:[],cs:[],cards:[],info:78,busy:false,loaded:false};
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
const catName=t=>(Array.isArray(t.template_categories)?t.template_categories[0]:t.template_categories)?.name||'Document professionnel';
const catKey=t=>t.category_id||'autres',icon=n=>(ICONS.find(([k])=>norm(n).includes(k))||[0,'fa-folder'])[1],findCat=w=>S.cats.find(c=>c.id===w)||S.cats.find(c=>norm(c.id+' '+c.name).includes(norm(w)));
const price=v=>{const n=Number(v);return n>0?{t:new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(n).replace(/\s/g,'\u00a0')+'\u00a0FCFA',free:false}:{t:'Gratuit',free:true}};
const edit=id=>CFG.editor+'?'+CFG.params.map(p=>p+'='+encodeURIComponent(id)).join('&');
let tt;const toast=(m,e)=>{const t=$('#toast');t.textContent=m;t.classList.toggle('err',!!e);t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),3200)};

/* ---------- Aperçus : image Supabase, sinon rendu réel HTML/CSS du modèle ---------- */
const DC=new Map(),Q=new Map();let qt;
const srcdoc=r=>{const h=String(r.html_structure||'').trim();if(!h)return null;const css=String(r.css_styles||'').replace(/<\/style/gi,'<\\/style'),b=`<style>html,body{margin:0;background:#fff;overflow:hidden}*{box-sizing:border-box}</style><style>${css}</style>`;
  return /<\/head\s*>/i.test(h)?h.replace(/<\/head\s*>/i,b+'</head>'):`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">${b}</head><body>${h}</body></html>`};
const getDoc=id=>DC.has(id)?Promise.resolve(DC.get(id)):new Promise(res=>{(Q.get(id)||Q.set(id,[]).get(id)).push(res);clearTimeout(qt);qt=setTimeout(flush,60)});
async function flush(){const ids=[...Q.keys()].slice(0,10),w=ids.map(i=>[i,Q.get(i)]);ids.forEach(i=>Q.delete(i));let rows=[],ok=true;
  try{const {data,error}=await S.sb.from('templates').select('id,html_structure,css_styles').in('id',ids);if(error)throw error;rows=data||[]}catch(e){ok=false;console.warn('Aperçu indisponible :',e.message||e)}
  const m=new Map(rows.map(r=>[String(r.id),r]));w.forEach(([i,rs])=>{const r=m.get(i),d=r?srcdoc(r):null;if(ok)DC.set(i,d);rs.forEach(f=>f(d))});if(Q.size)qt=setTimeout(flush,30)}
function htmlPreview(c){const id=String(c._t.id);getDoc(id).then(d=>{if(!d||c._f||!c.isConnected||!c._v)return;const f=document.createElement('iframe');f.setAttribute('sandbox','');f.tabIndex=-1;f.title='Aperçu : '+c._t.name;f.setAttribute('aria-hidden','true');f.srcdoc=d;
  f.onload=()=>c._s.classList.add('ready');setTimeout(()=>f.isConnected&&c._s.classList.add('ready'),5000);c._f=f;c._s.append(f)})}
function mount(c){if(c._m)return;c._m=1;const t=c._t;if(t.preview_image_url){const im=new Image();im.alt='Aperçu du document '+t.name;im.decoding='async';im.referrerPolicy='no-referrer';
  im.onload=()=>c._s.classList.add('ready');im.onerror=()=>{im.remove();c._m=0;c._img=0;c._m=1;htmlPreview(c)};im.src=t.preview_image_url;c._s.append(im)}else htmlPreview(c)}
function unmount(c){if(c._f){c._f.remove();c._f=null;c._m=0;c._s.classList.remove('ready')}}
const pio=new IntersectionObserver(es=>es.forEach(e=>{const c=e.target;c._v=e.isIntersecting;if(c._v){c._m?(c._t.preview_image_url||c._f||htmlPreview(c)):mount(c)}else unmount(c)}),{rootMargin:'1100px 0px'});

/* ---------- Cartes ---------- */
function card(t){const id=String(t.id),r=RT[hash(id)%RT.length],p=price(t.price_xaf),on=S.fav.has(id),u=edit(id),n=esc(t.name||'Document sans titre');
  const e=document.createElement('article');e.className='pin';e._t=t;e._r=r;e.dataset.id=id;
  e.innerHTML=`<div class="media" style="aspect-ratio:1/${r}"><div class="sheet"><div class="ph"><i class="fa-regular fa-file-lines"></i></div></div><a class="open" href="${u}" aria-label="Personnaliser ${n}"></a>
<button class="ic fav${on?' on':''}" data-a="fav" aria-pressed="${on}" aria-label="${on?'Retirer des favoris':'Ajouter aux favoris'}"><i class="fa-${on?'solid':'regular'} fa-heart"></i></button>
<div class="hov"><a class="go" href="${u}"><i class="fa-solid fa-pen-to-square"></i> Personnaliser</a><button class="ic" data-a="share" aria-label="Partager"><i class="fa-solid fa-share-nodes"></i></button></div></div>
<div class="info"><h3 title="${n}">${n}</h3><div class="row"><b class="${p.free?'free':''}">${p.t}</b><small>${esc(catName(t))}</small><span class="mini"><button class="ic" data-a="share" aria-label="Partager"><i class="fa-solid fa-share-nodes"></i></button><a class="ic" href="${u}" aria-label="Personnaliser"><i class="fa-solid fa-pen-to-square"></i></a></span></div></div>`;
  e._s=e.querySelector('.sheet');return e}

/* ---------- Masonry (colonnes, hauteurs calculées sans lecture du DOM) ---------- */
function measure(){const w=grid.clientWidth-parseFloat(getComputedStyle(grid).paddingLeft)*2,g=parseFloat(getComputedStyle(grid).columnGap)||16,min=innerWidth<640?150:225,n=Math.max(2,Math.min(8,Math.floor((w+g)/(min+g))));
  const ch=n!==S.cols;S.gap=g;S.cols=n;S.colW=(w-g*(n-1))/n;grid.style.setProperty('--ps',S.colW/794);return ch}
function build(){grid.replaceChildren();S.cs=[];S.hs=Array(S.cols).fill(0);for(let i=0;i<S.cols;i++){const c=document.createElement('div');c.className='col';grid.append(c);S.cs.push(c)}}
function place(els){els.forEach(e=>{let k=0;for(let i=1;i<S.cols;i++)if(S.hs[i]<S.hs[k])k=i;const h=e._r*S.colW+S.info;S.hs[k]+=h+S.gap;e.style.containIntrinsicSize='auto '+Math.round(h)+'px';S.cs[k].append(e);pio.observe(e)})}
function relayout(){const old=S.cards;old.forEach(e=>pio.unobserve(e));build();place(old)}

/* ---------- Défilement infini cyclique ---------- */
const sent=$('#sent'),io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))fill()},{rootMargin:'0px 0px 1800px 0px'});
function recheck(){requestAnimationFrame(()=>{io.unobserve(sent);io.observe(sent)})}
function fill(){if(S.busy||!S.list.length||!S.loaded)return;S.busy=true;const n=S.cols*3,els=[],L=S.list.length;
  for(let i=0;i<n;i++){if(S.favOnly&&S.cur>=L)break;els.push(card(S.list[S.cur++%L]))}
  if(els.length){S.cards.push(...els);place(els);if(S.cards.length===els.length){const i=els[0].querySelector('.info');if(i&&i.offsetHeight>40)S.info=i.offsetHeight+2}}
  S.busy=false;if(els.length)recheck();else{sent.hidden=true;if(!$('.end'))grid.insertAdjacentHTML('afterend','<p class="end">Vous avez parcouru tous vos favoris.</p>')}}

/* ---------- Filtrage, tri, états ---------- */
function msg(icon,title,text,btn){const m=$('#msg');m.hidden=false;m.innerHTML=`<i class="fa-solid ${icon}"></i><h2>${esc(title)}</h2>${text?`<p>${esc(text)}</p>`:''}${btn?`<button class="bt" id="mb">${esc(btn[0])}</button>`:''}`;if(btn)$('#mb').onclick=btn[1]}
function apply(reset){const q=norm(S.q),by=$('#sort').value;
  let l=S.all.filter(t=>(!q||norm([t.name,t.description,catName(t)].join(' ')).includes(q))&&(S.cat==='all'||t.category_id===S.cat)&&(!S.favOnly||S.fav.has(String(t.id))));
  const pr=t=>Number(t.price_xaf)||0;
  if(by==='name')l.sort((a,b)=>String(a.name).localeCompare(String(b.name),'fr'));else if(by==='asc')l.sort((a,b)=>pr(a)-pr(b));else if(by==='desc')l.sort((a,b)=>pr(b)-pr(a));else if(by==='free')l.sort((a,b)=>(pr(a)>0)-(pr(b)>0));else l.sort((a,b)=>(!!b.is_featured)-(!!a.is_featured));
  S.list=l;const n=l.length;$('#count').textContent=S.favOnly?`${n} favori${n>1?'s':''}`:`${n} document${n>1?'s':''}`;
  if(!reset)return;S.cur=0;S.cards=[];document.querySelector('.end')?.remove();measure();build();
  if(!n){sent.hidden=true;S.favOnly?msg('fa-heart','Aucun favori pour le moment','Touchez le cœur d’un document pour le retrouver ici.',['Voir tous les documents',()=>toggleFav(false)]):msg('fa-magnifying-glass','Aucun document trouvé','Essayez un autre mot-clé ou une autre catégorie.',S.q||S.cat!=='all'?['Tout afficher',()=>{S.q='';$('#q').value='';setCat('all')}]:null);return}
  $('#msg').hidden=true;sent.hidden=false;fill()}
function chips(){const cnt={all:S.all.length};S.all.forEach(t=>{const k=catKey(t);cnt[k]=(cnt[k]||0)+1});
  const l=[{id:'all',name:'Tout'},...S.cats.filter(c=>cnt[c.id]||c.id===S.cat)];
  $('#rail').innerHTML=l.map(c=>`<button class="c${c.id===S.cat?' on':''}" data-k="${esc(c.id)}" aria-pressed="${c.id===S.cat}"><i class="fa-solid ${c.id==='all'?'fa-border-all':icon(c.name+' '+c.id)}"></i>${esc(c.name)}${S.loaded?` <small>${cnt[c.id]||0}</small>`:''}</button>`).join('')}
function url(){const u=new URL(location.href);S.q?u.searchParams.set('q',S.q):u.searchParams.delete('q');S.cat!=='all'?u.searchParams.set('categorie',S.cat):u.searchParams.delete('categorie');history.replaceState({},'',u)}
function setCat(k){S.cat=k;S.favOnly=false;syncFav();chips();url();apply(true);jump()}
function jump(){const y=$('#catalog').getBoundingClientRect().top+scrollY-(innerWidth<=640?60:innerHeight>0?150:0);if(scrollY>y+40)scrollTo({top:Math.max(0,y),behavior:'smooth'})}

/* ---------- Favoris (local + compte Supabase) ---------- */
const saveFav=()=>{try{localStorage.setItem(CFG.favKey,JSON.stringify([...S.fav]))}catch(e){}};
function syncFav(){const n=S.fav.size,b=$('#favN');b.hidden=!n;b.textContent=n;$('#favBtn').classList.toggle('on',S.favOnly);$('#favBtn').setAttribute('aria-pressed',S.favOnly);$('#favBtn i').className='fa-'+(S.favOnly||n?'solid':'regular')+' fa-heart';$('#tFav').classList.toggle('on',S.favOnly)}
function paintFav(id,on){document.querySelectorAll(`.pin[data-id="${CSS.escape(id)}"] .fav`).forEach(b=>{b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',on?'Retirer des favoris':'Ajouter aux favoris');b.firstChild.className='fa-'+(on?'solid':'regular')+' fa-heart'})}
async function toggleCardFav(id){const on=!S.fav.has(id);on?S.fav.add(id):S.fav.delete(id);saveFav();paintFav(id,on);syncFav();
  toast(on?(S.user?'Ajouté à vos favoris.':'Favori enregistré sur cet appareil. Connectez-vous pour le retrouver partout.'):'Retiré des favoris.');
  if(S.user&&S.sb){let error;const f=()=>S.sb.from('favorites');
    if(on){const r=await f().select('id').eq('user_id',S.user.id).eq('template_id',id).limit(1);error=r.error;if(!error&&!r.data?.length)error=(await f().insert({user_id:S.user.id,template_id:id})).error}
    else error=(await f().delete().eq('user_id',S.user.id).eq('template_id',id)).error;
    if(error){console.warn('Synchronisation des favoris :',error.message);toast('Favori gardé sur cet appareil (synchronisation du compte impossible).',true)}}
  if(S.favOnly&&!on)apply(true)}
function toggleFav(v){S.favOnly=v??!S.favOnly;if(S.favOnly)S.cat='all';syncFav();chips();apply(true);scrollTo({top:0,behavior:'smooth'})}
async function share(t){const u=new URL(edit(t.id),location.href).href;try{if(navigator.share){await navigator.share({title:t.name+' — TakiDoc',url:u});return}await navigator.clipboard.writeText(u);toast('Lien copié dans le presse-papiers.')}catch(e){if(e.name!=='AbortError')toast('Copie impossible. Lien : '+u,true)}}

/* ---------- Données Supabase : tous les modèles actifs, par lots ---------- */
async function load(){S.loaded=false;msg('fa-spinner fa-spin','Chargement des documents');
  try{if(!window.supabase)throw new Error('La bibliothèque Supabase n’a pas pu se charger. Vérifiez votre connexion Internet.');
    S.sb=S.sb||supabase.createClient(CFG.url,CFG.key);
    const {data:{session}}=await S.sb.auth.getSession();S.user=session?.user||null;await account();
    try{const {data:cd,error:ce}=await S.sb.from('template_categories').select('id,name,display_order').order('display_order',{ascending:true});if(ce)throw ce;S.cats=cd||[]}catch(e){console.warn('Catégories indisponibles :',e.message||e)}
    if(S.cat!=='all'&&!S.cats.some(c=>c.id===S.cat))S.cat=findCat(S.cat)?.id||'all';
    S.all=[];let from=0,first=true;
    for(;;){const {data,error}=await S.sb.from('templates').select('id,name,description,price_xaf,preview_image_url,display_order,category_id,is_featured,template_categories(name)').eq('is_active',true).order('display_order',{ascending:true,nullsFirst:false}).order('id').range(from,from+CFG.page-1);
      if(error){if(first)throw error;toast('Certains documents n’ont pas pu être chargés.',true);break}
      S.all.push(...(data||[]));from+=(data||[]).length;S.loaded=true;chips();
      if(first){first=false;apply(true)}else apply(false);
      if(!data||data.length<CFG.page)break}
    if(!S.all.length){S.loaded=true;sent.hidden=true;msg('fa-folder-open','Le catalogue est vide','Aucun modèle actif n’est disponible pour le moment.')}
  }catch(e){console.error('Catalogue TakiDoc :',e);$('#count').textContent='Catalogue indisponible';sent.hidden=true;msg('fa-triangle-exclamation','Impossible de charger les documents',e.message||'Une erreur est survenue.',['Réessayer',load])}}
async function account(){if(S.user){const n=(S.user.user_metadata?.full_name||S.user.user_metadata?.name||S.user.email||'T').trim()[0].toUpperCase();$('#user').textContent=n;$('#user').hidden=false;$('#guest').hidden=true;
    try{const {data}=await S.sb.from('favorites').select('template_id').eq('user_id',S.user.id);(data||[]).forEach(r=>S.fav.add(String(r.template_id)));saveFav()}catch(e){}}else{$('#user').hidden=true;$('#guest').hidden=false}syncFav()}

/* ---------- Interface ---------- */
let sd;const onQ=v=>{$('#qc').hidden=!v;clearTimeout(sd);sd=setTimeout(()=>{S.q=v.trim();url();if(S.loaded){apply(true);jump()}},180)};
$('#q').addEventListener('input',e=>onQ(e.target.value));$('#sf').addEventListener('submit',e=>{e.preventDefault();clearTimeout(sd);S.q=$('#q').value.trim();url();apply(true);jump();$('#q').blur()});
$('#qc').onclick=()=>{$('#q').value='';onQ('');$('#q').focus()};
$('#rail').addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(b)setCat(b.dataset.k)});
$('#sort').onchange=()=>apply(true);$('#favBtn').onclick=()=>toggleFav();$('#tFav').onclick=()=>toggleFav();
grid.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const c=b.closest('.pin');b.dataset.a==='fav'?toggleCardFav(c.dataset.id):share(c._t)});
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();setCat(findCat(new URL(a.href).searchParams.get('categorie'))?.id||'all')}));
addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();$('#q').focus()}});
$('#tHome').onclick=()=>{S.favOnly&&toggleFav(false);scrollTo({top:0,behavior:'smooth'})};
$('#tSearch').onclick=()=>{$('#top').classList.remove('dn');scrollTo({top:0,behavior:'smooth'});setTimeout(()=>$('#q').focus(),350)};
$('#tInfo').onclick=()=>{const o=$('#ft').classList.toggle('open');$('#tInfo').classList.toggle('on',o)};
addEventListener('click',e=>{if(!e.target.closest('#ft,#tInfo'))$('#ft').classList.remove('open')});
let ly=0,tk=false;addEventListener('scroll',()=>{if(tk)return;tk=true;requestAnimationFrame(()=>{const y=scrollY;if(y>ly+6&&y>180)$('#top').classList.add('dn');else if(y<ly-6||y<80)$('#top').classList.remove('dn');ly=y;tk=false})},{passive:true});
let rt;new ResizeObserver(()=>{clearTimeout(rt);rt=setTimeout(()=>{if(!S.cards.length)return;if(measure())relayout()},120)}).observe(grid);
$('#yr').textContent=new Date().getFullYear();

const P=new URLSearchParams(location.search);S.q=P.get('q')||'';$('#q').value=S.q;$('#qc').hidden=!S.q;
S.cat=P.get('categorie')||'all';
try{JSON.parse(localStorage.getItem(CFG.favKey)||'[]').forEach(i=>S.fav.add(String(i)))}catch(e){}
chips();syncFav();measure();load();
})();
