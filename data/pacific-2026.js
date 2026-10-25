/* Pacific OWCS 2026 Stage 3 participant names — dated as of 25 Oct 2026.
   Verified against https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/Asia/Stage_3/Pacific
   This directory does NOT assert unverified player identities, nationality or roles. */
(()=>{
'use strict';
const source='https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/Asia/Stage_3/Pacific';
const names=[['The Gatos Guapos','TGG'],['Rankers','RKR'],['junjilopzfx','JUN'],['SeijiKING','SEJ'],['CantHear','CH'],['Retirement Home','RH']];
const current=new Set((window.RIVALRY_OWCS||[]).map(x=>x.name.toLowerCase()));
const teams=names.filter(([name])=>!current.has(name.toLowerCase())).map(([name,tag])=>({
 name,tag,region:'Pacific',era:'OWCS',season:'2026 Stage 3',players:[],source,
 note:'Participation source verified; role-verified lineup not available in Rivalry.'
}));
window.RIVALRY_OWCS=Object.freeze([...(window.RIVALRY_OWCS||[]),...teams]);
window.RIVALRY_OWCS_SOURCES=Object.freeze({...window.RIVALRY_OWCS_SOURCES,Pacific:source});
})();