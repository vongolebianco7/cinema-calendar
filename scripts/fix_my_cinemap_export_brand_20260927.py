from pathlib import Path

path = Path(__file__).resolve().parents[1] / "js/my-cinemap-art.js"
text = path.read_text(encoding="utf-8")

old_loader = '''const cinemapLogo=new Image();\ncinemapLogo.src='assets/cinemap-logo.png?v=2';\ncinemapLogo.onload=()=>{try{if(typeof picks!=='undefined')drawArtwork(picks)}catch{}};\n'''
if old_loader not in text:
    raise SystemExit("Legacy My Cinemap logo loader not found")
text = text.replace(old_loader, "")

old_draw = '''function drawBrand(ctx,w,h,theme){\n  if(!cinemapLogo.complete||!cinemapLogo.naturalWidth)return;\n  const scale=Math.min(174/cinemapLogo.naturalWidth,58/cinemapLogo.naturalHeight);\n  const dw=cinemapLogo.naturalWidth*scale,dh=cinemapLogo.naturalHeight*scale;\n  ctx.save();if(theme!=='theater'){ctx.fillStyle='#22262c';ctx.globalAlpha=.92;ctx.fillRect(w-96-dw-12,h-93,dw+24,dh+16)}ctx.globalAlpha=.95;ctx.drawImage(cinemapLogo,w-96-dw,h-85,dw,dh);ctx.restore();\n}\n'''
new_draw = '''function drawBrand(ctx,w,h,theme){\n  ctx.save();\n  const dark=theme==='theater';\n  ctx.textAlign='right';ctx.textBaseline='alphabetic';\n  ctx.fillStyle=dark?'#f4efe5':'#29231d';ctx.globalAlpha=.96;\n  ctx.font=`500 42px ${artSerif}`;ctx.fillText('Cinemap',w-96,h-70);\n  ctx.fillStyle=dark?'#cdbfa9':'#8a7658';ctx.globalAlpha=.9;\n  ctx.font=`650 10px ${artSans}`;ctx.fillText('EXPLORE CINEMA',w-96,h-49);\n  ctx.restore();\n}\n'''
if old_draw not in text:
    raise SystemExit("Legacy My Cinemap drawBrand implementation not found")
text = text.replace(old_draw, new_draw)
path.write_text(text, encoding="utf-8")
print("Updated My Cinemap export brand")
