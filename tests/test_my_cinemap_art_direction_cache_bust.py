from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ShareImageMigrationTests(unittest.TestCase):
    def test_live_page_does_not_load_retired_editor_art_direction(self):
        page = (ROOT / 'my-cinemap.html').read_text(encoding='utf-8')
        self.assertIn('js/cinelva-share-image.js', page)
        self.assertIn('js/cinelva-library-records.js', page)
        self.assertNotIn('js/my-cinemap-art-direction.js', page)
        self.assertNotIn('js/my-cinemap-art.js', page)
