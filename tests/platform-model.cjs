'use strict';
const assert=require('node:assert/strict'),M=require('../platform/model.js'),D=require('../platform/store.js'),fs=require('node:fs');
const fixture=(id,a,b,day,win=0)=>({id,teamIds:[a,b],startedAt:`2026-01-${String(day).padStart(2,'0')}T10:00:00Z`,finishedAt:`2026-01-${String(day).padStart(2,'0')}T11:00:00Z`,status:'completed',winner:win,bestOf:3,verification:'source-reported',maps:[]});
const past=Array.from({length:15},(_,i)=>fixture('m'+i,'a','b',i+1,i%3===0?1:0));
const s=M.fit(past,'2026-02-01T00:00:00Z'),p=M.predict(s,'a','b',3);
assert.ok(p.available);assert.ok(p.probabilityA>.5&&p.probabilityA<.95);
assert.ok(Math.abs(Object.values(p.scoreProbabilities).reduce((a,b)=>a+b,0)-1)<1e-9);
assert.ok(p.mapProbabilities.every(x=>x>0&&x<1));
for(const n of [100,1000,10000]){const a=M.sample(p,n,42),b=M.sample(p,n,42);assert.deepEqual(a,b);assert.equal(a.winsA+a.winsB,n);assert.equal(Object.values(a.scores).reduce((x,y)=>x+y,0),n);}
assert.throws(()=>M.sample({available:false},100,1));assert.throws(()=>M.sample(p,999,1));
const renamed=past.map(x=>({...x,teamNames:['Famous champion','Unknown rookie']}));assert.equal(M.predict(M.fit(renamed,'2026-02-01'),'a','b',3).probabilityA,p.probabilityA,'Names cannot alter strength');
const cutoff='2026-01-09T10:30:00Z';assert.equal(M.fit(past,cutoff).count,8,'A running match result is never known before finish');
const future=fixture('future','a','b',25,1);assert.deepEqual(M.fit([...past,future],cutoff),M.fit(past,cutoff),'Future outcomes cannot leak');
assert.equal(M.predict(s,'a','never-seen',5).available,false);
const disconnected=M.fit([...past,...past.map(m=>({...m,id:m.id+'x',teamIds:['c','d']}))],'2026-02-01');assert.equal(M.predict(disconnected,'a','c',5).available,false);
const observed={...fixture('observed','x','y',1),startedAt:null,finishedAt:null,scheduledAt:'2026-01-01T12:00:00Z',completedObservedAt:'2026-01-20T00:00:00Z'};
assert.equal(M.fit([observed],'2026-01-10').count,0);assert.equal(M.fit([observed],'2026-01-21').count,1,'Observed result is only usable after its first observation');assert.equal(M.valid(observed),false,'Unknown finish time excluded from backtest');
const now=Date.parse('2026-10-26T10:00:00Z');
assert.equal(D.status({status:'scheduled',scheduledAt:'2026-10-26T09:00:00Z',updatedAt:'2026-10-26T09:50:00Z'},now),'unconfirmed');
assert.equal(D.status({status:'live',updatedAt:'2026-10-26T09:00:00Z'},now),'unconfirmed');
assert.equal(D.status({status:'live',updatedAt:'2026-10-26T09:55:00Z'},now),'live');
assert.equal(D.status({status:'completed',scheduledAt:'2027-01-01'},now),'completed','Real explicit final not converted to upcoming');
assert.equal(D.status({status:'scheduled',scheduledAt:'2026-10-27',updatedAt:'2026-10-20'},now),'unconfirmed');
assert.equal(D.coverage({players:[{id:'t',role:'Tank'},{id:'d1',role:'Damage'},{id:'d2',role:'Damage'},{id:'s1',role:'Support'}]}).complete,false);
const rs=[{teamId:'a',observedAt:'2026-10-20',verification:'observed-lineup',players:[]},{teamId:'a',observedAt:'2026-10-27',verification:'observed-lineup',players:[]}];assert.equal(D.availableRoster(rs,'a',{at:'2026-10-26'}).observedAt,'2026-10-20','Projected lineup cannot use future observation');
if(fs.existsSync('platform/data/prediction-validation.json')){const v=JSON.parse(fs.readFileSync('platform/data/prediction-validation.json'));assert.equal(v.checks.futureLeakage,false);assert.ok(v.predictions.every(r=>Date.parse(r.latestTrainingFinish)<Date.parse(r.at)));assert.equal(v.metrics.n,v.predictions.length);}
console.log('PASS: result chronology, no lookahead, stable identities, disconnected pools, 100/1k/10k draws, probability mass, uncertain schedules, roster provenance.');
