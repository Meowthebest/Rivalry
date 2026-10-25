// Regression checks for the user's Team 2 report, not only a single default matchup.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
(async()=>{
 const html=fs.readFileSync('index.html','utf8');
 const dom=new JSDOM(html,{url:'https://rivalry.test/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,errors=[];
 // Track scheduled rendering so jsdom is not asked to paint a destroyed document.
 const pendingFrames=new Set(),raf=w.requestAnimationFrame.bind(w),caf=w.cancelAnimationFrame.bind(w);
 w.requestAnimationFrame=callback=>{const id=raf(time=>{pendingFrames.delete(id);callback(time)});pendingFrames.add(id);return id;};
 w.HTMLCanvasElement.prototype.getContext=()=>null;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.fetch=async()=>({ok:true,json:async()=>[]});w.alert=()=>{};
 w.addEventListener('error',e=>{errors.push(e.message);e.preventDefault()});
 const scripts=[...html.matchAll(/<script src="\.\/([^"?]+)(?:\?[^" ]*)?"><\/script>/g)].map(m=>m[1]);
 for(const path of scripts)w.eval(fs.readFileSync(path,'utf8'));
 w.RIVALRY_LINEUP_UI.boot();w.RIVALRY_LOGOS.boot();
 const $=s=>w.document.querySelector(s),event=()=>new w.Event('change',{bubbles:true});
 const next=()=>new Promise(resolve=>setTimeout(resolve,20));
 $('#start-match').click();await next();
 let state=w.RIVALRY_STUDIO.state();
 assert.ok(state.teams.every(t=>t.players.every(p=>p.verified)),'Both teams have sourced real names');
 assert.equal(state.teams[0].players.find(p=>p.name==='FunnyAstro').hero,'Lucio');
 assert.equal(state.teams[1].players.find(p=>p.name==='Proper').hero,'Tracer');
 assert.equal($('#rv-lineup-config').querySelectorAll('.rvl-side-tabs button').length,2);
 $('#rv-lineup-config').querySelectorAll('.rvl-side-tabs button')[1].click();
 assert.ok($('.rvl-selected-team').textContent.includes('ZETA DIVISION'));
 const sub=$('select[aria-label="Team 2 Tank player 1"]');sub.value='Mealgaru';sub.dispatchEvent(event());await next();
 assert.equal(w.RIVALRY_STUDIO.state().teams[1].players[0].name,'Mealgaru','Opponent substitution is not applied to own team');
 assert.equal(w.RIVALRY_STUDIO.state().teams[0].players[0].name,'TVNT');
 assert.equal($('#rv-logo-b img').alt,'ZETA DIVISION team logo','Real team logo reference rendered');
 const bad=$('#rv-logo-b img');bad.dispatchEvent(new w.Event('error'));
 assert.ok($('#rv-logo-b').getAttribute('aria-label').includes('unavailable'),'Broken images have an honest fallback');
 $('#rv-exit').click();
 // Programmatic selection can omit change events. A stale 2026 dropdown must not win.
 $('#team-b').value='San Francisco Shock · 2019';$('#season-b').value='2026';
 $('#start-match').click();await next();state=w.RIVALRY_STUDIO.state();
 assert.equal(state.teams[1].season,2019,'Historical Team 2 year wins over stale dropdown');
 assert.ok(state.teams[1].players.every(p=>p.verified));
 assert.ok(state.teams[1].players.some(p=>p.name==='Moth'));
 $('#rv-exit').click();$('#team-b').value='JD Gaming';$('#team-b').dispatchEvent(event());
 $('#start-match').click();await next();
 assert.ok($('#rvl-roster-alert').textContent.includes('missing 1 Support'),'Incomplete roster is disclosed before match');
 assert.ok(!$('#rivalry-studio').classList.contains('open'),'No silent placeholder match');
 $('#team-b').value='ZETA DIVISION';$('#team-b').dispatchEvent(event());$('#start-match').click();await next();
 assert.equal(w.RIVALRY_STUDIO.state().teams[1].season,2026);
 // A legacy save is never silently relabelled with different players and the same event log.
 delete w.RIVALRY_STUDIO.state().lineupRevision;w.RIVALRY_LINEUP_UI.renderPanel(true);
 assert.ok($('#rv-lineup-config').textContent.includes('saved match predates'));
 await next();
 assert.equal(errors.length,0,errors.join('\n'));
 w.requestAnimationFrame=()=>0;
 for(const id of pendingFrames)caf(id);
 pendingFrames.clear();
 dom.window.close();console.log('PASS: Team2 stale-year regression, separate substitutions, player preferences, logos, missing-roster preflight, save migration notice');
})().catch(e=>{console.error(e);process.exitCode=1});
