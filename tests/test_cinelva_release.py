"""Release checks for displayed identity, separate from legacy storage names."""
from html.parser import HTMLParser
from pathlib import Path
import re
import hashlib
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]


class DisplayCopy(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hidden = 0
        self.copy = []

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.hidden += 1
        for key, value in attrs:
            if key in ('alt', 'title', 'aria-label') and value:
                self.copy.append(value)
            if tag == 'meta' and key == 'content' and value:
                self.copy.append(value)

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.hidden = max(0, self.hidden - 1)

    def handle_data(self, data):
        if not self.hidden:
            self.copy.append(data)


class RebrandReleaseTests(unittest.TestCase):
    def test_legacy_namespaces_and_record_modules_are_preserved(self):
        contract = json.loads((ROOT / 'docs/rebranding/cinelva/storage-contract.json').read_text())
        for path, expected in contract['namespaces'].items():
            with self.subTest(path=path):
                actual = sorted(set(re.findall(r'''['"]((?:cinemap[-:]|cinemaNow\.|cinema-theater-)[a-zA-Z0-9:._-]+)['"]''', (ROOT / path).read_text())))
                self.assertEqual(actual, expected)
        for path, digest in contract['unchangedModules'].items():
            with self.subTest(path=path):
                self.assertEqual(hashlib.sha256((ROOT / path).read_bytes()).hexdigest(), digest)

    def test_display_copy_has_no_old_brand(self):
        paths = list(ROOT.glob('*.html')) + list((ROOT / 'cinelva').glob('*.html'))
        paths += list((ROOT / 'preview/ocean').glob('*.html'))
        for path in paths:
            with self.subTest(path=str(path.relative_to(ROOT))):
                parser = DisplayCopy()
                parser.feed(path.read_text())
                old = [s.strip() for s in parser.copy if re.search('cinemap', s, re.I)]
                self.assertEqual(old, [])


if __name__ == '__main__':
    unittest.main()
