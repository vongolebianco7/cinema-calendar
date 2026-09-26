from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ["index.html", "discover.html", "experience.html", "my-cinemap.html", "search.html", "rankings.html", "critic.html", "revivals.html", "theaters.html"]

LEGACY_LOGO = '<img class="gLogo" src="assets/cinemap-logo.png?v=2" alt="Cinemap">'
NEW_LOGO = '<img class="gLogo gLogoMark" src="favicon.svg" alt="" aria-hidden="true"><span class="gBrandWords"><span class="gBrandName">Cinemap</span><span class="gBrandTagline">EXPLORE CINEMA</span></span>'

HEADER_CSS = r'''
<style id="cinemap-live-header-brand-v1">
.gBrand{
  display:inline-flex!important;
  align-items:center!important;
  gap:9px!important;
  flex:0 0 auto;
  min-width:0;
  color:#f4efe5!important;
  text-decoration:none!important;
}
.gBrand .gLogoMark{
  display:block;
  width:30px!important;
  height:30px!important;
  max-width:30px!important;
  flex:0 0 30px;
  object-fit:contain;
  border-radius:8px;
}
.gBrandWords{display:flex;flex-direction:column;align-items:flex-start;min-width:0;line-height:1}
.gBrandName{
  color:#f4efe5;
  font-family:Georgia,"Times New Roman","Yu Mincho","Hiragino Mincho ProN",serif;
  font-size:22px;
  font-weight:500;
  line-height:.92;
  letter-spacing:-.035em;
  white-space:nowrap;
}
.gBrandTagline{
  margin-top:5px;
  padding-left:1px;
  color:#cdbfa9;
  font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","Hiragino Sans","Yu Gothic",Meiryo,sans-serif;
  font-size:5.8px;
  font-weight:650;
  line-height:1;
  letter-spacing:.25em;
  white-space:nowrap;
}
@media(max-width:430px){
  .gBrand{gap:7px!important}
  .gBrand .gLogoMark{width:28px!important;height:28px!important;max-width:28px!important;flex-basis:28px}
  .gBrandName{font-size:20px}
  .gBrandTagline{font-size:5px;letter-spacing:.19em;margin-top:4px}
}
</style>
'''

for name in PAGES:
    path = ROOT / name
    text = path.read_text(encoding="utf-8")
    if LEGACY_LOGO not in text:
        raise SystemExit(f"Expected legacy header logo not found in {name}")
    text = text.replace(LEGACY_LOGO, NEW_LOGO)
    if 'id="cinemap-live-header-brand-v1"' not in text:
        text = text.replace('</head>', HEADER_CSS + '</head>', 1)
    path.write_text(text, encoding="utf-8")

print("Replaced the live shared header brand on", len(PAGES), "pages")
