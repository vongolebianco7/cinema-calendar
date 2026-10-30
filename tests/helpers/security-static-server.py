"""Local-only browser fixture serving the actual static Vercel headers on the wire."""
import json
import ssl
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

POLICY = next(row['headers'] for row in json.loads(Path('vercel.json').read_text())['headers'] if row['source'] == '/(.*)')

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        for header in POLICY:
            self.send_header(header['key'], header['value'])
        super().end_headers()

server = ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), Handler)
tls = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
tls.load_cert_chain(sys.argv[2], sys.argv[3])
server.socket = tls.wrap_socket(server.socket, server_side=True)
server.serve_forever()
