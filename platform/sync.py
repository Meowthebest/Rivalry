"""Permitted Rivalry ingestion. OWDB's explicit public download, Liquipedia MediaWiki
API (one parse/31s, gzip, contact UA), and optional authenticated FACEIT Data API.
No OWTV HTML crawling, unofficial private endpoints, credentials in output, or guessed results.
Run: python platform/sync.py --offline-dir /path/to/audit (reproduce archived inputs)
"""
from __future__ import annotations
import argparse, collections, datetime as dt, gzip, hashlib, json, os, pathlib, re, sqlite3, time, urllib.request, urllib.error, urllib.parse
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1]
CACHE=ROOT/'.platform-cache'; OUT=ROOT/'platform/data'; UA='RivalryFanPlatform/1.0 (https://github.com/Meowthebest/Rivalry; public noncommercial esports data)'
LP='https://liquipedia.net/overwatch/'; OWDB='https://owdb.io/faceit.sqlite3.gz'
PAGES=[('EMEA','Overwatch_Champions_Series/2026/EMEA/Stage_3'),('NA','Overwatch_Champions_Series/2026/NA/Stage_3'),('Korea','Overwatch_Champions_Series/2026/Asia/Stage_3/Korea'),('Japan','Overwatch_Champions_Series/2026/Asia/Stage_3/Japan'),('China','Overwatch_Champions_Series/2026/China/Stage_3'),('Pacific','Overwatch_Champions_Series/2026/Asia/Stage_3/Pacific')]
PAGES += [(region,page.replace('Stage_3','Stage_2')) for region,page in PAGES.copy()]
def now():return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
def stamp(v):
    if v is None or v=='':return None
    try:
        if isinstance(v,(int,float)) or str(v).isdigit():return dt.datetime.fromtimestamp(float(v),dt.timezone.utc).isoformat().replace('+00:00','Z')
        d=dt.datetime.fromisoformat(str(v).replace('Z','+00:00'))
        if d.tzinfo is None:return None
        return d.astimezone(dt.timezone.utc).isoformat().replace('+00:00','Z')
    except (ValueError,TypeError,OverflowError):return None
def ident(prefix,value):return prefix+':'+hashlib.sha256(str(value).encode()).hexdigest()[:20]
def safeurl(value,base=None):
    u=urllib.parse.urljoin(base or '',str(value or ''))
    return u if urllib.parse.urlparse(u).scheme=='https' and not urllib.parse.urlparse(u).username else None

def read_json(p,default):
    try:return json.loads(p.read_text())
    except (OSError,ValueError):return default

def atomic(p,data):
    p.parent.mkdir(parents=True,exist_ok=True);q=p.with_suffix(p.suffix+'.tmp');q.write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False));q.replace(p)

class Fetcher:
    def __init__(self):self.last_lp=0;self.session=urllib.request.build_opener()
    def get(self,key,url,ttl=1800,token=None):
        CACHE.mkdir(exist_ok=True);meta=read_json(CACHE/(key+'.meta.json'),{});p=CACHE/(key+'.bin');check=now()
        if p.exists() and time.time()-meta.get('checkedEpoch',0)<ttl:return p.read_bytes(),{**meta,'cache':'ttl'}
        if 'liquipedia.net' in url:
            time.sleep(max(0,31-(time.monotonic()-self.last_lp)));self.last_lp=time.monotonic()
        headers={'User-Agent':UA,'Accept-Encoding':'gzip'}
        if meta.get('etag'):headers['If-None-Match']=meta['etag']
        if token:headers['Authorization']='Bearer '+token
        try:
            with self.session.open(urllib.request.Request(url,headers=headers),timeout=45) as r:
                raw=r.read(30_000_001)
                if len(raw)>30_000_000:raise ValueError('Source exceeds 30 MB bound')
                if r.headers.get('Content-Encoding')=='gzip':raw=gzip.decompress(raw)
                meta={'source':url,'retrievedAt':check,'checkedAt':check,'checkedEpoch':time.time(),'etag':r.headers.get('ETag'),'sha256':hashlib.sha256(raw).hexdigest(),'state':'available'}
                p.write_bytes(raw);atomic(CACHE/(key+'.meta.json'),meta);return raw,meta
        except urllib.error.HTTPError as e:
            if e.code==304 and p.exists():
                meta.update(checkedAt=check,checkedEpoch=time.time(),state='available');atomic(CACHE/(key+'.meta.json'),meta);return p.read_bytes(),meta
            error='HTTP '+str(e.code) # never serialize headers/keys
        except Exception as e:error=type(e).__name__+': '+str(e)[:180]
        if p.exists():return p.read_bytes(),{**meta,'state':'stale','lastAttemptAt':check,'error':error}
        raise RuntimeError(error)

