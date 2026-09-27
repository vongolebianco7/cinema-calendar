from pathlib import Path
import re

path = Path('experience.html')
s = path.read_text(encoding='utf-8')

heading = '<h3><span class="dolbyTitlePart">Dolby Atmos /</span> <span class="dolbyTitlePart">Dolby Cinema</span></h3>'

# Normalize the Dolby heading to two intentional mobile-safe title parts.
s = re.sub(
    r'<h3>Dolby Atmos(?:\s*/\s*Dolby Cinema|\s*<small[^>]*>\s*Dolby Cinema\s*</small>)?</h3>',
    heading,
    s,
    count=1,
)
s = s.replace('<h3><span class="dolbyTitlePart">Dolby Atmos /</span> <span class="dolbyTitlePart">Dolby Cinema</span></h3><span class="dolbyCinemaPill">Dolby Cinema</span>', heading)
s = re.sub(r'<span[^>]*class="dolbyCinemaPill"[^>]*>\s*Dolby Cinema\s*</span>', '', s)

# On iPhone-sized screens, wrap only between the two semantic title parts.
css = '@media(max-width:600px){.atmosA .dolbyTitlePart{display:block;white-space:nowrap}}'
if css not in s:
    if '</style>' not in s:
        raise SystemExit('style end not found')
    s = s.replace('</style>', css + '\n</style>', 1)

# Keep both theater-directory actions visible inside the Atmos/Dolby Cinema card.
atmos_link = '<a class="screenLink" href="theaters.html?format=Dolby%20Atmos">Dolby Atmos対応スクリーンを見る →</a>'
cinema_link = '<a class="screenLink" href="theaters.html?format=Dolby%20Cinema">Dolby Cinema対応スクリーンを見る →</a>'
card_match = re.search(r'(<article class="audioCard atmosA">)(.*?)(</article>)', s, re.S)
if not card_match:
    raise SystemExit('Dolby Atmos / Dolby Cinema card not found')
card = card_match.group(2)
if atmos_link not in card:
    raise SystemExit('Dolby Atmos screen link not found in Dolby card')
if cinema_link not in card:
    card = card.replace(atmos_link, atmos_link + cinema_link, 1)
    s = s[:card_match.start(2)] + card + s[card_match.end(2):]

if '<span class="dolbyTitlePart">Dolby Atmos /</span>' not in s:
    raise SystemExit('Dolby Atmos title part was not produced')
if '<span class="dolbyTitlePart">Dolby Cinema</span>' not in s:
    raise SystemExit('Dolby Cinema title part was not produced')

path.write_text(s, encoding='utf-8')
