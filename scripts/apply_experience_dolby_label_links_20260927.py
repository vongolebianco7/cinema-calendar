from pathlib import Path
import re

path = Path('experience.html')
s = path.read_text(encoding='utf-8')

# Simplify the Atmos/Dolby Cinema heading: remove the separate pill/badge and use one heading.
s = re.sub(
    r'<div class="audioTop"><h3>Dolby Atmos</h3>\s*(?:<span[^>]*class="dolbyCinemaPill"[^>]*>Dolby Cinema</span>|<span[^>]*>Dolby Cinema</span>)?\s*<span>3Dオブジェクト</span></div>',
    '<div class="audioTop"><h3>Dolby Atmos / Dolby Cinema</h3><span>3Dオブジェクト</span></div>',
    s,
)

# Fallback for the current markup if the badge sits inside the h3 or adjacent with slightly different classes.
s = s.replace('<h3>Dolby Atmos</h3><span class="dolbyCinemaPill">Dolby Cinema</span>', '<h3>Dolby Atmos / Dolby Cinema</h3>')
s = s.replace('<h3>Dolby Atmos</h3>', '<h3>Dolby Atmos / Dolby Cinema</h3>')
s = re.sub(r'<span[^>]*class="dolbyCinemaPill"[^>]*>\s*Dolby Cinema\s*</span>', '', s)

# Add a dedicated Dolby Cinema theater link next to/below the Atmos link if missing.
needle = '<a class="screenLink" href="theaters.html?format=Dolby%20Atmos">Dolby Atmos対応スクリーンを見る →</a>'
addition = needle + '<a class="screenLink" href="theaters.html?format=Dolby%20Cinema">Dolby Cinema対応スクリーンを見る →</a>'
if 'theaters.html?format=Dolby%20Cinema' not in s:
    if needle not in s:
        raise SystemExit('Dolby Atmos screen link not found')
    s = s.replace(needle, addition, 1)

path.write_text(s, encoding='utf-8')
