import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

from scripts.discover_streaming_announcements import discover


class DiscoveryTests(unittest.TestCase):
    def test_empty_allowlist_is_stable_and_does_not_fetch(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            config = root / "feeds.json"
            output = root / "candidates.json"
            config.write_text(json.dumps({"feeds": []}), encoding="utf-8")
            def no_network(*args, **kwargs):
                raise AssertionError("unexpected network call")
            self.assertEqual(discover(config, output, opener=no_network), 0)
            first = output.read_bytes()
            self.assertEqual(discover(config, output, opener=no_network), 0)
            self.assertEqual(output.read_bytes(), first)
            self.assertEqual(json.loads(first)["candidates"], [])


if __name__ == "__main__":
    unittest.main()
