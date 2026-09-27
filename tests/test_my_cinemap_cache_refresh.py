from pathlib import Path
import importlib.util

script_path = Path('scripts/bump_my_cinemap_cache.py')
if not script_path.exists():
    raise SystemExit('My Cinemap cache refresh script is missing')

spec = importlib.util.spec_from_file_location('bump_my_cinemap_cache', script_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

samples = {
    'my-cinemap.html': '<script src="js/my-cinemap-art.js?v=old"></script>',
    'js/my-cinemap-art.js': "loader.src='js/my-cinemap-art-direction.js?v=old';",
    'js/my-cinemap-art-direction.js': "renderer.src='js/my-cinemap-cinema-templates.js?v=old';",
}
expected = {
    'my-cinemap.html': 'js/my-cinemap-art.js?v=20260927-contrast-refresh-v14',
    'js/my-cinemap-art.js': 'js/my-cinemap-art-direction.js?v=20260927-contrast-refresh-v3',
    'js/my-cinemap-art-direction.js': 'js/my-cinemap-cinema-templates.js?v=20260927-contrast-refresh-v6',
}

for path, text in samples.items():
    updated = module.bump_text(path, text)
    if expected[path] not in updated:
        raise SystemExit(f'cache-bust replacement failed for {path}')

print('My Cinemap cache-bust refresh passed')
