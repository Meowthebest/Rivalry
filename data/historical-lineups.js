/* Season-specific real player roster snapshots.
Sources (tournament year-specific, NOT current roster):
  2024 OWCS https://liquipedia.net/overwatch/Overwatch_Champions_Series/2024/World_Finals
  2025 OWCS https://liquipedia.net/overwatch/Overwatch_Champions_Series/2025/World_Finals
  2020 Shock https://en.wikipedia.org/wiki/2020_San_Francisco_Shock_season
  OWL 2019 https://liquipedia.net/overwatch/Overwatch_League/2019
Only players and roles sourced from event lists; country is null when unconfirmed.
*/
(()=>{
 'use strict';
 const P=(name,role,country=null)=>({name,role,country,heroes:[]});
 const T=(name,season,source,players)=>({name,season,source,players,verifiedAt:'2026-10-25',rosterType:'historical-event',label:season+' event roster'});
 const w24='https://liquipedia.net/overwatch/Overwatch_Champions_Series/2024/World_Finals';
 const w25='https://liquipedia.net/overwatch/Overwatch_Champions_Series/2025/World_Finals';
 const kr='KR',sa='SA',us='US',gb='GB';
 const arr=[
  T('Crazy Raccoon · 2024',2024,w24,[P('JunBin','Tank',kr),P('MAX','Tank',kr),P('LIP','Damage',kr),P('HeeSang','Damage',kr),P('CH0R0NG','Support',kr),P('shu','Support',kr)]),
  T('Team Falcons · 2024',2024,w24,[P('smurf','Tank',kr),P('Hanbin','Tank',kr),P('Proper','Damage',kr),P('Stalk3r','Damage',kr),P('Happy','Damage',kr),P('ChiYo','Support',kr),P('Fielder','Support',kr),P('SirMajed','Support',sa)]),
  T('Twisted Minds · 2024',2024,w24,[P('TVNT','Tank',sa),P('Quartz','Damage',sa),P('Youbi','Damage',sa),P('Bliss','Support',kr),P('MCD','Support',kr),P('vigilante','Support',kr)]),
  T('Spacestation Gaming · 2024',2024,w24,[P('Hadi','Tank',gb),P('KSAA','Tank',sa),P('Seicoe','Damage','AT'),P('SparkR','Damage',gb),P('FunnyAstro','Support',gb),P('Landon','Support',us)]),
  T('Toronto Defiant · 2024',2024,w24,[P('SOMEONE','Tank',kr),P('MER1T','Damage',kr),P('Sugarfree','Damage',us),P('Rupal','Support',us),P('Vega','Support',us)]),
  T('NRG Shock · 2024',2024,w24,[P('Attack','Tank',kr),P('Kellan','Tank',kr),P('PGE','Damage',us),P('scissors','Damage',us),P('TR33','Damage',us),P('Rakattack','Support',us),P('UltraViolet','Support',us),P('cal','Support',us)]),
  T('Crazy Raccoon · 2025',2025,w25,[P('JunBin','Tank',kr),P('MAX','Tank',kr),P('LIP','Damage',kr),P('HeeSang','Damage',kr),P('SP1NT','Damage',kr),P('CH0R0NG','Support',kr),P('shu','Support',kr)]),
  T('Team Falcons · 2025',2025,w25,[P('Hanbin','Tank',kr),P('SOMEONE','Tank',kr),P('Proper','Damage',kr),P('MER1T','Damage',kr),P('Stalk3r','Damage',kr),P('ChiYo','Support',kr),P('Fielder','Support',kr)]),
  T('Twisted Minds · 2025',2025,w25,[P('KSAA','Tank',sa),P('TVNT','Tank',sa),P('Quartz','Damage',sa),P('Seicoe','Damage','AT'),P('Youbi','Damage',sa),P('FunnyAstro','Support',gb),P('Simple','Support',kr)]),
  T('T1 · 2025',2025,w25,[P('DONGHAK','Tank',kr),P('Jasm1ne','Tank',kr),P('Proud','Damage',kr),P('Viper','Damage',kr),P('ZEST','Damage',kr),P('skewed','Support',kr),P('vigilante','Support',kr)]),
  T('Weibo Gaming · 2025',2025,w25,[P('Guxue','Tank','CN'),P('Apr1ta','Damage','CN'),P('Leave','Damage','CN'),P('shy','Damage','CN'),P('Mewtwo','Support','CN'),P('Mmonk','Support','CN')]),
  T('Team Liquid · 2025',2025,w25,[P('Infekted','Tank',us),P('TR33','Damage',us),P('zeruhh','Damage',us),P('Rupal','Support',us),P('Vega','Support',us)]),
  T('Spacestation Gaming · 2025',2025,w25,[P('Hawk','Tank',us),P('Kronik','Damage',null),P('scissors','Damage',us),P('Sugarfree','Damage',us),P('Cjay','Support',us),P('Lep','Support',us)]),
  T('Team Peps · 2025',2025,w25,[P('Willys07','Tank',null),P('Dip','Damage',null),P('Zorrow','Damage',null),P('FDGod','Support','FR'),P('Xeriongdh','Support',null)]),
  T('VARREL · 2025',2025,w25,[P('KSG','Tank',null),P('Nico','Damage',null),P('qki','Damage',null),P('TOPDRAGON','Damage',kr),P('Mimoza','Support',null),P('Qloud','Support',null),P('Sley','Support',null)]),
  T('San Francisco Shock · 2020',2020,'https://en.wikipedia.org/wiki/2020_San_Francisco_Shock_season',[
    P('super','Tank',us),P('smurf','Tank',kr),P('ChoiHyoBin','Tank',kr),
    P('Striker','Damage',kr),P('Rascal','Damage',kr),P('ANS','Damage',kr),P('ta1yo','Damage','JP'),
    P('Moth','Support',us),P('Viol2t','Support',kr),P('Twilight','Support',kr)])
 ];
 const existing=window.RIVALRY_VERIFIED_ROSTERS||[];
 window.RIVALRY_VERIFIED_ROSTERS=Object.freeze([...existing.filter(r=>!arr.some(x=>x.name===r.name)),...arr]);
 const snap=window.RIVALRY_VERIFIED_ROSTERS;
 const normalize=s=>String(s||'').toLowerCase().replace(/\s*·\s*(owl|\d{4})$/i,'').replace(/[^a-z0-9]/g,'');
 const seasonInName=n=>{const x=String(n).match(/·\s*(20\d{2})$/);return x?Number(x[1]):null};
 window.RIVALRY_ROSTER_FOR=function(name,season){
   let y=Number(season||seasonInName(name)||0);
   const norm=normalize(name);
   if(!y){const exact=snap.find(x=>x.name.toLowerCase()===String(name).toLowerCase());if(exact)return exact;
     return null; // Never silently reuse another season for a historical profile
   }
   const byYear=snap.filter(x=>Number(x.season)===y&&normalize(x.name)===norm);
   return byYear.find(x=>x.name.toLowerCase()===String(name).toLowerCase())||byYear[0]||null;
 };
 window.RIVALRY_ROSTER_AVAILABLE_YEARS=function(name){
   const n=normalize(name);return [...new Set(snap.filter(x=>normalize(x.name)===n).map(x=>Number(x.season)))].sort((a,b)=>a-b);
 };
})();