class Catalog:
    def __init__(self):self.teams={};self.events={};self.matches={};self.players={};self.rosters={};self.sources=[];self.warnings=[];self.matchstats=collections.defaultdict(list)
    def merge(self,m):
        if not m.get('id') or len(m.get('teamIds',[]))!=2 or m['teamIds'][0]==m['teamIds'][1]:return
        old=self.matches.get(m['id'])
        if old and old['status']=='completed' and m['status']!='completed':return
        self.matches[m['id']]={**(old or {}),**m}
        if old and not m.get('maps'):self.matches[m['id']]['maps']=old.get('maps',[])
        if old and m.get('bestOf') is None:self.matches[m['id']]['bestOf']=old.get('bestOf')
    def result(self):return {'schemaVersion':1,'generatedAt':now(),'teams':list(self.teams.values()),'events':list(self.events.values()),'matches':list(self.matches.values()),'players':list(self.players.values()),'rosters':list(self.rosters.values()),'sources':self.sources,'warnings':self.warnings,'coverage':{'notComplete':True,'noHeroPlaytime':True,'noCoordinates':True,'rosterSnapshotsNotTransfers':True}}

def ingest_owdb(cat,path,meta):
    c=sqlite3.connect('file:'+str(path.resolve())+'?mode=ro',uri=True);c.row_factory=sqlite3.Row
    required={'matches':{'id','status','faction1_team_id','faction2_team_id','fetched_at'},'games':{'match_id','game_no','winner_faction'},'round_players':{'match_id','team_id','player_id','role'}}
    for table,cols in required.items():
        if not cols <= {r[1] for r in c.execute('pragma table_info('+table+')')}:raise ValueError('OWDB schema drift: '+table)
    for t in c.execute('select * from teams'):
        id='faceit:'+t['id'];cat.teams[id]={'id':id,'name':t['name'] or 'Unnamed team','logo':safeurl(t['avatar_url']),'source':'https://www.faceit.com/en/teams/'+t['id'],'updatedAt':meta['retrievedAt'],'verification':'source-reported','nameIsCurrent':True,'regions':[]}
    for e in c.execute('select * from championships'):
        name=e['name'] or 'FACEIT League';region=next((x for x in ['EMEA','NA','SA','OCE','Asia'] if re.search(r'\b'+x+r'\b',name)),e['region'] or 'Unknown');id='faceit:'+e['id']
        cat.events[id]={'id':id,'name':name,'region':region,'source':'https://www.faceit.com/en/championship/'+e['id'],'updatedAt':meta['retrievedAt'],'verification':'source-reported','circuit':'FACEIT League'}
    allplayers={r['id']:dict(r) for r in c.execute('select * from players')}
    mapnames={r['guid']:r['name'] for r in c.execute('select * from maps')};games=collections.defaultdict(list)
    for g in c.execute('select * from games order by match_id,game_no'):
        games[g['match_id']].append({'number':g['game_no'],'name':mapnames.get(g['map_guid']),'mode':g['map_category'],'scores':[g['faction1_score'],g['faction2_score']],'winner':{'faction1':0,'faction2':1}.get(g['winner_faction']),'restarted':bool(g['was_restarted'])})
    matches=[dict(r) for r in c.execute('select * from matches')];md={m['id']:m for m in matches};lineups=collections.defaultdict(dict)
    # Public nickname and role as seen on a match scoreboard. No nationality or current contract inferred.
    for r in c.execute('select * from round_players order by match_id,game_no'):
        if r['team_id'] is None or r['role'] not in ['Tank','Damage','Support']:continue
        m=md.get(r['match_id']);player=allplayers.get(r['player_id'])
        if not m or not player:continue
        id='faceit:'+r['player_id'];name=player['nickname'] or player['game_name'] or 'Unnamed player';source='https://www.faceit.com/en/ow2/room/'+m['id']
        rec=cat.players.setdefault(id,{'id':id,'name':name,'nationality':None,'heroUsage':None,'source':source,'verification':'observed-match-role','updatedAt':stamp(m['fetched_at']),'observations':[],'statistics':{'maps':0,**{k:0 for k in ['eliminations','deaths','assists','damage','healing','mitigated']}}})
        key=(m['id'],r['game_no'],r['team_id']);lineups[key][id]={'id':id,'name':name,'role':r['role'],'source':source}
        if m['status']=='FINISHED' and not m['forfeit'] and not any(g['number']==r['game_no'] and g['restarted'] for g in games[m['id']]) and r['stats_captured'] and all(r[x] is not None for x in ['eliminations','deaths','assists','damage','healing','damage_mitigated']):
            cat.matchstats['faceit:'+m['id']].append({'playerId':id,'name':name,'teamId':'faceit:'+r['team_id'],'mapNumber':r['game_no'],'role':r['role'],**{k:r[col] for k,col in [('eliminations','eliminations'),('deaths','deaths'),('assists','assists'),('damage','damage'),('healing','healing'),('mitigated','damage_mitigated')]}})
            rec['statistics']['maps']+=1
            for k,column in [('eliminations','eliminations'),('deaths','deaths'),('assists','assists'),('damage','damage'),('healing','healing'),('mitigated','damage_mitigated')]:rec['statistics'][k]+=r[column]
    # Keep the latest complete 1/2/2 observed lineup per series/team. Preserve date and evidence type.
    for (mid,num,tid),group in lineups.items():
        counts=collections.Counter(p['role'] for p in group.values());m=md[mid]
        if len(group)!=5 or counts!=dict(Tank=1,Damage=2,Support=2) or not stamp(m['started_at']):continue
        rid='faceit-lineup:'+mid+':'+tid
        roster={'id':rid,'teamId':'faceit:'+tid,'observedAt':stamp(m['started_at']),'matchId':'faceit:'+mid,'players':list(group.values()),'source':'https://www.faceit.com/en/ow2/room/'+mid,'verification':'observed-lineup','updatedAt':stamp(m['fetched_at']),'notCurrentRoster':True}
        cat.rosters[rid]=roster
    for r in cat.rosters.values():
        for p in r['players']:
            if p['id'] in cat.players:cat.players[p['id']]['observations'].append({'teamId':r['teamId'],'at':r['observedAt'],'role':p['role'],'matchId':r['matchId']})
    for p in cat.players.values():p['observations']=sorted(p['observations'],key=lambda x:x['at'])[-12:]
    states={'FINISHED':'completed','ONGOING':'live','LIVE':'live','SCHEDULED':'scheduled','READY':'scheduled','CANCELLED':'cancelled','ABORTED':'cancelled','POSTPONED':'postponed'}
    for m in matches:
        ids=['faceit:'+str(m['faction1_team_id']),'faceit:'+str(m['faction2_team_id'])]
        if not all(i in cat.teams for i in ids):continue
        maps=games[m['id']];status=states.get(m['status'],'unconfirmed');winner={'faction1':0,'faction2':1}.get(m['winner_faction']);score=None
        if maps and m['best_of'] in [3,5,7,9] and all(x['winner'] is not None for x in maps if not x['restarted']):
            candidate=[sum(x['winner']==i for x in maps if not x['restarted']) for i in [0,1]]
            need=m['best_of']//2+1
            if max(candidate)==need and min(candidate)<need and winner==candidate.index(max(candidate)):score=candidate
        # Recorded maps may be incomplete; never turn partial 1-1 captures into a final series score.
        event=cat.events.get('faceit:'+m['championship_id']);source='https://www.faceit.com/en/ow2/room/'+m['id']
        cat.merge({'id':'faceit:'+m['id'],'statsResource':'./platform/data/matches/'+ident('m','faceit:'+m['id']).split(':')[1]+'.json','provider':'owdb','teamIds':ids,'eventId':'faceit:'+m['championship_id'],'region':event['region'] if event else 'Unknown','bestOf':m['best_of'],'round':m['round'],'status':status,'sourceStatus':m['status'],'scheduledAt':stamp(m['scheduled_at']),'startedAt':stamp(m['started_at']),'finishedAt':stamp(m['finished_at']),'updatedAt':stamp(m['fetched_at']),'retrievedAt':meta['retrievedAt'],'winner':winner,'scores':score,'forfeit':bool(m['forfeit']),'maps':maps,'source':source,'verification':'source-reported','streams':[]})
        for id in ids:
            if event and event['region'] not in cat.teams[id]['regions']:cat.teams[id]['regions'].append(event['region'])
    cat.sources.append({'id':'owdb','name':'OWDB public FACEIT-derived download','url':'https://owdb.io/data','state':meta.get('state','available'),'retrievedAt':meta['retrievedAt'],'checkedAt':meta.get('checkedAt',meta['retrievedAt']),'sha256':meta.get('sha256'),'records':len(matches),'note':'Not official FACEIT data. Team/player labels are current names; IDs are stable. Role observations are not transfer records. No hero playtime or per-map duration.'});c.close()

