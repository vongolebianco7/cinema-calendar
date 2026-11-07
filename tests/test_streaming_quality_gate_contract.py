"""Guard all four streaming ingestion contracts against accidental quality-gate loss.

The ingestion tests were introduced in separate PRs; merging/rebasing must
retain every check, even if the gate's command list is reorganized.
"""
import ast
from pathlib import Path
import unittest

GATE = Path(__file__).resolve().parents[1] / "scripts" / "quality_gate.py"
REQUIRED = {
    "tests.test_streaming_discovery_compliance",
    "tests.test_streaming_coverage_audit",
    "tests.test_atomic_streaming_publish",
    "tests.test_streaming_event_normalization",
}


class StreamingQualityGateContract(unittest.TestCase):
    def test_all_streaming_contracts_are_invoked(self):
        tree = ast.parse(GATE.read_text(encoding="utf-8"), filename=str(GATE))
        invoked = set()
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            if not isinstance(node.func, ast.Name) or node.func.id != "run":
                continue
            if not node.args or not isinstance(node.args[0], ast.List):
                continue
            args = [item.value for item in node.args[0].elts
                    if isinstance(item, ast.Constant) and isinstance(item.value, str)]
            if args[:3] == ["python", "-m", "unittest"]:
                invoked.update(args[3:])
        self.assertFalse(REQUIRED - invoked,
                         "Streaming quality-gate checks missing: " +
                         ", ".join(sorted(REQUIRED - invoked)))

    def test_all_streaming_contract_modules_exist(self):
        root = GATE.parent.parent
        for module in sorted(REQUIRED):
            with self.subTest(module=module):
                self.assertTrue((root / (module.replace(".", "/") + ".py")).is_file(),
                                f"Missing contract module: {module}")


if __name__ == "__main__":
    unittest.main()
