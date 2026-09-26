from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "my-cinemap.html"
text = path.read_text(encoding="utf-8")

old_layout = '<label>レイアウト<select id="layout"><option value="editorial">エディトリアル</option><option value="ranking">ランキング</option><option value="minimal">ミニマル</option></select></label>'
new_layout = '<label>レイアウト<select id="layout"><option value="single" selected>縦1列</option><option value="double">左右2列</option></select></label>'
if old_layout not in text and new_layout not in text:
    raise SystemExit("Could not find My Cinemap layout selector")
text = text.replace(old_layout, new_layout)

text = text.replace(
    '<section class="hero"><h1>My Cinemap</h1><p>映画を選び、並べて、ランキング画像に。</p></section>',
    '<section class="hero"><h1>My Cinemap</h1><p>好きな映画を、美しく残す。あなただけのランキングを一枚に。</p></section>'
)

text = text.replace(
    '<div class="designPicker"><div class="label">デザインテンプレート</div>',
    '<div class="designPicker"><div class="label">デザインテンプレート</div><p class="templateHint">好きなスタイルで、保存したくなる一枚に。</p>'
)

text = text.replace(
    'js/my-cinemap-art.js?v=20260927-my-cinemap-final-v8',
    'js/my-cinemap-art.js?v=20260927-my-cinemap-editorial-v9'
)

# Keep saved legacy layouts usable by mapping them to the new default.
needle = 'if(s.theme!=null)document.getElementById("theme").value=s.theme;["format","layout"].forEach(id=>{if(s[id])document.getElementById(id).value=s[id]});syncThemeChoices();persist();'
replacement = 'if(s.theme!=null)document.getElementById("theme").value=s.theme;if(s.format)document.getElementById("format").value=s.format;if(s.layout){document.getElementById("layout").value=["single","double"].includes(s.layout)?s.layout:"single"}syncThemeChoices();persist();'
if needle in text:
    text = text.replace(needle, replacement)

if 'illustrationMode' in text:
    raise SystemExit('illustrationMode must remain removed')
if '<option value="single" selected>縦1列</option>' not in text or '<option value="double">左右2列</option>' not in text:
    raise SystemExit('new layout options missing after patch')
if 'my-cinemap-editorial-v9' not in text:
    raise SystemExit('cache bust marker missing after patch')

path.write_text(text, encoding="utf-8")
print("Applied My Cinemap editorial v9 UI")
