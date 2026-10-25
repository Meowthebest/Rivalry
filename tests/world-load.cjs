const fs=require('node:fs'),vm=require('node:vm');
module.exports=()=>{const window={},context=vm.createContext({window,console,setTimeout,clearTimeout});
for(const path of ['teams.js','archive.js','data/pacific-2026.js','data/verified-rosters.js','data/stage3-rosters.js','data/asia-stage3-rosters.js','data/extra-rosters-2026.js','data/historical-lineups.js','engine/overwatch-sim.js','data/heroes-2026.js','engine/player-lineups.js','engine/tactical-map.js','engine/world-sim.js','engine/playback-clock.js'])vm.runInContext(fs.readFileSync(path,'utf8'),context,{filename:path});
return window;};
