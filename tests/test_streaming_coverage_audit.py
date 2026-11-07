import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from audit_streaming_coverage import audit


class StreamingCoverageAuditTests(unittest.TestCase):
    def test_all_twelve_services_reported_without_false_claims(self):
        result = audit()
        self.assertEqual(result["services_count"], 12)
        self.assertEqual(len(result["services"]), 12)
        self.assertEqual(result["automated_premiere_services"], 0)
        snapshot = json.loads((ROOT / "data" / "streaming.json").read_text(encoding="utf-8"))
        cited = [record for record in snapshot["movies"]
                 if isinstance(record.get("title"), str) and record["title"].strip()
                 and isinstance(record.get("date"), str)
                 and isinstance(record.get("source_url"), str)
                 and record["source_url"].startswith("https://")]
        self.assertEqual(result["cited_curated_record_count"],
                         sum(row["records_with_https_citations"] for row in result["services"]))
        self.assertEqual(result["cited_curated_record_count"], len(cited))
        self.assertGreater(result["services_with_cited_curated_records"], 0)
        for row in result["services"]:
            self.assertEqual(row["registered_approved_feeds"], 0)
            self.assertTrue(row["limitation"] is None or "not continuous discovery" in row["limitation"]
                            or "does not mean no releases" in row["limitation"])
            if row["records_with_https_citations"]:
                self.assertEqual(row["premiere_discovery"], "manual_curated_with_citations")
            else:
                self.assertEqual(row["premiere_discovery"], "no_cited_premiere_records")

    def test_cli_persists_machine_readable_report_atomically(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "nested" / "coverage.json"
            subprocess.run([sys.executable, str(ROOT / "scripts" / "audit_streaming_coverage.py"),
                            "--output", str(output)], check=True, capture_output=True, text=True)
            report = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(report["services_count"], 12)
            self.assertEqual(report["automated_premiere_services"], 0)
            self.assertEqual(list(output.parent.glob(".coverage.json-*.tmp")), [])

    def test_daily_audit_workflow_preserves_streaming_coverage_artifact(self):
        workflow = (ROOT / ".github/workflows/audit-data-freshness.yml").read_text(encoding="utf-8")
        self.assertIn("python scripts/audit_streaming_coverage.py --output streaming-coverage-report.json", workflow)
        self.assertIn("name: external-data-audit-reports", workflow)
        self.assertIn("streaming-coverage-report.json", workflow)

if __name__ == "__main__":
    unittest.main()
