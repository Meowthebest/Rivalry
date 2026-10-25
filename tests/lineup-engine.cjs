const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const w={},ctx=vm.createContext({window:w,console});
for(const p of ['teams.js','archive.js','data/pacific-2026.js','data/verified-rosters.js','data/stage3-rosters.js','data/asia-stage3-rosters.js','data/extra-rosters-2026.js','data/historical-lineups.js','engine/overwatch-sim.js','data/heroes-2026.js','engine/player-lineups.js','data/team-logo-manifest.js','engine/tactical-map.js','engine/world-sim.js'])vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
const E=w.RIVALRY_ENGINE,L=w.RIVALRY_LINEUPS;
for(const [a,b,ya,yb,rules] of [['Twisted Minds','ZETA Division',2026,2026,'modern'],['Crazy Raccoon · 2024','Team Falcons · 2025',2024,2025,'modern'],['San Francisco Shock · OWL','London Spitfire · 2018',2019,2018,'classic']]){
 const s=E.create({a,b,seasonA:ya,seasonB:yb,rules,seed:91,best:3});
 s.teams.forEach(t=>{
  assert.ok(t.players.every(p=>p.verified),`${t.name} all real players`);
  assert.equal(new Set(t.players.map(p=>p.hero)).size,t.players.length,'No duplicate heroes');
  t.players.forEach(p=>assert.equal(w.RIVALRY_HERO_CATALOG.roleAt(p.hero,t.season),p.role));
 });
 console.log(a,'vs',b,s.teams.map(t=>t.players.map(p=>p.name+': '+p.hero)));
}
const s=E.create({a:'Twisted Minds',b:'ZETA DIVISION',seasonA:2026,seasonB:2026,seed:1});
assert.equal(s.teams[0].players.find(p=>p.name==='FunnyAstro').hero,'Lucio');
assert.equal(s.teams[1].players.find(p=>p.name==='Proper').hero,'Tracer');
assert.equal(s.teams[1].players.find(p=>p.name==='shu').hero,'Ana');
const tank=s.teams[1].players.findIndex(p=>p.role==='Tank'),sub=L.resolve('ZETA Division',2026).players.find(p=>p.name==='Mealgaru');
assert.ok(E.substitute(s,1,tank,sub));assert.equal(s.teams[1].players[tank].name,'Mealgaru');
const supp=s.teams[1].players.findIndex(p=>p.role==='Support');
assert.ok(!E.heroSwap(s,1,supp,'Tracer'),'Reject wrong role');
assert.ok(!L.coverage('JD Gaming',2026).complete,'Missing source data does not become fake pro');
assert.ok(L.coverage('Team Peps',2026).complete);
assert.equal(L.resolve(' SF Shock · 2019 ',2019).season,2019);
assert.equal(L.resolve('Crazy Raccoon',2024).players.some(p=>p.name==='vigilante'),false);
assert.equal(L.resolve('Crazy Raccoon',2018),null,'Never use another season silently');
// Synthetic test fixture proves measured data priority. It is NOT published esports data.
w.RIVALRY_HERO_USAGE=[{player:'Quartz',team:'Twisted Minds',season:2026,hero:'Ashe',seconds:500,source:'https://example.com/test-fixture',scope:'TEST FIXTURE ONLY'}];
const t=E.create({a:'Twisted Minds',b:'ZETA DIVISION',seed:12});
assert.equal(t.teams[0].players.find(p=>p.name==='Quartz').hero,'Ashe');
assert.equal(t.teams[0].players.find(p=>p.name==='Quartz').heroPreference.basis,'observed-playtime');
assert.equal(E.create({a:'Twisted Minds',b:'Team Falcons',seasonA:2025,seasonB:2025,seed:12}).teams[0].players.find(p=>p.name==='Quartz').heroPreference.basis,'suggested-pool','No cross-year stats leak');
console.log('PASS lineage, both sides, preferences, unique picks, exact-year stats, substitutions, and fallbacks');
