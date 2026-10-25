/* Rivalry historical-team snapshots and league eras. Names identify an era for fantasy play.
   Sources are linked individually; historical entries without verified rosters use simulated players.
   Historical championship results: https://liquipedia.net/overwatch/Overwatch_League
   https://liquipedia.net/overwatch/Overwatch_Champions_Series */
(() => {
  'use strict';
  const sourceOWL='https://liquipedia.net/overwatch/Overwatch_League';
  const sourceOWCS='https://liquipedia.net/overwatch/Overwatch_Champions_Series';
  const source24='https://liquipedia.net/overwatch/Overwatch_Champions_Series/2024/World_Finals';
  const source25='https://liquipedia.net/overwatch/Overwatch_Champions_Series/2025/World_Finals';
  const franchises=[
    ['Atlanta Reign','ATL',2019,2023],['Boston Uprising','BOS',2018,2023],
    ['Chengdu Hunters','CDH',2019,2022],['Dallas Fuel','DAL',2018,2023],
    ['Florida Mayhem','FLM',2018,2023],['Guangzhou Charge','GZC',2019,2023],
    ['Hangzhou Spark','HZS',2019,2023],['Houston Outlaws','HOU',2018,2023],
    ['London Spitfire','LDN',2018,2023],['Los Angeles Gladiators','GLA',2018,2023],
    ['Los Angeles Valiant','LAV',2018,2023],['New York Excelsior','NYXL',2018,2023],
    ['San Francisco Shock','SFS',2018,2023],['Seoul Dynasty','SEO',2018,2023],
    ['Seoul Infernal','INF',2023,2023],['Shanghai Dragons','SHD',2018,2023],
    ['Toronto Defiant','TOR',2019,2023],['Vancouver Titans','VAN',2019,2023],
    ['Vegas Eternal','VEG',2023,2023],['Washington Justice','WAS',2019,2023],
    ['Philadelphia Fusion','PHI',2018,2022],['Paris Eternal','PAR',2019,2022]
  ];
  const owl=franchises.map(([name,tag,first,last])=>({
    name:name+' · OWL',base:name,tag,region:'OWL',era:'Overwatch League',first,last,
    season:first===last?String(first):first+'–'+last,players:[],source:sourceOWL
  }));
  const champs=[
    {year:2018,winner:'London Spitfire',tag:'LDN',roster:['Gesture','Fury','Profit','birdring','Bdosin','NUS'],mode:'6v6'},
    {year:2019,winner:'San Francisco Shock',tag:'SFS',roster:['super','smurf','ChoiHyoBin','sinatraa','Striker','Moth','Viol2t'],mode:'6v6'},
    {year:2020,winner:'San Francisco Shock',tag:'SFS',roster:[],mode:'6v6'},
    {year:2021,winner:'Shanghai Dragons',tag:'SHD',roster:[],mode:'6v6'},
    {year:2022,winner:'Dallas Fuel',tag:'DAL',roster:[],mode:'5v5'},
    {year:2023,winner:'Florida Mayhem',tag:'FLM',roster:[],mode:'5v5'},
    {year:2024,winner:'Team Falcons',tag:'FLC',roster:[],mode:'5v5'},
    {year:2025,winner:'Twisted Minds',tag:'TM',roster:[],mode:'5v5'}
  ];
  const championshipSnapshots=champs.filter(c=>c.year<=2023).map(c=>({
    name:c.winner+' · '+c.year,base:c.winner,tag:c.tag,region:'OWL',
    era:'Overwatch League',year:c.year,season:String(c.year),first:c.year,last:c.year,
    accolade:c.year+' OWL CHAMPIONS',players:c.roster,source:sourceOWL
  }));
  const owcs24=[
    ['Team Falcons','FLC'],['Crazy Raccoon','CR'],['Toronto Defiant','TOR'],
    ['NRG Shock','NRG'],['Twisted Minds','TM'],['NTMR','NTMR'],
    ['Spacestation Gaming','SSG'],['ENCE','ENCE'],['Ex Oblivione','EXO'],
    ['Virtus.pro','VP'],['Peace and Love','PAL'],['Team Peps','PEPS'],
    ['Timeless','TIME'],['M80','M80'],['Students of the Game','SOTG'],
    ['Citrus Nation','CIT'],['TSM','TSM'],['FLUFFY AIMERS','FLUF'],
    ['YETI','YETI'],['Poker Face','PF'],['VARREL','VAR'],
    ['INSOMNIA','INS'],['Nyam Gaming','NYAM'],['Bleed Esports','BLEED'],
    ['Honeypot','HONEY'],['DAF','DAF']
  ].map(([base,tag])=>({
    name:base+' · 2024',base,tag,region:'2024',era:'OWCS',year:2024,season:'2024',
    players:[],accolade:base==='Team Falcons'?'2024 WORLD CHAMPIONS':undefined,
    source:source24
  }));
  const owcs25=[
    ['Twisted Minds','TM'],['Al Qadsiah','QAD'],['Crazy Raccoon','CR'],
    ['Team Falcons','FLC'],['T1','T1'],['Weibo Gaming','WBG'],
    ['Team Liquid','TL'],['Spacestation Gaming','SSG'],['Team Peps','PEPS'],
    ['Geekay Esports','GK'],['Team CC','CC'],['VARREL','VL'],
    ['The Ultimates','ULT'],['Sakura Esports','SAK'],['REJECT','RJT'],
    ['Nosebleed Esports','NBE'],['WAE','WAE'],['Gen.G Esports','GEN']
  ].map(([base,tag])=>({
    name:base+' · 2025',base,tag,region:'2025',era:'OWCS',year:2025,season:'2025',
    players:[],accolade:base==='Twisted Minds'?'2025 WORLD CHAMPIONS':undefined,
    source:source25
  }));
  window.RIVALRY_CHAMPIONS=Object.freeze(champs);
  window.RIVALRY_HISTORICAL=Object.freeze([...owl,...championshipSnapshots,...owcs24,...owcs25]);
  window.RIVALRY_ARCHIVE_SOURCES=Object.freeze({
    OWL:sourceOWL,'2024':source24,'2025':source25,'2026':'https://esports.overwatch.com/en-us',
    wiki:'https://overwatch.fandom.com/wiki/Overwatch_Wiki',
    liquipedia:'https://liquipedia.net/overwatch/Main_Page',
    press:'https://blizzard.gamespress.com/Overwatch'
  });
  window.RIVALRY_OW_COMPS_CLASSIC=Object.freeze([
    {label:'CLASSIC DIVE',roles:['Winston','D.Va','Tracer','Genji','Lucio','Zenyatta'],
     roleNames:['TANK','TANK','DAMAGE','DAMAGE','SUPPORT','SUPPORT'],note:'Dive era • double tank'},
    {label:'GOATS',roles:['Reinhardt','Zarya','D.Va','Lucio','Brigitte','Zenyatta'],
     roleNames:['TANK','TANK','TANK','SUPPORT','SUPPORT','SUPPORT'],note:'2019 triple-tank sustain'},
    {label:'DOUBLE SHIELD',roles:['Orisa','Sigma','Ashe','Hanzo','Baptiste','Mercy'],
     roleNames:['TANK','TANK','DAMAGE','DAMAGE','SUPPORT','SUPPORT'],note:'2019–2021 poke and shield'},
    {label:'CLASSIC RUSH',roles:['Reinhardt','D.Va','Mei','Cassidy','Lucio','Baptiste'],
     roleNames:['TANK','TANK','DAMAGE','DAMAGE','SUPPORT','SUPPORT'],note:'Brawl around a double frontline'}
  ]);
  window.RIVALRY_OWCS=Object.freeze([...window.RIVALRY_OWCS,...window.RIVALRY_HISTORICAL]);
})();
