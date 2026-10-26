/* Provider records and freshness are separate from model outputs and fictional matches. */
(function(root){'use strict';
 const time=x=>Number.isFinite(Date.parse(x))?Date.parse(x):null;
 const safeURL=x=>{try{const u=new URL(x,location.href);return u.protocol==='https:'&&!u.username?u.href:null}catch{return null}};
 function status(m,at=Date.now()){
  if(['completed','cancelled','postponed'].includes(m.status))return m.status;
  const checked=time(m.verifiedAt||m.updatedAt||m.retrievedAt),start=time(m.scheduledAt),age=checked===null?Infinity:at-checked;
  if(m.status==='live')return age<20*60000?'live':'unconfirmed';
  if(m.status==='scheduled'){
   // A schedule is not a result. Past scheduled records are never advertised as live/upcoming.
   if(start!==null&&start<=at)return 'unconfirmed';
   if(age>24*3600000)return 'unconfirmed';
   return start===null?'tbd':'upcoming';
  }
  return 'unconfirmed';
 }
 function availableRoster(rows,teamId,{eventId=null,at=null,matchId=null}={}){
  const ts=at?time(at):Date.now(),exact=rows.filter(r=>r.teamId===teamId);
  if(matchId){const actual=exact.find(r=>r.matchId===matchId);if(actual)return {...actual,selectionBasis:'Observed lineup in this recorded match'};}
  const squad=exact.filter(r=>r.eventId===eventId&&eventId).sort((a,b)=>(time(b.updatedAt)||0)-(time(a.updatedAt)||0))[0];
  if(squad)return {...squad,selectionBasis:'Published event squad · starting five projected'};
  const prior=exact.filter(r=>r.verification==='observed-lineup'&&time(r.observedAt)<=ts).sort((a,b)=>time(b.observedAt)-time(a.observedAt))[0];
  return prior?{...prior,selectionBasis:'Projected from last observed lineup · not confirmed for this fixture'}:null;
 }
 function coverage(r,classic=false){const need={Tank:classic?2:1,Damage:2,Support:2},counts={Tank:0,Damage:0,Support:0},seen=new Set();
  for(const p of r?.players||[]){if(!seen.has(p.id||p.name)&&Object.hasOwn(counts,p.role)){counts[p.role]++;seen.add(p.id||p.name)}}
  return {complete:Object.entries(need).every(([k,n])=>counts[k]>=n),missing:Object.entries(need).filter(([k,n])=>counts[k]<n).map(([k,n])=>`${n-counts[k]} ${k}`),counts};
 }
 let catalog=null,history=null,profiles=null,model=null,validation=null;
 const pending=new Map();
 async function json(path){if(pending.has(path))return pending.get(path);const promise=(async()=>{const ctrl=new AbortController(),id=setTimeout(()=>ctrl.abort(),20000);try{const r=await fetch(path,{cache:'no-cache',signal:ctrl.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(id)}})();pending.set(path,promise);try{return await promise}finally{pending.delete(path)}}
 async function load(){try{const data=await json('./platform/data/catalog.json');if(data.schemaVersion!==1||!Array.isArray(data.matches)||!Array.isArray(data.teams))throw Error('Unsupported feed schema');catalog=data;catalog.clientFallback=false;try{localStorage.setItem('rivalry.catalog.v1',JSON.stringify(data))}catch{}return data;}catch(e){let cached=null;try{cached=JSON.parse(localStorage.getItem('rivalry.catalog.v1'))}catch{}if(!cached)throw e;catalog={...cached,clientFallback:true,loadError:e.message};return catalog;}}
 async function allMatches(){if(history)return history;const d=await json('./platform/data/history.json');if(!Array.isArray(d.matches))throw Error('History schema unavailable');return history=d.matches;}
 async function people(){if(profiles)return profiles;const d=await json('./platform/data/profiles.json');if(!Array.isArray(d.rosters)||!Array.isArray(d.players))throw Error('Profile schema unavailable');return profiles=d;}
 async function teamRosters(id){const p=await people(),link=p.teamResources?.[id];if(!link)return p.rosters.filter(r=>r.teamId===id);const d=await json(link);return d.rosters||[];}
 async function rating(){return model||(model=await json('./platform/data/model.json'));}
 async function evaluation(){return validation||(validation=await json('./platform/data/prediction-validation.json'));}
 const api={time,status,safeURL,availableRoster,coverage,load,allMatches,people,teamRosters,rating,evaluation,json,get:()=>catalog};
 root.RIVALRY_DATA=api;if(typeof module==='object'&&module.exports)module.exports={status,availableRoster,coverage,time};
})(typeof window!=='undefined'?window:globalThis);
