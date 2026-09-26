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
  ctx.lineWidth=rank===1?2:1.5;ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.stroke();
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`400 31px ${artSerif}`;ctx.fillText(String(rank),0,1);
  // A short pair of leaves, kept inside the number column.
  ctx.lineWidth=1.1;
  for(const side of [-1,1])for(let i=0;i<3;i++){
    const a=side*(35+i*2),b=-11+i*11;
    ctx.beginPath();ctx.ellipse(a,b,4,1.8,side*.55,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
function drawMinimal(ctx,w,h,p){ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);rule(ctx,92,76,w-184,p.line,.65)}
function drawFilmNote(ctx,w,h,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
  // Quiet printed-paper rhythm, without film perforations or heavy grain.
  ctx.fillStyle='#ffffff';ctx.globalAlpha=.13;ctx.fillRect(46,46,w-92,h-92);ctx.globalAlpha=1;
  rule(ctx,94,88,w-188,p.line,.65);rule(ctx,94,h-93,w-188,p.line,.4);
}
function drawTheater(ctx,w,h,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
  const glow=ctx.createRadialGradient(w/2,0,0,w/2,0,h*.85);
  glow.addColorStop(0,'rgba(147,151,173,.14)');glow.addColorStop(1,'rgba(12,20,35,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  rule(ctx,92,76,w-184,'#b5a17d',.48);
}
function drawGalleryEditorial(ctx,w,h,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
  // The title and list occupy a single framed exhibition panel on a quiet wall.
  const x=50,y=50,fw=w-100,fh=h-100;
  ctx.fillStyle='#d8d0c3';ctx.fillRect(x+12,y+15,fw,fh);
  ctx.fillStyle='#f8f5ee';ctx.fillRect(x,y,fw,fh);
  ctx.strokeStyle='#9c9181';ctx.lineWidth=2;ctx.strokeRect(x,y,fw,fh);
  ctx.strokeStyle='#ded6c9';ctx.lineWidth=4;ctx.strokeRect(x+12,y+12,fw-24,fh-24);
  const light=ctx.createLinearGradient(0,0,w*.75,h*.6);
  light.addColorStop(0,'rgba(255,255,255,.35)');light.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=light;ctx.fillRect(x+18,y+18,fw-36,fh-36);
}
function drawBrand(ctx,w,h,theme){
  if(!cinemapLogo.complete||!cinemapLogo.naturalWidth)return;
  const scale=Math.min(174/cinemapLogo.naturalWidth,58/cinemapLogo.naturalHeight);
  const dw=cinemapLogo.naturalWidth*scale,dh=cinemapLogo.naturalHeight*scale;
  ctx.save();ctx.globalAlpha=.82;ctx.drawImage(cinemapLogo,w-96-dw,h-85, dw,dh);ctx.restore();
}
function drawArtwork(movies){
  const c=document.getElementById('artCanvas'),ctx=c.getContext('2d');
  const shape=artValue('format'),layout=artValue('layout'),theme=artValue('theme')||'minimal',p=artPalettes[theme]||artPalettes.minimal;
  c.width=1600;c.height=shape==='landscape'?1000:shape==='square'?1600:2000;
  const w=c.width,h=c.height,pad=theme==='galleryeditorial'?116:96,inner=w-2*pad;
  ({minimal:drawMinimal,filmnote:drawFilmNote,theater:drawTheater,galleryeditorial:drawGalleryEditorial}[theme]||drawMinimal)(ctx,w,h,p);
  ctx.textBaseline='top';ctx.fillStyle=p.fg;
  const title=artValue('title').trim()||'MY TOP OF 2026';
  ctx.textAlign='center';
  writeLines(ctx,title,w/2,pad+12,inner,2,shape==='landscape'?65:76,44,artSerif,400,1.12);
  ctx.textAlign='left';
  const note=artValue('sub').trim();let cursor=pad+(shape==='landscape'?116:142);
  if(note){ctx.fillStyle=p.muted;ctx.textAlign='center';writeLines(ctx,note,w/2,cursor,inner*.88,2,26,22,artSans,400);ctx.textAlign='left';cursor+=72;ctx.fillStyle=p.fg}
  rule(ctx,pad,cursor,inner,p.line,.68);cursor+=shape==='landscape'?27:46;
  const items=(movies||[]).slice(0,10),bottom=h-150,available=bottom-cursor;
  // Landscape needs two columns for legible names; ranking otherwise reads down the page.
  const columns=shape==='landscape'||(shape==='square'&&layout!=='ranking')?2:1;
  const rows=Math.max(1,Math.ceil(items.length/columns)),gap=columns===2?76:0,cellW=(inner-gap*(columns-1))/columns,cellH=available/rows;
  if(!items.length){ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.font=`400 29px ${artSans}`;ctx.fillText('映画を追加すると、ここに表示されます',w/2,cursor+available*.42);ctx.textAlign='left';ctx.fillStyle=p.fg}
  items.forEach((m,i)=>{
    const col=columns===1?0:Math.floor(i/rows),row=columns===1?i:i%rows;
    const x=pad+col*(cellW+gap),y=cursor+row*cellH,numberX=x+43;
    rule(ctx,x,y,cellW,p.line,theme==='galleryeditorial'?.47:.34);
    if(i<3)drawMedal(ctx,numberX,y+Math.min(48,cellH*.48),i+1,theme);
    else{ctx.save();ctx.font=`400 35px ${artSerif}`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.fillText(String(i+1),numberX,y+20);ctx.restore()}
    let tx=x+96,tw=cellW-104,top=y+Math.max(12,Math.min(30,cellH*.15));
    ctx.fillStyle=p.fg;
    const nameSize=Math.min(columns===2?31:38,Math.max(25,cellH*.24));
    const nameHeight=writeLines(ctx,m.title,tx,top,tw,cellH<115?1:2,nameSize,22,artSerif,500,1.15);
    const meta=[m.year,m.director].filter(Boolean).join('   ·   ');
    if(meta){ctx.fillStyle=p.muted;writeLines(ctx,meta,tx,top+nameHeight+6,tw,1,20,17,artSans,400);ctx.fillStyle=p.fg}
    if(m.movieComment&&cellH>150){ctx.fillStyle=p.muted;writeLines(ctx,m.movieComment,tx,top+nameHeight+34,tw,1,18,16,artSans,400);ctx.fillStyle=p.fg}
  });
  rule(ctx,pad,h-112,inner,p.line,.58);drawBrand(ctx,w,h,theme);
  c.setAttribute('aria-label',title+'。'+items.map((m,i)=>(i+1)+'位 '+m.title+(m.director?' 監督 '+m.director:'')).join('、'));
  artworkFile=null;document.getElementById('share').disabled=true;
  const revision=++artworkRevision;
  c.toBlob(blob=>{if(!blob||revision!==artworkRevision)return;artworkFile=new File([blob],'my-cinemap.png',{type:'image/png'});document.getElementById('share').disabled=false},'image/png');
}
function downloadArtwork(file){if(artworkURL)URL.revokeObjectURL(artworkURL);artworkURL=URL.createObjectURL(file);const a=document.createElement('a');a.href=artworkURL;a.download='my-cinemap.png';document.body.append(a);a.click();a.remove()}
async function saveArtwork(){const msg=document.getElementById('msg');try{const file=artworkFile||await new Promise((resolve,reject)=>document.getElementById('artCanvas').toBlob(b=>b?resolve(new File([b],'my-cinemap.png',{type:'image/png'})):reject(new Error('encode')),'image/png'));downloadArtwork(file);msg.textContent='PNGを保存しました。iPhoneの写真に保存するには「画像を共有」を選んでください。'}catch{msg.textContent='画像を保存できませんでした。もう一度お試しください。'}}
async function shareArtwork(){const msg=document.getElementById('msg'),file=artworkFile;if(!file){msg.textContent='画像を準備中です。少し待ってからお試しください。';return}try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:artValue('title')});msg.textContent='共有しました。'}else{downloadArtwork(file);msg.textContent='画像の共有に対応していないため、PNGを保存しました。'}}catch(e){if(e.name!=='AbortError')msg.textContent='共有できませんでした。「PNGを保存」をお試しください。'}}
window.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('script');s.src='js/my-cinemap-tools.js?v=20260927-my-cinemap-final-v4';s.defer=true;document.body.appendChild(s)});
window.addEventListener('pagehide',()=>{if(artworkURL)URL.revokeObjectURL(artworkURL)});
