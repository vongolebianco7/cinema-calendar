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
    def run_fixture(self, movies, result):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "streaming.json"
        path.write_text(json.dumps({"movies": movies}), encoding="utf-8")
        requests = []

        def opener(request, timeout):
            requests.append((request, timeout))
            return Response(result)

        counts = enrichment.enrich(path, api_key="fixture-secret", opener=opener, delay=0)
        return json.loads(path.read_text(encoding="utf-8")), requests, counts

    def test_unique_exact_title_adds_only_a_tmdb_poster_url(self):
        data, requests, counts = self.run_fixture(
            [{"title": "グーニーズ", "date": "2026-11-01", "event": "streaming", "service": "Prime Video"}],
            {"results": [{"id": 9340, "title": "グーニーズ", "original_title": "The Goonies", "poster_path": "/goonies.jpg"}]},
        )
        movie = data["movies"][0]
        self.assertEqual(movie["poster"], "https://image.tmdb.org/t/p/w500/goonies.jpg")
        self.assertNotIn("tmdbId", movie)
        self.assertNotIn("id", movie)
        self.assertEqual(counts, (1, 0, 0))
        self.assertEqual(len(requests), 1)
        self.assertEqual(requests[0][0].full_url.split("?", 1)[0], enrichment.BASE)

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

    def test_missing_api_key_preserves_existing_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "streaming.json"
            original = '{"movies":[{"title":"Keep"}]}\n'
            path.write_text(original, encoding="utf-8")
            with patch.dict("os.environ", {"TMDB_API_KEY": ""}):
                with self.assertRaisesRegex(ValueError, "TMDB_API_KEY"):
                    enrichment.enrich(path, api_key="", delay=0)
            self.assertEqual(path.read_text(encoding="utf-8"), original)


if __name__ == "__main__":
    unittest.main()
