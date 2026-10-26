"""Assemble only public site assets; never deploy raw provider caches or credentials."""
from pathlib import Path
import shutil,json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'_site'
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir()
allowed={'.html','.js','.css','.svg','.png','.webp','.jpg','.jpeg','.ico','.json','.md','.woff','.woff2'}
# Existing public assets are preserved; source code/tests/cache/configuration are not web payloads.
for folder in ['assets','data','engine','ui','calibration','validation','platform']:
    for p in (ROOT/folder).rglob('*'):
        if not p.is_file() or p.is_symlink() or p.suffix.lower() not in allowed:continue
        if any(v in ['__pycache__','node_modules','.platform-cache'] for v in p.parts):continue
        target=OUT/p.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target)
for p in ROOT.iterdir():
    if p.is_file() and (p.suffix.lower() in allowed or p.name=='.nojekyll'):
        shutil.copyfile(p,OUT/p.name)
required=['index.html','platform/data/catalog.json','platform/data/history.json','platform/data/model.json','platform/data/prediction-validation.json']
for path in required:
    if not (OUT/path).is_file():raise RuntimeError('Missing public build artifact: '+path)
cat=json.loads((OUT/'platform/data/catalog.json').read_text())
print('Public site:',len(list(OUT.rglob('*'))),'entries;',cat.get('counts'))
