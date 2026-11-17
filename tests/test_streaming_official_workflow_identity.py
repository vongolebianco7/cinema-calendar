"""The official streaming publisher must not guess artwork identities."""
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github/workflows/refresh-official-streaming.yml"


class OfficialStreamingWorkflowIdentityTests(unittest.TestCase):
    def test_official_refresh_requires_strict_tmdb_identity_for_artwork(self):
        workflow = WORKFLOW.read_text(encoding="utf-8")

        self.assertNotIn("CINELVA_ALLOW_FUZZY_POSTER_FALLBACK", workflow)
        self.assertEqual(workflow.count("python scripts/enrich_streaming_posters.py"), 2)
        self.assertIn("CINELVA_ENRICH_RUNTIME", workflow)


if __name__ == "__main__":
    unittest.main()
