from pathlib import Path
import re


def main() -> None:
    text = Path("critic.html").read_text(encoding="utf-8")
    match = re.search(r"function render\(m\)\{(?P<body>.*?)\n\}\nasync function fetchCriticMovie", text, re.S)
    if not match:
        raise SystemExit("render(m) function not found")

    body = match.group("body")
    declaration = body.find('creatorName=compareParams.get("creator")')
    if declaration < 0:
        raise SystemExit("creator query-param declaration not found")

    first_use = min(
        pos
        for name in ("creatorName", "creatorRole", "creatorPerson")
        if (pos := body.find(name)) >= 0
    )

    if first_use < declaration:
        raise SystemExit(
            "Critic Map render reads creatorName/creatorRole/creatorPerson before their const declaration; "
            "this triggers a temporal-dead-zone ReferenceError and leaves the loading UI stuck."
        )

    print("critic render TDZ regression check passed")


if __name__ == "__main__":
    main()
