from pathlib import Path
import re

VERSION = "20260927-premium-art-v3"

html_path = Path("my-cinemap.html")
html = html_path.read_text(encoding="utf-8")

# Move the design picker from the editing form to directly below the image shape/layout controls.
design_pattern = re.compile(
    r'(<div class="label">デザイン</div><input type="hidden" id="theme" value=""><div class="themeChoices" id="themeChoices">.*?</div>)(?=<div class="label">映画を追加</div>)',
    re.S,
)
match = design_pattern.search(html)
if not match:
    raise SystemExit("Could not find the My Cinemap design picker")
design_block = match.group(1)
html = html[: match.start()] + html[match.end() :]
wrapped_design = f'<div class="designPicker">{design_block}</div>'
html, insert_count = re.subn(
    r'(<div class="exportOptions">.*?</div>)(<div id="art" class="art">)',
    lambda m: m.group(1) + wrapped_design + m.group(2),
    html,
    count=1,
    flags=re.S,
)
if insert_count != 1:
    raise SystemExit("Could not place design picker below image controls")

html, html_count = re.subn(
    r'<script src="js/my-cinemap-art\.js(?:\?v=[^"]+)?"></script>',
    f'<script src="js/my-cinemap-art.js?v={VERSION}"></script>',
    html,
    count=1,
)
if html_count != 1:
    raise SystemExit("Could not find exactly one My Cinemap artwork script tag")
html_path.write_text(html, encoding="utf-8")

# Make premium-theme selection unmistakable even though each template defines its own border color.
tools_path = Path("js/my-cinemap-tools.js")
tools = tools_path.read_text(encoding="utf-8")
active_css = '.themeChoice.premiumTheme.active{border-color:#f7f1e3!important;box-shadow:0 0 0 2px #f7f1e3,0 8px 24px #0008;transform:translateY(-1px)}.premiumTheme.active:before{content:\'✓\';position:absolute;right:7px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#f7f1e3;color:#111;font-size:12px;font-weight:950}.designPicker{margin:10px 0 14px;padding:12px;border:1px solid #2f2f2f;border-radius:12px;background:#101010}.designPicker>.label{margin-top:0}.designPicker .themeChoices{padding-bottom:3px}'
if '.themeChoice.premiumTheme.active{' not in tools:
    anchor = '    .templateHint{font-size:10px;color:#777;margin:5px 0 8px}.duplicateNotice{font-size:11px;color:#c9b783;margin-top:8px}\n'
    if anchor not in tools:
        raise SystemExit("Could not find premium theme CSS anchor")
    tools = tools.replace(anchor, f'    {active_css}\n' + anchor, 1)
tools_path.write_text(tools, encoding="utf-8")

# Add richer, still-local vector illustration language to the three premium templates.
art_path = Path("js/my-cinemap-art.js")
art = art_path.read_text(encoding="utf-8")

helpers = '''function drawMarquee(ctx,x,y,w,h,stroke){ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle=stroke;ctx.fillStyle=stroke;ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);ctx.beginPath();ctx.moveTo(x-w*.06,y+h*.16);ctx.lineTo(x+w*1.06,y+h*.16);ctx.lineTo(x+w*.94,y-h*.12);ctx.lineTo(x+w*.06,y-h*.12);ctx.closePath();ctx.stroke();const bulbs=16;for(let i=0;i<bulbs;i++){const px=x+12+i*(w-24)/(bulbs-1);ctx.beginPath();ctx.arc(px,y+12,3.8,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=.12;ctx.fillRect(x+18,y+42,w-36,h-62);ctx.restore()}\nfunction drawGalleryFrames(ctx,w,h,fg){ctx.save();ctx.strokeStyle=fg;ctx.fillStyle=fg;ctx.lineWidth=3;ctx.globalAlpha=.18;const frames=[[w*.68,h*.12,w*.18,h*.16],[w*.79,h*.34,w*.13,h*.19],[w*.61,h*.48,w*.15,h*.13]];frames.forEach(([x,y,fw,fh],i)=>{ctx.strokeRect(x,y,fw,fh);ctx.strokeRect(x+10,y+10,fw-20,fh-20);ctx.globalAlpha=.08;ctx.fillRect(x+22,y+22,fw-44,fh-44);ctx.globalAlpha=.18;ctx.beginPath();ctx.moveTo(x+fw*.18,y+fh*.74);ctx.lineTo(x+fw*.44,y+fh*(.34+i*.08));ctx.lineTo(x+fw*.62,y+fh*.63);ctx.lineTo(x+fw*.82,y+fh*.29);ctx.stroke()});ctx.restore()}\nfunction drawCinemaFacade(ctx,w,h,fg){ctx.save();ctx.strokeStyle=fg;ctx.fillStyle=fg;ctx.lineWidth=3;ctx.globalAlpha=.18;const x=w*.58,y=h*.62,fw=w*.33,fh=h*.25;ctx.strokeRect(x,y,fw,fh);ctx.fillRect(x+fw*.08,y+fh*.58,fw*.84,3);for(let i=0;i<5;i++){const dx=x+fw*.12+i*fw*.17;ctx.strokeRect(dx,y+fh*.62,fw*.11,fh*.34)}ctx.beginPath();ctx.moveTo(x-fw*.04,y);ctx.lineTo(x+fw*1.04,y);ctx.lineTo(x+fw*.9,y-fh*.18);ctx.lineTo(x+fw*.1,y-fh*.18);ctx.closePath();ctx.stroke();for(let i=0;i<11;i++){ctx.beginPath();ctx.arc(x+fw*.08+i*fw*.084,y-fh*.11,4,0,Math.PI*2);ctx.fill()}ctx.restore()}\n'''
if 'function drawMarquee(' not in art:
    marker = 'function drawArtDeco(ctx,w,h,fg)'
    if marker not in art:
        raise SystemExit("Could not find premium artwork function anchor")
    art = art.replace(marker, helpers + marker, 1)

