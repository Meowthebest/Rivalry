"""Collect attribution metadata from public competition pages; no binaries or credentials.
A missing/blocked page is recorded, not bypassed. Only fixed public HTTPS sources are fetched.
"""
import json, pathlib, time, urllib.request, urllib.parse
from bs4 import BeautifulSoup
sources = [
 'https://owtics.gg/en-US/esports/team',
 *['https://owtics.gg/en-US/esports/tournament/'+x for x in [
  '2026-owcs-emea-stage-3','2026-owcs-na-stage-3','2026-owcs-asia-korea-stage-3',
  '2026-owcs-asia-japan-stage-3','2026-owcs-china-stage-3','2026-owcs-asia-pacific-stage-3',
  '2024-owcs-world-finals','2025-owcs-world-finals','2026-owcs-midseason-championship']],
 'https://www.over.gg/teams/overwatch-league/',
 'https://www.over.gg/team/630/san-francisco-shock',
 'https://www.over.gg/team/635/london-spitfire'
]
rows, failures = [], []
for source in sources:
 try:
  req=urllib.request.Request(source,headers={'User-Agent':'RivalryFanSiteAssetAudit/1.0 (https://github.com/Meowthebest/Rivalry)'})
  with urllib.request.urlopen(req,timeout=18) as response:
   html=response.read(6000000).decode('utf-8','replace')
  soup=BeautifulSoup(html,'html.parser')
  for image in soup.select('img'):
   url=urllib.parse.urljoin(source,image.get('src',''))
   if not url.startswith('https://'): continue
   if not any(t in url for t in ['assets.owtics.gg/team/','owcdn.net/img/']): continue
   alt=(image.get('alt') or image.get('title') or '').strip()
   anchor=image.find_parent('a')
   rows.append({'name':alt,'url':url,'source':source,'link':urllib.parse.urljoin(source,anchor.get('href','')) if anchor else None,'label':anchor.get_text(' ',strip=True) if anchor else None})
  print(source, len(html), len(rows), flush=True)
 except Exception as exc:
  failures.append({'source':source,'error':str(exc)})
  print('UNAVAILABLE',source,str(exc),flush=True)
 time.sleep(1.5)
pathlib.Path('asset-audit.json').write_text(json.dumps({'checkedAt':'2026-10-25','records':rows,'failures':failures},indent=2),encoding='utf-8')
print('Logo metadata records:',len(rows))
