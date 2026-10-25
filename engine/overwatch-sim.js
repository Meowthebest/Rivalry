/* Rivalry Overwatch spectator match simulation.
   Fictional game engine; deterministic seeded randomness + state-driven combat, NEVER live game data.
   Built around health, healing, assists, death/respawn, cooldowns, ultimates and map objectives.
*/
(()=>{
'use strict';
const HERO={
 Sigma:['Tank',650,'Gravitic Flux','Accretion',0.95],Winston:['Tank',650,'Primal Rage','Jump Pack',1.12],
 'D.Va':['Tank',700,'Self-Destruct','Micro Missiles',1.04],Reinhardt:['Tank',650,'Earthshatter','Fire Strike',1.16],
 Ramattra:['Tank',650,'Annihilation','Ravenous Vortex',1.12],Orisa:['Tank',650,'Terra Surge','Javelin',1.02],
 Zarya:['Tank',550,'Graviton Surge','Particle Cannon',1.05],
 Sojourn:['Damage',250,'Overclock','Railgun',1.22],Tracer:['Damage',175,'Pulse Bomb','Blink',1.35],
 Genji:['Damage',250,'Dragonblade','Swift Strike',1.19],Ashe:['Damage',250,'B.O.B.','Coach Gun',1.08],
 Hanzo:['Damage',250,'Dragonstrike','Storm Arrows',1.10],Mei:['Damage',300,'Blizzard','Ice Wall',.92],
 Cassidy:['Damage',275,'Deadeye','Magnetic Grenade',1.02],Reaper:['Damage',300,'Death Blossom','Wraith Form',1.15],
 Sombra:['Damage',250,'EMP','Hack',.86],Echo:['Damage',250,'Duplicate','Sticky Bombs',1.13],
 Widowmaker:['Damage',200,'Infra-Sight','Venom Mine',1.28],
 Baptiste:['Support',250,'Amplification Matrix','Immortality Field',.72],
 Ana:['Support',250,'Nano Boost','Biotic Grenade',.69],
 Kiriko:['Support',225,'Kitsune Rush','Protection Suzu',.81],
 Lucio:['Support',225,'Sound Barrier','Amp It Up',.71],
 Juno:['Support',225,'Orbital Ray','Pulsar Torpedoes',.80],
 Zenyatta:['Support',250,'Transcendence','Discord Orb',.89],
 Brigitte:['Support',250,'Rally','Repair Pack',.71],
 Mercy:['Support',225,'Valkyrie','Resurrect',.51]
};
const maps=[
 ['King’s Row','Hybrid','London'],['Busan','Control','Korea'],['Circuit Royal','Escort','Monaco'],
 ['Lijiang Tower','Control','China'],['Route 66','Escort','United States'],
 ['Eichenwalde','Hybrid','Germany'],['Ilios','Control','Greece'],
 ['Esperança','Push','Portugal'],['New Queen Street','Push','Canada'],
 ['Oasis','Control','Iraq'],['Havana','Escort','Cuba'],
 ['Suravasa','Flashpoint','India'],['Colosseo','Push','Italy'],
 ['Midtown','Hybrid','New York'],['Nepal','Control','Nepal']
];
const roleOrder={Tank:0,Damage:1,Support:2};
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function createRandom(seed){let state=(seed||1)>>>0;const next=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296};return{next,read:()=>state>>>0}}
function makeLineup(name,year,classic,picks,seed){
 const db=(window.RIVALRY_VERIFIED_ROSTERS||[]).find(x=>x.name.toLowerCase()===name.toLowerCase());
 let pool=db?db.players:[];
 const old=(window.RIVALRY_OWCS||[]).find(x=>x.name===name);
 const required=classic?['Tank','Tank','Damage','Damage','Support','Support']:['Tank','Damage','Damage','Support','Support'];
 const used=new Set();let known=0;
 return required.map((role,index)=>{
  const candidates=pool.filter(p=>p.role===role&&!used.has(p.name));
  let raw=candidates[0]||null;
  if(raw){used.add(raw.name);known++}
  const key=raw?raw.name:'Open '+role+' slot '+(index+1);
  const preset=role==='Tank'?(classic?['Winston','D.Va']:['Sigma','Winston']):
               role==='Damage'?['Sojourn','Tracer','Genji','Hanzo']:
               ['Ana','Lucio','Juno','Baptiste'];
  const heroName=picks?.[index]||raw?.heroes?.[0]||preset[(seed+index)%preset.length];
  const hero=HERO[heroName]||HERO[preset[0]];
  const skill=clamp(.77+(hash(name+'/'+year+'/'+key)%250)/1000,.70,1.05);
  return {id:role+'-'+index+'-'+(hash(name+key)%100000),name:raw?.name||('OPEN '+role.toUpperCase()+' SLOT '+(index+1)),sourceName:raw?.name||null,role,
    country:raw?.country||null,hero:heroName,verified:!!raw,skill,proficiency:clamp(.81+(hash(key+heroName)%180)/1000,.78,1),
    hp:hero[1],maxHp:hero[1],alive:true,respawn:0,ult:Math.floor((hash(key)%25)),cooldown:0,
    kills:0,deaths:0,assists:0,damage:0,healing:0,mitigated:0,damageTaken:0,lastDamagers:{},streak:0};
 });
}
function ultimate(hero){return HERO[hero]?.[2]||'Ultimate'}
function seeded(seed){return hash(seed+'|'+Date.now().toString(36))}
function create(opts={}){
 let seed=Number(opts.seed||seeded(String(opts.a)+String(opts.b)))>>>0;
 const rules=opts.rules==='classic'?'classic':'modern';
 const best=[3,5,7].includes(Number(opts.best))?Number(opts.best):5;
 const mapList=Array.isArray(opts.maps)&&opts.maps.length?opts.maps:maps.map(x=>x[0]);
 const getMeta=name=>maps.find(m=>m[0]===name)||[name,'Hybrid',''];
 const rosterA=makeLineup(opts.a||'Twisted Minds',opts.seasonA||2026,rules==='classic',opts.heroesA,seed);
 const rosterB=makeLineup(opts.b||'ZETA DIVISION',opts.seasonB||2026,rules==='classic',opts.heroesB,seed+17);
 const roster=(name,players,season)=>({name,season,players,color:(window.RIVALRY_TEAM_STYLE||{})[name]?.primary||'#8fb7ea',
  verified:(window.RIVALRY_VERIFIED_ROSTERS||[]).some(x=>x.name===name)});
 const data={v:2,seed,rand:seed||1,best,rules,teams:[roster(opts.a||'Twisted Minds',rosterA,opts.seasonA||2026),
   roster(opts.b||'ZETA DIVISION',rosterB,opts.seasonB||2026)],score:[0,0],
  mapList,mapIndex:0,map:mapList[0],mode:getMeta(mapList[0])[1],
  clock:240,elapsed:0,tick:0,progress:[0,0],overtimeTicks:0,attacker:0,contest:false,overtime:false,
  strategy:['hold','hold'],momentum:0,priority:null,combo:false,comboTtl:[0,0],
  status:'playing',lastWinner:null,events:[],killfeed:[],mapResults:[],snapshots:[],
  fight:{active:false,starts:0,elims:[0,0],lastEventAt:0},simulated:true};
 initMap(data);return data;
}
function initMap(s){
 const m=maps.find(x=>x[0]===s.map);
 s.mode=m?.[1]||'Hybrid';s.clock=s.mode==='Control'?165:240;s.elapsed=0;s.progress=[0,0];s.overtime=false;
 s.contest=false;s.overtimeTicks=0;s.fight={active:false,starts:0,elims:[0,0],lastEventAt:0};s.strategy=['hold','hold'];s.comboTtl=[0,0];
 for(let side=0;side<2;side++)for(const p of s.teams[side].players){p.hp=p.maxHp;p.alive=true;p.respawn=0;p.cooldown=0;p.lastDamagers={};p.ult=Math.round(p.ult*.28);}
 emit(s,'map',{map:s.map,mode:s.mode,detail:'Map '+(s.mapIndex+1)+' begins: '+s.map+' ('+s.mode+').',important:true});
}
function rand(s){let x=s.rand|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rand=x>>>0;return (s.rand>>>0)/4294967296}
function pick(s,arr){return arr[Math.floor(rand(s)*arr.length)]}
function emit(s,type,more={}){const e={id:s.events.length+1,time:Math.round(s.elapsed*10)/10,clock:Math.max(0,Math.round(s.clock)),
 mapIndex:s.mapIndex,map:s.map,type,...more};
 s.events.push(e);if(s.events.length>3500)s.events.splice(0,250);
 return e}
function active(s,side){return s.teams[side].players.filter(p=>p.alive)}
function value(p){return p.skill*p.proficiency*(p.role==='Damage'?1.13:p.role==='Tank'?1.05:1)*(p.hp/p.maxHp*.25+.75)}
function livingWeight(s,side){return active(s,side).reduce((n,p)=>n+value(p),0)}
function health(p){return Math.round(p.hp)}
function elimination(s,side,attacker,target,kind='normal',assist=[]){
 if(!target.alive)return;
 target.hp=0;target.alive=false;target.deaths++;target.respawn=s.rules==='classic'?11:10;
 target.streak=0;const victimSide=1-side;
 const contributed=Object.keys(target.lastDamagers||{}).filter(id=>id!==attacker?.id && s.teams[side].players.some(p=>p.id===id));
 for(const id of contributed){const a=s.teams[side].players.find(p=>p.id===id);if(a){a.assists++;assist.push(a.name)}}
 if(attacker){attacker.kills++;attacker.streak++;}
 const event=emit(s,'elimination',{side,killer:attacker?.name||null,killerHero:attacker?.hero||null,victim:target.name,victimHero:target.hero,
  headshot:kind==='headshot',environmental:kind==='environment',self:kind==='self',assist:assist.slice(0,3),important:true});
 s.killfeed.unshift({...event,expiresTick:s.tick+5});
 s.killfeed=s.killfeed.slice(0,9);
 s.fight.elims[side]++;s.fight.lastEventAt=s.elapsed;
 if(s.fight.elims[side]>=3)emit(s,'highlight',{side,detail:s.teams[side].name+' secure a multi-elimination teamfight!',important:true});
 if(active(s,victimSide).length===0){emit(s,'teamwipe',{side,detail:'TEAM WIPE! '+s.teams[side].name+' clear the battlefield.',important:true});
  s.momentum=clamp(s.momentum+(side===0?1.5:-1.5),-3,3);}
}
function tryUlt(s,side,p,force=false){
 if(!p.alive||p.ult<100)return false;
 const num=active(s,1-side).length;
 if(!force && rand(s)>.14+(num>3?.13:0))return false;
 p.ult=0;const ability=ultimate(p.hero);p.cooldown=3;
 emit(s,'ultimate',{side,player:p.name,hero:p.hero,ability,important:true});
 const isSupport=p.role==='Support',isTank=p.role==='Tank';
 if(isSupport){for(const ally of active(s,side)){const healed=Math.min(ally.maxHp-ally.hp,75);ally.hp+=healed;p.healing+=Math.round(healed);ally.cooldown=Math.max(0,ally.cooldown-2)}s.comboTtl[side]=3;}
 else{
  for(const victim of active(s,1-side).slice(0,isTank?3:4)){
   const dmg=(isTank?80:110)*(s.comboTtl[side]>0?1.4:1);
   damage(s,side,p,victim,dmg,'ultimate');
  }
 }
 return true;
}
function damage(s,side,p,target,n,kind='normal'){
 if(!target?.alive)return;
 let amount=Math.max(1,Math.round(n));
 const mitigated= target.role==='Tank'?Math.floor(amount*.10):0;
 target.damageTaken+=Math.max(0,amount-mitigated);
 s.teams[1-side].players.filter(x=>x.alive&&x.role==='Tank').forEach(x=>x.mitigated+=Math.round(mitigated/Math.max(1,active(s,1-side).filter(y=>y.role==='Tank').length)));
 amount-=mitigated;
 p.damage+=amount;p.ult=clamp(p.ult+amount/(p.role==='Support'?36:29),0,100);
 target.hp-=amount;target.lastDamagers[p.id]=s.elapsed;
 for(const [id,t] of Object.entries(target.lastDamagers))if(s.elapsed-t>14)delete target.lastDamagers[id];
 if(target.hp<=0){const k=kind==='headshot'?'headshot':kind==='environment'?'environment':'normal';elimination(s,side,p,target,k);}
}
function heal(s,side,delta){
 const healers=active(s,side).filter(p=>p.role==='Support');
 const patients=active(s,side).filter(p=>p.hp<p.maxHp);
 if(!healers.length||!patients.length)return;
 for(const healer of healers){
  const ordered=[...patients].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp);
  const target=ordered[0];if(!target||!target.alive)continue;
  const healAmt=Math.min(target.maxHp-target.hp,(28+rand(s)*19)*delta*healer.skill);
  target.hp+=healAmt;healer.healing+=Math.round(healAmt);
  healer.ult=clamp(healer.ult+healAmt/26,0,100);
  if(healAmt>40&&rand(s)<.09)emit(s,'save',{side,player:healer.name,target:target.name,detail:healer.name+' stabilizes '+target.name+' under pressure.'});
 }
}
function chooseTarget(s,side,attacker){
 const options=active(s,1-side);if(!options.length)return null;
 const strategy=s.strategy[side];let best=null,score=-Infinity;
 for(const target of options){
  const hp=1-target.hp/target.maxHp;
  let val=hp*.95+rand(s)*.36+(target.role==='Support'?.28:0)+(target.role==='Damage'?.10:0);
  if(strategy==='dive'&&target.role==='Support')val+=.53;
  if(strategy==='hold'&&target.role==='Tank')val+=.30;
  if(strategy==='poke'&&target.role==='Damage')val+=.28;
  if(val>score){score=val;best=target}
 }return best;
}
function fightTick(s,dt){
 for(const side of [0,1]){
  for(const p of s.teams[side].players){
   if(!p.alive){p.respawn-=dt;if(p.respawn<=0){p.alive=true;p.hp=p.maxHp;p.ult=clamp(p.ult+5,0,100);p.lastDamagers={};emit(s,'respawn',{side,player:p.name,hero:p.hero});}continue}
   p.cooldown=Math.max(0,p.cooldown-dt);
  }
 }
 const strength=[livingWeight(s,0),livingWeight(s,1)];
 if(strength[0]===0||strength[1]===0)return;
 if(!s.fight.active){s.fight={active:true,starts:s.elapsed,elims:[0,0],lastEventAt:s.elapsed};emit(s,'engage',{detail:s.teams[0].name+' and '+s.teams[1].name+' collide at the objective.',important:true});}
 let order=[0,1];if(rand(s)<.5)order.reverse();
 for(const side of order){
  const alive=[...active(s,side)];if(!alive.length)continue;
  for(const p of alive){
   if(!p.alive)continue;
   if(p.ult>=100 && (s.strategy[side]==='combo'||s.combo)){
     tryUlt(s,side,p,true);s.combo=false;
   }else if(p.ult>=100)tryUlt(s,side,p,false);
   if(p.role==='Support'&&rand(s)<.37)continue;
   const target=chooseTarget(s,side,p);if(!target)continue;
   const base=p.role==='Damage'?41:p.role==='Tank'?30:19;
   const strategyMod={poke:p.role==='Damage'?1.18:.9,dive:target.role==='Support'?1.22:.91,
    rush:p.role==='Tank'?1.24:1.04,hold:.92,combo:1.13}[s.strategy[side]]||1;
   const hitChance=clamp(.53+p.skill*.13+(s.strategy[side]==='poke'?.08:0),.42,.87);
   if(rand(s)>hitChance)continue;
   const crit=p.role==='Damage'&&rand(s)<(p.hero==='Widowmaker'?.30:.11);
   const amount=base*(.66+rand(s)*.65)*p.skill*p.proficiency*strategyMod*(crit?1.75:1)* (s.comboTtl[side]>0?1.2:1)*dt/3.2;
   damage(s,side,p,target,amount,crit?'headshot':'normal');
   if(p.cooldown<=0 && p.role==='Damage' && rand(s)<.18){p.cooldown=7;const victim=chooseTarget(s,side,p);if(victim)damage(s,side,p,victim,32,'ability');emit(s,'ability',{side,player:p.name,hero:p.hero,ability:HERO[p.hero]?.[3]||'Ability'});}
  }
 }
 heal(s,0,dt/3.2);heal(s,1,dt/3.2);
 if(s.comboTtl[0]>0)s.comboTtl[0]--;if(s.comboTtl[1]>0)s.comboTtl[1]--;
 if(s.elapsed-s.fight.lastEventAt>24){s.fight.active=false;emit(s,'reset',{detail:'Both teams reset their spacing and prepare to engage.'});}
}
function step(s,choice){
 if(s.status!=='playing')return s;
 let dt=3.0+(rand(s)*1.8);
 s.tick++;s.elapsed+=dt;s.clock=Math.max(0,s.clock-dt);
 if(choice)s.strategy[0]=choice;
 const pressure=[livingWeight(s,0),livingWeight(s,1)];
 s.strategy[1]=pressure[1]<pressure[0]*.7?'hold':pick(s,['poke','hold','dive','rush']);
 if(choice && rand(s)<.24)emit(s,'call',{side:0,detail:s.teams[0].name+' call '+choice.toUpperCase()+' positioning.'});
 fightTick(s,dt);
 const live=[active(s,0).length,active(s,1).length];
 const adj=(live[0]-live[1])*1.6+s.momentum*.24;
 s.contest=live[0]>=2&&live[1]>=2;
 const stage=s.mode==='Control'?1.18:s.mode==='Flashpoint'?1.26:1;
 const units=clamp(Math.max(0,4+adj)*(s.contest?.17:1)*stage,0,11);
 if(live[0]>live[1])s.progress[0]=clamp(s.progress[0]+units,0,100);
 if(live[1]>live[0]||live[1]>live[0]*.8 && rand(s)<.2)
   s.progress[1]=clamp(s.progress[1]+units*.72,0,100);
 if(s.mode==='Control'){
  if(!s.contest&&live[0]>=live[1])s.progress[0]=clamp(s.progress[0]+1.5,0,100);
  if(!s.contest&&live[1]>live[0])s.progress[1]=clamp(s.progress[1]+1.5,0,100);
 }
 if((s.progress[0]>=100||s.progress[1]>=100) && !s.contest){
   endMap(s,s.progress[0]>=100?0:1,'objective');
 }
 if(s.clock<=0&&s.status==='playing'){
  if(s.contest&&!s.overtime){s.overtime=true;s.overtimeTicks=0;emit(s,'overtime',{detail:'OVERTIME! The objective remains contested.',important:true});}
  else if(!s.contest){endMap(s,s.progress[0]>=s.progress[1]?0:1,'time');}
  else{
   s.overtimeTicks++;
   // A protracted overtime resolves when one side loses the touch,
   // or after an extended push, using objective percentage as the tie-break.
   if(s.overtimeTicks>7||s.elapsed>310){endMap(s,s.progress[0]>=s.progress[1]?0:1,'overtime');}
  }
 }
 s.killfeed=s.killfeed.filter(e=>e.expiresTick>=s.tick);
 return s;
}
function endMap(s,side,reason){
 if(s.status!=='playing')return;
 s.score[side]++;s.lastWinner=side;
 s.mapResults.push({map:s.map,winner:s.teams[side].name,score:[...s.progress],reason,events:s.events.length,elapsed:Math.round(s.elapsed)});
 emit(s,'map_end',{side,detail:s.teams[side].name+' win '+s.map+'! '+s.score[0]+'–'+s.score[1]+' in the series.',important:true});
 if(s.score[side]>=Math.ceil(s.best/2)){
  s.status='finished';emit(s,'series_end',{side,detail:s.teams[side].name+' WIN THE SERIES '+s.score[0]+'–'+s.score[1]+'!',important:true});
 }else{s.status='between'}
}
function nextMap(s){
 if(s.status!=='between')return s;
 s.mapIndex++;s.map=s.mapList[s.mapIndex%s.mapList.length];s.status='playing';initMap(s);return s;
}
function heroSwap(s,side,index,hero){
 const player=s.teams[side]?.players[index];if(!player||!HERO[hero])return false;
 if(HERO[hero][0]!==player.role)return false;
 player.hero=hero;player.maxHp=HERO[hero][1];player.hp=player.maxHp;player.ult=Math.round(player.ult*.6);
 emit(s,'swap',{side,player:player.name,hero,detail:player.name+' swaps to '+hero+'.',important:true});return true;
}
function substitute(s,side,index,rawPlayer){
 const team=s.teams[side];const old=team?.players[index];
 if(!old||!rawPlayer||rawPlayer.role!==old.role)return false;
 if(team.players.some((p,i)=>i!==index&&p.name===rawPlayer.name))return false;
 const hero=old.hero;const init=makeLineup(team.name,team.season,s.rules==='classic',null,s.seed)[0];
 const replacement={...init,...old,name:rawPlayer.name,sourceName:rawPlayer.name,country:rawPlayer.country,verified:true,
  hp:old.maxHp,alive:true,respawn:0,ult:0,kills:0,deaths:0,assists:0,damage:0,healing:0,mitigated:0};
 team.players[index]=replacement;emit(s,'sub',{side,player:rawPlayer.name,detail:rawPlayer.name+' substitutes in for '+old.name+' ('+old.role+').',important:true});return true;
}
window.RIVALRY_ENGINE=Object.freeze({HERO,maps,create,step,nextMap,heroSwap,substitute,makeLineup,active});
})();