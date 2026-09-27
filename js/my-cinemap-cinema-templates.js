/* My Cinemap uploaded cinema templates: use the uploaded visual itself as the background. */
(() => {
  const originalDrawArtwork=drawArtwork;
  const cinemaTemplates={
    'cinema-projector':'assets/105DE5C4-9F65-41AF-A72F-0731A88CA8E6.png',
    'cinema-theater':'assets/309A0142-0B8A-4070-A341-63A2446D0CBE.png',
    'cinema-artdeco':'assets/48E0565E-2BBD-45A0-B6C9-A3A554976D0D.png',
    'cinema-archive':'assets/99AFA977-5A97-4544-A7AD-60E16A93F874.png'
  };
  const templateMode={
    'cinema-projector':'light',
    'cinema-theater':'dark',
    'cinema-artdeco':'dark',
    'cinema-archive':'dark'
  };
  const rankNumberWeight=650;
  const metaTextWeight=600;
  const noteTextWeight=600;
  const brandScale=1.4;
  const imageCache=new Map();

  function getTemplateImage(theme){
    if(imageCache.has(theme))return imageCache.get(theme);
    const img=new Image();
    img.decoding='async';
    img.src=cinemaTemplates[theme];
    img.onload=()=>{try{drawArtwork(typeof picks!=='undefined'?picks:[])}catch{}};
    imageCache.set(theme,img);
    return img;
  }

  function drawImageCover(ctx,img,w,h){
    const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);
    const sw=w/scale,sh=h/scale;
    const sx=(img.naturalWidth-sw)/2,sy=(img.naturalHeight-sh)/2;
    ctx.drawImage(img,sx,sy,sw,sh,0,0,w,h);
  }

  function paletteForTheme(theme){
    return templateMode[theme]==='light'
      ? {bg:'#efe7d9',fg:'#1d1814',muted:'#4b4036',line:'#8b7358',accent:'#8a632f',border:'#8b7358',dark:false}
      : {bg:'#0d1014',fg:'#fffdf8',muted:'#eee2cf',line:'#c5a46e',accent:'#e0b86e',border:'#c5a46e',dark:true};
  }

  function drawContentScrim(ctx,w,h,p,listTop,listBottom,columns){
    ctx.save();
    const x=columns===2?72:92;
    const top=54;
    const bottom=Math.min(h-72,listBottom+70);
    const width=w-x*2;
    const height=Math.max(120,bottom-top);
    const g=ctx.createLinearGradient(0,top,0,bottom);
    if(p.dark){
      g.addColorStop(0,'rgba(4,6,8,.66)');
      g.addColorStop(.18,'rgba(4,6,8,.56)');
      g.addColorStop(.82,'rgba(4,6,8,.56)');
      g.addColorStop(1,'rgba(4,6,8,.64)');
    }else{
      g.addColorStop(0,'rgba(249,244,234,.86)');
      g.addColorStop(.18,'rgba(249,244,234,.78)');
      g.addColorStop(.82,'rgba(249,244,234,.78)');
      g.addColorStop(1,'rgba(249,244,234,.84)');
    }
    ctx.fillStyle=g;
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(x,top,width,height,24);else ctx.rect(x,top,width,height);
    ctx.fill();
    ctx.restore();
  }

  function drawCinemaMedal(ctx,x,y,rank,p,scale=1){
    const light=['#7a5b2d','#62686d','#815743'];
    const dark=['#e2bd73','#c8ced3','#d39470'];
    const metal=(p.dark?dark:light)[rank-1];
    ctx.save();
    ctx.translate(x,y);ctx.scale(scale,scale);
    ctx.strokeStyle=metal;ctx.fillStyle=metal;ctx.lineWidth=2.1;
    for(const side of [-1,1])for(let i=0;i<6;i++){
      const a=-1.02+i*.27,rx=side*(25+Math.cos(a)*12),ry=Math.sin(a)*27;
      ctx.save();ctx.translate(rx,ry);ctx.rotate(side*(.62-a*.18));ctx.beginPath();ctx.ellipse(0,0,6,2.2,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${rankNumberWeight} 34px ${artNumber}`;ctx.fillText(String(rank),0,0);
    ctx.restore();
  }

  function drawCinemaBrand(ctx,w,h,p,y=h-110){
    const s=brandScale;
    const tile=36*s,wordSize=28*s,tagSize=7.2*s,gap=12*s,wordW=176*s;
    const total=tile+gap+wordW,x=(w-total)/2;
    const lineY=y+tile*.5,lineW=Math.max(120,(w-total)/2-150);
    rule(ctx,82,lineY,lineW,p.line,p.dark?.62:.52);
    rule(ctx,w-82-lineW,lineY,lineW,p.line,p.dark?.62:.52);
    ctx.save();
    ctx.strokeStyle=p.fg;ctx.globalAlpha=.96;ctx.lineWidth=1.7*s;ctx.strokeRect(x,y,tile,tile);
    const beam=ctx.createLinearGradient(x+tile*.46,y,x+tile+12*s,y);
    beam.addColorStop(0,p.dark?'rgba(255,231,183,.78)':'rgba(111,76,34,.54)');
    beam.addColorStop(1,'rgba(222,187,131,0)');
    ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x+tile*.46,y+tile*.38);ctx.lineTo(x+tile+12*s,y+tile*.20);ctx.lineTo(x+tile+12*s,y+tile*.82);ctx.lineTo(x+tile*.46,y+tile*.64);ctx.closePath();ctx.fill();
    ctx.globalAlpha=1;ctx.fillStyle=p.fg;ctx.textAlign='left';ctx.textBaseline='top';
    ctx.font=`600 ${wordSize}px ${artDisplay}`;ctx.fillText('C',x+7*s,y+1*s);
    ctx.font=`600 ${wordSize*.95}px ${artDisplay}`;ctx.fillText('Cinemap',x+tile+gap,y-2*s);
    ctx.fillStyle=p.dark?'#f0dfc4':'#514335';ctx.globalAlpha=.96;ctx.font=`700 ${tagSize}px ${artSans}`;ctx.fillText('EXPLORE CINEMA',x+tile+gap+1*s,y+tile*.72);
    ctx.restore();
  }

  function renderCinemaTemplate(movies,theme){
    const c=document.getElementById('artCanvas'),ctx=c.getContext('2d');
    const shape=artValue('format')||'portrait',layout=artValue('layout')||'single';
    const fontScale={small:1,medium:1.18,large:1.36}[artValue('fontSize')]||1;
    const fontKey=artValue('fontStyle')||'modern',font=artFonts[fontKey]||artFonts.modern;
    c.width=1600;c.height=shape==='landscape'?1000:shape==='square'?1600:2000;
    const w=c.width,h=c.height,columns=layout==='double'?2:1;
    const metrics=layoutMetrics(shape,columns,'noir'),pad=metrics.pad,inner=w-2*pad;
    const img=getTemplateImage(theme);
    if(img.complete&&img.naturalWidth)drawImageCover(ctx,img,w,h);else{ctx.fillStyle='#111318';ctx.fillRect(0,0,w,h)}
    const p=paletteForTheme(theme);artPalettes[theme]=p;

    const title=artValue('title').trim()||'MY TOP OF 2026';
    const titleFit=fittedLines(ctx,title,inner*.76,2,metrics.titleSize*fontScale,40*fontScale,font.title,font.titleWeight);
    const titleHeight=titleFit.lines.length*titleFit.size*1.04;
    const titleBottom=metrics.titleY+titleHeight;
    const note=artValue('sub').trim();
    let listTop=Math.max(metrics.listTop,titleBottom+(shape==='portrait'?82:68));
    let noteY=0,noteHeight=0;
    if(note){
      noteY=titleBottom+18;
      const noteFit=fittedLines(ctx,note,inner*.76,2,23*fontScale,18*fontScale,artSans,noteTextWeight);
      noteHeight=noteFit.lines.length*noteFit.size*1.28;
      listTop=Math.max(listTop,noteY+noteHeight+36);
    }
    const items=(movies||[]).slice(0,10),rows=columns===2?5:10;
    const bottomTarget=h-(shape==='portrait'?174:shape==='square'?142:122);
    const gap=columns===2?72:0,cellW=(inner-gap*(columns-1))/columns;
    const rowH=Math.max(columns===2?96:102,(bottomTarget-listTop)/rows);
    const listBottom=listTop+rows*rowH;

    drawContentScrim(ctx,w,h,p,listTop,listBottom,columns);

    ctx.save();
    ctx.shadowColor=p.dark?'rgba(0,0,0,.72)':'rgba(255,255,255,0)';
    ctx.shadowBlur=p.dark?5:0;
    ctx.textBaseline='top';ctx.fillStyle=p.fg;
    ctx.textAlign='center';
    writeLines(ctx,title,w/2,metrics.titleY,inner*.76,2,metrics.titleSize*fontScale,40*fontScale,font.title,font.titleWeight,1.04);
    if(note){
      ctx.fillStyle=p.muted;ctx.globalAlpha=.96;
      writeLines(ctx,note,w/2,noteY,inner*.76,2,23*fontScale,18*fontScale,artSans,noteTextWeight);
      ctx.globalAlpha=1;ctx.fillStyle=p.fg;
    }
    ctx.textAlign='left';
    if(!items.length){ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.font=`600 ${29*fontScale}px ${artSans}`;ctx.fillText('映画を追加すると、ここに表示されます',w/2,listTop+rowH*3.5);ctx.textAlign='left';ctx.fillStyle=p.fg}
    items.forEach((m,i)=>{
      const col=columns===1?0:Math.floor(i/5),row=columns===1?i:i%5;
      const x=pad+col*(cellW+gap),y=listTop+row*rowH,numberX=x+(columns===2?42:48);
      rule(ctx,x,y,cellW,p.line,p.dark?.68:.54);
      if(i<3)drawCinemaMedal(ctx,numberX,y+rowH*.5,i+1,p,.92*fontScale);
      else{
        ctx.save();ctx.font=`${rankNumberWeight} ${(columns===2?33:35)*fontScale}px ${artNumber}`;ctx.fillStyle=p.muted;ctx.globalAlpha=.96;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),numberX,y+rowH*.5);ctx.restore();
      }
      const offset=columns===2?92:112,tx=x+offset,tw=cellW-offset-8,top=y+Math.max(10,(rowH-76)/2);
      ctx.fillStyle=p.fg;
      const nameSize=(columns===2?(shape==='portrait'?doublePortraitMovieSize:doubleCompactMovieSize):(shape==='portrait'?singleMovieSize:shape==='square'?34:28))*fontScale;
      const nameHeight=writeLines(ctx,m.title,tx,top,tw,2,nameSize,(columns===2?21:24)*fontScale,font.movie,font.movieWeight,1.10);
      const meta=[m.year,m.director].filter(Boolean).join('   ·   ');
      if(meta){
        ctx.save();ctx.fillStyle=p.muted;ctx.globalAlpha=.96;
        writeLines(ctx,meta,tx,top+nameHeight+9,tw,1,(columns===2?22:24)*fontScale,18*fontScale,artSans,metaTextWeight);
        ctx.restore();ctx.fillStyle=p.fg;
      }
    });
    rule(ctx,pad,listBottom,inner,p.line,p.dark?.68:.54);
    drawCinemaBrand(ctx,w,h,p,Math.min(h-118,listBottom+42));
    ctx.restore();

    c.setAttribute('aria-label',title+'。'+items.map((m,i)=>(i+1)+'位 '+m.title+(m.director?' 監督 '+m.director:'')).join('、'));
    artworkFile=null;document.getElementById('share').disabled=true;
    const revision=++artworkRevision;
    c.toBlob(blob=>{if(!blob||revision!==artworkRevision)return;artworkFile=new File([blob],'my-cinemap.png',{type:'image/png'});document.getElementById('share').disabled=false},'image/png');
  }

  drawArtwork=function(movies){
    const theme=artValue('theme')||'minimal';
    if(!theme.startsWith('cinema-'))return originalDrawArtwork(movies);
    renderCinemaTemplate(movies,theme);
  };

  window.CinemapCinemaTemplates={cinemaTemplates,drawImageCover,drawContentScrim,drawCinemaMedal,drawCinemaBrand};
})();
