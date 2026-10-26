/* Rivalry Evidence v1. Fixed-parameter, chronological Elo baseline, not a wagering model.
 * IDs, completed results and their timestamps are inputs; team names never affect strength.
 * Fits only results completed strictly before the prediction time. No invented patch/hero data.
 */
(function(root){'use strict';
 const DAY=86400000,VERSION='evidence-1.0',K=24,PRIOR=1500;
 const time=x=>{const n=Date.parse(x);return Number.isFinite(n)?n:null};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const sigmoid=x=>1/(1+Math.exp(-x)),logit=p=>Math.log(p/(1-p));
 function valid(m){return m&&m.status==='completed'&&!m.forfeit&&m.teamIds?.length===2&&m.teamIds[0]!==m.teamIds[1]&&[0,1].includes(m.winner)&&time(m.startedAt)!==null&&time(m.finishedAt)>time(m.startedAt)&&m.verification==='source-reported';}
 function observed(m){return m&&m.status==='completed'&&!m.forfeit&&m.teamIds?.length===2&&m.teamIds[0]!==m.teamIds[1]&&[0,1].includes(m.winner)&&time(m.scheduledAt)!==null&&time(m.completedObservedAt)>time(m.scheduledAt)&&m.verification==='source-reported';}
 function empty(){return {teams:{},links:{},lastFinishedAt:null,count:0,version:VERSION};}
 function parent(s,id){s.links[id]??=id;return s.links[id]===id?id:(s.links[id]=parent(s,s.links[id]));}
 function team(s,id){return s.teams[id]??={id,rating:PRIOR,n:0,wins:0,lastAt:null,recent:[],maps:{}};}
 function decayed(t,at){const days=t.lastAt?Math.max(0,(at-time(t.lastAt))/DAY):0;return PRIOR+(t.rating-PRIOR)*Math.pow(.5,days/120);}
 function update(s,m,allowObserved=false){if(!valid(m)&&!(allowObserved&&observed(m)))return;const when=m.finishedAt||m.scheduledAt,at=time(when),a=team(s,m.teamIds[0]),b=team(s,m.teamIds[1]);
  const ra=decayed(a,at),rb=decayed(b,at),p=1/(1+10**((rb-ra)/400)),y=m.winner===0?1:0;
  a.rating=ra+K*(y-p);b.rating=rb-K*(y-p);parent(s,a.id);parent(s,b.id);s.links[parent(s,b.id)]=parent(s,a.id);
  [a,b].forEach((t,i)=>{t.n++;t.wins+=m.winner===i?1:0;t.lastAt=when;t.observedOnly=(t.observedOnly||0)+(valid(m)?0:1);t.recent.push({id:m.id,win:m.winner===i,at:when,opponent:m.teamIds[1-i]});t.recent=t.recent.slice(-10);});
  for(const map of m.maps||[])if(map.name&&[0,1].includes(map.winner)&&!map.restarted){[a,b].forEach((t,i)=>{const r=t.maps[map.name]??={wins:0,n:0};r.n++;if(map.winner===i)r.wins++;});}
  s.count++;s.lastFinishedAt=m.finishedAt||m.completedObservedAt;
 }
 function fit(matches,asOf=Date.now()){const cut=typeof asOf==='number'?asOf:time(asOf);const s=empty();
  matches.filter(m=>valid(m)||observed(m)).filter(m=>time(m.finishedAt||m.completedObservedAt)<cut).sort((a,b)=>time(a.finishedAt||a.scheduledAt)-time(b.finishedAt||b.scheduledAt)||a.id.localeCompare(b.id)).forEach(m=>update(s,m,true));s.asOf=new Date(cut).toISOString();return s;}
 function distribution(probabilities,best=5){const need=Math.floor(best/2)+1,out={},memo=new Map();
  function go(a,b,mass){if(a===need||b===need){out[a+'-'+b]=(out[a+'-'+b]||0)+mass;return;}
   const i=a+b,p=clamp(Number(probabilities[i]??probabilities.at(-1)??.5),.001,.999);go(a+1,b,mass*p);go(a,b+1,mass*(1-p));}
  go(0,0,1);return out;
 }
 function seriesP(p,best){const d=distribution([p],best);return Object.entries(d).reduce((s,[k,v])=>s+(Number(k.split('-')[0])>Number(k.split('-')[1])?v:0),0);}
 function mapFromSeries(p,best){let lo=.001,hi=.999;for(let i=0;i<38;i++){const mid=(lo+hi)/2;if(seriesP(mid,best)<p)lo=mid;else hi=mid;}return (lo+hi)/2;}
 function predict(state,aId,bId,best=5,mapNames=[]){if(![1,3,5,7,9].includes(Number(best)))return {available:false,reason:'Series format is not confirmed or supported.'};
  const a=state.teams[aId],b=state.teams[bId];if(!a||!b||a.n<3||b.n<3)return {available:false,reason:'At least three earlier completed series per team are required.',samples:[a?.n||0,b?.n||0]};
  if(parent(state,aId)!==parent(state,bId))return {available:false,reason:'These teams belong to disconnected result pools. A cross-region ranking would be unsupported.',samples:[a.n,b.n]};
  const at=time(state.asOf)||Date.now(),ra=decayed(a,at),rb=decayed(b,at),reliability=Math.min(a.n,b.n)/(Math.min(a.n,b.n)+8);
  const p0=clamp(.5+(1/(1+10**((rb-ra)/400))-.5)*reliability,.08,.92),base=mapFromSeries(p0,best);
  const ps=Array.from({length:best},(_,i)=>{const name=mapNames[i],am=a.maps[name],bm=b.maps[name];if(!am||!bm||Math.min(am.n,bm.n)<3)return base;
   const wa=(am.wins+2)/(am.n+4),wb=(bm.wins+2)/(bm.n+4),n=Math.min(am.n,bm.n);
   return clamp(sigmoid(logit(base)+.20*(logit(wa)-logit(wb))*n/(n+10)),.05,.95);});
  const scores=distribution(ps,best),p=Object.entries(scores).reduce((sum,[k,v])=>sum+(Number(k.split('-')[0])>Number(k.split('-')[1])?v:0),0);
  const oldest=Math.max((at-time(a.lastAt))/DAY,(at-time(b.lastAt))/DAY);
  return {available:true,probabilityA:p,probabilityB:1-p,mapProbabilities:ps,scoreProbabilities:scores,samples:[a.n,b.n],ratings:[ra,rb],recent:[a.recent,b.recent],mapRecords:[a.maps,b.maps],confidence:Math.min(a.n,b.n)<10||oldest>45||a.observedOnly||b.observedOnly?'Low':'Moderate',asOf:state.asOf,model:VERSION,
   factors:[`${a.n} / ${b.n} earlier completed series`,`${Math.round(ra)} / ${Math.round(rb)} recency-decayed Elo`,mapNames.length?'Known-map adjustment where both teams have at least 3 observations':'Unconfirmed map order: no map advantage invented','120-day inactivity half-life; small-sample shrinkage toward 50%'],
   observedOnly:!!(a.observedOnly||b.observedOnly),limitations:[...(a.observedOnly||b.observedOnly?['Some result times are published schedule dates, not finish timestamps; those records enter only after first observed completion and are excluded from held-out testing.']:[]),'No verified hero-usage or exact patch inputs.','Same organization ID does not certify roster continuity.','Statistical series probabilities are not calibrated win rates of the tactical combat engine.']};
 }
 function score(rows){if(!rows.length)return null;const n=rows.length,brier=rows.reduce((s,r)=>s+(r.p-r.y)**2,0)/n,logLoss=rows.reduce((s,r)=>s-r.y*Math.log(clamp(r.p,.001,.999))-(1-r.y)*Math.log(clamp(1-r.p,.001,.999)),0)/n;
  const bins=Array.from({length:5},(_,i)=>{const b=rows.filter(r=>Math.min(4,Math.floor(r.p*5))===i);return {range:[i/5,(i+1)/5],n:b.length,predicted:b.length?b.reduce((s,x)=>s+x.p,0)/b.length:null,observed:b.length?b.reduce((s,x)=>s+x.y,0)/b.length:null};});
  return {n,brier,logLoss,accuracy:rows.filter(r=>(r.p>=.5?1:0)===r.y).length/n,baselineBrier:.25,baselineLogLoss:Math.log(2),reliability:bins};}
 function validate(matches){const rows=matches.filter(valid).sort((a,b)=>time(a.startedAt)-time(b.startedAt)||a.id.localeCompare(b.id));if(rows.length<40)return {available:false,reason:'Fewer than 40 completed series with valid start/end timestamps.'};
  const cut=time(rows[Math.floor(rows.length*.8)].startedAt),done=rows.slice().sort((a,b)=>time(a.finishedAt)-time(b.finishedAt)||a.id.localeCompare(b.id)),s=empty(),out=[];let k=0,skipped=0;
  for(const m of rows){const at=time(m.startedAt);while(k<done.length&&time(done[k].finishedAt)<at)update(s,done[k++]);s.asOf=m.startedAt;
   if(at<cut)continue;const pred=predict(s,m.teamIds[0],m.teamIds[1],m.bestOf||5,[]);
   if(!pred.available){skipped++;continue;}out.push({id:m.id,at:m.startedAt,latestTrainingFinish:s.lastFinishedAt,p:pred.probabilityA,y:m.winner===0?1:0});
  }
  return {available:!!out.length,version:VERSION,parameters:{K,prior:PRIOR,inactivityHalfLifeDays:120,sampleShrinkage:8},method:'Last 20% by start timestamp; predict then update only results finished strictly before each start; no parameter tuning on holdout.',cutoff:new Date(cut).toISOString(),cohort:rows.length,skipped,metrics:score(out),checks:{futureLeakage:out.some(r=>time(r.latestTrainingFinish)>=time(r.at))},predictions:out};
 }
 function sample(pred,n=1000,seed=1){if(!pred.available)throw Error('Prediction evidence unavailable');if(![100,1000,10000].includes(n))throw Error('Unsupported sample count');let x=seed>>>0||1;const rand=()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;},best=pred.mapProbabilities.length,need=Math.floor(best/2)+1,scores={};let wins=0;
  for(let i=0;i<n;i++){let a=0,b=0;while(a<need&&b<need){if(rand()<pred.mapProbabilities[a+b])a++;else b++;}if(a>b)wins++;scores[a+'-'+b]=(scores[a+'-'+b]||0)+1;}
  const p=wins/n,z=1.96,den=1+z*z/n,center=(p+z*z/(2*n))/den,half=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den;
  return {n,seed,winsA:wins,winsB:n-wins,probabilityA:p,scores,monteCarlo95:[center-half,center+half],kind:'Independent map-outcome series draws; not full combat simulations.',model:VERSION};
 }
 const api={VERSION,fit,predict,validate,sample,distribution,valid,time,score};if(typeof module==='object'&&module.exports)module.exports=api;root.RIVALRY_PREDICT=api;
})(typeof window!=='undefined'?window:globalThis);
