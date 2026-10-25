// Rivalry integration smoke tests. Run with Node 22+ and jsdom.
const fs=require('node:fs'), assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
async function main(){
 const html=fs.readFileSync('index.html','utf8');
 const dom=new JSDOM(html,{url:'https://rivalry.test/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;
 w.scrollTo=()=>{};
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.fetch=async()=>({ok:true,json:async()=>[]});
 w.alert=()=>{};
 const errors=[];
 w.addEventListener('error',e=>{errors.push(e.message);e.preventDefault()});
 for(const path of ['teams.js','archive.js','data/pacific-2026.js','app.js','archive-ui.js','data/verified-rosters.js','data/stage3-rosters.js','engine/overwatch-sim.js','studio.js']){
  const src=fs.readFileSync(path,'utf8');
  try{w.eval(src)}catch(e){throw Error(path+': '+e.stack)}
 }
 assert.equal(errors.length,0,'No bootstrap runtime errors: '+errors.join(' | '));
 assert.ok(w.RIVALRY_ENGINE,'Engine module is loaded');
 assert.ok(w.RIVALRY_STUDIO,'Studio module is loaded');
 assert.equal(w.RIVALRY_OWCS.length,115,'Curated historical and 2026 archive imported');
 assert.ok(w.RIVALRY_VERIFIED_ROSTERS.length>=20,'Dated player snapshots are loaded');
 assert.equal(w.RIVALRY_ROSTER_FOR('Team Liquid').players.find(p=>p.name==='UltraViolet')?.role,'Support','Current Team Liquid support transfer mapped');
 assert.equal(w.RIVALRY_ROSTER_FOR('Spacestation Gaming').players.find(p=>p.name==='Galaa')?.role,'Support','Stage 3 Spacestation support roster mapped');
 const count=w.document.querySelectorAll('#directory-grid .directory-card').length;
 assert.ok(count>=30,'Directory shows team cards');
 const start=w.document.querySelector('#start-match');assert.ok(start);
 start.click();
 assert.ok(w.document.querySelector('#rivalry-studio').classList.contains('open'),'Studio launches from Overwatch match form');
 assert.ok(w.document.querySelectorAll('#rv-roster-a .rv-player').length===5,'Five-player team rendered');
 assert.ok(w.document.querySelectorAll('#rv-roster-b .rv-player').length===5,'Opponent five-player lineup rendered');
 const t0=w.RIVALRY_STUDIO.state().tick;
 w.document.querySelector('#rv-step').click();
 assert.equal(w.RIVALRY_STUDIO.state().tick,t0+1,'Manual step advances engine exactly once');
 for(let i=0;i<45;i++)w.document.querySelector('#rv-step').click();
 const s=w.RIVALRY_STUDIO.state();
 assert.ok(s.events.length>=20,'State-driven events exist');
 assert.ok(s.events.some(x=>x.type==='elimination'),'At least one real combat elimination generated');
 assert.ok(s.teams[0].players.some(p=>p.damage>0),'Damage follows combat logic');
 assert.ok(s.teams.some(t=>t.players.some(p=>p.healing>0)),'Healing follows combat logic');
 assert.ok(w.document.querySelectorAll('#rv-stats table tbody tr').length===10,'Ten row live stats table');
 w.document.querySelector('[data-tab="profiles"]').click();
 assert.ok(w.document.querySelectorAll('#rv-teamlist button').length>50,'Searchable team directory');
 const input=w.document.querySelector('#rv-teamsearch');input.value='shock';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.ok(w.document.querySelectorAll('#rv-teamlist button').length>0,'Team search responds');
 w.document.querySelector('[data-tab="tournament"]').click();
 assert.equal(w.document.querySelectorAll('#rv-tteamselects select').length,8,'Eight configurable tournament slots');
 w.document.querySelector('#rv-tcreate').click();
 w.document.querySelector('#rv-trun').click();
 assert.ok(w.document.querySelector('#rv-bracket').textContent.includes('SEMIFINALS'),'Bracket rendered after simulation');
 w.document.querySelector('[data-tab="match"]').click();
 w.document.querySelector('#rv-full').click();
 assert.equal(w.RIVALRY_STUDIO.state().status,'finished','Instant full-series simulation completes');
 assert.ok(JSON.parse(w.localStorage.getItem('rivalry.owstudio.history.v2')).length>=1,'Full match saved as replay');
 w.document.querySelector('[data-tab="replay"]').click();
 assert.ok(w.document.querySelector('#rv-history').querySelector('button'),'Replay UI loads saved series');
 const seeded=w.RIVALRY_ENGINE.create({a:'San Francisco Shock · 2019',b:'Shanghai Dragons · 2021',rules:'classic',best:3,seed:77});
 assert.equal(seeded.teams[0].players.length,6,'Classic 6v6 team supported');
 const unknown=w.RIVALRY_ENGINE.create({a:'Team Peps',b:'VARREL',best:3,seed:71});
 assert.ok(unknown.teams[0].players.every(p=>p.verified===false),'Unverified players are not fictional real names');
 w.close();
 console.log('PASS: boot, team database, 5v5, combat events, killfeed source, stats, timeline, profiles, tournaments, 6v6 and missing-data safety.');
}
main().catch(err=>{console.error(err);process.exitCode=1});
