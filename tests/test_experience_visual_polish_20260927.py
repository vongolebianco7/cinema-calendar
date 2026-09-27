from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ExperienceVisualPolishTests(unittest.TestCase):
    def setUp(self):
        self.text = (ROOT / 'experience.html').read_text(encoding='utf-8')

    def test_scope_context_is_explicit_for_normal_screening(self):
        self.assertIn('この比較では通常上映をシネマスコープ（2.39:1）として表示', self.text)

    def test_dolby_atmos_heading_and_links_include_dolby_cinema(self):
        self.assertIn('<h3>Dolby Atmos <small>Dolby Cinema</small></h3>', self.text)
        self.assertIn('Dolby Atmos対応スクリーンを見る →', self.text)
        self.assertIn('Dolby Cinema対応スクリーンを見る →', self.text)

    def test_audio_effects_are_more_legible(self):
        self.assertIn('.audio3d .horizontalRing,.audio3d .upperRing{border-width:3px!important', self.text)
        self.assertIn('filter:drop-shadow(0 0 9px', self.text)

    def test_special_format_images_are_preloaded(self):
        self.assertIn('<link rel="preload" as="image" href="assets/8897F0A1-FC35-4609-A239-1C800BF9EAE9.png?v=0424">', self.text)
        self.assertIn('<link rel="preload" as="image" href="assets/887F3A99-0D56-4E3F-9754-859B5C27E764.png?v=0432">', self.text)
        self.assertIn('<link rel="preload" as="image" href="assets/cinemap-experience.png?v=0420">', self.text)

    def test_special_effects_have_stronger_motion_cues(self):
        self.assertIn('.singleMotionScene .fxWind{opacity:.62', self.text)
        self.assertIn('.singleMotionScene .fxWater{filter:drop-shadow(0 0 6px #bceeff)', self.text)

if __name__ == '__main__':
    unittest.main()
