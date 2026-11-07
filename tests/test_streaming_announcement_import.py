"""Reviewed premiere imports retain the facts required for safe identity resolution."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT=Path(__file__).resolve().parents[1]/'scripts/import_streaming_announcements.py'

class StreamingAnnouncementImportTests(unittest.TestCase):
 def test_unapproved_official_host_is_rejected_without_changing_snapshot(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory)/'data';root.mkdir()
   original={'generated_at':'last-good','movies':[{'title':'既存','date':'2026-11-01','service':'Netflix'}]}
   files={
    'streaming_sources.json':{'services':[{'name':'Netflix','official_url':'https://about.netflix.com/ja/newsroom'}]},
    'streaming.json':original,
    'streaming_announcements.json':{'movies':[{'title':'偽サイト作品','date':'2026-11-02','service':'Netflix','source_url':'https://about.netflix.com.attacker.example/notice','verified':True,'content_type':'movie'}]}}
   for name,value in files.items():(root/name).write_text(json.dumps(value))
   result=subprocess.run([sys.executable,str(SCRIPT)],cwd=directory,capture_output=True,text=True)
   self.assertNotEqual(result.returncode,0)
   self.assertIn('approved official HTTPS host',result.stderr)
   self.assertEqual(json.loads((root/'streaming.json').read_text()),original)

 def test_import_keeps_reviewed_release_year_and_original_title_without_an_inferred_id(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory)/'data';root.mkdir()
   files={
    'streaming_sources.json':{'services':[{'name':'Netflix','official_url':'https://about.netflix.com/ja/newsroom'}]},
    'streaming.json':{'movies':[]},
    'streaming_announcements.json':{'movies':[{'title':'アニマルズ','original_title':'Animals','release_year':2026,'date':'2026-10-09','service':'Netflix','source_url':'https://about.netflix.com/ja/new-to-watch','title_url':'https://www.netflix.com/jp/title/81757047','verified':True,'content_type':'movie'}]}}
   for name,value in files.items():(root/name).write_text(json.dumps(value))
   subprocess.run([sys.executable,str(SCRIPT)],cwd=directory,check=True,capture_output=True)
   movie=json.loads((root/'streaming.json').read_text())['movies'][0]
   self.assertEqual(movie.get('original_title'),'Animals')
   self.assertEqual(movie.get('release_year'),2026)
   self.assertEqual(movie.get('title_url'),'https://www.netflix.com/jp/title/81757047')
   self.assertNotIn('id',movie)
   self.assertNotIn('tmdbId',movie)

 def test_existing_premiere_receives_new_reviewed_identity_facts(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory)/'data';root.mkdir()
   row={'title':'アニマルズ','date':'2026-10-09','service':'Netflix','poster':None}
   reviewed={**row,'original_title':'Animals','release_year':2026,'source_url':'https://about.netflix.com/ja/new-to-watch','verified':True,'content_type':'movie'}
   for name,value in {'streaming_sources.json':{'services':[{'name':'Netflix','official_url':'https://about.netflix.com/ja/newsroom'}]},'streaming.json':{'movies':[row]},'streaming_announcements.json':{'movies':[reviewed]}}.items():(root/name).write_text(json.dumps(value))
   subprocess.run([sys.executable,str(SCRIPT)],cwd=directory,check=True,capture_output=True)
   movies=json.loads((root/'streaming.json').read_text())['movies']
   self.assertEqual(len(movies),1);self.assertEqual(movies[0].get('original_title'),'Animals');self.assertEqual(movies[0].get('release_year'),2026);self.assertEqual(movies[0]['date'],'2026-10-09');self.assertNotIn('id',movies[0])

 def test_generated_official_snapshot_is_imported_and_preserves_existing_poster(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory)/'data';root.mkdir()
   old={'title':'既存作品','date':'2026-11-01','service':'Prime Video','event':'streaming','poster':'https://image.tmdb.org/t/p/w500/old.jpg'}
   snapshot={'period':'2026-11','movies':[
    {'title':'既存作品','date':'2026-11-01','service':'Prime Video','event':'streaming','poster':None,'source':'Official November lineup','source_url':'https://www.aboutamazon.jp/november'},
    {'title':'追加作品','date':'2026-11-02','service':'Prime Video','event':'streaming','poster':'https://image.tmdb.org/t/p/w500/new.jpg','source':'Official November lineup','source_url':'https://www.aboutamazon.jp/november'}
   ]}
   files={
    'streaming_sources.json':{'services':[{'name':'Prime Video','official_url':'https://www.aboutamazon.jp/news/entertainment'}]},
    'streaming.json':{'generated_at':'old','movies':[old]},
    'streaming_announcements.json':{'movies':[]},
    'streaming-official-current.json':snapshot
   }
   for name,value in files.items():(root/name).write_text(json.dumps(value))
   subprocess.run([sys.executable,str(SCRIPT)],cwd=directory,check=True,capture_output=True)
   result=json.loads((root/'streaming.json').read_text())['movies']
   self.assertEqual(len(result),2)
   existing=next(m for m in result if m['title']=='既存作品')
   added=next(m for m in result if m['title']=='追加作品')
   self.assertEqual(existing['poster'],old['poster'])
   self.assertEqual(added['poster'],snapshot['movies'][1]['poster'])
   self.assertEqual(added['source_url'],'https://www.aboutamazon.jp/november')
