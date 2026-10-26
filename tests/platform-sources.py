"""Parser fixtures below are synthetic, not production match records."""
import importlib.util,pathlib,json,unittest
P=pathlib.Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('sync',P/'platform/sync.py');S=importlib.util.module_from_spec(spec);spec.loader.exec_module(S)
class Sources(unittest.TestCase):
 def test_roles_and_format(self):
  opponent=lambda name:f'<div class="block-team"><span class="name"><a href="/overwatch/{name}" title="{name}">{name}</a></span></div>'
  member=lambda name,role:f'<div class="team-participant-card__member"><div class="team-participant-card__member-role-left"><img alt="{role}"></div><div class="team-participant-card__member-name"><span class="name"><a href="/overwatch/{name}">{name}</a></span></div></div>'
  html=f'<div class="team-participant-card">{opponent("Alpha")}{member("PlayerT","Tank")}{member("PlayerD","DPS")}{member("Coach","Coach")}</div><div class="brkts-match-info-popup"><div class="match-info-header-opponent">{opponent("Alpha")}</div><div class="match-info-header-opponent">{opponent("Beta")}</div><span data-timestamp="1793530800">Nov 1 - 19:00 CST</span><span>(Bo5)</span></div>'
  c=S.Catalog();S.ingest_lp(c,json.dumps({'parse':{'title':'Synthetic fixture test','text':html}}),'Overwatch_Champions_Series/2026/China/Stage_3','China',{'retrievedAt':'2026-10-26T03:00:00Z'})
  m=next(iter(c.matches.values()));r=next(iter(c.rosters.values()));self.assertEqual(m['bestOf'],5);self.assertEqual(m['status'],'scheduled');self.assertIsNone(m['finishedAt']);self.assertEqual([p['role'] for p in r['players']],['Tank','Damage']);self.assertEqual(len(c.players),2)
 def test_schema_break_visible(self):
  with self.assertRaises(ValueError):S.ingest_lp(S.Catalog(),b'{"parse":{"text":"<p>Unknown layout</p>"}}','x','Test',{'retrievedAt':'2026-10-26T03:00:00Z'})
 def test_urls(self):
  self.assertIsNone(S.safeurl('javascript:alert(1)'));self.assertIsNone(S.safeurl('https://user:pass@example.com/'));self.assertEqual(S.safeurl('/overwatch/T1','https://liquipedia.net'),'https://liquipedia.net/overwatch/T1')
 def test_terminal_result(self):
  c=S.Catalog();c.merge({'id':'m','status':'completed','teamIds':['a','b']});c.merge({'id':'m','status':'scheduled','teamIds':['a','b']});self.assertEqual(c.matches['m']['status'],'completed')
 def test_published_integrity(self):
  if not (P/'platform/data/catalog.json').exists():self.skipTest('Source build not run')
  c=json.loads((P/'platform/data/catalog.json').read_text());h=json.loads((P/'platform/data/history.json').read_text());teams={t['id'] for t in c['teams']};events={e['id'] for e in c['events']};ids=set()
  for m in h['matches']:
   self.assertNotIn(m['id'],ids);ids.add(m['id']);self.assertIn(m['eventId'],events);self.assertTrue(set(m['teamIds'])<=teams);self.assertTrue(m['source'].startswith('https://'));self.assertIn('updatedAt',m);self.assertIn('verification',m)
   if m.get('provider')=='owdb' and m.get('scores'):
    self.assertIn(m['bestOf'],[3,5,7,9]);self.assertEqual(max(m['scores']),m['bestOf']//2+1)
  self.assertFalse(any(s.get('id')=='owtv' and s.get('state')=='available' for s in c['sources']))
if __name__=='__main__':unittest.main()
