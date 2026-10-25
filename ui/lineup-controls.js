/* Symmetric lineup editor and preflight. Loaded before studio so form interception runs first. */
(() => {
 'use strict';
 const L=window.RIVALRY_LINEUPS;
 if(!L)return;
 const $=s=>document.querySelector(s);
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const readTeam=side=>$('#team-'+side)?.value==='custom'?($('#custom-'+side)?.value.trim()||'Custom team'):$('#team-'+side)?.value||'';
 const tracked=new Map();let activeSide=0,ready=false,observing=false;
 function sync(side,{force=false}={}){
  const name=readTeam(side),field=$('#season-'+side);if(!field)return L.defaultYear(name);
  const old=tracked.get(side),changed=!old||old.name!==name;
  if(force||changed){
   window.RIVALRY_SEASON_UI?.update(side);
   const year=L.defaultYear(name);
   if(![...field.options].some(o=>o.value===String(year)))field.add(new Option(String(year),String(year)));
   field.value=String(year);
  }
  field.dataset.rosterTeam=name;
  const selected=Number(field.value)||L.defaultYear(name);
  tracked.set(side,{name,year:selected});
  window.RIVALRY_SEASON_UI?.update(side,true);
  return selected;
 }
 function inputs(){
  const a=readTeam('a'),b=readTeam('b'),seasonA=sync('a'),seasonB=sync('b');
  const rule=$('#rules-era')?.value||'auto';
  const rules=rule==='auto'?(seasonA<=2021&&seasonB<=2021?'classic':'modern'):rule;
  return {a,b,seasonA,seasonB,rules,best:Number($('#match-format')?.value||5)};
 }
 function persistAndPaint(){
  const s=window.RIVALRY_STUDIO?.state();if(!s)return;
  try{localStorage.setItem('rivalry.owstudio.v2',JSON.stringify(s));}catch{}
  window.RIVALRY_STUDIO.open('match');renderPanel(true);window.RIVALRY_LOGOS?.decorate();
 }
 function run(info){
  window.RIVALRY_STUDIO.launch(info.a,info.b,info);activeSide=0;renderPanel(true);
  window.RIVALRY_LOGOS?.decorate();
 }
 function showMissing(info,checks){
  let root=$('#rvl-roster-alert');
  if(!root){root=el('section','rvl-roster-alert');root.id='rvl-roster-alert';root.setAttribute('role','alert');$('#rv-season-picker')?.append(root);}
  root.replaceChildren(el('strong','', 'A selected roster is incomplete — no invented players will be added.'));
  checks.forEach((c,i)=>{
   if(c.complete)return;
   root.append(el('p','',`Team ${i+1}: ${c.name} · ${c.season} — missing ${c.missing.map(m=>m.count+' '+m.role).join(', ')}.`));
   const alternatives=L.years(c.name).filter(y=>L.coverage(c.name,y,info.rules).complete&&y!==c.season);
   if(alternatives.length){
    const row=el('div','rvl-inline');row.append(el('span','','Available sourced seasons:'));
    alternatives.forEach(y=>{const b=el('button','rv-tool',String(y));b.type='button';b.onclick=()=>{const side=i===0?'a':'b',f=$('#season-'+side);if(![...f.options].some(o=>o.value===String(y)))f.add(new Option(String(y),String(y)));f.value=String(y);tracked.set(side,{name:readTeam(side),year:y});sync(side);root.remove();};row.append(b)});root.append(row);
   }
  });
  root.append(el('p','rvl-muted','Choose a sourced season above. To use an unavailable roster deliberately, opt into practice mode; its slots are not professional player identities.'));
  const practice=el('button','rv-tool','Use clearly labelled practice slots');practice.type='button';practice.onclick=()=>{root.remove();run({...info,allowUnverified:true});};root.append(practice);
  root.scrollIntoView?.({behavior:'smooth',block:'center'});
 }
 document.addEventListener('click',event=>{
  if(event.target.closest?.('#swap-teams')&&document.body.dataset.game==='ow'){
   const before=inputs();
   queueMicrotask(()=>{['a','b'].forEach((side,i)=>{
    const field=$('#season-'+side),year=i?before.seasonA:before.seasonB;
    if(!field)return;
    if(![...field.options].some(o=>o.value===String(year)))field.add(new Option(String(year),String(year)));
    field.value=String(year);tracked.set(side,{name:readTeam(side),year});sync(side);
   });});
   return;
  }
  if(!event.target.closest?.('#start-match')||document.body.dataset.game!=='ow')return;
  event.preventDefault();event.stopImmediatePropagation();
  const info=inputs();
  if(!info.a||!info.b||(L.canonical(info.a)===L.canonical(info.b)&&info.seasonA===info.seasonB)){
   const t=$('#toast');if(t){t.textContent='Choose different team/season combinations.';t.classList.add('show');}return;
  }
  const checks=[L.coverage(info.a,info.seasonA,info.rules),L.coverage(info.b,info.seasonB,info.rules)];
  $('#rvl-roster-alert')?.remove();
  if(checks.some(c=>!c.complete)){showMissing(info,checks);return;}
  run(info);
 },true);
 function renderPanel(force=false){
  const s=window.RIVALRY_STUDIO?.state(),root=$('#rv-lineup-config');if(!s||!root)return;
  const signature=s.seed+'|'+(s.phase||'legacy')+'|'+activeSide+'|'+s.teams.map(t=>t.name+t.season+t.players.map(p=>p.name+p.hero).join()).join('|');
  if(!force&&root.querySelector('.rvl-dual-lineups')?.dataset.signature===signature)return;
  const box=el('div','rvl-dual-lineups');box.dataset.signature=signature;
  const tabs=el('div','rvl-side-tabs');tabs.setAttribute('role','tablist');
  s.teams.forEach((team,side)=>{
   const b=el('button',side===activeSide?'selected':'',`TEAM ${side+1} · ${team.name}`);b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected',String(side===activeSide));b.onclick=()=>{activeSide=side;renderPanel(true)};tabs.append(b);
  });box.append(tabs);
  const team=s.teams[activeSide],coverage=L.coverage(team.name,team.season,s.rules);
  const heading=el('div','rvl-selected-team');
  const icon=el('div','rvl-team-emblem');window.RIVALRY_LOGOS?.paint(icon,team.name,team.season);
  const h=el('div');h.append(el('strong','',team.name),el('span','',`${team.season} · ${s.rules==='classic'?'6v6':'5v5'} · ${coverage.complete?'sourced lineup':'incomplete roster'}`));heading.append(icon,h);box.append(heading);
  if(coverage.roster?.source){const a=el('a','rvl-source','Roster source ↗');a.href=coverage.roster.source;a.target='_blank';a.rel='noopener noreferrer';box.append(a);}
  if(!coverage.complete)box.append(el('div','rvl-roster-alert',`Missing ${coverage.missing.map(x=>x.count+' '+x.role).join(', ')} in ${team.season}. These are practice slots, not invented professional players.`));
  const list=el('div','rvl-edit-rows');
  team.players.forEach((p,i)=>{
   const row=el('div','rvl-edit-row'),name=el('div','rvl-player-heading');
   name.append(el('strong','',p.verified?p.name:`Roster unavailable · ${p.role}`),el('small','',p.role));row.append(name);
   const playerSelect=el('select');playerSelect.setAttribute('aria-label',`Team ${activeSide+1} ${p.role} player ${i+1}`);playerSelect.dataset.side=activeSide;playerSelect.dataset.slot=i;
   const eligible=(coverage.roster?.players||[]).filter(x=>x.role===p.role);
   if(!eligible.length)playerSelect.add(new Option('No verified player available',''));
   eligible.forEach(raw=>{const option=new Option(raw.name,raw.name);option.disabled=team.players.some((x,j)=>i!==j&&x.name===raw.name);playerSelect.add(option)});
   playerSelect.value=p.verified?p.name:'';playerSelect.disabled=!eligible.length||s.phase==='active';playerSelect.title=s.phase==='active'?'Substitutions are available between rounds and maps.':'Choose a sourced same-role player';
   playerSelect.onchange=()=>{const raw=eligible.find(x=>x.name===playerSelect.value);if(!window.RIVALRY_ENGINE.substitute(s,activeSide,i,raw)){playerSelect.value=p.name;return;}persistAndPaint();};
   const heroSelect=el('select');heroSelect.setAttribute('aria-label',`Team ${activeSide+1} ${p.name} hero`);heroSelect.dataset.side=activeSide;heroSelect.dataset.heroSlot=i;
   const raw=coverage.roster?.players.find(x=>x.name===p.name)||p;
   const pref=L.preferences(raw,team.name,team.season);
   pref.ranked.forEach(hero=>{const tag=pref.measured.some(x=>x.hero===hero)?' · sampled usage':pref.suggested.includes(hero)?' · player pool':'';const option=new Option(hero+tag,hero);option.disabled=team.players.some((x,j)=>j!==i&&x.hero===hero);heroSelect.add(option)});
   heroSelect.title=s.phase==='active'?'Hero swaps are allowed at spawn or while respawning; no free midfight refill.':'Choose a hero';heroSelect.value=p.hero;heroSelect.onchange=()=>{if(!window.RIVALRY_ENGINE.heroSwap(s,activeSide,i,heroSelect.value)){heroSelect.value=p.hero;return;}persistAndPaint();};
   row.append(playerSelect,heroSelect);
   const basis=p.heroPreference;
   const summary=el('div','rvl-preference-note',basis?.label||'Suggested pool · usage unavailable');
   if(basis?.constrained)summary.append(document.createTextNode(' · next-best pick to avoid a duplicate hero'));
   if(basis?.seconds)summary.append(document.createTextNode(` · ${Math.round(basis.seconds/60)} minutes in sample`));
   if(basis?.scope)summary.title=basis.scope;
   if(basis?.sources?.[0]){const a=el('a','','View usage ↗');a.href=basis.sources[0];a.target='_blank';a.rel='noopener noreferrer';summary.append(a);}
   row.append(summary);list.append(row);
  });box.append(list);
  const auto=el('button','rv-tool accent',`Auto-pick Team ${activeSide+1}'s player preferences`);auto.type='button';auto.disabled=s.phase==='active';auto.title='Automatic composition changes are available between rounds.';auto.onclick=()=>{window.RIVALRY_ENGINE.autoHeroes(s,activeSide);persistAndPaint();};box.append(auto);
  box.append(el('p','rvl-muted','Substitutions and automatic compositions are available between rounds; hero swaps are spawn-only. Season playtime data is ranked when supplied. Otherwise the listed player pool is a suggestion, not a measured “most played” statistic. Role, release-year and duplicate-hero restrictions still apply.'));
  if(s.lineupRevision!==L.REVISION){
   const notice=el('div','rvl-roster-alert','This saved match predates the roster fix. Restart to rebuild BOTH teams without changing its past event log.');
   const restart=el('button','rv-tool','Restart with resolved lineups');restart.type='button';restart.onclick=()=>{
    const a=s.teams[0],b=s.teams[1];run({a:a.name,b:b.name,seasonA:L.yearInName(a.name)||a.season,seasonB:L.yearInName(b.name)||b.season,rules:s.rules,best:s.best,seed:s.seed});
   };notice.append(restart);box.prepend(notice);
  }
  root.replaceChildren(box);
  const title=root.parentElement.querySelector('.rv-panelhead small');if(title)title.textContent='BOTH TEAMS · PLAYER PREFERENCES';
 }
 function boot(){
  if(ready)return;ready=true;
  ['a','b'].forEach(side=>{
   $('#team-'+side)?.addEventListener('change',()=>{sync(side,{force:true});$('#rvl-roster-alert')?.remove();});
   $('#custom-'+side)?.addEventListener('input',()=>sync(side,{force:true}));
   $('#season-'+side)?.addEventListener('change',()=>sync(side));sync(side);
  });
  $('#swap-teams')?.addEventListener('click',()=>{sync('a',{force:true});sync('b',{force:true});});
  const root=$('#rv-lineup-config');
  if(root&&!observing){observing=true;new MutationObserver(()=>{if(!root.querySelector('.rvl-dual-lineups'))renderPanel();}).observe(root,{childList:true});}
  renderPanel(true);
 }
 window.RIVALRY_LINEUP_UI=Object.freeze({boot,sync,inputs,renderPanel});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else queueMicrotask(boot);
})();
