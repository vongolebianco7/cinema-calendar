from pathlib import Path
import json
import math
import re
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    "index.html", "discover.html", "experience.html", "my-cinemap.html",
    "search.html", "rankings.html", "critic.html", "revivals.html", "theaters.html",
]

BRAND_META = '''\n<link rel="icon" href="favicon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#0a0c0f">'''

BRAND_CSS = r'''
<style id="cinemap-brand-v1">
/* Cinemap brandTagline: premium editorial identity */
.brand{
  color:#f4efe5!important;
  font-family:Georgia,"Times New Roman","Yu Mincho","Hiragino Mincho ProN",serif!important;
  font-size:22px!important;
  font-weight:500!important;
  letter-spacing:-.035em!important;
  line-height:.92!important;
  display:inline-flex!important;
  flex-direction:column!important;
  align-items:flex-start!important;
  justify-content:center!important;
  text-decoration:none!important;
  white-space:nowrap!important;
  min-width:max-content;
}
.brand::after{
  content:"EXPLORE CINEMA";
  display:block;
  margin-top:6px;
  padding-left:1px;
  color:#cdbfa9;
  font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","Hiragino Sans","Yu Gothic",Meiryo,sans-serif;
  font-size:5.8px;
  font-weight:650;
  line-height:1;
  letter-spacing:.28em;
}
.brandA:after{display:none!important}
.brandTagline{font-family:inherit}
@media(max-width:430px){
  .brand{font-size:20px!important}
  .brand::after{font-size:5.2px;letter-spacing:.22em;margin-top:5px}
}
</style>
'''

FAVICON = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Cinemap">
<defs>
  <linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#f1dfbd" stop-opacity=".85"/><stop offset="1" stop-color="#cdb68c" stop-opacity=".08"/></linearGradient>
  <filter id="blur"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<rect width="128" height="128" rx="28" fill="#0a0c0f"/>
<path d="M64 64 L121 36 L121 92 Z" fill="url(#beam)" filter="url(#blur)" opacity=".78"/>
<text x="22" y="96" fill="#f4efe5" font-family="Georgia,Times New Roman,serif" font-size="91">C</text>
</svg>'''


def add_meta(text: str) -> str:
    if 'rel="icon" href="favicon.svg"' not in text:
        marker = '<meta name="description"'
        pos = text.find(marker)
        if pos >= 0:
            end = text.find('>', pos)
            text = text[:end + 1] + BRAND_META + text[end + 1:]
        else:
            text = text.replace('</head>', BRAND_META + '\n</head>', 1)
    return text


def add_brand_css(text: str) -> str:
    text = re.sub(r'\.brandA:after\{content:"";position:absolute;width:0;height:0;border-top:3px solid transparent;border-bottom:3px solid transparent;border-left:5px solid var\(--accent\);left:50%;top:56%;transform:translate\(-42%,-50%\)\}', '', text)
    if 'id="cinemap-brand-v1"' not in text:
        text = text.replace('</head>', BRAND_CSS + '</head>', 1)
    return text


def patch_pages():
    for name in PAGES:
        path = ROOT / name
        text = path.read_text(encoding='utf-8')
        text = add_meta(text)
        text = add_brand_css(text)
        path.write_text(text, encoding='utf-8')


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)


def rounded_inside(x, y, n, r):
    if r <= x < n-r or r <= y < n-r:
        return True
    cx = r if x < r else n-r-1
    cy = r if y < r else n-r-1
    return (x-cx)**2 + (y-cy)**2 <= r*r


def blend(a, b, t):
    return tuple(round(a[i]*(1-t)+b[i]*t) for i in range(3))


def make_icon(path: Path, n: int):
    bg = (10, 12, 15)
    ivory = (244, 239, 229)
    warm = (226, 202, 160)
    rows = []
    cx, cy = .43*n, .50*n
    outer, inner = .285*n, .205*n
    cut_angle = math.radians(50)
    origin_x, origin_y = .49*n, .50*n
    radius = .205*n
    for y in range(n):
        row = bytearray([0])
        for x in range(n):
            if not rounded_inside(x, y, n, radius):
                row.extend((0,0,0,0)); continue
            rgb = bg
            # Soft projection beam; its edges fade so it does not read as a play button.
            if x >= origin_x:
                dx = x-origin_x
                half = .50*dx + .035*n
                dy = abs(y-origin_y)
                if dy < half:
                    edge = max(0.0, min(1.0, (half-dy)/(.10*n)))
                    fade = max(.0, 1.0-dx/(.62*n))
                    strength = .08 + .34*edge*(.55+.45*fade)
                    rgb = blend(rgb, warm, strength)
            # Geometric editorial C with small terminal flares.
            dx, dy = x-cx, y-cy
            rr = math.hypot(dx,dy)
            angle = math.atan2(dy,dx)
            in_ring = inner <= rr <= outer and abs(angle) >= cut_angle
            serif_top = (.52*n < x < .64*n and .22*n < y < .29*n)
            serif_bottom = (.52*n < x < .64*n and .71*n < y < .78*n)
            if in_ring or serif_top or serif_bottom:
                rgb = ivory
            row.extend((*rgb,255))
        rows.append(bytes(row))
    raw = b''.join(rows)
    ihdr = struct.pack('>IIBBBBB', n,n,8,6,0,0,0)
    png = b'\x89PNG\r\n\x1a\n' + png_chunk(b'IHDR',ihdr) + png_chunk(b'IDAT',zlib.compress(raw,9)) + png_chunk(b'IEND',b'')
    path.write_bytes(png)


def write_assets():
    (ROOT/'favicon.svg').write_text(FAVICON, encoding='utf-8')
    manifest = {
        "name":"Cinemap", "short_name":"Cinemap", "start_url":"./", "display":"standalone",
        "background_color":"#0a0c0f", "theme_color":"#0a0c0f",
        "icons":[
            {"src":"icon-192.png","sizes":"192x192","type":"image/png"},
            {"src":"icon-512.png","sizes":"512x512","type":"image/png"}
        ]
    }
    (ROOT/'manifest.webmanifest').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    make_icon(ROOT/'apple-touch-icon.png', 180)
    make_icon(ROOT/'icon-192.png', 192)
    make_icon(ROOT/'icon-512.png', 512)


if __name__ == '__main__':
    patch_pages()
    write_assets()
    print('Applied Cinemap brand identity to', len(PAGES), 'primary pages.')
