import json
import tempfile
from contextlib import redirect_stdout
from io import StringIO
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
            [{"title": "グーニーズ", "release_year": 1985, "date": "2026-11-01", "event": "streaming", "service": "Prime Video"}],
            {"results": [{"id": 9340, "title": "グーニーズ", "original_title": "The Goonies", "release_date": "1985-06-07", "poster_path": "/goonies.jpg"}]},
        )
        movie = data["movies"][0]
        self.assertEqual(movie["poster"], "https://image.tmdb.org/t/p/w500/goonies.jpg")
        self.assertEqual(movie["id"], 9340)
        self.assertEqual(movie["tmdb"], "https://www.themoviedb.org/movie/9340")
        self.assertNotIn("tmdbId", movie)
        self.assertEqual(counts, (1, 0, 0))
        self.assertEqual(len(requests), 1)
        self.assertEqual(requests[0][0].full_url.split("?", 1)[0], enrichment.BASE)

    def test_canonical_tmdb_url_without_id_uses_exact_details_identity(self):
        data, requests, counts = self.run_fixture(
            [{"title": "Ambiguous Remake", "tmdb": "https://www.themoviedb.org/movie/4321",
              "date": "2026-11-01", "event": "streaming", "service": "Netflix"}],
            {"id": 4321, "poster_path": "/reviewed.jpg"},
        )
        self.assertEqual(data["movies"][0]["id"], 4321)
        self.assertEqual(data["movies"][0]["poster"], "https://image.tmdb.org/t/p/w500/reviewed.jpg")
        self.assertEqual(requests[0][0].full_url.split("?", 1)[0], enrichment.DETAILS.format(4321))
        self.assertEqual(counts, (1, 0, 0))

    def test_conflicting_tmdb_url_and_id_fail_closed_without_request(self):
        data, requests, counts = self.run_fixture(
            [{"title": "Ambiguous Remake", "id": 1234,
              "tmdb": "https://www.themoviedb.org/movie/4321",
              "date": "2026-11-01", "event": "streaming", "service": "Netflix"}],
            {"id": 1234, "poster_path": "/wrong.jpg"},
        )
        self.assertNotIn("poster", data["movies"][0])
        self.assertEqual(requests, [])
        self.assertEqual(counts, (0, 1, 0))

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
                {"title": "The Example", "release_year": 2024, "date": "2026-11-01", "event": "streaming", "service": "Prime Video"},
                {"title": "Keep", "date": "2026-11-01", "event": "streaming", "service": "Prime Video", "poster": "https://image.tmdb.org/t/p/w500/kept.jpg"},
            ],
            {"results": [
                {"id": 1, "title": "The Example", "release_date": "2024-01-01", "poster_path": "/one.jpg"},
                {"id": 2, "title": "The Example", "release_date": "2024-02-01", "poster_path": "/two.jpg"},
            ]},
        )
        self.assertNotIn("poster", data["movies"][0])
        self.assertEqual(data["movies"][1]["poster"], "https://image.tmdb.org/t/p/w500/kept.jpg")
        self.assertEqual(len(requests), 1)
        self.assertEqual(counts, (0, 1, 0))

    def test_ambiguous_api_candidates_are_reported_but_never_assigned(self):
        output = StringIO()
        with redirect_stdout(output):
            data, requests, counts = self.run_fixture(
                [{"title": "The Example", "release_year": 2024, "date": "2026-11-01",
                  "event": "streaming", "service": "Prime Video"}],
                {"results": [
                    {"id": 1, "title": "The Example", "original_title": "Example A",
                     "release_date": "2024-01-01", "poster_path": "/one.jpg"},
                    {"id": 2, "title": "The Example", "original_title": "Example B",
                     "release_date": "2024-01-01", "poster_path": "/two.jpg"},
                ]},
            )
        report = output.getvalue()
        self.assertIn("Streaming poster candidate review", report)
        self.assertIn('"id": 1', report)
        self.assertIn('"id": 2', report)
        self.assertIn("no identity assigned", report)
        self.assertNotIn("fixture-secret", report)
        self.assertNotIn("poster", data["movies"][0])
        self.assertNotIn("id", data["movies"][0])
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
            [{"title": "モアナと伝説の海", "release_year": 2026, "date": "2026-11-18", "event": "streaming", "service": "Disney+"}],
            {"results": []},
            catalog={"movies": [{"id": 1108427, "title": "モアナと伝説の海", "release_year": 2026, "poster": "https://image.tmdb.org/t/p/w500/moana.jpg"}]},
            api_key="",
        )
        movie = data["movies"][0]
        self.assertEqual(movie["poster"], "https://image.tmdb.org/t/p/w500/moana.jpg")
        self.assertEqual(movie["id"], 1108427)
        self.assertEqual(movie["tmdb"], "https://www.themoviedb.org/movie/1108427")
        self.assertEqual(counts, (1, 0, 0))
        self.assertEqual(requests, [])

    def test_nested_director_catalog_shape_is_supported(self):
        data, requests, counts = self.run_fixture(
            [{"title": "Example", "release_year": 2024, "date": "2026-11-18",
              "event": "streaming", "service": "Prime Video"}],
            {"results": []},
            catalog={"directors": {"7": {"works": [
                {"id": 4321, "title": "Example", "year": 2024,
                 "poster": "https://image.tmdb.org/t/p/w342/example.jpg"}
            ]}}},
            api_key="",
        )
        self.assertEqual(data["movies"][0]["id"], 4321)
        self.assertEqual(data["movies"][0]["poster"],
                         "https://image.tmdb.org/t/p/w342/example.jpg")
        self.assertEqual(requests, [])
        self.assertEqual(counts, (1, 0, 0))

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

    def test_existing_canonical_id_uses_details_instead_of_title_search(self):
        data, requests, counts = self.run_fixture(
            [{"title": "Remake", "id": 321, "date": "2026-11-01",
              "event": "streaming", "service": "Prime Video"}],
            {"id": 321, "poster_path": "/reviewed.jpg"},
        )
        self.assertEqual(data["movies"][0]["id"], 321)
        self.assertTrue(data["movies"][0]["poster"].endswith("/reviewed.jpg"))
        self.assertIn("/movie/321?", requests[0][0].full_url)
        self.assertEqual(counts, (1, 0, 0))

    def test_camelcase_tmdb_identity_uses_details(self):
        data, requests, counts = self.run_fixture(
            [{"title": "Example", "tmdbId": 456, "date": "2026-11-01",
              "event": "streaming", "service": "Prime Video"}],
            {"id": 456, "poster_path": "/correct.jpg"},
        )
        self.assertEqual(data["movies"][0]["id"], 456)
        self.assertIn("/movie/456?", requests[0][0].full_url)
        self.assertEqual(counts, (1, 0, 0))

    def test_conflicting_identity_aliases_never_request_or_assign_poster(self):
        data, requests, counts = self.run_fixture(
            [{"title": "Example", "id": 111, "tmdbId": 222,
              "date": "2026-11-01", "event": "streaming", "service": "Prime Video"}],
            {"id": 111, "poster_path": "/wrong.jpg"},
        )
        self.assertNotIn("poster", data["movies"][0])
        self.assertEqual(requests, [])
        self.assertEqual(counts, (0, 1, 0))

    def test_invalid_existing_identity_does_not_fall_back_to_title(self):
        data, requests, counts = self.run_fixture(
            [{"title": "Example", "id": "not-an-id",
              "date": "2026-11-01", "event": "streaming", "service": "Prime Video"}],
            {"results": [{"id": 777, "title": "Example", "poster_path": "/wrong.jpg"}]},
        )
        self.assertNotIn("poster", data["movies"][0])
        self.assertEqual(requests, [])
        self.assertEqual(counts, (0, 0, 1))

    def test_reviewed_id_recovers_local_poster_without_api_key(self):
        data, requests, counts = self.run_fixture(
            [{"title": "A Different Localized Title", "tmdbId": 321,
              "date": "2026-11-01", "event": "streaming", "service": "Prime Video"}],
            {"results": []},
            catalog={"movies": [
                {"id": 321, "title": "Canonical Title",
                 "poster": "https://image.tmdb.org/t/p/w500/correct.jpg"},
                {"id": 999, "title": "A Different Localized Title",
                 "poster": "https://image.tmdb.org/t/p/w500/wrong.jpg"},
            ]},
            api_key="",
        )
        self.assertEqual(data["movies"][0]["id"], 321)
        self.assertTrue(data["movies"][0]["poster"].endswith("/correct.jpg"))
        self.assertEqual(requests, [])
        self.assertEqual(counts, (1, 0, 0))

    def test_unknown_reviewed_id_never_uses_wrong_title_match(self):
        data, requests, counts = self.run_fixture(
            [{"title": "Same Title", "id": 321,
              "date": "2026-11-01", "event": "streaming", "service": "Prime Video"}],
            {"results": []},
            catalog={"movies": [{"id": 999, "title": "Same Title",
                                  "poster": "https://image.tmdb.org/t/p/w500/wrong.jpg"}]},
            api_key="",
        )
        self.assertNotIn("poster", data["movies"][0])
        self.assertEqual(requests, [])
        self.assertEqual(counts, (0, 0, 1))

    def test_title_without_reviewed_release_year_never_assigns_identity(self):
        data, requests, counts = self.run_fixture(
            [{"title": "The Example", "date": "2026-11-01",
              "event": "streaming", "service": "Prime Video"}],
            {"results": [{"id": 111, "title": "The Example",
                          "release_date": "2024-01-01", "poster_path": "/candidate.jpg"}]},
            catalog={"movies": [{"id": 111, "title": "The Example", "release_year": 2024,
                                  "poster": "https://image.tmdb.org/t/p/w500/candidate.jpg"}]},
        )
        self.assertNotIn("id", data["movies"][0])
        self.assertNotIn("poster", data["movies"][0])
        self.assertEqual(requests, [])
        self.assertEqual(counts, (0, 0, 1))

    def test_reviewed_alias_reuses_one_unique_local_identity_without_year(self):
        data, requests, counts = self.run_fixture(
            [{"title": "マッデン", "date": "2026-11-18",
              "event": "streaming", "service": "Prime Video"}],
            {"results": []},
            catalog={"movies": [{"id": 1131943, "title": "Madden", "year": 2026,
                                  "poster": "https://image.tmdb.org/t/p/w342/madden.jpg"}]},
            api_key="",
        )
        movie = data["movies"][0]
        self.assertEqual(movie["id"], 1131943)
        self.assertEqual(movie["release_year"], 2026)
        self.assertEqual(movie["poster"], "https://image.tmdb.org/t/p/w342/madden.jpg")
        self.assertEqual(requests, [])
        self.assertEqual(counts, (1, 0, 0))

    def test_reviewed_alias_with_multiple_local_ids_fails_closed(self):
        data, requests, counts = self.run_fixture(
            [{"title": "マッデン", "date": "2026-11-18",
              "event": "streaming", "service": "Prime Video"}],
            {"results": []},
            catalog={"movies": [
                {"id": 1, "title": "Madden", "year": 1999,
                 "poster": "https://image.tmdb.org/t/p/w342/old.jpg"},
                {"id": 2, "title": "Madden", "year": 2026,
                 "poster": "https://image.tmdb.org/t/p/w342/new.jpg"},
            ]},
            api_key="",
        )
        self.assertNotIn("id", data["movies"][0])
        self.assertNotIn("poster", data["movies"][0])
        self.assertEqual(requests, [])
        self.assertEqual(counts, (0, 1, 0))

    def test_daily_official_refresh_rechecks_existing_streaming_poster_gaps(self):
        workflow = (Path(__file__).resolve().parents[1] / ".github/workflows/refresh-official-streaming.yml").read_text()
        importer = workflow.index("python scripts/import_official_streaming_snapshot.py")
        enrichment = workflow.index("python scripts/enrich_streaming_posters.py --input data/streaming.json")
        self.assertLess(importer, enrichment)
        self.assertIn("TMDB_API_KEY: ${{ secrets.TMDB_API_KEY }}", workflow)

    def test_daily_official_refresh_rebases_before_bounded_main_push_retry(self):
        workflow = (Path(__file__).resolve().parents[1] / ".github/workflows/refresh-official-streaming.yml").read_text()
        start = workflow.index("- name: Commit only verified generated data")
        step = workflow[start:]
        self.assertIn("for attempt in 1 2 3", step)
        self.assertIn("fetch-depth: 0", workflow)
        self.assertIn("git fetch origin main", step)
        self.assertIn("git rebase origin/main", step)
        self.assertIn("git push origin HEAD:main", step)
        self.assertIn("git rebase --abort", step)
        self.assertIn("Unable to publish refreshed streaming data after three safe retries", step)
        self.assertNotIn("git push --force", step)


if __name__ == "__main__":
    unittest.main()
