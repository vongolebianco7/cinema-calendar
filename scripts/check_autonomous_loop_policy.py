from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def require(text: str, token: str, source: str) -> None:
    if token not in text:
        raise SystemExit(f"{source}: missing required autonomous-loop contract: {token}")


def main() -> None:
    agents = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
    ocean = (ROOT / "docs" / "ocean-acceptance.md").read_text(encoding="utf-8")

    for state in ("COMPLETE", "HUMAN_REQUIRED", "BLOCKED", "EXECUTION_LIMIT"):
        require(agents, state, "AGENTS.md")

    require(agents, "Immediately fetch/re-evaluate latest `main` after merge", "AGENTS.md")
    require(agents, "Do not invent percentage-complete estimates", "AGENTS.md")
    require(ocean, "UNKNOWN`, `PASS`, `FAIL`, or `BLOCKED", "docs/ocean-acceptance.md")
    require(ocean, "Do not report percentage completion", "docs/ocean-acceptance.md")
    require(ocean, "not a one-to-one genre-to-fish visualization", "docs/ocean-acceptance.md")

    print("Autonomous loop policy guard: PASS")


if __name__ == "__main__":
    main()
