import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import enrich_streaming_posters as enrichment


class Response:
    def __init__(self, value):
        self.value = value

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return json.dumps(self.value).encode()


class StreamingPosterEnrichmentTests(unittest.TestCase):
    def run_fixture(self, movies, result, catalog=None, api_key="fixture-secret"):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "streaming.json"
        path.write_text(json.dumps({"movies": movies}), encoding="utf-8")
        catalog_path = Path(tmp.name) / "catalog.json"
        catalog_path.write_text(json.dumps(catalog or {"movies": []}), encoding="utf-8")
        requests = []

        def opener(request, timeout):
            requests.append((request, timeout))
            return Response(result)

        counts = enrichment.enrich(path, api_key=api_key, opener=opener, delay=0, catalog_path=catalog_path)
        return json.loads(path.read_text(encoding="utf-8")), requests, counts

    def test_unique_exact_title_adds_tmdb_poster_and_movie_identity(self):
        data, requests, counts = self.run_fixture(
            [{"title": "グーニーズ", "date": "2026-11-01", "event": "streaming", "service": "Prime Video"}],
            {"results": [{"id": 9340, "title": "グーニーズ", "original_title": "The Goonies", "poster_path": "/goonies.jpg"}]},
        )
        movie = data["movies"][0]
        self.assertEqual(movie["poster"], "https://image.tmdb.org/t/p/w500/goonies.jpg")
        self.assertEqual(movie["id"], 9340)
        self.assertEqual(movie["tmdb"], "https://www.themoviedb.org/movie/9340")
        self.assertNotIn("tmdbId", movie)
        self.assertEqual(counts, (1, 0, 0))
        self.assertEqual(len(requests), 1)
        self.assertEqual(requests[0][0].full_url.split("?", 1)[0], enrichment.BASE)

    def test_reviewed_release_year_blocks_wrong_same_title_identity(self):
        data, requests, counts = self.run_fixture(
            [{"title": "The Example", "release_year": 2024, "date": "2026-11-01",
              "event": "streaming", "service": "Prime Video"}],
            {"results": [{"id": 111, "title": "The Example", "release_date": "1998-03-01",
                          "poster_path": "/wrong.jpg"}]},
        )
        movie = data["movies"][0]
        self.assertNotIn("id", movie)
        self.assertNotIn("poster", movie)
        self.assertEqual(counts, (0, 0, 1))
        self.assertEqual(len(requests), 1)

    def test_reviewed_release_year_also_blocks_wrong_local_catalog_identity(self):
        data, requests, counts = self.run_fixture(
            [{"title": "The Example", "release_year": 2024, "date": "2026-11-01",
              "event": "streaming", "service": "Prime Video"}],
            {"results": []},
            catalog={"movies": [{"id": 111, "title": "The Example", "year": 1998,
                                  "poster": "https://image.tmdb.org/t/p/w500/wrong.jpg"}]},
            api_key="",
        )
        movie = data["movies"][0]
        self.assertNotIn("id", movie)
        self.assertNotIn("poster", movie)
        self.assertEqual(counts, (0, 0, 1))
        self.assertEqual(requests, [])

    def test_update_movies_workflow_enriches_streaming_snapshot_after_catalog_refresh(self):
        workflow = (Path(__file__).resolve().parents[1] / ".github/workflows/update-movies.yml").read_text()
        self.assertIn("python scripts/enrich_streaming_posters.py --input data/streaming.json", workflow)
        self.assertLess(workflow.index("python scripts/update_movies.py"),
                        workflow.index("python scripts/enrich_streaming_posters.py --input data/streaming.json"))

    def test_ambiguous_exact_titles_and_existing_posters_are_not_replaced(self):
        data, requests, counts = self.run_fixture(
            [
                {"title": "The Example", "date": "2026-11-01", "event": "streaming", "service": "Prime Video"},
                {"title": "Keep", "date": "2026-11-01", "event": "streaming", "service": "Prime Video", "poster": "https://image.tmdb.org/t/p/w500/kept.jpg"},
            ],
            {"results": [
                {"id": 1, "title": "The Example", "poster_path": "/one.jpg"},
                {"id": 2, "title": "The Example", "poster_path": "/two.jpg"},
            ]},
        )
        self.assertNotIn("poster", data["movies"][0])
        self.assertEqual(data["movies"][1]["poster"], "https://image.tmdb.org/t/p/w500/kept.jpg")
        self.assertEqual(len(requests), 1)
        self.assertEqual(counts, (0, 1, 0))

    def test_missing_api_key_leaves_unmatched_entries_without_posters(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "streaming.json"
            original = '{"movies":[{"title":"Keep"}]}\n'
            path.write_text(original, encoding="utf-8")
            catalog = Path(tmp) / "catalog.json"
            catalog.write_text('{"movies":[]}', encoding="utf-8")
            self.assertEqual(enrichment.enrich(path, api_key="", delay=0, catalog_path=catalog), (0, 0, 1))
            self.assertEqual(json.loads(path.read_text(encoding="utf-8"))["movies"], [{"title": "Keep"}])

    def test_unique_exact_local_catalog_identity_supplies_existing_poster_without_api(self):
        data, requests, counts = self.run_fixture(
            [{"title": "モアナと伝説の海", "date": "2026-11-18", "event": "streaming", "service": "Disney+"}],
            {"results": []},
            catalog={"movies": [{"id": 1108427, "title": "モアナと伝説の海", "poster": "https://image.tmdb.org/t/p/w500/moana.jpg"}]},
            api_key="",
        )
        movie = data["movies"][0]
        self.assertEqual(movie["poster"], "https://image.tmdb.org/t/p/w500/moana.jpg")
        self.assertEqual(movie["id"], 1108427)
        self.assertEqual(movie["tmdb"], "https://www.themoviedb.org/movie/1108427")
        self.assertEqual(counts, (1, 0, 0))
        self.assertEqual(requests, [])

    def test_reviewed_tmdb_id_fetches_poster_from_its_movie_record(self):
        data, requests, counts = self.run_fixture(
            [{"title": "DUNE/デューン 砂の惑星PART2", "tmdb_id": 693134, "date": "2026-11-02", "event": "streaming", "service": "Prime Video"}],
            {"id": 693134, "title": "Dune: Part Two", "poster_path": "/dune2.jpg"},
        )
        movie = data["movies"][0]
        self.assertEqual(movie["poster"], "https://image.tmdb.org/t/p/w500/dune2.jpg")
        self.assertEqual(movie["id"], 693134)
        self.assertIn("/movie/693134?", requests[0][0].full_url)
        self.assertEqual(counts, (1, 0, 0))


if __name__ == "__main__":
    unittest.main()
