from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ExperienceRecommendationEvidenceTests(unittest.TestCase):
    def test_reasons_are_only_shown_with_concrete_evidence(self):
        text = (ROOT / "experience.html").read_text(encoding="utf-8")
        self.assertIn("function evidenceFor(m,k)", text)
        self.assertIn("確認できた作品情報", text)
        self.assertIn("evidence.length?", text)
        self.assertNotIn("作品ジャンルとの相性を基準にした目安で、作品固有の上映仕様は未確認なら加点していません。", text)

if __name__ == "__main__":
    unittest.main()
