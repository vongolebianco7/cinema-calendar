/* My Cinelva uploaded cinema templates: use the uploaded visual itself as the background. */
(() => {
  const originalDrawArtwork=drawArtwork;
  const originalDrawBrand=drawBrand;
  const cinemaTemplates={
    'cinema-projector':'assets/105DE5C4-9F65-41AF-A72F-0731A88CA8E6.png',
    'cinema-theater':'assets/309A0142-0B8A-4070-A341-63A2446D0CBE.png',
    'cinema-archive':'assets/99AFA977-5A97-4544-A7AD-60E16A93F874.png'
  };
  const templateMode={
    'cinema-projector':'light',
    'cinema-theater':'dark',
    'cinema-archive':'dark'
  };
  const rankNumberWeight=650;
  const metaTextWeight=600;
  const noteTextWeight=600;
  const brandScale=1.4;
  const imageCache=new Map();
  let blobTimer=0;

  function getTemplateImage(theme){
    return artworkImage(cinemaTemplates[theme]);
  }

  function drawImageCover(ctx,img,w,h){
    const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);
    const sw=w/scale,sh=h/scale;
    const sx=(img.naturalWidth-sw)/2,sy=(img.naturalHeight-sh)/2;
    ctx.drawImage(img,sx,sy,sw,sh,0,0,w,h);
  }

  function brandFooterTop(shape,h,brandHeight=34){
    const bottomGap=shape==='portrait'?26:shape==='square'?24:20;
    return h-bottomGap-brandHeight;
  }

  function drawBrandSafeZone(ctx,w,h,p,y,brandHeight=34){
    const top=Math.max(0,y-26),bottom=Math.min(h,y+brandHeight+14);
    const g=ctx.createLinearGradient(0,top,0,bottom);
    if(p.dark){
      g.addColorStop(0,'rgba(4,6,8,0)');g.addColorStop(.32,'rgba(4,6,8,.72)');g.addColorStop(1,'rgba(4,6,8,.90)');
    }else{
      g.addColorStop(0,'rgba(249,244,234,0)');g.addColorStop(.32,'rgba(249,244,234,.78)');g.addColorStop(1,'rgba(249,244,234,.94)');
    }
    ctx.save();ctx.fillStyle=g;ctx.fillRect(70,top,w-140,bottom-top);ctx.restore();
  }

  drawBrand=function(ctx,w,h,theme,y){
    const p=artPalettes[theme]||artPalettes.minimal;
    const shape=artValue('format')||'portrait';
    const brandHeight=50;
    const safeY=brandFooterTop(shape,h,brandHeight);
    drawBrandSafeZone(ctx,w,h,p,safeY,brandHeight);
    return originalDrawBrand(ctx,w,h,theme,safeY);
  };

  function paletteForTheme(theme){
    return templateMode[theme]==='light'
      ? {bg:'#efe7d9',fg:'#1d1814',muted:'#4b4036',line:'#8b7358',accent:'#8a632f',border:'#8b7358',dark:false}
      : {bg:'#0d1014',fg:'#fffdf8',muted:'#eee2cf',line:'#c5a46e',accent:'#e0b86e',border:'#c5a46e',dark:true};
  }

  function drawContentScrim(ctx,w,h,p,listTop,listBottom,columns){
    ctx.save();
    const x=columns===2?72:92,top=54,bottom=Math.min(h-72,listBottom+70),width=w-x*2,height=Math.max(120,bottom-top);
    const g=ctx.createLinearGradient(0,top,0,bottom);
    if(p.dark){
      g.addColorStop(0,'rgba(4,6,8,.66)');g.addColorStop(.18,'rgba(4,6,8,.56)');g.addColorStop(.82,'rgba(4,6,8,.56)');g.addColorStop(1,'rgba(4,6,8,.64)');
    }else{
      g.addColorStop(0,'rgba(249,244,234,.86)');g.addColorStop(.18,'rgba(249,244,234,.78)');g.addColorStop(.82,'rgba(249,244,234,.78)');g.addColorStop(1,'rgba(249,244,234,.84)');
    }
    ctx.fillStyle=g;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,top,width,height,24);else ctx.rect(x,top,width,height);ctx.fill();ctx.restore();
  }

  function drawCinemaMedal(ctx,x,y,rank,p,scale=1){
    const light=['#7a5b2d','#62686d','#815743'],dark=['#e2bd73','#c8ced3','#d39470'],metal=(p.dark?dark:light)[rank-1];
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle=metal;ctx.fillStyle=metal;ctx.lineWidth=2.1;
    for(const side of [-1,1])for(let i=0;i<6;i++){
      const a=-1.02+i*.27,rx=side*(25+Math.cos(a)*12),ry=Math.sin(a)*27;
      ctx.save();ctx.translate(rx,ry);ctx.rotate(side*(.62-a*.18));ctx.beginPath();ctx.ellipse(0,0,6,2.2,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${rankNumberWeight} 34px ${artNumber}`;ctx.fillText(String(rank),0,0);ctx.restore();
  }

  function drawCinemaBrand(ctx,w,h,p,y=h-110){
    return originalDrawBrand(ctx,w,h,artValue('theme'),y);
  }

  function scheduleArtworkBlob(c){
    artworkFile=null;document.getElementById('share').disabled=true;
    const revision=++artworkRevision;
    clearTimeout(blobTimer);
    blobTimer=setTimeout(()=>{
      c.toBlob(blob=>{if(!blob||revision!==artworkRevision||!artworkReady())return;artworkFile=new File([blob],'my-cinelva.png',{type:'image/png'});document.getElementById('share').disabled=false},'image/png');
    },220);
  }

  function renderCinemaTemplate(movies,theme){
    const c=document.getElementById('artCanvas'),ctx=c.getContext('2d');
    const shape=artValue('format')||'portrait',layout=artValue('layout')||'single';
    const fontScale={small:1,medium:1.18,large:1.36}[artValue('fontSize')]||1;
    const fontKey=artValue('fontStyle')||'modern',font=artFonts[fontKey]||artFonts.modern;
    c.width=1600;c.height=shape==='landscape'?1000:shape==='square'?1600:2000;
    const w=c.width,h=c.height,columns=layout==='double'?2:1,metrics=layoutMetrics(shape,columns,'noir'),pad=metrics.pad,inner=w-2*pad;
    const img=getTemplateImage(theme);
    if(img.complete&&img.naturalWidth)drawImageCover(ctx,img,w,h);else{ctx.fillStyle='#111318';ctx.fillRect(0,0,w,h)}
    const p=paletteForTheme(theme);artPalettes[theme]=p;

    const title=artValue('title').trim()||'MY TOP OF 2026';
    const titleFit=fittedLines(ctx,title,inner*.76,2,metrics.titleSize*fontScale,40*fontScale,font.title,font.titleWeight),titleHeight=titleFit.lines.length*titleFit.size*1.04,titleBottom=metrics.titleY+titleHeight;
    const note=artValue('sub').trim();let listTop=Math.max(metrics.listTop,titleBottom+(shape==='portrait'?82:68)),noteY=0,noteHeight=0;
    if(note){noteY=titleBottom+18;const noteFit=fittedLines(ctx,note,inner*.76,2,23*fontScale,18*fontScale,artSans,noteTextWeight);noteHeight=noteFit.lines.length*noteFit.size*1.28;listTop=Math.max(listTop,noteY+noteHeight+36)}
    const items=(movies||[]).slice(0,10),rows=columns===2?5:10,bottomTarget=h-(shape==='portrait'?174:shape==='square'?142:122),gap=columns===2?72:0,cellW=(inner-gap*(columns-1))/columns,rowH=Math.max(40,(bottomTarget-listTop)/rows),listBottom=listTop+rows*rowH;

    drawContentScrim(ctx,w,h,p,listTop,listBottom,columns);
    ctx.save();ctx.shadowColor=p.dark?'rgba(0,0,0,.72)':'rgba(255,255,255,0)';ctx.shadowBlur=p.dark?5:0;ctx.textBaseline='top';ctx.fillStyle=p.fg;ctx.textAlign='center';
    writeLines(ctx,title,w/2,metrics.titleY,inner*.76,2,metrics.titleSize*fontScale,40*fontScale,font.title,font.titleWeight,1.04);
    if(note){ctx.fillStyle=p.muted;ctx.globalAlpha=.96;writeLines(ctx,note,w/2,noteY,inner*.76,2,23*fontScale,18*fontScale,artSans,noteTextWeight);ctx.globalAlpha=1;ctx.fillStyle=p.fg}
    ctx.textAlign='left';
    if(!items.length){ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.font=`600 ${29*fontScale}px ${artSans}`;ctx.fillText('映画を追加すると、ここに表示されます',w/2,listTop+rowH*3.5);ctx.textAlign='left';ctx.fillStyle=p.fg}
    items.forEach((m,i)=>{
      const col=columns===1?0:Math.floor(i/5),row=columns===1?i:i%5,x=pad+col*(cellW+gap),y=listTop+row*rowH,numberX=x+(columns===2?42:48);
      rule(ctx,x,y,cellW,p.line,p.dark?.68:.54);
      if(i<3)drawCinemaMedal(ctx,numberX,y+rowH*.5,i+1,p,.92*fontScale);else{ctx.save();ctx.font=`${rankNumberWeight} ${(columns===2?33:35)*fontScale}px ${artNumber}`;ctx.fillStyle=p.muted;ctx.globalAlpha=.96;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),numberX,y+rowH*.5);ctx.restore()}
      drawRankingMovie(ctx,m,x,y,cellW,rowH,columns,shape,font,fontScale,p);
    });
    rule(ctx,pad,listBottom,inner,p.line,p.dark?.68:.54);
    const footerY=brandFooterTop(shape,h,36*brandScale);drawBrandSafeZone(ctx,w,h,p,footerY,36*brandScale);drawCinemaBrand(ctx,w,h,p,footerY);ctx.restore();

    c.setAttribute('aria-label',title+'。'+items.map((m,i)=>(i+1)+'位 '+m.title).join('、'));
    scheduleArtworkBlob(c);
  }

  drawArtwork=function(movies){
    artworkMovies=(movies||[]).slice(0,10);
    const theme=artValue('theme')||'minimal';
    if(!theme.startsWith('cinema-'))return originalDrawArtwork(movies);
    renderCinemaTemplate(movies,theme);
  };

  window.CinemapCinemaTemplates={cinemaTemplates,drawImageCover,drawContentScrim,drawCinemaMedal,drawCinemaBrand,brandFooterTop,drawBrandSafeZone,scheduleArtworkBlob};
})();