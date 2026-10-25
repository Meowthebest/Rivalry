"""Compare one unselected deterministic model batch to published player-map totals.
Usage: python calibration/compare-model.py validation/model-maps.json
No rates are inferred from reference match duration. Differences are reported, not hidden.
"""
import json,sys,statistics,pathlib,hashlib
samples=json.loads(pathlib.Path(sys.argv[1]).read_text());ref=json.loads(pathlib.Path('calibration/benchmarks.json').read_text())['masterReference']
lookup={(r['mode'],r['role']):r for r in ref['byModeRole']}
metrics={'damage':'damage','healing':'healing','mitigated':'damage_mitigated','eliminations':'eliminations','deaths':'deaths','assists':'assists'}
def quant(values,q):
 a=sorted(values);t=(len(a)-1)*q;i=int(t);return a[i]*(1-(t-i))+a[min(i+1,len(a)-1)]*(t-i)
rows=[]
for (mode,role),reference in lookup.items():
 people=[p['stats'] for m in samples if m['mode']==mode for p in m['players'] if p['role']==role]
 if not people:continue
 checks={}
 for sim,key in metrics.items():
  vals=[p[sim] for p in people];r=reference['statistics'][key];median=statistics.median(vals)
  checks[sim]={'modelP10':round(quant(vals,.1),1),'modelMedian':round(median,1),'modelP90':round(quant(vals,.9),1),'reference':r,'fractionWithinReferenceP10P90':round(sum(r['p10']<=n<=r['p90'] for n in vals)/len(vals),3),'medianWithinReferenceP10P90':r['p10']<=median<=r['p90']}
 rows.append({'mode':mode,'role':role,'modelPlayerMaps':len(people),'referencePlayerMaps':reference['playerMaps'],'metrics':checks})
meaningful=[(r,k,m) for r in rows for k,m in r['metrics'].items() if k in ['damage','deaths','eliminations'] or k=='healing' and r['role']=='Support' or k=='mitigated' and r['role']=='Tank']
residual=[{'mode':r['mode'],'role':r['role'],'metric':k,'modelMedian':m['modelMedian'],'referenceP10':m['reference']['p10'],'referenceP90':m['reference']['p90']} for r,k,m in meaningful if not m['medianWithinReferenceP10P90']]
report={'modelVersion':5,'modelMaps':len(samples),'modelPlayerMaps':sum(len(s['players']) for s in samples),'seedIndices':sorted({s['seed'] for s in samples}),'engineSeeds':sorted({997*s['seed'] for s in samples}),'seedFormula':'997 * seedIndex','sourceHashes':{p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest() for p in ['engine/world-sim.js','engine/tactical-map.js','calibration/benchmarks.json']},'pairings':sorted({s['a']+' vs '+s['b'] for s in samples}),'modeCounts':{m:sum(s['mode']==m for s in samples) for m in sorted({s['mode'] for s in samples})},'durationSeconds':{'min':round(min(s['seconds'] for s in samples),1),'median':round(statistics.median(s['seconds'] for s in samples),1),'max':round(max(s['seconds'] for s in samples),1)},'referenceMaps':ref['maps'],'referencePlayerMaps':ref['playerMaps'],'medianChecksWithinRange':sum(m['medianWithinReferenceP10P90'] for _,_,m in meaningful),'medianChecks':len(meaningful),'comparisons':rows,'residualGaps':residual,'assessment':'Partial calibration, not statistical equivalence to professional play. All seeds are included. Composition mix, unknown source time/patch/metric boundaries, schematic space, modeled hero kits and limited sample sizes constrain comparison. Residual gaps must remain visible. No display multipliers were used.'}
pathlib.Path('validation').mkdir(exist_ok=True);pathlib.Path('validation/calibration-report.json').write_text(json.dumps(report,separators=(',',':'))+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='comparisons'},indent=2))
