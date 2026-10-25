/* OWCS 2026 Asia Stage 3 lineups, roles and nationalities from stage-specific
   Liquipedia competition pages (October 2026 snapshot).
   Do not infer unknown extra Support/Tank roles.
   https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/Asia/Stage_3/Japan
   https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/China/Stage_3
*/
(()=>{
'use strict';
const JP='JP',KR='KR',CN='CN';
const p=(name,role,country)=>({name,role,country,heroes:[]});
const j='https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/Asia/Stage_3/Japan';
const c='https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/China/Stage_3';
const t=(name,source,players,region)=>({name,season:2026,verifiedAt:'2026-10-25',source,region,players});
const data=[
 t('ENTER FORCE.36',j,[p('Fearless','Tank',KR),p('Edison','Damage',KR),p('NewJ','Damage',JP),p('Ydot','Support',JP),p('Gaisen','Support',JP)],'Japan'),
 t('99DIVINE',j,[p('Ichi','Tank',JP),p('ALTHOUGH','Damage',KR),p('MN3','Damage',KR),p('Sakume','Support',JP),p('Supreme','Support',JP),p('Umi','Support',JP)],'Japan'),
 t('Uwinks',j,[p('xzahyo','Tank',JP),p('yumilalan','Tank',JP),p('Yot1y','Damage',JP),p('Develop','Damage',KR),p('Undersea','Damage',JP),p('EuclidEUC','Support',JP),p('UGH','Support',JP),p('APDO','Support',KR)],'Japan'),
 t('Please Not Hero Ban',j,[p('UYOU','Tank',KR),p('RLG5656','Damage',JP),p('Suraimu1','Damage',JP),p('Neivis','Support',JP),p('Langley','Support',JP)],'Japan'),
 t('JD Gaming',c,[p('Roxy','Tank',KR),p('Pineapple','Damage',CN),p('Kaneki','Damage',CN),p('Mewtwo','Support',CN)],'China'),
 t('OU Gaming',c,[p('800','Tank',CN),p('Decade','Tank',CN),p('Pride','Damage',CN),p('Victoria','Damage',KR),p('Damo','Support','HK')],'China')
];
const previous=window.RIVALRY_VERIFIED_ROSTERS||[];
window.RIVALRY_VERIFIED_ROSTERS=Object.freeze([...previous.filter(old=>!data.some(d=>old.name===d.name&&old.season===d.season)),...data]);
})();
