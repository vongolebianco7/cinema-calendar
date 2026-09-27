from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ExperienceMovieCandidateSelectionTests(unittest.TestCase):
    def test_search_requires_candidate_selection_before_recommendations(self):
        text = (ROOT / "experience.html").read_text(encoding="utf-8")
        self.assertIn('id="formatCandidates"', text)
        self.assertIn('id="formatConfirm"', text)
        self.assertIn('作品を検索', text)
        self.assertIn('この作品で確定', text)
        self.assertIn('let selectedMovie=null', text)
        self.assertIn('data-candidate-index', text)
        self.assertIn('selectedMovie=candidates[i]', text)
        self.assertIn('if(!selectedMovie)return', text)

    def test_standard_screening_is_always_first(self):
        text = (ROOT / "experience.html").read_text(encoding="utf-8")
        self.assertIn("rows=[['通常上映',scores['通常上映']],...Object.entries(scores).filter(([k])=>k!=='通常上映').sort((a,b)=>b[1]-a[1])]", text)

if __name__ == "__main__":
    unittest.main()
