from pathlib import Path

art = Path('js/my-cinemap-art.js').read_text(encoding='utf-8')

expected = "my-cinemap-art-direction.js?v=20260927-mobile-two-column-v3"
legacy = "my-cinemap-art-direction.js?v=20260927-cinema-backgrounds-v2"

assert expected in art, 'My Cinemap must load the latest two-column/contrast module on iPhone'
assert legacy not in art, 'Stale art-direction cache key would keep the broken mobile layout in Safari'
