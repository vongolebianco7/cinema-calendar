#!/usr/bin/env python3
"""Build an immutable, read-only manifest of existing data snapshots.

Does not modify, publish or sync any dataset. This is a staging primitive,
not a cross-system atomic commit or a production release approval.
"""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path


def manifest_for(paths, root, source_sha, observed_at):
    if not source_sha or len(source_sha) != 40 or any(c not in "0123456789abcdef" for c in source_sha.lower()):
        raise ValueError("source_sha must be a full 40-character git SHA")
    entries = []
    root = root.resolve()
    for path in sorted(paths, key=lambda p: str(p)):
        resolved = (path if path.is_absolute() else root / path).resolve()
        if not resolved.is_relative_to(root) or not resolved.is_file():
            raise ValueError("snapshot missing or outside repository: " + str(path))
        raw = resolved.read_bytes()
        json.loads(raw)
        entries.append({"path": resolved.relative_to(root).as_posix(),
                        "sha256": hashlib.sha256(raw).hexdigest(),
                        "bytes": len(raw)})
    if not entries or len({e["path"] for e in entries}) != len(entries):
        raise ValueError("at least one unique snapshot is required")
    digest = hashlib.sha256(json.dumps(entries, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    return {"schema_version": 1, "source_commit_sha": source_sha.lower(),
            "dataset_version": digest, "observed_at": observed_at,
            "status": "candidate", "snapshots": entries,
            "note": "Candidate only; no CI receipt, publication or DB parity proof."}



def verify_manifest(manifest, root):
    """Rehash files before downstream use; reject modified or missing candidates."""
    if not isinstance(manifest, dict) or manifest.get("status") != "candidate":
        raise ValueError("only candidate manifests can be verified")
    source_sha = manifest.get("source_commit_sha")
    if not isinstance(source_sha, str) or len(source_sha) != 40 or any(
        c not in "0123456789abcdef" for c in source_sha.lower()
    ):
        raise ValueError("invalid pinned source SHA")
    snapshots = manifest.get("snapshots")
    if not isinstance(snapshots, list) or not snapshots:
        raise ValueError("manifest snapshots must be nonempty")
    root = root.resolve()
    paths = []
    for entry in snapshots:
        if not isinstance(entry, dict) or not isinstance(entry.get("path"), str):
            raise ValueError("invalid snapshot entry")
        paths.append(Path(entry["path"]))
    actual = manifest_for(paths, root, source_sha, manifest.get("observed_at"))
    if actual["snapshots"] != snapshots or actual["dataset_version"] != manifest.get("dataset_version"):
        raise ValueError("candidate checksum or dataset version mismatch")
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--source-sha", required=True)
    parser.add_argument("--output", type=Path, default=Path("artifacts/data-release-candidate.json"))
    parser.add_argument("snapshots", nargs="+", type=Path)
    args = parser.parse_args()
    report = manifest_for(args.snapshots, args.root, args.source_sha,
                          dt.datetime.now(dt.timezone.utc).isoformat())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Candidate dataset version:", report["dataset_version"])


if __name__ == "__main__":
    main()
