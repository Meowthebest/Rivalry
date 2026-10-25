const fs=require('node:fs'),w=require('./world-load.cjs')(),E=w.RIVALRY_ENGINE;
const pairs=[['Twisted Minds','ZETA DIVISION'],['Crazy Raccoon','Team Falcons'],['Dallas Fuel','T1'],['Virtus.pro','Team Peps']];
const maps=['Busan','King’s Row','Circuit Royal','Esperança','Suravasa'];const n=Number(process.argv[2]||3),rows=[];
for(const map of maps)for(let seed=1;seed<=n;seed++){
const [a,b]=pairs[(seed-1)%pairs.length],s=E.create({a,b,best:3,seed:997*seed,maps:[map],seasonA:2026,seasonB:2026});
let steps=0;while(!s.records.length&&steps++<10000)E.step(s);
const m=s.records[0];if(!m)throw Error('Map failed '+map);
rows.push({seed,a,b,map,mode:s.mode,seconds:m.seconds,rounds:m.rounds,score:s.score,reason:s.mapResults[0].reason,players:Object.values(m.players)});
console.log(map,seed,Math.round(m.seconds),m.rounds,Math.round(Object.values(m.players).reduce((a,p)=>a+p.stats.deaths,0)),'deaths');
}
fs.writeFileSync(process.argv[3]||'validation/model-maps.json',JSON.stringify(rows,null,2));
