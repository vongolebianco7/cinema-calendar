from pathlib import Path

html = Path('experience.html').read_text(encoding='utf-8')

assert '<h3>Dolby Atmos / Dolby Cinema</h3>' in html
assert '<h3>Dolby Atmos</h3>' not in html
assert 'class="dolbyCinemaPill"' not in html
assert 'theaters.html?format=Dolby%20Atmos' in html
assert 'theaters.html?format=Dolby%20Cinema' in html
assert 'Dolby Atmos対応スクリーンを見る →' in html
assert 'Dolby Cinema対応スクリーンを見る →' in html
