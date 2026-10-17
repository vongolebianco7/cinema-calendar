from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ISSUES = 'https://github.com/vongolebianco7/cinema-calendar/issues/new'

class SupportGuidanceTests(unittest.TestCase):
    def test_public_support_warns_against_personal_data(self):
        for prefix in ('', 'cinelva/'):
            privacy = (ROOT / prefix / 'privacy.html').read_text(encoding='utf-8')
            credits = (ROOT / prefix / 'credits.html').read_text(encoding='utf-8')
            for content in (privacy, credits):
                self.assertIn(PUBLIC_ISSUES, content)
                self.assertIn('個人情報', content)
                self.assertIn('rel="noopener noreferrer"', content)
            self.assertIn('別ドメインには自動同期されません', privacy)

    def test_faq_discloses_freshness_and_local_backup(self):
        for prefix in ('', 'cinelva/'):
            credits = (ROOT / prefix / 'credits.html').read_text(encoding='utf-8')
            self.assertIn('リアルタイムですか', credits)
            self.assertIn('網羅性は保証できません', credits)
            self.assertIn('クラウド同期はありません', credits)
            self.assertIn('data-backup.html', credits)

if __name__ == '__main__':
    unittest.main()
