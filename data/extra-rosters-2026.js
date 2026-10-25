/* Additional role-verified OWCS 2026 Stage 3 EMEA & Korea rosters.
   https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/EMEA/Stage_3
   https://liquipedia.net/overwatch/Poker_Face
   Information is an October 25 snapshot, not an eternal/current roster claim.
*/
(()=>{
'use strict';
const p=(name,role,country)=>({name,role,country,heroes:[]});
const emea='https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/EMEA/Stage_3',korea='https://liquipedia.net/overwatch/Poker_Face';
const t=(name,region,source,players)=>({name,region,source,season:2026,verifiedAt:'2026-10-25',players});
const data=[
 t('Team Peps','EMEA',emea,[
  p('KroxZ','Tank','FR'),p('Willys07','Tank','SE'),
  p('Rav','Damage','DK'),p('xzodyal','Damage','ES'),
  p('FDGod','Support','FR'),p('Xeriongdh','Support','FR')
 ]),
 t('Team Risk','EMEA',emea,[
  p('amdp','Tank','SA'),p('cuFFa','Tank','AU'),
  p('sHockWave','Damage','DK'),p('KORZ','Damage','SA'),p('WMaimone','Damage','GB'),
  p('SirMajed','Support','SA'),p('zox','Support','SA')
 ]),
 t('1234','EMEA',emea,[
  p('GoldenPants','Tank','GB'),p('Zorrow','Damage','SE'),p('alvicate','Damage','LT'),
  p('crispy','Support','GB'),p('Khenail','Support','ES')
 ]),
 t('POKER FACE','Korea',korea,[
  p('SoLA','Tank','KR'),p('SWOO','Tank','KR'),
  p('F1nally','Damage','KR'),p('SORI','Damage','KR'),
  p('Caffeine','Support','KR'),p('Dumbbell','Support','KR'),p('Soae','Support','KR')
 ])
];
const older=window.RIVALRY_VERIFIED_ROSTERS||[];
window.RIVALRY_VERIFIED_ROSTERS=Object.freeze([...older.filter(x=>!data.some(d=>d.name===x.name&&d.season===x.season)),...data]);
})();
