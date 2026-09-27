/* My Cinemap: editorial ranking export rendered locally without poster/still artwork. */
const artPalettes = {
  minimal: {bg:'#f3efe7', fg:'#1f1d19', muted:'#7b746c', line:'#d3cab9', accent:'#b9aa8d', border:'#b9aa8d', dark:false},
  noir: {bg:'#1b1c1d', fg:'#f4efe6', muted:'#b9b0a5', line:'#514c46', accent:'#b8955d', border:'#8d744d', dark:true},
  burgundy: {bg:'#57252d', fg:'#f7eee4', muted:'#d4bdb2', line:'#87505a', accent:'#c89a68', border:'#a66f52', dark:true},
  sage: {bg:'#d7d9cb', fg:'#22251f', muted:'#687065', line:'#a8ae9e', accent:'#817752', border:'#8d8567', dark:false},
  bluegray: {bg:'#d9dfe3', fg:'#1d2730', muted:'#697681', line:'#aab4bb', accent:'#827665', border:'#8c9296', dark:false}
};
let artworkFile=null, artworkRevision=0, artworkURL=null;
const artValue=id=>document.getElementById(id)?.value||'';
const artDisplay='"Bodoni 72",Didot,"Hoefler Text","Times New Roman",serif';
const artBodySerif='"Iowan Old Style",Palatino,"Palatino Linotype","Yu Mincho",serif';
const artNumber='"Avenir Next","Helvetica Neue",Arial,sans-serif';
const artSerif=artBodySerif;
const artSans='"Avenir Next","Helvetica Neue","Hiragino Sans","Yu Gothic",Meiryo,sans-serif';
const artFonts={
  editorial:{title:artDisplay,movie:artBodySerif,titleWeight:500,movieWeight:600},
  modern:{title:'Baskerville,"Times New Roman","Yu Mincho",serif',movie:'Baskerville,"Times New Roman","Yu Mincho",serif',titleWeight:500,movieWeight:600},
  clean:{title:artSans,movie:artSans,titleWeight:650,movieWeight:650},
  classic:{title:'Georgia,"Times New Roman","Yu Mincho",serif',movie:'Georgia,"Times New Roman","Yu Mincho",serif',titleWeight:500,movieWeight:600}
};
const portraitTitleSize=54;
const portraitListTop=244;
const portraitFooterGap=54;
const rowInset=16;
const minimalPortraitTitleSize=46;
const minimalPortraitListTop=232;
const minimalPortraitRowHeight=154;
const minimalMedalScale=.86;
const minimalMetaAlpha=.74;
const minimalMovieWeight=600;
const minimalFooterGap=38;
const minimalSingleMovieSize=42;
const singleMovieSize=38;
const doublePortraitMovieSize=32;
const doubleCompactMovieSize=27;
const singleMetaSize=21;
const doubleMetaSize=20;