new_artdeco = '''function drawArtDeco(ctx,w,h,fg){ctx.save();ctx.strokeStyle=fg;ctx.fillStyle=fg;ctx.globalAlpha=.24;ctx.lineWidth=3;const m=64;ctx.strokeRect(m,m,w-m*2,h-m*2);ctx.strokeRect(m+16,m+16,w-(m+16)*2,h-(m+16)*2);const sx=w*.79,sy=h*.18;for(let i=0;i<13;i++){const a=(-.85+i*.13)*Math.PI;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.cos(a)*w*.23,sy+Math.sin(a)*w*.23);ctx.stroke()}[[m+34,m+34],[w-m-34,m+34],[m+34,h-m-34],[w-m-34,h-m-34]].forEach(([x,y])=>{ctx.beginPath();ctx.moveTo(x-24,y);ctx.lineTo(x,y-24);ctx.lineTo(x+24,y);ctx.lineTo(x,y+24);ctx.closePath();ctx.stroke()});ctx.globalAlpha=.11;for(let i=0;i<8;i++){const bw=45+(i%3)*24,bh=70+(i%4)*34;ctx.fillRect(w*.52+i*72,h-bh-78,bw,bh)}ctx.restore();drawMarquee(ctx,w-480,125,330,170,fg);drawProjector(ctx,w-330,h-315,220,fg)}'''
new_gallery = '''function drawGallery(ctx,w,h,fg){ctx.save();ctx.globalAlpha=.12;ctx.fillStyle=fg;ctx.fillRect(72,72,w-144,3);ctx.fillRect(72,h-75,w-144,3);for(let i=0;i<3;i++){const x=w*(.66+i*.1);const g=ctx.createLinearGradient(x,0,x+90,h*.46);g.addColorStop(0,'rgba(255,255,255,.13)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+120,h*.48);ctx.lineTo(x-70,h*.48);ctx.closePath();ctx.fill()}ctx.restore();drawGalleryFrames(ctx,w,h,fg);drawFilmStrip(ctx,90,h-175,w-180,90,fg);ctx.save();ctx.globalAlpha=.16;ctx.strokeStyle=fg;ctx.lineWidth=2;ctx.strokeRect(105,h*.58,210,120);ctx.fillStyle=fg;ctx.fillRect(128,h*.62,164,3);ctx.fillRect(128,h*.66,112,3);ctx.fillRect(128,h*.7,142,3);ctx.restore()}'''
new_night = '''function drawNightTheater(ctx,w,h,fg){drawCurtain(ctx,w,h,fg);ctx.save();const g=ctx.createRadialGradient(w*.72,h*.15,0,w*.72,h*.15,w*.55);g.addColorStop(0,'rgba(180,205,255,.24)');g.addColorStop(1,'rgba(180,205,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.fillStyle=fg;ctx.globalAlpha=.22;for(let i=0;i<30;i++){const x=(i*97)%w,y=(i*43)%(h*.42);ctx.beginPath();ctx.arc(x,y,1+(i%3),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=.1;for(let i=0;i<13;i++){const bw=55+(i%4)*18,bh=80+(i%5)*30;ctx.fillRect(i*135,h-bh-45,bw,bh)}ctx.restore();drawCinemaFacade(ctx,w,h,fg);drawMarquee(ctx,w*.61,h*.48,w*.26,h*.12,fg);drawProjector(ctx,90,h-290,190,fg)}'''

for name, replacement, next_name in [
    ('drawArtDeco', new_artdeco, 'drawGallery'),
    ('drawGallery', new_gallery, 'drawNightTheater'),
    ('drawNightTheater', new_night, 'function templateLabel'),
]:
    if next_name.startswith('function '):
        pattern = rf'function {name}\(ctx,w,h,fg\)\{{.*?\}}\n(?={re.escape(next_name)})'
    else:
        pattern = rf'function {name}\(ctx,w,h,fg\)\{{.*?\}}\n(?=function {next_name}\()'
    art, count = re.subn(pattern, replacement + '\n', art, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"Could not replace {name}")

art, tools_count = re.subn(
    r"s\.src='js/my-cinemap-tools\.js(?:\?v=[^']+)?'",
    f"s.src='js/my-cinemap-tools.js?v={VERSION}'",
    art,
    count=1,
)
if tools_count != 1:
    raise SystemExit("Could not find exactly one My Cinemap tools loader")
art_path.write_text(art, encoding="utf-8")

print(f"Refreshed My Cinemap premium templates and asset URLs to {VERSION}")
