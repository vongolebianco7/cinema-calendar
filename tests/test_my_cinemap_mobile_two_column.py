from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ShareImageMobileTests(unittest.TestCase):
    def test_mobile_page_uses_one_column_preview_and_accessible_export(self):
        page = (ROOT / 'my-cinemap.html').read_text(encoding='utf-8')
        self.assertIn('@media(max-width:720px)', page)
        self.assertIn('.layout{grid-template-columns:1fr}', page)
        self.assertIn('id="saveDialog"', page)
        self.assertIn('iPhoneでは画像を長押し', page)
