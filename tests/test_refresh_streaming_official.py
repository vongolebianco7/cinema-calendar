import importlib.util
import json
import pathlib
import tempfile
import unittest

SCRIPT = pathlib.Path(__file__).resolve().parents[1] / "scripts/refresh_streaming_official.py"
spec = importlib.util.spec_from_file_location("refresh_streaming_official", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class RefreshTest(unittest.TestCase):
    def test_uses_registered_services_without_rejecting_fod(self):
        self.assertIn("FOD", module.ALLOWED)
        self.assertIn("DMM TV", module.ALLOWED)

    def test_empty_optional_identity_metadata_is_not_exported(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            source, output = root / "source.json", root / "output.json"
            entry = {
                "title": "Test", "date": "2026-11-10",
                "event": "streaming", "service": "Netflix",
                "source_url": "https://example.org/official",
                "poster": "", "poster_path": None, "tmdb_id": "",
                "release_year": None, "image_url": "",
            }
            source.write_text(json.dumps({"period": "2026-11", "movies": [entry]}), encoding="utf-8")
            self.assertTrue(module.refresh(source, output))
            saved = json.loads(output.read_text(encoding="utf-8"))["movies"][0]
            for field in ("poster", "poster_path", "tmdb_id", "release_year", "image_url"):
                self.assertNotIn(field, saved)
            self.assertEqual(saved["title"], "Test")

    def test_deduplicates_and_preserves_existing_on_bad_source(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            source, output = root / "source.json", root / "output.json"
            entry = {"title": "Test", "date": "2026-11-10", "event": "streaming", "service": "Netflix", "source_url": "https://example.org/official"}
            source.write_text(json.dumps({"period": "2026-11", "movies": [entry, entry]}), encoding="utf-8")
            self.assertTrue(module.refresh(source, output))
            self.assertEqual(len(json.loads(output.read_text())["movies"]), 1)
            previous = output.read_bytes()
            source.write_text('{"movies":[]}', encoding="utf-8")
            with self.assertRaises(ValueError):
                module.refresh(source, output)
            self.assertEqual(output.read_bytes(), previous)

    def test_default_refresh_combines_new_months_without_code_changes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            source_dir = root / "data"
            source_dir.mkdir()
            output = root / "output.json"
            entry = {"title": "Test", "date": "2026-11-10", "event": "streaming", "service": "Netflix", "source_url": "https://example.org/official"}
            (source_dir / "streaming-2026-11-official-supplement.json").write_text(json.dumps({"period": "2026-11", "movies": [entry]}), encoding="utf-8")
            november = (source_dir / "streaming-2026-11-official-supplement.json").read_text(encoding="utf-8")
            (source_dir / "streaming-2026-12-official-supplement.json").write_text(json.dumps({"period": "2026-12", "movies": [{**entry, "date": "2026-12-01", "title": "Next month"}]}), encoding="utf-8")
            original_root = module.ROOT
            module.ROOT = root
            try:
                self.assertTrue(module.refresh(output=output))
            finally:
                module.ROOT = original_root
            refreshed = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(refreshed["periods"], ["2026-11", "2026-12"])
            self.assertIsNone(refreshed["period"])
            self.assertEqual(refreshed["count"], 2)
if __name__ == "__main__":
    unittest.main()
