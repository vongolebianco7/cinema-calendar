from pathlib import Path
import re

html = Path('experience.html').read_text(encoding='utf-8')

# Dolby heading stays on one line on iPhone-sized screens and remains visually emphasized.
assert '<h3 class="audioTitleNowrap">Dolby Atmos / Dolby Cinema</h3>' in html
assert '.audioTitleNowrap{white-space:nowrap}' in html
assert '.atmosA .audioTitleNowrap{' in html
assert 'color:var(--violet)' in html
assert 'dolbyTitlePart' not in html
assert '<h3>Dolby Atmos</h3>' not in html
assert 'class="dolbyCinemaPill"' not in html

# Standard 5.1/7.1 heading also stays on one line instead of wrapping awkwardly.
assert '<h3 class="audioTitleNowrap standardAudioTitle">一般的な通常上映（5.1 / 7.1ch）</h3>' in html
assert '.standardAudioTitle{' in html

m = re.search(r'<article class="audioCard atmosA">(.*?)</article>', html, re.S)
assert m, 'Dolby Atmos / Dolby Cinema card not found'
card = m.group(1)
assert 'theaters.html?format=Dolby%20Atmos' in card
assert 'theaters.html?format=Dolby%20Cinema' in card
assert 'Dolby Atmos対応スクリーンを見る →' in card
assert 'Dolby Cinema対応スクリーンを見る →' in card
