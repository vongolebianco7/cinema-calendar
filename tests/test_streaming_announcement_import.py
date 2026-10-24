"""Reviewed premiere imports retain the facts required for safe identity resolution."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT=Path(__file__).resolve().parents[1]/'scripts/import_streaming_announcements.py'

class StreamingAnnouncementImportTests(unittest.TestCase):
 def test_import_keeps_reviewed_release_year_and_original_title_without_an_inferred_id(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory)/'data';root.mkdir()
   files={
    'streaming_sources.json':{'services':[{'name':'Netflix'}]},
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
