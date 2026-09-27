/* My Cinemap art-direction controls: local UI, system fonts, and director hydration only. */
(() => {
  const FONT_KEY='cinemap-my-font-style';
  const FONT_VALUES=['editorial','modern','clean','classic'];
  const CINEMA_BG_KEY='cinemap-my-cinema-background';
  const CINEMA_BG_VALUES=['none','projector','theater','artdeco','archive','screening'];
  const API='https://backend-one-gray-94.vercel.app';
  const directorRequests=new Map();

  const style=document.createElement('style');
  style.textContent=`
    .exportOptions{grid-template-columns:repeat(4,minmax(0,1fr))!important}.fontStyleField,.cinemaBackgroundField{min-width:0}
    .templatePreview .previewDecor{position:absolute;inset:0;pointer-events:none;opacity:.24}
    .previewMinimal .previewDecor{background:linear-gradient(118deg,transparent 8%,rgba(185,170,141,.34) 34%,transparent 62%)}
    .previewNoir .previewDecor{background:linear-gradient(132deg,transparent 28%,rgba(184,149,93,.26) 29%,transparent 43%),linear-gradient(45deg,transparent 64%,rgba(244,239,230,.08) 65%,transparent 69%)}
    .previewBurgundy .previewDecor{border:1px solid rgba(200,154,104,.34);border-radius:999px;width:74%;height:140%;left:13%;top:-58%}
    .previewSage .previewDecor:before,.previewSage .previewDecor:after{content:'';position:absolute;width:54px;height:92px;border:1px solid rgba(129,119,82,.34);border-width:0 0 1px 1px;border-radius:0 0 0 80%;transform:rotate(-25deg)}
    .previewSage .previewDecor:before{left:6px;bottom:-18px}.previewSage .previewDecor:after{right:2px;top:-28px;transform:rotate(155deg)}
    .previewBlueGray .previewDecor{background:linear-gradient(rgba(130,118,101,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(130,118,101,.15) 1px,transparent 1px);background-size:22px 22px;mask-image:linear-gradient(to bottom,transparent,#000 45%,transparent)}
    @media(max-width:760px){.exportOptions{grid-template-columns:1fr 1fr!important}.fontStyleField,.cinemaBackgroundField{grid-column:1/-1}}
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
    if(saveBtn){
      const originalSave=saveBtn.onclick;
      saveBtn.onclick=()=>{
        originalSave?.();
        try{
          const saved=JSON.parse(localStorage.getItem('cinemap-my-saved-list')||'null');
          if(saved){saved.font=fontStyle.value;localStorage.setItem('cinemap-my-saved-list',JSON.stringify(saved))}
        }catch{}
      };
    }
    const loadBtn=document.getElementById('loadList');
    if(loadBtn){
      const originalLoad=loadBtn.onclick;
      loadBtn.onclick=()=>{
        originalLoad?.();
        try{
          const saved=JSON.parse(localStorage.getItem('cinemap-my-saved-list')||'null');
          if(saved&&FONT_VALUES.includes(saved.font)){fontStyle.value=saved.font;localStorage.setItem(FONT_KEY,saved.font);render()}
        }catch{}
        hydrateMissingDirectors();
      };
    }
    render();
  }

  function mountCinemaBackgroundPicker(){
    if(document.getElementById('cinemaBackground'))return;
    const options=document.querySelector('.exportOptions'); if(!options)return;
    const label=document.createElement('label'); label.className='cinemaBackgroundField';
    label.innerHTML='映画背景（オプション）<select id="cinemaBackground"><option value="none" selected>なし</option><option value="projector">Projector</option><option value="theater">Theater Curtain</option><option value="artdeco">Art Deco Cinema</option><option value="archive">Film Archive</option><option value="screening">Screening Room</option></select>';
    options.appendChild(label);
    const select=label.querySelector('#cinemaBackground'); const saved=localStorage.getItem(CINEMA_BG_KEY);
    if(CINEMA_BG_VALUES.includes(saved))select.value=saved;
    select.onchange=()=>{localStorage.setItem(CINEMA_BG_KEY,select.value);render()};
  }

  async function fillDirector(movie){
    if(!movie||movie.director)return;
    const id=Number(movie.tmdbId||(movie.source==='tmdb'?movie.id:0));
    if(!Number.isInteger(id)||id<1)return;
    if(!directorRequests.has(id))directorRequests.set(id,fetch(`${API}/api/movie-detail?id=${id}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>d?.movie?.director||'')
      .catch(()=>'')
      .finally(()=>directorRequests.delete(id)));
    const director=await directorRequests.get(id);
    if(director&&!movie.director&&picks.includes(movie)){
      movie.director=director;
      localStorage.setItem('cinemap-my-list',JSON.stringify(picks));
      render();
    }
  }

  async function hydrateMissingDirectors(){
    await Promise.all(picks.filter(movie=>!movie.director).map(fillDirector));
  }

  function decorateThemePreviews(){
    document.querySelectorAll('.templatePreview').forEach(preview=>{
      if(preview.querySelector('.previewDecor'))return;
      const decor=document.createElement('span');
      decor.className='previewDecor';
      decor.setAttribute('aria-hidden','true');
      preview.prepend(decor);
    });
  }

  function mount(){
    mountFontPicker();
    mountCinemaBackgroundPicker();
    decorateThemePreviews();
    hydrateMissingDirectors();
  }

  window.CinemapArtDirection={hydrateMissingDirectors,mountFontPicker,mountCinemaBackgroundPicker};
  mount();
})();
