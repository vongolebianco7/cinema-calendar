/* Shared, read-only movie/person search. Review controls retain existing storage. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./cinelva-film-medium.js'):root.CinelvaFilmMedium);if(typeof module==='object'&&module.exports)module.exports=api;else{root.CinelvaGlobalSearch=api;api.boot();}})(typeof window!=='undefined'?window:globalThis,function(FilmMedium){
 'use strict';
 const validId=id=>Number.isSafeInteger(Number(id))&&Number(id)>0;
 const imageUrl=(path,size='w185')=>typeof path==='string'&&/^\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(path)?'https://image.tmdb.org/t/p/'+size+path:'';
 function candidateImage(x){if(x.kind==='person')return imageUrl(x.profile_path);const path=x.poster_path||String(x.poster||'').replace(/^https:\/\/image\.tmdb\.org\/t\/p\/w\d+/, '');return imageUrl(path);}
 const candidateKey=x=>x.kind+':'+x.id+(x.kind==='person'?':'+x.role:'');
 function candidateUrl(x,base){const u=new URL(base);u.search='';u.hash='';if(!validId(x.id))return u.href;u.searchParams.set(x.kind==='person'?'person':'id',String(x.id));u.searchParams.set('search',x.name||x.title||'');if(x.kind==='person')u.searchParams.set('role',x.role==='director'?'director':'cast');return u.href;}
 function peopleCandidates(rows){return (Array.isArray(rows)?rows:[]).filter(x=>validId(x.id)&&['Directing','Acting'].includes(x.department)).map(x=>({...x,kind:'person',role:x.department==='Directing'?'director':'cast'}));}
 const normalizeName=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
 function isDirectorCredit(work, directorName, resolveName=value=>value) {
    if (!FilmMedium?.isFilmMedium(work)) return false;
    const title=String(work.title||work.name||work.original_title||'').trim();
    const original=String(work.original_title||'').trim();
    const titleText=(title+' '+original).toLowerCase();
    // These are standalone feature-film directorographies, not all person credits.
    if (/cinema\s*16\b|short\s*films?|shorts?\s*collection|amazing\s*stories:\s*the\s*movie|anthology|compilation|behind.the.scenes|making.of|メイキング|短編|短篇|総集編|オムニバス/i.test(titleText)) return false;
    const genres=[...(Array.isArray(work.genres)?work.genres:[]),...(Array.isArray(work.genre_names)?work.genre_names:[])].map(g=>typeof g==='string'?g:g?.name||'').join(' ').toLowerCase();
    if (/\bshort\b|短編|短篇/.test(genres)) return false;
    if ([work.is_short,work.isShort,work.short_film,work.shortFilm].some(x=>x===true)) return false;
    const duration=Number(work.runtime??work.duration??work.length_minutes??work.runtime_minutes);
    if (Number.isFinite(duration)&&duration>0&&duration<30) return false;
    // A TMDB directing credit alone does not prove feature-film length:
    // exclude runtime-unverified catalog credits until movie detail is fetched.
    // Saved viewing records retain their existing handling.
    // TMDB person movie credits do not contain runtime. Unknown runtime must not discard a verified directing credit.
    const type=String(work.type||work.media_type||work.format||'').toLowerCase();
    if (/\bshort\b|短編|短篇/.test(type)) return false;
    if (work.cast===true||work.actor===true||work.self===true||work.is_director===false||work.isDirector===false) return false;
    const role=String(work.job||work.role||work.credit_type||work.creditType||'').trim().toLowerCase();
    if (role && !['director','監督'].includes(role)) return false;
    const department=String(work.department||'').trim().toLowerCase();
    if (department && !['directing','監督'].includes(department)) return false;
    const named=String(work.director||work.director_name||work.directorName||'').trim();
    // Use the same kana-equivalence rules as the director picker.
    // Without this, sourced works can disappear for ヴ/ブ or イィ spellings.
    const directorSpellingKey=value=>normalizeName(resolveName(value))
      .replace(/ヴ/g,'ブ').replace(/ィ/g,'イ').replace(/ェ/g,'エ').replace(/ー/g,'');
    if (named && directorSpellingKey(named)!==directorSpellingKey(directorName)) return false;
    // Missing credits are not evidence of direction; require an explicit match.
    return role==='director'||role==='監督'||work.is_director===true||work.isDirector===true||Boolean(named);
  }
 function creditFilms(rows,role,directorName,featureIds){const allowed=role==='director'&&Array.isArray(featureIds)?new Set(featureIds.map(Number)):null;const seen=new Set();return (Array.isArray(rows)?rows:[]).filter(x=>{if(!FilmMedium?.isFilmMedium(x)||!validId(x.id)||allowed&&!allowed.has(Number(x.id))||x.adult||role==='director'&&!isDirectorCredit(x,directorName||x.director||x.director_name||'')||seen.has(Number(x.id)))return false;seen.add(Number(x.id));return true;}).map(x=>({...x,id:Number(x.id),tmdbId:Number(x.id),title:x.title||x.original_title||'作品名未確認',year:(x.release_date||x.date||'').slice(0,4),poster:x.poster||imageUrl(x.poster_path,'w342'),source:'tmdb',catalog:true})).sort((a,b)=>(a.release_date||a.date||'9999').localeCompare(b.release_date||b.date||'9999')||a.title.localeCompare(b.title,'ja'));}
 function boot(){
  if(typeof document==='undefined'||document.documentElement.dataset.globalSearchMounted)return;
  const script=document.currentScript?.src||new URL('js/cinelva-global-search.js',location.href).href;
  const searchUrl=new URL('../search.html',script).href,api='https://backend-one-gray-94.vercel.app';
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=normalizeName;
  const onSearchPage=/\/search\.html$/.test(location.pathname);
  const cache=new Map(),profiles=new Map();let localCatalog,localPeople,savedDirectors,featureIndex,sequence=0;
  const dataUrl=name=>new URL('../data/'+name,script).href;
  const get=async(url,signal,timeout=15000)=>{const controller=new AbortController(),abort=()=>controller.abort();if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,timeout);try{const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw Error('search unavailable');return await r.json();}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}};
  const catalog=()=>localCatalog||(localCatalog=get(dataUrl('movies.json')).then(d=>Array.isArray(d)?d:d.movies||[]).catch(()=>[]));
  const directors=()=>localPeople||(localPeople=get(dataUrl('director_name_readings.json')).then(d=>Object.entries(d.directors||{}).map(([id,p])=>({...p,id:Number(id),name:p.nameJa||p.original_name}))).catch(()=>[]));
  async function personMatches(term,signal,partial){
   const key=normalize(term),seen=new Set();let remote=null,local=[];
   const result=()=>{seen.clear();const known=local.filter(p=>[p.name,p.nameJa,p.original_name,...(p.also_known_as||[])].some(t=>normalize(t).includes(key))).map(p=>({...p,department:'Directing'}));
    // Prefer live photos/identity when the reading index contains the same person.
    return {people:peopleCandidates([...(remote?.people||[]),...known]).filter(p=>{if(seen.has(Number(p.id)))return false;seen.add(Number(p.id));return true;}).slice(0,6),failed:!remote};};
   await Promise.allSettled([get(api+'/api/people?q='+encodeURIComponent(term),signal,12000).then(d=>{remote=d;if(!signal?.aborted)partial?.(result());}),directors().then(d=>{local=d;if(!signal?.aborted)partial?.(result());})]);
   return result();
  }
  async function candidates(term,signal,partial){
   const key=normalize(term);if(cache.has(key))return cache.get(key);
   let remote=null,local=[],people=[],peopleFailed=true;const seen=new Set();
   const result=()=>{seen.clear();const matching=local.filter(m=>[m.title,m.original_title,...(m.aliases||[])].some(t=>normalize(t).includes(key)));
    const movies=[...matching,...(remote?.movies||[]),...(remote?.external||[])].filter(m=>{const id=m.tmdbId||m.id;if(!validId(id)||seen.has(Number(id)))return false;seen.add(Number(id));return true;}).slice(0,100).map(m=>({...m,id:Number(m.tmdbId||m.id),name:m.title,kind:'movie'}));
    return {movies,people,failed:!remote&&peopleFailed};};
   const emit=()=>{if(!signal?.aborted)partial?.({...result(),pending:true});};
   const updatePeople=d=>{people=d.people;peopleFailed=d.failed;emit();};
   await Promise.allSettled([get(api+'/api/movies?q='+encodeURIComponent(term)+'&limit=100',signal).then(d=>{remote=d;emit();}),personMatches(term,signal,updatePeople).then(updatePeople),catalog().then(d=>{local=d;emit();})]);
   if(signal?.aborted)throw Error('cancelled');
   const d=result();if(remote&&!peopleFailed){if(cache.size>=32)cache.delete(cache.keys().next().value);cache.set(key,d);}return d;
  }
  const select=x=>{location.href=candidateUrl(x,searchUrl);};
  function mount(){
   if(document.documentElement.dataset.globalSearchMounted)return;document.documentElement.dataset.globalSearchMounted='true';
   const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('../assets/global-search.css',script).href;document.head.append(css);
   document.querySelectorAll('.gSearchForm').forEach((form,index)=>{
    const input=form.querySelector('.gSearch');if(!input)return;
    input.placeholder='作品・監督・キャストを検索';input.setAttribute('aria-label','作品・監督・キャストを検索');input.autocomplete='off';input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');
    const box=document.createElement('div');box.id='cinelvaSearchSuggestions'+index;box.className='cinelva-search-suggestions';box.hidden=true;box.setAttribute('role','listbox');box.setAttribute('aria-label','検索候補');document.body.append(box);input.setAttribute('aria-controls',box.id);
    let timer,controller,version=0,choices=[],active=-1,composing=false;
    const close=()=>{box.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;};
    const position=()=>{const r=form.getBoundingClientRect();box.style.top=Math.round(r.bottom+6)+'px';box.style.left=Math.max(8,Math.min(r.left,innerWidth-Math.min(400,innerWidth-16)-8))+'px';box.style.width=Math.min(400,innerWidth-16)+'px';};
    const highlight=()=>{box.querySelectorAll('[role="option"]').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===active));if(i===active){input.setAttribute('aria-activedescendant',b.id);b.scrollIntoView({block:'nearest'});}});};
    const update=()=>{clearTimeout(timer);controller?.abort();const current=++version,term=input.value.trim();close();if(composing||term.length<2)return;timer=setTimeout(async()=>{controller=new AbortController();const paint=d=>{if(current!==version||input.value.trim()!==term||document.activeElement!==input)return;const selectedKey=active>=0&&choices[active]?candidateKey(choices[active]):null;choices=[...d.people,...d.movies];box.innerHTML=choices.map((x,i)=>'<button type="button" role="option" aria-selected="false" id="'+box.id+'-'+i+'" data-choice="'+i+'">'+(candidateImage(x)?'<img class="cinelva-suggestion-image" src="'+E(candidateImage(x))+'" alt="" loading="lazy" decoding="async">':'<span class="cinelva-suggestion-image cinelva-suggestion-placeholder" aria-hidden="true">'+(x.kind==='person'?'人':'映画')+'</span>')+'<span class="cinelva-suggestion-text"><strong>'+E(x.name)+'</strong><small>'+E(x.kind==='person'?(x.role==='director'?'監督':'キャスト')+(x.known_for?.length?' · '+x.known_for.join(' / '):''):'作品'+(x.year?' · '+x.year:''))+'</small></span></button>').join('');if(!choices.length)box.innerHTML='<p>'+(d.pending?'検索中…':d.failed?'候補を取得できません。検索ボタンで再検索できます。':'候補がありません。検索ボタンで検索できます。')+'</p>';position();box.hidden=false;input.setAttribute('aria-expanded','true');active=selectedKey?choices.findIndex(x=>candidateKey(x)===selectedKey):-1;input.removeAttribute('aria-activedescendant');highlight();box.querySelectorAll('[data-choice]').forEach(b=>{b.addEventListener('pointerdown',e=>e.preventDefault());b.onclick=()=>{close();select(choices[Number(b.dataset.choice)]);};});};try{paint(await candidates(term,controller.signal,paint));}catch{if(current===version)close();}},250);};
    input.addEventListener('input',update);input.addEventListener('compositionstart',()=>{composing=true;clearTimeout(timer);++version;controller?.abort();close();});input.addEventListener('compositionend',()=>{composing=false;update();});
    input.addEventListener('keydown',e=>{if(composing||e.isComposing)return;if(e.key==='Escape'){++version;controller?.abort();close();}else if(!box.hidden&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(choices.length){active=e.key==='ArrowDown'?(active+1)%choices.length:(active<0?choices.length-1:(active-1+choices.length)%choices.length);highlight();}}else if(e.key==='Enter'&&!box.hidden&&active>=0){e.preventDefault();e.stopImmediatePropagation();select(choices[active]);}});
    form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();if(composing)return;++version;clearTimeout(timer);controller?.abort();close();const term=input.value.trim();if(!term)return;if(onSearchPage){delete document.body.dataset.personSearch;document.getElementById('globalPersonProfile')?.remove();const grid=document.getElementById('grid');if(grid)grid.hidden=false;document.querySelector('.hero h1').textContent='作品・監督・キャスト検索';document.querySelector('.hero p').textContent='作品名・監督名・キャスト名から探せます。';window.search?.();loadPeople(term);}else{const u=new URL(searchUrl);u.searchParams.set('search',term);location.href=u.href;}},true);
    document.addEventListener('pointerdown',e=>{if(!box.contains(e.target)&&!form.contains(e.target)){++version;controller?.abort();close();}});input.addEventListener('blur',()=>setTimeout(()=>{if(!box.contains(document.activeElement))close();},120));window.addEventListener('resize',position);window.addEventListener('scroll',close,{passive:true});
   });
   if(onSearchPage){const p=new URLSearchParams(location.search);if(validId(p.get('person')))loadProfile(Number(p.get('person')),p.get('role')==='director'?'director':'cast');else if(!p.get('id')&&p.get('search'))loadPeople(p.get('search'));}
  }
  function peopleHost(){let host=document.getElementById('globalSearchPeople');if(!host){host=document.createElement('section');host.id='globalSearchPeople';host.className='cinelva-people-results';document.getElementById('grid')?.before(host);}return host;}
  async function loadPeople(term){const current=++sequence,host=peopleHost();host.hidden=false;host.innerHTML='';try{const d=cache.get(normalize(term))||await personMatches(term);if(current!==sequence)return;const exact=d.people.filter(p=>normalize(p.name)===normalize(term));if(exact.length===1){history.replaceState(null,'',candidateUrl(exact[0],searchUrl));return loadProfile(Number(exact[0].id),exact[0].role);}host.innerHTML=d.people.length?'<h2>監督・キャスト</h2><div class="cinelva-people-matches">'+d.people.map(x=>'<a href="'+E(candidateUrl(x,searchUrl))+'">'+(imageUrl(x.profile_path)?'<img src="'+E(imageUrl(x.profile_path))+'" alt="" loading="lazy">':'')+'<strong>'+E(x.name)+'</strong><small>'+(x.role==='director'?'監督':'キャスト')+'</small></a>').join('')+'</div><h2>作品</h2>':d.failed?'<p>人物候補を取得できませんでした。再検索してください。</p>':'';}catch{if(current===sequence)host.textContent='人物候補を取得できませんでした。';}}
  async function loadProfile(id,role){
   const current=++sequence;const grid=document.getElementById('grid');if(!grid)return;document.body.dataset.personSearch='true';grid.hidden=true;document.getElementById('globalSearchPeople')?.remove();document.getElementById('status').textContent='';
   let host=document.getElementById('globalPersonProfile');if(!host){host=document.createElement('section');host.id='globalPersonProfile';grid.before(host);}host.innerHTML='<p role="status">人物情報を読み込み中…</p>';
   try{
    if(!profiles.has(id))profiles.set(id,get(api+'/api/people?id='+id+'&profile=1').catch(error=>{profiles.delete(id);throw error;}));
    let local;directors().then(rows=>{local=rows.find(p=>Number(p.id)===id);});
    const [remote,index]=await Promise.all([profiles.get(id).catch(()=>null),role==='director'?(featureIndex||(featureIndex=get(dataUrl('director-feature-index.json')).catch(()=>{featureIndex=null;return null;}))):null]);if(current!==sequence)return;if(!remote?.person||role==='director'&&!index){try{const saved=await (savedDirectors||(savedDirectors=get(dataUrl('directors-mobile.json')).catch(error=>{savedDirectors=null;throw error;})));local=saved.directors?.[String(id)];}catch{local=null;}if(current!==sequence)return;}
    if(!remote?.person&&!local)throw Error('person unavailable');
    const p={...(remote?.person||{}),...(local||{})},name=p.nameJa||p.name||'人物',films=creditFilms(role==='director'?(!index&&local?.works?local.works:remote?.credits?.director||local?.works||[]):(remote?.credits?.cast||[]),role,name,index?.directors?.[String(id)]?.complete?index.directors[String(id)].ids:undefined),confirmed=remote?.coverage?.truncated===false||role==='director'&&local?.coverage?.truncated===false;
    document.querySelector('.hero h1').textContent=name;document.querySelector('.hero p').textContent='人物情報とフィルモグラフィー';
    const tabs=['director','cast'].map(r=>'<button type="button" data-person-role="'+r+'" aria-pressed="'+String(role===r)+'">'+(r==='director'?'監督作品':'出演作品')+'</button>').join('');
    host.innerHTML='<div class="cinelva-person-profile">'+(imageUrl(p.profile_path)?'<img src="'+E(imageUrl(p.profile_path))+'" alt="'+E(name)+'の写真">':'')+'<div><h2>'+E(name)+'</h2>'+(p.birthday?'<p>生年月日：'+E(p.birthday)+'</p>':'')+(p.place_of_birth?'<p>出身地：'+E(p.place_of_birth)+'</p>':'')+((p.biography_ja||p.biography)?'<details><summary>経歴を読む</summary><p>'+E(p.biography_ja||p.biography)+'</p></details>':'')+'<a href="https://www.themoviedb.org/person/'+id+'" target="_blank" rel="noopener noreferrer">人物の出典情報 ↗</a></div></div><div class="cinelva-person-tabs">'+tabs+'</div><p>'+films.length+'本 · 公開年の古い順'+(!confirmed?'（作品一覧を取得できていません）':'')+'</p><div class="cinelva-person-films">'+films.map((m,i)=>'<article><a href="'+E(candidateUrl({...m,kind:'movie',name:m.title},searchUrl))+'" aria-label="'+E(m.title)+'の作品情報"><div class="cinelva-person-poster">'+(m.poster?'<img src="'+E(m.poster)+'" alt="" loading="lazy">':'<span>ポスター未確認</span>')+'</div><span class="cinelva-person-year">'+E(m.year||'公開年未確認')+'</span><strong>'+E(m.title)+'</strong></a><div data-person-review="'+i+'"></div></article>').join('')+'</div>'+(!films.length?'<p>'+(confirmed?'この区分の作品は情報元に掲載されていません。':'作品情報を取得できませんでした。')+'</p>':'')+(!remote?'<p>最新の人物情報を取得できなかったため、保存済みの監督情報を表示しています。</p>':'')+'<p class="cinelva-person-coverage">出典：TMDB。掲載作品の範囲・公開年は情報元の登録状況によって異なります。</p>';
    host.querySelectorAll('[data-person-role]').forEach(b=>b.onclick=()=>{const u=new URL(location.href);u.searchParams.set('role',b.dataset.personRole);history.replaceState(null,'',u);loadProfile(id,b.dataset.personRole);});
    host.querySelectorAll('[data-person-review]').forEach(slot=>{const film=films[Number(slot.dataset.personReview)],m=role==='director'?{...film,director:name,director_id:id}:film;window.CinelvaMovieIdentity?.ingest(m);window.CinelvaQuickRate?.mountInline(slot,m);});
   }catch{if(current===sequence){host.innerHTML='<p>人物情報を取得できませんでした。</p><button type="button" data-person-retry>再試行</button>';host.querySelector('[data-person-retry]').onclick=()=>loadProfile(id,role);}}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
 return {filmMedium:FilmMedium,candidateImage,normalizeName,isDirectorCredit,candidateKey,candidateUrl,peopleCandidates,creditFilms,imageUrl,boot};
});
