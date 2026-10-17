from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ShareImageLayoutTests(unittest.TestCase):
    def test_mobile_share_preview_is_responsive_and_separate_from_editor(self):
        page = (ROOT / 'my-cinemap.html').read_text(encoding='utf-8')
        self.assertIn('@media(max-width:720px)', page)
        self.assertIn('.layout{grid-template-columns:1fr}', page)
        self.assertIn('<canvas id="art"', page)
        self.assertNotIn('editorRankingFixedTwoColumn', page)
