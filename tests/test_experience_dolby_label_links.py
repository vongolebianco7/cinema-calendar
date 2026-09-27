from pathlib import Path

html = Path('experience.html').read_text(encoding='utf-8')

assert '<span class="dolbyTitlePart">Dolby Atmos /</span>' in html
assert '<span class="dolbyTitlePart">Dolby Cinema</span>' in html
assert '.dolbyTitlePart{display:block;white-space:nowrap}' in html
assert '<h3>Dolby Atmos</h3>' not in html
assert 'class="dolbyCinemaPill"' not in html
assert 'theaters.html?format=Dolby%20Atmos' in html
assert 'theaters.html?format=Dolby%20Cinema' in html
assert 'Dolby Atmos対応スクリーンを見る →' in html
assert 'Dolby Cinema対応スクリーンを見る →' in html
