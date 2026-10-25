/* Numerical and spatial contract tests. Fixtures are deliberately synthetic, not esports data. */
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const w=require('./world-load.cjs')(),E=w.RIVALRY_ENGINE,M=w.RIVALRY_MAP;
const close=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-5*Math.max(1,Math.abs(a),Math.abs(b)),`${msg}: ${a} vs ${b}`);
const sum=(s,k)=>E.statistics(s).reduce((a,p)=>a+p.stats[k],0);
const opts={a:'Twisted Minds',b:'ZETA DIVISION',seasonA:2026,seasonB:2026,best:3,maps:['Busan','King’s Row','Circuit Royal'],seed:1103};
function verify(s){
 const stats=E.statistics(s);
 for(const row of stats){for(const k of E.STAT)assert.ok(Number.isFinite(row.stats[k])&&row.stats[k]>=-1e-7,'finite '+k);assert.ok(row.stats.timeAlive<=row.stats.timePlayed+1e-5);assert.ok(row.stats.ultimatesUsed<=row.stats.ultimatesEarned);assert.ok(row.stats.finalBlows<=row.stats.eliminations);}
 close(sum(s,'damage'),sum(s,'damageTaken'),'damage equals health loss');close(sum(s,'damage'),s.audit.damage||0,'damage audit');close(sum(s,'healing'),s.audit.healing||0,'healing audit');close(sum(s,'mitigated'),(s.audit.barrier||0)+(s.audit.resist||0),'mitigation audit');
 close(sum(s,'finalBlows'),sum(s,'deaths'),'one attributed FB per death');close(sum(s,'finalBlows'),s.audit.finalBlows||0,'final blows audit');close(sum(s,'eliminations'),s.audit.eliminations||0,'elimination participation audit');close(sum(s,'assists'),s.audit.assists||0,'utility assist audit');
 close(sum(s,'timePlayed'),s.seriesSeconds*s.teams.reduce((n,t)=>n+t.players.length,0),'playing time reconciles');
 for(const k of E.STAT){const complete=s.records.reduce((n,m)=>n+Object.values(m.players).reduce((a,p)=>a+p.stats[k],0),0);const live=Object.values(s.currentStats).reduce((n,p)=>n+p.stats[k],0);close(complete+live,sum(s,k),'map+live equals series '+k);}
 const rates=E.statistics(s,'series',true);for(const row of rates){const raw=stats.find(p=>p.id===row.id);close(row.stats.damage,raw.seconds?raw.stats.damage*600/raw.seconds:0,'time weighted rate');}
 const ids=s.events.map(e=>e.id);assert.equal(new Set(ids).size,ids.length,'unique monotonic event IDs');
 for(const p of s.teams.flatMap(t=>t.players)){assert.ok(p.hp>=-1e-5&&p.hp<=p.maxHp+1e-5);assert.ok(p.ult>=0&&p.ult<=100);assert.ok(M.walkable(E.geometry(s),p),'world occupancy');}
}
// Health, overheal, LOS, friendly-fire, range, attribution and overkill in isolation.
{
 const s=E.create({...opts,recordJournal:true});s.phase='active';const [tank,dps,,sup]=s.teams[0].players,target=s.teams[1].players[1];
 Object.assign(dps,{x:50,y:36,z:0,hp:150});Object.assign(sup,{x:48,y:36,z:0});Object.assign(target,{x:65,y:36,z:0,hp:100});
 close(E.heal(s,sup,dps,1000),dps.maxHp-150,'effective missing-health heal');close(E.heal(s,sup,dps,1000),0,'no overheal');close(E.heal(s,sup,target,100),0,'no enemy healing');
 assert.equal(E.hit(s,dps,tank,500),0,'no friendly damage');
 assert.equal(E.hit(s,dps,target,1000),100,'overkill excluded');assert.equal(target.alive,false);assert.equal(target.ultActiveUntil,0,'Death cancels personal ultimate HUD state');assert.equal(dps.finalBlows,1);assert.equal(dps.eliminations,1);assert.equal(sup.assists,1);assert.equal(E.hit(s,dps,target,1000),0,'dead targets cannot die twice');
 Object.assign(target,{alive:true,hp:target.maxHp,x:50,y:27});Object.assign(dps,{x:20,y:27});assert.equal(E.los(s,dps,target),false);assert.equal(E.hit(s,dps,target,50),0,'walls block damage');
 Object.assign(dps,{x:15,y:36});Object.assign(target,{x:100,y:36});assert.equal(E.hit(s,dps,target,50),0,'weapon range enforced');
 assert.ok(s.journal.length>0,'accounting event journal recorded');
}
// Non-random objective presence, capture, contest, overtime and automatic round transition.
{
 const s=E.create({...opts,maps:['Busan']});s.phase='active';for(const p of s.teams.flatMap(t=>t.players)){p.aiAt=1e9;p.goal=null;p.shootAt=1e9;p.healAt=1e9;}
 const tank=s.teams[0].players[0];Object.assign(tank,{x:60,y:36,z:0});for(let i=0;i<22;i++)E.step(s);assert.equal(s.objective.owner,0,'presence captures');assert.ok(s.progress[0]>0);
 s.progress[0]=99.95;Object.assign(s.teams[1].players[0],{x:61,y:36,z:0});E.step(s);assert.equal(s.overtime,true,'actual opposing touch triggers OT');assert.equal(s.phase,'active');
 Object.assign(s.teams[1].players[0],{x:110,y:36});for(let i=0;i<16;i++)E.step(s);assert.equal(s.phase,'roundbreak');assert.equal(s.roundWins[0],1);
 for(let i=0;i<50;i++)E.step(s);assert.equal(s.round,1);assert.equal(s.phase,'setup');
}
// Hero swaps preserve cumulative ledger; substitutions archive old player contributions.
{
 const s=E.create(opts);for(let i=0;i<420;i++)E.step(s);const dmg=sum(s,'damage'),old=s.teams[0].players[0],previousName=old.name;
 assert.equal(E.substitute(s,0,0,w.RIVALRY_ROSTER_FOR('Twisted Minds',2026).players.find(p=>p.name==='KSAA')),false,'midfight substitutions forbidden');
 s.phase='roundbreak';s.phaseLeft=10;const raw=w.RIVALRY_ROSTER_FOR('Twisted Minds',2026).players.find(p=>p.name==='KSAA');assert.equal(E.substitute(s,0,0,raw),true);close(sum(s,'damage'),dmg,'substitution does not erase damage');assert.ok(E.statistics(s).some(r=>r.name===previousName),'bench contribution retained');
 assert.equal(E.heroSwap(s,0,0,'D.Va'),true);close(sum(s,'damage'),dmg,'hero swap preserves damage');verify(s);
}
// Same seeded series through instant and every supported playback speed.
const signature=s=>crypto.createHash('sha256').update(JSON.stringify({score:s.score,records:s.records,stats:E.statistics(s),tick:s.tick,rand:s.rand})).digest('hex');
const instant=E.create(opts);console.time('seeded series');E.run(instant);verify(instant);console.timeEnd('seeded series');const expected=signature(instant),speeds=[];
for(const speed of [.5,1,2,4,8]){
 const s=E.create(opts);let finished=0;const d=w.RIVALRY_PLAYBACK.create({state:()=>s,step:E.step,onFinish:()=>finished++,request:()=>1,cancel:()=>{}});
 d.setSpeed(speed);d.play();d.pump(1000);close(s.time,Math.floor(speed/E.DT)*E.DT,'playback second');d.pause();const paused=JSON.stringify(s);assert.equal(d.pump(2000),0);assert.equal(JSON.stringify(s),paused,'pause freezes all state');d.play();
 let safety=0;while(s.status!=='finished'&&safety++<40000)d.pump(1000);assert.equal(signature(s),expected,'same seed regardless of speed '+speed);assert.equal(finished,1);speeds.push({speed,ticks:s.tick,score:s.score,hash:signature(s)});
}
// More series: BO3/5/7, classic era and lopsided team strength. No handpicked single winner.
const series=[];
for(const [i,best] of [3,5,7].entries()){
 const s=E.create({...opts,best,seed:770+i});E.run(s);verify(s);assert.equal(Math.max(...s.score),Math.ceil(best/2));series.push({best,score:s.score,seconds:s.seriesSeconds,maps:s.records.length});
}
const classic=E.create({...opts,a:'San Francisco Shock · 2019',b:'London Spitfire · 2018',seasonA:2019,seasonB:2018,rules:'classic',best:3,seed:200});E.run(classic);verify(classic);assert.equal(classic.teams[0].players.length,6);
const result={tests:'Passed accounting, no overheal/overkill, LOS/range, friendly fire, objective/OT, substitutions, hero swaps, automatic BO3/5/7, classic6v6, pause and seed invariance at all speeds.',comparisonHash:expected,speeds,series,classic:{score:classic.score,maps:classic.records.length,seconds:classic.seriesSeconds}};
fs.mkdirSync('validation',{recursive:true});fs.writeFileSync('validation/engine-checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
