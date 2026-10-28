"""Offline signature checks. Output locations only, never matched credentials.

This is deliberately not a claim that entropy-based or provider-side detection
has run. No network validation, telemetry, or secret rotation is performed.
"""
import argparse
import json
import re
import subprocess

RULES = {
    "github-token": re.compile(r"gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}"),
    "aws-access-key": re.compile(r"AKIA[0-9A-Z]{16}"),
    "private-key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "tmdb-literal": re.compile(r"(?:TMDB_API_KEY|api_key)[\s\"':=]{1,12}[0-9a-f]{32}", re.I),
}


def findings(text):
    return [name for name, pattern in RULES.items() if pattern.search(text)]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--history", action="store_true")
    args = parser.parse_args()
    hits = []
    if args.history:
        process = subprocess.Popen(["git", "log", "--all", "-p", "--no-ext-diff", "--format=COMMIT:%H"], stdout=subprocess.PIPE, text=True, errors="replace")
        commit = path = ""
        for line in process.stdout:
            if line.startswith("COMMIT:"):
                commit = line.strip()[7:]
            elif line.startswith("+++ b/"):
                path = line.strip()[6:]
            elif line.startswith("+") and not line.startswith("+++"):
                hits.extend({"commit": commit, "path": path, "rule": name} for name in findings(line))
        if process.wait():
            raise SystemExit("History scan failed; no clean result")
    else:
        from pathlib import Path
        paths = subprocess.check_output(["git", "ls-files", "-z"]).decode().split("\0")
        for path in filter(None, paths):
            data = Path(path).read_bytes()
            if b"\0" in data:
                continue
            hits.extend({"path": path, "rule": name} for name in findings(data.decode("utf-8", errors="replace")))
    unique = list({json.dumps(hit, sort_keys=True): hit for hit in hits}.values())
    print(json.dumps({"scope": "history" if args.history else "tracked files", "signature_findings": unique}))
    raise SystemExit(1 if hits else 0)


if __name__ == "__main__":
    main()
