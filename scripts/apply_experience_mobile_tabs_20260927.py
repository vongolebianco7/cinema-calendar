from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "experience.html"
text = PATH.read_text(encoding="utf-8")

# Remove the wide comparison table; the detailed panels below already contain the useful information.
text, n = re.subn(
    r'\n?<section class="section" id="experienceCompare">.*?</section>\n?',
    '\n',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit("experience comparison table section not found")

# Replace the old anchor-jump navigation. Tabs belong after the movie recommendation finder.
text, n = re.subn(
    r'\n?<nav class="expQuickNav".*?</nav>\n?',
    '\n',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit("old experience quick nav not found")

tabs = '''\n<nav class="expTabs" aria-label="上映方式の比較カテゴリ">
 <button type="button" class="expTab active" data-exp-tab="recommend" aria-selected="true">おすすめ</button>
 <button type="button" class="expTab" data-exp-tab="aspect" aria-selected="false">画角</button>
 <button type="button" class="expTab" data-exp-tab="visual" aria-selected="false">映像</button>
 <button type="button" class="expTab" data-exp-tab="audio" aria-selected="false">音響</button>
 <button type="button" class="expTab" data-exp-tab="special" aria-selected="false">体感</button>
</nav>\n'''

finder = re.search(r'(<section class="decisionBox" id="formatFinder">.*?</section>)', text, flags=re.S)
if not finder:
    raise SystemExit("format finder section not found")
text = text[:finder.end()] + tabs + text[finder.end():]

replacements = {
    '<section class="section expSection" id="aspect">': '<section class="section expSection expTabPanel" id="aspect" data-exp-panel="aspect" hidden>',
    '<section class="section expSection" id="visual">': '<section class="section expSection expTabPanel" id="visual" data-exp-panel="visual" hidden>',
    '<section class="section expSection" id="audio">': '<section class="section expSection expTabPanel" id="audio" data-exp-panel="audio" hidden>',
    '<section class="section expSection" id="special">': '<section class="section expSection expTabPanel" id="special" data-exp-panel="special" hidden>',
    '<section class="section expSection" id="guide">': '<section class="section expSection expTabPanel" id="guide" data-exp-panel="recommend">',
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f"panel marker not found: {old}")
    text = text.replace(old, new, 1)

styles = '''
<style id="experience-tabs-v1">
.expTabs{position:sticky;top:56px;z-index:80;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;margin:10px 0 22px;padding:6px;background:rgba(9,9,9,.96);backdrop-filter:blur(14px);border:1px solid #282828;border-radius:14px}
.expTab{appearance:none;border:0;background:transparent;color:#8f969e;font:inherit;font-size:12px;font-weight:750;padding:10px 4px;border-radius:9px;white-space:nowrap}
.expTab.active{background:#f2eee6;color:#111}
.expTabPanel[hidden]{display:none!important}
.expTabPanel{animation:expPanelIn .16s ease-out}
@keyframes expPanelIn{from{opacity:.45;transform:translateY(3px)}to{opacity:1;transform:none}}
@media(min-width:601px){.expTabs{top:58px;max-width:620px}}
@media(max-width:430px){.expTabs{margin-left:-4px;margin-right:-4px;padding:5px}.expTab{font-size:11px;padding:10px 2px}.expSection{margin-top:20px}}
</style>
'''
if 'id="experience-tabs-v1"' not in text:
    text = text.replace('</head>', styles + '</head>', 1)

script = '''
<script id="experience-tabs-js">
(()=>{
 const tabs=[...document.querySelectorAll('[data-exp-tab]')];
 const panels=[...document.querySelectorAll('[data-exp-panel]')];
 if(!tabs.length||!panels.length)return;
 function show(key){
  tabs.forEach(tab=>{const on=tab.dataset.expTab===key;tab.classList.toggle('active',on);tab.setAttribute('aria-selected',on?'true':'false')});
  panels.forEach(panel=>{const on=panel.dataset.expPanel===key;panel.hidden=true;if(on)panel.hidden=false});
 }
 tabs.forEach(tab=>tab.addEventListener('click',()=>show(tab.dataset.expTab)));
 show('recommend');
})();
</script>
'''
if 'id="experience-tabs-js"' not in text:
    text = text.replace('</body>', script + '</body>', 1)

PATH.write_text(text, encoding="utf-8")
