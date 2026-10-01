import unittest

try:
    from scripts.quality_report import render_report
except ModuleNotFoundError:
    render_report = None


class QualityReportTests(unittest.TestCase):
    def test_report_contains_score_groups_areas_blockers_unverified_and_delta(self):
        self.assertIsNotNone(render_report, "scripts.quality_report must exist")
        score = {
            "total": 82.5,
            "group_totals": {"screen": 37.5, "flow": 33.0, "cross": 12.0},
            "area_totals": {"calendar": 7.0, "discover": 8.5},
            "release_eligible": False,
            "blockers": ["DETAIL-12", "OC-11"],
            "unverified_blockers": ["FLOW-FIRSTUSE"],
            "missing_metrics": ["FLOW-FIRSTUSE"],
            "comparison": {"baseline_total": 80.5, "delta": 2.0},
        }
        report = render_report(score)
        self.assertIn("82.5 / 100", report)
        self.assertIn("Screen", report)
        self.assertIn("37.5 / 45", report)
        self.assertIn("User Flows", report)
        self.assertIn("33.0 / 40", report)
        self.assertIn("Cross-Cutting", report)
        self.assertIn("12.0 / 15", report)
        self.assertIn("calendar", report)
        self.assertIn("discover", report)
        self.assertIn("Release Blockers", report)
        self.assertIn("❌ DETAIL-12", report)
        self.assertIn("❌ OC-11", report)
        self.assertIn("Unverified Blockers", report)
        self.assertIn("⚠️ FLOW-FIRSTUSE", report)
        self.assertIn("80.5", report)
        self.assertIn("+2.0", report)
        self.assertIn("release_eligible: false", report.lower())

    def test_release_eligible_true_has_no_blocker_warning(self):
        self.assertIsNotNone(render_report, "scripts.quality_report must exist")
        report = render_report({
            "total": 90,
            "group_totals": {"screen": 40, "flow": 36, "cross": 14},
            "area_totals": {},
            "release_eligible": True,
            "blockers": [],
            "unverified_blockers": [],
            "missing_metrics": [],
        })
        self.assertIn("release_eligible: true", report.lower())
        self.assertNotIn("❌", report)
        self.assertNotIn("⚠️", report)


if __name__ == "__main__":
    unittest.main()
