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
/* Approved B mockup: compact horizontal Outline Tile + editorial serif wordmark. */
.gBrand{
  display:inline-flex!important;
  flex-direction:row!important;
  flex-wrap:nowrap!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:8px!important;
  flex:0 0 auto;
  min-width:max-content;
  color:#f8f0e4!important;
  text-decoration:none!important;
  white-space:nowrap!important;
}
.gBrandTile{
  position:relative;
  display:block;
  width:34px;
  height:34px;
  flex:0 0 34px;
  border:.6px solid rgba(240,224,199,.90);
  border-radius:9px;
  background:linear-gradient(145deg,rgba(255,255,255,.02),rgba(255,255,255,.004));
  overflow:hidden;
  box-shadow:inset 0 0 0 .3px rgba(255,255,255,.035);
}
.gBrandGlyph{
  position:absolute;
  left:5px;
  top:-1px;
  z-index:2;
  color:#fff5e8;
  font-family:"Bodoni 72",Didot,"Iowan Old Style",Baskerville,"Times New Roman",serif;
  font-size:26px;
  font-weight:400;
  line-height:34px;
  letter-spacing:-.065em;
}
.gBrandBeam{
  position:absolute;
  z-index:1;
  left:14px;
  top:5px;
  width:22px;
  height:23px;
  background:linear-gradient(90deg,rgba(255,239,205,.94) 0%,rgba(243,214,166,.67) 35%,rgba(225,190,135,.30) 68%,rgba(212,172,113,0) 100%);
  clip-path:polygon(0 39%,100% 6%,100% 94%,0 61%);
  filter:blur(.2px);
  opacity:1;
}
.gBrandWords{
  display:flex!important;
  flex-direction:column!important;
  align-items:flex-start!important;
  justify-content:center!important;
  min-width:0;
  line-height:1;
  white-space:nowrap;
  transform:translateY(-.5px);
}
.gBrandName{
  color:#fff3e4;
  font-family:"Bodoni 72",Didot,"Iowan Old Style",Baskerville,"Times New Roman",serif;
  font-size:26px;
  font-weight:400;
  line-height:.88;
  letter-spacing:-.024em;
  white-space:nowrap;
  text-rendering:optimizeLegibility;
  -webkit-font-smoothing:antialiased;
  font-feature-settings:"kern" 1,"liga" 1;
}
.gBrandTagline{
  margin-top:5px;
  padding-left:1px;
  color:#d7c7ae;
  font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","Hiragino Sans","Yu Gothic",Meiryo,sans-serif;
  font-size:5.1px;
  font-weight:600;
  line-height:1;
  letter-spacing:.28em;
  white-space:nowrap;
}
.gNav{height:60px!important;gap:9px!important}
@media(max-width:430px){
  .gNav{height:58px!important;gap:8px!important}
  .gBrand{flex-direction:row!important;flex-wrap:nowrap!important;gap:7px!important;min-width:max-content}
  .gBrandTile{width:31px;height:31px;flex:0 0 31px;border-radius:8px}
  .gBrandGlyph{left:5px;top:-1px;font-size:24px;line-height:31px;font-weight:400}
  .gBrandBeam{left:13px;top:5px;width:20px;height:21px;opacity:1}
  .gBrandWords{flex-direction:column!important;white-space:nowrap!important;transform:translateY(-.5px)}
  .gBrandName{font-size:23px;line-height:.88;letter-spacing:-.022em}
  .gBrandTagline{font-size:4.7px;letter-spacing:.25em;margin-top:4px;padding-left:1px}
  .gSearchForm{height:34px!important}
}
@media(max-width:370px){
  .gBrand{gap:6px!important}
  .gBrandTile{width:29px;height:29px;flex-basis:29px;border-radius:7px}
  .gBrandGlyph{left:4px;font-size:22px;line-height:29px}
  .gBrandBeam{left:12px;top:5px;width:19px;height:19px}
  .gBrandName{font-size:21px}
  .gBrandTagline{font-size:4.4px;letter-spacing:.22em;margin-top:4px}
}
</style>'''

FAVICON = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Cinemap">
<defs>
  <linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#ffeccc" stop-opacity=".94"/><stop offset=".42" stop-color="#edc98f" stop-opacity=".66"/><stop offset=".75" stop-color="#dcb276" stop-opacity=".28"/><stop offset="1" stop-color="#d6ae72" stop-opacity="0"/></linearGradient>
</defs>
<rect width="128" height="128" rx="28" fill="#0a0c0f"/>
<rect id="outline-tile" x="16" y="16" width="96" height="96" rx="23" fill="none" stroke="#ebe3d6" stroke-width="1.5" opacity=".94"/>
<path d="M57 62 L113 37 L113 91 Z" fill="url(#beam)" opacity="1"/>
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
    radius = .16*n
    thick = max(1.0, .012*n)
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
                dx=x-ox; half=.42*dx+.026*n; dy=abs(y-oy)
                if dy<half:
                    edge=max(0.0,min(1.0,(half-dy)/(.06*n)))
                    fade=max(0.0,1.0-dx/(.48*n))
                    a=.17+.47*edge*fade
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
print("Applied compact approved B mockup brand proportions to", len(PAGES), "pages")
