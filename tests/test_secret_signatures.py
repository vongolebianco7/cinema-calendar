import unittest
from scripts.check_secrets import findings


class SecretSignatures(unittest.TestCase):
    def test_recognizes_tokens_without_returning_values(self):
        token = "gh" + "p_" + "Z" * 36
        self.assertEqual(findings(token), ["github-token"])
        self.assertNotIn(token, str(findings(token)))

    def test_normal_source_is_not_a_secret(self):
        self.assertEqual(findings('process.env.TMDB_API_KEY; https://cinelva.vercel.app'), [])
