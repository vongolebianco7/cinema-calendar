from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ExperienceTabCleanupTests(unittest.TestCase):
    def test_tabs_own_their_content_and_gt_is_not_duplicated(self):
        text = (ROOT / "experience.html").read_text(encoding="utf-8")
        self.assertNotIn('id="guide"', text)
        self.assertIn('class="decisionBox expTabPanel" id="formatFinder" data-exp-panel="recommend"', text)
        self.assertLess(text.index('class="expTabs"'), text.index('id="formatFinder"'))
        self.assertNotIn('IMAX GTを観られる確認済みスクリーン', text)
        self.assertIn('class="section expTabPanel" id="imax-gt-theaters" data-exp-panel="aspect"', text)
        self.assertEqual(text.count('グランドシネマサンシャイン 池袋'), 1)
        self.assertEqual(text.count('109シネマズ大阪エキスポシティ'), 1)

if __name__ == "__main__":
    unittest.main()
