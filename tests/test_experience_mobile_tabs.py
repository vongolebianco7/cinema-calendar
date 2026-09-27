from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ExperienceMobileTabsTests(unittest.TestCase):
    def test_comparison_table_removed_and_tabs_drive_sections(self):
        text = (ROOT / "experience.html").read_text(encoding="utf-8")
        self.assertNotIn('id="experienceCompare"', text)
        self.assertNotIn('class="experienceCompare"', text)
        self.assertIn('class="expTabs"', text)
        for key, label in [
            ("recommend", "おすすめ"),
            ("aspect", "画角"),
            ("visual", "映像"),
            ("audio", "音響"),
            ("special", "体感"),
        ]:
            self.assertIn(f'data-exp-tab="{key}"', text)
            self.assertIn(label, text)
            self.assertIn(f'data-exp-panel="{key}"', text)
        self.assertIn('.expTabs{position:sticky', text)
        self.assertIn('panel.hidden=true', text)
        self.assertIn('panel.hidden=false', text)

    def test_finder_stays_before_tabs(self):
        text = (ROOT / "experience.html").read_text(encoding="utf-8")
        self.assertLess(text.index('id="formatFinder"'), text.index('class="expTabs"'))

if __name__ == "__main__":
    unittest.main()
