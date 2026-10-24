"""Historical equipment bootstrap must preserve subsequent manual reviews."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class EquipmentPreservation(unittest.TestCase):
    def test_bootstrap_preserves_reviewed_rows_and_is_idempotent(self):
        spec = importlib.util.spec_from_file_location('imax_bootstrap', ROOT / 'scripts/apply_experience_picker_imax_coverage_20260927.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        original = json.loads((ROOT / 'data/theater_formats.json').read_text())
        with tempfile.TemporaryDirectory() as tmp:
            module.DATA = Path(tmp) / 'formats.json'
            module.DATA.write_text(json.dumps(original, ensure_ascii=False))
            module.patch_data()
            updated = json.loads(module.DATA.read_text())
            self.assertEqual(updated['screens'], original['screens'])
            self.assertEqual(updated['generated_at'], original['generated_at'])
            module.patch_data()
            self.assertEqual(json.loads(module.DATA.read_text()), updated)


if __name__ == '__main__':
    unittest.main()
