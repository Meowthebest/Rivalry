"""Reproduce aggregate calibration evidence. No player names or raw match data are published.
Usage: python calibration/extract-benchmarks.py path/to/faceit.sqlite3
Source: publisher-linked https://owdb.io/faceit.sqlite3.gz (2026-10-25 snapshot).
Requires Python 3 and pandas. Statistics are player-map totals, NOT per-10 rates.
"""
import sys,sqlite3,json,hashlib,pathlib
import pandas as pd
path=pathlib.Path(sys.argv[1])
con=sqlite3.connect(path)
q='''select p.*,g.map_category,g.was_restarted,m.started_at,m.forfeit,m.status,c.name championship
from round_players p join games g on p.match_id=g.match_id and p.game_no=g.game_no
join matches m on m.id=p.match_id join championships c on c.id=m.championship_id'''
df=pd.read_sql_query(q,con)
metrics=['eliminations','deaths','assists','damage','healing','damage_mitigated']
base=df[(df.stats_captured==1)&(df.was_restarted.fillna(0)==0)&(df.forfeit.fillna(0)==0)&(df.status=='FINISHED')&df.role.isin(['Tank','Damage','Support'])].dropna(subset=metrics)
# Require all ten players and the expected 2 tanks, 4 DPS, 4 supports across two teams.
grp=base.groupby(['match_id','game_no'])
valid=[]
for key,g in grp:
 if len(g)!=10 or g.player_id.nunique()!=10 or g.team_id.nunique()!=2: continue
 if all(dict(t.role.value_counts())=={'Damage':2,'Support':2,'Tank':1} for _,t in g.groupby('team_id')): valid.append(key)
ix=pd.MultiIndex.from_tuples(valid,names=['match_id','game_no'])
clean=base.set_index(['match_id','game_no']).loc[ix].reset_index()
master=clean[clean.championship.str.contains('Master',case=False,regex=False)]

def summary(frame):
 rows=[]
 for (mode,role),g in frame.groupby(['map_category','role']):
  rows.append({'mode':mode,'role':role,'playerMaps':len(g), 'statistics':{k:{'p10':round(float(g[k].quantile(.1)),2),'median':round(float(g[k].median()),2),'p90':round(float(g[k].quantile(.9)),2)} for k in metrics}})
 return {'playerMaps':len(frame),'maps':len(frame[['match_id','game_no']].drop_duplicates()),'series':frame.match_id.nunique(), 'firstDate':frame.started_at.min(),'lastDate':frame.started_at.max(),'championships':sorted(frame.championship.unique()),'byModeRole':rows}
result={'builtAt':'2026-10-25','source':{'publisher':'OWDB public FACEIT-derived collector (not an official FACEIT research release)','dictionary':'https://owdb.io/data','download':'https://owdb.io/faceit.sqlite3.gz','gzipSha256':'9f53db1fb6235bb6f8a6061872caba8db239da68c3d7b8bdede09273b9c9dd60','sqliteSha256':hashlib.sha256(path.read_bytes()).hexdigest()},'rawRows':len(df),'validCompleteMaps':summary(clean),'masterReference':summary(master),'filters':['Finished non-forfeit matches','No restarted games','stats_captured=1 and all six metrics non-null','Exactly 10 unique players and 2 teams','Per team: one Tank, two Damage, two Support'],'missingFields':['Final blows','Per-map playing time','Hero-level damage distribution','Coordinates / facing / paths','Ultimate counts','Exact patch identifiers'],'caveats':['FACEIT-derived data includes organized league divisions, not exclusively OWCS professional teams.','The primary comparison uses Master division player-map totals, stratified by mode and role.','Source damage/mitigation boundaries and assist attribution are not fully specified; use ranges as soft reference, not equivalence certification.','No source per-10 rates are inferred from series wall time.','No 2018–2021 6v6 sample is available here; classic-era simulation is not empirically calibrated by this dataset.','No exact historical positions or timing can be inferred from scoreboards.']}
for key in ['validCompleteMaps','masterReference']:result[key]['series']=int(result[key]['series'])
out=pathlib.Path('calibration/benchmarks.json');out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(result,separators=(',',':'))+'\n')
print(json.dumps({k:result[k] for k in ['rawRows','source']},indent=2))
for name in ['validCompleteMaps','masterReference']:
 d=result[name];print(name,d['playerMaps'],d['maps'],d['series'],d['firstDate'],d['lastDate']);print(d['championships'])
 for x in d['byModeRole']:print(x['mode'],x['role'],x['playerMaps'],{k:v['median'] for k,v in x['statistics'].items()})
