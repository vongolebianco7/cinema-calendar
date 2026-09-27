from pathlib import Path
import re

path = Path('experience.html')
s = path.read_text(encoding='utf-8')

# Simplify the Atmos/Dolby Cinema heading: remove the separate pill/badge/small label and use one heading.
s = re.sub(
    r'<div class="audioTop"><h3>Dolby Atmos(?:\s*<small[^>]*>\s*Dolby Cinema\s*</small>)?</h3>\s*(?:<span[^>]*class="dolbyCinemaPill"[^>]*>Dolby Cinema</span>|<span[^>]*>Dolby Cinema</span>)?\s*<span>3Dオブジェクト</span></div>',
    '<div class="audioTop"><h3>Dolby Atmos / Dolby Cinema</h3><span>3Dオブジェクト</span></div>',
    s,
)
s = s.replace('<h3>Dolby Atmos <small>Dolby Cinema</small></h3>', '<h3>Dolby Atmos / Dolby Cinema</h3>')
s = s.replace('<h3>Dolby Atmos</h3><span class="dolbyCinemaPill">Dolby Cinema</span>', '<h3>Dolby Atmos / Dolby Cinema</h3>')
s = re.sub(r'<span[^>]*class="dolbyCinemaPill"[^>]*>\s*Dolby Cinema\s*</span>', '', s)

# Add a dedicated Dolby Cinema theater link after the Atmos link if missing.
needle = '<a class="screenLink" href="theaters.html?format=Dolby%20Atmos">Dolby Atmos対応スクリーンを見る →</a>'
cinema_link = '<a class="screenLink" href="theaters.html?format=Dolby%20Cinema">Dolby Cinema対応スクリーンを見る →</a>'
if 'theaters.html?format=Dolby%20Cinema' not in s:
    if needle not in s:
        raise SystemExit('Dolby Atmos screen link not found')
    s = s.replace(needle, needle + cinema_link, 1)

if '<h3>Dolby Atmos / Dolby Cinema</h3>' not in s:
    raise SystemExit('Dolby combined heading was not produced')

path.write_text(s, encoding='utf-8')
