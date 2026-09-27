from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ExperienceAudioStandardLabelTests(unittest.TestCase):
    def test_standard_audio_is_explicitly_labeled_as_typical_standard_screening(self):
        text = (ROOT / 'experience.html').read_text(encoding='utf-8')
        self.assertIn('一般的な通常上映（5.1 / 7.1ch）', text)
        self.assertIn('多くの通常上映で使われる5.1ch / 7.1ch', text)
        self.assertIn('劇場やスクリーンによって構成は異なります', text)

if __name__ == '__main__':
    unittest.main()
