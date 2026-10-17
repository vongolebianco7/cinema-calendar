from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ShareImageTemplatesTests(unittest.TestCase):
    def test_retired_manual_templates_are_not_in_current_share_page(self):
        page = (ROOT / 'my-cinemap.html').read_text(encoding='utf-8')
        self.assertNotIn('my-cinemap-cinema-templates.js', page)
        self.assertNotIn('data-theme="cinema-projector"', page)
        self.assertNotIn('data-theme="cinema-artdeco"', page)
        self.assertIn('ポスター画像の読み込みや利用条件を確認できない場合', page)
        self.assertIn('作品名のカードに切り替わります', page)
