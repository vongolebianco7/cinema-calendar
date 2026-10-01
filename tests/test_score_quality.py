import json
import tempfile
import unittest
from pathlib import Path

try:
    from scripts.score_quality import calculate_score, compare_scores, load_scorecard
except ModuleNotFoundError:
    calculate_score = compare_scores = load_scorecard = None


ROOT = Path(__file__).resolve().parents[1]
SCORECARD_PATH = ROOT / "quality" / "scorecard.json"


class ScoreQualityTests(unittest.TestCase):
    def require_module(self):
        self.assertIsNotNone(load_scorecard, "scripts.score_quality must exist")

    def test_configured_points_total_100_with_expected_groups(self):
        self.require_module()
        scorecard = load_scorecard(SCORECARD_PATH)
        metrics = scorecard["metrics"]
        self.assertEqual(sum(m["points"] for m in metrics), 100)
        totals = {
            group: sum(m["points"] for m in metrics if m["group"] == group)
            for group in ("screen", "flow", "cross")
        }
        self.assertEqual(totals, {"screen": 45, "flow": 40, "cross": 15})

    def test_duplicate_configured_ids_are_rejected(self):
        self.require_module()
        payload = {
            "scorecard_version": 1,
            "gate_phase": "A",
            "metrics": [
                {"id": "X", "group": "screen", "area": "a", "description": "x", "points": 1, "blocker": False},
                {"id": "X", "group": "flow", "area": "b", "description": "x2", "points": 1, "blocker": False},
            ],
        }
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "scorecard.json"
            p.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaises(ValueError):
                load_scorecard(p)

    def test_duplicate_result_ids_same_browser_are_rejected(self):
        self.require_module()
        scorecard = {
            "scorecard_version": 1,
            "gate_phase": "A",
            "metrics": [{"id": "M", "group": "screen", "area": "a", "description": "m", "points": 1, "blocker": False}],
        }
        results = [
            {"id": "M", "status": "pass", "earned": 1, "browser": "chromium"},
            {"id": "M", "status": "pass", "earned": 1, "browser": "chromium"},
        ]
        with self.assertRaises(ValueError):
            calculate_score(scorecard, results)

    def test_unknown_result_id_is_rejected(self):
        self.require_module()
        scorecard = {
            "scorecard_version": 1,
            "gate_phase": "A",
            "metrics": [{"id": "M", "group": "screen", "area": "a", "description": "m", "points": 1, "blocker": False}],
        }
        with self.assertRaises(ValueError):
            calculate_score(scorecard, [{"id": "NOPE", "status": "pass", "earned": 1}])

    def test_earned_points_cannot_exceed_metric_maximum(self):
        self.require_module()
        scorecard = {
            "scorecard_version": 1,
            "gate_phase": "A",
            "metrics": [{"id": "M", "group": "screen", "area": "a", "description": "m", "points": 1, "blocker": False}],
        }
        with self.assertRaises(ValueError):
            calculate_score(scorecard, [{"id": "M", "status": "pass", "earned": 1.1}])

    def test_missing_metrics_score_zero_without_renormalization(self):
        self.require_module()
        scorecard = {
            "scorecard_version": 1,
            "gate_phase": "A",
            "metrics": [
                {"id": "A", "group": "screen", "area": "a", "description": "a", "points": 2, "blocker": False},
                {"id": "B", "group": "screen", "area": "a", "description": "b", "points": 3, "blocker": False},
            ],
        }
        score = calculate_score(scorecard, [{"id": "A", "status": "pass", "earned": 2}])
        self.assertEqual(score["total"], 2)
        self.assertEqual(score["missing_metrics"], ["B"])

    def test_failed_blocker_makes_release_ineligible(self):
        self.require_module()
        scorecard = {
            "scorecard_version": 1,
            "gate_phase": "A",
            "metrics": [{"id": "B", "group": "screen", "area": "a", "description": "b", "points": 1, "blocker": True}],
        }
        score = calculate_score(scorecard, [{"id": "B", "status": "fail", "earned": 0}])
        self.assertFalse(score["release_eligible"])
        self.assertEqual(score["blockers"], ["B"])

    def test_blocker_failure_in_either_browser_wins(self):
        self.require_module()
        scorecard = {
            "scorecard_version": 1,
            "gate_phase": "A",
            "metrics": [{"id": "B", "group": "screen", "area": "a", "description": "b", "points": 1, "blocker": True}],
        }
        score = calculate_score(scorecard, [
            {"id": "B", "status": "pass", "earned": 1, "browser": "chromium"},
            {"id": "B", "status": "fail", "earned": 0, "browser": "webkit"},
        ])
        self.assertFalse(score["release_eligible"])
        self.assertEqual(score["area_totals"]["a"], 0)

    def test_baseline_version_mismatch_is_rejected(self):
        self.require_module()
        current = {"scorecard_version": 2, "total": 1, "area_totals": {}, "blockers": []}
        baseline = {"scorecard_version": 1, "total": 1, "area_totals": {}, "blockers": []}
        with self.assertRaises(ValueError):
            compare_scores(current, baseline, set())


if __name__ == "__main__":
    unittest.main()
