#!/usr/bin/env python3
"""Classify changed paths so CI/deploy systems can avoid unnecessary deploys."""
import subprocess, sys
base=sys.argv[1] if len(sys.argv)>1 else "HEAD^"
out=subprocess.check_output(["git","diff","--name-only",base,"HEAD"], text=True)
paths=[p for p in out.splitlines() if p]
backend=any(p.startswith("backend/") for p in paths)
non_app_prefixes=(".github/","docs/","tests/","scripts/")
non_app_names={"AGENTS.md","COMPLIANCE.md","README.md"}
frontend=any(not p.startswith("backend/") and not p.startswith(non_app_prefixes) and p not in non_app_names for p in paths)
print(f"frontend={'true' if frontend else 'false'}")
print(f"backend={'true' if backend else 'false'}")
print("changed=" + ",".join(paths))
