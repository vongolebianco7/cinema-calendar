import subprocess
import sys
from pathlib import Path


def test_autonomous_loop_policy_guard_passes():
    root = Path(__file__).resolve().parents[1]
    result = subprocess.run(
        [sys.executable, str(root / "scripts" / "check_autonomous_loop_policy.py")],
        cwd=root,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert "Autonomous loop policy guard: PASS" in result.stdout
