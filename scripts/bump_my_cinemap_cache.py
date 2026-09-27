from pathlib import Path
import re
import sys

VERSIONS = {
    'my-cinemap.html': (
        r'js/my-cinemap-art\.js\?v=[^"\'<>]+',
        'js/my-cinemap-art.js?v=20260927-contrast-refresh-v14',
    ),
    'js/my-cinemap-art.js': (
        r'js/my-cinemap-art-direction\.js\?v=[^"\'`<>]+',
        'js/my-cinemap-art-direction.js?v=20260927-contrast-refresh-v3',
    ),
    'js/my-cinemap-art-direction.js': (
        r'js/my-cinemap-cinema-templates\.js\?v=[^"\'`<>]+',
        'js/my-cinemap-cinema-templates.js?v=20260927-contrast-refresh-v6',
    ),
}


def bump_text(path: str, text: str) -> str:
    pattern, replacement = VERSIONS[path]
    updated, count = re.subn(pattern, replacement, text, count=1)
    if count != 1:
        raise ValueError(f'expected one cache-bust reference in {path}, found {count}')
    return updated


def main() -> int:
    changed = []
    for name in VERSIONS:
        path = Path(name)
        original = path.read_text(encoding='utf-8')
        updated = bump_text(name, original)
        if updated != original:
            path.write_text(updated, encoding='utf-8')
            changed.append(name)
    print('Updated My Cinemap cache-bust chain:', ', '.join(changed) if changed else 'already current')
    return 0


if __name__ == '__main__':
    sys.exit(main())