function rule(ctx,x,y,w,color,alpha=.5){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(x,y,w,1.5);ctx.restore()}
function fittedLines(ctx,text,maxWidth,maxLines,size,minSize,family,weight=400){
  const words=Array.from(String(text||'')); let lines=[];
  for(let s=size;s>=minSize;s-=2){
    ctx.font=`${weight} ${s}px ${family}`;lines=[''];
    for(const ch of words){let i=lines.length-1;if(lines[i]&&ctx.measureText(lines[i]+ch).width>maxWidth)lines.push(ch);else lines[i]+=ch}
    if(lines.length<=maxLines)return {lines,size:s};
  }
  lines=lines.slice(0,maxLines);let last=lines[maxLines-1];
  while(last&&ctx.measureText(last+'…').width>maxWidth)last=Array.from(last).slice(0,-1).join('');
  lines[maxLines-1]=last+'…';return {lines,size:minSize};
}
function writeLines(ctx,text,x,y,width,maxLines,size,minSize,family,weight=400,lineHeight=1.28){
  const fit=fittedLines(ctx,text,width,maxLines,size,minSize,family,weight);
  ctx.font=`${weight} ${fit.size}px ${family}`;
  fit.lines.forEach((line,i)=>ctx.fillText(line,x,y+i*fit.size*lineHeight));
  return fit.lines.length*fit.size*lineHeight;
}
function drawMedal(ctx,x,y,rank,theme,scale=1){
  const colors=['#a98c56','#92969a','#a77b61'],metal=colors[rank-1];
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle=metal;ctx.fillStyle=metal;ctx.lineWidth=1.35;
  for(const side of [-1,1])for(let i=0;i<6;i++){
    const a=-1.02+i*.27,rx=side*(25+Math.cos(a)*12),ry=Math.sin(a)*27;
    ctx.save();ctx.translate(rx,ry);ctx.rotate(side*(.62-a*.18));ctx.beginPath();ctx.ellipse(0,0,6,2.2,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`400 31px ${artNumber}`;ctx.fillText(String(rank),0,0);ctx.restore();
}
function drawEditorialFrame(ctx,w,h,p){
  ctx.save();ctx.strokeStyle=p.border;ctx.globalAlpha=p.dark?.62:.58;ctx.lineWidth=1.5;ctx.strokeRect(62,48,w-124,h-96);
  ctx.restore();
}
function drawHeaderRule(ctx,w,p){
  const y=208,span=210;rule(ctx,w/2-span-28,y,span,p.line,.54);rule(ctx,w/2+28,y,span,p.line,.54);
  ctx.save();ctx.translate(w/2,y);ctx.rotate(Math.PI/4);ctx.fillStyle=p.accent;ctx.globalAlpha=.72;ctx.fillRect(-3.5,-3.5,7,7);ctx.restore();
}
function fillEditorialBackground(ctx,w,h,p,top,bottom){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);const wash=ctx.createLinearGradient(0,0,0,h);wash.addColorStop(0,top);wash.addColorStop(1,bottom);ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);drawEditorialFrame(ctx,w,h,p);drawHeaderRule(ctx,w,p);
}
function drawMinimal(ctx,w,h,p){fillEditorialBackground(ctx,w,h,p,'rgba(255,255,255,.28)','rgba(154,143,124,.025)')}
function drawNoir(ctx,w,h,p){fillEditorialBackground(ctx,w,h,p,'rgba(255,255,255,.025)','rgba(0,0,0,.10)')}
function drawBurgundy(ctx,w,h,p){fillEditorialBackground(ctx,w,h,p,'rgba(255,238,218,.04)','rgba(43,10,17,.12)')}
function drawSage(ctx,w,h,p){fillEditorialBackground(ctx,w,h,p,'rgba(255,255,245,.18)','rgba(104,117,94,.055)')}
function drawBlueGray(ctx,w,h,p){fillEditorialBackground(ctx,w,h,p,'rgba(255,255,255,.20)','rgba(80,98,113,.05)')}

