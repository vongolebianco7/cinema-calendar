from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ExperienceRecommendationReasonLinksTests(unittest.TestCase):
    def test_reason_toggle_and_tab_link_are_separate(self):
        text=(ROOT/'experience.html').read_text(encoding='utf-8')
        self.assertIn('formatReasonToggle', text)
        self.assertIn('formatReasonBody', text)
        self.assertIn('理由を見る', text)
        self.assertIn('data-go-tab=', text)
        self.assertIn("k==='IMAX'?'aspect'", text)
        self.assertNotIn("k==='通常上映'?'aspect'", text)

if __name__ == '__main__':
    unittest.main()
