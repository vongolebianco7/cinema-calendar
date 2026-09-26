from pathlib import Path
import re

art_path = Path("js/my-cinemap-art.js")
html_path = Path("my-cinemap.html")
art = art_path.read_text(encoding="utf-8")
html = html_path.read_text(encoding="utf-8")

palette = '''const artPalettes = {
  minimal: {bg:'#f4ecdf', fg:'#1f1b17', muted:'#6f665d', line:'#cdbf9f', accent:'#a98243', border:'#a98243', dark:false},
  noir: {bg:'#1b1c1d', fg:'#f4efe6', muted:'#b9b0a5', line:'#514c46', accent:'#b8955d', border:'#8d744d', dark:true},
  burgundy: {bg:'#57252d', fg:'#f7eee4', muted:'#d4bdb2', line:'#87505a', accent:'#c89a68', border:'#a66f52', dark:true},
  sage: {bg:'#d7d9cb', fg:'#22251f', muted:'#687065', line:'#a8ae9e', accent:'#817752', border:'#8d8567', dark:false},
  bluegray: {bg:'#d9dfe3', fg:'#1d2730', muted:'#697681', line:'#aab4bb', accent:'#827665', border:'#8c9296', dark:false}
};'''
art = re.sub(r"const artPalettes = \{.*?\n\};", palette, art, count=1, flags=re.S)

art = re.sub(
    r"const artSerif=.*?;\nconst artSans=.*?;",
    '''const artDisplay='"Bodoni 72",Didot,"Hoefler Text","Times New Roman",serif';
const artBodySerif='"Iowan Old Style",Palatino,"Palatino Linotype","Yu Mincho",serif';
const artNumber='"Avenir Next","Helvetica Neue",Arial,sans-serif';
const artSerif=artBodySerif;
const artSans='"Avenir Next","Helvetica Neue","Hiragino Sans","Yu Gothic",Meiryo,sans-serif';''',
    art,
    count=1,
    flags=re.S,
)

visuals = r'''function drawMedal(ctx,x,y,rank,theme){
  const colors=['#b88a35','#9ca0a4','#a86f45'],metal=colors[rank-1];
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=metal;ctx.fillStyle=metal;ctx.lineWidth=1.6;
  for(const side of [-1,1])for(let i=0;i<6;i++){
    const a=-1.02+i*.27,rx=side*(29+Math.cos(a)*14),ry=Math.sin(a)*31;
    ctx.save();ctx.translate(rx,ry);ctx.rotate(side*(.62-a*.18));ctx.beginPath();ctx.ellipse(0,0,7,2.6,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`400 38px ${artNumber}`;ctx.fillText(String(rank),0,0);ctx.restore();
}
function drawEditorialFrame(ctx,w,h,p){
  ctx.save();ctx.strokeStyle=p.border;ctx.globalAlpha=p.dark?.78:.76;ctx.lineWidth=2;ctx.strokeRect(62,48,w-124,h-96);ctx.lineWidth=1;ctx.globalAlpha=p.dark?.42:.42;ctx.strokeRect(72,58,w-144,h-116);
  const corners=[[62,48],[w-62,48],[62,h-48],[w-62,h-48]];ctx.fillStyle=p.accent;ctx.globalAlpha=.9;
  corners.forEach(([x,y])=>{ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillRect(-4,-4,8,8);ctx.restore()});ctx.restore();
}
function drawHeaderRule(ctx,w,p){
  const y=96,span=270;rule(ctx,w/2-span-34,y,span,p.line,.62);rule(ctx,w/2+34,y,span,p.line,.62);ctx.save();ctx.translate(w/2,y);ctx.rotate(Math.PI/4);ctx.fillStyle=p.accent;ctx.fillRect(-5,-5,10,10);ctx.restore();
}
function fillEditorialBackground(ctx,w,h,p,top,bottom){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);const wash=ctx.createLinearGradient(0,0,0,h);wash.addColorStop(0,top);wash.addColorStop(1,bottom);ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);drawEditorialFrame(ctx,w,h,p);drawHeaderRule(ctx,w,p);
}
function drawMinimal(ctx,w,h,p){fillEditorialBackground(ctx,w,h,p,'rgba(255,255,255,.42)','rgba(184,156,110,.055)')}
function drawNoir(ctx,w,h,p){fillEditorialBackground(ctx,w,h,p,'rgba(255,255,255,.035)','rgba(0,0,0,.16)')}
function drawBurgundy(ctx,w,h,p){fillEditorialBackground(ctx,w,h,p,'rgba(255,238,218,.055)','rgba(43,10,17,.17)')}
function drawSage(ctx,w,h,p){fillEditorialBackground(ctx,w,h,p,'rgba(255,255,245,.24)','rgba(104,117,94,.08)')}
function drawBlueGray(ctx,w,h,p){fillEditorialBackground(ctx,w,h,p,'rgba(255,255,255,.27)','rgba(80,98,113,.07)')}
'''
art = re.sub(r"function drawMedal\(.*?\nfunction drawBrand", visuals + "function drawBrand", art, count=1, flags=re.S)

