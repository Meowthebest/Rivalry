/* Event-squad/observed-lineup bridge into the EXISTING authoritative combat engine.
   Fixture facts remain read-only. Predictive probabilities are NOT scripted winners. */
(()=>{'use strict';
 const base=window.RIVALRY_ENGINE;if(!base)return;
 function withSnapshots(snapshots,fn){if(!snapshots?.length)return fn();const prev=window.RIVALRY_VERIFIED_ROSTERS;
  window.RIVALRY_VERIFIED_ROSTERS=Object.freeze([...snapshots,...prev]);try{return fn()}finally{window.RIVALRY_VERIFIED_ROSTERS=prev;}}
 function apply(s){if(!s.platformEvidence)return;
  const evidence=s.platformEvidence,p=evidence.prediction;
  // Bounded scenario modifier. Not a validated mapping from Elo to full-engine win rate.
  const delta=p?.available?Math.max(-.055,Math.min(.055,(p.probabilityA-.5)*.22)):0;
  s.teams.forEach((t,side)=>{t.players.forEach(actor=>{actor.skill=.91+(side===0?delta:-delta);actor.proficiency=.92;});});
  s.statisticalModelNote='World-simulation skill modifier is a declared scenario assumption, not a calibrated tactical-engine win probability.';
 }
 function create(opts={}){const snapshots=opts.rosterSnapshots||[];const s=withSnapshots(snapshots,()=>base.create(opts));
  if(snapshots.length){s.rosterSnapshots=snapshots;s.platformEvidence=opts.platformEvidence||{prediction:null};
   s.teams.forEach((t,i)=>{t.rosterSnapshot=snapshots[i];t.rosterSource=snapshots[i]?.source;});apply(s);
  }return s;
 }
 function substitute(s,side,index,player){return withSnapshots(s.rosterSnapshots,()=>{const ok=base.substitute(s,side,index,player);if(ok)apply(s);return ok})}
 function autoHeroes(s,side,...args){return withSnapshots(s.rosterSnapshots,()=>base.autoHeroes(s,side,...args));}
 window.RIVALRY_ENGINE=Object.freeze({...base,create,substitute,autoHeroes});
})();
