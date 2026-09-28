from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'preview/ocean/ocean-demo.html'


def test_ocean_demo_local_scripts_exist():
    html = PAGE.read_text(encoding='utf-8')
    scripts = re.findall(r'<script\s+src="([^"]+)"', html)
    assert scripts, 'Ocean demo must load its local scripts'
    missing = [src for src in scripts if not (PAGE.parent / src.split('?')[0]).is_file()]
    assert not missing, f'Ocean demo references missing scripts: {missing}'


def test_dashboard_bootstrap_is_not_renderer_dependent():
    source = (PAGE.parent / 'js/ocean-demo.js').read_text(encoding='utf-8')
    assert "$('dashboard').hidden = false" in source
    assert 'CinemapOceanImmersive?.mount' in source
    assert 'catch (error)' in source
