from pathlib import Path
import math
import re
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    "index.html", "discover.html", "experience.html", "my-cinemap.html",
    "search.html", "rankings.html", "critic.html", "revivals.html", "theaters.html",
]

OLD_MARK = '<img class="gLogo gLogoMark" src="favicon.svg" alt="" aria-hidden="true">'
NEW_MARK = '<span class="gBrandTile" aria-hidden="true"><span class="gBrandGlyph">C</span><span class="gBrandBeam"></span></span>'

OUTLINE_CSS = r'''<style id="cinemap-outline-brand-v2">
/* Approved B: compact, quiet, editorial. No decorative app-badge effects. */
.gBrand{
  display:inline-flex!important;
  flex-direction:row!important;
  flex-wrap:nowrap!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:7px!important;
  flex:0 0 auto;
  min-width:max-content;
  color:#f6eee2!important;
  text-decoration:none!important;
  white-space:nowrap!important;
}
.gBrandTile{
  position:relative;
  display:block;
  width:32px;
  height:32px;
  flex:0 0 32px;
  border:.5px solid rgba(240,224,199,.86);
  border-radius:7px;
  background:transparent;
  overflow:hidden;
  box-shadow:none;
}
.gBrandGlyph{
  position:absolute;
  left:5px;
  top:-1px;
  z-index:2;
  color:#fbf3e7;
  font-family:"Bodoni 72",Didot,"Iowan Old Style",Baskerville,"Times New Roman",serif;
  font-size:24px;
  font-weight:400;
  line-height:32px;
  letter-spacing:-.055em;
}
.gBrandBeam{
  position:absolute;
  z-index:1;
  left:13px;
  top:6px;
  width:20px;
  height:19px;
  background:linear-gradient(90deg,rgba(255,239,205,.90) 0%,rgba(243,214,166,.56) 38%,rgba(225,190,135,.18) 72%,rgba(212,172,113,0) 100%);
  clip-path:polygon(0 40%,100% 10%,100% 90%,0 60%);
  filter:none;
  opacity:.96;
}
.gBrandWords{
  display:flex!important;
  flex-direction:column!important;
  align-items:flex-start!important;
  justify-content:center!important;
  min-width:0;
  line-height:1;
  white-space:nowrap;
  transform:translateY(-.25px);
}
.gBrandName{
  color:#f8efe2;
  font-family:"Bodoni 72",Didot,"Iowan Old Style",Baskerville,"Times New Roman",serif;
  font-size:24px;
  font-weight:400;
  line-height:.90;
  letter-spacing:-.018em;
  white-space:nowrap;
  text-rendering:optimizeLegibility;
  -webkit-font-smoothing:antialiased;
  font-feature-settings:"kern" 1,"liga" 1;
}
.gBrandTagline{
  margin-top:4px;
  padding-left:1px;
  color:#cdbfa9;
  font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","Hiragino Sans","Yu Gothic",Meiryo,sans-serif;
  font-size:4.7px;
  font-weight:600;
  line-height:1;
  letter-spacing:.25em;
  white-space:nowrap;
}
.gNav{height:58px!important;gap:8px!important}
@media(max-width:430px){
  .gNav{height:56px!important;gap:8px!important}
  .gBrand{flex-direction:row!important;flex-wrap:nowrap!important;gap:7px!important;min-width:max-content}
  .gBrandTile{width:30px;height:30px;flex:0 0 30px;border-radius:7px}
  .gBrandGlyph{left:5px;top:-1px;font-size:23px;line-height:30px;font-weight:400}
  .gBrandBeam{left:12px;top:6px;width:19px;height:18px;opacity:.96}
  .gBrandWords{flex-direction:column!important;white-space:nowrap!important;transform:translateY(-.25px)}
  .gBrandName{font-size:22px;line-height:.90;letter-spacing:-.018em}
  .gBrandTagline{font-size:4.5px;letter-spacing:.23em;margin-top:4px;padding-left:1px}
  .gSearchForm{height:33px!important}
}
@media(max-width:370px){
  .gBrand{gap:6px!important}
  .gBrandTile{width:28px;height:28px;flex-basis:28px;border-radius:6px}
  .gBrandGlyph{left:4px;font-size:21px;line-height:28px}
  .gBrandBeam{left:11px;top:5px;width:18px;height:18px}
  .gBrandName{font-size:20px}
  .gBrandTagline{font-size:4.2px;letter-spacing:.21em;margin-top:3px}
}
</style>'''

