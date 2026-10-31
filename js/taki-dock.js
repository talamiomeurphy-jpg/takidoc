/* TakiDoc — Taki, la mascotte de l'accueil : il accueille, guide, réagit */
(()=>{'use strict';
const $=s=>document.querySelector(s),dock=$('#taki-dock');if(!dock)return;
const bubble=dock.querySelector('.td-bubble'),panel=dock.querySelector('.td-panel'),btn=$('#tdTaki'),sugg=$('#tdSugg');
const TIPS=['Touche le cœur d’un document pour le retrouver dans tes favoris.','Un CV, une facture, une lettre ? Dis-moi ce que tu cherches !','Choisis un modèle, personnalise-le, et je m’occupe du reste.','Astuce : appuie sur « / » pour chercher plus vite.'];
let mascot=null,bt,ct,ti=0;
const say=(m,ms=6000)=>{bubble.textContent=m;bubble.classList.add('show');clearTimeout(bt);bt=setTimeout(()=>bubble.classList.remove('show'),ms)};
const set=(s)=>{try{mascot&&mascot.setState(s)}catch(e){}};
const react=(s,ms=2200)=>{set(s);clearTimeout(ct);ct=setTimeout(()=>set('idle'),ms)};
const closePanel=()=>{panel.hidden=true;btn.setAttribute('aria-expanded','false')};
function chipsToSugg(){const rail=$('#rail');if(!rail)return;
  sugg.innerHTML='';rail.querySelectorAll('[data-k]').forEach(c=>{const label=c.textContent.replace(/\d+\s*$/,'').trim();
    const b=document.createElement('button');b.textContent=label;b.onclick=()=>{c.click();closePanel();react('thinking',1200);say(label==='Tout'?'Voici tous les documents !':'Voici nos « '+label+' » 👇',4500)};sugg.append(b)})}
btn.addEventListener('click',e=>{e.stopPropagation();const open=panel.hidden;panel.hidden=!open;btn.setAttribute('aria-expanded',String(open));if(open){bubble.classList.remove('show');chipsToSugg();react('celebrating',900)}});
panel.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(!a)return;closePanel();a.dataset.act==='fav'?$('#tFav').click():scrollTo({top:0,behavior:'smooth'})});
document.addEventListener('click',e=>{if(!e.target.closest('#taki-dock'))closePanel()});
addEventListener('keydown',e=>{if(e.key==='Escape')closePanel()});
/* rail latéral : relaie vers les boutons existants de home.js */
document.querySelectorAll('.app-rail [data-go]').forEach(b=>b.addEventListener('click',()=>{const t=document.getElementById(b.dataset.go);t&&t.click();document.querySelectorAll('.app-rail button').forEach(x=>x.classList.toggle('on',x===b))}));
/* Taki réagit à la vie de la page */
document.addEventListener('click',e=>{const f=e.target.closest('.fav');if(f)setTimeout(()=>{if(f.classList.contains('on')){react('celebrating',2000);say('Super choix ! Je le garde pour toi 💛',3500)}})});
const msg=$('#msg');if(msg)new MutationObserver(()=>{if(msg.hidden){set('idle');return}const t=msg.textContent||'';
  if(/Aucun|Impossible/i.test(t)){react('error',3500);say(/Aucun/i.test(t)?'Je n’ai rien trouvé… essaie une autre catégorie.':'Oups, un souci de connexion. Réessaie !',5000)}else set('thinking')}).observe(msg,{attributes:true,childList:true,subtree:true});
const rail=$('#rail');if(rail)new MutationObserver(()=>{if(!panel.hidden)chipsToSugg()}).observe(rail,{childList:true});
/* démarrage : Taki apparaît, salue, puis distille un conseil de temps en temps */
/* Cherche les fichiers de Taki dans les dossiers possibles (le premier qui répond est gardé) */
const BASES=['components/taki/','js/taki/','taki/','js/','components/'];
const CSS_BASES=['components/taki/','css/','css/taki/','js/taki/','taki/','assets/css/','assets/','components/','js/'];
const abs=p=>new URL(p,document.baseURI).href;
const loadCss=f=>new Promise(res=>{let i=0;const next=()=>{if(i>=CSS_BASES.length){console.warn('Taki : feuille de style introuvable : '+f+' (cherchée dans '+CSS_BASES.join(', ')+')');return res(false)}const l=document.createElement('link');l.rel='stylesheet';l.href=abs(CSS_BASES[i++]+f);l.onload=()=>res(true);l.onerror=()=>{l.remove();next()};document.head.append(l)};next()});
const loadJs=f=>new Promise(res=>{if(window.TakiMascot)return res(true);let i=0;const next=()=>{if(i>=BASES.length)return res(false);const s=document.createElement('script');s.src=abs(BASES[i++]+f);s.onload=()=>res(true);s.onerror=()=>{s.remove();next()};document.head.append(s)};next()});
async function mountTaki(){await Promise.all([loadCss('taki.css'),loadCss('taki-animations.css')]);
  if(!await loadJs('taki.js')||!window.TakiMascot)throw new Error('taki.js introuvable (cherché dans '+BASES.join(', ')+')');
  for(const b of BASES){try{return await TakiMascot.mount(btn,{initialState:'idle',templateUrl:abs(b+'taki.html')})}catch(e){}}
  throw new Error('taki.html introuvable (cherché dans '+BASES.join(', ')+')')}
(async()=>{
  try{mascot=await mountTaki()}catch(e){console.warn('Taki indisponible :',e.message);btn.innerHTML='<span class="td-fallback">T</span>'}
  let seen=false;try{seen=sessionStorage.getItem('td_taki_hi')==='1';sessionStorage.setItem('td_taki_hi','1')}catch(e){}
  setTimeout(()=>{react('celebrating',1400);say(seen?'Re-bonjour ! Je suis là si tu as besoin.':'Salut ! Je suis Taki. Dis-moi ce que tu cherches 👇',5500)},1200);
  setInterval(()=>{if(document.hidden||!panel.hidden||bubble.classList.contains('show'))return;say(TIPS[ti++%TIPS.length],5500)},28000)})();
})();
