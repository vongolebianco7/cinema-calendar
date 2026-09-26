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
/* Approved B concept: Outline Tile + editorial serif wordmark. No external font request. */
.gBrand{
  display:inline-flex!important;
  align-items:center!important;
  gap:9px!important;
  flex:0 0 auto;
  min-width:0;
  color:#f4efe5!important;
  text-decoration:none!important;
}
.gBrandTile{
  position:relative;
  display:block;
  width:31px;
  height:31px;
  flex:0 0 31px;
  border:1px solid rgba(216,208,195,.82);
  border-radius:8px;
  background:rgba(255,255,255,.015);
  overflow:hidden;
  box-shadow:inset 0 0 0 .5px rgba(255,255,255,.025);
}
.gBrandGlyph{
  position:absolute;
  left:5px;
  top:1px;
  z-index:2;
  color:#f7f1e7;
  font-family:Baskerville,"Iowan Old Style","Palatino Linotype","Book Antiqua",Georgia,serif;
  font-size:24px;
  font-weight:400;
  line-height:29px;
  letter-spacing:-.05em;
}
.gBrandBeam{
  position:absolute;
  z-index:1;
  left:15px;
  top:7px;
  width:17px;
  height:17px;
  background:linear-gradient(90deg,rgba(240,222,190,.32),rgba(214,190,150,.08) 62%,rgba(214,190,150,0));
  clip-path:polygon(0 38%,100% 5%,100% 95%,0 62%);
  filter:blur(.15px);
}
.gBrandWords{display:flex;flex-direction:column;align-items:flex-start;min-width:0;line-height:1}
.gBrandName{
  color:#f4efe5;
  font-family:Baskerville,"Iowan Old Style","Palatino Linotype","Book Antiqua",Georgia,serif;
  font-size:23px;
  font-weight:400;
  line-height:.9;
  letter-spacing:.005em;
  white-space:nowrap;
  text-rendering:optimizeLegibility;
}
.gBrandTagline{
  margin-top:5px;
  padding-left:1px;
  color:#bfb3a1;
  font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","Hiragino Sans","Yu Gothic",Meiryo,sans-serif;
  font-size:5.5px;
  font-weight:560;
  line-height:1;
  letter-spacing:.28em;
  white-space:nowrap;
}
@media(max-width:430px){
  .gBrand{gap:7px!important}
  .gBrandTile{width:29px;height:29px;flex-basis:29px;border-radius:7px}
  .gBrandGlyph{left:5px;top:0;font-size:22px;line-height:28px}
  .gBrandBeam{left:14px;top:7px;width:16px;height:15px}
  .gBrandName{font-size:20px}
  .gBrandTagline{font-size:4.9px;letter-spacing:.21em;margin-top:4px}
}
</style>'''

FAVICON = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Cinemap">
<defs>
  <linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#f0debe" stop-opacity=".38"/><stop offset="1" stop-color="#d6be96" stop-opacity="0"/></linearGradient>
</defs>
<rect width="128" height="128" rx="28" fill="#0a0c0f"/>
<rect id="outline-tile" x="16" y="16" width="96" height="96" rx="23" fill="none" stroke="#d8d0c3" stroke-width="3" opacity=".9"/>
<path d="M60 63 L108 43 L108 85 Z" fill="url(#beam)"/>
<text x="30" y="91" fill="#f7f1e7" font-family="Baskerville,Iowan Old Style,Palatino Linotype,Georgia,serif" font-size="74">C</text>
</svg>'''


def patch_page(path: Path):
    text = path.read_text(encoding="utf-8")
    text, n = re.subn(
        r'<style id="cinemap-live-header-brand-v1">.*?</style>',
        OUTLINE_CSS,
        text,
        count=1,
        flags=re.S,
    )
    if n != 1:
        raise SystemExit(f"Expected one live header brand block in {path.name}, found {n}")
    count = text.count(OLD_MARK)
    if count < 2:
        raise SystemExit(f"Expected header and drawer marks in {path.name}, found {count}")
    text = text.replace(OLD_MARK, NEW_MARK)
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
    ivory = (247, 241, 231)
    outline = (216, 208, 195)
    warm = (236, 216, 181)
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
            # soft projection beam
            ox,oy=.47*n,.50*n
            if x>=ox:
                dx=x-ox; half=.37*dx+.02*n; dy=abs(y-oy)
                if dy<half:
                    edge=max(0.0,min(1.0,(half-dy)/(.07*n)))
                    fade=max(0.0,1.0-dx/(.45*n))
                    a=.07+.22*edge*fade
                    rgb=tuple(round(rgb[i]*(1-a)+warm[i]*a) for i in range(3))
            # geometric C approximation, intentionally simple and legible at iPhone icon sizes
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
print("Applied approved Cinemap Outline Tile brand to", len(PAGES), "pages")
