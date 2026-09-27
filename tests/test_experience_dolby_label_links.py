from pathlib import Path
import re

html = Path('experience.html').read_text(encoding='utf-8')

assert '<span class="dolbyTitlePart">Dolby Atmos /</span>' in html
assert '<span class="dolbyTitlePart">Dolby Cinema</span>' in html
assert '.dolbyTitlePart{display:block;white-space:nowrap}' in html
assert '<h3>Dolby Atmos</h3>' not in html
assert 'class="dolbyCinemaPill"' not in html

m = re.search(r'<article class="audioCard atmosA">(.*?)</article>', html, re.S)
assert m, 'Dolby Atmos / Dolby Cinema card not found'
card = m.group(1)
assert 'theaters.html?format=Dolby%20Atmos' in card
assert 'theaters.html?format=Dolby%20Cinema' in card
assert 'Dolby Atmos対応スクリーンを見る →' in card
assert 'Dolby Cinema対応スクリーンを見る →' in card
