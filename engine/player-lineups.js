/* Rivalry lineup service v4. Team/year resolution and hero preferences for BOTH sides.
 * Measured playtime is never fabricated. Existing hero pools are suggestions, not statistics.
 * Optional RIVALRY_HERO_USAGE rows: {player,team,season,hero,seconds,source,scope}.
 */
(() => {
  'use strict';
  const base = window.RIVALRY_ENGINE;
  if (!base) return;
  const REVISION = 'lineups-2026-10-25.4';
  const aliases = Object.freeze({
    zeta: 'zetadivision', sfshock: 'sanfranciscoshock', sfs: 'sanfranciscoshock',
    cr: 'crazyraccoon', falcons: 'teamfalcons', virtuspro: 'virtuspro',
    ssg: 'spacestationgaming', liquid: 'teamliquid', peps: 'teampeps', risk: 'teamrisk',
    zansiderodegaming: 'rodezansidegaming', rodezanside: 'rodezansidegaming',
    zansidegaming: 'rodezansidegaming', nightmare: 'ntmr',
    enterforce36: 'enterforce36', pleasenoheroban: 'pleasenotheroban'
  });
  const stripEra = value => String(value || '').trim().replace(/\s*(?:·|\||—)\s*(?:OWL|20\d{2})\s*$/i, '');
  function canonical(value) {
    const key = stripEra(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[øØ]/g, 'o').toLowerCase().replace(/[^a-z0-9]/g, '');
    return aliases[key] || key;
  }
  function yearInName(name) { return Number((String(name).match(/(?:·|\||—)\s*(20\d{2})\s*$/) || [])[1]) || null; }
  function snapshots(name) {
    return (window.RIVALRY_VERIFIED_ROSTERS || []).filter(r => canonical(r.name) === canonical(name));
  }
  function resolve(name, season) {
    const year = Number(season || yearInName(name));
    const rows = snapshots(name);
    if (!year) return rows.find(r => r.name.trim().toLowerCase() === String(name).trim().toLowerCase()) || null;
    return rows.find(r => Number(r.season) === year && r.name.trim().toLowerCase() === String(name).trim().toLowerCase())
      || rows.find(r => Number(r.season) === year) || null;
  }
  function years(name) { return [...new Set(snapshots(name).map(r => Number(r.season)))].sort((a,b) => b-a); }
  function defaultYear(name) {
    if (yearInName(name)) return yearInName(name);
    const available = years(name);
    if (/·\s*OWL\s*$/i.test(name)) return available.find(y => y <= 2023) || 2023;
    return available.includes(2026) ? 2026 : available[0] || 2026;
  }
  function required(rules) { return rules === 'classic' ? {Tank:2,Damage:2,Support:2} : {Tank:1,Damage:2,Support:2}; }
  function coverage(name, season, rules = 'modern') {
    const roster = resolve(name, season), need = required(rules), found = {Tank:0,Damage:0,Support:0};
    const seen = new Set();
    for (const p of roster?.players || []) {
      const key = String(p.name || '').trim().toLowerCase();
      if (key && !seen.has(key) && Object.hasOwn(found, p.role)) { seen.add(key); found[p.role]++; }
    }
    const missing = Object.entries(need).flatMap(([role,n]) => found[role] < n ? [{role,count:n-found[role]}] : []);
    return {name,season:Number(season),roster,found,missing,complete:!!roster && missing.length === 0};
  }
  // Replaces a captured snapshot resolver with a dynamic, normalized exact-year resolver.
  window.RIVALRY_ROSTER_FOR = resolve;
  window.RIVALRY_ROSTER_AVAILABLE_YEARS = years;
  const playerKey = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const preferredDefaults = Object.freeze({
    funnyastro:['Lucio','Brigitte','Juno','Mercy'], quartz:['Sojourn','Ashe','Widowmaker','Cassidy'],
    youbi:['Symmetra','Mei','Reaper','Echo'], proper:['Tracer','Sojourn','Genji','Cassidy'],
    knife:['Genji','Tracer','Mei'], shu:['Ana','Baptiste','Kiriko'], viol2t:['Zenyatta','Baptiste','Lucio','Kiriko'],
    lip:['Sombra','Sojourn','Ashe','Widowmaker'], heesang:['Echo','Tracer','Genji'], stalk3r:['Tracer','Genji','Mei'],
    junbin:['Winston','Wrecking Ball','D.Va'], max:['Sigma','D.Va','Zarya'],
    ch0r0ng:['Lucio','Brigitte','Juno'], vigilante:['Ana','Zenyatta','Baptiste'],
    hanbin:['D.Va','Sigma','Zarya'], smurf:['Winston','Orisa','Sigma'],
    super:['Reinhardt','Winston','Orisa'], choihyobin:['D.Va','Sigma','Zarya'],
    striker:['Tracer','Reaper','Ashe'], sinatraa:['Tracer','Doomfist','Genji'],
    moth:['Lucio','Mercy','Brigitte'], ans:['Widowmaker','Ashe','Cassidy'],
    architect:['Genji','Hanzo','Widowmaker'], rascal:['Mei','Echo','Genji'], twilight:['Ana','Zenyatta'],
    sp9rk1e:['Genji','Tracer','Echo'], edison:['Sojourn','Reaper','Ashe'], doha:['Sombra','Mei'],
    rupal:['Baptiste','Ana','Kiriko'], fdgod:['Lucio','Brigitte','Mercy'],
    gesture:['Winston','Orisa','Reinhardt'], fury:['D.Va','Sigma','Zarya'],
    profit:['Tracer','Genji','Hanzo'], birdring:['Widowmaker','Cassidy','Ashe'],
    bdosin:['Zenyatta','Ana','Moira'], nus:['Mercy','Lucio'],
    fearless:['Winston','Reinhardt'], fielder:['Ana','Kiriko','Baptiste'], chiyo:['Lucio','Brigitte','Juno']
  });
  function legal(hero, role, year) {
    const cat = window.RIVALRY_HERO_CATALOG;
    return !!base.HERO[hero] && (cat ? cat.legal(hero,year) && cat.roleAt(hero,year) === role : base.HERO[hero][0] === role);
  }
  function usageRows(player, team, year) {
    const rows = Array.isArray(window.RIVALRY_HERO_USAGE) ? window.RIVALRY_HERO_USAGE : [];
    const totals = new Map();
    for (const row of rows) {
      if (playerKey(row.player) !== playerKey(player) || Number(row.season) !== Number(year)) continue;
      if (row.team && canonical(row.team) !== canonical(team)) continue;
      if (!Number.isFinite(row.seconds) || row.seconds <= 0 || !/^https:\/\//.test(row.source || '') || !row.scope) continue;
      const item = totals.get(row.hero) || {hero:row.hero,seconds:0,sources:new Set(),scopes:new Set()};
      item.seconds += row.seconds; item.sources.add(row.source); item.scopes.add(row.scope); totals.set(row.hero,item);
    }
    return [...totals.values()].sort((a,b) => b.seconds-a.seconds).map(x => ({...x,sources:[...x.sources],scopes:[...x.scopes]}));
  }
  function preferences(player, team, year) {
    const available = Object.keys(base.HERO).filter(h => legal(h,player.role,year));
    const measured = usageRows(player.name,team,year).filter(x => available.includes(x.hero));
    const suggested = [...new Set([...(preferredDefaults[playerKey(player.name)] || []),...(player.heroes || [])])]
      .filter(h => available.includes(h));
    const ranked = [...new Set([...measured.map(x=>x.hero),...suggested,...available])];
    const basis = measured.length ? 'observed-playtime' : suggested.length ? 'suggested-pool' : 'role-fallback';
    const label = measured.length ? 'Most played in available sample' : suggested.length ? 'Suggested player pool · not playtime stats' : 'Role fallback · usage unavailable';
    return {ranked,measured,suggested,basis,label,season:Number(year)};
  }
  // Maximum-preference unique assignment, solved per role (at most two slots in role-lock).
  function chooseUnique(players, team, year) {
    const result = new Map();
    for (const role of ['Tank','Damage','Support']) {
      const slots = players.map((p,i)=>({p,i,prefs:preferences(p,team,year)})).filter(x=>x.p.role===role);
      let best = null, bestScore = -Infinity;
      function walk(at, used, chosen, score) {
        if(at===slots.length){if(score>bestScore){bestScore=score;best=chosen.slice()}return;}
        const slot=slots[at];
        const candidates=slot.prefs.ranked.slice(0,Math.max(6,slots.length+1));
        candidates.forEach((h,rank)=>{
          if(used.has(h))return;
          const stat=slot.prefs.measured.find(x=>x.hero===h), top=slot.prefs.measured[0]?.seconds||1;
          const reward=stat?100+100*stat.seconds/top:slot.prefs.suggested.includes(h)?70-rank*6:15-rank;
          used.add(h);chosen.push(h);walk(at+1,used,chosen,score+reward);chosen.pop();used.delete(h);
        });
      }
      walk(0,new Set(),[],0);
      slots.forEach((slot,i)=>result.set(slot.i,{hero:best?.[i]||slot.prefs.ranked[0],prefs:slot.prefs}));
    }
    return result;
  }
  function applyPreferred(s, side, {reset=false}={}) {
    const team=s.teams[side], snapshot=resolve(team.name,team.season);
    const raw=team.players.map(p=>({...p,...snapshot?.players.find(x=>playerKey(x.name)===playerKey(p.name))}));
    const allocation=chooseUnique(raw,team.name,team.season);
    team.players.forEach((p,i)=>{
      const choice=allocation.get(i);if(!choice?.hero)return;
      const changed=p.hero!==choice.hero;
      p.hero=choice.hero;p.maxHp=base.HERO[p.hero][1];p.hp=Math.min(p.hp,p.maxHp);
      if(reset){p.hp=p.maxHp;p.ult=0;}else if(changed)p.ult=Math.min(15,p.ult);
      const stat=choice.prefs.measured.find(x=>x.hero===p.hero);
      p.heroPreference={basis:stat?'observed-playtime':choice.prefs.suggested.includes(p.hero)?'suggested-pool':'role-fallback',
        label:stat?'Most played available sample':choice.prefs.suggested.includes(p.hero)?'Suggested pool':'Usage unavailable',
        preferred:choice.prefs.ranked[0],alternatives:choice.prefs.ranked.slice(0,5),
        seconds:stat?.seconds||null,sources:stat?.sources||[],scope:stat?.scopes?.join('; ')||null,
        constrained:p.hero!==choice.prefs.ranked[0]};
    });
    return true;
  }
  function create(options={}) {
    const opts={...options,seasonA:Number(options.seasonA||defaultYear(options.a)),seasonB:Number(options.seasonB||defaultYear(options.b))};
    const s=base.create(opts);s.lineupRevision=REVISION;
    for(let side=0;side<2;side++){
      s.teams[side].players.forEach((p,i)=>{p.id=side+'-'+i+'-'+playerKey(p.name);});
      applyPreferred(s,side);
      const coverageInfo=coverage(s.teams[side].name,s.teams[side].season,s.rules);
      s.teams[side].rosterCoverage=coverageInfo.found;
      s.teams[side].verified=coverageInfo.complete;
      s.teams[side].rosterSource=coverageInfo.roster?.source||null;
    }
    return s;
  }
  function heroSwap(s,side,index,hero) {
    const p=s.teams[side]?.players[index];
    if(!p || !legal(hero,p.role,s.teams[side].season) || s.teams[side].players.some((x,i)=>i!==index&&x.hero===hero))return false;
    const ok=base.heroSwap(s,side,index,hero);
    if(ok)p.heroPreference={basis:'manual',label:'Manual selection',preferred:hero,alternatives:[],sources:[]};
    return ok;
  }
  function substitute(s,side,index,raw) {
    const ok=base.substitute(s,side,index,raw);if(!ok)return false;
    const p=s.teams[side].players[index];
    p.id=`${side}-${index}-${playerKey(raw.name)}`;
    const pref=preferences(raw,s.teams[side].name,s.teams[side].season);
    const used=new Set(s.teams[side].players.filter((_,i)=>i!==index).map(x=>x.hero));
    const hero=pref.ranked.find(h=>!used.has(h));
    if(hero){p.hero=hero;p.maxHp=base.HERO[hero][1];p.hp=p.maxHp;}
    p.heroPreference={basis:pref.basis,label:pref.label,preferred:pref.ranked[0],alternatives:pref.ranked.slice(0,5),sources:pref.measured[0]?.sources||[]};
    return true;
  }
  window.RIVALRY_LINEUPS=Object.freeze({REVISION,canonical,resolve,coverage,years,defaultYear,yearInName,preferences,chooseUnique,applyPreferred});
  window.RIVALRY_ENGINE=Object.freeze({...base,create,heroSwap,substitute,autoHeroes:applyPreferred});
})();
