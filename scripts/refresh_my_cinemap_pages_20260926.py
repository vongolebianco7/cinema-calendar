from pathlib import Path
import re

VERSION = "20260927-my-cinemap-final-v1"

html_path = Path("my-cinemap.html")
html = html_path.read_text(encoding="utf-8")

# 1) Simpler English-first defaults. Keep the optional personal comment, but no canned poem.
html, n = re.subn(r'<input id="title" value="[^"]*" maxlength="45">', '<input id="title" value="MY TOP 10" maxlength="45">', html, count=1)
if n != 1:
    raise SystemExit("Could not update My Cinemap default title")
html, n = re.subn(r'<input id="sub" value="[^"]*" maxlength="60">', '<input id="sub" value="" placeholder="ひとこと（任意）" maxlength="60">', html, count=1)
if n != 1:
    raise SystemExit("Could not update My Cinemap optional comment")

# 2) Move the design picker below image shape/layout. Replace the long color rail with four deliberate templates.
design_pattern = re.compile(
    r'<div class="label">デザイン</div><input type="hidden" id="theme" value=""><div class="themeChoices" id="themeChoices">.*?</div>(?=<div class="label">映画を追加</div>)',
    re.S,
)
match = design_pattern.search(html)
if not match:
    raise SystemExit("Could not find the My Cinemap design picker")
