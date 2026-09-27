from pathlib import Path
import re

p = Path('experience.html')
text = p.read_text(encoding='utf-8')

# Move the recommendation tool under the tab bar so every tab owns its content.
decision_re = re.compile(r'<section class="decisionBox" id="formatFinder">.*?</section>\n', re.S)
m = decision_re.search(text)
if not m:
    raise SystemExit('decisionBox not found')
decision = m.group(0).replace(
    '<section class="decisionBox" id="formatFinder">',
    '<section class="decisionBox expTabPanel" id="formatFinder" data-exp-panel="recommend">'
)
text = text[:m.start()] + text[m.end():]
nav_end = text.find('</nav>', text.find('<nav class="expTabs"'))
if nav_end < 0:
    raise SystemExit('expTabs nav not found')
nav_end += len('</nav>')
text = text[:nav_end] + '\n' + decision.rstrip() + text[nav_end:]

# Remove the old static "どれを選ぶ？" recommendation cards; the search-based recommendation is the tab content now.
text, n = re.subn(
    r'\n<section class="section expSection expTabPanel" id="guide" data-exp-panel="recommend">.*?</section>',
    '',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('guide section not found')

# Remove the duplicate inline IMAX GT venue list from the aspect section.
text, n = re.subn(
    r'\n <div class="formula"><b>IMAX GTを観られる確認済みスクリーン</b>.*?</div>\n</section>',
    '\n</section>',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('duplicate IMAX GT inline list not found')

# Keep the dedicated verified IMAX GT section, but make it part of the 画角 tab.
old = '<section class="section" id="imax-gt-theaters">'
new = '<section class="section expTabPanel" id="imax-gt-theaters" data-exp-panel="aspect" hidden>'
if old not in text:
    raise SystemExit('dedicated IMAX GT section not found')
text = text.replace(old, new, 1)

p.write_text(text, encoding='utf-8')
