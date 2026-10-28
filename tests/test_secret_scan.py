import unittest
from scripts.check_secrets import findings
class SecretScan(unittest.TestCase):
 def test_recognizes_without_echoing_values(self):
  for value in [b'gh'+b'p_'+b'a'*36, b'A'+b'KIA'+b'A'*16, b'-----BEGIN '+b'PRIVATE KEY-----', b'postgresql://'+b'user:private@remote.example.net/db']:
   self.assertTrue(findings(value))
 def test_local_fixture_and_normal_code(self):
  self.assertFalse(findings(b'postgresql://fixture:fixture@127.0.0.1:1/test'))
  self.assertFalse(findings(b'process.env.TMDB_API_KEY'))