function drawProjectionGlow(ctx,w,h,p,strength=.11){
  ctx.save();
  const g=ctx.createLinearGradient(70,h*.12,w*.72,h*.78);
  g.addColorStop(0,'rgba(255,244,216,0)');g.addColorStop(.34,`rgba(255,238,194,${strength})`);g.addColorStop(.68,'rgba(255,244,216,.015)');g.addColorStop(1,'rgba(255,244,216,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(78,h*.18);ctx.lineTo(w*.74,h*.34);ctx.lineTo(w*.56,h*.78);ctx.lineTo(96,h*.48);ctx.closePath();ctx.fill();
  ctx.restore();
}
function drawBurgundyArch(ctx,w,h,p){
  ctx.save();ctx.strokeStyle=p.accent;ctx.globalAlpha=.13;ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(w*.78,h*.17,w*.28,h*.23,0,Math.PI,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.ellipse(w*.78,h*.17,w*.20,h*.16,0,Math.PI,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(w*.18,h*.79,w*.22,-Math.PI*.10,Math.PI*.58);ctx.stroke();ctx.restore();
}
function drawBotanicalLines(ctx,w,h,p){
  ctx.save();ctx.strokeStyle=p.accent;ctx.fillStyle=p.accent;ctx.globalAlpha=.15;ctx.lineWidth=2;
  const stem=(x,y,flip=1)=>{ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+50*flip,y-120,x+36*flip,y-250,x+116*flip,y-360);ctx.stroke();for(let i=0;i<5;i++){const py=y-70-i*58,px=x+(18+i*12)*flip;ctx.save();ctx.translate(px,py);ctx.rotate(flip*(.52-i*.06));ctx.beginPath();ctx.ellipse(0,0,24,7,0,0,Math.PI*2);ctx.stroke();ctx.restore()}};
  stem(96,h-150,1);stem(w-94,380,-1);ctx.restore();
}
function drawArchiveGrid(ctx,w,h,p){
  ctx.save();ctx.strokeStyle=p.accent;ctx.globalAlpha=.09;ctx.lineWidth=1;
  for(let x=w*.56;x<w-64;x+=54){ctx.beginPath();ctx.moveTo(x,72);ctx.lineTo(x,h-72);ctx.stroke()}
  for(let y=h*.18;y<h*.80;y+=54){ctx.beginPath();ctx.moveTo(w*.50,y);ctx.lineTo(w-64,y);ctx.stroke()}
  ctx.globalAlpha=.12;ctx.beginPath();ctx.arc(w*.74,h*.27,150,0,Math.PI*2);ctx.stroke();ctx.restore();
}
function drawNoirGeometry(ctx,w,h,p){
  ctx.save();ctx.strokeStyle=p.accent;ctx.globalAlpha=.14;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(w*.64,58);ctx.lineTo(w-84,h*.33);ctx.lineTo(w*.72,h*.54);ctx.stroke();
  ctx.beginPath();ctx.moveTo(84,h*.69);ctx.lineTo(w*.31,h*.48);ctx.lineTo(w*.43,h*.82);ctx.stroke();ctx.restore();
}
function drawThemeIllustration(ctx,w,h,theme,p){
  if(theme==='minimal'){drawProjectionGlow(ctx,w,h,p,.085);return}
  if(theme==='noir'){drawProjectionGlow(ctx,w,h,p,.075);drawNoirGeometry(ctx,w,h,p);return}
  if(theme==='burgundy'){drawBurgundyArch(ctx,w,h,p);return}
  if(theme==='sage'){drawBotanicalLines(ctx,w,h,p);return}
  if(theme==='bluegray'){drawArchiveGrid(ctx,w,h,p)}
}

function drawCinemaBackground(ctx,w,h,kind){
  if(!kind||kind==='none')return;
  ctx.save();
  const dark=kind!=='projector';
  ctx.fillStyle=dark?'#0d1014':'#efe5d2';ctx.fillRect(0,0,w,h);
  if(kind==='projector'){
    const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#f4ead8');g.addColorStop(.55,'#d7c09b');g.addColorStop(1,'#8a6a48');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='rgba(55,39,27,.38)';ctx.beginPath();ctx.arc(w*.14,h*.84,110,0,Math.PI*2);ctx.arc(w*.27,h*.84,86,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,244,213,.28)';ctx.beginPath();ctx.moveTo(w*.28,h*.79);ctx.lineTo(w*.9,h*.32);ctx.lineTo(w*.9,h*.68);ctx.closePath();ctx.fill();
  }else if(kind==='theater'){
    ctx.fillStyle='#08131e';ctx.fillRect(0,0,w,h);ctx.fillStyle='#6d171d';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w*.25,0);ctx.lineTo(w*.17,h);ctx.lineTo(0,h);ctx.fill();ctx.beginPath();ctx.moveTo(w,0);ctx.lineTo(w*.75,0);ctx.lineTo(w*.83,h);ctx.lineTo(w,h);ctx.fill();
    ctx.strokeStyle='rgba(213,170,88,.5)';ctx.lineWidth=5;ctx.strokeRect(w*.23,h*.08,w*.54,h*.84);
  }else if(kind==='artdeco'){
    ctx.fillStyle='#080909';ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(202,161,78,.58)';ctx.lineWidth=3;
    for(let i=0;i<5;i++){ctx.strokeRect(65+i*18,65+i*18,w-130-i*36,h-130-i*36)}
    ctx.beginPath();ctx.moveTo(w*.18,h*.18);ctx.lineTo(w*.5,h*.05);ctx.lineTo(w*.82,h*.18);ctx.stroke();
  }else if(kind==='archive'){
    ctx.fillStyle='#15120f';ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(211,180,128,.38)';ctx.lineWidth=8;
    for(const x of [w*.15,w*.82]){ctx.beginPath();ctx.arc(x,h*.22,95,0,Math.PI*2);ctx.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.arc(x+Math.cos(a)*52,h*.22+Math.sin(a)*52,20,0,Math.PI*2);ctx.stroke()}}
    ctx.fillStyle='rgba(244,219,171,.10)';ctx.beginPath();ctx.moveTo(w*.2,h*.3);ctx.lineTo(w*.8,h*.48);ctx.lineTo(w*.8,h*.68);ctx.closePath();ctx.fill();
  }else if(kind==='screening'){
    ctx.fillStyle='#10131a';ctx.fillRect(0,0,w,h);ctx.fillStyle='#e6ddca';ctx.fillRect(w*.2,h*.12,w*.6,h*.34);
    ctx.fillStyle='#42191c';for(let r=0;r<5;r++)for(let i=0;i<8;i++){ctx.beginPath();ctx.roundRect(w*.13+i*w*.095,h*.58+r*58,90,38,8);ctx.fill()}
    const g=ctx.createLinearGradient(w*.5,h*.46,w*.5,h);g.addColorStop(0,'rgba(232,211,165,.16)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,h*.44,w,h*.56);
  }
  ctx.fillStyle=dark?'rgba(0,0,0,.34)':'rgba(255,248,235,.24)';ctx.fillRect(0,0,w,h);ctx.restore();
}

function drawBrand(ctx,w,h,theme,y=h-98){
  const p=artPalettes[theme]||artPalettes.minimal,dark=!!p.dark,isMinimal=theme==='minimal';
  const fg=dark?'#fbf6ed':p.fg,outline=dark?'rgba(239,230,216,.86)':p.border,tagline=dark?'#cbbca6':p.muted;
  const tile=isMinimal?30:34,wordW=isMinimal?148:160,total=tile+12+wordW,x=(w-total)/2;
  const lineY=y+(isMinimal?15:17),sideGap=42,lineW=Math.max(130,(w-total)/2-sideGap-78);
  rule(ctx,78,lineY,lineW,p.line,isMinimal?.30:.42);rule(ctx,w-78-lineW,lineY,lineW,p.line,isMinimal?.30:.42);
  ctx.save();ctx.strokeStyle=outline;ctx.globalAlpha=isMinimal?.76:1;ctx.lineWidth=isMinimal?1.15:1.35;ctx.strokeRect(x,y,tile,tile);
  const beam=ctx.createLinearGradient(x+15,y,x+tile+8,y);beam.addColorStop(0,dark?'rgba(255,235,196,.68)':isMinimal?'rgba(154,143,124,.38)':'rgba(166,127,72,.52)');beam.addColorStop(1,'rgba(222,187,131,0)');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x+15,y+13);ctx.lineTo(x+tile+8,y+7);ctx.lineTo(x+tile+8,y+(isMinimal?25:28));ctx.lineTo(x+15,y+(isMinimal?20:21));ctx.closePath();ctx.fill();
  ctx.globalAlpha=1;ctx.fillStyle=fg;ctx.textAlign='left';ctx.textBaseline='top';ctx.font=`500 ${isMinimal?23:26}px ${artDisplay}`;ctx.fillText('C',x+(isMinimal?5:6),y+1);ctx.font=`500 ${isMinimal?23:25}px ${artDisplay}`;ctx.fillText('Cinemap',x+tile+12,y-1);
  ctx.fillStyle=tagline;ctx.globalAlpha=isMinimal?.82:1;ctx.font=`600 ${isMinimal?6:6.5}px ${artSans}`;ctx.fillText('EXPLORE CINEMA',x+tile+13,y+(isMinimal?25:27));ctx.restore();
}
function layoutMetrics(shape,columns,theme){
  if(shape==='portrait')return {titleY:112,titleSize:theme==='minimal'?minimalPortraitTitleSize:portraitTitleSize,listTop:theme==='minimal'?minimalPortraitListTop:portraitListTop,rowH:theme==='minimal'?minimalPortraitRowHeight:(columns===2?286:148),footerGap:theme==='minimal'?minimalFooterGap:portraitFooterGap,pad:128};
  if(shape==='square')return {titleY:96,titleSize:58,listTop:222,rowH:columns===2?220:110,footerGap:42,pad:118};
  return {titleY:66,titleSize:46,listTop:182,rowH:columns===2?136:68,footerGap:30,pad:104};
}
function drawArtwork(movies){
  const c=document.getElementById('artCanvas'),ctx=c.getContext('2d');
  const shape=artValue('format')||'portrait',layout=artValue('layout')||'single',theme=artValue('theme')||'minimal',p=artPalettes[theme]||artPalettes.minimal;
  const fontKey=artValue('fontStyle')||'editorial',font=artFonts[fontKey]||artFonts.editorial;
  c.width=1600;c.height=shape==='landscape'?1000:shape==='square'?1600:2000;
  const w=c.width,h=c.height;
  const columns=layout==='double'?2:1;
  const metrics=layoutMetrics(shape,columns,theme),pad=metrics.pad,inner=w-2*pad;
  ({minimal:drawMinimal,noir:drawNoir,burgundy:drawBurgundy,sage:drawSage,bluegray:drawBlueGray}[theme]||drawMinimal)(ctx,w,h,p);
  const cinemaBackground=artValue('cinemaBackground')||'none';
  drawCinemaBackground(ctx,w,h,cinemaBackground);
  if(cinemaBackground==='none')drawThemeIllustration(ctx,w,h,theme,p);
  ctx.textBaseline='top';ctx.fillStyle=p.fg;
  const title=artValue('title').trim()||'MY TOP OF 2026';
  ctx.textAlign='center';
  const titleHeight=writeLines(ctx,title,w/2,metrics.titleY,inner*.78,2,metrics.titleSize,40,font.title,font.titleWeight,1.04);
  const titleBottom=metrics.titleY+titleHeight;
  const titleToListGap=shape==='portrait'?(theme==='minimal'?72:78):shape==='square'?68:70;
  const note=artValue('sub').trim();
  let listTop=Math.max(metrics.listTop,titleBottom+titleToListGap);
  if(note){
    ctx.fillStyle=p.muted;ctx.save();ctx.globalAlpha=theme==='minimal'?.76:1;
    const noteY=titleBottom+18,noteHeight=writeLines(ctx,note,w/2,noteY,inner*.78,2,21,17,artSans,400);
    ctx.restore();ctx.fillStyle=p.fg;listTop=Math.max(listTop,noteY+noteHeight+36)
  }
  ctx.textAlign='left';
  const items=(movies||[]).slice(0,10);
  const rows=columns===2?5:10;
  const doubleListBottomTarget=h-(shape==='portrait'?150:shape==='square'?126:106);
  const gap=columns===2?72:0,cellW=(inner-gap*(columns-1))/columns,rowH=columns===2?Math.max(96,(doubleListBottomTarget-listTop)/rows):metrics.rowH;
  const listBottom=listTop+rows*rowH;
  if(!items.length){ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.font=`400 29px ${artSans}`;ctx.fillText('映画を追加すると、ここに表示されます',w/2,listTop+rowH*3.5);ctx.textAlign='left';ctx.fillStyle=p.fg}
  items.forEach((m,i)=>{
    const col=columns===1?0:Math.floor(i/5),row=columns===1?i:i%5;
    const x=pad+col*(cellW+gap),y=listTop+row*rowH,numberX=x+(columns===2?42:48);
    rule(ctx,x,y,cellW,p.line,theme==='minimal'?.20:(p.dark?.27:.28));
    const medalScale=theme==='minimal'?minimalMedalScale:1;
    if(i<3)drawMedal(ctx,numberX,y+rowH*.5,i+1,theme,medalScale);
    else{ctx.save();ctx.font=`400 ${columns===2?30:32}px ${artNumber}`;ctx.fillStyle=p.muted;ctx.globalAlpha=theme==='minimal'?.78:1;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),numberX,y+rowH*.5);ctx.restore()}
    const offset=columns===2?92:112,tx=x+offset,tw=cellW-offset-8,top=y+rowInset;
    ctx.fillStyle=p.fg;
    const nameSize=columns===2?(shape==='portrait'?doublePortraitMovieSize:doubleCompactMovieSize):(shape==='portrait'?(theme==='minimal'?minimalSingleMovieSize:singleMovieSize):shape==='square'?34:28);
    const movieWeight=fontKey==='editorial'?(theme==='minimal'?minimalMovieWeight:font.movieWeight):font.movieWeight;
    const nameHeight=writeLines(ctx,m.title,tx,top,tw,2,nameSize,columns===2?21:24,font.movie,movieWeight,1.10);
    const meta=[m.year,m.director].filter(Boolean).join('   ·   ');
    if(meta){ctx.save();ctx.fillStyle=p.muted;ctx.globalAlpha=theme==='minimal'?minimalMetaAlpha:1;writeLines(ctx,meta,tx,top+nameHeight+9,tw,1,columns===2?doubleMetaSize:singleMetaSize,16,artSans,400);ctx.restore();ctx.fillStyle=p.fg}
  });
  rule(ctx,pad,listBottom,inner,p.line,theme==='minimal'?.22:.30);
  const footerY=Math.min(h-92,listBottom+metrics.footerGap);
  drawBrand(ctx,w,h,theme,footerY);
  c.setAttribute('aria-label',title+'。'+items.map((m,i)=>(i+1)+'位 '+m.title+(m.director?' 監督 '+m.director:'')).join('、'));
  artworkFile=null;document.getElementById('share').disabled=true;
  const revision=++artworkRevision;
  c.toBlob(blob=>{if(!blob||revision!==artworkRevision)return;artworkFile=new File([blob],'my-cinemap.png',{type:'image/png'});document.getElementById('share').disabled=false},'image/png');
}
function downloadArtwork(file){if(artworkURL)URL.revokeObjectURL(artworkURL);artworkURL=URL.createObjectURL(file);const a=document.createElement('a');a.href=artworkURL;a.download='my-cinemap.png';document.body.append(a);a.click();a.remove()}
async function saveArtwork(){const msg=document.getElementById('msg');try{const file=artworkFile||await new Promise((resolve,reject)=>document.getElementById('artCanvas').toBlob(b=>b?resolve(new File([b],'my-cinemap.png',{type:'image/png'})):reject(new Error('encode')),'image/png'));downloadArtwork(file);msg.textContent='PNGをダウンロードしました。iPhoneでは「写真に保存」から画像を長押ししてください。'}catch{msg.textContent='画像を保存できませんでした。もう一度お試しください。'}}
function openImageForSaving(){const dialog=document.getElementById('saveImageDialog'),image=document.getElementById('saveImagePreview');image.src=document.getElementById('artCanvas').toDataURL('image/png');if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','')}
async function shareArtwork(){const msg=document.getElementById('msg'),file=artworkFile;if(!file){msg.textContent='画像を準備中です。少し待ってからお試しください。';return}try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:artValue('title')});msg.textContent='共有しました。'}else{downloadArtwork(file);msg.textContent='画像の共有に対応していないため、PNGを保存しました。'}}catch(e){if(e.name!=='AbortError')msg.textContent='共有できませんでした。「PNGを保存」をお試しください。'}}
window.addEventListener('DOMContentLoaded',()=>{
  const s=document.createElement('script');
  s.src='js/my-cinemap-tools.js?v=20260927-my-cinemap-preview-v9';
  s.defer=true;
  s.onload=()=>{const a=document.createElement('script');a.src='js/my-cinemap-art-direction.js?v=20260927-cinema-backgrounds-v2';a.defer=true;document.body.appendChild(a)};
  document.body.appendChild(s)
});
window.addEventListener('pagehide',()=>{if(artworkURL)URL.revokeObjectURL(artworkURL)});
