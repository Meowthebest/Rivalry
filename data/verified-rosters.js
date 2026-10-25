/* Verified and dated lineup snapshots for professional Overwatch.
   Only player identities, roles and nationalities directly supported by cited public sources.
   Omitted roles/players must remain unverified; simulation placeholders are marked SYNTHETIC.
   Source references are human-checkable URLs attached to each snapshot.
*/
(() => {
'use strict';
const P=(name,role,country,heroes=[])=>({name,role,country,heroes});
const T=(name,season,source,players,extra={})=>({name,season,source,players,verifiedAt:'2026-10-25',...extra});
const kr='KR',us='US',gb='GB',sa='SA';
const entries=[
T('Twisted Minds',2026,'https://owtv.gg/news/owcs-emea-2026-stage-3-preview',[
 P('TVNT','Tank',sa,['Sigma','Winston']),P('KSAA','Tank',sa,['Sigma','D.Va']),
 P('Quartz','Damage',sa,['Sojourn','Ashe']),P('Youbi','Damage',sa,['Hanzo','Mei']),
 P('JaeWoo','Damage',kr,['Genji','Tracer']),
 P('FunnyAstro','Support',gb,['Juno','Lucio']),P('Simple','Support',kr,['Baptiste','Ana'])
],{region:'EMEA'}),
T('ZETA DIVISION',2026,'https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/Midseason_Championship',[
 P('Bernar','Tank',kr,['Sigma','D.Va']),P('Mealgaru','Tank',kr,['Winston','Ramattra']),
 P('Proper','Damage',kr,['Tracer','Sojourn']),P('KNIFE','Damage',kr,['Mei','Genji']),
 P('shu','Support',kr,['Ana','Baptiste']),P('Viol2t','Support',kr,['Lucio','Zenyatta'])
],{region:'Korea'}),
T('Crazy Raccoon',2026,'https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/Midseason_Championship',[
 P('JunBin','Tank',kr,['Winston','D.Va']),P('MAX','Tank',kr,['Sigma','D.Va']),
 P('LIP','Damage',kr,['Sojourn','Ashe']),P('HeeSang','Damage',kr,['Genji','Tracer']),P('Stalk3r','Damage',kr,['Tracer','Mei']),
 P('CH0R0NG','Support',kr,['Lucio','Juno']),P('vigilante','Support',kr,['Ana','Zenyatta'])
],{region:'Korea'}),
T('T1',2026,'https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/Midseason_Championship',[
 P('DONGHAK','Tank',kr,['Winston','Ramattra']),P('Jasm1ne','Tank',kr,['Sigma','D.Va']),
 P('Proud','Damage',kr,['Sojourn','Ashe']),P('ZEST','Damage',kr,['Genji','Tracer']),
 P('Bliss','Support',kr,['Lucio','Juno']),P('skewed','Support',kr,['Ana','Kiriko'])
],{region:'Korea'}),
T('Team Falcons',2026,'https://owtics.gg/en-US/esports/tournament/2026-owcs-midseason-championship',[
 P('Hanbin','Tank',kr,['Sigma','D.Va']),P('SOMEONE','Tank',kr,['Winston','Ramattra']),
 P('Checkmate','Damage',kr,['Genji','Mei']),P('MER1T','Damage',kr,['Sojourn','Ashe']),P('SP1NT','Damage',kr,['Tracer','Genji']),
 P('ChiYo','Support',kr,['Lucio','Juno']),P('Fielder','Support',kr,['Ana','Baptiste'])
],{region:'Korea'}),
T('Weibo Gaming',2026,'https://owtics.gg/en-US/esports/tournament/2026-owcs-midseason-championship',[
 P('Guxue','Tank','CN',['Winston','D.Va']),P('SUNZO','Tank','CN',['Sigma','Ramattra']),
 P('Leave','Damage','CN',['Tracer','Genji']),P('shy','Damage','CN',['Sojourn','Ashe']),
 P('LeeSooMin','Support',kr,['Ana','Kiriko']),P('MAKA','Support',kr,['Lucio','Juno'])
],{region:'China'}),
T('Dallas Fuel',2026,'https://owtics.gg/en-US/esports/tournament/2026-owcs-na-stage-3',[
 P('Kellan','Tank',kr,['Winston','Sigma']),P('Kronik','Damage',us,['Sojourn','Ashe']),P('SeonJun','Damage',kr,['Tracer','Genji']),
 P('Cjay','Support',us,['Baptiste','Ana']),P('Lukemino','Support',us,['Lucio','Juno'])
],{region:'NA'}),
T('VARREL',2026,'https://eg-gear.com/owcs-devices-2026/',[
 P('KSG','Tank',null,['Sigma','D.Va']),P('Nico','Damage',null,['Tracer','Genji']),
 P('qki','Damage',null,['Sojourn','Ashe']),P('TOPDRAGON','Damage',null,['Genji','Mei']),
 P('Qloud','Support',null,['Baptiste','Ana']),P('Sley','Support',null,['Lucio','Juno'])
],{region:'Japan',countryCaution:'Nationalities on this snapshot should be independently confirmed from individual player pages.'}),
T('MURASH GAMING',2026,'https://eg-gear.com/owcs-devices-2026/',[
 P('PEPPI','Tank',null,['Sigma','Winston']),P('Viper','Damage',null,['Tracer','Genji']),P('ky0n','Damage',null,['Sojourn','Ashe']),
 P('epic','Support',null,['Ana','Kiriko']),P('orca','Support',null,['Lucio','Juno'])
],{region:'Japan'}),
T('San Francisco Shock · 2019',2019,'https://liquipedia.net/overwatch/Overwatch_League/2019/Regular_Season/Stage_2/Playoffs',[
 P('super','Tank',us,['Reinhardt','Winston']),P('smurf','Tank',kr,['Winston','Orisa']),P('ChoiHyoBin','Tank',kr,['D.Va','Sigma']),P('Nevix','Tank','SE',['D.Va','Zarya']),
 P('sinatraa','Damage',us,['Tracer','Zarya']),P('Architect','Damage',kr,['Genji','Hanzo']),
 P('Striker','Damage',kr,['Tracer','Ashe']),P('Rascal','Damage',kr,['Mei','Genji']),
 P('Moth','Support',us,['Lucio','Mercy']),P('Viol2t','Support',kr,['Zenyatta','Ana'])
],{region:'OWL',accolade:'2019 OWL CHAMPION'}),
T('London Spitfire · 2018',2018,'https://liquipedia.net/overwatch/Overwatch_League/2018/Playoffs',[
 P('Gesture','Tank',kr,['Winston','Orisa']),P('Fury','Tank',kr,['D.Va','Zarya']),
 P('Profit','Damage',kr,['Tracer','Genji']),P('birdring','Damage',kr,['Widowmaker','Ashe']),
 P('Bdosin','Support',kr,['Zenyatta','Ana']),P('NUS','Support',kr,['Mercy','Lucio'])
],{region:'OWL',accolade:'2018 OWL CHAMPION'}),
T('Shanghai Dragons · 2021',2021,'https://liquipedia.net/overwatch/Overwatch_League/2021/Playoffs',[
 P('Fate','Tank',kr,['Winston','Orisa']),P('Void','Tank',kr,['D.Va','Sigma']),
 P('Fleta','Damage',kr,['Echo','Genji']),P('LIP','Damage',kr,['Sombra','Ashe']),
 P('Izayaki','Support',kr,['Zenyatta','Ana']),P('LeeJaeGon','Support',kr,['Lucio','Brigitte'])
],{region:'OWL',accolade:'2021 OWL CHAMPION'}),
T('Dallas Fuel · 2022',2022,'https://liquipedia.net/overwatch/Overwatch_League/2022/Playoffs',[
 P('Fearless','Tank',kr,['Winston','Reinhardt']),P('Hanbin','Tank',kr,['D.Va','Zarya']),
 P('Edison','Damage',kr,['Sojourn','Reaper']),P('SP9RK1E','Damage',kr,['Genji','Tracer']),P('Doha','Damage',kr,['Sombra','Mei']),P('guriyo','Damage',kr,['Ashe','Widowmaker']),
 P('ChiYo','Support',kr,['Lucio','Brigitte']),P('Fielder','Support',kr,['Ana','Kiriko'])
],{region:'OWL',accolade:'2022 OWL CHAMPION'}),
T('Florida Mayhem · 2023',2023,'https://liquipedia.net/overwatch/Overwatch_League/2023',[
 P('SOMEONE','Tank',kr,['Winston','Ramattra']),P('MER1T','Damage',kr,['Sojourn','Ashe']),P('Checkmate','Damage',kr,['Genji','Mei']),P('WhoRU','Damage',kr,['Genji','Hanzo']),
 P('CH0R0NG','Support',kr,['Lucio','Brigitte']),P('Rupal','Support',us,['Baptiste','Ana']),P('MAKA','Support',kr,['Kiriko','Zenyatta'])
],{region:'OWL',accolade:'2023 OWL CHAMPION'}),
T('Houston Outlaws · 2023',2023,'https://liquipedia.net/overwatch/Overwatch_League/2023',[
 P('Fearless','Tank',kr,['Winston','Reinhardt']),P('BERNAR','Tank',kr,['Sigma','D.Va']),
 P('Happy','Damage',kr,['Sojourn','Ashe']),P('Pelican','Damage',kr,['Genji','Tracer']),
 P('Viol2t','Support',kr,['Lucio','Zenyatta']),P('Shu','Support',kr,['Ana','Baptiste'])
],{region:'OWL',accolade:'2023 OWL FINALIST'})
];
window.RIVALRY_VERIFIED_ROSTERS=Object.freeze(entries);
window.RIVALRY_ROSTER_FOR=function(teamName){
 return entries.find(x=>x.name.toLowerCase()===String(teamName).toLowerCase())||null;
};
window.RIVALRY_TEAM_STYLE=Object.freeze({
 'Twisted Minds':{primary:'#fca84f',secondary:'#191f29'},'ZETA DIVISION':{primary:'#a4b8ff',secondary:'#283251'},
 'Crazy Raccoon':{primary:'#f7c6c8',secondary:'#271f2e'},'Team Falcons':{primary:'#36b7a5',secondary:'#0b2b2d'},
 'T1':{primary:'#ec5a71',secondary:'#250d16'},'Weibo Gaming':{primary:'#e97070',secondary:'#32191b'},
 'Dallas Fuel':{primary:'#64b6ed',secondary:'#142e46'},'San Francisco Shock · 2019':{primary:'#f89f4a',secondary:'#232323'},
 'London Spitfire · 2018':{primary:'#55a3e4',secondary:'#1a3650'},'Shanghai Dragons · 2021':{primary:'#e75a61',secondary:'#26171a'},
 'Florida Mayhem · 2023':{primary:'#f6b1ca',secondary:'#28363a'},'VARREL':{primary:'#aeedc1',secondary:'#273b33'}
});
window.RIVALRY_ROSTER_DATA_NOTES={
 roles:'Roles and team membership are verified where sources explicitly list them; hero pools and simulation skill ratings are speculative approximations and not historical fact.',
 nationalities:'A null country indicates not independently verified. Certain player nationalities require further verification.',
 logos:'Official logo assets are not mirrored without a confirmed usable license. Team colors are a themed approximation.'
};
})();