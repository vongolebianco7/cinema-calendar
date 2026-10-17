from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class OfficialTheaterLinksTests(unittest.TestCase):
    def test_movie_detail_links_to_official_sources_without_partial_showtimes(self):
        page = (ROOT / 'index.html').read_text(encoding='utf-8')
        start = page.index('function theaterScheduleHtml(m)')
        end = page.find('\nfunction ', start + 10)
        block = page[start:] if end < 0 else page[start:end]
        self.assertIn('theater-official-links-v2', block)
        self.assertNotIn('theaterSchedules.schedules', block)
        self.assertIn('上映時間を公式サイトで確認', block)
        self.assertIn('rel="noopener noreferrer"', block)
        self.assertIn('https://109cinemas.net/', block)
