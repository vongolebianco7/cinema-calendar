import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('audit_python_suite', ROOT / 'scripts/audit_python_suite.py')
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

class PythonSuiteAuditTests(unittest.TestCase):
    def test_collects_assertions_and_import_time_errors(self):
        log = """FAIL: test_layout (test_old.OldTests)
ERROR: test_legacy_renderer (test_old.RendererTests)
Ran 98 tests in 5.123s
FAILED (failures=1, errors=1)"""
        result = MODULE.parse_output(log, 1)
        self.assertEqual(result['status'], 'failed')
        self.assertEqual(result['tests_run'], 98)
        self.assertEqual(result['failures'], 1)
        self.assertEqual(result['errors'], 1)
        self.assertEqual(len(result['cases']), 2)

    def test_success_is_not_reported_as_failure(self):
        result = MODULE.parse_output("Ran 3 tests in 0.01s\nOK\n", 0)
        self.assertEqual(result['status'], 'passed')
        self.assertEqual(result['cases'], [])

    def test_unknown_crash_remains_failed(self):
        result = MODULE.parse_output('Interpreter stopped before discovery', 2)
        self.assertEqual(result['status'], 'failed')
        self.assertIsNone(result['tests_run'])

if __name__ == '__main__':
    unittest.main()
