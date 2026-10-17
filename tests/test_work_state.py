import importlib.util
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("check_work_state", ROOT / "scripts/check_work_state.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class WorkStateTest(unittest.TestCase):
    def test_checkpoint_is_valid(self):
        import json
        state = json.loads((ROOT / "docs/operations/work-state.json").read_text(encoding="utf-8"))
        self.assertEqual([], MODULE.validate(state))

    def test_unknown_state_cannot_claim_completion(self):
        state = {
            "schema_version": 1, "updated_at": "now", "base_branch": "main", "base_sha": "abc",
            "status": "done", "work_items": [{"id": "x", "title": "x", "status": "done", "acceptance": "x"}],
            "verification": [], "blockers": [], "deployment": {"status": "done"}, "next_action": "x",
        }
        errors = MODULE.validate(state)
        self.assertGreaterEqual(len(errors), 3)


if __name__ == "__main__":
    unittest.main()
