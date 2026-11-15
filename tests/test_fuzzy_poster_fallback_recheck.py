import datetime
import json
import tempfile
import unittest
from pathlib import Path

from scripts import backfill_boxoffice_posters as backfill


class Response:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return json.dumps(self.payload).encode()


class FuzzyFallbackRecheckTests(unittest.TestCase):
    def run_row(self, payload):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        path = Path(temp.name) / "boxoffice.json"
        row = {
            "title": "テスト映画",
            "gross": 12.3,
            "year": 2000,
            "poster": "https://image.tmdb.org/t/p/w500/related-title.jpg",
            "poster_match_status": "fuzzy_related_title_or_screening_group",
            "poster_check_version": backfill.POSTER_CHECK_VERSION,
            "poster_checked_at": "2026-11-14T00:00:00Z",
            "poster_check_skip_reason": "fuzzy_related_title_or_screening_group",
        }
        path.write_text(json.dumps({"by_year": {"2000": [row]}, "all_time": []}), encoding="utf-8")
        requests = []

        def opener(request, timeout):
            requests.append(request.full_url)
            return Response(payload)

        now = datetime.datetime(2026, 11, 15, tzinfo=datetime.timezone.utc)
        result = backfill.backfill(path, api_key="fixture", opener=opener, delay=0,
                                   now=now, catalog_paths=[])
        return json.loads(path.read_text(encoding="utf-8"))["by_year"]["2000"][0], result, requests, now

    def test_verified_exact_tmdb_identity_replaces_fallback_and_preserves_gross(self):
        payload = {
            "results": [{
                "id": 43210,
                "title": "テスト映画",
                "original_title": "Test Movie",
                "release_date": "1999-07-01",
                "poster_path": "/its-own-poster.jpg",
            }]
        }
        row, result, requests, _ = self.run_row(payload)
        self.assertEqual(row["tmdbId"], 43210)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/its-own-poster.jpg")
        self.assertEqual(row["poster_match_status"], "matched")
        self.assertEqual(row["gross"], 12.3)
        self.assertNotIn("poster_fallback_checked_at", row)
        self.assertEqual(result["enriched"], 1)
        self.assertGreater(len(requests), 0)

    def test_no_verified_match_retains_but_does_not_relabel_fallback(self):
        row, result, _, now = self.run_row({"results": []})
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/related-title.jpg")
        self.assertNotIn("tmdbId", row)
        self.assertEqual(row["poster_match_status"], "fuzzy_related_title_or_screening_group")
        self.assertEqual(row["poster_check_skip_reason"], "no_verified_exact_identity")
        self.assertEqual(row["poster_fallback_checked_at"], "2026-11-15T00:00:00Z")
        self.assertEqual(row["gross"], 12.3)
        self.assertEqual(result["unresolved"], 1)
        self.assertTrue(backfill.poster_checked_recently(row, now))
        self.assertEqual(backfill.candidate_rows({"by_year": {"2000": [row]}}, now, 100), [])


if __name__ == "__main__":
    unittest.main()
