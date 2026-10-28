#!/usr/bin/env python3
"""Offline high-confidence credential-pattern scan. Never prints matching text.
Not a complete entropy/provider validation scanner; no network or secret use.
"""
import argparse
import re
import subprocess
from pathlib import Path

PATTERNS = {
    'github_token': re.compile(rb'\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{60,255})\b'),
    'aws_access_id': re.compile(rb'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    'private_key': re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'),
    'credential_url': re.compile(rb'(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?)://[^\s:/"\x27]+:([^\s@/"\x27]+)@([^\s/"\x27]+)'),
}

def findings(data):
    result = []
    for kind, pattern in PATTERNS.items():
        for match in pattern.finditer(data):
            if kind == 'credential_url':
                # Local test connections are intentionally non-secret fixtures.
                host = match.group(2).split(b':')[0].lower()
                if host in (b'localhost', b'127.0.0.1', b'example.invalid', b'example.test') or (host == b'host' and match.group(1) == b'PASSWORD'):
                    continue
            result.append(kind)
    return sorted(set(result))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--history', action='store_true')
    args = parser.parse_args()
    hits = []; count = 0
    if args.history:
        if subprocess.check_output(['git', 'rev-parse', '--is-shallow-repository']).strip() != b'false':
            raise SystemExit('Full history is required; shallow scan rejected')
        objects = subprocess.check_output(['git', 'rev-list', '--objects', '--all']).splitlines()
        ids = sorted({line.split(b' ', 1)[0] for line in objects})
        proc = subprocess.Popen(['git', 'cat-file', '--batch'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
        for oid in ids:
            proc.stdin.write(oid + b'\n'); proc.stdin.flush()
            header = proc.stdout.readline().split()
            if len(header) != 3: raise SystemExit('Incomplete git object scan')
            size = int(header[2]); data = proc.stdout.read(size); proc.stdout.read(1)
            if len(data) != size: raise SystemExit('Truncated git object scan')
            if header[1] not in (b'blob', b'commit', b'tag'): continue
            count += 1
            kinds = findings(data)
            if kinds: hits.append({'object': oid.decode(), 'patterns': kinds})
        proc.stdin.close()
        if proc.wait() != 0: raise SystemExit('Git object scan failed')
    else:
        for raw in subprocess.check_output(['git', 'ls-files', '-z']).split(b'\0'):
            if not raw: continue
            path = Path(raw.decode())
            if not path.is_file(): continue
            count += 1; kinds = findings(path.read_bytes())
            if kinds: hits.append({'file': str(path), 'patterns': kinds})
    import json
    print(json.dumps({'scope': 'reachable_history' if args.history else 'tracked_worktree', 'objects_scanned': count, 'findings': hits, 'limitation': 'Pattern scan only; no proof of absence for arbitrary API keys, deleted remote refs or unreachable objects.'}))
    return bool(hits)

if __name__ == '__main__': raise SystemExit(main())