def ingest_lp(cat,body,page,region,meta):
    """Only parse the documented MediaWiki API's response; never fetch wiki HTML pages.
    Read fixture facts and event-specific participant roster cards. No roster union by year.
    A result without a completion timestamp stays out of chronological rating validation.
    """
    obj=json.loads(body)
    if 'error' in obj:raise ValueError('MediaWiki: '+str(obj['error'].get('code')))
    html=obj.get('parse',{}).get('text');html=html.get('*') if isinstance(html,dict) else html
    if not isinstance(html,str):raise ValueError('MediaWiki parse.text schema missing')
    soup=BeautifulSoup(html,'html.parser');source=LP+page;eid=ident('lp-event',page)
    title=obj['parse'].get('title',page).replace('_',' ')
    stage=re.search(r'Stage_(\d+)',page);short='OWCS 2026 · '+region+' Stage '+stage[1] if '/2026/' in page and stage else title
    logo=soup.select_one('.infobox-image .team-template-darkmode img') or soup.select_one('.infobox-image img')
    cat.events[eid]={'id':eid,'name':short,'fullName':title,'region':region,'source':source,'verification':'source-reported','updatedAt':meta['retrievedAt'],'circuit':'OWCS' if 'Champions_Series' in page else 'Competition','logo':safeurl(logo.get('src'),'https://liquipedia.net') if logo else None,'season':2026 if '/2026/' in page else None}
    def team_node(n):
        if n is None:return None
        a=n.select_one('.name a[title]') or n.select_one('.team-template-text a') or n.select_one('a[title]')
        name=(a.get('title') if a else n.get_text(' ',strip=True)).strip()
        if not name or name.upper() in ['TBD','BYE','TBA'] or re.search(r'^(Winner|Loser|Team \d)',name):return None
        name=re.sub(r' \(page does not exist\)$','',name)
        link=safeurl(a.get('href'),LP) if a else source
        id=ident('lp-team',link or name)
        logo=n.select_one('.team-template-darkmode img') or n.select_one('img')
        url=safeurl(logo.get('src'), 'https://liquipedia.net') if logo else None
        if url and ('default' in url.lower() or '/flags/' in url.lower()):url=None
        old=cat.teams.get(id,{})
        cat.teams[id]={'id':id,'name':name,'logo':url or old.get('logo'),'regions':list(set(old.get('regions',[])+[region])),'source':link,'updatedAt':meta['retrievedAt'],'verification':'source-reported','license':'CC-BY-SA-3.0; logo rights separate','provider':'liquipedia'}
        return id
    roster_count=0
    for card in soup.select('.team-participant-card'):
        team=team_node(card.select_one('.team-participant-card__opponent .block-team') or card.select_one('.block-team'))
        if not team:continue
        people={}
        for row in card.select('.team-participant-card__member'):
            role_img=row.select_one('.team-participant-card__member-role-left img')
            role={'DPS':'Damage','Damage':'Damage','Support':'Support','Tank':'Tank'}.get(role_img.get('alt') or role_img.get('title')) if role_img else None
            a=row.select_one('.team-participant-card__member-name .name a')
            if not a or not role:continue
            name=a.get_text(' ',strip=True);url=safeurl(a.get('href'),LP)
            if not name or not url:continue
            pid=ident('lp-player',url);flag=row.select_one('.flag img');nationality=(flag.get('title') or flag.get('alt')) if flag else None
            person={'id':pid,'name':name,'role':role,'country':nationality,'source':url}
            people[pid]=person
            r=cat.players.setdefault(pid,{'id':pid,'name':name,'nationality':nationality,'heroUsage':None,'source':url,'updatedAt':meta['retrievedAt'],'verification':'event-roster','observations':[],'statistics':None})
            r['observations'].append({'teamId':team,'at':meta['retrievedAt'],'role':role,'eventId':eid,'kind':'event-participation-not-transfer'})
        if people:
            rid=ident('lp-roster',eid+'|'+team)
            cat.rosters[rid]={'id':rid,'teamId':team,'eventId':eid,'season':cat.events[eid]['season'],'observedAt':meta['retrievedAt'],'players':list(people.values()),'source':source+'#Participants','verification':'event-roster','updatedAt':meta['retrievedAt'],'notCurrentRoster':True,'note':'Published participant squad for this event; starting five and later transfers not confirmed.'}
            roster_count+=1
    count=0;seen=set();encounters=collections.Counter()
    for popup in soup.select('.brkts-match-info-popup')+soup.select('.match-info--vertical'):
        ops=popup.select('.match-info-header-opponent') or popup.select('.match-info-opponent-identity')
        if len(ops)!=2:continue
        a,b=(team_node(n) for n in ops)
        if not a or not b or a==b:continue
        timer=popup.select('[data-timestamp]');timer=timer[0] if timer else None
        date=stamp(timer.get('data-timestamp')) if timer else None
        scores_nodes=popup.select('.match-info-header-scoreholder-score') or popup.select('.match-info-opponent-score')
        scores_text=[x.get_text(strip=True) for x in scores_nodes]
        scores=[int(x) for x in scores_text] if len(scores_text)==2 and all(x.isdigit() for x in scores_text) else None
        whole=popup.get_text(' ',strip=True);best_match=re.search(r'Bo(\d+)',whole,re.I);best=int(best_match[1]) if best_match else None
        source_finished=timer and timer.get('data-finished')=='finished'
        completed=bool(scores and scores[0]!=scores[1] and ((best and max(scores)>=best//2+1) or source_finished))
        status='completed' if completed else 'scheduled'
        if re.search(r'\bpostponed\b',whole,re.I):status='postponed'
        if re.search(r'\bcancelled\b',whole,re.I):status='cancelled'
        # A past timestamp alone NEVER proves that a match is live or completed.
        duplicate=(a,b,date,tuple(scores or []))
        if duplicate in seen:continue
        seen.add(duplicate);encounters[(a,b)]+=1
        native=popup.get('data-match-id') or (popup.find_parent(attrs={'data-match-id':True}) or {}).get('data-match-id')
        key=ident('lp-match',eid+'|'+(native or a+'|'+b+'|'+str(date)+'|'+str(encounters[(a,b)])))
        maps=[]
        for row in popup.select('.brkts-popup-body-grid-row'):
            detail=row.select_one('.brkts-popup-body-grid-row-detail')
            if not detail:continue
            cells=detail.select('.brkts-popup-spaced')
            if len(cells)<3:continue
            links=cells[1].select('a[title]');name=links[-1].get('title') if links else None
            mode=links[0].get('title') if len(links)>1 else None
            results=row.select('[data-label-type]');win=[i for i,v in enumerate(results) if v.get('data-label-type')=='result-win']
            maps.append({'number':len(maps)+1,'name':name,'mode':mode,'scores':[cells[0].get_text(' ',strip=True),cells[2].get_text(' ',strip=True)],'winner':win[0] if len(win)==1 and win[0]<2 else None,'restarted':False})
        streams=list(dict.fromkeys(safeurl(x.get('href'),LP) for x in popup.select('.match-info-links a') if 'Stream' in x.get('href','') or 'twitch.tv' in x.get('href','') or 'youtube.com' in x.get('href','')))
        text_time=timer.get_text(' ',strip=True) if timer else None
        precision='date' if text_time and '00:00' in text_time else 'minute' if date else 'unknown'
        cat.merge({'id':key,'completedObservedAt':meta['retrievedAt'] if completed else None,'identityBasis':'provider-match-id' if native else 'derived-event-opponents-date-reconciled-on-refresh','provider':'liquipedia','teamIds':[a,b],'eventId':eid,'region':region,'bestOf':best,'status':status,'sourceStatus':'finished' if completed else 'scheduled','scheduledAt':date,'sourceTimeText':text_time,'timePrecision':precision,'sourceDate':re.sub(r' -.*','',text_time or ''),'startedAt':None,'finishedAt':None,'updatedAt':meta['retrievedAt'],'verifiedAt':meta.get('checkedAt',meta['retrievedAt']),'retrievedAt':meta['retrievedAt'],'winner':(0 if scores[0]>scores[1] else 1) if completed else None,'scores':scores,'forfeit':False,'maps':maps,'source':source,'verification':'source-reported','streams':streams})
        count+=1
    if not count and not roster_count:raise ValueError('MediaWiki structure yielded no supported fixtures or rosters; retaining previous data')
    cat.sources.append({'id':ident('lp-source',page),'name':'Liquipedia API · '+region,'url':source,'state':meta.get('state','available'),'retrievedAt':meta['retrievedAt'],'checkedAt':meta.get('checkedAt',meta['retrievedAt']),'records':count,'rosters':roster_count,'license':'CC BY-SA 3.0','sha256':meta.get('sha256'),'note':'API-only; 31s parse spacing. Midnight times conservatively treated as date-only. Results lack finish timestamps: excluded from held-out testing, included in present ratings only after first observation of completion.'})
    return soup

def ingest_faceit(cat,fetcher):
    key=os.environ.get('FACEIT_API_KEY');ids=[x for x in os.environ.get('FACEIT_CHAMPIONSHIP_IDS','').split(',') if re.fullmatch(r'[\w-]{10,100}',x)]
    if not key or not ids:
        cat.sources.append({'id':'faceit-direct','name':'FACEIT Data API','url':'https://docs.faceit.com/api/data/','state':'not-configured','note':'Optional server-side FACEIT_API_KEY and FACEIT_CHAMPIONSHIP_IDS are required. Never placed in browser code.'});return
    for championship in ids[:12]:
        for offset in range(0,500,100):
            url=f'https://open.faceit.com/data/v4/championships/{championship}/matches?type=all&limit=100&offset={offset}'
            raw,meta=fetcher.get('faceit-'+championship+'-'+str(offset),url,ttl=900,token=key);rows=json.loads(raw).get('items')
            if not isinstance(rows,list):raise ValueError('FACEIT items schema drift')
            for m in rows:
                teams=m.get('teams',{});f=[teams.get('faction1'),teams.get('faction2')]
                if not all(t and t.get('faction_id') for t in f):continue
                tids=['faceit:'+t['faction_id'] for t in f];src=safeurl((m.get('faceit_url') or '').replace('{lang}','en')) or 'https://www.faceit.com/en/ow2/room/'+m['match_id']
                for tid,t in zip(tids,f):cat.teams[tid]={'id':tid,'name':t.get('name') or t['faction_id'],'logo':safeurl(t.get('avatar')),'source':src,'verification':'source-reported','updatedAt':meta['retrievedAt'],'regions':[]}
                eid='faceit:'+championship;cat.events.setdefault(eid,{'id':eid,'name':m.get('competition_name') or 'FACEIT Championship','source':src,'region':m.get('region','Unknown'),'verification':'source-reported','updatedAt':meta['retrievedAt'],'circuit':'FACEIT League'})
                res=m.get('results') or {};st={'FINISHED':'completed','ONGOING':'live','CANCELLED':'cancelled','SCHEDULED':'scheduled','READY':'scheduled'}.get(m.get('status'),'unconfirmed')
                score=res.get('score') or {};scores=[score.get('faction1'),score.get('faction2')]
                cat.merge({'id':'faceit:'+m['match_id'],'provider':'faceit','teamIds':tids,'eventId':eid,'region':m.get('region','Unknown'),'status':st,'bestOf':m.get('best_of') or None,'scheduledAt':stamp(m.get('scheduled_at')),'startedAt':stamp(m.get('started_at')),'finishedAt':stamp(m.get('finished_at')),'updatedAt':meta['retrievedAt'],'verifiedAt':meta.get('checkedAt',meta['retrievedAt']),'retrievedAt':meta['retrievedAt'],'winner':{'faction1':0,'faction2':1}.get(res.get('winner')),'scores':scores if all(isinstance(x,int) for x in scores) else None,'maps':cat.matches.get('faceit:'+m['match_id'],{}).get('maps',[]),'forfeit':False,'source':src,'verification':'source-reported','streams':[]})
            if len(rows)<100:break
            time.sleep(2)
    cat.sources.append({'id':'faceit-direct','name':'FACEIT Data API','url':'https://docs.faceit.com/api/data/','state':'available','retrievedAt':now(),'note':'Authorized server-side Data API; bounded pagination.'})

def publish(data):
    """Small first-load index; history and player records are fetched on demand.
    The cache is never deployed and contains the source for safe partial-outage recovery.
    """
    atomic(CACHE/'last-catalog.json',data)
    fixtures=[m for m in data['matches'] if m['status']!='completed' or m['provider']=='liquipedia']
    recent=sorted([m for m in data['matches'] if m['status']=='completed' and m['provider']!='liquipedia'],key=lambda x:x.get('finishedAt') or '',reverse=True)[:160]
    core={k:v for k,v in data.items() if k not in ['players','rosters','matches']}
    core['matches']=fixtures+recent;core['resources']={'history':'./platform/data/history.json','profiles':'./platform/data/profiles.json','model':'./platform/data/model.json','validation':'./platform/data/prediction-validation.json'}
    core['partialMatchIndex']=True
    atomic(OUT/'catalog.json',core)
    atomic(OUT/'history.json',{'schemaVersion':1,'generatedAt':data['generatedAt'],'matches':data['matches']})
    grouped=collections.defaultdict(list)
    for r in data['rosters']:grouped[r['teamId']].append(r)
    recent=[]
    for tid,rosters in grouped.items():
        rs=sorted(rosters,key=lambda r:r.get('observedAt') or '',reverse=True)
        recent.extend([r for r in rs if r.get('eventId')]+[r for r in rs if not r.get('eventId')][:2])
        atomic(OUT/'teams'/(ident('t',tid).split(':')[1]+'.json'),{'teamId':tid,'rosters':rs})
    playerIndex=[]
    for p in data['players']:
        q={**p,'observations':p.get('observations',[])[-6:]};playerIndex.append(q)
    atomic(OUT/'profiles.json',{'schemaVersion':1,'generatedAt':data['generatedAt'],'players':playerIndex,'rosters':recent,'partialRosterIndex':True,'teamResources':{tid:'./platform/data/teams/'+ident('t',tid).split(':')[1]+'.json' for tid in grouped}})

def run(offline=None):
    cat=Catalog();fetcher=Fetcher();OUT.mkdir(parents=True,exist_ok=True);CACHE.mkdir(exist_ok=True)
    try:
        if offline:
            p=pathlib.Path(offline);raw=(p/'owdb.sqlite3.gz').read_bytes();metas=read_json(p/'sources.json',[]);meta=next((r for r in metas if 'owdb.io' in r.get('source','')),{'retrievedAt':now()})
        else:raw,meta=fetcher.get('owdb',OWDB,ttl=10800)
        db=gzip.decompress(raw) if raw[:2]==b'\x1f\x8b' else raw
        path=CACHE/'faceit.sqlite3';path.write_bytes(db);ingest_owdb(cat,path,meta)
    except Exception as e:cat.sources.append({'id':'owdb','name':'OWDB public download','url':'https://owdb.io/data','state':'unavailable','error':str(e)[:180]})
    for i,(region,page) in enumerate(PAGES):
        try:
            if offline:
                p=pathlib.Path(offline);file=p/(str(i)+'.json')
                if not file.exists():continue
                raw=file.read_bytes();meta=read_json(p/'lp-sources.json',[])[i]
            else:
                url=LP+'api.php?'+urllib.parse.urlencode({'action':'parse','page':page,'prop':'text','format':'json','formatversion':2})
                raw,meta=fetcher.get('lp-'+region+'-'+str(i),url,ttl=1800 if i<6 else 86400)
            ingest_lp(cat,raw,page,region,meta)
        except Exception as e:cat.sources.append({'id':'lp-'+region,'name':'Liquipedia · '+region,'url':LP+page,'state':'unavailable','error':str(e)[:180]})
    try:
        if not offline:ingest_faceit(cat,fetcher)
        else:cat.sources.append({'id':'faceit-direct','name':'FACEIT Data API','url':'https://docs.faceit.com/api/data/','state':'not-configured','note':'Optional server-side key and championship IDs are not configured in this snapshot; OWDB is the connected public source.'})
    except Exception as e:cat.sources.append({'id':'faceit-direct','name':'FACEIT Data API','state':'unavailable','url':'https://docs.faceit.com/api/data/','error':str(e)[:180]})
    cat.sources.append({'id':'owtv','name':'OWTV','url':'https://owtv.gg/terms','state':'permission-required','note':'Automated collection is not enabled: OWTV terms require written permission.'})
    old=read_json(CACHE/'last-catalog.json',{});new=cat.result()
    # First observation is information availability, NOT a fabricated end time.
    previous={m['id']:m for m in old.get('matches',[])}
    used=set()
    for m in new['matches']:
        if m.get('provider')!='liquipedia':continue
        candidates=[o for o in previous.values() if o.get('provider')=='liquipedia' and o.get('eventId')==m.get('eventId') and o.get('teamIds')==m.get('teamIds') and o['id'] not in used]
        same=next((o for o in candidates if o.get('scheduledAt')==m.get('scheduledAt')),None)
        pending=[o for o in candidates if o.get('status') in ['scheduled','postponed','unconfirmed']]
        if not same and m.get('status')!='completed' and len(pending)==1:same=pending[0]
        if same:
            if same.get('scheduledAt')!=m.get('scheduledAt'):m['rescheduledFrom']=same.get('scheduledAt')
            m['id']=same['id'];used.add(same['id'])
    current={m['id'] for m in new['matches']}
    for oldm in previous.values():
        if oldm['id'] not in current and oldm.get('provider')=='liquipedia':
            retained={**oldm}
            if oldm['status'] not in ['completed','cancelled']:retained.update(status='unconfirmed',absenceNote='Not present in the latest source response; cancellation or result not inferred.')
            new['matches'].append(retained)
    for m in new['matches']:
        oldm=previous.get(m['id'],{})
        if m.get('completedObservedAt') and oldm.get('completedObservedAt'):m['completedObservedAt']=oldm['completedObservedAt']
    # Do not erase last-known records during a provider outage. Record-level timestamps are not refreshed.
    failed={s['id'] for s in cat.sources if s.get('state') in ['unavailable','stale']}
    if old and failed:
        for field in ['teams','events','players','rosters','matches']:
            seen={r['id'] for r in new[field]};new[field].extend(r for r in old.get(field,[]) if r['id'] not in seen)
        new['warnings'].append('Some providers are unavailable; retained records keep their original verification timestamps.')
    if not new['matches'] and not old:raise RuntimeError('No usable source records or cache. Keeping the existing deployed site unchanged.')
    # Every ID references a known entity; source corruption does not become fabricated data.
    tids={t['id'] for t in new['teams']};eids={e['id'] for e in new['events']}
    new['matches']=[m for m in new['matches'] if all(t in tids for t in m['teamIds']) and m['eventId'] in eids]
    new['counts']={k:len(new[k]) for k in ['teams','events','players','rosters','matches']}
    new['latestResultAt']=max((m['finishedAt'] for m in new['matches'] if m.get('finishedAt')),default=None)
    for mid,rows in cat.matchstats.items():atomic(OUT/'matches'/(ident('m',mid).split(':')[1]+'.json'),{'matchId':mid,'source':cat.matches.get(mid,{}).get('source'),'updatedAt':cat.matches.get(mid,{}).get('updatedAt'),'rows':rows,'definitions':'Provider scoreboard fields. Final blows, per-map duration and hero playtime unavailable. Restarted or uncaptured rows excluded.'})
    publish(new)
    print(json.dumps({'counts':new['counts'],'sources':new['sources']},indent=2));return new
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--offline-dir');args=parser.parse_args();run(args.offline_dir)
