from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ExperienceMovieCandidateSelectionTests(unittest.TestCase):
    def test_live_candidates_require_explicit_selection_before_recommendations(self):
        text = (ROOT / "experience.html").read_text(encoding="utf-8")
        self.assertIn('id="formatCandidates"', text)
        self.assertIn('id="formatConfirm"', text)
        self.assertIn('この作品でおすすめを見る', text)
        self.assertIn('let selectedMovie=null', text)
        self.assertIn('data-candidate-index', text)
        self.assertIn('selectedMovie=candidates[i]', text)
        self.assertIn('if(!selectedMovie)return', text)
        self.assertIn('let candidateTimer', text)
        self.assertIn('setTimeout(loadCandidates,250)', text)
        self.assertIn("input.addEventListener('input'", text)
        self.assertIn('candidateBox.hidden=false', text)
        self.assertNotIn('id="formatJudge"', text)

    def test_standard_screening_is_always_first(self):
        text = (ROOT / "experience.html").read_text(encoding="utf-8")
        self.assertIn("rows=[['通常上映',scores['通常上映']],...Object.entries(scores).filter(([k])=>k!=='通常上映').sort((a,b)=>b[1]-a[1])]", text)

    def test_unverified_reason_copy_is_not_shown_as_evidence(self):
        text = (ROOT / "experience.html").read_text(encoding="utf-8")
        self.assertNotIn('作品ジャンルとの相性を基準にした目安で', text)
        self.assertIn('確認できる作品固有の根拠がある場合のみ表示', text)

if __name__ == "__main__":
    unittest.main()
