/* My Cinemap: typography-only export, rendered locally without image services. */
const artPalettes = {
  minimal: {bg:'#f8f4eb', fg:'#29231d', muted:'#70675e', line:'#bdb3a3'},
  filmnote: {bg:'#ede6d8', fg:'#28231e', muted:'#736a60', line:'#aa9a85'},
  theater: {bg:'#0e1727', fg:'#f1eee6', muted:'#bbb8b0', line:'#7f8290'},
  galleryeditorial: {bg:'#eae3d6', fg:'#2c2924', muted:'#746d63', line:'#afa597'}
};
let artworkFile=null, artworkRevision=0, artworkURL=null;
const artValue=id=>document.getElementById(id)?.value||'';
const artSerif='Georgia,"Times New Roman",serif';
const artSans='"Hiragino Sans","Yu Gothic",Meiryo,sans-serif';
const cinemapLogo=new Image();
cinemapLogo.src='assets/cinemap-logo.png?v=2';
cinemapLogo.onload=()=>{try{if(typeof picks!=='undefined')drawArtwork(picks)}catch{}};

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
  const colors=['#a98c56','#92969a','#a77b61'],metal=colors[rank-1];
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=metal;ctx.fillStyle=metal;
  ctx.lineWidth=rank===1?2:1.5;ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.stroke();
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`400 44px ${artSerif}`;ctx.fillText(String(rank),0,1);
  ctx.lineWidth=1.2;
  for(const side of [-1,1])for(let i=0;i<5;i++){
    const yy=-27+i*13,xx=side*(43+Math.abs(i-2)*2);
    ctx.beginPath();ctx.ellipse(xx,yy,5.5,2.1,side*.5,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
function drawMinimal(ctx,w,h,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
  rule(ctx,145,72,w-290,p.line,.7);
  ctx.fillStyle='#a38651';ctx.save();ctx.translate(w/2,72);ctx.rotate(Math.PI/4);ctx.fillRect(-5,-5,10,10);ctx.restore();
}
function drawFilmNote(ctx,w,h,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#b39878';ctx.fillRect(24,24,48,h-48);ctx.fillRect(w-72,24,48,h-48);
  ctx.fillStyle='#f5eee1';for(let y=40;y<h-45;y+=56){ctx.fillRect(38,y,18,22);ctx.fillRect(w-56,y,18,22)}
  ctx.fillStyle='#fffaf0';ctx.globalAlpha=.21;ctx.fillRect(76,34,w-152,h-68);ctx.globalAlpha=1;
  rule(ctx,112,84,w-224,p.line,.56);
}
function drawTheater(ctx,w,h,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
  const glow=ctx.createRadialGradient(w/2,0,8,w/2,0,h*.82);
  glow.addColorStop(0,'rgba(222,201,157,.24)');glow.addColorStop(1,'rgba(12,20,35,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  // Narrow, subdued curtain edges leave the typography in charge.
  ctx.fillStyle='#3a1b27';ctx.globalAlpha=.34;ctx.fillRect(0,0,45,h);ctx.fillRect(w-45,0,45,h);ctx.globalAlpha=1;
  rule(ctx,126,74,w-252,'#b5a17d',.65);
  ctx.fillStyle='#c2a678';ctx.save();ctx.translate(w/2,74);ctx.rotate(Math.PI/4);ctx.fillRect(-4,-4,8,8);ctx.restore();
}
function drawGalleryEditorial(ctx,w,h,p){
  ctx.fillStyle='#b0a08a';ctx.fillRect(0,0,w,h);
  const glow=ctx.createRadialGradient(w/2,0,0,w/2,h*.25,w*.75);
  glow.addColorStop(0,'rgba(255,247,221,.62)');glow.addColorStop(1,'rgba(255,247,221,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  // A framed exhibition list, not framed movie artwork.
  const x=68,y=62,fw=w-136,fh=h-124;
  ctx.fillStyle='#75644e';ctx.fillRect(x+16,y+20,fw,fh);
  ctx.fillStyle='#b69a66';ctx.fillRect(x-8,y-8,fw+16,fh+16);
  ctx.fillStyle='#e8d8b4';ctx.fillRect(x-2,y-2,fw+4,fh+4);
  ctx.fillStyle='#f8f5ee';ctx.fillRect(x,y,fw,fh);
  ctx.strokeStyle='#c8b89b';ctx.lineWidth=2;ctx.strokeRect(x+18,y+18,fw-36,fh-36);
  ctx.fillStyle='#75644e';ctx.globalAlpha=.16;ctx.fillRect(0,h-65,w,65);ctx.globalAlpha=1;
}
function drawBrand(ctx,w,h,theme){
  if(!cinemapLogo.complete||!cinemapLogo.naturalWidth)return;
  const scale=Math.min(174/cinemapLogo.naturalWidth,58/cinemapLogo.naturalHeight);
  const dw=cinemapLogo.naturalWidth*scale,dh=cinemapLogo.naturalHeight*scale;
  ctx.save();if(theme!=='theater'){ctx.fillStyle='#22262c';ctx.globalAlpha=.92;ctx.fillRect(w-96-dw-12,h-93,dw+24,dh+16)}ctx.globalAlpha=.95;ctx.drawImage(cinemapLogo,w-96-dw,h-85,dw,dh);ctx.restore();
}
function drawArtwork(movies){
  const c=document.getElementById('artCanvas'),ctx=c.getContext('2d');
  const shape=artValue('format'),layout=artValue('layout'),theme=artValue('theme')||'minimal',p=artPalettes[theme]||artPalettes.minimal;
  c.width=1600;c.height=shape==='landscape'?1000:shape==='square'?1600:2000;
  const w=c.width,h=c.height,pad=theme==='galleryeditorial'?132:theme==='filmnote'?116:108,inner=w-2*pad;
  ({minimal:drawMinimal,filmnote:drawFilmNote,theater:drawTheater,galleryeditorial:drawGalleryEditorial}[theme]||drawMinimal)(ctx,w,h,p);
  ctx.textBaseline='top';ctx.fillStyle=p.fg;
  const title=artValue('title').trim()||'MY TOP OF 2026';
  ctx.textAlign='center';
  const titleY=shape==='landscape'?96:shape==='square'?128:148;
  const headline=shape==='landscape'?78:shape==='square'?112:theme==='galleryeditorial'?112:136;
  const titleHeight=writeLines(ctx,title,w/2,titleY,inner,2,headline,58,artSerif,400,1.1);
  ctx.textAlign='left';
  const note=artValue('sub').trim();let cursor=Math.max(shape==='landscape'?242:shape==='square'?328:390,titleY+titleHeight+38);
  if(note){ctx.fillStyle=p.muted;ctx.textAlign='center';writeLines(ctx,note,w/2,cursor,inner*.88,2,27,22,artSans,400);ctx.textAlign='left';cursor+=58;ctx.fillStyle=p.fg}
  rule(ctx,pad,cursor,inner,p.line,.68);cursor+=shape==='landscape'?20:28;
  const items=(movies||[]).slice(0,10),bottom=h-150,available=bottom-cursor;
  // Landscape needs two columns for legible names; ranking otherwise reads down the page.
  const sparse=items.length>0&&items.length<=3;
  const columns=sparse?1:shape==='landscape'||(shape==='square'&&layout!=='ranking')?2:1;
  const rows=columns===2?5:10,gap=columns===2?62:0,cellW=(inner-gap*(columns-1))/columns;
  const cellH=sparse?Math.min(shape==='landscape'?160:260,available/(items.length+1)):available/rows;
  const firstRowY=sparse?cursor+available*(items.length===1?.3:.12):cursor;
  if(!items.length){ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.font=`400 29px ${artSans}`;ctx.fillText('映画を追加すると、ここに表示されます',w/2,cursor+available*.42);ctx.textAlign='left';ctx.fillStyle=p.fg}
  items.forEach((m,i)=>{
    const col=columns===1?0:Math.floor(i/rows),row=columns===1?i:i%rows;
    const x=pad+col*(cellW+gap),y=firstRowY+row*cellH,numberX=x+51;
    rule(ctx,x,y,cellW,p.line,theme==='galleryeditorial'?.47:.34);
    if(i<3)drawMedal(ctx,numberX,y+cellH*.5,i+1,theme);
    else{ctx.save();ctx.font=`400 47px ${artSerif}`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.fillText(String(i+1),numberX,y+Math.max(16,cellH*.25));ctx.restore()}
    let tx=x+122,tw=cellW-130,top=y+(sparse?cellH*.25:Math.max(12,Math.min(26,cellH*.16)));
    ctx.fillStyle=p.fg;
    const nameSize=sparse?Math.min(62,cellH*.3):Math.min(columns===2?31:38,Math.max(25,cellH*.24));
    const nameHeight=writeLines(ctx,m.title,tx,top,tw,cellH<115?1:2,nameSize,22,artSerif,500,1.15);
    const meta=[m.year,m.director].filter(Boolean).join('   ·   ');
    if(meta){ctx.fillStyle=p.muted;writeLines(ctx,meta,tx,top+nameHeight+6,tw,1,24,19,artSans,400);ctx.fillStyle=p.fg}
    if(m.movieComment&&cellH>150){ctx.fillStyle=p.muted;writeLines(ctx,m.movieComment,tx,top+nameHeight+34,tw,1,18,16,artSans,400);ctx.fillStyle=p.fg}
  });
  rule(ctx,pad,h-112,inner,p.line,.58);drawBrand(ctx,w,h,theme);
  c.setAttribute('aria-label',title+'。'+items.map((m,i)=>(i+1)+'位 '+m.title+(m.director?' 監督 '+m.director:'')).join('、'));
  artworkFile=null;document.getElementById('share').disabled=true;
  const revision=++artworkRevision;
  c.toBlob(blob=>{if(!blob||revision!==artworkRevision)return;artworkFile=new File([blob],'my-cinemap.png',{type:'image/png'});document.getElementById('share').disabled=false},'image/png');
}
function downloadArtwork(file){if(artworkURL)URL.revokeObjectURL(artworkURL);artworkURL=URL.createObjectURL(file);const a=document.createElement('a');a.href=artworkURL;a.download='my-cinemap.png';document.body.append(a);a.click();a.remove()}
async function saveArtwork(){const msg=document.getElementById('msg');try{const file=artworkFile||await new Promise((resolve,reject)=>document.getElementById('artCanvas').toBlob(b=>b?resolve(new File([b],'my-cinemap.png',{type:'image/png'})):reject(new Error('encode')),'image/png'));downloadArtwork(file);msg.textContent='PNGをダウンロードしました。iPhoneでは「写真に保存」から画像を長押ししてください。'}catch{msg.textContent='画像を保存できませんでした。もう一度お試しください。'}}
function openImageForSaving(){
  const dialog=document.getElementById('saveImageDialog');
  const image=document.getElementById('saveImagePreview');
  image.src=document.getElementById('artCanvas').toDataURL('image/png');
  if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
}
async function shareArtwork(){const msg=document.getElementById('msg'),file=artworkFile;if(!file){msg.textContent='画像を準備中です。少し待ってからお試しください。';return}try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:artValue('title')});msg.textContent='共有しました。'}else{downloadArtwork(file);msg.textContent='画像の共有に対応していないため、PNGを保存しました。'}}catch(e){if(e.name!=='AbortError')msg.textContent='共有できませんでした。「PNGを保存」をお試しください。'}}
window.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('script');s.src='js/my-cinemap-tools.js?v=20260927-my-cinemap-final-v7';s.defer=true;document.body.appendChild(s)});
window.addEventListener('pagehide',()=>{if(artworkURL)URL.revokeObjectURL(artworkURL)});
