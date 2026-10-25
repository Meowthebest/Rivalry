/* Season & roster picker. Protects historical accuracy: never substitute a
   2026 roster into a 2024 simulation or fabricate player roles. */
(()=>{
'use strict';
const get=id=>document.getElementById(id);
const root=document.querySelector('.settings');
if(!root||get('rv-season-picker'))return;
const box=document.createElement('section');box.id='rv-season-picker';box.className='rv-season-picker';
box.innerHTML='<div class="rv-season-header"><div><strong>TEAM & SEASON ROSTERS</strong><span>Choose the exact historical season for each team</span></div><span class="rv-season-chip">SOURCE-LINKED</span></div><div class="rv-season-grid"><label>YOUR TEAM SEASON<select id="season-a" aria-label="Your team season"></select><div id="rv-season-note-a" class="rv-season-note"></div></label><label>OPPONENT SEASON<select id="season-b" aria-label="Opponent team season"></select><div id="rv-season-note-b" class="rv-season-note"></div></label></div><div id="rv-season-rosters" class="rv-season-rosters"></div>';
const anchor=root.querySelector('.settings-row');
(anchor||root).insertAdjacentElement('afterend',box);
const norm=s=>String(s||'').toLowerCase().replace(/\s*·\s*(owl|\d{4})$/i,'').replace(/[^a-z0-9]/g,'');
const all=()=>window.RIVALRY_VERIFIED_ROSTERS||[];
function selectedTeam(side){
 const field=get('team-'+side);if(!field)return '';
 return field.value==='custom'?get('custom-'+side)?.value.trim():field.value;
}
function possibleYears(team){
 const entry=(window.RIVALRY_OWCS||[]).find(t=>t.name===team);
 const years=new Set(window.RIVALRY_ROSTER_AVAILABLE_YEARS?.(team)||[]);
 const suffix=String(team).match(/·\s*(20\d{2})$/);
 if(suffix)years.add(Number(suffix[1]));
 if(team.endsWith(' · OWL')&&entry){
   for(let y=Number(entry.first||2018);y<=Number(entry.last||2023);y++)years.add(y);
 }
 if(entry?.year)years.add(Number(entry.year));
 if(entry && !years.size)years.add(2026);
 if(!years.size)years.add(2026);
 return [...years].filter(y=>y>=2018&&y<=2026).sort((a,b)=>b-a);
}
function roster(side){
 const team=selectedTeam(side),season=Number(get('season-'+side)?.value)||2026;
 return window.RIVALRY_ROSTER_FOR?.(team,season)||null;
}
function draw(side,keep=false){
 const select=get('season-'+side);if(!select)return;
 const team=selectedTeam(side);let wanted=keep?Number(select.value):null;
 const explicit=String(team).match(/·\s*(20\d{2})$/);
 if(!keep&&explicit)wanted=Number(explicit[1]);
 const years=possibleYears(team);if(wanted&&!years.includes(wanted))years.push(wanted);
 select.replaceChildren();
 for(const y of [...new Set(years)].sort((a,b)=>b-a)){
   const r=window.RIVALRY_ROSTER_FOR?.(team,y);
   select.add(new Option(String(y)+(r?' · roster sourced':' · roster not verified'),String(y)));
 }
 if(wanted&&years.includes(wanted))select.value=String(wanted);
 else select.value=String(years.includes(2026)?2026:years[0]);
 const info=get('rv-season-note-'+side),r=roster(side);
 info.replaceChildren();
 if(r){
  info.className='rv-season-note complete';
  info.append(document.createTextNode('✓ '+r.players.length+' listed players (starters + substitutes) · '+r.season));
  if(r.source){const a=document.createElement('a');a.href=r.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent='VERIFY ↗';info.append(a)}
 }else{
  info.className='rv-season-note incomplete';
  info.append(document.createTextNode('No source-verified roles for '+team+' in '+select.value+'. Unverified lineup slots will be shown.'));
 }
}
function previews(){
 const root=get('rv-season-rosters');root.replaceChildren();
 for(const side of ['a','b']){
  const team=selectedTeam(side),data=roster(side);
  const card=document.createElement('div');card.className='rv-roster-preview';
  const heading=document.createElement('strong');heading.textContent=team+' · '+get('season-'+side)?.value;
  card.append(heading);
  const list=document.createElement('div');list.className='rv-roster-preview-list';
  if(data){
   for(const role of ['Tank','Damage','Support']){
    const people=data.players.filter(p=>p.role===role).map(p=>p.name+(p.country?' ('+p.country+')':''));
    const row=document.createElement('p');row.textContent=role.toUpperCase()+'  ·  '+(people.join(' / ')||'No verified players');list.append(row);
   }
  }else{
   const p=document.createElement('p');p.textContent='No verified role-tagged roster for this specific year. Historical names are not replaced with modern players.';list.append(p);
  }card.append(list);root.append(card);
 }
}
function update(side,keep=false){draw(side,keep);previews();}
for(const side of ['a','b']){
 get('team-'+side)?.addEventListener('change',()=>update(side));
 get('custom-'+side)?.addEventListener('input',()=>update(side));
 get('season-'+side)?.addEventListener('change',()=>update(side,true));
}
document.getElementById('game-grid')?.addEventListener('click',()=>setTimeout(()=>{
 box.classList.toggle('hidden',document.body.dataset.game!=='ow');
 update('a');update('b');
},0));
update('a');update('b');
window.RIVALRY_SEASON_UI=Object.freeze({selectedTeam,roster,update});
})();