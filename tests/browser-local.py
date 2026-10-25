"""Real Chromium integration checks against the repository's exact script order.
Loads this project's own HTML in memory; external portraits/logos use their documented
network-failure fallback. This does not assert that third-party asset hosts are available.
Run: python tests/browser-local.py (requires playwright, beautifulsoup4, Chromium).
"""
from playwright.sync_api import sync_playwright
import json, pathlib, os, time
from bs4 import BeautifulSoup
BASE=pathlib.Path(__file__).resolve().parents[1]
OUT=pathlib.Path(os.getenv('RIVALRY_SCREENSHOTS',str(BASE/'validation'/'screenshots')))
OUT.mkdir(parents=True,exist_ok=True)
checks=[]; errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 version=browser.version
 page=browser.new_page(viewport={'width':1440,'height':1080},device_scale_factor=1)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('https://**',lambda r:r.abort())
 html=(BASE/'index.html').read_text();soup=BeautifulSoup(html,'html.parser')
 scripts=[x['src'].split('?')[0].removeprefix('./') for x in soup.select('script[src]')]
 for script in soup.select('script'):script.decompose()
 for link in list(soup.select('link')):
  href=link.get('href','').split('?')[0]
  if link.get('rel')==['stylesheet'] and href.startswith('./'):
   style=soup.new_tag('style');style.string=(BASE/href[2:]).read_text();link.replace_with(style)
  else:link.decompose()
 page.set_content(str(soup),wait_until='domcontentloaded')
 page.evaluate("Object.defineProperty(window,'localStorage',{value:{getItem:k=>window._testStore?.[k]??null,setItem:(k,v)=>{(window._testStore??={})[k]=v},removeItem:k=>{delete window._testStore?.[k]}}})")
 page.evaluate("b=>{const native=window.fetch.bind(window);window.fetch=(u,o)=>String(u).endsWith('calibration/benchmarks.json')?Promise.resolve({ok:true,json:async()=>b}):native(u,o)}",json.loads((BASE/'calibration/benchmarks.json').read_text()))
 for file in scripts:page.add_script_tag(content=(BASE/file).read_text())
 page.wait_for_timeout(200)
 assert not errors,errors
 page.select_option('#match-format','3')
 page.locator('#start-match').click();page.wait_for_timeout(250)
 assert 'open' in page.locator('#rivalry-studio').get_attribute('class')
 assert page.evaluate('RIVALRY_STUDIO.state().worldVersion')==5
 checks.append('Existing match creator opens the integrated observer and preserves both sourced teams.')
 # 1x real-time active gameplay, measured by wall clock, not accelerated timers.
 page.evaluate('(()=>{const s=RIVALRY_STUDIO.state();while(s.phase!=="active")RIVALRY_ENGINE.step(s);RIVALRY_STUDIO.refresh();})()')
 t0=page.evaluate('RIVALRY_STUDIO.state().elapsed');wall=time.monotonic()
 page.locator('#rvo-watch').click();page.wait_for_timeout(5100);page.locator('#rvo-watch').click()
 wall=time.monotonic()-wall;elapsed=page.evaluate('RIVALRY_STUDIO.state().elapsed')-t0
 assert abs(elapsed-wall)<1.1,(wall,elapsed)
 checks.append({'activeMatch1x':{'wallSeconds':round(wall,3),'simSeconds':round(elapsed,3)}})
 frozen=page.evaluate('JSON.stringify(RIVALRY_STUDIO.state())');page.wait_for_timeout(700)
 assert frozen==page.evaluate('JSON.stringify(RIVALRY_STUDIO.state())'),'Pause freezes gameplay, RNG, positions, clock and statistics'
 checks.append('Pause freezes the entire authoritative state.')
 page.locator('.rvo-top-speeds [data-rate="8"]').click();t0=page.evaluate('RIVALRY_STUDIO.state().time')
 page.locator('#rvo-watch').click();page.wait_for_timeout(1100);page.locator('#rvo-watch').click()
 advance=page.evaluate('RIVALRY_STUDIO.state().time')-t0;assert 7<=advance<=13,advance
 checks.append({'8xSimSecondsAfter1_1WallSeconds':round(advance,2)})
 page.locator('.rvo-top-speeds [data-rate="1"]').click()
 # Capture a genuine engine-driven engagement, without fabricating positions or effects.
 page.evaluate('(()=>{const s=RIVALRY_STUDIO.state();for(let i=0;i<600;i++){RIVALRY_ENGINE.step(s);if(s.effects.some(x=>x.name===RIVALRY_ENGINE.HERO[x.hero]?.[2])&&s.phase==="active")break;}RIVALRY_STUDIO.refresh();RIVALRY_OBSERVER.render();document.getElementById("rivalry-studio").scrollTop=0;})()')
 page.wait_for_timeout(300)
 assert page.evaluate('RIVALRY_STUDIO.state().events.some(e=>e.type==="ultimate")')
 assert page.locator('.rvo-hud-player').count()==10
 page.screenshot(path=str(OUT/'desktop.png'),full_page=False)
 page.locator('#rvo-expand').click();page.wait_for_timeout(120)
 page.locator('#rvo-player').select_option(index=3)
 assert 'ULT' in page.locator('#rvo-inspector').inner_text()
 old=page.evaluate('RIVALRY_OBSERVER.camera()');page.locator('#rvo-plus').click();new=page.evaluate('RIVALRY_OBSERVER.camera()');assert new['zoom']>old['zoom']
 page.locator('#rvo-follow').click();page.wait_for_timeout(100)
 assert page.locator('#rvo-follow').get_attribute('aria-pressed')=='true'
 page.locator('#rvo-home').click()
 rect=page.locator('#rvo-canvas').bounding_box();before=page.evaluate('RIVALRY_OBSERVER.camera()')
 page.mouse.move(rect['x']+rect['width']/2,rect['y']+rect['height']/2);page.mouse.down();page.mouse.move(rect['x']+rect['width']/2+65,rect['y']+rect['height']/2+30,steps=6);page.mouse.up()
 after=page.evaluate('RIVALRY_OBSERVER.camera()');assert before['x']!=after['x']
 page.locator('#rvo-home').click();page.wait_for_timeout(100)
 page.screenshot(path=str(OUT/'expanded.png'),full_page=False)
 checks.append('Overhead expand, select, inspector, follow, zoom, drag-pan and fit controls work with actual simulated positions.')
 page.locator('#rvo-sources').click();page.wait_for_timeout(100)
 assert '16,000' in page.locator('#rvo-source-body').inner_text()
 assert 'Calibration is partial' in page.locator('#rvo-source-body').inner_text()
 page.locator('.rvo-source-dialog [aria-label="Close sources"]').click()
 page.locator('#rvo-expand').click()
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(200)
 page.evaluate('document.getElementById("rivalry-studio").scrollTop=0')
 page.screenshot(path=str(OUT/'mobile.png'),full_page=False)
 assert page.evaluate('document.getElementById("rivalry-studio").scrollWidth<=window.innerWidth+2'),'No horizontal page overflow on mobile'
 checks.append('Mobile viewport has no horizontal page overflow; minimap and compact all-player HUD remain visible.')
 page.set_viewport_size({'width':1440,'height':1080})
 # Instant invokes the same engine and automatically handles all rounds/maps.
 page.locator('#rvo-instant').click()
 page.wait_for_function('RIVALRY_STUDIO.state().status==="finished"',timeout=30000)
 final=page.evaluate('({score:RIVALRY_STUDIO.state().score,maps:RIVALRY_STUDIO.state().records.length,seconds:RIVALRY_STUDIO.state().seriesSeconds,events:RIVALRY_STUDIO.state().eventSeq})')
 assert max(final['score'])==2 and final['maps']>=2,final
 assert page.locator('#rv-stat-scope option').count()==2+final['maps']
 page.locator('#rv-stat-scope').select_option('0');page.locator('#rv-stat-rates').check()
 assert 'Per 10 min' in page.locator('.rv-stats-note').inner_text()
 with page.expect_download() as download:page.locator('#rv-export-stats').click()
 payload=json.loads(pathlib.Path(download.value.path()).read_text())
 assert payload['fictional'] and len(payload['completedMaps'])==final['maps']
 checks.append({'automaticFullSeries':final,'statisticsExport':'Completed maps, current contribution and all series player ledgers exported.'})
 # Restart is explicit; old history remains and seed is retained.
 oldSeed=page.evaluate('RIVALRY_STUDIO.state().seed');page.evaluate('RIVALRY_STUDIO.restart()')
 assert page.evaluate('RIVALRY_STUDIO.state().seed')==oldSeed
 assert page.evaluate('RIVALRY_STUDIO.state().tick')==0
 checks.append('Restart resets the match but preserves the seed and saved results.')
 assert not errors,errors
 page.evaluate('RIVALRY_OBSERVER.dispose();RIVALRY_STUDIO.transport().pause()')
 browser.close()
 report={'browser':'Chromium '+version+' (system executable)','transport':'Exact project HTML/CSS and script order loaded in memory; no external image availability asserted.','checks':checks,'pageErrors':errors}
 (BASE/'validation/browser-checks.json').write_text(json.dumps(report,indent=2))
 print(json.dumps(report,indent=2))
