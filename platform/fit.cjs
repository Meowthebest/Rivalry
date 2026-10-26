// Reproducible fixed-parameter model build. Never tunes on the held-out sample.
'use strict';
const fs=require('node:fs'),path=require('node:path'),M=require('./model.js');
const dir=path.join(__dirname,'data'),h=JSON.parse(fs.readFileSync(path.join(dir,'history.json'))),c=JSON.parse(fs.readFileSync(path.join(dir,'catalog.json')));
const asOf=new Date().toISOString(),model=M.fit(h.matches,asOf),validation=M.validate(h.matches);
const write=(file,x)=>fs.writeFileSync(path.join(dir,file),JSON.stringify(x));
for(const t of Object.values(model.teams))t.displayRating=1500+(t.rating-1500)*Math.pow(.5,Math.max(0,(Date.parse(asOf)-Date.parse(t.lastAt))/86400000)/120);
write('model.json',model);write('prediction-validation.json',{...validation,generatedAt:asOf,sources:c.sources.map(s=>({id:s.id,url:s.url,retrievedAt:s.retrievedAt})),caveats:['Only results with source-provided start and finish timestamps enter the chronological evaluation.','The evaluation cohort is organized FACEIT play, not exclusively OWCS pro matches.','Unknown map order, patch details and historical hero playtime are not invented.','Parameters fixed before evaluation; no production quality or betting claim.']});
console.log(JSON.stringify({asOf,matches:model.count,teams:Object.keys(model.teams).length,holdout:validation.metrics,leakage:validation.checks},null,2));
