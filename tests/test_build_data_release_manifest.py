import datetime as dt
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

MODULE = Path(__file__).resolve().parents[1] / "scripts" / "build_data_release_manifest.py"
spec = importlib.util.spec_from_file_location("release_manifest", MODULE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
SHA = "a" * 40


class ManifestTests(unittest.TestCase):
    def test_same_bytes_have_same_version(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            data = root / "data.json"
            data.write_text('{"movies":[]}', encoding="utf-8")
            first = module.manifest_for([data], root, SHA, "2026-11-06T00:00:00Z")
            second = module.manifest_for([data], root, SHA, "2026-11-07T00:00:00Z")
            self.assertEqual(first["dataset_version"], second["dataset_version"])
            self.assertEqual(first["status"], "candidate")
            data.write_text('{"movies":[1]}', encoding="utf-8")
            changed = module.manifest_for([data], root, SHA, "2026-11-07T00:00:00Z")
            self.assertNotEqual(first["dataset_version"], changed["dataset_version"])

    def test_relative_path_uses_explicit_root(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "snapshot.json").write_text('{"ok":true}', encoding="utf-8")
            result = module.manifest_for([Path("snapshot.json")], root, SHA, "now")
            self.assertEqual(result["snapshots"][0]["path"], "snapshot.json")

    def test_rejects_invalid_json(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "bad.json"
            path.write_text("{broken", encoding="utf-8")
            with self.assertRaises(json.JSONDecodeError):
                module.manifest_for([path], Path(folder), SHA, "now")

    def test_rejects_invalid_source_sha(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "good.json"
            path.write_text("{}", encoding="utf-8")
            with self.assertRaises(ValueError):
                module.manifest_for([path], Path(folder), "main", "now")

    def test_rejects_duplicate_paths(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "good.json"
            path.write_text("{}", encoding="utf-8")
            with self.assertRaises(ValueError):
                module.manifest_for([path, path], Path(folder), SHA, "now")

    def test_rejects_missing_files(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaises(ValueError):
                module.manifest_for([Path(folder) / "missing.json"], Path(folder), SHA, "now")


if __name__ == "__main__":
    unittest.main()
