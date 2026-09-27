from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ExperienceImaxCoverageTests(unittest.TestCase):
    def test_imax_family_has_broad_coverage(self):
        data = json.loads((ROOT/'data/theater_formats.json').read_text(encoding='utf-8'))
        rows = [r for r in data.get('screens',[]) if str(r.get('format','')).upper().startswith('IMAX')]
        self.assertGreaterEqual(len(rows), 45)
        self.assertGreaterEqual(len({r.get('theater') for r in rows}), 45)

    def test_imax_filter_includes_laser_and_gt(self):
        text = (ROOT/'theaters.html').read_text(encoding='utf-8')
        self.assertIn('function formatMatches', text)
        self.assertIn('wanted==="imax"', text)
        self.assertIn('actual.startsWith("imax")', text)

    def test_experience_has_picker_and_comparison(self):
        text = (ROOT/'experience.html').read_text(encoding='utf-8')
        self.assertIn('id="formatFinder"', text)
        self.assertIn('id="experienceCompare"', text)
        self.assertIn('作品から上映方式を選ぶ', text)
        self.assertIn('通常上映', text)
        self.assertIn('IMAX', text)
        self.assertIn('Dolby Cinema', text)
        self.assertIn('ScreenX', text)

if __name__ == '__main__':
    unittest.main()
