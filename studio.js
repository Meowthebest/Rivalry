/* Rivalry Broadcast Studio — connects all visible events to engine state.
   Public fan simulation: no fabricated esports match data; verified snapshots are cited separately.
*/
(()=>{
'use strict';
const ENGINE=window.RIVALRY_ENGINE,ROSTERS=window.RIVALRY_VERIFIED_ROSTERS||[],TEAMS=window.RIVALRY_OWCS||[];
if(!ENGINE)return;
const KEY='rivalry.owstudio.v2',HISTORY='rivalry.owstudio.history.v2',TOURNAMENT='rivalry.owstudio.tourney.v2';
const $=s=>document.querySelector(s);
const node=(tag,cls='',str)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(str!==undefined)e.textContent=str;return e};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const fmt=n=>{const v=Math.max(0,Math.ceil(n));return Math.floor(v/60)+':'+String(v%60).padStart(2,'0')};
const short=n=>n.length>17?n.slice(0,15)+'…':n;
const avatar=n=>String(n).split(/[\s·]+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const themeFor=n=>window.RIVALRY_TEAM_STYLE?.[n]?.primary||(n.includes('Shock')?'#ee945c':n.includes('Mayhem')?'#f8abcb':'#9eb6d4');
let driver=null;let game=load(KEY,null),auto=null,speed=1,tab='match',lastDisplayedEvent=0,paintTimer=null;
let history=load(HISTORY,[]),tournament=load(TOURNAMENT,null),profileIndex=0,heroImages={},abilityIcons={},detailRequests=new Set(),heroIconsLoaded=false,cmd='hold',replay=null;
const wrap=node('div');wrap.id='rivalry-studio';
wrap.innerHTML=`
<div class="rv-shell">
<header class="rv-header"><div class="rv-brand">RIV<span>ALRY</span><small>OVERWATCH BROADCAST STUDIO</small></div>
<nav class="rv-nav" aria-label="Rivalry spectator menu">
<button data-tab="match" class="active">● LIVE MATCH</button><button data-tab="profiles">TEAM ARCHIVE</button>
<button data-tab="tournament">TOURNAMENTS</button><button data-tab="replay">MATCH REPLAYS</button></nav>
<button class="rv-quit" id="rv-exit">← MATCH CREATOR</button></header>
<section class="rv-view active" id="rv-match">
<div class="rv-broadcast">
<div class="rv-scorebar">
 <div class="rv-team-banner"><div class="rv-logo" id="rv-logo-a">TM</div><div><div id="rv-name-a" class="rv-name">TWISTED MINDS</div><div class="rv-team-tag" id="rv-tag-a">YOUR TEAM</div></div></div>
 <div class="rv-seriescenter"><div class="rv-seriesnumber" id="rv-series">0 <span>:</span> 0</div><div class="rv-serieslabel" id="rv-serieslabel">BEST OF 7</div></div>
 <div class="rv-team-banner"><div class="rv-logo" id="rv-logo-b">ZD</div><div><div id="rv-name-b" class="rv-name">ZETA DIVISION</div><div class="rv-team-tag" id="rv-tag-b">OPPONENT</div></div></div>
</div>
<div class="rv-subbar"><span class="rv-maplabel" id="rv-mapline">MAP 1 • KING'S ROW</span><span id="rv-period">ATTACK / DEFENSE</span><span class="rv-timer" id="rv-clock">4:00</span><span class="rv-badge" id="rv-live">● LIVE SIMULATION</span></div>
<div class="rv-theater">
<div class="rv-mapinfo"><div class="rv-eyebrow">PROFESSIONAL FANTASY BROADCAST / OVERWATCH</div><h1 id="rv-map">KING'S ROW</h1><p id="rv-mode">HYBRID • MAP 1</p></div>
<div class="rv-killfeed" id="rv-killfeed" aria-label="Overwatch elimination feed"></div>
<div class="rv-mapradar"><div class="head"><span>OBJECTIVE CONTROL</span><span id="rv-progresslabel">0% — 0%</span></div><div class="rv-bar"><div class="a" id="rv-progress-a" style="width:0"></div><div class="b" id="rv-progress-b" style="width:0"></div></div><div class="foot" id="rv-objective">Objective contested • teams regrouping</div></div>
<div class="rv-caster"><small>LIVE PLAY-BY-PLAY</small><span id="rv-castertext">Your teams are entering the arena.</span></div>
</div></div>
<div class="rv-sides">
<div class="rv-roster a" id="rv-roster-a"></div>
<div class="rv-center">
 <div class="rv-panel"><div class="rv-panelhead"><h3>TACTICAL CONTROL</h3><small>YOUR SHOTCALL</small></div>
 <div class="rv-controls" id="rv-commands"></div>
 <div class="rv-toolbar"><button class="rv-tool accent" id="rv-play">▶ WATCH LIVE</button><button class="rv-tool" id="rv-step">STEP 0.2s</button><button class="rv-tool" id="rv-nextfight">SKIP 30s »</button><button class="rv-tool" id="rv-restart">RESTART ↻</button><button class="rv-tool" id="rv-full">SIMULATE SERIES ⇥</button><button class="rv-tool" id="rv-nextmap" style="display:none">NEXT MAP ↗</button><div class="rv-speed" id="rv-speed"><button class="rv-tool" data-speed="0.5">0.5×</button><button class="rv-tool selected" data-speed="1">1×</button><button class="rv-tool" data-speed="2">2×</button><button class="rv-tool" data-speed="4">4×</button><button class="rv-tool" data-speed="8">8×</button></div></div>
 <div class="rv-now" id="rv-statusline">Pause anytime to adjust hero compositions or make a tactical call.</div>
 </div>
 <div class="rv-panel"><div class="rv-panelhead"><h3>TEAM STATISTICS</h3><small>E · FB · A · D / EFFECTIVE TOTALS</small></div><div class="rv-stat-controls"><label>Scope <select id="rv-stat-scope"><option value="series">Series incl. current map</option><option value="current">Current map</option></select></label><label><input type="checkbox" id="rv-stat-rates"> Per 10 minutes</label><button class="rv-tool" id="rv-export-stats">EXPORT JSON</button></div><div id="rv-stats"></div></div>
</div>
<div class="rv-roster b" id="rv-roster-b"></div>
</div>
<div class="rv-bottom"><div class="rv-panel"><div class="rv-panelhead"><h3>LIVE MATCH TIMELINE</h3><small>EVENT-DRIVEN COMMENTARY</small></div><div class="rv-timeline" id="rv-timeline"></div></div>
<div class="rv-panel"><div class="rv-panelhead"><h3>LINEUP & HERO SWAPS</h3><small>HERO POOLS ARE SIMULATED</small></div><div class="rv-now" id="rv-lineup-config">Choose a player below to change their hero or use a verified substitute.</div></div></div>
<div class="rv-truth">Rivalry is a fictional simulator, not an official OWCS broadcast. Verified season/team/player data is source-linked; damage, ratings, fights, hero pools, outcomes, and simulated players are generated. Hero portraits load from the third-party OverFast API using Blizzard-hosted artwork where available; original team crests are used where official logo reuse is not authorized.</div>
</section>
<section class="rv-view" id="rv-profiles"><div class="rv-eyebrow">DATA CENTER / VERIFIED SNAPSHOTS</div><h2 class="rv-hub-title">TEAM & PLAYER ARCHIVE</h2><p class="rv-hub-desc">Search over every imported OWL and OWCS team, then inspect verified historical player roles, nationalities and sources. Teams with incomplete source coverage are clearly marked unverified.</p><div class="rv-fields" style="margin-bottom:15px"><input type="search" id="rv-teamsearch" placeholder="Search team, player or season…" style="flex:1;min-width:220px"><select id="rv-regionfilter"><option value="All">All regions & eras</option><option>EMEA</option><option>NA</option><option>Korea</option><option>Japan</option><option>China</option><option>Pacific</option><option>OWL</option><option>2024</option><option>2025</option></select></div><div class="rv-profile-grid"><div class="rv-profiles-scroll" id="rv-teamlist"></div><div class="rv-card" id="rv-profile"></div></div></section>
<section class="rv-view" id="rv-tournament"><div class="rv-eyebrow">CUSTOM COMPETITION / BO3 • BO5 • BO7</div><h2 class="rv-hub-title">TOURNAMENT BUILDER</h2><p class="rv-hub-desc">Build an eight-team single-elimination tournament from any era. Each series is resolved through the same fight simulation engine. Advance one match at a time or run the bracket instantly.</p><div class="rv-card" id="rv-tsetup"><h4>CREATE AN EIGHT-TEAM BRACKET</h4><div class="rv-grid" id="rv-tteamselects" style="margin:14px 0"></div><div class="rv-fields"><select id="rv-tformat"><option value="3">BO3</option><option value="5" selected>BO5</option><option value="7">BO7</option></select><button class="rv-tool accent" id="rv-tcreate">GENERATE BRACKET</button></div></div><div class="rv-panel" style="margin-top:16px"><div class="rv-panelhead"><h3>TOURNAMENT BRACKET</h3><small id="rv-tstatus">NOT STARTED</small></div><div class="rv-bracket" id="rv-bracket"></div><div class="rv-toolbar"><button class="rv-tool accent" id="rv-trun">SIMULATE NEXT MATCH</button><button class="rv-tool" id="rv-tall">SIMULATE REMAINING</button><button class="rv-tool" id="rv-treset">RESET</button></div></div></section>
<section class="rv-view" id="rv-replay"><div class="rv-eyebrow">THE VAULT / FICTIONAL MATCH RECORDS</div><h2 class="rv-hub-title">MATCH HISTORY & REPLAYS</h2><p class="rv-hub-desc">All results are generated. Scrub through saved timelines to revisit a highlight, kill feed event or ultimate combination.</p><div class="rv-history-grid" id="rv-history"></div><div class="rv-panel" id="rv-replaypanel" style="display:none;margin-top:18px"><div class="rv-panelhead"><h3 id="rv-replaytitle">REPLAY TIMELINE</h3><small id="rv-replaycount">0 EVENTS</small></div><div style="padding:16px"><input class="rv-replay-slider" id="rv-replayslider" type="range" min="0" max="1" value="0"><div id="rv-replayevent"></div></div></div></section>
</div>`;
document.body.append(wrap);
function openStudio(page='match'){wrap.classList.add('open');document.body.style.overflow='hidden';nav(page);if(page==='match')paint()}
function closeStudio(){pause();wrap.classList.remove('open');document.body.style.overflow='';}
function nav(which){
 tab=which;for(const x of wrap.querySelectorAll('[data-tab]'))x.classList.toggle('active',x.dataset.tab===which);
 for(const x of wrap.querySelectorAll('.rv-view'))x.classList.toggle('active',x.id==='rv-'+which);
 if(which==='profiles')renderProfiles();if(which==='tournament')renderTournament();if(which==='replay')renderHistory();
}
function entrantVal(side){const el=$('#team-'+side);if(!el)return side==='a'?'Twisted Minds':'ZETA DIVISION';return el.value==='custom'?($('#custom-'+side)?.value.trim()||'Custom team'):el.value}
function launch(a,b,options={}){
 pause();const rule=options.rules||$('#rules-era')?.value||'auto';
 const suffixYear=name=>Number((String(name).match(/·\s*(20\d{2})$/)||[])[1]||0);
 const yearA=Number(options.seasonA||$('#season-a')?.value||suffixYear(a)||2026);
 const yearB=Number(options.seasonB||$('#season-b')?.value||suffixYear(b)||2026);
 // Cross-era auto matchups use modern 5v5. Historical-only 2018–2021 uses classic 6v6.
 const rules=rule==='auto'?(yearA<=2021 && yearB<=2021?'classic':'modern'):rule;
 const best=Number(options.best||$('#match-format')?.value||5);
 const mapSelect=$('#map-pick');
 const mapFromPicker=window.RIVALRY_OW_MAPS?.[Number(mapSelect?.value||0)]?.name||"King’s Row";
 let maps=ENGINE.maps.map(x=>x[0]);
 const first=options.map||mapFromPicker;
 if(maps.includes(first))maps=[first,...maps.filter(x=>x!==first)];
 game=ENGINE.create({...options,a,b,seasonA:yearA,seasonB:yearB,rules,best,maps:options.maps||maps,seed:options.seed});
 if(driver)driver.reset();cmd='auto';lastDisplayedEvent=0;openStudio('match');renderCommands();persist();
 loadPortraits();renderProfiles();
}
function persist(){if(!game)return;save(KEY,game)}
function getDriver(){if(!driver)driver=window.RIVALRY_PLAYBACK.create({state:()=>game,step:s=>ENGINE.step(s),onFrame:()=>{paint();if(game&&game.tick%50===0)persist();},onFinish:()=>{commitHistory();persist();paint();}});return driver;}
function pause(){auto=null;if(driver&&(driver.isRunning()||driver.isFast())){driver.pause();persist();}const btn=$('#rv-play');if(btn)btn.textContent='▶ WATCH LIVE';}
function play(){if(!game||game.worldVersion!==ENGINE.VERSION)return;if(getDriver().isRunning()){pause();return}auto=true;getDriver().play();paint();}
function advance(strategy,steps=1){if(!game||game.worldVersion!==ENGINE.VERSION||game.status==='finished')return;pause();if(strategy)game.commands[0]=strategy;for(let i=0;i<steps&&game.status!=='finished';i++)ENGINE.step(game);if(game.status==='finished')commitHistory();persist();paint();}
function fullSim(){if(!game||game.worldVersion!==ENGINE.VERSION)return;pause();$('#rv-full').disabled=true;getDriver().fastForward().then(()=>{commitHistory();persist();paint();}).catch(error=>{write($('#rv-statusline'),error.message);paint();});}
function commitHistory(){
 if(!game||game.saved||game.status!=='finished')return;game.saved=true;
 history.unshift({id:Date.now(),title:game.teams[0].name+' vs '+game.teams[1].name,teams:game.teams.map(t=>t.name),
  date:new Date().toISOString(),score:[...game.score],mode:game.rules,best:game.best,mapResults:game.mapResults,
  events:game.events.filter(e=>e.important).slice(-1400),seed:game.seed,records:game.records,options:game.options,engineVersion:game.worldVersion});
 history=history.slice(0,15);save(HISTORY,history);
}
function initials(name){return avatar(name)}
function heroSlug(hero){return String(hero||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll('.','').replace(/[^a-z0-9]+/g,'-')}
function ensureAbilityIcons(hero){
 const slug=heroSlug(hero);if(!slug||detailRequests.has(slug))return;
 detailRequests.add(slug);
 fetch('https://overfast-api.tekrop.fr/heroes/'+encodeURIComponent(slug)+'?locale=en-us')
  .then(r=>r.ok?r.json():Promise.reject(Error('detail unavailable')))
  .then(data=>{
   if(!Array.isArray(data.abilities))return;
   const icons={};data.abilities.forEach(a=>{if(a.name&&/^https:\/\//.test(a.icon||''))icons[a.name]=a.icon});
   abilityIcons[hero]=icons;if(game&&tab==='match')killFeed();
  }).catch(()=>{});
}
function portrait(hero){
 const url=heroImages[hero]||heroImages[heroSlug(hero)];if(url){const i=node('img');i.src=url;i.alt=hero;i.loading='lazy';i.onerror=()=>{delete heroImages[hero];i.remove()};return i}
 return node('span','',String(hero||'OW').replace(/[^A-Za-z]/g,'').slice(0,2).toUpperCase()||'OW');
}
function portraitNode(hero){
 const d=node('div','rv-portrait');d.append(portrait(hero));d.title=hero;return d
}
function loadPortraits(){
 if(heroIconsLoaded)return;heroIconsLoaded=true;
 const controller=new AbortController();setTimeout(()=>controller.abort(),8500);
 fetch('https://overfast-api.tekrop.fr/heroes?locale=en-us',{signal:controller.signal})
 .then(r=>r.ok?r.json():Promise.reject(Error('Hero API unavailable')))
 .then(rows=>{if(!Array.isArray(rows))return;
   rows.forEach(h=>{if(h.name&&h.portrait&&h.portrait.startsWith('https://')){heroImages[h.name]=h.portrait;heroImages[heroSlug(h.name)]=h.portrait}});
   if(game&&tab==='match')paint();
 }).catch(()=>{heroIconsLoaded=false});
}
function write(el,value){if(el)el.textContent=String(value)}
function studioColors(){wrap.style.setProperty('--rv-a',themeFor(game.teams[0].name));wrap.style.setProperty('--rv-b',themeFor(game.teams[1].name))}
function killFeed(){
 const root=$('#rv-killfeed'),list=game.killfeed.slice(0,7),existing=new Map([...root.children].map(e=>[Number(e.dataset.id),e]));
 const desired=new Set(list.map(e=>e.id));
 for(const [id,elem] of existing)if(!desired.has(id))elem.remove();
 for(const e of [...list].reverse()){
  if(existing.has(e.id))continue;
  const row=node('div','rv-feedrow '+(e.side===1?'b':'a'));row.dataset.id=e.id;
  const maker=node('span','rv-killer',e.killer||(e.self?'SELF':'ENVIRONMENT'));
  row.append(maker,portraitNode(e.killerHero||e.victimHero));
  if(e.ability&&e.killerHero)ensureAbilityIcons(e.killerHero);
  const action=node('span','rv-killaction',e.environmental?'↘':e.self?'⚠':'✕');
  const abilityUrl=abilityIcons[e.killerHero]?.[e.ability];
  if(abilityUrl){const icon=node('img');icon.src=abilityUrl;icon.alt=e.ability;icon.width=17;icon.height=17;icon.style.objectFit='contain';action.replaceChildren(icon)}
  if(e.headshot)action.append(node('span','rv-headshot','⌖'));
  if(e.environmental)action.append(node('span','rv-environment','↘'));
  row.append(action,portraitNode(e.victimHero),node('span','rv-victim',e.victim));
  if(e.assist?.length)row.append(node('span','rv-assist','+'+e.assist.slice(0,2).join('/')));
  root.prepend(row);
 }
}
function eventText(e){
 const a=game.teams?.[e.side]?.name||'A team';
 switch(e.type){
 case 'elimination':return (e.killer||'An environmental hazard')+' eliminates '+e.victim+(e.headshot?' with a HEADSHOT!':'!')+(e.assist?.length?' Assisted by '+e.assist.join(', ')+'.':'');
 case 'ultimate':return e.player+' activates '+e.ability+' ('+e.hero+').'+(game.comboTtl[e.side]>0?' The team follows the ultimate!':'');
 case 'teamwipe':return 'TEAM WIPE! '+a+' clear the point!';
 case 'map_end':case 'series_end':case 'highlight':case 'engage':case 'overtime':case 'map':case 'call':case 'swap':case 'sub':case 'reset':return e.detail||e.type.toUpperCase();
 case 'save':return e.detail||'Support save!';
 case 'ability':return e.player+' uses '+e.ability+'.';
 case 'respawn':return e.player+' returns to the fight.';
 default:return e.detail||e.type;
 }
}
function commentary(){
 const events=game.events;const last=events[events.length-1];if(!last)return'Both teams are preparing the opening engagement.';
 const biggest=[...events].reverse().find(e=>e.important&&game.time-e.t<10)||last;
 const t=eventText(biggest);
 if(biggest.type==='elimination')return t;
 if(biggest.type==='teamwipe')return 'AN ABSOLUTE TEAM WIPE! '+t.toUpperCase();
 if(biggest.type==='ultimate')return 'HERE COMES THE ULTIMATE! '+t.toUpperCase();
 if(biggest.type==='overtime')return 'OVERTIME! NOBODY IS GIVING THIS UP!';
 return t;
}
function timeline(){
 const root=$('#rv-timeline');root.replaceChildren();
 for(const e of game.events.filter(e=>e.important).slice(-45).reverse()){
  const item=node('div','rv-event'+(e.important?' important':'')),t=node('span','',fmt(e.clock));
  const info=node('div');info.append(node('b','',e.type.toUpperCase().replaceAll('_',' ')),node('div','',eventText(e)));
  item.append(t,info);root.append(item);
 }
}
function cards(side){
 const root=$('#rv-roster-'+(side===0?'a':'b'));root.replaceChildren();
 const title=node('h3','',game.teams[side].name);title.append(node('span','',(game.rules==='classic'?'6':'5')+' PLAYERS'));
 root.append(title);
 for(const p of game.teams[side].players){
  const row=node('div','rv-player '+(!p.alive?'dead ':'')+(p.ult>=100?'ultready':'')),hero=portraitNode(p.hero);
  const info=node('div','who'),nm=node('b','',p.verified?p.name:'OPEN '+p.role.toUpperCase()+' SLOT'),label=node('small','',p.hero+' · '+(p.alive?p.role:'RESPAWN '+Math.ceil(p.respawn)+'s'));
  const hp=node('div','rv-health'),fill=node('i');fill.style.width=Math.max(0,100*p.hp/p.maxHp)+'%';
  hp.append(fill);info.append(nm,label,hp);
  const pct=node('div','charge',Math.round(p.ult)+'%');pct.append(node('b','',p.ult>=100?'ULT READY':'ULT CHARGE'));
  row.append(hero,info,pct);root.append(row);
 }
}
function stats(){
 if(!game?.worldVersion){$('#rv-stats').textContent='Restart this legacy save to use reconciled statistics.';return;}
 const scope=$('#rv-stat-scope'),selected=scope.value,rates=$('#rv-stat-rates').checked;
 const expected=2+game.records.length;if(scope.options.length!==expected){scope.replaceChildren(new Option('Series incl. current map','series'),new Option('Current map','current'));game.records.forEach((m,i)=>scope.add(new Option('Map '+(i+1)+' · '+m.name,String(i))));scope.value=selected;}
 const rows=ENGINE.statistics(game,scope.value||'series',rates),table=node('table','rv-stattable'),head=node('tr');
 const fields=[['PLAYER',null],['E','eliminations'],['FB','finalBlows'],['A','assists'],['D','deaths'],['DMG','damage'],['HEAL','healing'],['MIT','mitigated'],['ULT U/E','ultimatesUsed'],['TIME','timePlayed']];
 fields.forEach(([label])=>head.append(node('th','',label)));const th=node('thead');th.append(head);table.append(th);const body=node('tbody');
 rows.sort((a,b)=>a.side-b.side).forEach(r=>{const tr=node('tr',r.side===0?'a':'b');fields.forEach(([label,k])=>{let value=!k?r.name:k==='timePlayed'?fmt(r.seconds):k==='ultimatesUsed'?(rates?r.stats.ultimatesUsed.toFixed(1):r.stats.ultimatesUsed)+'/'+(rates?r.stats.ultimatesEarned.toFixed(1):r.stats.ultimatesEarned):rates?r.stats[k].toLocaleString(undefined,{maximumFractionDigits:1}):Math.round(r.stats[k]).toLocaleString();tr.append(node('td','',value));});body.append(tr);});
 table.append(body);const note=node('p','rv-stats-note',rates?'Per 10 min = aggregate × 600 / this player’s total active-round playing seconds (including respawn time).':'E: shared damage-credit eliminations · FB: final blows · A: support/utility assists · DMG: effective hero damage; barriers shown in detailed export.');
 const scroll=node('div','rv-stats-overflow');scroll.append(table);$('#rv-stats').replaceChildren(scroll,note);
}
function picker(){
 const root=$('#rv-lineup-config');root.replaceChildren();if(!game)return;
 const line=node('div','rv-mini','Role-constrained hero swaps • Only confirmed same-role teammates can substitute. A swap costs some ultimate charge.');
 root.append(line);
 const list=node('div');list.style.display='grid';list.style.gap='8px';list.style.marginTop='12px';
 game.teams[0].players.forEach((p,i)=>{
  const row=node('div','rv-swap-inline'),tag=node('span','',p.verified?p.name:'OPEN '+p.role);tag.style.minWidth='95px';tag.style.maxWidth='105px';tag.style.overflow='hidden';tag.style.whiteSpace='nowrap';
  const choices=node('select'),catalog=window.RIVALRY_HERO_CATALOG;
  const allowed=catalog?catalog.atYear(game.teams[0].season,p.role).map(h=>h.name):
    Object.entries(ENGINE.HERO).filter(([_,h])=>h[0]===p.role).map(([name])=>name);
  for(const hero of allowed)choices.add(new Option(hero,hero));
  choices.value=p.hero;
  choices.title=allowed.length+' legal '+p.role+' heroes for '+game.teams[0].season;
  choices.onchange=()=>{if(ENGINE.heroSwap(game,0,i,choices.value)){persist();paint()}};
  row.append(tag,choices);list.append(row);
 });root.append(list);
 const verified=window.RIVALRY_ROSTER_FOR?.(game.teams[0].name,game.teams[0].season);
 if(verified){
  const sub=node('div');sub.style.marginTop='13px';sub.append(node('div','rv-mini','SUBSTITUTION — verified squad'));
  const pick=node('select');pick.style.marginTop='8px';pick.style.maxWidth='100%';
  verified.players.forEach(p=>pick.add(new Option(p.name+' · '+p.role,p.name)));
  const button=node('button','rv-tool','SUBSTITUTE SELECTED');button.style.marginLeft='7px';
  button.onclick=()=>{
   const player=verified.players.find(p=>p.name===pick.value);
   if(!player)return;const slot=game.teams[0].players.findIndex(p=>p.role===player.role&&p.name!==player.name);
   if(slot===-1){alert('No eligible same-role slot is available.');return}
   if(!ENGINE.substitute(game,0,slot,player)){alert('Player is already active or cannot fill this role.');return}
   persist();paint();
  };
  sub.append(pick,button);root.append(sub);
 }else root.append(node('div','rv-roster-warning','No season-specific verified squad available. The match uses explicitly labeled simulation slots.'));
}
function paint(){
 if(!game)return;studioColors();if(game.worldVersion!==ENGINE.VERSION){write($('#rv-statusline'),'Legacy match: restart to use the new world engine. Saved history is retained.');}
 write($('#rv-name-a'),game.teams[0].name);write($('#rv-name-b'),game.teams[1].name);
 write($('#rv-logo-a'),avatar(game.teams[0].name));write($('#rv-logo-b'),avatar(game.teams[1].name));
 write($('#rv-tag-a'),game.teams[0].season+' · '+game.rules.toUpperCase()+' ERA');
 write($('#rv-tag-b'),game.teams[1].season+' · FICTIONAL MATCH');
 $('#rv-series').innerHTML=game.score[0]+' <span>:</span> '+game.score[1];
 write($('#rv-serieslabel'),'BEST OF '+game.best+' · '+(game.rules==='classic'?'6V6':'5V5'));
 write($('#rv-map'),game.map.toUpperCase());write($('#rv-mapline'),'MAP '+(game.mapIndex+1)+' · '+game.map.toUpperCase());
 write($('#rv-mode'),game.mode.toUpperCase()+' · '+(game.mapIndex+1)+' / '+game.best);
 write($('#rv-period'),'ROUND '+((game.round||0)+1)+' · '+(game.phase||'')+' · '+(game.contest?'CONTESTED':game.mode));
 write($('#rv-clock'),game.phase==='setup'||game.phase==='roundbreak'||game.phase==='mapbreak'?fmt(game.phaseLeft):game.mode==='Flashpoint'?fmt(game.elapsed):game.mode==='Control'?fmt(game.roundElapsed):fmt(game.clock));
 write($('#rv-live'),game.status==='finished'?'SERIES FINAL':game.status==='between'?'MAP COMPLETE':game.overtime?'● OVERTIME':'● LIVE SIMULATION');
 $('#rv-live').classList.toggle('rv-ot',game.overtime);
 $('#rv-progress-a').style.width=game.progress[0]+'%';$('#rv-progress-b').style.width=game.progress[1]+'%';
 write($('#rv-progresslabel'),Math.round(game.progress[0])+'% — '+Math.round(game.progress[1])+'%');
 write($('#rv-objective'),(game.contest?'CONTESTED · ':'')+game.teams[0].players.filter(p=>p.alive).length+' vs '+game.teams[1].players.filter(p=>p.alive).length+' ALIVE');
 write($('#rv-castertext'),commentary());
 cards(0);cards(1);killFeed();timeline();stats();window.RIVALRY_LINEUP_UI?.renderPanel();
 write($('#rv-statusline'),game.status==='finished'?'Series complete · '+(game.teams[game.lastWinner]?.name||'draw')+'. Open Replays for highlights.':
 game.status==='between'?'Map complete. Watch Live automatically advances after the intermission.':
 '1× = real time · '+(game.rules==='classic'?'6v6':'5v5')+' · '+(game.phase||'')+' · '+fmt(game.seriesSeconds||0)+' active series time');
 $('#rv-nextmap').style.display=game.status==='between'?'inline-block':'none';
 $('#rv-play').disabled=game.status==='finished'||game.worldVersion!==ENGINE.VERSION;$('#rv-play').textContent=driver?.isRunning()?'Ⅱ PAUSE':game.status==='finished'?'SERIES COMPLETE':'▶ WATCH LIVE';
 $('#rv-full').disabled=game.status==='finished'||!!driver?.isFast()||game.worldVersion!==ENGINE.VERSION;
 $('#rv-step').disabled=game.status!=='playing';
 $('#rv-nextfight').disabled=game.status!=='playing';if(game.worldVersion!==ENGINE.VERSION)write($('#rv-statusline'),'This saved match uses the previous engine. Restart the matchup to enable Watch Live and reconciled statistics; saved history remains unchanged.');
}
function renderCommands(){
 const root=$('#rv-commands');root.replaceChildren();
 for(const [key,title] of [['auto','AUTO COACH'],['poke','ANGLE & POKE'],['dive','COORDINATED DIVE'],['rush','RUSH OBJECTIVE'],['hold','HOLD SPACE'],['combo','ULTIMATE COMBO']]){
  const b=node('button','rv-command'+(cmd===key?' active':''),title);
  b.title=key==='combo'?'Coordinate ready ultimates':'Control focus-fire and defensive positioning';
  b.onclick=()=>{cmd=key;if(game?.commands)game.commands[0]=key==='auto'?null:key;renderCommands();paint();};
  root.append(b);
 }
}
function showTab(tabName){openStudio(tabName);if(tabName==='match')picker()}
function renderProfiles(){
 const q=$('#rv-teamsearch').value.trim().toLowerCase(),reg=$('#rv-regionfilter').value;
 const root=$('#rv-teamlist');root.replaceChildren();
 const matching=TEAMS.filter(t=>(reg==='All'||t.region===reg)&&[t.name,t.region,...(t.players||[])].some(v=>String(v).toLowerCase().includes(q))).slice(0,400);
 matching.forEach((t,i)=>{
  const n=node('button','rv-profile-pick'+(i===profileIndex?' selected':''),t.name+'  ·  '+t.region);
  n.onclick=()=>{profileIndex=TEAMS.indexOf(t);renderProfiles()};root.append(n);
 });
 if(!matching.length)root.append(node('div','rv-empty','No teams found.'));
 const selected=TEAMS[profileIndex];const team=matching.includes(selected)?selected:matching[0];const profile=$('#rv-profile');profile.replaceChildren();
 if(!team)return;
 profile.append(node('div','rv-eyebrow','SOURCE-BACKED TEAM PROFILE'),node('h2','rv-hub-title',team.name));
 const roster=window.RIVALRY_ROSTER_FOR?.(team.name,team.year||Number((team.name.match(/·\s*(20\d{2})$/)||[])[1])||2026);
 const meta=node('div','rv-profile-meta');
 for(const x of [team.region||'UNKNOWN',roster?('VERIFIED '+roster.season+' ROSTER'):'ROLE DATA NOT VERIFIED',team.era||'OWCS'])meta.append(node('span','rv-pill',x));
 profile.append(meta);
 if(!roster){profile.append(node('div','rv-roster-warning','This team is known from competition listings, but a complete role-verified roster snapshot has not been sourced here. The site will not invent its players or nationalities.'));if(team.players?.length)profile.append(node('p','rv-mini','Names listed by tournament source (roles unverified): '+team.players.join(', ')));if(team.source){const link=node('a','rv-tool','VIEW COMPETITION SOURCE ↗');link.href=team.source;link.target='_blank';link.rel='noopener noreferrer';profile.append(link)}}
 else{
  const grid=node('div','rv-roster-grid');
  roster.players.forEach(p=>{
   const card=node('div','rv-member'),img=portraitNode(p.heroes?.[0]||'Overwatch'),info=node('div');
   info.append(node('strong','',p.name),node('span','',p.role+' · '+(p.country||'Nationality unverified')));
   card.append(img,info);grid.append(card);
  });profile.append(grid);
  const note=node('p','rv-mini','Roster snapshot: '+roster.season+'. Hero suggestions are simulated and do not represent verified hero-pool statistics. Transfers and retired players are not assumed current.');note.style.marginTop='14px';profile.append(note);
  const a=node('a','rv-tool','VERIFY ROSTER ↗');a.href=roster.source;a.target='_blank';a.rel='noopener noreferrer';profile.append(a);
 }
 const button=node('button','rv-tool accent','SIMULATE THIS TEAM');
 button.style.marginLeft='8px';button.onclick=()=>{const opponent=team.name==='Twisted Minds'?'ZETA DIVISION':'Twisted Minds';launch(team.name,opponent,{best:5,seasonA:roster?.season||team.year||2026,seasonB:2026,rules:roster?.season<=2021?'modern':'modern'});picker();renderCommands()};
 profile.append(button);
}
function simulateQuick(a,b,best,seed){
 const sim=ENGINE.create({a,b,best,rules:/(?: · (?:OWL|2018|2019|2020|2021))/.test(a+' '+b)?'classic':'modern',
  seed:seed});
 let steps=0;while(sim.status!=='finished'&&steps<250000){
  ENGINE.step(sim);steps++;
 }
 return{winner:sim.score[0]>sim.score[1]?a:sim.score[1]>sim.score[0]?b:null,score:[...sim.score],steps,events:sim.events.slice(-80)};
}
function renderTournament(){
 const root=$('#rv-tteamselects');if(!root.childElementCount){
  const defaults=['Twisted Minds','ZETA DIVISION','Crazy Raccoon','Team Falcons','San Francisco Shock · 2019','Shanghai Dragons · 2021','Dallas Fuel · 2022','Florida Mayhem · 2023'];
  for(let i=0;i<8;i++){
   const field=node('select');field.dataset.slot=i;
   for(const t of TEAMS)field.add(new Option(t.name,t.name));
   field.value=defaults[i];root.append(field);
  }
 }
 const bracket=$('#rv-bracket');bracket.replaceChildren();
 if(!tournament){bracket.append(node('div','rv-empty','Choose eight teams, select the format and generate the bracket.'));write($('#rv-tstatus'),'NOT STARTED');return}
 write($('#rv-tstatus'),tournament.champion?'CHAMPION · '+tournament.champion:'IN PROGRESS');
 for(let round=0;round<3;round++){
  const col=node('div','rv-round');col.append(node('div','rv-eyebrow',['QUARTERFINALS','SEMIFINALS','GRAND FINAL'][round]));
  const names=round===0?tournament.teams:round===1?tournament.results.slice(0,4).filter(x=>x).map(x=>x.winner):tournament.results.slice(4,6).filter(x=>x).map(x=>x.winner);
  for(let i=0;i<8/(2**(round+1));i++){
   const idx=[0,4,6][round]+i;
   const played=tournament.results[idx],match=node('div','rv-bracket-match');
   for(let j=0;j<2;j++){
    const name=names[i*2+j]||'TBD',row=node('div','rv-bracket-team'+(played?.winner===name?' winner':''));row.append(node('span','',name),node('strong','',played?String(played.score[j]??''):''));match.append(row);
   }
   col.append(match);
  }bracket.append(col);
 }
 if(tournament.champion){const champ=node('div','rv-notice','🏆 '+tournament.champion+' — FICTIONAL TOURNAMENT CHAMPION');bracket.parentElement.append(champ);setTimeout(()=>champ.remove(),4000)}
}
function nextTournament(){
 if(!tournament||tournament.champion)return;
 const n=tournament.results.filter(Boolean).length;
 let choices=[];
 if(n<4)choices=tournament.teams.slice(n*2,n*2+2);
 else if(n<6){const i=(n-4)*2;choices=[tournament.results[i].winner,tournament.results[i+1].winner]}
 else if(n===6)choices=[tournament.results[4].winner,tournament.results[5].winner];
 if(choices.length!==2)return;
 const out=simulateQuick(choices[0],choices[1],tournament.best,tournament.seed+n*12345);
 tournament.results[n]={a:choices[0],b:choices[1],...out,round:n<4?0:n<6?1:2};
 if(n===6)tournament.champion=out.winner;
 save(TOURNAMENT,tournament);renderTournament();
}
function renderHistory(){
 const root=$('#rv-history');root.replaceChildren();
 for(const h of history){
  const card=node('div','rv-historymatch');
  const info=node('div');info.append(node('div','rv-eyebrow',h.mode?.toUpperCase()+' · '+new Date(h.date).toLocaleDateString()),node('strong','',h.title),node('div','rv-mini','SERIES '+h.score.join(' – ')+' · '+h.mapResults.length+' MAPS'));
  const btn=node('button','rv-tool accent','REPLAY ↗');btn.onclick=()=>{replay=h;drawReplay(h.events.length-1);$('#rv-replaypanel').style.display='block';$('#rv-replayslider').max=Math.max(0,h.events.length-1);$('#rv-replayslider').value=Math.max(0,h.events.length-1)};
  card.append(info,btn);root.append(card);
 }
 if(!history.length)root.append(node('div','rv-empty','Complete a fictional series to save a replay here.'));
}
function drawReplay(index){
 if(!replay)return;const e=replay.events[Math.max(0,index)];if(!e)return;
 write($('#rv-replaytitle'),replay.title);write($('#rv-replaycount'),'EVENT '+(index+1)+' / '+replay.events.length);
 const root=$('#rv-replayevent');root.replaceChildren();
 root.append(node('div','rv-eyebrow','MAP '+(e.mapIndex+1)+' · '+e.map+' · '+fmt(e.clock)));
 const t=e.type==='elimination'?(e.killer||'Environment')+' → '+e.victim:(e.detail||e.type.toUpperCase());
 root.append(node('h3','',t));if(e.type==='elimination')root.append(node('p','rv-mini',(e.headshot?'HEADSHOT · ':'')+(e.killerHero||'')+' → '+(e.victimHero||'')));
}
function hook(){
 wrap.querySelectorAll('[data-tab]').forEach(n=>n.addEventListener('click',()=>showTab(n.dataset.tab)));
 $('#rv-exit').onclick=closeStudio;
 $('#rv-export-stats').onclick=()=>{if(!game?.worldVersion)return;const data={fictional:true,seed:game.seed,engineVersion:game.worldVersion,sourceManifest:'calibration/benchmarks.json',definitions:'OBSERVER_MODEL.md',series:ENGINE.statistics(game),currentMap:ENGINE.statistics(game,'current'),completedMaps:game.records,rateDenominator:'Own active-round playing seconds including deaths; not mean of map rates'};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='Rivalry-simulated-statistics-'+game.seed+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('#rv-stat-scope').onchange=stats;$('#rv-stat-rates').onchange=stats;
 $('#rv-restart').onclick=()=>{if(!game)return;if(confirm('Restart this match with the same seed and teams? Saved match history is kept.'))window.RIVALRY_STUDIO.restart()};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 $('#rv-play').onclick=()=>{if(auto)pause();else play();paint()};
 $('#rv-step').onclick=()=>{pause();advance(null);picker()};
 $('#rv-nextfight').onclick=()=>{pause();advance(null,150);picker()};
 $('#rv-full').onclick=()=>{fullSim();picker()};
 $('#rv-nextmap').onclick=()=>{if(game?.status==='between'){ENGINE.nextMap(game);persist();paint();picker()}};
 $('#rv-speed').onclick=e=>{const b=e.target.closest('[data-speed]');if(!b)return;speed=Number(b.dataset.speed);getDriver().setSpeed(speed);$('#rv-speed').querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('selected',x===b));if(auto){paint()}};
 $('#rv-teamsearch').oninput=renderProfiles;$('#rv-regionfilter').onchange=renderProfiles;
 $('#rv-tcreate').onclick=()=>{const teams=[...$('#rv-tteamselects').querySelectorAll('select')].map(x=>x.value);if(new Set(teams).size!==8){alert('Select eight distinct teams.');return}
  tournament={teams,best:Number($('#rv-tformat').value),results:Array(7).fill(null),seed:Date.now()>>>0,champion:null};save(TOURNAMENT,tournament);renderTournament()};
 $('#rv-trun').onclick=nextTournament;$('#rv-tall').onclick=()=>{for(let i=0;i<7;i++)nextTournament()};
 $('#rv-treset').onclick=()=>{tournament=null;save(TOURNAMENT,null);renderTournament()};
 $('#rv-replayslider').oninput=e=>drawReplay(Number(e.target.value));
 document.addEventListener('click',event=>{
  const start=event.target.closest('#start-match');
  if(!start||document.body.dataset.game!=='ow')return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  const a=entrantVal('a'),b=entrantVal('b');
  if(!a||!b||a.toLowerCase()===b.toLowerCase()){alert('Choose two different teams.');return}
  launch(a,b);picker();renderCommands();
 },true);
 const nav=document.querySelector('.sidebar nav');
 if(nav){
  const b=node('button','nav-link','◉  LIVE SPECTATOR');
  b.onclick=()=>{if(game){openStudio('match');picker();renderCommands();loadPortraits()}
    else{document.querySelector('#config-anchor')?.scrollIntoView({behavior:'smooth'})}};
  nav.append(b);
  const t=node('button','nav-link','▣  TOURNAMENTS');
  t.onclick=()=>showTab('tournament');nav.append(t);
 }
 document.addEventListener('keydown',e=>{
  if(!wrap.classList.contains('open'))return;
  if(e.key==='Escape'){closeStudio();return}
  if(tab==='match'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){
   if(e.code==='Space'){e.preventDefault();if(auto)pause();else play();paint()}
   if(e.key==='ArrowRight'&&!auto){advance(cmd);picker()}
  }
 });
}
hook();renderCommands();renderTournament();
if(false&&game&&game.v===2){
  // Previous builds stored the correct team name but often resolved every roster as 2026.
  // Start a clean replayable session with properly dated players, not stale OPEN slots.
  const old=game;game=ENGINE.create({
    a:old.teams[0].name,b:old.teams[1].name,
    seasonA:Number((old.teams[0].name.match(/·\s*(20\d{2})$/)||[])[1]||old.teams[0].season||2026),
    seasonB:Number((old.teams[1].name.match(/·\s*(20\d{2})$/)||[])[1]||old.teams[1].season||2026),
    rules:old.rules,best:old.best,seed:old.seed,maps:old.mapList
  });
  persist();
}
if(game&&game.v>=3){openStudio('match');picker();loadPortraits()}
window.RIVALRY_STUDIO=Object.freeze({launch,open:openStudio,close:closeStudio,state:()=>game,refresh:paint,transport:getDriver,portraitUrl:hero=>heroImages[hero]||heroImages[heroSlug(hero)]||null,abilityIcon:(hero,name)=>{ensureAbilityIcons(hero);return abilityIcons[hero]?.[name]||null;},restart:()=>{if(game)launch(game.teams[0].name,game.teams[1].name,{...game.options,seasonA:game.teams[0].season,seasonB:game.teams[1].season,best:game.best,rules:game.rules,seed:game.seed})}});
})();