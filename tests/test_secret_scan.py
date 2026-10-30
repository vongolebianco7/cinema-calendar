import unittest
from scripts.check_secrets import findings
class SecretScan(unittest.TestCase):
 def test_recognizes_without_echoing_values(self):
  for value in [b'gh'+b'p_'+b'a'*36, b'A'+b'KIA'+b'A'*16, b'-----BEGIN '+b'PRIVATE KEY-----', b'postgresql://'+b'user:private@remote.example.net/db']:
   self.assertTrue(findings(value))
 def test_local_fixture_and_normal_code(self):
  self.assertFalse(findings(b'postgresql://fixture:fixture@127.0.0.1:1/test'))
  self.assertFalse(findings(b'process.env.TMDB_API_KEY'))
 def test_tmdb_literal_assignments_and_query_parameters(self):
  key=b'01234567'*4  # Synthetic value assembled at runtime, never a credential.
  for prefix in [b'TMDB_API_KEY=',b'"tmdb_api_key": "',b'?api_key=',b"api_key = '"]:
   self.assertEqual(findings(prefix+key),['tmdb_literal_key'])
 def test_tmdb_pattern_ignores_normal_references_and_unrelated_hashes(self):
  key=b'01234567'*4
  for value in [b'process.env.TMDB_API_KEY',b'TMDB_API_KEY=fixture',b'commit='+key,b'TMDB_API_KEY='+key+b'f']:
   self.assertFalse(findings(value))
