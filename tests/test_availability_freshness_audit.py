import datetime as dt
import importlib.util
from pathlib import Path
import unittest

PATH=Path(__file__).resolve().parents[1]/"scripts"/"audit_availability_freshness.py"
SPEC=importlib.util.spec_from_file_location("freshness_audit",PATH)
MODULE=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
NOW=dt.datetime(2026,10,17,12,tzinfo=dt.timezone.utc)

class AvailabilityFreshnessAuditTests(unittest.TestCase):
    def test_snapshot_timestamp_does_not_make_stale_titles_fresh(self):
        sample={"generated_at":NOW.isoformat(),"movies":{
            "1":{"checked_at":"2026-10-16T11:00:00+00:00","flatrate":["Service"]},
            "2":{"checked_at":"2026-09-26T11:00:00Z","flatrate":["Old service"]},
            "3":{"checked_at":"2026-10-16T11:00:00"},
            "4":{},
        }}
        summary=MODULE.summarize(sample,NOW)
        self.assertEqual(summary["total"],4)
        self.assertEqual(summary["fresh_7d"],1)
        self.assertEqual(summary["stale_7d"],3)
        self.assertEqual(summary["missing_or_invalid_checked_at"],2)
        self.assertEqual(summary["fresh_pct"],25)
        self.assertEqual(summary["observations_with_providers_fresh_7d"],1)

    def test_unknown_and_future_checks_never_count_as_fresh(self):
        sample={"movies":{"1":{"checked_at":"2026-10-18T12:00:00Z"},
                          "2":{"checked_at":"not-a-timestamp"}}}
        report=MODULE.summarize(sample,NOW)
        self.assertEqual(report["fresh_7d"],0)
        self.assertEqual(report["stale_7d"],2)

    def test_empty_snapshot_has_defined_zero_rate(self):
        result=MODULE.summarize({"movies":{}},NOW)
        self.assertEqual(result["total"],0)
        self.assertEqual(result["fresh_pct"],0)

if __name__=="__main__":
    unittest.main()
