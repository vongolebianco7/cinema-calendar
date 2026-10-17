#!/usr/bin/env python3
"""Audit all Python unittest files without claiming obsolete tests passed."""
import argparse
import datetime as dt
import json
from pathlib import Path
import re
import subprocess
import sys

CASE_RE = re.compile(r'^(FAIL|ERROR): (.+)$', re.MULTILINE)
COUNT_RE = re.compile(r'^Ran (\d+) tests? in ', re.MULTILINE)
SUMMARY_RE = re.compile(r'^FAILED \(([^\n]+)\)$', re.MULTILINE)

def parse_output(output, returncode):
    cases = [{'type': kind.lower(), 'test': name.strip()} for kind, name in CASE_RE.findall(output)]
    counts = COUNT_RE.findall(output)
    summaries = SUMMARY_RE.findall(output)
    return {'status': 'passed' if returncode == 0 else 'failed',
            'exit_code': returncode,
            'tests_run': int(counts[-1]) if counts else None,
            'failures': sum(c['type'] == 'fail' for c in cases),
            'errors': sum(c['type'] == 'error' for c in cases),
            'cases': cases,
            'unittest_summary': summaries[-1] if summaries else None}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-dir', default='artifacts/python-suite')
    parser.add_argument('--strict', action='store_true')
    args = parser.parse_args()
    directory = Path(args.output_dir)
    directory.mkdir(parents=True, exist_ok=True)
    command = [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test*.py', '-v']
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            text=True, errors='replace')
    (directory / 'full-suite.log').write_text(result.stdout, encoding='utf-8')
    report = parse_output(result.stdout, result.returncode)
    report.update(schema_version=1, generated_at=dt.datetime.now(dt.timezone.utc).isoformat(),
                  command=' '.join(command))
    (directory / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"Full Python suite: {report['status']}; {report['tests_run']} tests, {report['failures']} failures, {report['errors']} errors")
    for item in report['cases']:
        print(f"  {item['type']}: {item['test']}")
    print(f"Evidence: {directory}/report.json and full-suite.log")
    return result.returncode if args.strict else 0

if __name__ == '__main__':
    raise SystemExit(main())
