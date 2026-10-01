import unittest

try:
    from scripts.map_data_compliance_metrics import map_data_compliance_metrics, scan_text_for_policy_violations
except ModuleNotFoundError:
    map_data_compliance_metrics = None
    scan_text_for_policy_violations = None


class DataComplianceMetricTests(unittest.TestCase):
    def test_all_data_and_compliance_checks_pass(self):
        self.assertIsNotNone(map_data_compliance_metrics, "scripts.map_data_compliance_metrics must exist")
        rows = {r["id"]: r for r in map_data_compliance_metrics({
            "sources": True,
            "critic_schema": True,
            "critic_association": True,
            "critic_inference": True,
            "unknown_data": True,
            "free_only": True,
            "scraping": True,
            "trackers": True,
        })}
        self.assertEqual(rows["CROSS-DATA"]["earned"], 3.0)
        self.assertEqual(rows["CROSS-COMPLIANCE"]["earned"], 3.0)
        self.assertEqual(rows["CRIT-01"]["earned"], 0.5)
        self.assertEqual(rows["CRIT-03"]["earned"], 0.5)
        self.assertEqual(rows["CRIT-05"]["earned"], 0.5)

    def test_false_critic_association_fails_data_and_critic_metric(self):
        self.assertIsNotNone(map_data_compliance_metrics, "scripts.map_data_compliance_metrics must exist")
        rows = {r["id"]: r for r in map_data_compliance_metrics({
            "sources": True,
            "critic_schema": True,
            "critic_association": False,
            "critic_inference": True,
            "unknown_data": True,
            "free_only": True,
            "scraping": True,
            "trackers": True,
        })}
        self.assertEqual(rows["CROSS-DATA"]["status"], "fail")
        self.assertEqual(rows["CRIT-03"]["status"], "fail")

    def test_incomplete_evidence_emits_only_metrics_it_can_prove(self):
        self.assertIsNotNone(map_data_compliance_metrics, "scripts.map_data_compliance_metrics must exist")
        rows = {r["id"]: r for r in map_data_compliance_metrics({
            "sources": True,
            "critic_schema": True,
            "critic_association": True,
            "critic_inference": True,
        })}
        self.assertEqual(set(rows), {"CRIT-01", "CRIT-03", "CRIT-05"})
        self.assertTrue(all(row["status"] == "pass" for row in rows.values()))

    def test_policy_scan_detects_metered_ai_scraping_and_trackers(self):
        self.assertIsNotNone(scan_text_for_policy_violations, "scripts.map_data_compliance_metrics must exist")
        text = "fetch('https://api.openai.com/v1/responses'); const x='scraperapi.com'; const y='googletagmanager.com';"
        findings = scan_text_for_policy_violations(text)
        self.assertIn("metered_ai", findings)
        self.assertIn("scraping", findings)
        self.assertIn("tracker", findings)

    def test_policy_scan_ignores_normal_local_static_code(self):
        self.assertIsNotNone(scan_text_for_policy_violations, "scripts.map_data_compliance_metrics must exist")
        self.assertEqual(scan_text_for_policy_violations("fetch('data/movies.json'); localStorage.setItem('x','y')"), set())


if __name__ == "__main__":
    unittest.main()
