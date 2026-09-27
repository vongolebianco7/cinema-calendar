(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const store = window.CinemapRecords;
  let films = [];
  const ratingSteps = [[2.5,'最悪'],[3,'微妙'],[3.5,'普通'],[4,'好き'],[4.5,'傑作'],[5,'人生ベスト級']];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const url = movie => 'search.html?id=' + encodeURIComponent(movie.id) + '&search=' + encodeURIComponent(movie.title);
  const count = () => Object.values(store.read()).filter(x => x?.watched).length;
  const ratingDock = document.createElement('div');
  ratingDock.id = 'impactDock'; ratingDock.hidden = true;
  ratingDock.innerHTML = '<div class="impactDockTop"><strong class="impactDockTitle"></strong><button type="button" class="impactDockSkip" data-skip-rating>あとで</button></div><p class="impactQuestion">この映画はどうだった？ 観た記録は保存済みです</p><div class="impactChoices">'+ratingSteps.map(([score,label])=>'<button type="button" class="impactChoice" data-rating="'+score+'" aria-label="'+score+' '+label+'"><strong>'+score+'</strong><small>'+label+'</small></button>').join('')+'</div><button type="button" class="impactDockSkip impactDockClear" data-clear-rating hidden>評価を外す</button>';
  document.body.appendChild(ratingDock);
  function openRating(movie) {
    ratingDock.dataset.movieId = String(movie.id);
    ratingDock.querySelector('.impactDockTitle').textContent = movie.title || '作品 ' + movie.id;
    const current = store.get(movie)?.rating;
    ratingDock.querySelectorAll('[data-rating]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.rating)===current)));
    ratingDock.querySelector('[data-clear-rating]').hidden = current == null;
    ratingDock.hidden = false;
  }
  const requestedView = new URLSearchParams(location.search).get('view');
  const addMode = requestedView === 'add' || (requestedView !== 'dashboard' && count() < 25);
  function show() {
    const add = addMode; $('onboarding').hidden = !add; $('dashboard').hidden = add;
    if (add) renderOnboarding(); else renderDashboard();
  }
  function renderOnboarding() {
    $('onboardCount').textContent = count() + '本記録済み';
    $('milestone').hidden = count() < 25;
    $('filmGrid').innerHTML = films.map(m => {
      const record = store.get(m), watched = !!record?.watched;
      return '<div class="movie'+(watched?' watched':'')+'"><button type="button" class="posterButton" data-watch="'+m.id+'" aria-pressed="'+watched+'" aria-label="'+escape(m.title)+(watched?'の記録を解除':'を観たと記録')+'">'+(m.poster?'<img src="'+escape(m.poster)+'" alt="" loading="lazy">':'<div class="placeholder">'+escape(m.title)+'</div>')+'<span class="state">'+(watched?'✓ 観た'+(record.rating?' · '+record.rating:''):'＋ 観た')+'</span><span class="label">'+escape(m.title)+'<span class="meta">'+escape(m.year)+'</span></span></button><a href="'+url(m)+'">作品情報 →</a></div>';
    }).join('');
  }
  function histogram(values) {
    const counts = new Map(); values.filter(Boolean).forEach(v => counts.set(v,(counts.get(v)||0)+1));
    return [...counts].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([v,n])=>'<span class="chip">'+escape(v)+' · '+n+'本</span>').join('');
  }
  function renderDashboard() {
    const metadata = new Map(films.map(x=>[String(x.id),x]));
    const entries = Object.values(store.read()).filter(x=>x?.watched).map(x=>({ ...metadata.get(String(x.id)), ...x, genres:x.genres?.length?x.genres:metadata.get(String(x.id))?.genres||[], region:x.region||metadata.get(String(x.id))?.region||'' })).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    const n = entries.length, rated = entries.filter(x=>x.rating != null).length, best = entries.filter(x=>x.rating===5).length;
    $('dashboardCount').textContent = n + '本記録済み'; $('watchedCount').textContent = n; $('resonatedCount').textContent = rated;
    const genreVariety = new Set(entries.flatMap(x=>x.genres||[])).size;
    const eraVariety = new Set(entries.map(x=>x.year&&Math.floor(x.year/10))).size;
    const directorVariety = new Set(entries.map(x=>x.director).filter(Boolean)).size;
    const stage = n >= 75 && eraVariety >= 3 ? 'majestic' : n >= 10 ? 'life' : 'quiet';
    $('ocean').className = 'ocean ocean--'+stage+(best?' ocean--best':'');
    $('creatures').replaceChildren();
    $('oceanNote').textContent = n ? n+'本の記録 · '+rated+'本を評価'+(best?' · 人生ベスト級 '+best+'本':'') : '最初の一作から、海が少しずつ変わります。';
    const genres = entries.flatMap(x=>Array.isArray(x.genres)?x.genres:[]);
    const years = entries.map(x=>Number(x.year)).filter(x=>x>=1880&&x<=2100).map(x=>Math.floor(x/10)*10+'年代');
    const regions = entries.map(x=>x.region).filter(Boolean);
    const directors = entries.map(x=>x.director).filter(Boolean);
    $('trends').innerHTML = [genres.length?'<div><b>ジャンル</b><div class="chips">'+histogram(genres)+'</div></div>':'', years.length?'<div><b>年代</b><div class="chips">'+histogram(years)+'</div></div>':'', regions.length?'<div><b>地域区分</b><div class="chips">'+histogram(regions)+'</div></div>':'', directors.length?'<div><b>監督</b><div class="chips">'+histogram(directors)+'</div></div>':''].filter(Boolean).join('')||'<span class="empty">作品を記録すると傾向が表示されます。</span>';
    const reached=films.filter(m=>store.get(m)?.watched).length;
    $('coverage').textContent = reached+' / '+films.length+'作品を記録（'+Math.round(reached/films.length*100)+'%）';
    $('missing').innerHTML = films.filter(m=>!store.get(m)?.watched).slice(0,8).map(m=>'<a class="chip" href="'+url(m)+'">'+escape(m.title)+'</a>').join('')||'<span class="empty">選定作品をすべて記録しました。</span>';
    $('entries').innerHTML=entries.map(m=>'<div class="entry">'+(m.poster?'<img src="'+escape(m.poster)+'" alt="" loading="lazy">':'<span></span>')+'<div class="name"><a href="'+url(m)+'">'+escape(m.title||'作品 '+m.id)+'</a><small>'+escape(m.year||'')+'</small></div><button type="button" class="ratingButton" data-rate-movie="'+escape(m.id)+'" aria-label="'+escape(m.title||'作品')+'の評価を設定">'+(m.rating!=null?escape(m.rating)+' ★':'評価する')+'</button><button type="button" data-remove="'+escape(m.id)+'" aria-label="'+escape(m.title||'作品')+'の記録を解除">解除</button></div>').join('')||'<p class="empty">まだ記録がありません。観た映画から始めましょう。</p>';
  }
  document.addEventListener('click', e=>{
    const watched=e.target.closest('[data-watch]'); if(watched){const film=films.find(m=>String(m.id)===watched.dataset.watch);if(film){store.toggleWatched(film);if(store.get(film)?.watched)openRating(film);else if(ratingDock.dataset.movieId===String(film.id))ratingDock.hidden=true;}return;}
    const rating=e.target.closest('[data-rating]'); if(rating){store.setRating({id:ratingDock.dataset.movieId},Number(rating.dataset.rating));ratingDock.hidden=true;return;}
    if(e.target.closest('[data-skip-rating]')){ratingDock.hidden=true;return;}
    if(e.target.closest('[data-clear-rating]')){store.setRating({id:ratingDock.dataset.movieId},null);ratingDock.hidden=true;return;}
    const rateMovie=e.target.closest('[data-rate-movie]');if(rateMovie){const record=store.get({id:rateMovie.dataset.rateMovie});if(record)openRating(record);return;}
    const removed=e.target.closest('[data-remove]');if(removed){store.setWatched({id:removed.dataset.remove},false);if(ratingDock.dataset.movieId===removed.dataset.remove)ratingDock.hidden=true;}
  });
  $('reset').addEventListener('click',()=>{if(confirm('すべての視聴記録を削除しますか？ この操作は元に戻せません。')){store.clear();ratingDock.hidden=true;history.replaceState(null,'','my-records.html?view=add');show();}});
  store.subscribe(show);
  fetch('data/onboarding-films.json?v=20260927-editorial-v2').then(r=>{if(!r.ok)throw Error('catalog');return r.json();}).then(data=>{films=data.films;show();}).catch(()=>{$('loadError').textContent='作品データを読み込めませんでした。再読み込みしてください。';$('dashboard').hidden=false;});
})();
