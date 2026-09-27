(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const store = window.CinemapRecords;
  let films = [];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const url = movie => 'search.html?id=' + encodeURIComponent(movie.id) + '&search=' + encodeURIComponent(movie.title);
  const count = () => Object.values(store.read()).filter(x => x?.watched).length;
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
      const watched = !!store.get(m)?.watched;
      return '<div class="movie'+(watched?' watched':'')+'"><button type="button" class="posterButton" data-watch="'+m.id+'" aria-pressed="'+watched+'" aria-label="'+escape(m.title)+(watched?'の記録を解除':'を観たと記録')+'">'+(m.poster?'<img src="'+escape(m.poster)+'" alt="" loading="lazy">':'<div class="placeholder">'+escape(m.title)+'</div>')+'<span class="state">'+(watched?'✓ 観た':'＋ 観た')+'</span><span class="label">'+escape(m.title)+'<span class="meta">'+escape(m.year)+'</span></span></button><a href="'+url(m)+'">作品情報 →</a></div>';
    }).join('');
  }
  function histogram(values) {
    const counts = new Map(); values.filter(Boolean).forEach(v => counts.set(v,(counts.get(v)||0)+1));
    return [...counts].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([v,n])=>'<span class="chip">'+escape(v)+' · '+n+'本</span>').join('');
  }
  function renderDashboard() {
    const metadata = new Map(films.map(x=>[String(x.id),x]));
    const entries = Object.values(store.read()).filter(x=>x?.watched).map(x=>({ ...metadata.get(String(x.id)), ...x, genres:x.genres?.length?x.genres:metadata.get(String(x.id))?.genres||[], region:x.region||metadata.get(String(x.id))?.region||'' })).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    const n = entries.length, resonated = entries.filter(x=>x.resonated).length;
    $('dashboardCount').textContent = n + '本記録済み'; $('watchedCount').textContent = n; $('resonatedCount').textContent = resonated;
    const genreVariety = new Set(entries.flatMap(x=>x.genres||[])).size;
    const eraVariety = new Set(entries.map(x=>x.year&&Math.floor(x.year/10))).size;
    const directorVariety = new Set(entries.map(x=>x.director).filter(Boolean)).size;
    const ocean = [];
    if (n >= 1) ocean.push('<span class="creature glow" aria-hidden="true">✧ · ✧'+(resonated?' · ✧'.repeat(Math.min(resonated,6)):'')+'</span>');
    if (n >= 10) ocean.push('<span class="creature fish" aria-hidden="true">⋉°</span>');
    if (n >= 25) ocean.push('<span class="creature school" aria-hidden="true">⋉° ⋉° ⋉°</span>');
    if (n >= 40 && genreVariety >= 4) ocean.push('<span class="creature coral" aria-hidden="true">♧ ✧</span>');
    if (n >= 75 && eraVariety >= 3) ocean.push('<span class="creature manta" aria-hidden="true">⌣</span>');
    if (n >= 100 && directorVariety >= 3) ocean.push('<span class="creature whale" aria-hidden="true">◡</span>');
    $('creatures').innerHTML = ocean.join('');
    $('oceanNote').textContent = n ? n+'本の記録と'+resonated+'本の、強く残った映画。' : '最初の一作から、海が少しずつ変わります。';
    const genres = entries.flatMap(x=>Array.isArray(x.genres)?x.genres:[]);
    const years = entries.map(x=>Number(x.year)).filter(x=>x>=1880&&x<=2100).map(x=>Math.floor(x/10)*10+'年代');
    const regions = entries.map(x=>x.region).filter(Boolean);
    const directors = entries.map(x=>x.director).filter(Boolean);
    $('trends').innerHTML = [genres.length?'<div><b>ジャンル</b><div class="chips">'+histogram(genres)+'</div></div>':'', years.length?'<div><b>年代</b><div class="chips">'+histogram(years)+'</div></div>':'', regions.length?'<div><b>地域区分</b><div class="chips">'+histogram(regions)+'</div></div>':'', directors.length?'<div><b>監督</b><div class="chips">'+histogram(directors)+'</div></div>':''].filter(Boolean).join('')||'<span class="empty">作品を記録すると傾向が表示されます。</span>';
    const reached=films.filter(m=>store.get(m)?.watched).length;
    $('coverage').textContent = reached+' / '+films.length+'作品を記録（'+Math.round(reached/films.length*100)+'%）';
    $('missing').innerHTML = films.filter(m=>!store.get(m)?.watched).slice(0,8).map(m=>'<a class="chip" href="'+url(m)+'">'+escape(m.title)+'</a>').join('')||'<span class="empty">選定作品をすべて記録しました。</span>';
    $('entries').innerHTML=entries.map(m=>'<div class="entry">'+(m.poster?'<img src="'+escape(m.poster)+'" alt="" loading="lazy">':'<span></span>')+'<div class="name"><a href="'+url(m)+'">'+escape(m.title||'作品 '+m.id)+'</a><small>'+escape(m.year||'')+'</small></div><button type="button" data-resonate="'+escape(m.id)+'" class="'+(m.resonated?'active':'')+'" aria-pressed="'+!!m.resonated+'">'+(m.resonated?'✦ 刺さった':'◇ 刺さった')+'</button><button type="button" data-remove="'+escape(m.id)+'" aria-label="'+escape(m.title||'作品')+'の記録を解除">解除</button></div>').join('')||'<p class="empty">まだ記録がありません。観た映画から始めましょう。</p>';
  }
  document.addEventListener('click', e=>{
    const watched=e.target.closest('[data-watch]'); if(watched){const film=films.find(m=>String(m.id)===watched.dataset.watch);if(film)store.toggleWatched(film);return;}
    const resonated=e.target.closest('[data-resonate]');if(resonated){store.toggleResonated({id:resonated.dataset.resonate});return;}
    const removed=e.target.closest('[data-remove]');if(removed)store.setWatched({id:removed.dataset.remove},false);
  });
  $('reset').addEventListener('click',()=>{if(confirm('すべての視聴記録を削除しますか？ この操作は元に戻せません。')){store.clear();history.replaceState(null,'','my-records.html?view=add');show();}});
  store.subscribe(show);
  fetch('data/onboarding-films.json').then(r=>{if(!r.ok)throw Error('catalog');return r.json();}).then(data=>{films=data.films;show();}).catch(()=>{$('loadError').textContent='作品データを読み込めませんでした。再読み込みしてください。';$('dashboard').hidden=false;});
})();
