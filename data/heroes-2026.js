/* Full Overwatch hero catalog (as of 2026-10-25).
   Hero names/roles and 2026 Sombra role change:
   https://overwatch.blizzard.com/en-us/heroes/
   https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/10/
   https://news.blizzard.com/en-us/article/24303008/feed-your-hunger-in-reign-of-talon-season-5-a-grim-doctrine
   Combat health/damage/ultimate values are SIMULATION approximations, NOT patch statistics.
   hero[0]=role, [1]=simulated HP, [2]=ultimate label, [3]=ability label, [4]=archetype.
*/
(()=>{
'use strict';
const H=window.RIVALRY_ENGINE?.HERO;
if(!H)return;
const tank=[
 ['D.Mon',2026,'Self-Destruct','Defense Matrix'],
 ['D.Va',2016,'Self-Destruct','Defense Matrix'],
 ['Domina',2026,'Panopticon','Barrier Array'],
 ['Doomfist',2017,'Meteor Strike','Rocket Punch'],
 ['Hazard',2024,'Downpour','Violent Leap'],
 ['Junker Queen',2022,'Rampage','Commanding Shout'],
 ['Mauga',2023,'Cage Fight','Cardiac Overdrive'],
 ['Orisa',2017,'Terra Surge','Energy Javelin'],
 ['Ramattra',2022,'Annihilation','Ravenous Vortex'],
 ['Reinhardt',2016,'Earthshatter','Fire Strike'],
 ['Roadhog',2016,'Whole Hog','Chain Hook'],
 ['Sigma',2019,'Gravitic Flux','Accretion'],
 ['Winston',2016,'Primal Rage','Jump Pack'],
 ['Wrecking Ball',2018,'Minefield','Grappling Claw'],
 ['Zarya',2016,'Graviton Surge','Particle Barrier']
];
const damage=[
 ['Anran',2026,'Vermilion Ascent','Inferno Rush'],
 ['Ashe',2018,'B.O.B.','Coach Gun'],
 ['Bastion',2016,'Configuration: Artillery','Tactical Grenade'],
 ['Cassidy',2016,'Deadeye','Combat Roll'],
 ['Echo',2020,'Duplicate','Sticky Bombs'],
 ['Emre',2026,'Override Protocol','Cyber Frag'],
 ['Freja',2025,'Bola Shot','Quick Dash'],
 ['Genji',2016,'Dragonblade','Swift Strike'],
 ['Hanzo',2016,'Dragonstrike','Storm Arrows'],
 ['Junkrat',2016,'RIP-Tire','Concussion Mine'],
 ['Mei',2016,'Blizzard','Ice Wall'],
 ['Pharah',2016,'Barrage','Concussive Blast'],
 ['Reaper',2016,'Death Blossom','Wraith Form'],
 ['Shion',2026,'Ultimate','Evade'],
 ['Sierra',2026,'Ultimate','Recon'],
 ['Sojourn',2022,'Overclock','Power Slide'],
 ['Soldier: 76',2016,'Tactical Visor','Biotic Field'],
 ['Symmetra',2016,'Photon Barrier','Teleporter'],
 ['Torbjörn',2016,'Molten Core','Overload'],
 ['Tracer',2016,'Pulse Bomb','Blink'],
 ['Vendetta',2025,'Sundering Blade','Whirlwind Dash'],
 ['Venture',2024,'Tectonic Shock','Burrow'],
 ['Widowmaker',2016,'Infra-Sight','Grappling Hook']
];
const support=[
 ['Ana',2016,'Nano Boost','Biotic Grenade'],
 ['Baptiste',2019,'Amplification Matrix','Immortality Field'],
 ['Brigitte',2018,'Rally','Repair Pack'],
 ['Doctrine',2026,'Deliverance','Invigorating Drones'],
 ['Illari',2023,'Captive Sun','Healing Pylon'],
 ['Jetpack Cat',2026,'Ultimate','Flight'],
 ['Juno',2024,'Orbital Ray','Hyper Ring'],
 ['Kiriko',2022,'Kitsune Rush','Protection Suzu'],
 ['Lifeweaver',2023,'Tree of Life','Life Grip'],
 ['Lucio',2016,'Sound Barrier','Amp It Up'],
 ['Mercy',2016,'Valkyrie','Resurrect'],
 ['Mizuki',2026,'Ultimate','Ability'],
 ['Moira',2017,'Coalescence','Fade'],
 ['Sombra',2016,'EMP','Cyberspace'],
 ['Wuyang',2025,'Ultimate','Healing Stream'],
 ['Zenyatta',2016,'Transcendence','Discord Orb']
];
const definitions={},release={};
for(const [role,list,hp] of [['Tank',tank,640],['Damage',damage,250],['Support',support,250]]){
 for(const [name,year,ult,ability] of list){
   // Specific values are intentionally gameplay approximations.
   const existing=H[name];H[name]=[role,existing?.[1]||hp,ult,ability,existing?.[4]||1];
   definitions[name]={name,role,year,ultimate:ult,ability,slug:name==='Lucio'?'lucio':name.toLowerCase().replace(/[^a-z0-9]+/g,'-')};
   release[name]=year;
 }
}
definitions.Sombra.historicalRole='Damage';definitions.Sombra.roleChange=2026;
const legal=(name,year=2026)=>!!definitions[name]&&release[name]<=Number(year||2026);
const roleAt=(name,year=2026)=>name==='Sombra'&&Number(year)<2026?'Damage':definitions[name]?.role||'Damage';
const atYear=(year,role)=>Object.values(definitions).filter(h=>legal(h.name,year)&&(!role||roleAt(h.name,year)===role)).sort((a,b)=>a.name.localeCompare(b.name));
window.RIVALRY_HERO_CATALOG=Object.freeze({definitions,release,legal,roleAt,atYear,all:()=>Object.values(definitions)});
})();
