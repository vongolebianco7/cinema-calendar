(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const store = window.CinemapRecords;
  let films = [];
  let recentId=null,toastTimer=null;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const url = movie => 'search.html?id=' + encodeURIComponent(movie.id) + '&search=' + encodeURIComponent(movie.title);
  const count = () => Object.values(store.read()).filter(x => x?.watched).length;
  const ratedCount = () => Object.values(store.read()).filter(x => x?.watched && x.rating != null).length;
  const format = value => Number(value)===0?'0 · 未鑑賞':Number(value).toFixed(1);
  function ruler(movie, record, compact=false) {
    const score=record?.rating??0, title=escape(movie.title||'作品');
    return '<label class="recordRuler'+(compact?' recordRuler--compact':'')+'"><span class="rulerTop"><span>自分の評価</span><output>'+format(score)+'</output></span><input type="range" min="0" max="5" step="0.1" value="'+score+'" data-rate-id="'+escape(movie.id)+'" aria-label="'+title+'の評価。0は未鑑賞、0より大きい値で記録" /><span class="rulerTicks"><span>0</span><span>2.5</span><span>5.0</span></span></label>';
  }
  window.CinemapRatingRuler = ruler;
  const requestedView = new URLSearchParams(location.search).get('view');
  const addMode = requestedView === 'add' || (requestedView !== 'dashboard' && ratedCount() < 10);
  function show() {
    const add = addMode; $('onboarding').hidden = !add; $('dashboard').hidden = add;
    if (add) renderOnboarding(); else renderDashboard();
  }
  function renderOnboarding() {
    $('onboardCount').textContent = count() + '本記録済み · '+ratedCount()+'本評価済み';
    $('milestone').hidden = ratedCount() < 10;
    $('filmGrid').innerHTML = films.map(m => {
      const record = store.get(m), watched = !!record?.watched;
      return '<div class="movie'+(watched?' watched':'')+'"><div class="posterButton">'+(m.poster?'<img src="'+escape(m.poster)+'" alt="" loading="lazy">':'<div class="placeholder">'+escape(m.title)+'</div>')+'<span class="state">'+(watched?(record.rating==null?'観た · 未評価':Number(record.rating).toFixed(1)):'未登録')+'</span><span class="label">'+escape(m.title)+'<span class="meta">'+escape(m.year)+'</span></span></div>'+ruler(m,record,true)+'<a href="'+url(m)+'">作品情報 →</a></div>';
    }).join('');
  }
  function histogram(values) {
    const counts = new Map(); values.filter(Boolean).forEach(v => counts.set(v,(counts.get(v)||0)+1));
    return [...counts].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([v,n])=>'<span class="chip">'+escape(v)+' · '+n+'本</span>').join('');
  }
  function renderDashboard() {
    const metadata = new Map(films.map(x=>[String(x.id),x]));
    const entries = Object.values(store.read()).filter(x=>x?.watched).map(x=>({ ...metadata.get(String(x.id)), ...x, genres:x.genres?.length?x.genres:metadata.get(String(x.id))?.genres||[], region:x.region||metadata.get(String(x.id))?.region||'' }));
    const n = entries.length, rated = entries.filter(x=>x.rating != null).length;
    $('dashboardCount').textContent = n + '本記録済み'; $('watchedCount').textContent = n; $('resonatedCount').textContent = rated;
    window.CinemapOceanView?.render(films,store.read(),recentId);
    recentId=null;
    const speciesTotals=new Map();
    entries.forEach(m=>{const type=window.CinemapOceanModel.speciesFor(m);speciesTotals.set(type.id,(speciesTotals.get(type.id)||0)+1);});
    $('speciesCount').textContent=speciesTotals.size+' / '+window.CinemapOceanModel.species.length;
    $('speciesCollection').innerHTML=window.CinemapOceanModel.species.map(type=>{
      const total=speciesTotals.get(type.id)||0;
      return '<div class="speciesTile'+(total?'':' locked')+'"><span class="fishIcon" aria-hidden="true" style="--fish-x:'+(type.index%3*50)+'%;--fish-y:'+(Math.floor(type.index/3)*100)+'%"></span><span><strong>'+(total?escape(type.name):'まだ出会っていない')+'</strong><small>'+(total?total+'作品':'')+'</small></span></div>';
    }).join('');
    const genres = entries.flatMap(x=>Array.isArray(x.genres)?x.genres:[]);
    const years = entries.map(x=>Number(x.year)).filter(x=>x>=1880&&x<=2100).map(x=>Math.floor(x/10)*10+'年代');
    const regions = entries.map(x=>x.region).filter(Boolean);
    const directors = entries.map(x=>x.director).filter(Boolean);
    $('trends').innerHTML = [genres.length?'<div><b>ジャンル</b><div class="chips">'+histogram(genres)+'</div></div>':'', years.length?'<div><b>年代</b><div class="chips">'+histogram(years)+'</div></div>':'', regions.length?'<div><b>地域区分</b><div class="chips">'+histogram(regions)+'</div></div>':'', directors.length?'<div><b>監督</b><div class="chips">'+histogram(directors)+'</div></div>':''].filter(Boolean).join('')||'<span class="empty">作品を記録すると傾向が表示されます。</span>';
    const reached=films.filter(m=>store.get(m)?.watched).length;
    $('coverage').textContent = reached+' / '+films.length+'作品を記録（'+Math.round(reached/films.length*100)+'%）';
    $('missing').innerHTML = films.filter(m=>!store.get(m)?.watched).slice(0,8).map(m=>'<a class="chip" href="'+url(m)+'">'+escape(m.title)+'</a>').join('')||'<span class="empty">選定作品をすべて記録しました。</span>';
    const sort=$('historySort').value,filter=$('historyFilter').value;
    const textKey=(m,key)=>String(key==='genre'?m.genres?.[0]||'':m[key]||'');
    const ordered=entries.filter(m=>filter==='all'||(filter==='best'?m.rating===5:Number(m.rating)>=4.5)).sort((a,b)=>{
      if(sort==='rating')return (Number(b.rating)||0)-(Number(a.rating)||0)||String(b.updatedAt||'').localeCompare(String(a.updatedAt||''));
      if(sort==='year')return Number(b.year||0)-Number(a.year||0);
      if(sort==='watched')return String(b.watchedAt||b.recordedAt||'').localeCompare(String(a.watchedAt||a.recordedAt||''));
      if(['director','genre','title'].includes(sort))return textKey(a,sort).localeCompare(textKey(b,sort),'ja');
      return String(b.recordedAt||'').localeCompare(String(a.recordedAt||''));
    });
    $('entries').innerHTML=ordered.map(m=>'<div class="entry">'+(m.poster?'<img src="'+escape(m.poster)+'" alt="" loading="lazy">':'<span></span>')+'<div class="name"><a href="'+url(m)+'">'+escape(m.title||'作品 '+m.id)+'</a><small>'+escape(m.year||'')+(m.director?' · '+escape(m.director):'')+'</small></div>'+ruler(m,m,true)+'<button type="button" data-remove="'+escape(m.id)+'" aria-label="'+escape(m.title||'作品')+'の記録を解除">解除</button></div>').join('')||'<p class="empty">条件に合う記録がありません。</p>';
  }
  document.addEventListener('input',e=>{
    if(!e.target.matches('[data-rate-id]'))return;
    const output=e.target.closest('.recordRuler')?.querySelector('output');
    if(output)output.textContent=format(e.target.value);
  });
  document.addEventListener('change',e=>{
    if(!e.target.matches('[data-rate-id]'))return;
    const id=e.target.dataset.rateId;
    const film=films.find(m=>String(m.id)===id)||store.get({id})||{id};
    const previous=store.read(),knownSpecies=new Set(Object.values(previous).filter(r=>r?.watched).map(r=>window.CinemapOceanModel.speciesFor(films.find(m=>String(m.id)===String(r.id))||r).id));
    const first=!previous[id]?.watched&&Number(e.target.value)>0;
    recentId=first?id:null;
    store.rate(film,Number(e.target.value));
    if(first){
      const species=window.CinemapOceanModel.speciesFor(film);
      if(!knownSpecies.has(species.id)){
        const suggestion=films.find(m=>String(m.id)!==id&&!store.get(m)?.watched&&window.CinemapOceanModel.speciesFor(m).id===species.id);
        const toast=$('speciesToast');
        const shared=species.genres.filter(g=>film.genres?.includes(g));
        toast.textContent='新しい魚種を発見 · '+species.name+' — '+(film.title||'作品')+(shared.length?'。手がかり：'+shared.join('・'):'')+(suggestion?'。同じタイプの未登録候補：'+suggestion.title:'');
        toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true;},5200);
      }
    }
  });
  document.addEventListener('click',e=>{
    const removed=e.target.closest('[data-remove]');if(removed)store.rate({id:removed.dataset.remove},0);
  });
  $('historySort').addEventListener('change',renderDashboard);
  $('historyFilter').addEventListener('change',renderDashboard);
  $('reset').addEventListener('click',()=>{if(confirm('すべての視聴記録を削除しますか？ この操作は元に戻せません。')){store.clear();history.replaceState(null,'','my-records.html?view=add');show();}});
  store.subscribe(show);
  fetch('data/onboarding-films.json?v=20260927-editorial-v2').then(r=>{if(!r.ok)throw Error('catalog');return r.json();}).then(data=>{films=data.films;show();}).catch(()=>{$('loadError').textContent='作品データを読み込めませんでした。再読み込みしてください。';$('dashboard').hidden=false;});
})();
