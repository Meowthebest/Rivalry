/* Browse every officially released Overwatch hero as of 2026-10-25.
  Hero information and current roles: https://overwatch.blizzard.com/en-us/heroes/
  Role transition: https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/10/
  External portraits when available: https://overfast-api.tekrop.fr/
*/
(()=>{
'use strict';
const catalog=window.RIVALRY_HERO_CATALOG,studio=document.getElementById('rivalry-studio');
if(!catalog||!studio)return;
const nav=studio.querySelector('.rv-nav'),shell=studio.querySelector('.rv-shell');
const tab=document.createElement('button');tab.dataset.tab='heroes';tab.textContent='54 HEROES';
nav.insertBefore(tab,nav.querySelector('[data-tab="replay"]'));
tab.addEventListener('click',()=>window.RIVALRY_STUDIO.open('heroes'));
const view=document.createElement('section');view.className='rv-view';view.id='rv-heroes';
view.innerHTML='<div class="rv-eyebrow">OVERWATCH HERO DATABASE / UPDATED OCT 2026</div><h2 class="rv-hub-title">HERO COLLECTION</h2><p class="rv-hub-desc">Browse all 54 currently playable heroes. Season filters exclude heroes who had not released yet; Sombra appears as Damage before 2026 and Support after her October 2026 rework. Match-specific hero swaps are available in the live spectator lineup panel.</p><div class="rv-hero-toolbar"><label>ROLE<select id="rv-hero-role"><option value="all">All roles</option><option>Tank</option><option>Damage</option><option>Support</option></select></label><label>SEASON<select id="rv-hero-year"></select></label><label class="rv-hero-search">SEARCH<input id="rv-hero-query" type="search" placeholder="Find a hero…"></label><span id="rv-hero-total" class="rv-pill">54 HEROES</span></div><div id="rv-hero-grid" class="rv-hero-grid"></div><div class="rv-hero-data-note">Official hero names and broad roles are source-backed. Shown abilities are selected reference labels; combat numbers are fictional approximations. Hero images are streamed from a third-party index if it is available. <a href="https://overwatch.blizzard.com/en-us/heroes/" target="_blank" rel="noopener noreferrer">OFFICIAL HERO REFERENCE ↗</a></div>';
shell.append(view);
const $=s=>view.querySelector(s);
for(let y=2026;y>=2018;y--)$('#rv-hero-year').add(new Option(y+' roster',String(y)));
$('#rv-hero-year').value='2026';
const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
const images={};let fetched=false;
function render(){
 const year=Number($('#rv-hero-year').value),role=$('#rv-hero-role').value,q=$('#rv-hero-query').value.trim().toLowerCase();
 const heroes=catalog.atYear(year).filter(h=>(role==='all'||catalog.roleAt(h.name,year)===role)&&h.name.toLowerCase().includes(q));
 $('#rv-hero-total').textContent=heroes.length+' OF 54';
 const root=$('#rv-hero-grid');root.replaceChildren();
 for(const h of heroes){
  const name=h.name,card=document.createElement('article');card.className='rv-hero-profile';card.dataset.role=catalog.roleAt(name,year);
  const media=document.createElement('div');media.className='rv-hero-poster';
  const imgSrc=images[name]||images[slug(name)];
  if(imgSrc){const img=document.createElement('img');img.src=imgSrc;img.alt=name+' portrait';img.loading='lazy';img.onerror=()=>{img.remove();media.textContent=name.slice(0,2).toUpperCase()};media.append(img)}
  else media.textContent=name.slice(0,2).toUpperCase();
  card.append(media);
  const body=document.createElement('div');body.className='rv-hero-profile-body';
  const type=document.createElement('small');type.textContent=catalog.roleAt(name,year).toUpperCase()+'  ·  '+(h.year===2026?'NEW IN 2026':'RELEASED '+h.year);
  const title=document.createElement('h3');title.textContent=name;
  const ability=document.createElement('p');ability.textContent=h.ability+'  /  '+h.ultimate;
  const link=document.createElement('a');link.href='https://overwatch.blizzard.com/en-us/heroes/'+h.slug+'/';link.target='_blank';link.rel='noopener noreferrer';link.textContent='HERO PROFILE ↗';
  body.append(type,title,ability,link);card.append(body);root.append(card);
 }
}
for(const id of ['#rv-hero-year','#rv-hero-role','#rv-hero-query'])$(id).addEventListener('input',render);
tab.addEventListener('click',()=>{if(fetched)return;fetched=true;
 const ctrl=new AbortController();setTimeout(()=>ctrl.abort(),9000);
 fetch('https://overfast-api.tekrop.fr/heroes?locale=en-us',{signal:ctrl.signal})
  .then(r=>r.ok?r.json():Promise.reject(Error('unavailable')))
  .then(list=>{if(!Array.isArray(list))return;for(const h of list)if(h.name&&/^https:\/\//.test(h.portrait||'')){images[h.name]=h.portrait;images[slug(h.name)]=h.portrait;}render()})
  .catch(()=>{fetched=false});
});
render();
})();
