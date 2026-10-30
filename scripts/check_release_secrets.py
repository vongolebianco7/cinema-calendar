#!/usr/bin/env python3
"""High-confidence credential patterns; prints object IDs only, never values.
Not a replacement for provider-side secret scanning or credential rotation.
"""
import argparse, re, subprocess, sys
PATTERNS = [
    re.compile(rb'gh[pousr]_[A-Za-z0-9]{36,}'),
    re.compile(rb'github_pat_[A-Za-z0-9_]{60,}'),
    re.compile(rb'AKIA[0-9A-Z]{16}'),
    re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    re.compile(rb'(?:api_key|TMDB_API_KEY)[\s\x22\x27:=]+[0-9a-f]{32}(?![0-9a-f])', re.I),
]
def scan(history=False):
    if history:
        lines = subprocess.check_output(['git','rev-list','--objects','--all']).splitlines()
        ids = sorted({line.split(b' ',1)[0] for line in lines})
    else:
        lines = subprocess.check_output(['git','ls-files','-s']).splitlines()
        ids = sorted({line.split()[1] for line in lines})
    process = subprocess.Popen(['git','cat-file','--batch'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    checked = 0; findings = []
    try:
        for oid in ids:
            process.stdin.write(oid+b'\n');process.stdin.flush()
            header=process.stdout.readline().split()
            if len(header)!=3: raise RuntimeError('Cannot inspect git object')
            size=int(header[2]);data=process.stdout.read(size);process.stdout.read(1)
            if header[1]!=b'blob': continue
            checked+=1
            if any(p.search(data) for p in PATTERNS): findings.append(oid.decode())
    finally:
        process.stdin.close();process.stdout.close();process.wait()
    print(f'Credential pattern scan: {checked} blobs; {len(findings)} findings; history={history}')
    for oid in findings: print('REVIEW credential pattern in git blob '+oid)
    return bool(findings)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--history',action='store_true')
    sys.exit(scan(parser.parse_args().history))
