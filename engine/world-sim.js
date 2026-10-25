/* Authoritative fixed-step Overwatch-inspired world. This is a fictional model.
 * The roster/hero services are retained; this module replaces coarse combat and accounting.
 * Invariants: effective health loss only; bounded healing; one FB per attributed death;
 * elimination credit may be shared; support assists are a separate model statistic.
 * Every UI reads this state. Wall-time and rendering consume no simulation randomness.
 */
(()=>{'use strict';
 const B=window.RIVALRY_ENGINE,M=window.RIVALRY_MAP;if(!B||!M)return;
 const DT=.2,VERSION=5,STAT=['eliminations','finalBlows','assists','deaths','damage','barrierDamage','healing','mitigated','damageTaken','ultimatesEarned','ultimatesUsed','timePlayed','timeAlive','objectiveTime'];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0)),copy=x=>JSON.parse(JSON.stringify(x));
 const all=s=>s.teams.flatMap(t=>t.players),alive=(s,side)=>s.teams[side].players.filter(p=>p.alive),byId=(s,id)=>all(s).find(p=>p.id===id);
 const rng=s=>{let x=s.rand|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rand=x>>>0;return s.rand/4294967296};
 const zero=()=>Object.fromEntries(STAT.map(k=>[k,0]));
 const key=p=>p.side+'|'+p.name.toLowerCase().replace(/[^a-z0-9]/g,'');
 function ledger(s,p){const k=key(p);return s.currentStats[k]||(s.currentStats[k]={id:k,name:p.name,side:p.side,role:p.role,team:s.teams[p.side].name,stats:zero(),heroes:{}})}
 function add(s,p,field,n){if(!Number.isFinite(n)||n<0)throw Error('Invalid statistic '+field);const row=ledger(s,p);row.stats[field]+=n;const h=row.heroes[p.hero]||(row.heroes[p.hero]=zero());h[field]+=n;p[field]=(p[field]||0)+n;if(field==='finalBlows')p.kills=p.finalBlows;}
 function event(s,type,data={},important=true){const e={id:++s.eventSeq,t:s.time,time:s.elapsed,clock:s.mode==='Flashpoint'?s.elapsed:s.mode==='Control'?s.roundElapsed:s.clock,map:s.map,mapIndex:s.mapIndex,round:s.round+1,type,important,...data};s.events.push(e);if(s.events.length>6000)s.events.splice(0,500);return e;}
 function journal(s,type,source,target,n,aux=0){s.audit[type]=(s.audit[type]||0)+n;if(s.recordJournal)s.journal.push([s.tick,type,source?.id||null,target?.id||null,n,aux,s.mapIndex]);}
 function beam(s,a,b,color,type='shot'){s.traces.push({a:{x:a.x,y:a.y,z:a.z||0},b:{x:b.x,y:b.y,z:b.z||0},side:a.side,type,color,until:s.time+.35});}
 function config(hero,role){
  const c={range:role==='Tank'?22:role==='Support'?35:32,shot:role==='Tank'?62:role==='Damage'?55:24,interval:role==='Tank'?.8:role==='Damage'?.55:.7,accuracy:.7,heal:role==='Support'?58:0,healRange:30,speed:5.5,defense:role==='Tank'?'guard':null,ult:'burst',cost:2100};
  const specific={
   Sigma:{range:24,shot:78,interval:1.1,defense:'barrier',ult:'lift',cost:2300},
   Winston:{range:9,shot:36,interval:.5,accuracy:1,defense:'dome',ult:'transform'},
   'D.Va':{range:16,shot:50,interval:.5,defense:'matrix',ult:'bomb',cost:2200},
   Reinhardt:{range:5,shot:90,interval:.9,accuracy:1,defense:'barrier',ult:'cone'},
   Ramattra:{range:25,shot:42,interval:.45,defense:'barrier',ult:'aura'},
   Zarya:{range:15,shot:38,interval:.45,accuracy:.94,defense:'bubble',ult:'gravity'},
   Orisa:{range:24,shot:33,interval:.4,defense:'guard',ult:'gravity'},
   Roadhog:{range:15,shot:120,interval:1.1,defense:'selfheal',ult:'cone'},
   Mauga:{range:20,shot:40,interval:.4,defense:'guard',ult:'cage'},
   'Wrecking Ball':{range:17,shot:30,interval:.35,speed:7,defense:'guard',ult:'mines'},
   Doomfist:{range:9,shot:55,interval:.6,speed:6.5,defense:'guard',ult:'slam'},
   Tracer:{range:14,shot:30,interval:.28,speed:6.5,ult:'sticky',cost:1700},
   Sojourn:{range:34,shot:37,interval:.35,ult:'overclock'},
   Ashe:{range:42,shot:75,interval:.85,ult:'turret'},
   Widowmaker:{range:55,shot:150,interval:1.55,accuracy:.65,ult:'reveal',cost:1500},
   Cassidy:{range:28,shot:65,interval:.65,ult:'channel'},
   Genji:{range:20,shot:60,interval:.7,speed:6.2,ult:'blade'},
   Reaper:{range:9,shot:90,interval:.65,ult:'aura'},
   Mei:{range:14,shot:42,interval:.55,ult:'freeze'},
   Hanzo:{range:40,shot:100,interval:1.05,ult:'line'},
   Echo:{range:28,shot:70,interval:.7,speed:6.5,ult:'transform'},
   Pharah:{range:32,shot:100,interval:1.1,ult:'cone'},
   Junkrat:{range:27,shot:110,interval:1.1,accuracy:.58,ult:'bomb'},
   Bastion:{range:30,shot:35,interval:.3,ult:'artillery'},
   Symmetra:{range:14,shot:50,interval:.45,accuracy:.92,ult:'wall'},
   'Soldier: 76':{range:32,shot:25,interval:.25,ult:'overclock'},
   'Torbjörn':{range:27,shot:65,interval:.8,ult:'molten'},
   Ana:{range:45,shot:70,interval:1,heal:77,healRange:42,ult:'nano',cost:2200},
   Baptiste:{range:32,shot:40,interval:.55,heal:68,healRange:30,ult:'window',cost:2350},
   Lucio:{range:25,shot:36,interval:.65,heal:17,healRange:12,speed:6.1,ult:'sound',cost:2600},
   Zenyatta:{range:40,shot:48,interval:.65,heal:30,healRange:35,ult:'transcend',cost:2300},
   Kiriko:{range:28,shot:45,interval:.75,heal:65,healRange:30,ult:'rush',cost:2250},
   Juno:{range:30,shot:35,interval:.55,heal:62,healRange:30,ult:'ray'},
   Moira:{range:20,shot:24,interval:.5,accuracy:1,heal:68,healRange:15,ult:'coalescence'},
   Mercy:{range:20,shot:30,interval:.6,heal:55,healRange:15,ult:'valkyrie'},
   Brigitte:{range:6,shot:45,interval:.7,heal:40,healRange:22,defense:'smallshield',ult:'rally'},
   Illari:{range:37,shot:85,interval:1.1,heal:65,healRange:18,ult:'sun'},
   Lifeweaver:{range:25,shot:30,interval:.6,heal:60,healRange:30,ult:'tree'}
  };
  Object.assign(c,specific[hero]||{});
  if(role==='Support'&&!['nano','window','sound','transcend','rush','ray','coalescence','valkyrie','rally','sun','tree'].includes(c.ult))c.ult='support-zone';
  return c;
 }
 function create(opts={}){const s=B.create(opts);s.worldVersion=VERSION;s.options=copy(opts);s.time=0;s.tick=0;s.eventSeq=0;s.effectSeq=0;s.events=[];s.killfeed=[];s.effects=[];s.traces=[];s.seriesSeconds=0;s.elapsed=0;s.mapResults=[];s.records=[];s.currentStats={};s.audit={};s.journal=[];s.recordJournal=!!opts.recordJournal;s.commands=[null,null];s.mapIndex=0;s.score=[0,0];s.saved=false;s.recording=[];
  s.teams.forEach((t,side)=>t.players.forEach((p,i)=>{p.side=side;p.slot=i;p.id=side+'-'+p.name.toLowerCase().replace(/[^a-z0-9]/g,'')+'-'+i;Object.assign(p,zero());p.kills=0;p.ult=0;}));
  startMap(s);return s;
 }
 function startMap(s){s.map=s.mapList[s.mapIndex%s.mapList.length];s.mode=B.maps.find(m=>m[0]===s.map)?.[1]||window.RIVALRY_OW_MAPS?.find(m=>m.name===s.map)?.mode||'Hybrid';s.elapsed=0;s.round=0;s.roundWins=[0,0];s.attackResults=[];s.currentStats={};s.status='playing';s.progress=[0,0];startRound(s);event(s,'map',{detail:s.map+' · '+s.mode+' · schematic observer.'});}
 function startRound(s){s.phase='setup';s.phaseLeft=s.round?8:12;s.roundElapsed=0;s.clock=s.mode==='Push'?600:s.mode==='Control'||s.mode==='Flashpoint'?0:240;s.overtime=false;s.otLeft=3;s.attacker=s.round%2;s.objective={x:s.mode==='Escort'||s.mode==='Hybrid'?24:60,y:36,z:0,r:5,owner:null,capture:[0,0],travel:0,checkpoints:0,robot:0,barricades:[0,0]};
  if(s.mode==='Flashpoint'){const points=[[60,36],[24,18],[94,54],[26,56],[94,18]];const xy=points[s.round%5];s.objective.x=xy[0];s.objective.y=xy[1];}
  if(s.mode==='Control'||s.mode==='Flashpoint')s.progress=[0,0];s.effects=[];s.traces=[];s.killfeed=[];s.fight={active:false,start:s.time,elims:[0,0],lastEventAt:s.time};
  all(s).forEach(p=>{resetBody(s,p);p.ult=0;p.shotAt=s.time+1;p.healAt=s.time+.5;});
  all(s).forEach(p=>{ledger(s,p);p.previous={x:p.x,y:p.y,z:p.z};p.regroupUntil=0;});
  event(s,'round_start',{detail:'Round '+(s.round+1)+' · '+(['Escort','Hybrid'].includes(s.mode)?s.teams[s.attacker].name+' attack':'capture the objective')});
 }
 function spawn(s,p){const isAttack=['Escort','Hybrid'].includes(s.mode);return {x:isAttack?(p.side===s.attacker?8:110):(p.side===0?8:112),y:32+p.slot*2,z:0};}
 function resetBody(s,p){Object.assign(p,spawn(s,p),{hp:p.maxHp,alive:true,respawn:0,ultActiveUntil:0,facing:p.side?Math.PI:0,route:[],goal:null,aiAt:0,defenseAt:0,abilityAt:0,shootAt:0,healAt:0,lastHit:-100,damagers:{},helpers:{},statuses:[],action:'Rotating',target:null,rewind:[],escapeAt:0,shieldHp:config(p.hero,p.role).defense==='barrier'?1100:700,barrierUntil:0});p.previous={x:p.x,y:p.y,z:p.z};p.facing=p.x<s.objective.x?0:Math.PI;}
 function los(s,a,b){return M.segment(M.geometry(s),a,b,true)}
 function safe(s,p){const sp=spawn(s,p);return Math.abs(p.x-sp.x)<5&&Math.abs(p.y-sp.y)<12;}
 function accumulateUlt(s,p,n){if(!p.alive||p.ult>=100||s.time<(p.ultActiveUntil||0))return;const before=p.ult;p.ult=Math.min(100,p.ult+n/config(p.hero,p.role).cost*100);if(before<100&&p.ult>=100){add(s,p,'ultimatesEarned',1);event(s,'ult_ready',{side:p.side,player:p.name,hero:p.hero,detail:p.name+' has '+B.HERO[p.hero][2]+' ready.'},false);}}
 function kill(s,source,target,kind,ability){if(!target.alive)return;target.hp=0;target.alive=false;target.respawn=10;target.action='Respawning';target.barrierUntil=0;target.ultActiveUntil=0;target.statuses=[];target.target=null;s.effects=s.effects.filter(e=>e.owner!==target.id||['projectile','nano','window','rush','sound','protect'].includes(e.type));add(s,target,'deaths',1);journal(s,'deaths',source,target,1);
  const participants=Object.entries(target.damagers).filter(([id,t])=>s.time-t<=5&&byId(s,id)?.side!==target.side).map(([id])=>byId(s,id));
  if(source&&!participants.includes(source))participants.push(source);
  for(const p of participants)if(p){add(s,p,'eliminations',1);journal(s,'eliminations',p,target,1);}
  if(source){add(s,source,'finalBlows',1);journal(s,'finalBlows',source,target,1);}
  const helpers=source?Object.entries(source.helpers).filter(([id,t])=>s.time-t<=5&&id!==source.id).map(([id])=>byId(s,id)).filter(Boolean):[];
  for(const p of helpers){add(s,p,'assists',1);journal(s,'assists',p,target,1);}
  const side=source?.side??1-target.side;
  const e=event(s,'elimination',{side,killer:source?.name||null,killerHero:source?.hero||null,victim:target.name,victimHero:target.hero,victimId:target.id,killerId:source?.id||null,headshot:kind==='headshot',environmental:kind==='environment',self:!source,ability,assist:helpers.map(p=>p.name),eliminators:participants.filter(Boolean).map(p=>p.id),assistIds:helpers.map(p=>p.id),x:target.x,y:target.y,z:target.z});
  s.killfeed.unshift({...e,expiresAt:s.time+7});s.killfeed=s.killfeed.slice(0,8);s.fight.elims[side]++;s.fight.lastEventAt=s.time;if(s.fight.elims[0]+s.fight.elims[1]===1)event(s,'first_pick',{side,detail:(source?.name||'A hazard')+' finds the opening elimination.'});if(s.fight.elims[side]===3)event(s,'highlight',{side,detail:s.teams[side].name+' take a three-elimination advantage in this fight.'});if(source&&alive(s,side).length===1)event(s,'clutch',{side,detail:source.name+' is the last player alive and keeps the fight going.'});
  if(!alive(s,target.side).length)event(s,'teamwipe',{side,detail:'TEAM WIPE · '+s.teams[side].name+' clear the objective.'});
 }
 function hit(s,a,b,raw,kind='normal',ability=null,{ignoreBarrier=false,origin=null,allowDead=false}={}){if(!a||a.side===b?.side||(!a.alive&&!allowDead)||!b?.alive||safe(s,b)||!los(s,origin||a,b))return 0;
  if(!origin&&['normal','headshot'].includes(kind)&&dist(a,b)>config(a.hero,a.role).range+.01)return 0;
  let n=Math.max(0,raw),blocked=0;
  if(!ignoreBarrier){
   // Barriers are finite planes/domes between attacker and victim, not universal armor.
   for(const t of alive(s,b.side)){if(t.barrierUntil<=s.time||t.shieldHp<=0)continue;
    const src=origin||a,near=dist(t,b),kind=config(t.hero,t.role).defense;const f={x:Math.cos(t.facing),y:Math.sin(t.facing)};const ax=(src.x-t.x)*f.x+(src.y-t.y)*f.y,bx=(b.x-t.x)*f.x+(b.y-t.y)*f.y;const at=(ax-1)/(ax-bx||1);const ix=src.x+(b.x-src.x)*at,iy=src.y+(b.y-src.y)*at;const cross=Math.abs(-(ix-t.x)*f.y+(iy-t.y)*f.x);const protectedRay=kind==='dome'?dist(src,t)>9&&near<9:ax>1&&bx<=1.2&&cross<(kind==='smallshield'?3:t.hero==='Symmetra'?22:7);
    if(near<22&&protectedRay){blocked=Math.min(n,t.shieldHp);t.shieldHp-=blocked;n-=blocked;add(s,t,'mitigated',blocked);add(s,a,'barrierDamage',blocked);journal(s,'barrier',a,t,blocked);if(blocked)beam(s,a,t,'#8cc8ff','blocked');break;}
   }
  }
  const deflect=b.statuses.find(e=>e.kind==='deflect'&&e.until>s.time);
  if(deflect&&['normal','headshot'].includes(kind)&&!['Winston','Zarya','Symmetra','Mei','Moira'].includes(a.hero)&&((a.x-b.x)*Math.cos(b.facing)+(a.y-b.y)*Math.sin(b.facing))>0){const prevent=n;n=0;add(s,b,'mitigated',prevent);journal(s,'resist',a,b,prevent);hit(s,b,a,prevent*.55,'reflect','Deflect',{origin:b});}
  const resist=b.statuses.find(e=>e.kind==='resist'&&e.until>s.time),protect=b.statuses.find(e=>e.kind==='protect'&&e.until>s.time);
  if(resist||protect){const f=protect?1:.4,prevent=n*f,owner=byId(s,(protect||resist).owner)||b;n-=prevent;add(s,owner,'mitigated',prevent);journal(s,'resist',a,owner,prevent);}
  const actual=Math.min(b.hp,n);if(actual<=0)return 0;
  b.hp-=actual;b.lastHit=s.time;b.damagers[a.id]=s.time;add(s,a,'damage',actual);add(s,b,'damageTaken',actual);accumulateUlt(s,a,actual);accumulateUlt(s,b,actual*.12);journal(s,'damage',a,b,actual);beam(s,a,b,null);
  if(b.hp<=1e-7)kill(s,a,b,kind,ability);return actual;
 }
 function crossesWindow(e,a,b){const ca=Math.cos(e.facing),sa=Math.sin(e.facing),ax=(a.x-e.x)*ca+(a.y-e.y)*sa,bx=(b.x-e.x)*ca+(b.y-e.y)*sa;if(ax>1||bx<=1)return false;const t=(1-ax)/(bx-ax),x=a.x+(b.x-a.x)*t-e.x,y=a.y+(b.y-a.y)*t-e.y;return Math.abs(-x*sa+y*ca)<=5;}
 function inRush(e,p){const x=(p.x-e.x)*Math.cos(e.facing)+(p.y-e.y)*Math.sin(e.facing),y=-(p.x-e.x)*Math.sin(e.facing)+(p.y-e.y)*Math.cos(e.facing);return e.type==='rush'&&e.side===p.side&&x>=0&&x<=e.length&&Math.abs(y)<=3;}
 function heal(s,p,t,raw,reason='healing'){if(!p.alive||!t.alive||p.side!==t.side||(reason!=='ultimate'&&dist(p,t)>config(p.hero,p.role).healRange)||!los(s,p,t)||t.statuses.some(e=>e.kind==='anti'&&e.until>s.time))return 0;const amp=s.effects.some(e=>e.type==='window'&&e.side===p.side&&crossesWindow(e,p,t));const amount=Math.min(t.maxHp-t.hp,Math.max(0,raw)*(amp?1.5:1));if(amount<=0)return 0;
  t.hp+=amount;add(s,p,'healing',amount);accumulateUlt(s,p,amount*.85);t.helpers[p.id]=s.time;journal(s,'healing',p,t,amount);beam(s,p,t,'#87f7cd','heal');return amount;
 }
 function status(p,kind,until,owner){p.statuses.push({kind,until,owner});}
 function effect(s,p,type,options={}){const e={id:++s.effectSeq,side:p.side,owner:p.id,hero:p.hero,x:p.x,y:p.y,z:p.z,facing:p.facing,start:s.time,until:s.time+6,type,name:B.HERO[p.hero]?.[2]||'Ultimate',...options};s.effects.push(e);if(!options.name)p.ultActiveUntil=e.until;return e;}
 function ultimate(s,p){if(p.ult<100||!p.alive||p.statuses.some(x=>x.kind==='stun'))return;
  const cfg=config(p.hero,p.role),enemies=alive(s,1-p.side).filter(e=>dist(p,e)<cfg.range+8&&los(s,p,e)),friends=alive(s,p.side),hurt=friends.filter(a=>a.hp<a.maxHp*.6),hostile=s.effects.some(e=>e.side!==p.side&&dist(p,e)<14);
  const defense=['sound','transcend','rally','tree','support-zone','valkyrie'].includes(cfg.ult);
  const can=defense?(hurt.length>=2||hostile&&hurt.length>0):(enemies.length>=2&&friends.length>=3||s.overtime&&enemies.length>0);
  if(!can)return;p.ult=0;add(s,p,'ultimatesUsed',1);p.ultActiveUntil=s.time+6;
  const partner=s.effects.find(e=>e.side===p.side&&e.owner!==p.id&&e.until>s.time&&e.name===B.HERO[e.hero]?.[2]);if(partner)event(s,'combo',{side:p.side,detail:partner.name+' + '+B.HERO[p.hero][2]+' · '+s.teams[p.side].name+' commit overlapping ultimates.'});
  event(s,'ultimate',{side:p.side,player:p.name,hero:p.hero,ability:B.HERO[p.hero][2],playerId:p.id,x:p.x,y:p.y,z:p.z,effect:cfg.ult});
  const target=enemies.sort((a,b)=>dist(a,p)-dist(b,p))[0]||s.objective;
  if(['nano','rush','window','overclock','blade','transform','reveal','valkyrie','rally'].includes(cfg.ult)){
   const chosen=cfg.ult==='nano'?(friends.filter(x=>x.role==='Damage').sort((a,b)=>dist(a,target)-dist(b,target))[0]||p):p;
   effect(s,p,cfg.ult,{x:chosen.x,y:chosen.y,target:chosen.id,until:s.time+8,r:cfg.ult==='rush'?17:8,length:28});
   if(['nano','overclock','blade','transform'].includes(cfg.ult))status(chosen,'boost',s.time+8,p.id);
   if(cfg.ult==='nano')status(chosen,'resist',s.time+8,p.id);
   return;
  }
  if(['bomb','sticky','artillery','slam','sun'].includes(cfg.ult)){effect(s,p,'projectile',{x:target.x,y:target.y,z:target.z,from:{x:p.x,y:p.y},r:cfg.ult==='sticky'?5:12,detonate:s.time+2,until:s.time+3,damage:cfg.ult==='sticky'?260:340,subtype:cfg.ult});return;}
  if(['line','cone','coalescence'].includes(cfg.ult)){effect(s,p,cfg.ult,{r:6,length:42,until:s.time+6});return;}
  if(['sound','transcend','ray','tree','support-zone'].includes(cfg.ult)){effect(s,p,cfg.ult,{r:cfg.ult==='ray'?12:16,until:s.time+(cfg.ult==='sound'?5:8)});if(cfg.ult==='sound')for(const a of friends.filter(a=>dist(a,p)<16&&los(s,p,a)))status(a,'resist',s.time+5,p.id);return;}
  if(cfg.ult==='wall'){effect(s,p,'wall',{r:22,until:s.time+10});p.shieldHp=3000;p.barrierUntil=s.time+10;return;}
  effect(s,p,cfg.ult,{x:target.x,y:target.y,z:target.z,r:['gravity','freeze','lift'].includes(cfg.ult)?10:12,until:s.time+6});
 }
 function effectsTick(s){for(const e of s.effects){const p=byId(s,e.owner);if(!p)continue;const cfg=config(p.hero,p.role);
  if(e.type==='projectile'&&s.time>=e.detonate&&!e.exploded){e.exploded=true;for(const t of alive(s,1-e.side))if(dist(e,t)<e.r)hit(s,p,t,e.damage,'ultimate',e.name,{origin:e,allowDead:true});event(s,'impact',{side:e.side,detail:e.name+' detonates at the objective.'},false);}
  if(['transcend','ray','tree','support-zone','coalescence','valkyrie'].includes(e.type)&&p.alive){if(['transcend','valkyrie','coalescence'].includes(e.type)){e.x=p.x;e.y=p.y;}for(const a of alive(s,e.side))if(dist(e,a)<(e.r||18))heal(s,p,a,(e.type==='transcend'?160:60)*DT,'ultimate');}
  if(['gravity','freeze','lift','aura','molten','mines','cage'].includes(e.type)){for(const t of alive(s,1-e.side))if(dist(e,t)<e.r&&los(s,e,t)){status(t,['freeze','lift'].includes(e.type)?'stun':'slow',s.time+.3,p.id);hit(s,p,t,(e.type==='aura'?50:25)*DT,'ultimate',e.name);}}
  if(['line','cone','coalescence'].includes(e.type)&&p.alive){for(const t of alive(s,1-e.side)){const dx=t.x-e.x,dy=t.y-e.y,forward=dx*Math.cos(e.facing)+dy*Math.sin(e.facing),cross=Math.abs(-dx*Math.sin(e.facing)+dy*Math.cos(e.facing));if(forward>=0&&forward<e.length&&cross<(e.type==='cone'?forward*.4:5))hit(s,p,t,65*DT,'ultimate',e.name);}}
  if(e.type==='turret'&&p.alive){const t=alive(s,1-e.side).find(t=>dist(t,e)<30&&los(s,e,t));if(t&&s.tick%5===0)hit(s,p,t,65,'ultimate',e.name);}
 }
 s.effects=s.effects.filter(e=>e.until>s.time);}
 function tactical(s,p){const cfg=config(p.hero,p.role),g=M.geometry(s),obj=s.objective,dir=['Escort','Hybrid'].includes(s.mode)?(p.side===s.attacker?1:-1):(p.side===0?1:-1);
  const allies=alive(s,p.side),opponents=alive(s,1-p.side),understrength=allies.length<=s.teams[p.side].players.length-2,low=p.hp/p.maxHp<(p.role==='Tank'?.48:.46);
  const rally={x:clamp(obj.x-dir*27,14,106),y:obj.y+(p.slot%2?6:-6)};
  if(understrength)p.regroupUntil=s.time+5;
  if(low||understrength||s.time<(p.regroupUntil||0)){p.action=low?'Retreat / seek healing':'Regroup';const goal=M.nearest(g,rally);if(!p.goal||dist(goal,p.goal)>3){p.goal=goal;p.route=null;}return;}
  const tank=allies.find(a=>a.role==='Tank'),shouldTouch=!allies.some(a=>dist(a,obj)<obj.r+1)&&p.role==='Tank';
  let desired={x:obj.x-dir*(p.role==='Support'?15:p.role==='Damage'?Math.min(10,cfg.range*.3):0),y:obj.y+(p.role==='Damage'?(p.slot%2?Math.min(10,cfg.range*.35):-Math.min(10,cfg.range*.35)):p.role==='Support'?(p.slot%2?4:-4):0)};
  if(p.role==='Support'&&tank)desired={x:tank.x-dir*9,y:tank.y+(p.slot%2?4:-4)};
  const targets=opponents.filter(e=>!safe(s,e)&&los(s,p,e)).sort((a,b)=>dist(p,a)-dist(p,b));const nearest=targets[0];
  if(nearest){const d=dist(p,nearest);if(d<cfg.range*.5&&p.role==='Damage'){desired={x:p.x-dir*3,y:p.y+(p.slot%2?2:-2)}}else if(d>cfg.range*.8&&p.role!=='Support'&&!shouldTouch){desired={x:nearest.x-dir*Math.min(8,cfg.range*.55),y:nearest.y+(p.slot%2?2:-2)}}}
  if((s.commands[p.side]==='dive'||s.commands[p.side]!== 'hold'&&['Tracer','Genji','Echo','Reaper'].includes(p.hero)&&allies.length>=opponents.length)&&p.role==='Damage'){const sup=opponents.find(e=>e.role==='Support');if(sup)desired={x:sup.x-dir*8,y:sup.y+(p.slot%2?5:-5)};}
  if(shouldTouch||s.overtime&&p.role!=='Support')desired={x:obj.x+(p.slot%2?1:-1),y:obj.y+(p.slot%3-1)*1.6};
  if(p.role==='Damage'&&cfg.range>=35&&!s.overtime&&Math.abs(obj.x-60)<22){const ledge=g.platforms[p.side];const pos={x:ledge.x+ledge.w/2,y:ledge.y+ledge.h/2,z:ledge.z};if(opponents.some(e=>dist(pos,e)<cfg.range&&los(s,pos,e)))desired=pos;}
  // Once the frontline is established, prefer ground that preserves heal sightlines.
  p.action=p.role==='Support'?'Support frontline':p.role==='Tank'?'Contest space':'Pressure / off-angle';
  const goal=M.nearest(g,desired);if(!p.goal||dist(p.goal,goal)>4){p.goal=goal;p.route=null;}
 }
 function combat(s,p){const cfg=config(p.hero,p.role);if(p.statuses.some(e=>e.kind==='stun')){p.action='Stunned';return;}
  const enemies=alive(s,1-p.side).filter(t=>!safe(s,t)&&dist(p,t)<=cfg.range&&los(s,p,t));
  const allies=alive(s,p.side),hurt=allies.filter(t=>t.hp<t.maxHp-15&&dist(t,p)<cfg.healRange&&los(s,p,t)).sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp));
  if(enemies.length&&p.hp/p.maxHp<.55&&s.time>=p.escapeAt){
   const from={x:p.x,y:p.y},dir=['Escort','Hybrid'].includes(s.mode)?(p.side===s.attacker?1:-1):(p.side===0?1:-1),retreat=M.nearest(M.geometry(s),{x:p.x-dir*12,y:p.y+(p.slot%2?5:-5)});
   if(p.hero==='Tracer'){p.escapeAt=s.time+13;const old=p.rewind[0];if(old){const restored=Math.max(0,Math.min(p.maxHp,old.hp)-p.hp);p.hp+=restored;journal(s,'restoration',p,p,restored);}status(p,'protect',s.time+.8,p.id);M.move(M.geometry(s),p,retreat,9);effect(s,p,'recall',{name:'Recall · rewind',from,path:p.lastMove,r:2,until:s.time+1});event(s,'ability',{side:p.side,player:p.name,ability:'Recall',detail:p.name+' uses Recall to escape pressure.'},false);p.action='Recall / evade';return;}
   else if(p.hero==='Genji'){p.escapeAt=s.time+8;status(p,'deflect',s.time+1.8,p.id);effect(s,p,'deflect',{name:'Deflect',r:3,until:s.time+1.8});event(s,'defense',{side:p.side,player:p.name,detail:p.name+' deflects incoming projectiles.'},false);}
   else if(p.hero==='Reaper'){p.escapeAt=s.time+10;status(p,'protect',s.time+2,p.id);status(p,'wraith',s.time+2,p.id);effect(s,p,'wraith',{name:'Wraith Form',r:2,until:s.time+2});}
   else if(['Sojourn','Ashe','Widowmaker','Symmetra'].includes(p.hero)){p.escapeAt=s.time+11;M.move(M.geometry(s),p,retreat,8);effect(s,p,'dash',{name:B.HERO[p.hero]?.[3]||'Escape',from,path:p.lastMove,r:2,until:s.time+.7});p.action='Disengaging with '+(B.HERO[p.hero]?.[3]||'mobility');return;}
  }
  if(p.statuses.some(e=>e.kind==='wraith'||e.kind==='deflect')){p.action=p.hero==='Genji'?'Deflecting projectiles':'Wraith / retreat';return;}
  if(s.time>=p.abilityAt&&['Kiriko','Baptiste'].includes(p.hero)&&hurt.some(t=>t.hp/t.maxHp<.40)){p.abilityAt=s.time+17;for(const t of hurt.filter(t=>dist(t,hurt[0])<6)){status(t,'protect',s.time+1.4,p.id);t.statuses=t.statuses.filter(x=>x.kind!=='anti');}effect(s,p,'protect',{name:p.hero==='Kiriko'?'Protection Suzu':'Immortality Field',x:hurt[0].x,y:hurt[0].y,r:6,until:s.time+1.4});}
  if(cfg.heal&&s.time>=p.healAt&&hurt.length){
   const passive=['Lucio','Zenyatta'].includes(p.hero);const critical=hurt[0].hp/hurt[0].maxHp<.94;
   if(passive||critical||!enemies.length){p.healAt=s.time+.6;const patients=p.hero==='Lucio'?hurt:hurt.slice(0,1);for(const t of patients)heal(s,p,t,cfg.heal*.6);p.action='Healing '+hurt[0].name;p.target=hurt[0].id;if(!passive)p.shootAt=Math.max(p.shootAt,s.time+.45);}
  }
  if(p.role==='Tank'||cfg.defense){if(enemies.length&&p.shieldHp>50&&s.time>=p.defenseAt&&p.hp<p.maxHp*.85){p.defenseAt=s.time+9;
   if(['barrier','dome','smallshield','matrix'].includes(cfg.defense)){p.barrierUntil=s.time+3.5;effect(s,p,cfg.defense,{name:cfg.defense==='matrix'?'Defense Matrix':'Barrier',r:9,until:s.time+3.5});event(s,'defense',{side:p.side,player:p.name,detail:p.name+' deploys '+cfg.defense+'.'},false);}
   else if(cfg.defense==='selfheal'){heal(s,p,p,180);}else{status(p,'resist',s.time+3,p.id);effect(s,p,'protect',{name:'Defensive cooldown',r:3,until:s.time+3});}
  }}
  if(!enemies.length)return;
  ultimate(s,p);
  if(s.time>=p.abilityAt){if(p.hero==='Ana'&&enemies.length>=2){p.abilityAt=s.time+13;const t=enemies[0];status(t,'anti',s.time+3,p.id);hit(s,p,t,45,'ability','Biotic Grenade');effect(s,p,'anti',{name:'Biotic Grenade',x:t.x,y:t.y,r:4,until:s.time+3});}
   else if(['Kiriko','Baptiste'].includes(p.hero)&&hurt.some(t=>t.hp/t.maxHp<.35)){p.abilityAt=s.time+17;for(const t of hurt.filter(t=>dist(t,hurt[0])<6)){status(t,'protect',s.time+1.4,p.id);t.statuses=t.statuses.filter(x=>x.kind!=='anti');}effect(s,p,'protect',{name:p.hero==='Kiriko'?'Protection Suzu':'Immortality Field',x:hurt[0].x,y:hurt[0].y,r:6,until:s.time+1.4});}
  }
  if(s.time<p.shootAt)return;p.shootAt=s.time+cfg.interval/(s.effects.some(e=>inRush(e,p))?1.3:1);
  const ranked=enemies.map(t=>({t,rank:(1-t.hp/t.maxHp)*1.1+(t.role==='Tank'?.15:0)+(['Tracer','Genji','Echo','Reaper'].includes(p.hero)&&t.role==='Support'?.7:0)-dist(p,t)/65+rng(s)*.2})).sort((a,b)=>b.rank-a.rank);
  const locked=enemies.find(t=>t.id===p.combatTarget);const t=locked&&s.time<(p.lockUntil||0)?locked:ranked[0].t;
  if(!locked||s.time>=(p.lockUntil||0)){p.combatTarget=t.id;p.lockUntil=s.time+2.4;}
  p.facing=Math.atan2(t.y-p.y,t.x-p.x);p.target=t.id;p.action='Attacking '+t.name;
  const skill=clamp(p.skill||.9,.65,1.3),accuracy=clamp(cfg.accuracy*skill+(p.z>t.z? .08:0),.35,.95);
  if(rng(s)>accuracy){beam(s,p,t,null,'miss');return;}
  const crit=p.role==='Damage'&&!['Mei','Reaper','Genji','Symmetra'].includes(p.hero)&&rng(s)<.12;
  const boosted=p.statuses.some(e=>e.kind==='boost')||s.effects.some(e=>e.side===p.side&&e.type==='window'&&crossesWindow(e,p,t));
  const strength=s.options.strength?.[p.side]||1;
  const falloff=cfg.range>15?clamp(1-(dist(p,t)-cfg.range*.65)/cfg.range*.6,.7,1):1;
  hit(s,p,t,cfg.shot*(crit?1.6:1)*(boosted?1.35:1)*falloff*strength,crit?'headshot':'normal');
  s.fight.lastEventAt=s.time;
  if(!s.fight.active){s.fight={active:true,start:s.time,elims:[0,0],lastEventAt:s.time};event(s,'engage',{detail:'Teamfight begins at '+s.map+' · '+(s.objective.owner===null?'neutral objective':'point contest')+'.'});}
 }
 function endMap(s,winner,reason){if(s.status!=='playing')return;s.records.push({index:s.mapIndex,name:s.map,mode:s.mode,seconds:s.elapsed,rounds:s.round+1,players:copy(s.currentStats),roundWins:copy(s.roundWins),attacks:copy(s.attackResults)});s.currentStats={};if(winner!==null)s.score[winner]++;s.lastWinner=winner;
  s.mapResults.push({map:s.map,winner:winner===null?'Draw':s.teams[winner].name,side:winner,score:[...s.progress],reason,elapsed:s.elapsed,rounds:s.round+1});
  event(s,'map_end',{side:winner,detail:(winner===null?'Draw':s.teams[winner].name+' win')+' · '+s.map+' · '+reason+'.'});
  if(winner!==null&&s.score[winner]>=Math.ceil(s.best/2)){s.status='finished';s.phase='finished';event(s,'series_end',{side:winner,detail:s.teams[winner].name+' win '+s.score.join('–')+'.'});}
  else{s.status='between';s.phase='mapbreak';s.phaseLeft=10;}
 }
 function endRound(s,winner){if(['Control','Flashpoint'].includes(s.mode)){s.roundWins[winner]++;event(s,'round_end',{side:winner,detail:s.teams[winner].name+' take the point · '+s.roundWins.join('–')+'.'});if(s.roundWins[winner]>=(s.mode==='Flashpoint'?3:2)){endMap(s,winner,'point wins');return;}
   if(s.mode==='Flashpoint'){s.round++;const xy=[[60,36],[24,18],[94,54],[26,56],[94,18]][s.round%5];s.objective={x:xy[0],y:xy[1],z:0,r:5,owner:null,capture:[0,0]};s.progress=[0,0];s.overtime=false;s.roundElapsed=0;s.pointUnlockAt=s.time+15;event(s,'point_rotation',{detail:'Next Flashpoint opens in 15 seconds. Teams rotate with their current health and ultimate resources.'});return;}
  }
  else if(['Escort','Hybrid'].includes(s.mode)){const progress=s.progress[s.attacker];s.attackResults.push({side:s.attacker,distance:progress,time:s.roundElapsed,bank:s.clock});event(s,'round_end',{side:s.attacker,detail:(winner===s.attacker?s.teams[s.attacker].name+' complete the attack at ':s.teams[1-s.attacker].name+' hold the attack at ')+progress.toFixed(1)+'%.'});if(s.round===1){const [a,b]=s.attackResults;const winner=Math.abs(a.distance-b.distance)>.1?(a.distance>b.distance?a.side:b.side):Math.abs(a.time-b.time)>.2?(a.time<b.time?a.side:b.side):null;endMap(s,winner,'two attacks; equal full clears use faster completion (model rule)');return;}}
  s.phase='roundbreak';s.phaseLeft=8;s.round++;
 }
 function objectiveTick(s){const o=s.objective;if(s.mode==='Flashpoint'&&s.time<(s.pointUnlockAt||0))return;const touching=[0,1].map(side=>alive(s,side).filter(p=>dist(p,o)<=o.r&&Math.abs(p.z-o.z)<2));s.contest=touching.every(a=>a.length>0);for(const group of touching)for(const p of group)add(s,p,'objectiveTime',DT);
  const control=['Control','Flashpoint'].includes(s.mode);
  if(control){const side=!s.contest?touching[0].length?0:touching[1].length?1:null:null;
   if(side!==null&&o.owner!==side){o.capture[side]+=DT;o.capture[1-side]=0;if(o.capture[side]>=4){o.owner=side;o.capture=[0,0];event(s,'capture',{side,detail:s.teams[side].name+' capture the point.'});}}
   if(o.owner!==null){s.progress[o.owner]=Math.min(100,s.progress[o.owner]+DT*(s.mode==='Flashpoint'?1.3:1/1.1));if(s.progress[o.owner]>=100){if(touching[1-o.owner].length){if(!s.overtime)event(s,'overtime',{detail:'OVERTIME · opponents still on the point.'});s.overtime=true;s.otLeft=3;}else if(s.overtime){s.otLeft-=DT;if(s.otLeft<=0)endRound(s,o.owner);}else endRound(s,o.owner);}}
  }else if(s.mode==='Push'){
   const owner=!s.contest?touching[0].length?0:touching[1].length?1:null:null;
   if(owner!==null){const sign=owner===0?1:-1;const returning=(owner===0?o.robot<o.barricades[0]:o.robot>-o.barricades[1]);o.robot=clamp(o.robot+sign*DT*(returning?2.2:.48),-42,42);o.barricades[owner]=Math.max(o.barricades[owner],owner===0?o.robot:-o.robot);o.x=60+o.robot;s.progress= o.barricades.map(n=>n/42*100);o.owner=owner;if(s.progress[owner]>=100)endMap(s,owner,'push completion');}
   s.clock=Math.max(0,s.clock-DT);if(!s.clock){const lead=s.progress[0]>=s.progress[1]?0:1;const trailing=1-lead;if(touching[trailing].length){s.overtime=true;s.otLeft=3;}else if((s.otLeft-=DT)<=0)endMap(s,s.progress[0]===s.progress[1]?null:lead,'push distance');}
  }else{
   const a=s.attacker,b=1-a;const can=touching[a].length&&!touching[b].length;
   if(can){const speed=(s.mode==='Hybrid'&&s.progress[a]<25)?DT*1.4:DT*.35*(1+Math.min(2,touching[a].length-1)*.14);s.progress[a]=Math.min(100,s.progress[a]+speed);if(s.mode==='Hybrid'&&s.progress[a]<25)o.x=24;else o.x=24+(s.progress[a]-(s.mode==='Hybrid'?25:0))/(s.mode==='Hybrid'?75:100)*78;
    const reached=Math.floor(s.progress[a]/(100/3));if(reached>o.checkpoints&&reached<3){o.checkpoints=reached;s.clock+=90;event(s,'checkpoint',{side:a,detail:'Checkpoint secured · +90 seconds.'});}
   }
   s.clock=Math.max(0,s.clock-DT);
   if(s.round===1&&s.progress[a]>s.attackResults[0].distance+.1){endRound(s,a);return;}
   if(s.progress[a]>=100){endRound(s,a);return;}
   if(s.clock===0){if(touching[a].length){if(!s.overtime)event(s,'overtime',{detail:'OVERTIME · attackers remain on the objective.'});s.overtime=true;s.otLeft=3;}else if((s.otLeft-=DT)<=0)endRound(s,b);}
  }
  if(s.roundElapsed>1200&&s.status==='playing'){event(s,'model_limit',{detail:'20-minute round safety limit reached; recorded as a model draw, not a fabricated win.'});endMap(s,null,'model safety draw');}
 }
 function step(s,choice){if(!s||s.worldVersion!==VERSION||s.status==='finished')return s;if(choice)s.commands[0]=choice;s.tick++;s.time=s.tick*DT;
  if(s.status==='between'){s.phaseLeft-=DT;if(s.phaseLeft<=0)nextMap(s);return s;}
  if(s.phase==='roundbreak'){s.phaseLeft-=DT;if(s.phaseLeft<=0)startRound(s);return s;}
  if(s.phase==='setup'){s.phaseLeft-=DT;if(s.phaseLeft<=0){s.phase='active';event(s,'live',{detail:'Gates open · round '+(s.round+1)+'.'});}else return s;}
  s.elapsed+=DT;s.roundElapsed+=DT;s.seriesSeconds+=DT;const g=M.geometry(s);
  s.traces=s.traces.filter(e=>e.until>s.time);s.killfeed=s.killfeed.filter(e=>e.expiresAt>s.time);
  for(const p of all(s)){p.previous={x:p.x,y:p.y,z:p.z};add(s,p,'timePlayed',DT);p.statuses=p.statuses.filter(e=>e.until>s.time);
   if(!p.alive){p.respawn=Math.max(0,p.respawn-DT);if(p.respawn<=0){resetBody(s,p);event(s,'respawn',{side:p.side,player:p.name,hero:p.hero},false);}continue;}
   add(s,p,'timeAlive',DT);p.rewind.push({t:s.time,x:p.x,y:p.y,hp:p.hp});if(p.rewind.length>15)p.rewind.shift();accumulateUlt(s,p,DT*2.4);
   if(s.time-p.lastHit>5&&p.hp<p.maxHp){const amount=Math.min(p.maxHp-p.hp,DT*(p.role==='Support'?12:6));p.hp+=amount;journal(s,'regeneration',null,p,amount);}
   if(s.time-p.lastHit>3)p.shieldHp=Math.min(1100,p.shieldHp+DT*100);
   if(s.time>=p.aiAt){p.aiAt=s.time+1;tactical(s,p);}
   if(p.goal&&!p.statuses.some(x=>x.kind==='stun'))M.move(g,p,p.goal,config(p.hero,p.role).speed*DT*(p.statuses.some(x=>x.kind==='slow')?.35:1)*(s.effects.some(e=>inRush(e,p))?1.3:1));
  }
  const order=s.tick%2?[0,1]:[1,0];for(const side of order)for(const p of alive(s,side))combat(s,p);
  effectsTick(s);objectiveTick(s);
  if(s.fight.active&&s.time-s.fight.lastEventAt>8){s.fight.active=false;event(s,'reset',{detail:'Disengage · teams regroup and rotate.'},false);}
  if(s.tick%25===0&&s.options.recordPositions)s.recording.push({t:s.time,map:s.mapIndex,round:s.round,players:all(s).map(p=>[p.id,p.x,p.y,p.z,p.hp,p.ult,p.alive])});
  return s;
 }
 function nextMap(s){if(s.status!=='between')return s;s.mapIndex++;if(s.mapIndex>s.best+5){s.status='finished';s.phase='finished';event(s,'series_end',{side:null,detail:'Series ended at the draw safety limit.'});return s;}startMap(s);return s;}
 function statistics(s,scope='series',rates=false){const source=scope==='series'?[...s.records.map(m=>m.players),s.currentStats]:scope==='current'?[s.currentStats]:[s.records[Number(scope)]?.players||{}];const rows={};
  for(const ledger of source)for(const [k,r] of Object.entries(ledger)){const row=rows[k]||(rows[k]={...r,stats:zero(),heroes:{}});for(const name of STAT)row.stats[name]+=r.stats[name]||0;for(const [hero,hs] of Object.entries(r.heroes)){const dest=row.heroes[hero]||(row.heroes[hero]=zero());for(const name of STAT)dest[name]+=hs[name]||0;}}
  return Object.values(rows).map(r=>({...r,seconds:r.stats.timePlayed,stats:Object.fromEntries(STAT.map(k=>[k,rates&&!['timePlayed','timeAlive'].includes(k)?r.stats.timePlayed>0?r.stats[k]*600/r.stats.timePlayed:0:r.stats[k]]))}));
 }
 function heroSwap(s,side,index,hero){
  const team=s.teams[side],p=team?.players[index],cat=window.RIVALRY_HERO_CATALOG;
  if(!p||!B.HERO[hero]||(cat?(!cat.legal(hero,team.season)||cat.roleAt(hero,team.season)!==p.role):B.HERO[hero][0]!==p.role)||team.players.some((t,i)=>i!==index&&t.hero===hero))return false;
  if(s.phase==='active'&&p.alive&&!safe(s,p))return false;
  const oldHero=p.hero,ratio=p.hp/p.maxHp;p.hero=hero;p.maxHp=B.HERO[hero][1];p.hp=p.alive?Math.min(p.maxHp,p.maxHp*ratio):0;p.ult=Math.min(15,p.ult);p.shieldHp=700;p.barrierUntil=0;p.abilityAt=0;
  p.heroPreference={basis:'manual',label:'Manual selection',preferred:hero,alternatives:[],sources:[]};
  event(s,'swap',{side,player:p.name,hero,detail:p.name+' changes '+oldHero+' to '+hero+' at spawn.'});return true;
 }
 function substitute(s,side,index,raw){
  const team=s.teams[side],old=team?.players[index],snapshot=window.RIVALRY_ROSTER_FOR?.(team?.name,team?.season);
  if(!old||!raw||s.phase==='active'||raw.role!==old.role||!snapshot?.players.some(p=>p.name===raw.name&&p.role===raw.role)||team.players.some((p,i)=>i!==index&&p.name===raw.name))return false;
  const totals=statistics(s).find(r=>r.id===key({...old,name:raw.name})),prefs=window.RIVALRY_LINEUPS.preferences(raw,team.name,team.season),used=new Set(team.players.filter((_,i)=>i!==index).map(p=>p.hero));
  const hero=prefs.ranked.find(h=>!used.has(h))||old.hero;
  let hash=2166136261;for(const ch of team.name+team.season+raw.name){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}
  const p={...old,name:raw.name,sourceName:raw.name,verified:true,country:raw.country,hero,maxHp:B.HERO[hero][1],id:side+'-'+raw.name.toLowerCase().replace(/[^a-z0-9]/g,'')+'-'+index,skill:.77+((hash>>>0)%250)/1000,ult:0};
  Object.assign(p,totals?.stats||zero());p.kills=p.finalBlows;p.heroPreference={basis:prefs.basis,label:prefs.label,preferred:prefs.ranked[0],alternatives:prefs.ranked.slice(0,5),sources:prefs.measured[0]?.sources||[]};
  team.players[index]=p;resetBody(s,p);p.previous={x:p.x,y:p.y,z:p.z};ledger(s,p);event(s,'sub',{side,player:p.name,detail:p.name+' replaces '+old.name+' between rounds; prior statistics retained.'});return true;
 }
 function autoHeroes(s,side){if(s.phase==='active')return false;const before=s.teams[side].players.map(p=>({hp:p.hp,maxHp:p.maxHp,ult:p.ult,hero:p.hero}));const ok=B.autoHeroes(s,side);s.teams[side].players.forEach((p,i)=>{p.hp=Math.min(p.maxHp,before[i].hp);p.ult=Math.min(15,before[i].ult);if(p.hero!==before[i].hero)event(s,'swap',{side,player:p.name,hero:p.hero,detail:p.name+' selects '+p.hero+' from their suggested pool.'});});return ok;}
 function run(s,maxSteps=250000){let n=0;while(s.status!=='finished'&&n++<maxSteps)step(s);if(s.status!=='finished')throw Error('Simulation safety limit');return s;}
 window.RIVALRY_ENGINE=Object.freeze({...B,VERSION,DT,config,create,step,nextMap,heroSwap,substitute,autoHeroes,statistics,run,STAT,los,hit,heal,geometry:M.geometry});
})();
