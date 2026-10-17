from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ExperienceRecommendationTabLinksTests(unittest.TestCase):
    def test_recommendation_alternatives_link_to_detail_tabs(self):
        text = (ROOT / 'experience.html').read_text(encoding='utf-8')
        self.assertIn('function tabFor(k)', text)
        self.assertIn('data-go-tab', text)
        self.assertIn('window.switchExperienceTab', text)
        self.assertIn('画角を詳しく見る', text)
        self.assertIn('映像を詳しく見る', text)
        self.assertIn('体感を詳しく見る', text)

    def test_tappable_rows_use_semantic_buttons_with_visible_affordance(self):
        text = (ROOT / 'experience.html').read_text(encoding='utf-8')
        self.assertIn('.formatScoreCta', text)
        self.assertIn("content:'›'", text)
        self.assertIn('<button type="button" class="formatScoreCta"', text)
        self.assertNotIn('role="button"', text)

if __name__ == '__main__':
    unittest.main()
