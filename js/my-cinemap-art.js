/* My Cinemap: editorial ranking export rendered locally without poster/still artwork. */
const artPalettes = {
  minimal: {bg:'#f4ecdf', fg:'#1f1b17', muted:'#6f665d', line:'#cdbf9f', accent:'#a98243', border:'#a98243', dark:false},
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
function drawMedal(ctx,x,y,rank,theme){
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
function drawBrand(ctx,w,h,theme){
  const p=artPalettes[theme]||artPalettes.minimal,dark=!!p.dark;
  const fg=dark?'#fbf6ed':p.fg,outline=dark?'rgba(239,230,216,.86)':p.border,tagline=dark?'#cbbca6':p.muted;
  const tile=38,wordW=176,total=tile+14+wordW,x=(w-total)/2,y=h-98;
  ctx.save();ctx.strokeStyle=outline;ctx.lineWidth=1.5;ctx.strokeRect(x,y,tile,tile);
  const beam=ctx.createLinearGradient(x+17,y,x+tile+9,y);beam.addColorStop(0,dark?'rgba(255,235,196,.72)':'rgba(166,127,72,.58)');beam.addColorStop(1,'rgba(222,187,131,0)');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x+17,y+15);ctx.lineTo(x+tile+9,y+8);ctx.lineTo(x+tile+9,y+31);ctx.lineTo(x+17,y+24);ctx.closePath();ctx.fill();
  ctx.fillStyle=fg;ctx.textAlign='left';ctx.textBaseline='top';ctx.font=`500 29px ${artDisplay}`;ctx.fillText('C',x+7,y+2);ctx.font=`500 27px ${artDisplay}`;ctx.fillText('Cinemap',x+tile+14,y-1);
  ctx.fillStyle=tagline;ctx.font=`600 7px ${artSans}`;ctx.fillText('EXPLORE CINEMA',x+tile+15,y+29);ctx.restore();
}
function drawArtwork(movies){
  const c=document.getElementById('artCanvas'),ctx=c.getContext('2d');
  const shape=artValue('format')||'portrait',layout=artValue('layout')||'single',theme=artValue('theme')||'minimal',p=artPalettes[theme]||artPalettes.minimal;
  c.width=1600;c.height=shape==='landscape'?1000:shape==='square'?1600:2000;
  const w=c.width,h=c.height,pad=shape==='landscape'?104:128,inner=w-2*pad;
  ({minimal:drawMinimal,noir:drawNoir,burgundy:drawBurgundy,sage:drawSage,bluegray:drawBlueGray}[theme]||drawMinimal)(ctx,w,h,p);
  ctx.textBaseline='top';ctx.fillStyle=p.fg;
  const title=artValue('title').trim()||'MY TOP OF 2026';
  ctx.textAlign='center';
  const titleY=shape==='landscape'?76:shape==='square'?108:122;
  const headline=shape==='landscape'?58:shape==='square'?70:78;
  const titleHeight=writeLines(ctx,title,w/2,titleY,inner*.86,2,headline,48,artDisplay,500,1.05);
  ctx.textAlign='left';
  const note=artValue('sub').trim();let cursor=Math.max(shape==='landscape'?192:shape==='square'?256:292,titleY+titleHeight+48);
  if(note){ctx.fillStyle=p.muted;ctx.textAlign='center';writeLines(ctx,note,w/2,cursor,inner*.86,2,25,20,artSans,400);ctx.textAlign='left';cursor+=58;ctx.fillStyle=p.fg}
  rule(ctx,pad,cursor,inner,p.line,.62);cursor+=shape==='landscape'?18:26;
  const items=(movies||[]).slice(0,10),bottom=h-142,available=bottom-cursor;
  const columns=layout==='double'?2:1;
  const rows=columns===2?5:10,gap=columns===2?58:0,cellW=(inner-gap*(columns-1))/columns;
  const sparse=items.length>0&&items.length<=3;
  const cellH=sparse&&columns===1?Math.min(shape==='landscape'?150:250,available/(items.length+1)):available/rows;
  const firstRowY=sparse&&columns===1?cursor+available*(items.length===1?.3:.12):cursor;
  if(!items.length){ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.font=`400 29px ${artSans}`;ctx.fillText('映画を追加すると、ここに表示されます',w/2,cursor+available*.42);ctx.textAlign='left';ctx.fillStyle=p.fg}
  items.forEach((m,i)=>{
    const col=columns===1?0:Math.floor(i/5),row=columns===1?i:i%5;
    const x=pad+col*(cellW+gap),y=firstRowY+row*cellH,numberX=x+(columns===2?44:52);
    rule(ctx,x,y,cellW,p.line,p.dark?.34:.38);
    if(i<3)drawMedal(ctx,numberX,y+cellH*.5,i+1,theme);
    else{ctx.save();ctx.font=`400 ${columns===2?34:38}px ${artNumber}`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.fillText(String(i+1),numberX,y+Math.max(14,cellH*.25));ctx.restore()}
    const offset=columns===2?100:124,tx=x+offset,tw=cellW-offset-8,top=y+(sparse&&columns===1?cellH*.25:Math.max(10,Math.min(24,cellH*.15)));
    ctx.fillStyle=p.fg;
    const nameSize=sparse&&columns===1?Math.min(60,cellH*.3):columns===2?Math.min(30,Math.max(22,cellH*.22)):Math.min(38,Math.max(25,cellH*.24));
    const nameHeight=writeLines(ctx,m.title,tx,top,tw,cellH<112?1:2,nameSize,20,artBodySerif,500,1.12);
    const meta=[m.year,m.director].filter(Boolean).join('   ·   ');
    if(meta){ctx.fillStyle=p.muted;writeLines(ctx,meta,tx,top+nameHeight+6,tw,1,columns===2?20:23,17,artSans,400);ctx.fillStyle=p.fg}
  });
  rule(ctx,pad,h-114,inner,p.line,.50);drawBrand(ctx,w,h,theme);
  c.setAttribute('aria-label',title+'。'+items.map((m,i)=>(i+1)+'位 '+m.title+(m.director?' 監督 '+m.director:'')).join('、'));
  artworkFile=null;document.getElementById('share').disabled=true;
  const revision=++artworkRevision;
  c.toBlob(blob=>{if(!blob||revision!==artworkRevision)return;artworkFile=new File([blob],'my-cinemap.png',{type:'image/png'});document.getElementById('share').disabled=false},'image/png');
}
function downloadArtwork(file){if(artworkURL)URL.revokeObjectURL(artworkURL);artworkURL=URL.createObjectURL(file);const a=document.createElement('a');a.href=artworkURL;a.download='my-cinemap.png';document.body.append(a);a.click();a.remove()}
async function saveArtwork(){const msg=document.getElementById('msg');try{const file=artworkFile||await new Promise((resolve,reject)=>document.getElementById('artCanvas').toBlob(b=>b?resolve(new File([b],'my-cinemap.png',{type:'image/png'})):reject(new Error('encode')),'image/png'));downloadArtwork(file);msg.textContent='PNGをダウンロードしました。iPhoneでは「写真に保存」から画像を長押ししてください。'}catch{msg.textContent='画像を保存できませんでした。もう一度お試しください。'}}
function openImageForSaving(){const dialog=document.getElementById('saveImageDialog'),image=document.getElementById('saveImagePreview');image.src=document.getElementById('artCanvas').toDataURL('image/png');if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','')}
async function shareArtwork(){const msg=document.getElementById('msg'),file=artworkFile;if(!file){msg.textContent='画像を準備中です。少し待ってからお試しください。';return}try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:artValue('title')});msg.textContent='共有しました。'}else{downloadArtwork(file);msg.textContent='画像の共有に対応していないため、PNGを保存しました。'}}catch(e){if(e.name!=='AbortError')msg.textContent='共有できませんでした。「PNGを保存」をお試しください。'}}
window.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('script');s.src='js/my-cinemap-tools.js?v=20260927-my-cinemap-final-v7';s.defer=true;document.body.appendChild(s)});
window.addEventListener('pagehide',()=>{if(artworkURL)URL.revokeObjectURL(artworkURL)});
