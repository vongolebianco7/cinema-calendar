"""Crash-safe JSON snapshots for static datasets consumed by CINELVA."""
import json
import os
import tempfile
from pathlib import Path


def write_json_atomic(path, value, *, ensure_ascii=False, indent=2):
    """Write JSON beside its destination, then atomically replace the snapshot."""
    target = Path(path)
    staged = None
    try:
        with tempfile.NamedTemporaryFile(
            "w", encoding="utf-8", dir=target.parent,
            prefix=f".{target.name}-", suffix=".tmp", delete=False
        ) as handle:
            staged = Path(handle.name)
            json.dump(value, handle, ensure_ascii=ensure_ascii, indent=indent)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(staged, target)
    finally:
        if staged is not None:
            staged.unlink(missing_ok=True)
