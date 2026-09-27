/* My Cinemap art-direction controls: fonts, exact uploaded cinema templates, editor ranking layout, and director hydration. */
(() => {
  const FONT_KEY='cinemap-my-font-style';
  const FONT_VALUES=['editorial','modern','clean','classic'];
  const CINEMA_THEME_KEY='cinemap-my-cinema-theme';
  const API='https://backend-one-gray-94.vercel.app';
  const directorRequests=new Map();
  const cinemaThemes=[
    {id:'cinema-projector',label:'Cinema Projector',desc:'映写機とフィルムのクラシックシネマ',asset:'assets/105DE5C4-9F65-41AF-A72F-0731A88CA8E6.png'},
    {id:'cinema-theater',label:'Theater Curtain',desc:'赤い幕と客席の劇場スタイル',asset:'assets/309A0142-0B8A-4070-A341-63A2446D0CBE.png'},
    {id:'cinema-artdeco',label:'Art Deco Cinema',desc:'黒と金のシネマパレス',asset:'assets/48E0565E-2BBD-45A0-B6C9-A3A554976D0D.png'},
    {id:'cinema-archive',label:'Film Archive',desc:'フィルムリールと映写室のアーカイブ',asset:'assets/99AFA977-5A97-4544-A7AD-60E16A93F874.png'},
    {id:'cinema-screening',label:'Screening Room',desc:'上映室と客席のシネマ空間',asset:'assets/AB933939-93EB-43D6-814A-C60BE58B42F6.png'}
  ];

  localStorage.removeItem('cinemap-my-cinema-background');

  const style=document.createElement('style');
  style.textContent=`
    .exportOptions{grid-template-columns:repeat(3,minmax(0,1fr))!important}.fontStyleField{min-width:0}
    .templatePreview .previewDecor{position:absolute;inset:0;pointer-events:none;opacity:.24}
    .previewMinimal .previewDecor{background:linear-gradient(118deg,transparent 8%,rgba(185,170,141,.34) 34%,transparent 62%)}
    .previewNoir .previewDecor{background:linear-gradient(132deg,transparent 28%,rgba(184,149,93,.26) 29%,transparent 43%),linear-gradient(45deg,transparent 64%,rgba(244,239,230,.08) 65%,transparent 69%)}
    .previewBurgundy .previewDecor{border:1px solid rgba(200,154,104,.34);border-radius:999px;width:74%;height:140%;left:13%;top:-58%}
    .previewSage .previewDecor:before,.previewSage .previewDecor:after{content:'';position:absolute;width:54px;height:92px;border:1px solid rgba(129,119,82,.34);border-width:0 0 1px 1px;border-radius:0 0 0 80%;transform:rotate(-25deg)}
    .previewSage .previewDecor:before{left:6px;bottom:-18px}.previewSage .previewDecor:after{right:2px;top:-28px;transform:rotate(155deg)}
    .previewBlueGray .previewDecor{background:linear-gradient(rgba(130,118,101,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(130,118,101,.15) 1px,transparent 1px);background-size:22px 22px;mask-image:linear-gradient(to bottom,transparent,#000 45%,transparent)}
    .cinemaTemplatePreview{padding:0!important;background-size:cover!important;background-position:center!important;border-color:#8d744d!important}.cinemaTemplatePreview>*{display:none!important}
    .cinemaTemplateCard{border-color:#5a4a35!important}.cinemaTemplateCard small{color:#c7b79e}

    /* Editor ranking is ALWAYS 2 columns. It is intentionally independent from the exported image layout selector. */
    #list.editorRankingFixedTwoColumn{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(5,auto);gap:8px 10px!important;align-items:start!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(-n+5){grid-column:1!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(n+6){grid-column:2!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(1),#list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(6){grid-row:1!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(2),#list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(7){grid-row:2!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(3),#list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(8){grid-row:3!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(4),#list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(9){grid-row:4!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(5),#list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(10){grid-row:5!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem{display:grid!important;grid-template-columns:22px minmax(0,1fr)!important;grid-template-rows:auto auto!important;min-width:0!important;min-height:0!important;padding:9px 8px!important;border:1px solid #292929!important;border-radius:10px!important;background:#111!important;align-items:start!important;column-gap:7px!important;overflow:hidden!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem>:nth-child(1){grid-column:1!important;grid-row:1!important;align-self:start!important;font-size:12px!important;line-height:1.35!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem>:nth-child(2){display:none!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem>:nth-child(3){grid-column:2!important;grid-row:1!important;min-width:0!important;width:100%!important;max-width:100%!important;white-space:normal!important;word-break:keep-all!important;overflow-wrap:anywhere!important;writing-mode:horizontal-tb!important;line-height:1.35!important;font-size:11px!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem>:nth-child(3) a{display:-webkit-box!important;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden!important;white-space:normal!important;word-break:keep-all!important;overflow-wrap:anywhere!important;writing-mode:horizontal-tb!important;line-height:1.35!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem .move{grid-column:1/-1!important;grid-row:2!important;display:flex!important;max-width:none!important;justify-content:flex-end!important;align-items:center!important;margin-top:7px!important;gap:4px!important;flex-wrap:nowrap!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem .move>button,#list.editorRankingFixedTwoColumn .compactMovieItem .move>a{width:27px!important;height:27px!important;min-height:27px!important;padding:0!important;font-size:11px!important;display:grid!important;place-items:center!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem .move>a{width:auto!important;min-width:42px!important;padding:0 4px!important}
    #list.editorRankingFixedTwoColumn .compactMovieItem .movieEditPanel{grid-column:1/-1!important;margin-top:6px!important}
    #list.editorRankingFixedTwoColumn .compactMovieMeta{font-size:9px!important;white-space:nowrap!important;line-height:1.25!important;overflow:hidden!important;text-overflow:ellipsis!important}
    @media(max-width:760px){.exportOptions{grid-template-columns:1fr 1fr!important}.fontStyleField{grid-column:1/-1}#list.editorRankingFixedTwoColumn{gap:7px!important}#list.editorRankingFixedTwoColumn .compactMovieItem{padding:8px 6px!important}}
  `;
  document.head.appendChild(style);

  function mountFontPicker(){
    if(document.getElementById('fontStyle'))return;
    const options=document.querySelector('.exportOptions');
    if(!options)return;
    const label=document.createElement('label');
    label.className='fontStyleField';
    label.innerHTML='フォント<select id="fontStyle"><option value="editorial" selected>Editorial Serif</option><option value="modern">Modern Serif</option><option value="clean">Clean Sans</option><option value="classic">Cinema Classic</option></select>';
    options.appendChild(label);
    const fontStyle=label.querySelector('#fontStyle');
    const savedValue=localStorage.getItem(FONT_KEY);
    if(FONT_VALUES.includes(savedValue))fontStyle.value=savedValue;
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
      if(!theme.querySelector(`option[value="${item.id}"]`)){const option=document.createElement('option');option.value=item.id;option.textContent=item.label;theme.appendChild(option)}
      if(!choices.querySelector(`[data-theme="${item.id}"]`)){const button=document.createElement('button');button.type='button';button.className='themeChoice premiumTheme cinemaTemplateCard';button.dataset.theme=item.id;button.innerHTML=`<span class="templatePreview cinemaTemplatePreview" style="background-image:url('${item.asset}')" aria-hidden="true"></span><span><b>${item.label}</b><small>${item.desc}</small></span>`;button.onclick=()=>{theme.value=item.id;localStorage.setItem(CINEMA_THEME_KEY,item.id);syncThemeChoices();render()};choices.appendChild(button)}
    });
    const saved=localStorage.getItem(CINEMA_THEME_KEY);
    if(cinemaThemes.some(item=>item.id===saved)){theme.value=saved;syncThemeChoices();render()}
    const hint=document.getElementById('templateHint');if(hint)hint.textContent='元の5デザインに加え、アップロードした映画デザイン5種をそのままテンプレートとして選べます。';
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
  function mount(){mountFontPicker();mountCinemaTemplates();decorateThemePreviews();markEditorRanking();hydrateMissingDirectors();render();markEditorRanking()}

  const renderer=document.createElement('script');
  renderer.src='js/my-cinemap-cinema-templates.js?v=20260927-exact-cinema-v2';
  renderer.defer=true;renderer.onload=mount;renderer.onerror=mount;document.body.appendChild(renderer);
  window.CinemapArtDirection={hydrateMissingDirectors,mountFontPicker,mountCinemaTemplates,markEditorRanking};
})();