"""Regression: reviewed streaming supplements must preserve valid movie metadata."""
import importlib.util
import json
import pathlib
import tempfile
import unittest

SCRIPT = pathlib.Path(__file__).resolve().parents[1] / "scripts/refresh_streaming_official.py"
spec = importlib.util.spec_from_file_location("streaming_refresh_preservation", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class StreamingMetadataPreservationTest(unittest.TestCase):
    def test_verified_nonempty_identity_and_poster_survive_refresh(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            source = root / "source.json"
            output = root / "output.json"
            movie = {
                "title": "Test Film", "date": "2026-11-10",
                "event": "streaming", "service": "Netflix",
                "source_url": "https://example.org/official",
                "poster": "https://image.tmdb.org/t/p/w500/valid.jpg",
                "poster_path": "/valid.jpg", "tmdb_id": 12345,
                "release_year": 2025, "year": 2025,
            }
            source.write_text(json.dumps({"period": "2026-11", "movies": [movie]}), encoding="utf-8")
            self.assertTrue(module.refresh(source=source, output=output))
            saved = json.loads(output.read_text(encoding="utf-8"))["movies"][0]
            for field in ("poster", "poster_path", "tmdb_id", "release_year", "year"):
                self.assertEqual(saved[field], movie[field])
            self.assertFalse(module.refresh(source=source, output=output))


    def test_verified_heartland_release_keeps_exact_tmdb_identity_and_poster(self):
        catalog_path = pathlib.Path(__file__).resolve().parents[1] / "data" / "streaming.json"
        data = json.loads(catalog_path.read_text(encoding="utf-8"))
        matches = [
            row for row in data["movies"]
            if row.get("title") == "ハートランド"
            and row.get("service") == "Netflix"
            and row.get("date") == "2026-11-13"
        ]
        self.assertEqual(len(matches), 1)
        movie = matches[0]
        self.assertEqual(movie["id"], 1543469)
        self.assertEqual(movie["tmdb_id"], 1543469)
        self.assertEqual(movie["tmdb"], "https://www.themoviedb.org/movie/1543469")
        self.assertEqual(movie["release_year"], 2026)
        self.assertEqual(movie["year"], 2026)
        self.assertEqual(
            movie["poster"],
            "https://image.tmdb.org/t/p/w500/zhxlzxBlO1sWB1rPn7RmAoeQ2na.jpg",
        )
        self.assertEqual(movie["original_title"], "Heartland")
        self.assertIn("netflix.com/", movie["source_url"])

if __name__ == "__main__":
    unittest.main()
