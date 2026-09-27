/* My Cinemap uploaded cinema templates: use the uploaded visual itself as the background. */
(() => {
  const originalDrawArtwork=drawArtwork;
  const cinemaTemplates={
    'cinema-projector':'assets/105DE5C4-9F65-41AF-A72F-0731A88CA8E6.png',
    'cinema-theater':'assets/309A0142-0B8A-4070-A341-63A2446D0CBE.png',
    'cinema-artdeco':'assets/48E0565E-2BBD-45A0-B6C9-A3A554976D0D.png',
    'cinema-archive':'assets/99AFA977-5A97-4544-A7AD-60E16A93F874.png',
    'cinema-screening':'assets/AB933939-93EB-43D6-814A-C60BE58B42F6.png'
  };
  const templateMode={
    'cinema-projector':'light',
    'cinema-theater':'dark',
    'cinema-artdeco':'dark',
    'cinema-archive':'dark',
    'cinema-screening':'dark'
  };
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
      ? {bg:'#efe7d9',fg:'#241e18',muted:'#66594d',line:'#9d8669',accent:'#9d7542',border:'#9d8669',dark:false}
      : {bg:'#0d1014',fg:'#fffaf1',muted:'#d4c8b6',line:'#b49360',accent:'#d4ad6c',border:'#b99862',dark:true};
  }

  function drawContentScrim(ctx,w,h,p,listTop,listBottom,columns){
    ctx.save();
    const x=columns===2?72:92;
    const top=54;
    const bottom=Math.min(h-72,listBottom+58);
    const width=w-x*2;
    const height=Math.max(120,bottom-top);
    const g=ctx.createLinearGradient(0,top,0,bottom);
    if(p.dark){
      g.addColorStop(0,'rgba(4,6,8,.58)');
      g.addColorStop(.18,'rgba(4,6,8,.46)');
      g.addColorStop(.82,'rgba(4,6,8,.46)');
      g.addColorStop(1,'rgba(4,6,8,.56)');
    }else{
      g.addColorStop(0,'rgba(249,244,234,.76)');
      g.addColorStop(.18,'rgba(249,244,234,.66)');
      g.addColorStop(.82,'rgba(249,244,234,.66)');
      g.addColorStop(1,'rgba(249,244,234,.74)');
    }
    ctx.fillStyle=g;
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(x,top,width,height,24);else ctx.rect(x,top,width,height);
    ctx.fill();
    ctx.restore();
  }

  function renderCinemaTemplate(movies,theme){
    const c=document.getElementById('artCanvas'),ctx=c.getContext('2d');
    const shape=artValue('format')||'portrait',layout=artValue('layout')||'single';
    const fontKey=artValue('fontStyle')||'editorial',font=artFonts[fontKey]||artFonts.editorial;
    c.width=1600;c.height=shape==='landscape'?1000:shape==='square'?1600:2000;
    const w=c.width,h=c.height,columns=layout==='double'?2:1;
    const metrics=layoutMetrics(shape,columns,'noir'),pad=metrics.pad,inner=w-2*pad;
    const img=getTemplateImage(theme);
    if(img.complete&&img.naturalWidth)drawImageCover(ctx,img,w,h);else{ctx.fillStyle='#111318';ctx.fillRect(0,0,w,h)}
    const p=paletteForTheme(theme);artPalettes[theme]=p;

    const title=artValue('title').trim()||'MY TOP OF 2026';
    const titleFit=fittedLines(ctx,title,inner*.76,2,metrics.titleSize,40,font.title,font.titleWeight);
    const titleHeight=titleFit.lines.length*titleFit.size*1.04;
    const titleBottom=metrics.titleY+titleHeight;
    const note=artValue('sub').trim();
    let listTop=Math.max(metrics.listTop,titleBottom+(shape==='portrait'?82:68));
    let noteY=0,noteHeight=0;
    if(note){
      noteY=titleBottom+18;
      const noteFit=fittedLines(ctx,note,inner*.76,2,21,17,artSans,400);
      noteHeight=noteFit.lines.length*noteFit.size*1.28;
      listTop=Math.max(listTop,noteY+noteHeight+36);
    }
    const items=(movies||[]).slice(0,10),rows=columns===2?5:10;
    const bottomTarget=h-(shape==='portrait'?158:shape==='square'?130:110);
    const gap=columns===2?72:0,cellW=(inner-gap*(columns-1))/columns;
    const rowH=Math.max(columns===2?96:102,(bottomTarget-listTop)/rows);
    const listBottom=listTop+rows*rowH;

    drawContentScrim(ctx,w,h,p,listTop,listBottom,columns);

    ctx.save();
    ctx.shadowColor=p.dark?'rgba(0,0,0,.78)':'rgba(255,255,255,.72)';
    ctx.shadowBlur=p.dark?6:4;
    ctx.textBaseline='top';ctx.fillStyle=p.fg;
    ctx.textAlign='center';
    writeLines(ctx,title,w/2,metrics.titleY,inner*.76,2,metrics.titleSize,40,font.title,font.titleWeight,1.04);
    if(note){
      ctx.fillStyle=p.muted;
      writeLines(ctx,note,w/2,noteY,inner*.76,2,21,17,artSans,400);
      ctx.fillStyle=p.fg;
    }
    ctx.textAlign='left';
    if(!items.length){ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.font=`400 29px ${artSans}`;ctx.fillText('映画を追加すると、ここに表示されます',w/2,listTop+rowH*3.5);ctx.textAlign='left';ctx.fillStyle=p.fg}
    items.forEach((m,i)=>{
      const col=columns===1?0:Math.floor(i/5),row=columns===1?i:i%5;
      const x=pad+col*(cellW+gap),y=listTop+row*rowH,numberX=x+(columns===2?42:48);
      rule(ctx,x,y,cellW,p.line,p.dark?.52:.42);
      if(i<3)drawMedal(ctx,numberX,y+rowH*.5,i+1,theme,.9);
      else{ctx.save();ctx.font=`400 ${columns===2?30:32}px ${artNumber}`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),numberX,y+rowH*.5);ctx.restore()}
      const offset=columns===2?92:112,tx=x+offset,tw=cellW-offset-8,top=y+Math.max(10,(rowH-76)/2);
      ctx.fillStyle=p.fg;
      const nameSize=columns===2?(shape==='portrait'?doublePortraitMovieSize:doubleCompactMovieSize):(shape==='portrait'?singleMovieSize:shape==='square'?34:28);
      const nameHeight=writeLines(ctx,m.title,tx,top,tw,2,nameSize,columns===2?21:24,font.movie,font.movieWeight,1.10);
      const meta=[m.year,m.director].filter(Boolean).join('   ·   ');
      if(meta){ctx.save();ctx.fillStyle=p.muted;writeLines(ctx,meta,tx,top+nameHeight+9,tw,1,columns===2?doubleMetaSize:singleMetaSize,16,artSans,400);ctx.restore();ctx.fillStyle=p.fg}
    });
    rule(ctx,pad,listBottom,inner,p.line,p.dark?.52:.42);
    drawBrand(ctx,w,h,theme,Math.min(h-92,listBottom+38));
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

  window.CinemapCinemaTemplates={cinemaTemplates,drawImageCover,drawContentScrim};
})();
