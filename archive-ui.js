/* Rivalry archive interactions — browser-only, no third-party API keys or scraped binaries. */
(()=>{
'use strict';
const all=window.RIVALRY_OWCS||[],old=window.RIVALRY_HISTORICAL||[],
      champs=window.RIVALRY_CHAMPIONS||[],maps=window.RIVALRY_OW_MAPS||[];
const $=s=>document.querySelector(s);
const E=(tag,className='',value)=>{const e=document.createElement(tag);if(className)e.className=className;if(value!==undefined)e.textContent=value;return e;};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yearCounts=year=>year===2026?all.filter(t=>['EMEA','NA','Korea','Japan','China'].includes(t.region)).length:
 year>=2024?old.filter(t=>Number(t.year)===year).length:
 old.filter(t=>t.region==='OWL'&&t.first<=year&&t.last>=year&&t.name.endsWith(' · OWL')).length;
let activeYear=2019;
const dir=$('#team-directory');
if(!dir)return;
const bar=E('section','era-panel');bar.id='era-panel';
bar.innerHTML='<div class="era-topline"><div class="eyebrow">HISTORICAL ARCHIVE / 2018—2026</div><span class="era-tag">FANTASY TIME MACHINE</span></div><div class="era-hero"><div><div class="era-kicker">ONE GAME. EVERY ERA.</div><h2>REWRITE <em>HISTORY.</em></h2><p>What if the 2019 Shock faced today’s OWCS giants? Recreate the old rivalries, or invent the finals we never got.</p></div><div class="era-sigil" aria-hidden="true">OW<span>26</span></div></div><div class="era-tabs" id="era-year-tabs" aria-label="Historical season selector"></div><div id="era-season-content"></div><div class="era-source-foot">Historical team brands and event winners are sourced from Liquipedia and the Overwatch Wiki. Matches, lineups, ratings and tactical outcomes remain fictional. <a href="https://liquipedia.net/overwatch/Overwatch_League" target="_blank" rel="noopener noreferrer">OWL HISTORY ↗</a> <a href="https://liquipedia.net/overwatch/Overwatch_Champions_Series" target="_blank" rel="noopener noreferrer">OWCS HISTORY ↗</a></div>';
dir.insertAdjacentElement('afterend',bar);
const eraFilterField=E('label','form-field archive-setting');eraFilterField.id='era-field';
eraFilterField.append(document.createTextNode('OVERWATCH RULESET'));
const select=E('select');select.id='rules-era';
[['auto','Auto · team era'],['classic','Classic 6v6 (OWL 2018–21)'],['modern','Modern 5v5 (OWL 2022+ / OWCS)']].forEach(([v,t])=>select.add(new Option(t,v)));
eraFilterField.append(select);
const mapField=E('label','form-field archive-setting');mapField.id='map-field';mapField.append(document.createTextNode('STARTING MAP'));
const mapSelect=E('select');mapSelect.id='map-pick';maps.forEach((m,i)=>mapSelect.add(new Option(m.name+' · '+m.mode,String(i))));
mapSelect.value=String(Math.max(0,maps.findIndex(m=>m.name.toLowerCase().includes('king'))));
mapField.append(mapSelect);
$('.settings-row')?.append(eraFilterField,mapField);
const updateFields=()=>{const on=document.body.dataset.game==='ow';eraFilterField.classList.toggle('hidden',!on);mapField.classList.toggle('hidden',!on)};
$('#game-grid')?.addEventListener('click',()=>setTimeout(updateFields,10));updateFields();

function choose(a,b,mode){
  if(document.body.dataset.game!=='ow'){$('#game-grid')?.querySelector('button')?.click();}
  function side(id,name){
    const s=$('#team-'+id),custom=$('#custom-'+id);if(!s)return;
    if(Array.from(s.options).some(o=>o.value===name)){s.value=name;custom?.classList.add('hidden');}
    else{s.value='custom';if(custom){custom.value=name;custom.classList.remove('hidden')}}
    s.dispatchEvent(new Event('change',{bubbles:true}));
  }
  side('a',a);if(b)side('b',b);
  if(mode)select.value=mode;
  document.querySelector('#config-anchor')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function card(team, year){
  const elm=E('div','era-team');
  const initials=team.tag||team.base?.slice(0,3).toUpperCase()||'OW';
  elm.innerHTML='<div class="era-crest">'+escape(initials.slice(0,5))+'</div><div class="era-team-name"><strong>'+escape(team.base||team.name)+'</strong><span>'+escape(team.accolade||team.season||String(year))+'</span></div>';
  const b=E('button','era-choose','PLAY ↗');b.type='button';
  b.addEventListener('click',()=>choose(team.name,null,year<=2021?'classic':'modern'));
  elm.append(b);return elm;
}
function yearTeams(year){
 if(year===2026)return all.filter(t=>['EMEA','NA','Korea','Japan','China'].includes(t.region));
 if(year>=2024)return old.filter(t=>t.year===year);
 const basics=old.filter(t=>t.region==='OWL'&&t.name.endsWith(' · OWL')&&t.first<=year&&t.last>=year);
 const special=old.filter(t=>t.region==='OWL'&&t.year===year);
 return [...special,...basics];
}
function renderYear(){
 const tabs=$('#era-year-tabs');tabs.replaceChildren();
 for(let year=2018;year<=2026;year++){const b=E('button','era-year'+(year===activeYear?' selected':''),String(year));b.type='button';b.setAttribute('aria-pressed',String(year===activeYear));b.addEventListener('click',()=>{activeYear=year;renderYear()});tabs.append(b)}
 const main=$('#era-season-content');main.replaceChildren();
 const winner=champs.find(x=>x.year===activeYear),isOWL=activeYear<=2023,teams=yearTeams(activeYear);
 const topline=E('div','era-season-head');
 const info=E('div');info.append(E('span','era-competition',isOWL?'OVERWATCH LEAGUE': 'OVERWATCH CHAMPIONS SERIES'),E('h3','',activeYear+' SEASON'));
 const trophy=E('div','era-winner');
 trophy.innerHTML='<span>'+escape(winner?'WORLD CHAMPION':'WORLD FINALS')+'</span><strong>'+escape(winner?winner.winner:'TO BE DETERMINED')+'</strong>';
 topline.append(info,trophy);
 const content=E('div','era-season-main');content.append(topline);
 const note=E('p','era-season-note',
  activeYear===2026?'The 2026 OWCS World Finals have not been played as of 25 October 2026. Current Stage 3 participant snapshot, not final standings.':
  isOWL?'The original city-based OWL era. This view includes historically active franchises, plus available champion-year snapshots.':'Historical OWCS teams from tournament participants and prominent regional appearances. Rosters are simulated unless explicitly documented.');
 content.append(note);
 const grid=E('div','era-team-grid');teams.forEach(t=>grid.append(card(t,activeYear)));
 content.append(grid);main.append(content);
}
renderYear();
const quick=E('section','era-rivalries');
quick.innerHTML='<div class="eyebrow">CLASSIC WHAT-IFS</div><h2>LEGENDS VS LEGENDS</h2><p>Start a rivalry instantly. Historical team selections are marked by their original season.</p><div class="era-rivals" id="era-rivals"></div>';
bar.insertAdjacentElement('afterend',quick);
[
 ['2019 SHOCK VS 2021 DRAGONS','San Francisco Shock · 2019','Shanghai Dragons · 2021','classic'],
 ['2018 SPITFIRE VS 2023 MAYHEM','London Spitfire · 2018','Florida Mayhem · 2023','modern'],
 ['2024 FALCONS VS 2025 TWISTED','Team Falcons · 2024','Twisted Minds · 2025','modern'],
 ['2026 ZETA VS 2020 SHOCK','ZETA DIVISION','San Francisco Shock · 2020','modern']
].forEach(([headline,a,b,era])=>{
 const button=E('button','era-rivalry-card');
 button.innerHTML='<span>FANTASY SHOWMATCH</span><strong>'+escape(headline)+'</strong><small>'+escape(a)+'  VS  '+escape(b)+'</small><i>CREATE ↗</i>';
 button.addEventListener('click',()=>choose(a,b,era));
 $('#era-rivals').append(button);
});
// Browse verified primary asset sources without copying copyrighted images into this public site.
const refs=E('section','source-wall');
refs.innerHTML='<div class="eyebrow">DATA / VISUAL REFERENCE SOURCES</div><h2>THE SOURCE LIBRARY</h2><p>Historical results, competition formats, hero mechanics and official artwork references. Original vector styling is used throughout this fan project; copyrighted assets are not bulk-mirrored.</p><div class="source-links"><a href="https://liquipedia.net/overwatch/Main_Page" target="_blank" rel="noopener noreferrer"><b>LIQUIPEDIA</b><span>OW / OWCS esports teams, events and rosters ↗</span></a><a href="https://overwatch.fandom.com/wiki/Overwatch_Wiki" target="_blank" rel="noopener noreferrer"><b>OVERWATCH WIKI</b><span>Heroes, maps, historical game mechanics ↗</span></a><a href="https://blizzard.gamespress.com/Overwatch" target="_blank" rel="noopener noreferrer"><b>OFFICIAL PRESS CENTER</b><span>Artwork, screenshots and source media ↗</span></a><a href="https://esports.overwatch.com/en-us" target="_blank" rel="noopener noreferrer"><b>OVERWATCH ESPORTS</b><span>Official circuit and format information ↗</span></a></div>';
quick.insertAdjacentElement('afterend',refs);
const inspector=E('dialog','rival-hero-dialog');inspector.id='rival-hero-dialog';
inspector.innerHTML='<div class="hero-dialog-head"><span>HERO DOSSIER / FICTIONAL LINEUP</span><button id="hero-close" aria-label="Close hero information">✕</button></div><div class="hero-dialog-core"><div class="hero-dialog-badge">OW</div><div><div id="hero-dialog-role" class="eyebrow"></div><h2 id="hero-dialog-name"></h2><p id="hero-dialog-blurb"></p></div></div><a class="hero-dialog-source" id="hero-dialog-link" href="https://overwatch.fandom.com/wiki/Overwatch_Wiki" target="_blank" rel="noopener noreferrer">READ HERO PROFILE ↗</a>';
document.body.append(inspector);
$('#hero-close')?.addEventListener('click',()=>inspector.close());
inspector.addEventListener('click',event=>{if(event.target===inspector)inspector.close()});
const heroNotes={
 'Sigma':['Tank','Gravity manipulation, barrier management and area denial.'],
 'Sojourn':['Damage','Charge your railgun by dealing damage, then look for precision eliminations.'],
 'Tracer':['Damage','Blink and Recall allow quick backline pressure and slippery escapes.'],
 'D.Va':['Tank','Defense Matrix denies projectiles while boosters create dive pressure.'],
 'Winston':['Tank','Jump Pack and Barrier Projector enable coordinated high-ground dives.'],
 'Reinhardt':['Tank','Barrier Field, Earthshatter and close-range brawling.'],
 'Juno':['Support','Speed Ring and Orbital Ray enable rapid fights and team sustain.'],
 'Baptiste':['Support','Immortality Field and Amplification Matrix can turn a fight.'],
 'Kiriko':['Support','Swift Step and Protection Suzu protect teammates during dives.'],
 'Ana':['Support','Biotic Grenade, Sleep Dart and Nano Boost create openings.'],
 'Lucio':['Support','Speed boost, wallride and Sound Barrier support rush formations.'],
 'Genji':['Damage','Swift Strike and Dragonblade reward clean target focus.'],
 'Hanzo':['Damage','Sonic Arrow provides scouting; Dragonstrike controls corridors.'],
 'Mei':['Damage','Ice Wall separates targets while Blizzard threatens grouped enemies.'],
 'Zenyatta':['Support','Discord Orb enhances focus fire; Transcendence counters pressure.']
};
document.addEventListener('click',event=>{
 const cell=event.target.closest?.('.hero-cell[data-hero]');if(!cell)return;
 const hero=cell.dataset.hero,note=heroNotes[hero]||['Hero','Explore hero abilities, matchup strengths and team synergy.'];
 $('#hero-dialog-name').textContent=hero;$('#hero-dialog-role').textContent=note[0]+' • OVERWATCH';
 $('#hero-dialog-blurb').textContent=note[1]+' All match statistics are fictional.';
 $('#hero-dialog-link').href='https://overwatch.fandom.com/wiki/'+encodeURIComponent(hero.replaceAll(' ','_'));
 inspector.showModal();
});
const mapHint=E('span','map-source-tag','✦ ORIGINAL MAP ATLAS VISUALS');
$('#arena-hero-strip')?.append(mapHint);
})();
