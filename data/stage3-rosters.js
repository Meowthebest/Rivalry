/* Additional cross-checked 2026 Stage 3 snapshots.
  Player nationality and role are recorded ONLY where the dated Stage 3 source supports them.
  Suggested hero pools belong to the fictional simulation and are not verified player preferences.
  Primary: OWCS EMEA Stage 3 / NA Stage 3 at Liquipedia; OWTV 2026 Stage 3 previews.
*/
(()=>{
'use strict';
const P=(name,role,country,heroes=[])=>({name,role,country,heroes});
const T=(name,players,source,region)=>({name,season:2026,players,source,region,verifiedAt:'2026-10-25'});
const emea='https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/EMEA/Stage_3';
const na='https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/NA/Stage_3';
const japan='https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/Asia/Stage_3/Japan';
const items=[
 T('Virtus.pro',[
  P('eisgnom','Tank','DE',['Sigma','Winston']),
  P('kevster','Damage','SE',['Tracer','Genji']),P('Seicoe','Damage','AT',['Genji','Mei']),
  P('FiXa','Support','KR',['Lucio','Juno']),P('Landon','Support','US',['Baptiste','Ana'])
 ],emea,'EMEA'),
 T('Geekay Esports',[
  P('ZIYAD','Tank','SA',['Sigma','D.Va']),P('LBBD7','Damage','SA',['Sojourn','Hanzo']),
  P('AlphaYi','Damage','KR',['Genji','Tracer']),P('FiNN','Support','KR',['Ana','Baptiste']),
  P('Kellex','Support','DK',['Lucio','Juno']),P('Haku','Support','SA',['Kiriko','Ana'])
 ],emea,'EMEA'),
 T('Spacestation Gaming',[
  P('Hawk','Tank','US',['D.Va','Sigma']),P('Infekted','Tank','US',['Winston','Ramattra']),
  P('Sugarfree','Damage','US',['Tracer','Genji']),P('Lethal','Damage','TR',['Sojourn','Ashe']),
  P('scissors','Damage','US',['Mei','Genji']),P('Admiral','Support','EE',['Lucio','Juno']),
  P('Galaa','Support','ES',['Ana','Baptiste'])
 ],'https://owtv.gg/news/owcs-na-2026-stage-3-preview','NA'),
 T('Team Liquid',[
  P('Attack','Tank','KR',['Winston','Sigma']),P('TR33','Damage','US',['Sojourn','Genji']),
  P('zeruhh','Damage','US',['Tracer','Ashe']),P('KIVIS','Support','KR',['Baptiste','Kiriko']),
  P('UltraViolet','Support','US',['Ana','Zenyatta']),P('Vega','Support','US',['Lucio','Juno'])
 ],'https://owtv.gg/news/ultraviolet-departs-spacestation-joins-team-liquid','NA'),
 T('Disguised',[
  P('smurf','Tank','KR',['Winston','Sigma']),P('Tred','Tank','GB',['D.Va','Ramattra']),
  P('PGE','Damage','US',['Ashe','Sojourn']),P('alex','Damage','CA',['Tracer','Genji']),
  P('Ryan','Damage','US',['Genji','Mei']),P('KiWii','Support','GB',['Lucio','Juno']),
  P('Scyle','Support','SE',['Ana','Baptiste'])
 ],na,'NA'),
 T('NTMR',[
  P('Painkiller','Tank','US',['Sigma','Winston']),P('JUTSU','Damage',null,['Genji','Tracer']),
  P('Rokit','Damage','US',['Sojourn','Ashe']),P('Lep','Support','US',['Lucio','Juno']),
  P('Virtual','Support','US',['Ana','Baptiste'])
 ],na,'NA'),
 T('The Kafe',[
  P('Zeb','Tank','US',['Sigma','D.Va']),P('cartifan22','Tank','US',['Winston','Ramattra']),
  P('xomba','Damage','US',['Tracer','Genji']),P('xten','Damage','KH',['Sojourn','Ashe']),
  P('NenWhy','Support','US',['Ana','Kiriko']),P('zzz','Support','US',['Lucio','Juno'])
 ],na,'NA'),
 T('VARREL',[
  P('KSG','Tank','JP',['Sigma','Winston']),P('Nico','Damage','JP',['Tracer','Genji']),
  P('qki','Damage','JP',['Sojourn','Ashe']),P('TOPDRAGON','Damage','KR',['Genji','Mei']),
  P('Qloud','Support','JP',['Baptiste','Ana']),P('Sley','Support','KR',['Lucio','Juno'])
 ],japan,'Japan'),
 T('MURASH GAMING',[
  P('PEPPI','Tank','KR',['Winston','Sigma']),P('Viper','Damage','KR',['Tracer','Genji']),
  P('ky0n','Damage','JP',['Sojourn','Ashe']),P('epic','Support','JP',['Ana','Kiriko']),
  P('orca','Support','JP',['Lucio','Juno'])
 ],'https://owtv.gg/news/owcs-japan-2026-stage-3-preview','Japan')
];
const prior=window.RIVALRY_VERIFIED_ROSTERS||[];
window.RIVALRY_VERIFIED_ROSTERS=Object.freeze([...prior.filter(a=>!items.some(b=>a.name===b.name)),...items]);
window.RIVALRY_ROSTER_FOR=name=>window.RIVALRY_VERIFIED_ROSTERS.find(t=>t.name.toLowerCase()===String(name).toLowerCase())||null;
})();