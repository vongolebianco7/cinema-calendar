"""Regression tests for fair, per-title watch-provider refresh scheduling."""
import datetime
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "update_availability", ROOT / "scripts" / "update_availability.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
NOW = datetime.datetime(2026, 10, 17, 11, tzinfo=datetime.timezone.utc)

def candidate(mid, event="streaming", distance=0):
    return (mid, (distance, {"id": mid, "event": event}))

class WatchProviderFairnessTests(unittest.TestCase):
    def test_oldest_provider_observations_win_over_release_proximity(self):
        candidates = [candidate(1, distance=0), candidate(2, distance=60),
                      candidate(3, distance=20)]
        cache = {
            "1": {"checked_at": "2026-10-08T00:00:00+00:00"},
            "2": {"checked_at": "2026-09-23T00:00:00+00:00"},
            "3": {"checked_at": "2026-10-01T00:00:00+00:00"},
        }
        ids = [mid for mid, _ in MODULE.select_due_observations(candidates, cache, NOW)]
        self.assertEqual(ids, [2, 3, 1])

    def test_never_observed_titles_are_first_and_streaming_comes_first(self):
        candidates = [candidate(3, "theatrical"), candidate(1),
                      candidate(2, distance=4)]
        cache = {"2": {"checked_at": "2026-09-01T00:00:00Z"}}
        ids = [mid for mid, _ in MODULE.select_due_observations(candidates, cache, NOW)]
        self.assertEqual(ids, [1, 2, 3])

    def test_recent_observations_skip_and_missing_timezone_cannot_claim_freshness(self):
        candidates = [candidate(1), candidate(2), candidate(3), candidate(4)]
        cache = {"1": {"checked_at": "2026-10-16T00:00:00Z"},
                 "2": {"checked_at": "2026-10-16T00:00:00"},
                 "3": {"checked_at": "nonsense"},
                 "4": {"checked_at": "2026-10-18T00:00:00Z"}}
        ids = [mid for mid, _ in MODULE.select_due_observations(candidates, cache, NOW)]
        self.assertEqual(ids, [2, 3, 4])

    def test_maximum_refresh_count_respected_and_no_mutation(self):
        candidates = [candidate(i) for i in range(1, 26)]
        cache = {}
        selected = MODULE.select_due_observations(candidates, cache, NOW, limit=20)
        self.assertEqual(len(selected), 20)
        self.assertEqual(len(candidates), 25)
        self.assertEqual(cache, {})


    def test_daily_capacity_covers_weekly_snapshot_and_reserves_theatrical_slots(self):
        candidates = [candidate(i, "streaming") for i in range(1, 81)]
        candidates += [candidate(i, "theatrical") for i in range(101, 141)]
        selected = MODULE.select_due_observations(candidates, {}, NOW, limit=MODULE.DAILY_OBSERVATION_LIMIT)
        ids = [mid for mid, _ in selected]
        self.assertEqual(MODULE.DAILY_OBSERVATION_LIMIT, 60)
        self.assertEqual(len(ids), 60)
        self.assertEqual(sum(mid < 100 for mid in ids), 40)
        self.assertEqual(sum(mid > 100 for mid in ids), 20)
        self.assertEqual(len(set(ids)), 60)

    def test_unused_reserved_slots_are_reassigned_without_wasting_api_calls(self):
        candidates = [candidate(i) for i in range(1, 5)]
        candidates += [candidate(i, "theatrical") for i in range(101, 170)]
        selected = MODULE.select_due_observations(candidates, {}, NOW, limit=60)
        ids = [mid for mid, _ in selected]
        self.assertEqual(len(ids), 60)
        self.assertEqual(sum(mid < 100 for mid in ids), 4)
        self.assertEqual(sum(mid > 100 for mid in ids), 56)

if __name__ == "__main__":
    unittest.main()