html = html[:match.start()] + html[match.end():]
new_picker = '''<div class="designPicker"><div class="label">デザインテンプレート</div><input type="hidden" id="theme" value="minimal"><div class="themeChoices" id="themeChoices">
<button type="button" class="themeChoice premiumTheme active" data-theme="minimal"><span class="themeSwatch" style="background:linear-gradient(135deg,#fffaf0,#e7dcc7)"></span><span><b>Minimal</b><small>余白とタイポ中心</small></span></button>
<button type="button" class="themeChoice premiumTheme" data-theme="filmnote"><span class="themeSwatch" style="background:linear-gradient(135deg,#efe2c9,#b99e76)"></span><span><b>Film Note</b><small>紙とフィルムの質感</small></span></button>
<button type="button" class="themeChoice premiumTheme" data-theme="theater"><span class="themeSwatch" style="background:linear-gradient(135deg,#13213a,#06090f)"></span><span><b>Theater Night</b><small>深いネイビーの映画館</small></span></button>
<button type="button" class="themeChoice premiumTheme" data-theme="galleryeditorial"><span class="themeSwatch" style="background:linear-gradient(135deg,#f2e9d9,#bd9e6e)"></span><span><b>Gallery Editorial</b><small>額装とギャラリーの空気感</small></span></button>
</div></div><div class="visualOptions"><label>作品イラスト<select id="illustrationMode"><option value="none" selected>なし（推奨）</option><option value="abstract">抽象イラスト</option></select></label><span>公式ポスターや場面写真は画像出力に使用しません。</span></div>'''
html, n = re.subn(
    r'(<div class="exportOptions">.*?</div>)(<div id="art" class="art">)',
    lambda m: m.group(1) + new_picker + m.group(2),
    html,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit("Could not place design picker below image controls")

# 3) Persist the illustration option with saved lists and rerender it on change.
html = html.replace(
    'layout:document.getElementById("layout").value,savedAt:',
    'layout:document.getElementById("layout").value,illustrationMode:document.getElementById("illustrationMode").value,savedAt:',
    1,
)
html = html.replace('["format","layout"].forEach(id=>{if(s[id])document.getElementById(id).value=s[id]})', '["format","layout","illustrationMode"].forEach(id=>{if(s[id])document.getElementById(id).value=s[id]})', 1)
html = html.replace('["format","layout"].forEach(id=>document.getElementById(id).onchange=render)', '["format","layout","illustrationMode"].forEach(id=>document.getElementById(id).onchange=render)', 1)

# 4) Version the canvas script.
html, n = re.subn(
    r'<script src="js/my-cinemap-art\.js(?:\?v=[^"]+)?"></script>',
    f'<script src="js/my-cinemap-art.js?v={VERSION}"></script>',
    html,
    count=1,
)
if n != 1:
    raise SystemExit("Could not version My Cinemap artwork script")
html_path.write_text(html, encoding="utf-8")

# 5) Editor-side tools: stronger selection treatment, four template-specific buttons only,
#    default director from search, and a clearer optional one-line comment editor.
tools_path = Path("js/my-cinemap-tools.js")
tools = tools_path.read_text(encoding="utf-8")

style_add = '''
    .designPicker{margin:10px 0 12px;padding:12px;border:1px solid #2d2d2d;border-radius:13px;background:#101010}.designPicker>.label{margin-top:0}.designPicker .themeChoices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;overflow:visible}.themeChoice.premiumTheme{min-width:0;border-radius:11px;padding:10px;align-items:center}.themeChoice.premiumTheme>span:last-child{display:grid;gap:2px}.themeChoice.premiumTheme b{font-size:12px}.themeChoice.premiumTheme small{font-size:9px;opacity:.65}.themeChoice.premiumTheme.active{border-color:#f7f1e3!important;box-shadow:0 0 0 2px #f7f1e3,0 10px 24px #0007;transform:translateY(-1px)}.premiumTheme.active:before{content:'✓';position:absolute;right:7px;top:7px;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#f7f1e3;color:#111;font-size:12px;font-weight:950}.visualOptions{display:grid;grid-template-columns:minmax(0,220px) 1fr;gap:10px;align-items:end;margin:0 0 12px}.visualOptions label{font-size:12px;color:#bbb}.visualOptions select{margin-top:5px}.visualOptions span{font-size:10px;line-height:1.5;color:#777;padding-bottom:8px}.movieComment{font-weight:650}.movieEditPanel label:last-of-type{color:#c9c9c9}@media(max-width:760px){.designPicker .themeChoices{grid-template-columns:1fr}.visualOptions{grid-template-columns:1fr}.visualOptions span{padding-bottom:0}}
'''
if '.designPicker{' not in tools:
    tools = tools.replace('    .templateHint{font-size:10px;color:#777;margin:5px 0 8px}.duplicateNotice{font-size:11px;color:#c9b783;margin-top:8px}\n', style_add + '    .templateHint{font-size:10px;color:#777;margin:5px 0 8px}.duplicateNotice{font-size:11px;color:#c9b783;margin-top:8px}\n', 1)
else:
    tools = re.sub(r'\s*\.themeChoice\.premiumTheme\.active\{.*?@media\(max-width:760px\)\{.*?\}\n', '\n' + style_add, tools, count=1, flags=re.S)

# Keep the premium mount function as a no-op for backward compatibility; HTML now owns the four templates.
tools, n = re.subn(
    r'function addPremiumTemplates\(\)\{.*?\}\n\n  function mount\(',
    "function addPremiumTemplates(){const theme=document.getElementById('theme'),choices=document.getElementById('themeChoices');if(!theme||!choices)return;choices.querySelectorAll('[data-theme]').forEach(b=>{b.onclick=()=>{theme.value=b.dataset.theme;syncThemeChoices();render()}});if(!document.getElementById('templateHint')){const h=document.createElement('div');h.id='templateHint';h.className='templateHint';h.textContent='テンプレートで構図・質感・タイポグラフィまで変わります。';choices.before(h)}}\n\n  function mount(",
    tools,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit("Could not replace premium template mount")

tools = tools.replace('一言コメント<input class="movieComment" maxlength="40" placeholder="任意・40文字まで"', 'ひとこと（任意）<input class="movieComment" maxlength="40" placeholder="短いコメントを入れる"', 1)
tools_path.write_text(tools, encoding="utf-8")

# 6) Rebuild the canvas renderer around the agreed four templates.
art_path = Path("js/my-cinemap-art.js")
art = '''/* My Cinemap local canvas renderer. No paid image service and no official poster/still reuse. */
const artPalettes={minimal:['#fbf7ef','#201c18'],filmnote:['#eee2ca','#272018'],theater:['#08111f','#f3e8ce'],galleryeditorial:['#f3eadb','#272019']};
let artworkFile=null,artworkRevision=0,artworkURL=null;
const artValue=id=>document.getElementById(id)?.value||'';
const artSans='"Hiragino Sans","Yu Gothic",Meiryo,sans-serif';
const artSerif='Georgia,"Times New Roman",serif';
const cinemapLogo=new Image();cinemapLogo.src='assets/cinemap-logo.png?v=2';cinemapLogo.onload=()=>{try{if(typeof picks!=="undefined")drawArtwork(picks)}catch{}};
function artText(ctx,text,x,y,width,size,maxLines=2,weight=700,family=artSans){const chars=Array.from(String(text||''));let lines=[''];const wrap=()=>{lines=[''];for(const ch of chars){let n=lines.length-1;if(ctx.measureText(lines[n]+ch).width>width&&lines[n])lines.push(ch);else lines[n]+=ch}};do{ctx.font=`${weight} ${size}px ${family}`;wrap();if(lines.length<=maxLines||size<=20)break;size-=2}while(true);if(lines.length>maxLines){lines=lines.slice(0,maxLines);let last=lines[maxLines-1];while(last&&ctx.measureText(last+'…').width>width)last=Array.from(last).slice(0,-1).join('');lines[maxLines-1]=last+'…'}lines.forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.35));return lines.length*size*1.35}
function drawFilmGrain(ctx,w,h,strength=.025){ctx.save();ctx.globalAlpha=strength;for(let i=0;i<360;i++){const x=(i*73)%w,y=(i*151)%h,s=1+(i%2);ctx.fillStyle=i%2?'#fff':'#000';ctx.fillRect(x,y,s,s)}ctx.restore()}
function drawFilmStrip(ctx,x,y,w,h,color){ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.globalAlpha=.12;ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);const step=Math.max(28,w/18);for(let px=x+10;px<x+w-10;px+=step){ctx.fillRect(px,y+8,14,8);ctx.fillRect(px,y+h-16,14,8)}ctx.restore()}
function drawCurtain(ctx,w,h,color){ctx.save();ctx.strokeStyle=color;ctx.globalAlpha=.12;ctx.lineWidth=22;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(i*58,0);ctx.bezierCurveTo(160+i*42,h*.25,35+i*24,h*.72,0+i*22,h);ctx.stroke();ctx.beginPath();ctx.moveTo(w-i*58,0);ctx.bezierCurveTo(w-160-i*42,h*.25,w-35-i*24,h*.72,w-i*22,h);ctx.stroke()}ctx.restore()}
function drawGalleryRoom(ctx,w,h,fg){ctx.save();ctx.strokeStyle=fg;ctx.fillStyle=fg;ctx.globalAlpha=.13;ctx.lineWidth=3;ctx.strokeRect(55,55,w-110,h-110);ctx.fillRect(75,92,w-150,2);const frames=[[w*.67,h*.12,w*.17,h*.13],[w*.79,h*.3,w*.12,h*.18],[w*.62,h*.48,w*.16,h*.14]];frames.forEach(([x,y,fw,fh])=>{ctx.strokeRect(x,y,fw,fh);ctx.strokeRect(x+12,y+12,fw-24,fh-24);ctx.globalAlpha=.05;ctx.fillRect(x+25,y+25,fw-50,fh-50);ctx.globalAlpha=.13});ctx.restore()}
function drawAbstractThumb(ctx,x,y,w,h,index,theme){const palettes=theme==='theater'?[['#132f50','#c59a5c'],['#1e403d','#d2a657'],['#4b2433','#c77455'],['#163650','#8ba8c0']]:theme==='filmnote'?[['#d7b899','#88694f'],['#c7a39a','#765c65'],['#b7b59a','#6c7055'],['#d9c2a3','#8b745f']]:[['#d9c7a6','#76634b'],['#c6b4a7','#6f5e58'],['#b8c0ad','#5e6a58'],['#c8b89c','#73644f']];const p=palettes[index%palettes.length];ctx.save();ctx.fillStyle=p[0];ctx.fillRect(x,y,w,h);ctx.fillStyle=p[1];ctx.globalAlpha=.85;switch(index%6){case 0:ctx.beginPath();ctx.arc(x+w*.68,y+h*.37,h*.24,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.22;ctx.fillRect(x+w*.15,y+h*.68,w*.7,h*.06);break;case 1:for(let i=0;i<5;i++)ctx.fillRect(x+w*(.12+i*.17),y+h*(.64-(i%3)*.12),w*.1,h*(.24+(i%3)*.12));break;case 2:ctx.strokeStyle=p[1];ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x+w*.12,y+h*.72);ctx.lineTo(x+w*.45,y+h*.3);ctx.lineTo(x+w*.7,y+h*.67);ctx.lineTo(x+w*.9,y+h*.22);ctx.stroke();break;case 3:ctx.beginPath();ctx.arc(x+w*.36,y+h*.55,h*.22,0,Math.PI*2);ctx.arc(x+w*.64,y+h*.55,h*.22,0,Math.PI*2);ctx.fill();break;case 4:ctx.fillRect(x+w*.18,y+h*.22,w*.64,h*.56);ctx.globalAlpha=.25;ctx.fillStyle=p[0];ctx.fillRect(x+w*.25,y+h*.3,w*.5,h*.4);break;default:ctx.beginPath();ctx.moveTo(x+w*.1,y+h*.68);ctx.lineTo(x+w*.52,y+h*.18);ctx.lineTo(x+w*.9,y+h*.68);ctx.closePath();ctx.fill()}ctx.restore()}
function drawMedal(ctx,x,y,rank,theme){const metallic=rank===1?'#b9903a':rank===2?'#a7abb1':'#a76d43';ctx.save();ctx.translate(x,y);ctx.strokeStyle=metallic;ctx.fillStyle=metallic;ctx.lineWidth=3;ctx.globalAlpha=.96;ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.16;ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.96;ctx.font=`500 31px ${artSerif}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(rank),0,1);ctx.lineWidth=2;for(const side of [-1,1]){for(let i=0;i<5;i++){const yy=-18+i*10,xx=side*(38+i*2);ctx.beginPath();ctx.ellipse(xx,yy,8,3,side*.55,0,Math.PI*2);ctx.stroke()}}ctx.textAlign='left';ctx.textBaseline='top';ctx.restore()}
function drawMinimal(ctx,w,h,bg,fg){ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.save();ctx.strokeStyle='#b99758';ctx.globalAlpha=.35;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(90,72);ctx.lineTo(w-90,72);ctx.stroke();ctx.restore()}
function drawFilmNote(ctx,w,h,bg,fg){ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);drawFilmGrain(ctx,w,h,.045);drawFilmStrip(ctx,22,42,55,h-84,fg);drawFilmStrip(ctx,w-77,42,55,h-84,fg);ctx.save();ctx.fillStyle='#7a6548';ctx.globalAlpha=.08;for(let y=130;y<h-150;y+=56)ctx.fillRect(100,y,w-200,1);ctx.restore()}
function drawTheater(ctx,w,h,bg,fg){ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);drawCurtain(ctx,w,h,'#8e2d31');ctx.save();const g=ctx.createRadialGradient(w*.5,h*.06,0,w*.5,h*.06,w*.7);g.addColorStop(0,'rgba(236,204,138,.15)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.fillStyle='#7b2327';ctx.globalAlpha=.35;for(let i=0;i<9;i++){ctx.beginPath();ctx.ellipse(120+i*170,h-45,86,34,0,0,Math.PI*2);ctx.fill()}ctx.restore()}
function drawGalleryEditorial(ctx,w,h,bg,fg){ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);drawFilmGrain(ctx,w,h,.025);drawGalleryRoom(ctx,w,h,fg);ctx.save();const g=ctx.createLinearGradient(0,0,w*.45,h*.45);g.addColorStop(0,'rgba(255,255,255,.22)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.restore()}
function drawTemplateBackdrop(ctx,w,h,bg,fg,theme){if(theme==='filmnote')drawFilmNote(ctx,w,h,bg,fg);else if(theme==='theater')drawTheater(ctx,w,h,bg,fg);else if(theme==='galleryeditorial')drawGalleryEditorial(ctx,w,h,bg,fg);else drawMinimal(ctx,w,h,bg,fg)}
function drawBrand(ctx,w,h,theme,fg){const maxW=250,maxH=64,x=w-96,y=h-82;if(cinemapLogo.complete&&cinemapLogo.naturalWidth){const r=Math.min(maxW/cinemapLogo.naturalWidth,maxH/cinemapLogo.naturalHeight);const dw=cinemapLogo.naturalWidth*r,dh=cinemapLogo.naturalHeight*r;ctx.save();if(theme==='theater'){ctx.globalAlpha=.92;ctx.fillStyle='rgba(255,255,255,.08)';ctx.roundRect?.(x-dw-18,y-8,dw+36,dh+16,12);ctx.fill()}ctx.globalAlpha=.95;ctx.drawImage(cinemapLogo,x-dw,y,dw,dh);ctx.restore()}else{ctx.save();ctx.fillStyle=fg;ctx.font=`600 26px ${artSerif}`;ctx.textAlign='right';ctx.fillText('Cinemap',x,y+10);ctx.restore()}}
function drawArtwork(movies){const c=document.getElementById('artCanvas'),ctx=c.getContext('2d');const shape=artValue('format'),layout=artValue('layout'),theme=artValue('theme')||'minimal',illustrations=artValue('illustrationMode')==='abstract';c.width=1600;c.height=shape==='landscape'?1000:shape==='square'?1600:2000;const w=c.width,h=c.height,pad=96,inner=w-pad*2;const[bg,fg]=artPalettes[theme]||artPalettes.minimal;drawTemplateBackdrop(ctx,w,h,bg,fg,theme);ctx.fillStyle=fg;ctx.textBaseline='top';const rule=(x,y,width,alpha=.25)=>{ctx.save();ctx.globalAlpha=alpha;ctx.fillRect(x,y,width,2);ctx.restore()};const title=artValue('title')||'MY TOP 10';ctx.textAlign='center';ctx.font=`500 ${shape==='landscape'?64:82}px ${artSerif}`;ctx.fillText(title,w/2,pad+18);ctx.textAlign='left';let cursor=pad+125;const sub=artValue('sub').trim();if(sub){ctx.globalAlpha=.72;ctx.font=`500 25px ${artSerif}`;ctx.textAlign='center';ctx.fillText(sub,w/2,cursor);ctx.textAlign='left';ctx.globalAlpha=1;cursor+=52}rule(pad,cursor,inner,theme==='theater'?.25:.18);cursor+=34;const items=movies.slice(0,10),bottom=h-145,available=bottom-cursor;const columns=layout==='ranking'?1:(shape==='landscape'?2:1),rows=Math.ceil(items.length/columns)||1,gap=columns===2?58:0,cellW=(inner-gap*(columns-1))/columns,cellH=available/rows;if(!items.length){ctx.globalAlpha=.42;ctx.font=`400 40px ${artSerif}`;ctx.textAlign='center';ctx.fillText('ADD YOUR FILMS',w/2,cursor+available*.35);ctx.textAlign='left';ctx.globalAlpha=1}items.forEach((m,i)=>{const col=columns===1?0:Math.floor(i/rows),row=columns===1?i:i%rows,x=pad+col*(cellW+gap),y=cursor+row*cellH;rule(x,y,cellW,theme==='theater'?.18:.13);const centerY=y+cellH*.5;const numberX=x+52;if(i<3)drawMedal(ctx,numberX,centerY,i+1,theme);else{ctx.font=`400 ${Math.min(44,cellH*.42)}px ${artSerif}`;ctx.globalAlpha=.82;ctx.textAlign='center';ctx.fillText(String(i+1),numberX,y+cellH*.26);ctx.textAlign='left';ctx.globalAlpha=1}let textX=x+110;if(illustrations){const tw=Math.min(150,cellW*.22),th=Math.min(82,cellH*.68);drawAbstractThumb(ctx,textX,y+(cellH-th)/2,tw,th,i,theme);textX+=tw+24}const textW=x+cellW-textX-10;const nameSize=Math.max(24,Math.min(36,cellH*.24));const nameH=artText(ctx,m.title,textX,y+Math.max(11,cellH*.15),textW,nameSize,1,600,artSerif);const metaY=y+Math.max(11,cellH*.15)+nameH+3;ctx.globalAlpha=.62;const director=m.director?`  |  ${m.director}`:'';artText(ctx,`${m.year||''}${director}`,textX,metaY,textW,18,1,400,artSerif);ctx.globalAlpha=1;if(m.movieComment&&cellH>120){ctx.globalAlpha=.72;artText(ctx,m.movieComment,textX,metaY+29,textW,17,1,500,artSans);ctx.globalAlpha=1}});rule(pad,h-112,inner,.2);drawBrand(ctx,w,h,theme,fg);c.setAttribute('aria-label',title+'。'+movies.map((m,i)=>(i+1)+'位 '+m.title+(m.director?' 監督 '+m.director:'')).join('、'));artworkFile=null;document.getElementById('share').disabled=true;const revision=++artworkRevision;c.toBlob(blob=>{if(!blob||revision!==artworkRevision)return;artworkFile=new File([blob],'my-cinemap.png',{type:'image/png'});document.getElementById('share').disabled=false},'image/png')}
function downloadArtwork(file){if(artworkURL)URL.revokeObjectURL(artworkURL);artworkURL=URL.createObjectURL(file);const a=document.createElement('a');a.href=artworkURL;a.download='my-cinemap.png';document.body.append(a);a.click();a.remove()}
async function saveArtwork(){const msg=document.getElementById('msg');try{const file=artworkFile||await new Promise((resolve,reject)=>document.getElementById('artCanvas').toBlob(b=>b?resolve(new File([b],'my-cinemap.png',{type:'image/png'})):reject(new Error('encode')),'image/png'));downloadArtwork(file);msg.textContent='PNGを保存しました。iPhoneの写真に保存するには「画像を共有」を選んでください。'}catch{msg.textContent='画像を保存できませんでした。もう一度お試しください。'}}
async function shareArtwork(){const msg=document.getElementById('msg'),file=artworkFile;if(!file){msg.textContent='画像を準備中です。少し待ってからお試しください。';return}try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:artValue('title')});msg.textContent='共有しました。'}else{downloadArtwork(file);msg.textContent='画像の共有に対応していないため、PNGを保存しました。'}}catch(e){if(e.name!=='AbortError')msg.textContent='共有できませんでした。「PNGを保存」をお試しください。'}}
window.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('script');s.src='js/my-cinemap-tools.js?v=20260927-my-cinemap-final-v1';s.defer=true;document.body.appendChild(s)});
window.addEventListener('pagehide',()=>{if(artworkURL)URL.revokeObjectURL(artworkURL)});
'''
art_path.write_text(art, encoding="utf-8")

print(f"Refreshed My Cinemap final template system to {VERSION}")
