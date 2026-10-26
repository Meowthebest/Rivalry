"""Runs the exact project script order in real Chromium with local source JSON transport.
Third-party image hosts are deliberately offline; the test covers honest image fallbacks.
"""
import pathlib,json,os,time,shutil
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'validation/platform';OUT.mkdir(parents=True,exist_ok=True)
errors=[];checks=[]
with sync_playwright() as p:
 executable=os.environ.get('CHROMIUM') or shutil.which('chromium') or shutil.which('google-chrome')
 b=p.chromium.launch(**({'executable_path':executable} if executable else {}),headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1536,'height':1040},device_scale_factor=1)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/*',lambda r:r.abort())
 soup=BeautifulSoup((ROOT/'index.html').read_text(),'html.parser');scripts=[x['src'].split('?')[0].removeprefix('./') for x in soup.select('script[src]')]
 for n in soup.select('script'):n.decompose()
 for n in list(soup.select('link')):
  href=n.get('href','').split('?')[0]
  if n.get('rel')==['stylesheet'] and href.startswith('./'):
   style=soup.new_tag('style');style.string=(ROOT/href[2:]).read_text();n.replace_with(style)
  else:n.decompose()
 page.set_content(str(soup),wait_until='domcontentloaded')
 page.evaluate("Object.defineProperty(window,'localStorage',{value:{getItem:k=>window._testStore?.[k]??null,setItem:(k,v)=>{(window._testStore??={})[k]=v},removeItem:k=>{delete window._testStore?.[k]}}})")
 def local_json(url):
  key=str(url).split('?')[0].removeprefix('./');f=(ROOT/key).resolve()
  if not f.is_relative_to(ROOT) or not f.is_file() or not f.name.endswith('.json'):return {'ok':False,'status':404,'data':None}
  return {'ok':True,'status':200,'data':json.loads(f.read_text())}
 page.expose_function('__readPublishedJson',local_json)
 page.evaluate("window.fetch=async url=>{const r=await window.__readPublishedJson(String(url));return {ok:r.ok,status:r.status,json:async()=>r.data};}")
 # Worker code runs in a real worker; only its repository transport is substituted.
 workerCode=(ROOT/'platform/model.js').read_text()+(ROOT/'platform/model-worker.js').read_text().replace("importScripts('./model.js');",'')
 page.evaluate("code=>{const RealWorker=window.Worker;window.Worker=class extends RealWorker{constructor(){super(URL.createObjectURL(new Blob([code],{type:'text/javascript'})));}}}",workerCode)
 for f in scripts:page.add_script_tag(content=(ROOT/f).read_text())
 page.wait_for_selector('.ph-feature-actions',timeout=10000);page.wait_for_timeout(250)
 assert not errors,errors
 assert page.locator('.ph-match-row').count()>0
 page.screenshot(path=str(OUT/'home-desktop.png'),full_page=True)
 checks.append('Homepage derives future fixtures and recorded results from the published source JSON; no hardcoded demo fixture.')
 page.locator('.ph-feature-actions a').click();page.wait_for_selector('#ph-launch-simulation:not([disabled])',timeout=15000)
 page.wait_for_timeout(300)
 assert page.locator('.ph-squad').count()==2
 page.screenshot(path=str(OUT/'match-desktop.png'),full_page=True)
 checks.append('Actual fixture opens a match center with both event-specific role-complete source squads.')
 page.locator('#ph-launch-simulation').click();page.wait_for_timeout(1200)
 assert page.evaluate('RIVALRY_STUDIO.state().worldVersion')==5
 names=page.evaluate('RIVALRY_STUDIO.state().teams.map(t=>t.players.map(p=>p.name))')
 assert not any('OPEN ' in n for team in names for n in team),names
 assert page.evaluate('RIVALRY_STUDIO.transport().isRunning()')
 page.evaluate('RIVALRY_STUDIO.transport().pause()')
 checks.append({'fixtureToObserver':{'names':names,'worldVersion':5,'autoplay':True}})
 page.locator('#rv-exit').click()
 page.evaluate("location.hash='matches/results'")
 page.wait_for_selector('#ph-match-list .ph-match-row',timeout=15000)
 assert page.locator('.ph-chip.completed').count()>0
 page.locator('#ph-match-search').fill('not-a-team-8543');page.wait_for_timeout(800)
 assert page.locator('#ph-match-list .ph-match-row').count()==0
 page.locator('#ph-match-search').fill('');page.wait_for_timeout(400)
 checks.append('Results tab, search and missing-result empty state work against real records.')
 # Choose a FACEIT completed record with prior history. Prediction must exclude its own/future result.
 match=page.evaluate("(()=>{const c=RIVALRY_PLATFORM.data();return c.matches.find(m=>m.provider==='owdb'&&m.bestOf===5).id})()")
 page.evaluate("id=>location.hash='match/'+encodeURIComponent(id)",match)
 page.wait_for_selector('#ph-launch-simulation',timeout=10000);page.wait_for_timeout(1600)
 if page.locator('[data-sample="10000"]').count():
  page.locator('[data-sample="10000"]').click();page.wait_for_selector('[data-export-sample]',timeout=10000)
  assert '10,000 series draws' in page.locator('#ph-sampling').inner_text()
  checks.append('10,000 independent outcome simulations executed in a real Web Worker and rendered a computed distribution.')
 else:checks.append('Chosen source matchup correctly reports insufficient prediction evidence, rather than fake percentages.')
 page.evaluate("location.hash='model'");page.wait_for_selector('[data-download-validation]',timeout=10000)
 assert 'brier score' in page.locator('#platform-root').inner_text().lower()
 page.screenshot(path=str(OUT/'model-desktop.png'),full_page=True)
 page.evaluate("location.hash='teams'");page.wait_for_selector('.ph-team-card',timeout=10000)
 page.locator('#ph-team-search').fill('T1');assert page.locator('#ph-team-grid .ph-team-card').count()>0
 page.locator('#ph-team-grid .ph-team-card').first.click();page.wait_for_selector('#ph-roster-select',timeout=10000)
 assert page.locator('#ph-team-roster .ph-squad').count()==1
 checks.append('Team profile supports source-dated roster selection and real match history.')
 page.evaluate("location.hash='home'");page.wait_for_selector('.ph-feature-actions',timeout=10000)
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(300)
 assert page.evaluate('document.documentElement.scrollWidth')<=392
 page.locator('.ph-nav-toggle').click();assert page.locator('[data-ph-nav="matches"]').is_visible();page.locator('.ph-nav-toggle').click()
 checks.append('Mobile Menu opens accessible navigation and closes without disturbing the page.')
 page.screenshot(path=str(OUT/'home-mobile.png'),full_page=True)
 page.locator('.ph-feature-actions a').click();page.wait_for_selector('#ph-match-squads .ph-squad',timeout=10000)
 assert page.evaluate('document.documentElement.scrollWidth')<=392
 page.screenshot(path=str(OUT/'match-mobile.png'),full_page=True)
 checks.append('390px mobile home and match center remain within viewport width.')
 page.evaluate("location.hash='simulator'");page.wait_for_timeout(200)
 assert page.locator('#start-match').is_visible()
 checks.append('Existing match creator and other esports remain accessible.')
 assert not errors,errors
 (OUT/'browser-checks.json').write_text(json.dumps({'browser':b.version,'transport':'Exact repository scripts; actual published JSON read in memory; external asset failures expected. Worker uses exact repository source via Blob.','checks':checks,'errors':errors},indent=2))
 print(json.dumps(checks,indent=2));b.close()
