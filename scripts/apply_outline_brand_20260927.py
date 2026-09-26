from pathlib import Path
import math
import re
import struct
import zlib

# Reapply trigger: keep implementation and regression expectations synchronized.
ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    "index.html", "discover.html", "experience.html", "my-cinemap.html",
    "search.html", "rankings.html", "critic.html", "revivals.html", "theaters.html",
]

OLD_MARK = '<img class="gLogo gLogoMark" src="favicon.svg" alt="" aria-hidden="true">'
NEW_MARK = '<span class="gBrandTile" aria-hidden="true"><span class="gBrandGlyph">C</span><span class="gBrandBeam"></span></span>'

OUTLINE_CSS = r'''<style id="cinemap-outline-brand-v2">
/* Approved B concept: horizontal Outline Tile + premium editorial serif wordmark. */
.gBrand{
  display:inline-flex!important;
  flex-direction:row!important;
  flex-wrap:nowrap!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:8px!important;
  flex:0 0 auto;
  min-width:max-content;
  color:#f5efe5!important;
  text-decoration:none!important;
  white-space:nowrap!important;
}
.gBrandTile{
  position:relative;
  display:block;
  width:30px;
  height:30px;
  flex:0 0 30px;
  border:1px solid rgba(235,227,214,.88);
  border-radius:8px;
  background:rgba(255,255,255,.012);
  overflow:hidden;
  box-shadow:inset 0 0 0 .5px rgba(255,255,255,.035);
}
.gBrandGlyph{
  position:absolute;
  left:5px;
  top:0;
  z-index:2;
  color:#fbf6ed;
  font-family:"Bodoni 72",Didot,"Iowan Old Style",Baskerville,"Times New Roman",serif;
  font-size:23px;
  font-weight:500;
  line-height:29px;
  letter-spacing:-.055em;
}
.gBrandBeam{
  position:absolute;
  z-index:1;
  left:14px;
  top:6px;
  width:18px;
  height:18px;
  background:linear-gradient(90deg,rgba(255,238,204,.78) 0%,rgba(239,211,162,.42) 42%,rgba(222,187,131,.10) 76%,rgba(222,187,131,0) 100%);
  clip-path:polygon(0 38%,100% 5%,100% 95%,0 62%);
  filter:blur(.1px);
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
}
.gBrandName{
  color:#f5efe5;
  font-family:"Bodoni 72",Didot,"Iowan Old Style",Baskerville,"Times New Roman",serif;
  font-size:24px;
  font-weight:500;
  line-height:.86;
  letter-spacing:-.018em;
  white-space:nowrap;
  text-rendering:optimizeLegibility;
  -webkit-font-smoothing:antialiased;
}
.gBrandTagline{
  margin-top:5px;
  padding-left:1px;
  color:#cbbca6;
  font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","Hiragino Sans","Yu Gothic",Meiryo,sans-serif;
  font-size:5.4px;
  font-weight:600;
  line-height:1;
  letter-spacing:.27em;
  white-space:nowrap;
}
@media(max-width:430px){
  .gBrand{flex-direction:row!important;flex-wrap:nowrap!important;gap:7px!important;min-width:max-content}
  .gBrandTile{width:29px;height:29px;flex:0 0 29px;border-radius:7px}
  .gBrandGlyph{left:5px;top:0;font-size:22px;line-height:28px}
  .gBrandBeam{left:13px;top:6px;width:17px;height:17px;opacity:1}
  .gBrandWords{flex-direction:column!important;white-space:nowrap!important}
  .gBrandName{font-size:21px;line-height:.86;letter-spacing:-.018em}
  .gBrandTagline{font-size:4.9px;letter-spacing:.21em;margin-top:4px}
}
</style>'''

FAVICON = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Cinemap">
<defs>
  <linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#ffeccc" stop-opacity=".9"/><stop offset=".48" stop-color="#edc98f" stop-opacity=".46"/><stop offset="1" stop-color="#d6ae72" stop-opacity="0"/></linearGradient>
</defs>
<rect width="128" height="128" rx="28" fill="#0a0c0f"/>
<rect id="outline-tile" x="16" y="16" width="96" height="96" rx="23" fill="none" stroke="#ebe3d6" stroke-width="3" opacity=".94"/>
<path d="M58 62 L110 39 L110 89 Z" fill="url(#beam)" opacity=".96"/>
<text x="29" y="92" fill="#fbf6ed" font-family="Bodoni 72,Didot,Iowan Old Style,Baskerville,Times New Roman,serif" font-size="75" font-weight="500">C</text>
</svg>'''


def patch_page(path: Path):
    text = path.read_text(encoding="utf-8")
    # Reapply cleanly whether the page still has v1 or already has the approved v2 block.
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
        count = text.count(OLD_MARK)
        if count < 2:
            raise SystemExit(f"Expected header and drawer marks in {path.name}, found {count}")
        text = text.replace(OLD_MARK, NEW_MARK)

    # Some pages lost the gBrand class on the visible header anchor, which makes
    # the tile and wordmark stack instead of using the approved horizontal B lockup.
    text = text.replace(
        '<a href="index.html"><span class="gBrandTile"',
        '<a class="gBrand" href="index.html"><span class="gBrandTile"'
    )

    # Horizontal structure is mandatory in both the visible header and drawer.
    brand_lockup = '<a class="gBrand" href="index.html"><span class="gBrandTile"'
    if text.count(brand_lockup) < 2:
        raise SystemExit(f"Expected two horizontal gBrand lockups in {path.name}")
    if text.count('class="gBrandTile"') < 2 or text.count('class="gBrandWords"') < 2:
        raise SystemExit(f"Expected horizontal header and drawer brand structure in {path.name}")
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
    warm = (255, 230, 189)
    left, top, right, bottom = .14*n, .14*n, .86*n, .86*n
    radius = .16*n
    thick = max(1.4, .022*n)
    rows=[]
    for y in range(n):
        row=bytearray([0])
        for x in range(n):
            rgb=bg
            outer=inside_round_rect(x,y,left,top,right,bottom,radius)
            inner=inside_round_rect(x,y,left+thick,top+thick,right-thick,bottom-thick,max(1,radius-thick))
            if outer and not inner:
                rgb=outline
            # Stronger but still soft projection beam, matching the agreed B mockup.
            ox,oy=.45*n,.50*n
            if x>=ox:
                dx=x-ox; half=.40*dx+.022*n; dy=abs(y-oy)
                if dy<half:
                    edge=max(0.0,min(1.0,(half-dy)/(.055*n)))
                    fade=max(0.0,1.0-dx/(.46*n))
                    a=.13+.40*edge*fade
                    rgb=tuple(round(rgb[i]*(1-a)+warm[i]*a) for i in range(3))
            # Geometric C approximation, intentionally legible at iPhone icon sizes.
            cx,cy=.43*n,.51*n
            rr=math.hypot(x-cx,y-cy)
            ang=math.atan2(y-cy,x-cx)
            ring=.18*n<=rr<=.25*n and abs(ang)>=math.radians(48)
            top_serif=.47*n<x<.58*n and .27*n<y<.32*n
            bot_serif=.47*n<x<.58*n and .70*n<y<.75*n
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
print("Applied refined approved Cinemap Outline Tile brand to", len(PAGES), "pages")
