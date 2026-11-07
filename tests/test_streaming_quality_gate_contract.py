"""Guard all four streaming ingestion contracts against accidental quality-gate loss.

The ingestion tests were introduced in separate PRs; merging/rebasing must
retain every check, even if the gate's command list is reorganized.
"""
import ast
import os
from pathlib import Path
import subprocess
import sys
import tempfile
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

    def test_streaming_poster_test_uses_file_discovery_when_an_external_tests_package_exists(self):
        root = GATE.parent.parent
        with tempfile.TemporaryDirectory() as directory:
            external = Path(directory) / "tests"
            external.mkdir()
            (external / "__init__.py").write_text("# Simulate a preinstalled top-level tests package.\n", encoding="utf-8")
            env = {**os.environ, "PYTHONPATH": directory}
            command = [sys.executable, "-m", "unittest", "discover", "-s", "tests",
                       "-p", "test_streaming_poster_enrichment.py", "-v"]
            result = subprocess.run(command, cwd=root, env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("test_unique_exact_title_adds_tmdb_poster_and_movie_identity", result.stderr)


if __name__ == "__main__":
    unittest.main()
