"""Local-only browser fixture serving the actual static Vercel headers on the wire."""
import json
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

POLICY = next(row['headers'] for row in json.loads(Path('vercel.json').read_text())['headers'] if row['source'] == '/(.*)')

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        for header in POLICY:
            self.send_header(header['key'], header['value'])
        super().end_headers()

ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), Handler).serve_forever()
