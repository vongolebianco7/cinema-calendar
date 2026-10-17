from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ShareImageDecouplingTests(unittest.TestCase):
    def test_share_png_does_not_require_manual_movie_shelf(self):
        page = (ROOT / 'my-cinemap.html').read_text(encoding='utf-8')
        self.assertIn('鑑賞記録から画像を自動生成', page)
        self.assertIn('id="imageSort"', page)
        self.assertIn('id="period"', page)
        self.assertIn('id="save"', page)
        self.assertIn('id="share"', page)
        self.assertNotIn('id="list"', page)
