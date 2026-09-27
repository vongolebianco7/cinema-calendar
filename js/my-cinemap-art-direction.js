/* My Cinemap art-direction controls: fonts, uploaded cinema templates, editor ranking layout, and director hydration. */
(() => {
  const FONT_KEY='cinemap-my-font-style';
  const FONT_VALUES=['modern','clean','classic'];
  const CINEMA_THEME_KEY='cinemap-my-cinema-theme';
  const API='https://backend-one-gray-94.vercel.app';
  const directorRequests=new Map();
  const medalNumberSize=34;
  const medalNumberWeight=600;
  const medalStrokeWidth=1.75;
  const singleMetaSize=23;
  const doubleMetaSize=21;
  const metaWeight=600;
  const noteSize=23;
  const noteWeight=600;
  const readableMetaAlpha=.9;
  const cinemaThemes=[
    {id:'cinema-projector',label:'Cinema Projector',desc:'映写機とフィルムのクラシックシネマ',asset:'assets/105DE5C4-9F65-41AF-A72F-0731A88CA8E6.png'},
    {id:'cinema-theater',label:'Theater Curtain',desc:'赤い幕と客席の劇場スタイル',asset:'assets/309A0142-0B8A-4070-A341-63A2446D0CBE.png'},
    {id:'cinema-artdeco',label:'Art Deco Cinema',desc:'黒と金のシネマパレス',asset:'assets/48E0565E-2BBD-45A0-B6C9-A3A554976D0D.png'},
    {id:'cinema-archive',label:'Film Archive',desc:'フィルムリールと映写室のアーカイブ',asset:'assets/99AFA977-5A97-4544-A7AD-60E16A93F874.png'}
  ];

  localStorage.removeItem('cinemap-my-cinema-background');
  if(localStorage.getItem(CINEMA_THEME_KEY)==='cinema-screening')localStorage.removeItem(CINEMA_THEME_KEY);

  const style=document.createElement('style');
  style.textContent=`
    .exportOptions{grid-template-columns:repeat(3,minmax(0,1fr))!important}.fontStyleField{min-width:0}
    .templatePreview .previewDecor{position:absolute;inset:0;pointer-events:none;opacity:.24}
    .previewMinimal .previewDecor{background:linear-gradient(118deg,transparent 8%,rgba(185,170,141,.34) 34%,transparent 62%)}
    .previewNoir .previewDecor{background:linear-gradient(132deg,transparent 28%,rgba(184,149,93,.26) 29%,transparent 43%),linear-gradient(45deg,transparent 64%,rgba(244,239,230,.08) 65%,transparent 69%)}
    .previewBurgundy .previewDecor{border:1px solid rgba(200,154,104,.34);border-radius:999px;width:74%;height:140%;left:13%;top:-58%}
    .previewBlueGray .previewDecor{background:linear-gradient(rgba(130,118,101,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(130,118,101,.15) 1px,transparent 1px);background-size:22px 22px;mask-image:linear-gradient(to bottom,transparent,#000 45%,transparent)}
    .cinemaTemplatePreview{padding:0!important;background-size:cover!important;background-position:center!important;border-color:#8d744d!important}.cinemaTemplatePreview>*{display:none!important}
    .cinemaTemplateCard{border-color:#5a4a35!important}.cinemaTemplateCard small{color:#c7b79e}

    /* Selected ranking is ALWAYS 2 columns and is independent from the exported image layout. */
    #list{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(5,auto);gap:8px 10px!important;align-items:start!important}
    #list .item:nth-child(-n+5){grid-column:1!important}
    #list .item:nth-child(n+6){grid-column:2!important}
    #list .item:nth-child(1),#list .item:nth-child(6){grid-row:1!important}
    #list .item:nth-child(2),#list .item:nth-child(7){grid-row:2!important}
    #list .item:nth-child(3),#list .item:nth-child(8){grid-row:3!important}
    #list .item:nth-child(4),#list .item:nth-child(9){grid-row:4!important}
    #list .item:nth-child(5),#list .item:nth-child(10){grid-row:5!important}
    #list .item{display:grid!important;grid-template-columns:22px 42px minmax(0,1fr)!important;grid-template-rows:auto auto!important;min-width:0!important;min-height:0!important;padding:9px 8px!important;border:1px solid #292929!important;border-radius:10px!important;background:#111!important;align-items:start!important;column-gap:7px!important;overflow:hidden!important}
    #list .item>:nth-child(1){grid-column:1!important;grid-row:1!important;align-self:start!important;font-size:12px!important;line-height:1.35!important}
    #list .item>:nth-child(2){display:block!important;grid-column:2!important;grid-row:1!important;width:42px!important;height:58px!important;object-fit:cover!important;border-radius:5px!important}
    #list .item>:nth-child(3){grid-column:3!important;grid-row:1!important;min-width:0!important;width:100%!important;max-width:100%!important;white-space:normal!important;word-break:keep-all!important;overflow-wrap:anywhere!important;writing-mode:horizontal-tb!important;line-height:1.35!important;font-size:11px!important}
    #list .item>:nth-child(3) a{display:-webkit-box!important;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden!important;white-space:normal!important;word-break:keep-all!important;overflow-wrap:anywhere!important;writing-mode:horizontal-tb!important;line-height:1.35!important}
    #list .item .move{grid-column:1/-1!important;grid-row:2!important;display:flex!important;max-width:none!important;justify-content:flex-end!important;align-items:center!important;margin-top:7px!important;gap:4px!important;flex-wrap:nowrap!important}
    #list .item .move>button,#list .item .move>a{width:27px!important;height:27px!important;min-height:27px!important;padding:0!important;font-size:11px!important;display:grid!important;place-items:center!important}
    #list .item .move>a{width:auto!important;min-width:42px!important;padding:0 4px!important}
    #list .item .movieEditPanel{grid-column:1/-1!important;margin-top:6px!important}
    #list .compactMovieMeta{font-size:9px!important;white-space:nowrap!important;line-height:1.25!important;overflow:hidden!important;text-overflow:ellipsis!important}
    @media(max-width:760px){.exportOptions{grid-template-columns:1fr 1fr!important}.fontStyleField{grid-column:1/-1}#list{gap:7px!important}#list .item{padding:8px 6px!important}}
  `;
  document.head.appendChild(style);

  function strengthenArtworkTypography(){
    if(window.__cinemapTypographyStrengthened)return;
    window.__cinemapTypographyStrengthened=true;

    const baseWriteLines=window.writeLines;
    if(typeof baseWriteLines==='function'){
      window.writeLines=function(ctx,text,x,y,width,maxLines,size,minSize,family,weight=400,lineHeight=1.28){
        const isBodySans=typeof family==='string'&&family.includes('Avenir Next');
        const isNote=isBodySans&&weight===400&&maxLines===2;
        const isMeta=isBodySans&&weight===400&&maxLines===1;
        if(isNote||isMeta){
          const previousAlpha=ctx.globalAlpha;
          ctx.globalAlpha=Math.max(previousAlpha,readableMetaAlpha);
          const adjustedSize=isNote?noteSize:Math.max(size*1.08,size<=20.5?doubleMetaSize:singleMetaSize);
          const adjustedMin=Math.max(minSize,isNote?18:17);
          const result=baseWriteLines(ctx,text,x,y,width,maxLines,adjustedSize,adjustedMin,family,isNote?noteWeight:metaWeight,lineHeight);
          ctx.globalAlpha=previousAlpha;
          return result;
        }
        return baseWriteLines(ctx,text,x,y,width,maxLines,size,minSize,family,weight,lineHeight);
      };
    }

    if(typeof window.drawMedal==='function'){
      window.drawMedal=function(ctx,x,y,rank,theme,scale=1){
        const colors=['#a98c56','#92969a','#a77b61'],metal=colors[rank-1];
        ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle=metal;ctx.fillStyle=metal;ctx.lineWidth=medalStrokeWidth;
        for(const side of [-1,1])for(let i=0;i<6;i++){
          const a=-1.02+i*.27,rx=side*(25+Math.cos(a)*12),ry=Math.sin(a)*27;
          ctx.save();ctx.translate(rx,ry);ctx.rotate(side*(.62-a*.18));ctx.beginPath();ctx.ellipse(0,0,6,2.2,0,0,Math.PI*2);ctx.stroke();ctx.restore();
        }
        ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${medalNumberWeight} ${medalNumberSize}px "Avenir Next","Helvetica Neue",Arial,sans-serif`;ctx.fillText(String(rank),0,0);ctx.restore();
      };
    }

    const baseDrawArtwork=window.drawArtwork;
    if(typeof baseDrawArtwork==='function'){
      window.drawArtwork=function(...args){
        const canvas=document.getElementById('artCanvas');
        const ctx=canvas?.getContext('2d');
        if(!ctx)return baseDrawArtwork(...args);
        const baseFillText=ctx.fillText;
        const callFillText=(target,text,x,y,maxWidth)=>maxWidth===undefined?baseFillText.call(target,text,x,y):baseFillText.call(target,text,x,y,maxWidth);
        ctx.fillText=function(text,x,y,maxWidth){
          const value=String(text);
          const rank=/^(?:[4-9]|10)$/.test(value);
          const thinRankFont=/^400\s+(?:30|32)(?:\.\d+)?px\s/.test(this.font||'');
          if(rank&&thinRankFont){
            const oldFont=this.font,oldAlpha=this.globalAlpha;
            const sizeMatch=oldFont.match(/^400\s+([\d.]+)px\s/);
            const currentSize=sizeMatch?Number(sizeMatch[1]):32;
            this.font=oldFont.replace(/^400\s+[\d.]+px\s/,`${medalNumberWeight} ${Math.round(currentSize+3)}px `);
            this.globalAlpha=Math.max(oldAlpha,readableMetaAlpha);
            try{return callFillText(this,text,x,y,maxWidth)}finally{this.font=oldFont;this.globalAlpha=oldAlpha}
          }
          return callFillText(this,text,x,y,maxWidth);
        };
        try{return baseDrawArtwork(...args)}finally{ctx.fillText=baseFillText}
      };
    }
  }

  function removePosterExplanationCopy(){
    document.querySelectorAll('.legal,.exportLegal').forEach(node=>{
      const text=node.textContent||'';
      if(!text.includes('ポスター')&&!text.includes('場面写真')&&!text.includes('再配布の許諾'))return;
      if(node.classList.contains('exportLegal')){node.remove();return}
      node.textContent='画像は作品名・公開年・監督名・順位で作成します。';
    });
  }

  function mountFontPicker(){
    if(document.getElementById('fontStyle'))return;
    const options=document.querySelector('.exportOptions');
    if(!options)return;
    const label=document.createElement('label');
    label.className='fontStyleField';
    label.innerHTML='フォント<select id="fontStyle"><option value="modern" selected>Modern Serif</option><option value="clean">Clean Sans</option><option value="classic">Cinema Classic</option></select>';
    options.appendChild(label);
    const fontStyle=label.querySelector('#fontStyle');
    const savedValue=localStorage.getItem(FONT_KEY);
    if(FONT_VALUES.includes(savedValue))fontStyle.value=savedValue;else localStorage.setItem(FONT_KEY,'modern');
    fontStyle.onchange=()=>{localStorage.setItem(FONT_KEY,fontStyle.value);render()};
    const saveBtn=document.getElementById('saveList');
    if(saveBtn){const originalSave=saveBtn.onclick;saveBtn.onclick=()=>{originalSave?.();try{const saved=JSON.parse(localStorage.getItem('cinemap-my-saved-list')||'null');if(saved){saved.font=fontStyle.value;localStorage.setItem('cinemap-my-saved-list',JSON.stringify(saved))}}catch{}}}
    const loadBtn=document.getElementById('loadList');
    if(loadBtn){const originalLoad=loadBtn.onclick;loadBtn.onclick=()=>{originalLoad?.();try{const saved=JSON.parse(localStorage.getItem('cinemap-my-saved-list')||'null');if(saved&&FONT_VALUES.includes(saved.font)){fontStyle.value=saved.font;localStorage.setItem(FONT_KEY,saved.font);render()}}catch{}hydrateMissingDirectors()}}
  }

  function mountCinemaTemplates(){
    const theme=document.getElementById('theme'),choices=document.getElementById('themeChoices');
    if(!theme||!choices)return;
    cinemaThemes.forEach(item=>{
      if(!choices.querySelector(`[data-theme="${item.id}"]`)){const button=document.createElement('button');button.type='button';button.className='themeChoice premiumTheme cinemaTemplateCard';button.dataset.theme=item.id;button.innerHTML=`<span class="templatePreview cinemaTemplatePreview" style="background-image:url('${item.asset}')" aria-hidden="true"></span><span><b>${item.label}</b><small>${item.desc}</small></span>`;button.onclick=()=>{theme.value=item.id;localStorage.setItem(CINEMA_THEME_KEY,item.id);syncThemeChoices();render()};choices.appendChild(button)}
    });
    const saved=localStorage.getItem(CINEMA_THEME_KEY);
    if(cinemaThemes.some(item=>item.id===saved)){theme.value=saved;syncThemeChoices();render()}
    const hint=document.getElementById('templateHint');if(hint)hint.textContent='基本4デザインに加え、映画デザイン4種を選べます。';
  }

  async function fillDirector(movie){
    if(!movie||movie.director)return;
    const id=Number(movie.tmdbId||(movie.source==='tmdb'?movie.id:0));
    if(!Number.isInteger(id)||id<1)return;
    if(!directorRequests.has(id))directorRequests.set(id,fetch(`${API}/api/movie-detail?id=${id}`).then(r=>r.ok?r.json():null).then(d=>d?.movie?.director||'').catch(()=>'').finally(()=>directorRequests.delete(id)));
    const director=await directorRequests.get(id);
    if(director&&!movie.director&&picks.includes(movie)){movie.director=director;localStorage.setItem('cinemap-my-list',JSON.stringify(picks));render()}
  }
  async function hydrateMissingDirectors(){await Promise.all(picks.filter(movie=>!movie.director).map(fillDirector))}

  function decorateThemePreviews(){document.querySelectorAll('.templatePreview:not(.cinemaTemplatePreview)').forEach(preview=>{if(preview.querySelector('.previewDecor'))return;const decor=document.createElement('span');decor.className='previewDecor';decor.setAttribute('aria-hidden','true');preview.prepend(decor)})}
  function markEditorRanking(){document.getElementById('list')?.classList.add('editorRankingFixedTwoColumn')}
  function bindExportControlsToEnhancedRender(){
    ['format','layout','fontSize'].forEach(id=>{
      const control=document.getElementById(id);
      if(!control)return;
      control.onchange=()=>drawArtwork(picks);
    });
  }
  function mount(){strengthenArtworkTypography();removePosterExplanationCopy();mountFontPicker();mountCinemaTemplates();decorateThemePreviews();markEditorRanking();bindExportControlsToEnhancedRender();hydrateMissingDirectors();render();markEditorRanking()}

  const renderer=document.createElement('script');
  renderer.src='js/my-cinemap-cinema-templates.js?v=20260927-exact-cinema-v5';
  renderer.defer=true;renderer.onload=mount;renderer.onerror=mount;document.body.appendChild(renderer);
  window.CinemapArtDirection={hydrateMissingDirectors,mountFontPicker,mountCinemaTemplates,markEditorRanking,bindExportControlsToEnhancedRender,strengthenArtworkTypography,removePosterExplanationCopy};
})();