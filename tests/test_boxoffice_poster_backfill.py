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


class BoxofficePosterBackfillTests(unittest.TestCase):
    def run_rows(self, rows, payload, **kwargs):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        path.write_text(json.dumps({"by_year": {"1980": rows}, "all_time": []}), encoding="utf-8")
        requests = []

        def opener(request, timeout):
            requests.append((request, timeout))
            return Response(payload)

        now = datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc)
        result = backfill.backfill(path, api_key="fixture", opener=opener, delay=0,
                                   now=now, **kwargs)
        return json.loads(path.read_text(encoding="utf-8")), requests, result

    def test_unique_exact_title_in_adjacent_release_year_recovers_poster(self):
        data, requests, result = self.run_rows(
            [{"title": "カリギュラ", "gross": 47.2, "year": 1980, "metric": "配給収入"}],
            {"results": [{"id": 9453, "title": "カリギュラ", "original_title": "Caligola",
                          "release_date": "1979-08-14", "poster_path": "/caligula.jpg"}]},
        )
        row = data["by_year"]["1980"][0]
        self.assertEqual(row["tmdbId"], 9453)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/caligula.jpg")
        self.assertEqual(row["identity_match"], "exact_title_and_release_year_window")
        self.assertEqual((row["gross"], row["year"], row["metric"]), (47.2, 1980, "配給収入"))
        self.assertEqual(len(requests), 1)
        self.assertIn("api.themoviedb.org/3/search/movie", requests[0][0].full_url)
        self.assertEqual(result["enriched"], 1)

    def test_multiple_exact_title_candidates_remain_unresolved(self):
        data, requests, result = self.run_rows(
            [{"title": "同名作品", "gross": 10, "year": 1980}],
            {"results": [
                {"id": 1, "title": "同名作品", "release_date": "1979-01-01", "poster_path": "/one.jpg"},
                {"id": 2, "title": "同名作品", "release_date": "1980-01-01", "poster_path": "/two.jpg"},
            ]},
        )
        row = data["by_year"]["1980"][0]
        self.assertNotIn("poster", row)
        self.assertNotIn("tmdbId", row)
        self.assertTrue(row["poster_checked_at"])
        self.assertEqual(result["ambiguous"], 1)
        self.assertEqual(len(requests), 1)

    def test_posterless_same_title_candidate_still_makes_identity_ambiguous(self):
        data, requests, result = self.run_rows(
            [{"title": "同名作品", "gross": 10, "year": 1980}],
            {"results": [
                {"id": 1, "title": "同名作品", "release_date": "1979-01-01", "poster_path": "/one.jpg"},
                {"id": 2, "title": "同名作品", "release_date": "1980-01-01", "poster_path": None},
            ]},
        )
        row = data["by_year"]["1980"][0]
        self.assertNotIn("poster", row)
        self.assertNotIn("tmdbId", row)
        self.assertEqual(result["ambiguous"], 1)
        self.assertEqual(len(requests), 1)

    def test_compound_market_row_is_not_assigned_one_film_poster(self):
        data, requests, result = self.run_rows(
            [{"title": "映画A / 映画B", "gross": 15.5, "year": 1980}],
            {"results": [{"id": 10, "title": "映画A / 映画B", "release_date": "1980-01-01",
                          "poster_path": "/wrong.jpg"}]},
        )
        self.assertNotIn("poster", data["by_year"]["1980"][0])
        self.assertEqual(requests, [])
        self.assertEqual(result["grouped"], 1)

    def test_no_match_is_not_guessed_from_boxoffice_year(self):
        data, requests, result = self.run_rows(
            [{"title": "未登録作品", "gross": 10, "year": 1980}],
            {"results": [{"id": 10, "title": "近い作品", "release_date": "1980-01-01",
                          "poster_path": "/wrong.jpg"}]},
        )
        self.assertNotIn("poster", data["by_year"]["1980"][0])
        self.assertNotIn("tmdbId", data["by_year"]["1980"][0])
        self.assertEqual(result["unresolved"], 1)
        self.assertEqual(len(requests), 1)

    def test_existing_poster_is_never_replaced_and_missing_key_is_read_only(self):
        data, requests, result = self.run_rows(
            [{"title": "既存", "gross": 5, "year": 1980,
              "poster": "https://image.tmdb.org/t/p/w500/existing.jpg"}],
            {"results": []},
        )
        self.assertEqual(data["by_year"]["1980"][0]["poster"], "https://image.tmdb.org/t/p/w500/existing.jpg")
        self.assertEqual(requests, [])
        self.assertEqual(result["enriched"], 0)


if __name__ == "__main__":
    unittest.main()
