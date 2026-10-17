from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ShareImageAssetTests(unittest.TestCase):
    def test_current_page_uses_direct_share_module_not_retired_cache_chain(self):
        page = (ROOT / 'my-cinemap.html').read_text(encoding='utf-8')
        self.assertIn('<script src="js/cinelva-share-image.js"></script>', page)
        self.assertIn('<script src="js/cinelva-library-records.js"></script>', page)
        self.assertNotIn('my-cinemap-cinema-templates.js', page)
        self.assertTrue((ROOT / 'js/cinelva-share-image.js').is_file())