brand = r'''function drawBrand(ctx,w,h,theme){
  const p=artPalettes[theme]||artPalettes.minimal,dark=!!p.dark;
  const fg=dark?'#fbf6ed':p.fg,outline=dark?'rgba(239,230,216,.86)':p.border,tagline=dark?'#cbbca6':p.muted;
  const tile=38,wordW=176,total=tile+14+wordW,x=(w-total)/2,y=h-98;
  ctx.save();ctx.strokeStyle=outline;ctx.lineWidth=1.5;ctx.strokeRect(x,y,tile,tile);
  const beam=ctx.createLinearGradient(x+17,y,x+tile+9,y);beam.addColorStop(0,dark?'rgba(255,235,196,.72)':'rgba(166,127,72,.58)');beam.addColorStop(1,'rgba(222,187,131,0)');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x+17,y+15);ctx.lineTo(x+tile+9,y+8);ctx.lineTo(x+tile+9,y+31);ctx.lineTo(x+17,y+24);ctx.closePath();ctx.fill();
  ctx.fillStyle=fg;ctx.textAlign='left';ctx.textBaseline='top';ctx.font=`500 29px ${artDisplay}`;ctx.fillText('C',x+7,y+2);ctx.font=`500 27px ${artDisplay}`;ctx.fillText('Cinemap',x+tile+14,y-1);
  ctx.fillStyle=tagline;ctx.font=`600 7px ${artSans}`;ctx.fillText('EXPLORE CINEMA',x+tile+15,y+29);ctx.restore();
}'''
art = re.sub(r"function drawBrand\(.*?\n\}
function drawArtwork", brand + "\nfunction drawArtwork", art, count=1, flags=re.S)

art = art.replace("const w=c.width,h=c.height,pad=theme==='galleryeditorial'?246:theme==='filmnote'?122:116,inner=w-2*pad;", "const w=c.width,h=c.height,pad=shape==='landscape'?104:128,inner=w-2*pad;")
art = art.replace("({minimal:drawMinimal,filmnote:drawFilmNote,theater:drawTheater,galleryeditorial:drawGalleryEditorial}[theme]||drawMinimal)(ctx,w,h,p);", "({minimal:drawMinimal,noir:drawNoir,burgundy:drawBurgundy,sage:drawSage,bluegray:drawBlueGray}[theme]||drawMinimal)(ctx,w,h,p);")
art = art.replace("const title=artValue('title').trim()||'MY TOP 10';", "const title=artValue('title').trim()||'MY TOP OF 2026';")
art = re.sub(r"const titleY=.*?;\n  const headline=.*?;\n  const titleHeight=writeLines\(ctx,title,w/2,titleY,inner,2,headline,58,artSerif,500,1\.05\);", "const titleY=shape==='landscape'?76:shape==='square'?108:122;\n  const headline=shape==='landscape'?58:shape==='square'?70:78;\n  const titleHeight=writeLines(ctx,title,w/2,titleY,inner*.86,2,headline,48,artDisplay,500,1.05);", art, count=1, flags=re.S)
art = re.sub(r"const note=artValue\('sub'\)\.trim\(\);let cursor=.*?;", "const note=artValue('sub').trim();let cursor=Math.max(shape==='landscape'?192:shape==='square'?256:292,titleY+titleHeight+48);", art, count=1)
art = art.replace("const items=(movies||[]).slice(0,10),bottom=h-(theme==='galleryeditorial'?244:140),available=bottom-cursor;", "const items=(movies||[]).slice(0,10),bottom=h-142,available=bottom-cursor;")
art = art.replace("rule(ctx,x,y,cellW,p.line,theme==='galleryeditorial'?.42:.30);", "rule(ctx,x,y,cellW,p.line,p.dark?.34:.38);")
art = art.replace("ctx.font=`500 ${columns===2?40:46}px ${artSerif}`;", "ctx.font=`400 ${columns===2?34:38}px ${artNumber}`;")
art = art.replace("const nameHeight=writeLines(ctx,m.title,tx,top,tw,cellH<112?1:2,nameSize,20,artSerif,500,1.12);", "const nameHeight=writeLines(ctx,m.title,tx,top,tw,cellH<112?1:2,nameSize,20,artBodySerif,500,1.12);")
art = re.sub(r"\n    if\(m\.movieComment&&columns===1&&cellH>150\).*?\n  \}\);", "\n  });", art, count=1, flags=re.S)
art = art.replace("rule(ctx,pad,theme==='galleryeditorial'?h-218:h-108,inner,p.line,.52);drawBrand(ctx,w,h,theme);", "rule(ctx,pad,h-114,inner,p.line,.50);drawBrand(ctx,w,h,theme);")

html_theme_block = '''<div class="themeChoices" id="themeChoices">
<button type="button" class="themeChoice premiumTheme active" data-theme="minimal"><span class="templatePreview previewMinimal" aria-hidden="true"></span><span><b>Minimal</b><small>アイボリー × シャンパン</small></span></button>
<button type="button" class="themeChoice premiumTheme" data-theme="noir"><span class="templatePreview previewNoir" aria-hidden="true"></span><span><b>Noir Editorial</b><small>チャコール × 鈍いゴールド</small></span></button>
<button type="button" class="themeChoice premiumTheme" data-theme="burgundy"><span class="templatePreview previewBurgundy" aria-hidden="true"></span><span><b>Burgundy Journal</b><small>ボルドー × ブロンズ</small></span></button>
<button type="button" class="themeChoice premiumTheme" data-theme="sage"><span class="templatePreview previewSage" aria-hidden="true"></span><span><b>Sage Museum</b><small>セージ × クリーム</small></span></button>
<button type="button" class="themeChoice premiumTheme" data-theme="bluegray"><span class="templatePreview previewBlueGray" aria-hidden="true"></span><span><b>Blue Grey Archive</b><small>ブルーグレー × シルバー</small></span></button>
</div>'''
html = re.sub(r'<div class="themeChoices" id="themeChoices">.*?</div>(?=</div><p class="exportLegal">)', html_theme_block, html, count=1, flags=re.S)

editorial_css = '''<style id="my-cinemap-editorial-v10">
#themeChoices{gap:8px;padding:3px 0 8px}.themeChoice{min-width:178px;border-radius:12px;padding:9px 10px;gap:9px}.themeChoice>span:last-child{display:grid;gap:3px}.themeChoice b{font-size:12px;letter-spacing:.01em}.themeChoice small{font-size:9px;color:#8f8f8f}.templatePreview{width:34px;height:46px;border-radius:3px;display:block;flex:0 0 34px;border:1px solid #ffffff2b;box-shadow:inset 0 0 0 1px #00000018}.previewMinimal{background:linear-gradient(180deg,#f7f0e5,#ece0cf);border-color:#a9824366}.previewNoir{background:linear-gradient(180deg,#252627,#151617);border-color:#b8955d66}.previewBurgundy{background:linear-gradient(180deg,#672e37,#451b22);border-color:#c89a6866}.previewSage{background:linear-gradient(180deg,#dfe0d3,#cbd0bf);border-color:#81775266}.previewBlueGray{background:linear-gradient(180deg,#e0e5e8,#cdd6dc);border-color:#82766566}
@media(max-width:760px){.themeChoice{min-width:164px}.templatePreview{width:31px;height:42px;flex-basis:31px}}
</style>'''
html = html.replace("</head>", editorial_css + "\n</head>", 1)
html = html.replace("my-cinemap-editorial-v9", "my-cinemap-editorial-v10")
html = html.replace('if(s.theme!=null)document.getElementById("theme").value=s.theme;', 'if(s.theme!=null)document.getElementById("theme").value=["minimal","noir","burgundy","sage","bluegray"].includes(s.theme)?s.theme:"minimal";')

art_path.write_text(art, encoding="utf-8")
html_path.write_text(html, encoding="utf-8")
print("Applied My Cinemap editorial v10")
