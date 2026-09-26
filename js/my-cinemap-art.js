/* My Cinemap: editorial ranking export rendered locally without poster/still artwork. */
const artPalettes = {
  minimal: {bg:'#f8f4eb', fg:'#29231d', muted:'#70675e', line:'#bdb3a3', accent:'#9c7b42'},
  filmnote: {bg:'#ede6d8', fg:'#28231e', muted:'#736a60', line:'#aa9a85', accent:'#98764c'},
  theater: {bg:'#0e1727', fg:'#f1eee6', muted:'#bbb8b0', line:'#7f8290', accent:'#c6a668'},
  galleryeditorial: {bg:'#eae3d6', fg:'#2c2924', muted:'#746d63', line:'#afa597', accent:'#9b7c50'}
};
let artworkFile=null, artworkRevision=0, artworkURL=null;
const artValue=id=>document.getElementById(id)?.value||'';
const artSerif='"Bodoni 72",Didot,"Iowan Old Style",Baskerville,Georgia,"Times New Roman",serif';
const artSans='"Hiragino Sans","Yu Gothic",Meiryo,sans-serif';

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
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`500 44px ${artSerif}`;ctx.fillText(String(rank),0,1);
  ctx.lineWidth=1.2;
  for(const side of [-1,1])for(let i=0;i<5;i++){
    const yy=-27+i*13,xx=side*(43+Math.abs(i-2)*2);
    ctx.beginPath();ctx.ellipse(xx,yy,5.5,2.1,side*.5,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
function drawMinimal(ctx,w,h,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
  const wash=ctx.createLinearGradient(0,0,0,h);wash.addColorStop(0,'rgba(255,255,255,.34)');wash.addColorStop(1,'rgba(211,194,163,.08)');ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
  rule(ctx,150,74,w-300,p.line,.62);
  ctx.fillStyle=p.accent;ctx.save();ctx.translate(w/2,74);ctx.rotate(Math.PI/4);ctx.fillRect(-4,-4,8,8);ctx.restore();
}
function drawFilmNote(ctx,w,h,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
  const paper=ctx.createLinearGradient(0,0,w,h);paper.addColorStop(0,'rgba(255,253,245,.44)');paper.addColorStop(.52,'rgba(255,255,255,.06)');paper.addColorStop(1,'rgba(132,105,72,.08)');ctx.fillStyle=paper;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#a98e6d';ctx.fillRect(24,24,50,h-48);ctx.fillRect(w-74,24,50,h-48);
  ctx.fillStyle='#f6efe2';for(let y=40;y<h-45;y+=56){ctx.fillRect(39,y,20,22);ctx.fillRect(w-59,y,20,22)}
  ctx.fillStyle='rgba(255,250,240,.20)';ctx.fillRect(82,34,w-164,h-68);
  rule(ctx,122,84,w-244,p.line,.5);
  ctx.fillStyle=p.accent;ctx.save();ctx.translate(w/2,84);ctx.rotate(Math.PI/4);ctx.fillRect(-4,-4,8,8);ctx.restore();
}
function drawTheater(ctx,w,h,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
  const glow=ctx.createRadialGradient(w/2,0,8,w/2,0,h*.86);glow.addColorStop(0,'rgba(234,214,174,.30)');glow.addColorStop(.34,'rgba(145,130,103,.10)');glow.addColorStop(1,'rgba(12,20,35,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  const curtain=ctx.createLinearGradient(0,0,80,0);curtain.addColorStop(0,'rgba(74,26,37,.68)');curtain.addColorStop(1,'rgba(74,26,37,0)');ctx.fillStyle=curtain;ctx.fillRect(0,0,88,h);
  const curtainR=ctx.createLinearGradient(w,0,w-80,0);curtainR.addColorStop(0,'rgba(74,26,37,.68)');curtainR.addColorStop(1,'rgba(74,26,37,0)');ctx.fillStyle=curtainR;ctx.fillRect(w-88,0,88,h);
  rule(ctx,134,74,w-268,'#b5a17d',.58);
  ctx.fillStyle=p.accent;ctx.save();ctx.translate(w/2,74);ctx.rotate(Math.PI/4);ctx.fillRect(-4,-4,8,8);ctx.restore();
}
function drawGalleryEditorial(ctx,w,h,p){
  ctx.fillStyle='#e8dfd1';ctx.fillRect(0,0,w,h);
  const light=ctx.createRadialGradient(w/2,30,20,w/2,h*.28,w*.72);light.addColorStop(0,'rgba(255,252,244,.92)');light.addColorStop(1,'rgba(255,252,244,0)');ctx.fillStyle=light;ctx.fillRect(0,0,w,h);
  const x=166,y=92,fw=w-332,fh=h-240;
  ctx.fillStyle='rgba(70,58,42,.13)';ctx.fillRect(x+18,y+24,fw,fh);
  ctx.fillStyle='#9f8968';ctx.fillRect(x-10,y-10,fw+20,fh+20);
  ctx.fillStyle='#d8c6a5';ctx.fillRect(x-4,y-4,fw+8,fh+8);
  ctx.fillStyle='#faf7f0';ctx.fillRect(x,y,fw,fh);
  ctx.strokeStyle='#c8bca8';ctx.lineWidth=2;ctx.strokeRect(x+18,y+18,fw-36,fh-36);
  ctx.fillStyle='#c8b99f';ctx.fillRect(w/2-22,52,44,8);
}
function drawBrand(ctx,w,h,theme){
  const dark=theme==='theater';
  const fg=dark?'#fbf6ed':'#29231d';
  const outline=dark?'rgba(235,227,214,.94)':'rgba(91,78,61,.82)';
  const tagline=dark?'#cbbca6':'#8b7963';
  const tile=42,wordW=190,total=tile+16+wordW,x=(w-total)/2,y=theme==='galleryeditorial'?h-190:h-92;
  ctx.save();
  ctx.strokeStyle=outline;ctx.lineWidth=1.6;ctx.strokeRect(x,y,tile,tile);
  const beam=ctx.createLinearGradient(x+19,y,x+tile+9,y);beam.addColorStop(0,dark?'rgba(255,238,204,.78)':'rgba(173,132,72,.58)');beam.addColorStop(1,'rgba(222,187,131,0)');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x+19,y+16);ctx.lineTo(x+tile+9,y+7);ctx.lineTo(x+tile+9,y+35);ctx.lineTo(x+19,y+26);ctx.closePath();ctx.fill();
  ctx.fillStyle=fg;ctx.textAlign='left';ctx.textBaseline='top';ctx.font=`500 34px ${artSerif}`;ctx.fillText('C',x+7,y+2);
  ctx.font=`500 31px ${artSerif}`;ctx.fillText('Cinemap',x+tile+16,y-1);
  ctx.fillStyle=tagline;ctx.font=`600 8px ${artSans}`;ctx.fillText('EXPLORE CINEMA',x+tile+17,y+32);
  ctx.restore();
}
function drawArtwork(movies){
  const c=document.getElementById('artCanvas'),ctx=c.getContext('2d');
  const shape=artValue('format')||'portrait',layout=artValue('layout')||'single',theme=artValue('theme')||'minimal',p=artPalettes[theme]||artPalettes.minimal;
  c.width=1600;c.height=shape==='landscape'?1000:shape==='square'?1600:2000;
  const w=c.width,h=c.height,pad=theme==='galleryeditorial'?246:theme==='filmnote'?122:116,inner=w-2*pad;
  ({minimal:drawMinimal,filmnote:drawFilmNote,theater:drawTheater,galleryeditorial:drawGalleryEditorial}[theme]||drawMinimal)(ctx,w,h,p);
  ctx.textBaseline='top';ctx.fillStyle=p.fg;
  const title=artValue('title').trim()||'MY TOP 10';
  ctx.textAlign='center';
  const titleY=shape==='landscape'?92:shape==='square'?124:theme==='galleryeditorial'?160:142;
  const headline=shape==='landscape'?76:shape==='square'?108:theme==='galleryeditorial'?108:128;
  const titleHeight=writeLines(ctx,title,w/2,titleY,inner,2,headline,58,artSerif,500,1.05);
  ctx.textAlign='left';
  const note=artValue('sub').trim();let cursor=Math.max(shape==='landscape'?228:shape==='square'?312:theme==='galleryeditorial'?388:370,titleY+titleHeight+42);
  if(note){ctx.fillStyle=p.muted;ctx.textAlign='center';writeLines(ctx,note,w/2,cursor,inner*.86,2,25,20,artSans,400);ctx.textAlign='left';cursor+=58;ctx.fillStyle=p.fg}
  rule(ctx,pad,cursor,inner,p.line,.62);cursor+=shape==='landscape'?18:26;
  const items=(movies||[]).slice(0,10),bottom=h-(theme==='galleryeditorial'?244:140),available=bottom-cursor;
  const columns=layout==='double'?2:1;
  const rows=columns===2?5:10,gap=columns===2?58:0,cellW=(inner-gap*(columns-1))/columns;
  const sparse=items.length>0&&items.length<=3;
  const cellH=sparse&&columns===1?Math.min(shape==='landscape'?150:250,available/(items.length+1)):available/rows;
  const firstRowY=sparse&&columns===1?cursor+available*(items.length===1?.3:.12):cursor;
  if(!items.length){ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.font=`400 29px ${artSans}`;ctx.fillText('映画を追加すると、ここに表示されます',w/2,cursor+available*.42);ctx.textAlign='left';ctx.fillStyle=p.fg}
  items.forEach((m,i)=>{
    const col=columns===1?0:Math.floor(i/5),row=columns===1?i:i%5;
    const x=pad+col*(cellW+gap),y=firstRowY+row*cellH,numberX=x+(columns===2?44:52);
    rule(ctx,x,y,cellW,p.line,theme==='galleryeditorial'?.42:.30);
    if(i<3)drawMedal(ctx,numberX,y+cellH*.5,i+1,theme);
    else{ctx.save();ctx.font=`500 ${columns===2?40:46}px ${artSerif}`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.fillText(String(i+1),numberX,y+Math.max(14,cellH*.25));ctx.restore()}
    const offset=columns===2?100:124,tx=x+offset,tw=cellW-offset-8,top=y+(sparse&&columns===1?cellH*.25:Math.max(10,Math.min(24,cellH*.15)));
    ctx.fillStyle=p.fg;
    const nameSize=sparse&&columns===1?Math.min(60,cellH*.3):columns===2?Math.min(30,Math.max(22,cellH*.22)):Math.min(38,Math.max(25,cellH*.24));
    const nameHeight=writeLines(ctx,m.title,tx,top,tw,cellH<112?1:2,nameSize,20,artSerif,500,1.12);
    const meta=[m.year,m.director].filter(Boolean).join('   ·   ');
    if(meta){ctx.fillStyle=p.muted;writeLines(ctx,meta,tx,top+nameHeight+6,tw,1,columns===2?20:23,17,artSans,400);ctx.fillStyle=p.fg}
    if(m.movieComment&&columns===1&&cellH>150){ctx.fillStyle=p.muted;writeLines(ctx,m.movieComment,tx,top+nameHeight+34,tw,1,18,16,artSans,400);ctx.fillStyle=p.fg}
  });
  rule(ctx,pad,theme==='galleryeditorial'?h-218:h-108,inner,p.line,.52);drawBrand(ctx,w,h,theme);
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
