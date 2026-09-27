from pathlib import Path
import re

path = Path('experience.html')
s = path.read_text(encoding='utf-8')

# Keep the Dolby title on one line. Remove the earlier split-span implementation.
dolby_heading = '<h3 class="audioTitleNowrap">Dolby Atmos / Dolby Cinema</h3>'
s = s.replace(
    '<h3><span class="dolbyTitlePart">Dolby Atmos /</span> <span class="dolbyTitlePart">Dolby Cinema</span></h3>',
    dolby_heading,
)
s = re.sub(
    r'<h3>Dolby Atmos(?:\s*/\s*Dolby Cinema|\s*<small[^>]*>\s*Dolby Cinema\s*</small>)?</h3>',
    dolby_heading,
    s,
    count=1,
)
s = re.sub(r'<span[^>]*class="dolbyCinemaPill"[^>]*>\s*Dolby Cinema\s*</span>', '', s)

# Keep the standard 5.1 / 7.1 heading on one line too.
s = s.replace(
    '<h3>一般的な通常上映（5.1 / 7.1ch）</h3>',
    '<h3 class="audioTitleNowrap standardAudioTitle">一般的な通常上映（5.1 / 7.1ch）</h3>',
    1,
)

# Remove the old forced two-line mobile rule if it exists.
s = s.replace('@media(max-width:600px){.atmosA .dolbyTitlePart{display:block;white-space:nowrap}}\n', '')
s = s.replace('@media(max-width:600px){.atmosA .dolbyTitlePart{display:block;white-space:nowrap}}', '')

# Make both long audio headings fit on a single iPhone line without making them visually weak.
css = '''
.audioTitleNowrap{white-space:nowrap}
.atmosA .audioTitleNowrap{color:var(--violet)}
@media(max-width:600px){
 .audioTop{gap:8px;align-items:center}
 .audioTop .audioTitleNowrap{flex:1;min-width:0;font-size:14px;line-height:1.15;letter-spacing:-.025em;font-weight:800}
 .audioTop .standardAudioTitle{font-size:13px;letter-spacing:-.04em}
 .audioTop>span{flex:0 0 auto;font-size:11px}
}
'''.strip()
if '.audioTitleNowrap{white-space:nowrap}' not in s:
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

if dolby_heading not in s:
    raise SystemExit('single-line Dolby heading was not produced')
if '<h3 class="audioTitleNowrap standardAudioTitle">一般的な通常上映（5.1 / 7.1ch）</h3>' not in s:
    raise SystemExit('single-line standard audio heading was not produced')

path.write_text(s, encoding='utf-8')
