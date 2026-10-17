from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ShareImageSelectionTests(unittest.TestCase):
    def test_share_page_uses_record_filters_instead_of_custom_shelf(self):
        page = (ROOT / 'my-cinemap.html').read_text(encoding='utf-8')
        self.assertIn('id="period"', page)
        self.assertIn('value="year"', page)
        self.assertIn('value="all"', page)
        self.assertIn('id="imageSort"', page)
        self.assertNotIn('id="list"', page)
        self.assertNotIn('id="layout"', page)