FAVICON = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Cinemap">
<defs>
  <linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#ffeccc" stop-opacity=".90"/><stop offset=".42" stop-color="#edc98f" stop-opacity=".56"/><stop offset=".75" stop-color="#dcb276" stop-opacity=".18"/><stop offset="1" stop-color="#d6ae72" stop-opacity="0"/></linearGradient>
</defs>
<rect width="128" height="128" rx="28" fill="#0a0c0f"/>
<rect id="outline-tile" x="16" y="16" width="96" height="96" rx="21" fill="none" stroke="#ebe3d6" stroke-width="1" opacity=".90"/>
<path d="M57 62 L111 40 L111 88 Z" fill="url(#beam)" opacity=".96"/>
<text x="29" y="92" fill="#fbf6ed" font-family="Bodoni 72,Didot,Iowan Old Style,Baskerville,Times New Roman,serif" font-size="75" font-weight="400">C</text>
</svg>'''


def patch_page(path: Path):
    text = path.read_text(encoding="utf-8")
    text, n = re.subn(
        r'<style id="(?:cinemap-live-header-brand-v1|cinemap-outline-brand-v2)">.*?</style>',
        OUTLINE_CSS,
        text,
        count=1,
        flags=re.S,
    )
    if n != 1:
        raise SystemExit(f"Expected one live header brand block in {path.name}, found {n}")
    if OLD_MARK in text:
        text = text.replace(OLD_MARK, NEW_MARK)
    text = text.replace(
        '<a href="index.html"><span class="gBrandTile"',
        '<a class="gBrand" href="index.html"><span class="gBrandTile"'
    )
    brand_lockup = '<a class="gBrand" href="index.html"><span class="gBrandTile"'
    if text.count(brand_lockup) < 2:
        raise SystemExit(f"Expected two horizontal gBrand lockups in {path.name}")
    path.write_text(text, encoding="utf-8")


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)


def inside_round_rect(x, y, left, top, right, bottom, radius):
    if left + radius <= x <= right - radius or top + radius <= y <= bottom - radius:
        return left <= x <= right and top <= y <= bottom
    cx = left + radius if x < left + radius else right - radius
    cy = top + radius if y < top + radius else bottom - radius
    return (x-cx)**2 + (y-cy)**2 <= radius**2


def make_icon(path: Path, n: int):
    bg = (10, 12, 15)
    ivory = (251, 246, 237)
    outline = (235, 227, 214)
    warm = (255, 232, 194)
    left, top, right, bottom = .14*n, .14*n, .86*n, .86*n
    radius = .145*n
    thick = max(1.0, .008*n)
    rows=[]
    for y in range(n):
        row=bytearray([0])
        for x in range(n):
            rgb=bg
            outer=inside_round_rect(x,y,left,top,right,bottom,radius)
            inner=inside_round_rect(x,y,left+thick,top+thick,right-thick,bottom-thick,max(1,radius-thick))
            if outer and not inner:
                rgb=outline
            ox,oy=.44*n,.50*n
            if x>=ox:
                dx=x-ox; half=.36*dx+.020*n; dy=abs(y-oy)
                if dy<half:
                    edge=max(0.0,min(1.0,(half-dy)/(.05*n)))
                    fade=max(0.0,1.0-dx/(.47*n))
                    a=.12+.38*edge*fade
                    rgb=tuple(round(rgb[i]*(1-a)+warm[i]*a) for i in range(3))
            cx,cy=.42*n,.51*n
            rr=math.hypot(x-cx,y-cy)
            ang=math.atan2(y-cy,x-cx)
            ring=.18*n<=rr<=.25*n and abs(ang)>=math.radians(48)
            top_serif=.46*n<x<.58*n and .27*n<y<.32*n
            bot_serif=.46*n<x<.58*n and .70*n<y<.75*n
            if ring or top_serif or bot_serif:
                rgb=ivory
            row.extend((*rgb,255))
        rows.append(bytes(row))
    raw=b''.join(rows)
    ihdr=struct.pack('>IIBBBBB',n,n,8,6,0,0,0)
    png=b'\x89PNG\r\n\x1a\n'+png_chunk(b'IHDR',ihdr)+png_chunk(b'IDAT',zlib.compress(raw,9))+png_chunk(b'IEND',b'')
    path.write_bytes(png)


for page in PAGES:
    patch_page(ROOT / page)
(ROOT / "favicon.svg").write_text(FAVICON, encoding="utf-8")
make_icon(ROOT / "apple-touch-icon.png", 180)
make_icon(ROOT / "icon-192.png", 192)
make_icon(ROOT / "icon-512.png", 512)
print("Applied final crafted B brand details to", len(PAGES), "pages")
