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
if __name__ == "__main__":
    unittest.main()
