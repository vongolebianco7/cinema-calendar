from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ExperienceScreenLinksAudioDolbyTests(unittest.TestCase):
    def test_aspect_imax_cards_link_to_supported_screens(self):
        text = (ROOT / 'experience.html').read_text(encoding='utf-8')
        self.assertIn('IMAX対応スクリーンを見る →', text)
        self.assertIn('IMAX GT対応スクリーンを見る →', text)
        self.assertIn('theaters.html?format=IMAX', text)
        self.assertIn('theaters.html?format=IMAX%20GT', text)

    def test_audio_imax_links_to_screens(self):
        text = (ROOT / 'experience.html').read_text(encoding='utf-8')
        marker = '<article class="audioCard imaxA">'
        start = text.index(marker)
        end = text.index('</article>', start)
        card = text[start:end]
        self.assertIn('IMAX対応スクリーンを見る →', card)
        self.assertIn('theaters.html?format=IMAX', card)

    def test_dolby_atmos_explains_dolby_cinema(self):
        text = (ROOT / 'experience.html').read_text(encoding='utf-8')
        self.assertIn('Dolby Cinemaの音響もDolby Atmos', text)
        self.assertIn('映像はDolby Visionとの組み合わせ', text)

if __name__ == '__main__':
    unittest.main()
