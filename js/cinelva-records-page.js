(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const Records = globalThis.CinelvaLibraryRecords;
  const Insights = globalThis.CinelvaInsights;
  const currentYear = new Date().getFullYear();
  const state = { records: [], movies: [], awards: [], directors: {}, month: new Date().getMonth(), year: currentYear, selected: null, searchToken: 0, plotRotation: { x: -.32, y: -.58 }, plotZoom: 1, plotOffset: { x: 0, y: 0 }, plotPointers: new Map(), plotDrag: null, activeGenre: null, awardSelection: null, awardCoverage: {}, flatWorld: false, keyboardPoint: 0 };
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const byId = new Map();
  const poster = movie => movie.poster || movie.poster_path && `https://image.tmdb.org/t/p/w342${movie.poster_path}` || '';
  const recordMovies = () => state.records.filter(record => record.watched !== false);
  const ratedMovies = () => recordMovies().filter(record => typeof record.rating === 'number');
  const metadataFor = id => byId.get(String(id)) || {};
  const countryAliases = {"united states":"アメリカ","united states of america":"アメリカ","usa":"アメリカ","us":"アメリカ","アメリカ合衆国":"アメリカ","united kingdom":"イギリス","uk":"イギリス","gb":"イギリス","great britain":"イギリス","英国":"イギリス","japan":"日本","jp":"日本","france":"フランス","germany":"ドイツ","italy":"イタリア","spain":"スペイン","canada":"カナダ","australia":"オーストラリア","south korea":"韓国","china":"中国","hong kong":"香港","taiwan":"台湾","india":"インド","brazil":"ブラジル","mexico":"メキシコ","russia":"ロシア","new zealand":"ニュージーランド","sweden":"スウェーデン","denmark":"デンマーク","norway":"ノルウェー","finland":"フィンランド","netherlands":"オランダ","switzerland":"スイス","austria":"オーストリア","ireland":"アイルランド","poland":"ポーランド","argentina":"アルゼンチン","thailand":"タイ","vietnam":"ベトナム","philippines":"フィリピン","indonesia":"インドネシア","turkey":"トルコ","iran":"イラン","israel":"イスラエル","portugal":"ポルトガル","greece":"ギリシャ","belgium":"ベルギー"};
  const countryJP = value => countryAliases[String(value||'').trim().toLowerCase()] || String(value||'').trim();
  const enriched = record => {const metadata=metadataFor(record.id),array=value=>Array.isArray(value)?value:[],countries=array(record.countries).length?array(record.countries):array(metadata.countries).length?array(metadata.countries):(record.region?[record.region]:[]);return {...metadata,...record,countries:[...new Set(countries.filter(country=>typeof country==='string').map(countryJP))],genres:array(record.genres).length?array(record.genres):array(metadata.genres),year:record.year||metadata.year||Number(String(metadata.date||'').slice(0,4))||null,director:record.director||metadata.director||''};};
  const dateOf = record => typeof record.watchedAt === 'string' ? record.watchedAt : '';
  const classificationFor = record => { const movie=enriched(record); const classified=Insights.classifyGenres([...(movie.genres||[]),...(Array.isArray(movie.formats)?movie.formats:[]),...(Array.isArray(movie.workForms)?movie.workForms:[])]);return {...classified,formats:movie.format?[movie.format]:classified.formats,workForms:movie.workForm?[movie.workForm]:classified.workForms}; };
  const formatDate = value => value ? value.replaceAll('-', '.') : '鑑賞日未登録';
  function notify(message) { $('status').textContent = message; }
  function openDialog(record = null) {
    if(record&&globalThis.CinelvaQuickRate?.open){globalThis.CinelvaQuickRate.open(enriched(record));return;}
    state.selected = record ? enriched(record) : null;
    $('dialogTitle').textContent = record ? '鑑賞記録を編集' : '鑑賞を記録';
    $('deleteRecord').hidden = !record;
    $('movieQuery').value = '';
    $('movieResults').replaceChildren();
    $('chosenMovie').textContent = record ? `${record.title}${record.year ? `（${record.year}年）` : ''}` : '作品を検索して選択してください。';
    $('viewingMethod').value=record?.viewingMethod||''; $('recordComment').value=record?.comment||''; $('watchedAt').value = record?.watchedAt || '';
    $('dateHint').textContent = record?.watchedAt ? `現在の鑑賞日：${record.watchedAt}。年だけ・年月だけでも編集可能です。空欄で保存すると日付を削除します。` : '年のみ・年月のみでも保存できます。日付を削除する場合は空欄にしてください。';
    $('movieQuery').parentElement.hidden = Boolean(record);
    $('saveRecord').disabled=false;
    $('rating').value = record?.rating ?? 0;
    $('ratingOut').value = Number($('rating').value).toFixed(1);
    $('recordDialog').showModal();
    if (!record) $('movieQuery').focus();
  }

  // The summary is derived from existing local records; no mock films or invented counts.
  function renderCinemaSummary() {
    const selector=$('csPeriod'); if(!selector)return;
    const all=recordMovies().map(enriched);
    const years=[...new Set(all.map(r=>dateOf(r).slice(0,4)).filter(y=>/^\d{4}$/.test(y)))].sort((a,b)=>Number(b)-Number(a));
    const previous=selector.dataset.initialized==='true'?selector.value:String(currentYear); selector.dataset.initialized='true';
    selector.innerHTML='<option value="all">オールタイム</option>'+[...new Set([String(currentYear),...years])].sort((a,b)=>Number(b)-Number(a)).map(y=>'<option value="'+y+'">'+y+'年</option>').join('');
    selector.value=previous&&[...selector.options].some(o=>o.value===previous)?previous:String(currentYear);
    const period=selector.value, filtered=period==='all'?all:all.filter(r=>dateOf(r).slice(0,4)===period);
    const selectedYear=period==='all'?currentYear:Number(period);
    if(state.year!==selectedYear){state.year=selectedYear;renderYearHeatmap();}
    $('csLifetime').textContent=String(all.length);$('csCount').textContent=String(filtered.length);
    $('csPeriodLabel').textContent=period==='all'?'全期間の鑑賞本数':period+'年の鑑賞本数';
    const prism='<svg class="cs-prism" viewBox="0 0 42 48" aria-hidden="true"><defs><linearGradient id="csFacetA" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f4e7f0"/><stop offset=".48" stop-color="#b6d8df"/><stop offset="1" stop-color="#8f9dc8"/></linearGradient><linearGradient id="csFacetB" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d5e8ee"/><stop offset="1" stop-color="#9cabc9"/></linearGradient></defs><path d="M21 2 37 10v28L21 46 5 38V10Z" fill="#b5c5da" stroke="#e2e5ef" stroke-width="1.1"/><path d="M21 2 37 10 21 18 5 10Z" fill="#e7dce9"/><path d="M5 10 21 18v28L5 38Z" fill="url(#csFacetA)"/><path d="M37 10 21 18v28l16-8Z" fill="url(#csFacetB)"/><path d="M21 2v16M5 10l16 8 16-8M21 18v28" stroke="#f4f4f8" stroke-width=".9" fill="none"/><path d="M10 15v19M33 14v20" stroke="#fff" stroke-opacity=".3" stroke-width=".8"/></svg>';
    $('csPrisms').innerHTML=prism.repeat(Math.floor(all.length/1000));
    const achieved=Math.floor(all.length%1000/100);
    $('csCrowns').innerHTML=Array.from({length:10},(_,i)=>'<svg class="cs-crown" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 16 2 5l6 5 3-7 3 7 6-5-1 11ZM3 19h16" fill="none" stroke="'+(i<achieved?'#d9bd7f':'#66737d')+'" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>').join('');
    const counts=new Map();all.forEach(r=>{const y=dateOf(r).slice(0,4);if(/^\d{4}$/.test(y))counts.set(y,(counts.get(y)||0)+1)});
    const max=Math.max(1,...counts.values());
    $('csYears').innerHTML=[...counts.keys()].sort().map(y=>'<div class="cs-year '+(y===period?'active':'')+'"><span>'+counts.get(y)+'</span><i class="bar" style="height:'+Math.max(2,Math.round(counts.get(y)/max*65))+'px"></i><span>'+y+'</span></div>').join('')||'<span class="cs-empty">鑑賞年の記録なし</span>';
    const top=filtered.filter(r=>Number(r.rating)>0&&Number(r.rating)<=5).sort((a,b)=>Number(b.rating)-Number(a.rating)||dateOf(b).localeCompare(dateOf(a))).slice(0,10);
    $('csTop').innerHTML=top.length?top.map((r,i)=>{const src=poster(r);return '<div class="cs-film">'+(src?'<img src="'+escapeHTML(src)+'" alt="'+escapeHTML(r.title||'')+'" loading="lazy">':'<div class="cs-poster-empty">ポスターなし</div>')+'<div class="cs-film-name" title="'+escapeHTML(r.title)+'">'+(i+1)+'. '+escapeHTML(r.title)+'</div><div class="cs-score">★ '+Number(r.rating).toFixed(1)+'</div></div>'}).join(''):'<p class="cs-empty" style="grid-column:1/-1">評価済みの作品はありません。</p>';
    const renderRows=(id,items,colors)=>{const max=Math.max(1,...items.map(x=>x[1]));$(id).innerHTML=items.length?items.map(([name,count],i)=>'<div class="cs-row"><span>'+escapeHTML(name)+'</span><div class="cs-track"><i style="width:'+(count/max*100)+'%;background:'+colors[i%colors.length]+'"></i></div><span class="cs-count">'+count+'</span></div>').join(''):'<p class="cs-empty">集計できる記録がありません。</p>'};
    const genreCounts=new Map(),countryCounts=new Map(),methodCounts=new Map(),decades=new Map();
    filtered.forEach(r=>{
      for(const g of new Set(Insights.classifyGenres(r.genres||[]).genres))genreCounts.set(g,(genreCounts.get(g)||0)+1);
      for(const c of new Set(r.countries||[]))countryCounts.set(c,(countryCounts.get(c)||0)+1);
      const method=String(r.viewingMethod||'').trim()||'不明';methodCounts.set(method,(methodCounts.get(method)||0)+1);
      const release=Number(r.year);if(release>=1880&&release<=2100){const d=Math.floor(release/10)*10;decades.set(d,(decades.get(d)||0)+1)}
    });
    const sorted=m=>[...m].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ja'));
    const palettes=[['#4b92cf','#81b7e0','#b0d4ed','#285b8d','#d3e6f4','#6383b4','#9db9d5','#456477'],['#b88a50','#e2bf79','#8b693f','#efd9a5','#aa7e69','#c9a478','#725638','#d9c7ad'],['#9b79b5','#c2a0d8','#6f558f','#e1c9ed','#b48da4','#86649b','#d2b7dc','#a9a0bf'],['#429d91','#8fc9b8','#2d736f','#b8dfcc','#74b4a1','#588b80','#c9e8db','#83a8a2']];
    function renderDonut(id,entries,multi=false){
      const palette=palettes[['csGenres','csCountries','csDecades','csMethods'].indexOf(id)]||palettes[0];
      const host=$(id),all=sorted(entries),total=all.reduce((sum,item)=>sum+item[1],0);
      if(!total){host.innerHTML='<p class="cs-empty">集計できる記録がありません。</p>';return;}
      const visible=all.slice(0,7),other=all.slice(7).reduce((sum,item)=>sum+item[1],0);
      if(other)visible.push(['その他',other]);
      let cursor=0;
      const stops=visible.map(([,n],i)=>{const from=cursor;cursor+=n/total*100;return palette[i%palette.length]+' '+from.toFixed(3)+'% '+cursor.toFixed(3)+'%';});
      const legend=visible.map(([name,n],i)=>'<div class="cs-donut-legend-row"><i class="cs-donut-dot" style="background:'+palette[i%palette.length]+'"></i><span class="cs-donut-label">'+escapeHTML(String(name))+'</span><span class="cs-donut-value">'+Math.round(n/total*100)+'%</span></div>').join('');
      host.innerHTML='<div class="cs-donut-layout"><div class="cs-donut" role="img" aria-label="'+escapeHTML(visible.map(([name,n])=>name+' '+n+'件').join('、'))+'" style="background:conic-gradient('+stops.join(',')+')"></div><div class="cs-donut-legend">'+legend+'</div>'+(multi?'<div class="cs-donut-note">複数ジャンルを含む登録件数の構成比</div>':'')+'</div>';
    }
    renderDonut('csGenres',genreCounts,true);
    renderDonut('csCountries',countryCounts);
    renderDonut('csDecades',new Map([...decades].map(([year,count])=>[year+'年代',count])));
    renderDonut('csMethods',methodCounts);
  }

  function renderStats() {
    const records = recordMovies();
    const rated = records; // Older unrated records are displayed as zero without rewriting storage.
    const yearCount = records.filter(item => dateOf(item).slice(0, 4) === String(currentYear)).length;
    const japan = records.filter(item => {
      const countries = enriched(item).countries || [];
      return countries.some(country => ['日本', 'Japan', 'JP'].includes(country));
    }).length;
    const foreign = records.filter(item => {
      const countries = enriched(item).countries || [];
      return countries.length > 0 && !countries.some(country => ['日本', 'Japan', 'JP'].includes(country));
    }).length;
    $('statTotal').textContent = records.length.toLocaleString('ja-JP');
    $('statYear').textContent = yearCount.toLocaleString('ja-JP');
    $('statAverage').textContent = rated.length ? (rated.reduce((sum, item) => sum + (item.rating ?? 0), 0) / rated.length).toFixed(1) : '—';
    $('statOrigin').textContent = `${japan} / ${foreign}`;
    renderAnnualComparison();
    renderCinemaSummary();
  }
  function renderAnnualComparison() {
    const counts = new Map();
    for (const item of recordMovies()) {
      const match = dateOf(item).match(/^(\d{4})(?:-|$)/);
      if (match) counts.set(Number(match[1]), (counts.get(Number(match[1])) || 0) + 1);
    }
    const years = [...counts.keys()].sort((a, b) => b - a);
    const target = $('annualComparison');
    if (!target) return;
    if (!years.length) { target.innerHTML = '<p class="hint">鑑賞年が分かる記録はまだありません。</p>'; return; }
    const maximum = Math.max(...counts.values(), 1);
    target.innerHTML = `<table aria-label="年間鑑賞本数"><thead><tr><th>年</th><th>鑑賞本数</th></tr></thead><tbody>${years.map(year => {
      const count = counts.get(year), width = Math.round(count / maximum * 100);
      return `<tr><th scope="row"><button class="button" data-calendar-year="${year}">${year}年</button></th><td><div class="annual-count"><span>${count}本</span><span class="annual-bar" aria-hidden="true" style="width:${width}%"></span></div></td></tr>`;
    }).join('')}</tbody></table>`;
  }
  function posterHTML(movie) {
    const source = poster(movie);
    return `<div class="poster">${source ? `<img src="${escapeHTML(source)}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false">` : ''}<span ${source ? 'hidden' : ''}>${escapeHTML(movie.title || '作品画像なし')}</span></div>`;
  }
  function card(movie) {
    return `<article class="movie" data-record-card="${escapeHTML(movie.id)}">${posterHTML(movie)}<strong>${escapeHTML(movie.title)}</strong><small>${escapeHTML(movie.year || '公開年不明')} · ${escapeHTML(formatDate(dateOf(movie)))}</small><small class="score ${Number(movie.rating)>=4?'high-rating':''}">★ ${Number(movie.rating ?? 0).toFixed(1)}</small>${movie.viewingMethod?'<small>'+escapeHTML(movie.viewingMethod)+'</small>':''}${movie.comment?'<p class="record-comment">'+escapeHTML(movie.comment)+'</p>':''}<div class="record-actions"><button data-edit="${escapeHTML(movie.id)}">編集</button><button data-delete="${escapeHTML(movie.id)}">削除</button></div></article>`;
  }
  const normalizeRecordSearch = value => String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
  function renderList() {
    const query = normalizeRecordSearch($('recordSearch').value);
    const year = $('recordYear').value;
    const sort = $('recordSort').value;
    let rows = recordMovies().map(enriched).filter(item => (!query || [item.title, item.original_title, item.originalTitle, item.director].some(value => normalizeRecordSearch(value).includes(query))) && (year === 'all' || dateOf(item).slice(0, 4) === year));
    const userScore=m=>Number(m.vote_average??m.voteAverage??m.tmdbRating??m.score??metadataFor(m.id).vote_average??metadataFor(m.id).score??-1);
    const release=m=>String(m.release_date||m.releaseDate||m.date||m.year||'');
    rows.sort(sort==='userRating'?(a,b)=>userScore(b)-userScore(a)||a.title.localeCompare(b.title,'ja'):sort==='releaseNew'?(a,b)=>release(b).localeCompare(release(a)):sort==='releaseOld'?(a,b)=>release(a).localeCompare(release(b)):sort === 'title' ? (a, b) => a.title.localeCompare(b.title, 'ja') : sort === 'rating' ? (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || dateOf(b).localeCompare(dateOf(a)) : (a, b) => dateOf(b).localeCompare(dateOf(a)) || a.title.localeCompare(b.title, 'ja'));
    $('recordList').innerHTML = rows.length ? rows.map(card).join('') : `<div class="empty" style="grid-column:1/-1"><strong>${recordMovies().length ? '条件に合う鑑賞記録はありません。' : 'ここから、映画の記録がはじまります。'}</strong><p>作品検索から鑑賞日と評価を保存できます。</p><a class="button primary" href="../search.html">映画を検索して記録</a></div>`;
  }
  const TAB_STORAGE_KEY = 'cinelva-active-tab-v1';
  function setTab(tab) {
    const tabs = [...document.querySelectorAll('.tab[data-tab]')];
    if (tab === 'calendar') tab = 'summary';
    if (!tabs.some(button => button.dataset.tab === tab) || !$(tab + 'View')) return;
    try { sessionStorage.setItem(TAB_STORAGE_KEY, tab); } catch (_) { /* Storage may be unavailable. */ }
    document.querySelectorAll('.tab').forEach(button => button.setAttribute('aria-selected', String(button.dataset.tab === tab)));
    document.querySelectorAll('.view').forEach(section => { section.hidden = section.id !== tab + 'View'; });
    if (tab === 'world') drawWorld();
    if (tab === 'genres') renderGenres();
    if (tab === 'awards') renderAwards();
    if (tab === 'directors') renderDirectors();
  }
  function populateYears() {
    const years = [...new Set(recordMovies().map(dateOf).filter(value => /^\d{4}/.test(value)).map(value => value.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
    $('recordYear').innerHTML = '<option value="all">すべての年</option>' + years.map(year => `<option>${year}</option>`).join('');
    const releaseYears = [...new Set(recordMovies().map(enriched).map(record => record.year).filter(year => Number.isFinite(Number(year))).map(Number))].sort((a, b) => b - a);
    $('worldYear').innerHTML = '<option value="all">すべて</option>' + releaseYears.map(year => `<option>${year}</option>`).join('');
    const genres = Insights.GENRE_TAXONOMY.filter(genre => recordMovies().some(record => recordGenres(record).includes(genre)));
    $('worldGenre').innerHTML = '<option value="all">すべて</option>' + genres.map(genre => `<option>${escapeHTML(genre)}</option>`).join('');
    const countries = [...new Set(recordMovies().flatMap(record => enriched(record).countries || []).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja'));
    $('worldCountry').innerHTML = '<option value="all">すべて</option>' + countries.map(country => `<option>${escapeHTML(country)}</option>`).join('');
  }
  function renderCalendar() {
    const records=recordMovies().map(enriched), dates=new Map();
    for(const r of records){const date=dateOf(r);if(/^\d{4}-\d{2}-\d{2}$/.test(date))dates.set(date,[...(dates.get(date)||[]),r]);}
    const sorted=[...dates.keys()].sort();
    const latest=new Date();
    const earliest=sorted.length?new Date(sorted[0]+'T12:00:00'):new Date(latest);
    const start=new Date(earliest);start.setDate(start.getDate()-start.getDay());
    const end=new Date(latest);end.setDate(end.getDate()+(6-end.getDay()));
    const weeks=[];for(let cursor=new Date(end);cursor>=start;cursor.setDate(cursor.getDate()-7)){const sunday=new Date(cursor);sunday.setDate(sunday.getDate()-6);weeks.push(new Date(sunday));}
    const mode=$('calendarMode')?.value||'count';
    $('calendarMonth').textContent=sorted.length?sorted[0].slice(0,4)+'〜'+String(latest.getFullYear())+'年':'鑑賞履歴';
    const dayNames=['日','月','火','水','木','金','土'];
    const rows=weeks.map(week=>{
      const cells=Array.from({length:7},(_,i)=>{
        const day=new Date(week);day.setDate(day.getDate()+i);
        const iso=day.getFullYear()+'-'+String(day.getMonth()+1).padStart(2,'0')+'-'+String(day.getDate()).padStart(2,'0');
        const films=dates.get(iso)||[],n=films.length,average=n?films.reduce((a,r)=>a+Number(r.rating||0),0)/n:0;
        const cinema=films.filter(r=>r.viewingMethod==='映画館').length,stream=films.filter(r=>r.viewingMethod==='配信').length;
        const detail=mode==='date'?String(day.getDate()):mode==='rating'?(n?'★'+average.toFixed(1):''):mode==='method'?(n?cinema+'館/'+stream+'配':''):(n?String(n):'');
        const level=n?Math.min(4,n):0;
        return '<button class="cw-day'+(n?' has-film':'')+'" data-date="'+iso+'" data-count="'+n+'" data-level="'+level+'" title="'+iso+'：'+n+'本" aria-label="'+iso+'、'+n+'本"><span class="cw-date">'+(day.getMonth()+1)+'/'+day.getDate()+'</span><span class="cw-value">'+escapeHTML(detail)+'</span></button>';
      }).join('');
      return '<div class="cw-week"><span class="cw-week-label">'+(week.getMonth()+1)+'/'+week.getDate()+'〜</span>'+cells+'</div>';
    }).join('');
    $('calendar').innerHTML='<div class="cw-history"><div class="cw-week cw-weekdays"><span></span>'+dayNames.map(x=>'<span>'+x+'</span>').join('')+'</div>'+rows+'</div>';
    $('monthPrev').hidden=true;$('monthNext').hidden=true;
    renderYearHeatmap();
  }
  function syncCalendarYear(){const period=$('csPeriod');if(period){const year=String(state.year);if(![...period.options].some(option=>option.value===year))period.add(new Option(year+'年',year));period.value=year;renderCinemaSummary();}renderYearHeatmap();}
  function renderYearHeatmap() {
    const year=state.year, records=recordMovies(), daily=new Map(), monthly=Array(12).fill(0);
    for(const item of records){
      const date=dateOf(item); if(!date.startsWith(String(year)))continue;
      const month=Number(date.slice(5,7))-1;
      if(month>=0&&month<12)monthly[month]++;
      if(/^\d{4}-\d{2}-\d{2}$/.test(date))daily.set(date,(daily.get(date)||0)+1);
    }
    $('yearHeatmapTitle').textContent='年間鑑賞カレンダー';
    const yearSelect=$('calendarYearSelect');
    if(yearSelect){const years=[...new Set([currentYear,state.year,...recordMovies().map(r=>Number(dateOf(r).slice(0,4))).filter(y=>y>=1900&&y<=2100)])].sort((a,b)=>b-a);yearSelect.innerHTML=years.map(y=>'<option value="'+y+'">'+y+'年</option>').join('');yearSelect.value=String(state.year);}
    $('yearHeatmap').classList.add('cinelva-annual-calendar');
    const medal='<span class="cy-medal" aria-label="金メダル"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="m9 10-2 11 5-3 5 3-2-11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg><span>GOLD</span></span>';
    $('yearHeatmap').innerHTML=monthly.map((count,m)=>{
      const first=new Date(year,m,1).getDay(),length=new Date(year,m+1,0).getDate();
      const cells=Array.from({length:first},()=>'<span class="cy-empty" aria-hidden="true"></span>');
      for(let d=1;d<=length;d++){
        const date=year+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
        const n=daily.get(date)||0;
        cells.push('<button class="cy-day'+(n?' watched':'')+'" data-date="'+date+'" title="'+date+'：'+n+'本" aria-label="'+date+'、'+n+'本" style="--cy-intensity:'+Math.min(1,.28+n*.16)+'"></button>');
      }
      const achieved=count>=10;
      const tone=achieved?'gold-month':count===0?'empty-month':count>=7?'deep-month':count>=4?'mid-month':'light-month';
      return '<section class="cy-month '+tone+'" aria-label="'+(m+1)+'月 '+count+'本"><button class="cy-month-head" data-calendar-month="'+m+'"><span class="cy-month-name">'+(m+1)+'月</span><span class="cy-month-total"><strong>'+count+'</strong><small>本</small></span>'+(achieved?medal:'')+'</button><div class="cy-dots">'+cells.join('')+'</div></section>';
    }).join('');
    $('yearHeatmap').setAttribute('aria-label',year+'年の年間鑑賞カレンダー');
  }
  function renderDateFilms(date) {
    const rows = recordMovies().filter(item => dateOf(item) === date);
    $('calendarFilms').innerHTML = rows.length ? `<strong>${date} · ${rows.length}本</strong><div class="record-grid">${rows.map(enriched).map(card).join('')}</div>` : '<span class="hint">この日の鑑賞記録はありません。</span>';
  }
  const GENRE_COLORS = ['#f4b266','#6dd3ba','#86bfff','#d795ec','#f27f87','#e8d574','#72c7ed','#bdad93','#97d590','#ec9ac4','#e7a77a','#a4b7ef','#b2d36f','#e6a5a5','#bed9d4'];
  function recordGenres(record) { return Insights.classifyGenres(enriched(record).genres).genres; }
  function classifiedRecords() {
    const format=$('genreFormat').value, form=$('genreWorkForm').value;
    return recordMovies().map(enriched).filter(record=>{const c=classificationFor(record);return (format==='all'||(format==='unknown'?!c.formats.length:c.formats.includes(format)))&&(form==='all'||(form==='unknown'?!c.workForms.length:c.workForms.includes(form)));});
  }
  function renderClassifications(rows) {
    const countBy=get=>{const map=new Map();for(const row of rows)for(const name of new Set(get(row)))map.set(name,(map.get(name)||0)+1);return [...map].sort((a,b)=>b[1]-a[1]);};
    const groups=[['表現形式',row=>classificationFor(row).formats.length?classificationFor(row).formats:['形式不明']],['作品形式',row=>classificationFor(row).workForms.length?classificationFor(row).workForms:['形式不明']],['製作国・地域',row=>row.countries?.length?row.countries:['国不明']],['公開年代',row=>[row.year?`${Math.floor(Number(row.year)/10)*10}年代`:'公開年不明']],['上映時間',row=>[Number(row.runtime)>0?(Number(row.runtime)<=90?'90分以内':Number(row.runtime)<=120?'91〜120分':Number(row.runtime)<=150?'121〜150分':'151分以上'):'時間不明']]];
    $('classificationSummary').innerHTML=groups.map(([label,get])=>`<div class="breakdown"><strong>${label}</strong>${countBy(get).map(([name,count])=>`${escapeHTML(name)} ${count}本`).join('<br>')}</div>`).join('');
  }
  function renderGenres() {
    const rows = classifiedRecords(), names = Insights.GENRE_TAXONOMY, genreSets=rows.map(record=>new Set(recordGenres(record)));
    const counts = Object.fromEntries(names.map(name => [name, 0]));
    for (const record of rows) for (const name of recordGenres(record)) counts[name]++;
    const html = `<table><thead><tr><th>ジャンル</th>${names.map(name => `<th>${escapeHTML(name)}</th>`).join('')}</tr></thead><tbody>` + names.map((name, i) => `<tr><th><button data-genre="${escapeHTML(name)}">${escapeHTML(name)} · ${counts[name]}</button></th>${names.map((other, j) => { const overlap = genreSets.filter(genres=>genres.has(name)&&genres.has(other)).length; return `<td><button class="heat-${Math.min(4, overlap)}" data-genre-pair="${escapeHTML(name)}|${escapeHTML(other)}" aria-label="${escapeHTML(name)}と${escapeHTML(other)}の重なり ${overlap}本">${overlap || '·'}</button></td>`; }).join('')}</tr>`).join('') + '</tbody></table>';
    $('genreMatrix').innerHTML = html; renderClassifications(rows);
    const unclassified = rows.filter(record => !recordGenres(record).length).length;
    $('genreSummary').innerHTML = `<span class="chip">分類可能 ${rows.length - unclassified}本</span><span class="chip">未分類 ${unclassified}本</span><span class="chip">数字は交差する作品数</span>`;
    renderGenreFilms(state.activeGenre);
  }
  function renderGenreFilms(genre) {
    state.activeGenre = genre;
    const rows = classifiedRecords().filter(record => !genre || recordGenres(record).includes(genre));
    $('genreFilms').innerHTML = rows.length ? rows.map(card).join('') : '<div class="empty" style="grid-column:1/-1">このジャンルの鑑賞記録はありません。</div>';
  }
  function renderAwards() {
    const data = Insights.buildAwardHeatmap(recordMovies().map(enriched), state.awards, state.awardCoverage);
    const decades = [...new Set([...data.decades,1950,1960,1970,1980,1990,2000,2010,2020])].sort((a,b)=>a-b);
    const hasRate=Object.values(data.cells).some(cell=>cell.completionRate!==null);
    $('awardMode').querySelector('[value="rate"]').disabled=!hasRate;
    if(!hasRate)$('awardMode').value='count';
    const rate=$('awardMode').value==='rate';
    $('awardCoverage').textContent=`作品数を表示しています。収録は一部の主要賞と確認可能な授賞記録に限られます。${hasRate?'対象作品を全件確認できたセルのみ達成率を表示できます。':'対象作品の全件性を確認できないため達成率は表示しません。'} — は受賞データ未収録、0は収録範囲での鑑賞0本です。`;
    $('awardMatrix').innerHTML=`<table><thead><tr><th>映画賞 · 授賞年</th>${decades.map(d=>`<th>${d}年代</th>`).join('')}</tr></thead><tbody>${data.organizations.map(name=>`<tr><th>${escapeHTML(name)}</th>${decades.map(decade=>{const cell=data.cells[`${name}:${decade}`];if(!cell)return '<td><span class="hint" aria-label="受賞データ未収録">—</span></td>';const value=rate?(cell.completionRate===null?'—':`${Math.round(cell.completionRate*100)}%`):cell.count;return `<td><button class="award-cell heat-${rate?Math.ceil((cell.completionRate||0)*4):Math.min(4,cell.count)}" data-award-cell="${escapeHTML(name)}|${decade}" aria-label="${escapeHTML(name)}、${decade}年代、鑑賞済み受賞作品${cell.count}本">${value}</button></td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
    const cell=state.awardSelection&&data.cells[`${state.awardSelection.organization}:${state.awardSelection.decade}`];
    const awardHeading=state.awardSelection?'<div class="award-detail-head"><h3>'+escapeHTML(state.awardSelection.organization)+'・'+state.awardSelection.decade+'年代</h3><p>受賞作品の鑑賞状況</p></div>':'';
    const awardEntries=cell?[...cell.entries].sort((a,b)=>Number(a.watched)-Number(b.watched)):null;
    $('awardFilms').innerHTML=cell?awardHeading+awardEntries.map(entry=>`<article class="panel"><strong>${escapeHTML(entry.title)}</strong><p><span class="award-watch-state ${entry.watched?'is-watched':'is-unwatched'}">${entry.watched?'✓ 鑑賞済み':entry.id?'○ 未鑑賞':'? 鑑賞状況未確認'}</span> · 授賞年 ${entry.awardYears.join('・')}</p><p class="hint">${escapeHTML(entry.categories.join('・'))}</p>${entry.id?`<button class="button" data-award-film="${escapeHTML(entry.id)}">一覧で評価する</button>`:''}${entry.sources.map(url=>` <a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">受賞の出典</a>`).join('')}</article>`).join(''):'<p class="hint" style="grid-column:1/-1">セルを選ぶと収録済みの受賞作品と鑑賞状況を確認できます。作品IDがない受賞記録は照合保留です。</p>';
  }
  const normalizeName = value => String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
  const directorJapaneseNames = new Map([["christopher nolan","クリストファー・ノーラン"],["steven spielberg","スティーヴン・スピルバーグ"],["martin scorsese","マーティン・スコセッシ"],["quentin tarantino","クエンティン・タランティーノ"],["david fincher","デヴィッド・フィンチャー"],["denis villeneuve","ドゥニ・ヴィルヌーヴ"],["james cameron","ジェームズ・キャメロン"],["ridley scott","リドリー・スコット"],["stanley kubrick","スタンリー・キューブリック"],["wes anderson","ウェス・アンダーソン"],["greta gerwig","グレタ・ガーウィグ"],["bong joon-ho","ポン・ジュノ"],["park chan-wook","パク・チャヌク"],["hayao miyazaki","宮崎駿"],["akira kurosawa","黒澤明"],["hirokazu kore-eda","是枝裕和"],["makoto shinkai","新海誠"],["yorgos lanthimos","ヨルゴス・ランティモス"],["guillermo del toro","ギレルモ・デル・トロ"],["alfonso cuarón","アルフォンソ・キュアロン"],["paul thomas anderson","ポール・トーマス・アンダーソン"],["francis ford coppola","フランシス・フォード・コッポラ"],["sofia coppola","ソフィア・コッポラ"],["clint eastwood","クリント・イーストウッド"],["tim burton","ティム・バートン"],["peter jackson","ピーター・ジャクソン"],["george lucas","ジョージ・ルーカス"],["rian johnson","ライアン・ジョンソン"],["damien chazelle","デイミアン・チャゼル"],["robert zemeckis","ロバート・ゼメキス"]]);
  for(const [en,ja] of Object.entries({
    "jordan peele":"ジョーダン・ピール","ari aster":"アリ・アスター","robert eggers":"ロバート・エガース","jordan vogt-roberts":"ジョーダン・ヴォート＝ロバーツ",
    "sam mendes":"サム・メンデス","danny boyle":"ダニー・ボイル","david lynch":"デヴィッド・リンチ","david cronenberg":"デヴィッド・クローネンバーグ",
    "david o. russell":"デヴィッド・O・ラッセル","alex garland":"アレックス・ガーランド","jonathan glazer":"ジョナサン・グレイザー",
    "taika waititi":"タイカ・ワイティティ","james gunn":"ジェームズ・ガン","james wan":"ジェームズ・ワン",
    "chloe zhao":"クロエ・ジャオ","chloé zhao":"クロエ・ジャオ","barry jenkins":"バリー・ジェンキンス",
    "ryusuke hamaguchi":"濱口竜介","takashi miike":"三池崇史","takeshi kitano":"北野武","isao takahata":"高畑勲",
    "satoshi kon":"今敏","mamoru hosoda":"細田守","mamoru oshii":"押井守","hideaki anno":"庵野秀明",
    "naoko yamada":"山田尚子","kore-eda hirokazu":"是枝裕和","shunji iwai":"岩井俊二",
    "akira kurosawa":"黒澤明","yasujiro ozu":"小津安二郎","yasujirō ozu":"小津安二郎",
    "masaki kobayashi":"小林正樹","kenji mizoguchi":"溝口健二","nagisa oshima":"大島渚",
    "terry gilliam":"テリー・ギリアム","terry george":"テリー・ジョージ","michael mann":"マイケル・マン",
    "michael bay":"マイケル・ベイ","michael haneke":"ミヒャエル・ハネケ","lars von trier":"ラース・フォン・トリアー",
    "pedro almodóvar":"ペドロ・アルモドバル","pedro almodovar":"ペドロ・アルモドバル",
    "alejandro gonzález iñárritu":"アレハンドロ・ゴンサレス・イニャリトゥ",
    "alejandro gonzalez inarritu":"アレハンドロ・ゴンサレス・イニャリトゥ",
    "ang lee":"アン・リー","wong kar-wai":"ウォン・カーウァイ","wong kar wai":"ウォン・カーウァイ",
    "john woo":"ジョン・ウー","zhang yimou":"チャン・イーモウ","zhang yì móu":"チャン・イーモウ",
    "bong joon ho":"ポン・ジュノ","park chan wook":"パク・チャヌク",
    "joel coen":"ジョエル・コーエン","ethan coen":"イーサン・コーエン",
    "coen brothers":"コーエン兄弟","the wachowskis":"ウォシャウスキー姉妹",
    "lana wachowski":"ラナ・ウォシャウスキー","lilly wachowski":"リリー・ウォシャウスキー",
    "greta gerwig":"グレタ・ガーウィグ","noah baumbach":"ノア・バームバック",
    "richard linklater":"リチャード・リンクレイター","robert altman":"ロバート・アルトマン",
    "brian de palma":"ブライアン・デ・パルマ","brian de palma":"ブライアン・デ・パルマ",
    "oliver stone":"オリバー・ストーン","ron howard":"ロン・ハワード","rob reiner":"ロブ・ライナー",
    "john carpenter":"ジョン・カーペンター","wes craven":"ウェス・クレイヴン",
    "j.j. abrams":"J・J・エイブラムス","j. j. abrams":"J・J・エイブラムス",
    "m. night shyamalan":"M・ナイト・シャマラン","m night shyamalan":"M・ナイト・シャマラン",
    "jon favreau":"ジョン・ファヴロー","peter weir":"ピーター・ウィアー",
    "edgar wright":"エドガー・ライト","guy ritchie":"ガイ・リッチー","matthew vaughn":"マシュー・ヴォーン",
    "joe wright":"ジョー・ライト","joe russo":"ジョー・ルッソ","anthony russo":"アンソニー・ルッソ",
    "brad bird":"ブラッド・バード","pete docter":"ピート・ドクター","andrew stanton":"アンドリュー・スタントン",
    "lee unkrich":"リー・アンクリッチ","john lasseter":"ジョン・ラセター",
    "charlie kaufman":"チャーリー・カウフマン","spike jonze":"スパイク・ジョーンズ",
    "spike lee":"スパイク・リー","jane campion":"ジェーン・カンピオン",
    "kathryn bigelow":"キャスリン・ビグロー","patty jenkins":"パティ・ジェンキンス",
    "luc besson":"リュック・ベッソン","jean-pierre jeunet":"ジャン＝ピエール・ジュネ",
    "michel gondry":"ミシェル・ゴンドリー","olivier nakache":"オリヴィエ・ナカシュ",
    "asghar farhadi":"アスガー・ファルハディ","abbas kiarostami":"アッバス・キアロスタミ",
    "andrei tarkovsky":"アンドレイ・タルコフスキー","ingmar bergman":"イングマール・ベルイマン",
    "federico fellini":"フェデリコ・フェリーニ","sergio leone":"セルジオ・レオーネ",
    "alfred hitchcock":"アルフレッド・ヒッチコック","billy wilder":"ビリー・ワイルダー",
    "orson welles":"オーソン・ウェルズ","charlie chaplin":"チャールズ・チャップリン"
  })) directorJapaneseNames.set(en,ja);
  let directorAliasSource=null;
  let directorAliases=new Map();
  const directorJapanese = name => {
    const raw=String(name||'').trim();
    if(state.directors!==directorAliasSource){
      directorAliasSource=state.directors;
      directorAliases=new Map();
      for(const d of Object.values(state.directors||{})){
        const ja=d.nameJa||d.name_ja||d.japanese_name||directorJapaneseNames.get(String(d.name||'').toLowerCase())||d.name;
        if(!ja)continue;
        for(const alias of [d.name,d.nameJa,d.name_ja,d.japanese_name]){
          if(alias)directorAliases.set(normalizeName(alias),ja);
        }
      }
    }
    return directorAliases.get(normalizeName(raw))||directorJapaneseNames.get(raw.toLowerCase())||raw;
  };
  const isDirectorCredit = (work, directorName) => {
    if (!work || typeof work !== 'object') return false;
    const title=String(work.title||work.name||work.original_title||'').trim();
    const original=String(work.original_title||'').trim();
    const titleText=(title+' '+original).toLowerCase();
    // These are standalone feature-film directorographies, not all person credits.
    if (/cinema\s*16\b|short\s*films?|shorts?\s*collection|anthology|compilation|behind.the.scenes|making.of|メイキング|短編|短篇|総集編|オムニバス/i.test(titleText)) return false;
    const genres=[...(Array.isArray(work.genres)?work.genres:[]),...(Array.isArray(work.genre_names)?work.genre_names:[])].map(g=>typeof g==='string'?g:g?.name||'').join(' ').toLowerCase();
    if (/\bshort\b|短編|短篇/.test(genres)) return false;
    if ([work.is_short,work.isShort,work.short_film,work.shortFilm].some(x=>x===true)) return false;
    const duration=Number(work.runtime??work.duration??work.length_minutes??work.runtime_minutes);
    if (Number.isFinite(duration)&&duration>0&&duration<60) return false;
    const type=String(work.type||work.media_type||work.format||'').toLowerCase();
    if (/\bshort\b|短編|短篇|\btv\b|\btv_series\b|\bepisode\b/.test(type)) return false;
    if (work.cast===true||work.actor===true||work.self===true||work.is_director===false||work.isDirector===false) return false;
    const role=String(work.job||work.role||work.credit_type||work.creditType||'').trim().toLowerCase();
    if (role && !['director','監督'].includes(role)) return false;
    const department=String(work.department||'').trim().toLowerCase();
    if (department && !['directing','監督'].includes(department)) return false;
    const named=String(work.director||work.director_name||work.directorName||'').trim();
    if (named && normalizeName(directorJapanese(named))!==normalizeName(directorJapanese(directorName))) return false;
    // Missing credits are not evidence of direction; require an explicit match.
    return role==='director'||role==='監督'||work.is_director===true||work.isDirector===true||Boolean(named);
  };
  function renderDirectors() {
    const groups=new Map();
    const knownDirectors=Object.values(state.directors||{});
    const canonical=name=>normalizeName(directorJapanese(name)).replace(/[・･.．\s\u3000]/g,'').replace(/ヴ/g,'ブ').replace(/ィ/g,'イ').replace(/ェ/g,'エ').replace(/ー/g,'');
    const knownByName=new Map();
    for(const d of knownDirectors)for(const alias of [d.name,d.nameJa,d.name_ja,d.japanese_name]){
      if(alias)knownByName.set(canonical(alias),d);
    }
    const movieById=new Map(state.movies.map(movie=>[String(movie.id),movie]));
    const directorKey=name=>canonical(name);
    for(const record of ratedMovies().filter(item=>Number(item.rating)>0)){
      const movie=enriched(record),name=String(movie.director||'').trim();
      if(!name)continue;
      const displayName=directorJapanese(name),key=directorKey(name);
      if(!groups.has(key))groups.set(key,{name:displayName,records:[],ids:new Set()});
      const group=groups.get(key),id=String(movie.id);
      if(!group.ids.has(id)){group.ids.add(id);group.records.push(movie);}
    }
    const host=$('directorTimeline'),works=$('directorWorks');
    host.replaceChildren();works.replaceChildren();
    // Director selection is based on the user's reviewed movies only; catalog-only directors stay hidden.
    const filmographyFor=group=>{
      const director=knownByName.get(directorKey(group.name));
      const watched=new Map(group.records.map(movie=>[String(movie.id),movie]));
      const all=new Map();
      for(const work of director?.works||[]){const combined={...work,...(movieById.get(String(work.id))||{})};if(!isDirectorCredit(work,group.name)||!isDirectorCredit(combined,group.name))continue;all.set(String(work.id),combined);}
      for(const movie of group.records){if(!isDirectorCredit(movie,group.name))continue;all.set(String(movie.id),{...(all.get(String(movie.id))||{}),...movie});}
      const films=[...all.values()];
      return {director,watched,films,watchedCount:films.filter(movie=>watched.has(String(movie.id))).length};
    };
    const sorted=[...groups.values()].map(group=>({...group,filmography:filmographyFor(group)})).filter(group=>group.filmography.watchedCount>0).sort((a,b)=>b.filmography.watchedCount-a.filmography.watchedCount||a.name.localeCompare(b.name,'ja'));
    if(!sorted.length){host.innerHTML='<p class="empty">監督情報がある鑑賞記録はまだありません。</p>';return;}
    const list=document.createElement('div');list.className='director-picker';
    const detail=document.createElement('div');detail.className='director-filmography';
    detail.id='directorFilmography';
    host.append(list,detail);
    const directorFilmYear = (movie,directorName) => {
      const candidates=[movie.year,movie.release_year,movie.releaseYear,movie.release_date,movie.releaseDate,movie.first_air_date,movie.date,movie.premiere];
      for(const candidate of candidates){
        const match=String(candidate??'').match(/^(18|19|20)\d{2}/);
        if(match)return Number(match[0]);
      }
      const title=String(movie.original_title||movie.originalTitle||movie.title||movie.name||'').normalize('NFKC').trim();
      const director=String(movie.director||movie.director_name||'').toLowerCase();
      if((title==='激突！'||title==='激突!'||title==='Duel'||title==='Duel (1971)')&&(/spielberg/.test(director)||/スピルバーグ/.test(director)||directorKey(directorName)===directorKey('Steven Spielberg')))return 1971;
      return null;
    };
    const filmTile=(movie,watched,directorName)=>{
      const title=escapeHTML(movie.title||movie.name||'作品名不明'),id=escapeHTML(String(movie.id||'')),year=directorFilmYear(movie,directorName);
      const rating=Number(movie.rating||0);
      return '<article class="director-film-tile '+(watched?'is-watched':'is-unwatched')+'">'+
        '<a class="director-film-poster" href="../search.html?id='+encodeURIComponent(String(movie.id||''))+'" aria-label="'+title+'の作品情報">'+posterHTML(movie)+'</a>'+
        '<div class="director-film-meta"><span class="director-film-year">'+(year||'年不明')+'</span><span class="director-film-title" title="'+title+'">'+title+'</span>'+
        (watched?'<span class="director-film-rating">★ '+rating.toFixed(1)+'</span>':'<span class="director-film-pending">未鑑賞</span>')+'</div></article>';
    };
    const show=(group,row)=>{
      list.querySelectorAll('.director-pick').forEach(button=>{button.classList.toggle('active',button===row);button.setAttribute('aria-expanded',String(button===row));});
      const {director,watched,watchedCount}=group.filmography;
      const films=[...group.filmography.films].sort((a,b)=>(directorFilmYear(a,group.name)||9999)-(directorFilmYear(b,group.name)||9999)||String(a.title||'').localeCompare(String(b.title||''),'ja'));
      const profileImage=director?.profile_path||director?.profilePath||director?.photo||director?.image||'';
      const photoUrl=profileImage.startsWith('/')?'https://image.tmdb.org/t/p/w185'+profileImage:profileImage;
      const safePhoto=/^https:\/\//.test(photoUrl)?photoUrl:'';
      const profileDetails=[director?.birth_date||director?.birthday?('生年月日：'+(director.birth_date||director.birthday)):'',director?.place_of_birth?('出身地：'+director.place_of_birth):'',director?.biography_ja||director?.biography||''].filter(Boolean);
      detail.innerHTML='<div class="director-profile">'+(safePhoto?'<img class="director-profile-photo" src="'+escapeHTML(safePhoto)+'" alt="'+escapeHTML(group.name)+'の写真" loading="lazy">':'')+'<div class="director-profile-body"><h3>'+escapeHTML(group.name)+'</h3><strong class="director-progress">'+watchedCount+' / '+films.length+'本 鑑賞済み</strong><div class="director-progress-track"><span style="width:'+Math.round(watchedCount/Math.max(1,films.length)*100)+'%"></span></div>'+profileDetails.map(v=>'<p>'+escapeHTML(v)+'</p>').join('')+'</div></div>'+
        '<div class="director-poster-grid">'+films.map(movie=>filmTile(movie,watched.has(String(movie.id)),group.name)).join('')+'</div>'+
        '<p class="director-coverage-note">収録作品 '+films.length+'本のうち '+watchedCount+'本を鑑賞。公開年の古い順に表示。※全フィルモグラフィーを保証する数字ではありません。</p>';
      detail.hidden=false;
      row.insertAdjacentElement('afterend',detail);
    };
    sorted.forEach(group=>{
      const row=document.createElement('button');row.type='button';row.className='director-pick';row.setAttribute('aria-expanded','false');
      row.innerHTML='<span>'+escapeHTML(group.name)+'</span><strong>'+group.filmography.watchedCount+'/'+group.filmography.films.length+'本</strong><span class="director-pick-chevron" aria-hidden="true">⌄</span>';
      row.addEventListener('click',()=>{if(row.classList.contains('active')){row.classList.remove('active');row.setAttribute('aria-expanded','false');detail.hidden=true;}else show(group,row);});
      list.append(row);
    });
    works.hidden=true;
  }
  function drawWorld() {
    const canvas = $('worldCanvas'); if (!canvas || $('worldView').hidden) return;
    const rows=worldRecords(); $('worldList').hidden=!state.flatWorld; canvas.parentElement.hidden=state.flatWorld; $('worldToggle').setAttribute('aria-pressed',String(state.flatWorld)); $('worldToggle').textContent=state.flatWorld?'3Dマップで見る':'2D一覧で見る';
    if(state.flatWorld){$('worldList').innerHTML=rows.map(card).join('')||'<p class="hint">条件に合う鑑賞記録はありません。</p>';return;}
    let geometry;
    try { geometry = resizeCanvas(canvas); } catch { $('worldStatus').textContent = 'この環境では3D表示を利用できないため、2D作品一覧を表示します。'; state.flatWorld=true; drawWorld(); return; }
    const { context: ctx, width, height } = geometry; ctx.clearRect(0,0,width,height); ctx.strokeStyle='rgba(224,236,231,.34)';ctx.fillStyle='rgba(224,236,231,.8)';ctx.lineWidth=1;
    const origin=projectPoint({x:0,y:0,z:0},width,height), axes=[{end:projectPoint({x:1,y:0,z:0},width,height),label:'公開年 →'},{end:projectPoint({x:0,y:1,z:0},width,height),label:'製作国 緯度 →'},{end:projectPoint({x:0,y:0,z:1},width,height),label:'ジャンル →'}];
    for(const axis of axes){ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(axis.end.x,axis.end.y);ctx.stroke();ctx.fillText(axis.label,axis.end.x-48,axis.end.y-8);}
    ctx.fillStyle='#f4b266';ctx.fillText('1900年／南／分類順の始点',Math.max(4,origin.x),Math.min(height-8,origin.y+18));
    const chosenYear=$('worldYear').value;
    const chosenGenre=$('worldGenre').value, chosenCountry=$('worldCountry').value;
    const data=rows.map(record=>({record,plot:Insights.pointForRecord(record)})).map(item=>({...item,projected:projectPoint(item.plot.coordinates,width,height)}));
    data.sort((a,b)=>b.projected.depth-a.projected.depth);
    const hit=[];
    data.forEach(item=>{const p=item.projected;const genreIndex=Math.max(0,Insights.GENRE_TAXONOMY.indexOf(item.plot.genre));const color=item.plot.genre==='分類なし'?'#aaaaaa':GENRE_COLORS[genreIndex%GENRE_COLORS.length];const radius=3.2*item.plot.size*Math.sqrt(state.plotZoom);ctx.beginPath();ctx.arc(p.x,p.y,radius+3,0,Math.PI*2);ctx.fillStyle=color+'44';ctx.fill();ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();hit.push({x:p.x,y:p.y,r:Math.max(radius+5,8),record:item.record});});
    const unknownCountryCount=data.filter(item=>item.plot.latitude===null).length;
    canvas._points=hit; $('worldStatus').textContent=`${data.length}作品を表示。ドラッグで回転、ピンチまたはスクロールで拡大縮小できます。点の色はジャンル、点の大きさは評価を表します。${unknownCountryCount?'製作国の緯度が未確認の'+unknownCountryCount+'作品は中央の基準面に配置しています。':''}`;
    $('worldLegend').innerHTML='<span class="chip">灰色：ジャンル未分類</span>'+Insights.GENRE_TAXONOMY.map((genre,index)=>`<span class="chip" style="border-color:${GENRE_COLORS[index]};color:${GENRE_COLORS[index]}">${escapeHTML(genre)}</span>`).join('');
  }
  function drawYearCalendar() { populateYears(); renderStats(); renderList(); renderCalendar(); if(!$('genresView').hidden)renderGenres(); if(!$('awardsView').hidden)renderAwards(); if(!$('worldView').hidden)drawWorld(); if(!$('directorsView').hidden)renderDirectors(); }
  async function searchMovies(query) {
    const token=++state.searchToken, box=$('movieResults'); if(!query.trim()){box.replaceChildren();return;} box.innerHTML='<p class="hint">検索中…</p>';
    let rows=[];
    try { const response=await fetch(`https://backend-one-gray-94.vercel.app/api/movies?q=${encodeURIComponent(query)}&limit=12`,{signal:AbortSignal.timeout(8000)}); if(response.ok){const data=await response.json();rows=[...(data.movies||[]),...(data.external||[])];} } catch (_) { /* Local catalog fallback follows. */ }
    if(!rows.length) { const norm=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,''); const needle=norm(query); rows=state.movies.filter(movie=>[movie.title,movie.original_title,...(movie.aliases||[])].some(value=>norm(value).includes(needle))).slice(0,12); }
    if(token!==state.searchToken)return;
    const seen=new Set(); rows=rows.filter(movie=>{const id=String(movie.id||movie.tmdbId||'');if(!id||seen.has(id))return false;seen.add(id);return true;}).slice(0,12);
    box.innerHTML=rows.length?rows.map(movie=>`<button type="button" class="search-result" data-choose-movie="${escapeHTML(movie.id||movie.tmdbId)}"><img src="${escapeHTML(poster(movie))}" alt="" onerror="this.hidden=true"><span>${escapeHTML(movie.title||movie.name)}<small>${escapeHTML(metadataFor(movie.id||movie.tmdbId).year||movie.year||String(movie.date||'').slice(0,4))} · ${escapeHTML(movie.director||movie.directors?.[0]||'')}</small></span></button>`).join(''):'<p class="hint">作品が見つかりません。作品名を変えて検索してください。</p>';
    box._movies=rows;
  }
  async function chooseMovie(id) {
    const result=$('movieResults')._movies?.find(item=>String(item.id||item.tmdbId)===String(id));
    const metadata=metadataFor(id),movie={...metadata,...(result||{}),year:metadata.year||result?.year||null}; if(!movie.title)return;
    state.selected={...movie,id:String(id),year:movie.year||Number(String(movie.date||'').slice(0,4))||null,director:movie.director||movie.directors?.[0]||'',poster:poster(movie),genres:movie.genres||[],countries:movie.countries||[]};
    $('chosenMovie').textContent=`選択中：${state.selected.title}${state.selected.year?`（${state.selected.year}年）`:''}`;
    $('saveRecord').disabled=true;
    try {
      const response=await fetch(`https://backend-one-gray-94.vercel.app/api/movie-detail?id=${encodeURIComponent(id)}`,{signal:AbortSignal.timeout(8000)});
      if(response.ok){const data=await response.json();if(data.movie&&String(state.selected?.id)===String(id)&&$('recordDialog').open){const details=Object.fromEntries(Object.entries(data.movie).filter(([,value])=>value!==null&&value!==''&&(!Array.isArray(value)||value.length)));state.selected={...state.selected,...details,id:String(id)};}}
    }catch(_){/* Preserve known metadata and allow recording while the API is unavailable. */}
    finally{if(String(state.selected?.id)===String(id)){$('saveRecord').disabled=false;$('chosenMovie').textContent=`選択中：${state.selected.title}${state.selected.year?`（${state.selected.year}年）`:''}`;if(globalThis.CinelvaQuickRate?.open){const chosen=state.selected;$('recordDialog').close();globalThis.CinelvaQuickRate.open(chosen);}}}
  }
  function saveRecord() {
    if(!state.selected){notify('作品を検索して選んでください。');return;}
    try { state.selected.viewingMethod=$('viewingMethod').value;state.selected.comment=$('recordComment').value.trim(); const typedDate=$('watchedAt').value.trim(), date=typedDate||null; if(!Records.validDate(date))throw Error('鑑賞日は YYYY、YYYY-MM、YYYY-MM-DD の形式で入力してください。'); const value=Records.save(state.selected,Number($('rating').value),date); state.records=Records.all(); $('recordDialog').close(); drawYearCalendar(); renderAwards(); notify(`「${value.title}」の鑑賞記録を保存しました。`); }
    catch(error){notify(`保存できませんでした：${error.message}`);}
  }
  function deleteRecord(id) { const record=state.records.find(item=>String(item.id)===String(id)); if(!record)return; if(!globalThis.confirm(`「${record.title}」の鑑賞記録を削除しますか？`))return; try{Records.remove(id);state.records=Records.all();$('recordDialog').close();drawYearCalendar();notify('鑑賞記録を削除しました。');}catch(error){notify(`削除できませんでした：${error.message}`);} }
  function exportRecords() { try { const payload={format:'cinelva-records-backup',version:2,exportedAt:new Date().toISOString(),records:Records.all()}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`cinelva-records-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);notify('鑑賞記録のバックアップを作成しました。');}catch(error){notify(`バックアップできませんでした：${error.message}`);} }
  function readBackup(text) {
    const data=JSON.parse(text); if(data?.format==='cinelva-records-backup'&&(!Number.isInteger(data.version)||data.version<1||data.version>2))throw Error('このバックアップのバージョンには対応していません。'); let rows=[];
    if(Array.isArray(data?.records)) rows=data.records;
    else if(data?.format==='cinemap-backup'&&data.entries){ const raw=data.entries[Records.KEY]||data.entries['cinemap-viewing-records-v1']; if(!raw)throw Error('鑑賞記録が含まれていないバックアップです。'); const parsed=JSON.parse(raw); rows=Array.isArray(parsed)?parsed:Object.entries(parsed).map(([id,item])=>({...item,id})); }
    else if(Array.isArray(data)) rows=data;
    else if(data&&typeof data==='object') rows=Object.entries(data).filter(([key,value])=>/^\d+$/.test(key)&&value&&typeof value==='object').map(([id,item])=>({...item,id}));
    if(rows.length>10000)throw Error('記録件数が上限を超えています。');
    return rows.map(row=>{const id=String(row?.id??row?.tmdbId??'');if(!/^[1-9]\d*$/.test(id)||typeof row.title!=='string'||!(row.rating==null||Records.validScore(row.rating))||!Records.validDate(row.watchedAt??null))throw Error('作品ID・評価・鑑賞日のデータを確認してください。');return {...row,id};});
  }
  async function importRecords(file) { if(!file)return;try{if(file.size>10*1024*1024)throw Error('10 MiB以内のJSONを選択してください。');const rows=readBackup(await file.text());if(!rows.length)throw Error('復元できる鑑賞記録がありません。');if(!globalThis.confirm(`${rows.length}件を復元します。同じ作品IDの既存記録は更新されます。続けますか？`))return;Records.restore(rows.map(enriched));state.records=Records.all();populateYears();drawYearCalendar();notify(`${rows.length}件の鑑賞記録を復元しました。`);}catch(error){notify(`復元できませんでした：${error.message}`);} }
  function bindEvents() {
    document.querySelectorAll('.tab').forEach(button=>button.onclick=()=>setTab(button.dataset.tab));
    $('addRecord').onclick=null; $('closeDialog').onclick=()=>$('recordDialog').close(); $('saveRecord').onclick=saveRecord;
    $('deleteRecord').onclick=()=>state.selected&&deleteRecord(state.selected.id);
    $('rating').oninput=()=>{$('ratingOut').value=Number($('rating').value).toFixed(1);};
    $('movieQuery').oninput=event=>searchMovies(event.target.value);
    $('movieResults').onclick=event=>{const button=event.target.closest('[data-choose-movie]');if(button)chooseMovie(button.dataset.chooseMovie);};
    $('csPeriod').onchange=()=>{renderCinemaSummary();renderYearHeatmap();};
    $('recordSearch').oninput=renderList; $('recordSort').onchange=renderList; $('recordYear').onchange=renderList; $('worldYear').onchange=drawWorld; $('worldGenre').onchange=drawWorld; $('worldCountry').onchange=drawWorld;
    $('exportRecords').onclick=exportRecords; $('importRecords').onclick=()=>$('importFile').click(); $('importFile').onchange=event=>{const file=event.target.files?.[0];event.target.value='';importRecords(file);};
    $('monthPrev').onclick=()=>{state.month--;if(state.month<0){state.month=11;state.year--;}renderCalendar();}; $('monthNext').onclick=()=>{state.month++;if(state.month>11){state.month=0;state.year++;}renderCalendar();};
    $('directorWorks').onclick=event=>{const button=event.target.closest('[data-director-film]');if(button)openKnownMovie(button.dataset.directorFilm);};
    $('calendarYearSelect').onchange=()=>{state.year=Number($('calendarYearSelect').value);syncCalendarYear();};
    $('calendarYearPrev').onclick=()=>{state.year--;syncCalendarYear();};
    $('calendarYearNext').onclick=()=>{state.year++;syncCalendarYear();};
    $('calendarMode').onchange=renderCalendar;
    $('calendar').onclick=event=>{const button=event.target.closest('[data-date]');if(button)renderDateFilms(button.dataset.date);};
    $('yearHeatmap').onclick=event=>{const day=event.target.closest('[data-date]');if(day){const date=day.dataset.date;renderDateFilms(date);$('calendarFilms').scrollIntoView({behavior:'smooth',block:'center'});return;}const month=event.target.closest('[data-calendar-month]');if(month){const prefix=state.year+'-'+String(Number(month.dataset.calendarMonth)+1).padStart(2,'0')+'-';const rows=recordMovies().filter(item=>dateOf(item).startsWith(prefix)).map(enriched);$('calendarFilms').innerHTML=rows.length?'<strong>'+state.year+'年'+(Number(month.dataset.calendarMonth)+1)+'月 · '+rows.length+'本</strong><div class="record-grid">'+rows.map(card).join('')+'</div>':'<span class="hint">この月の鑑賞記録はありません。</span>';$('calendarFilms').scrollIntoView({behavior:'smooth',block:'center'});}};
    $('genreMatrix').onclick=event=>{const button=event.target.closest('[data-genre],[data-genre-pair]');if(!button)return;if(button.dataset.genrePair){const [first,second]=button.dataset.genrePair.split('|');const rows=classifiedRecords().filter(record=>recordGenres(record).includes(first)&&recordGenres(record).includes(second));$('genreFilms').innerHTML=rows.length?rows.map(card).join(''):`<div class="empty" style="grid-column:1/-1">${escapeHTML(first)}と${escapeHTML(second)}の両方に分類された記録はありません。</div>`;return;}renderGenreFilms(button.dataset.genre);};
    $('awardMatrix').onclick=event=>{const button=event.target.closest('[data-award-cell]');if(!button)return;const [organization,decade]=button.dataset.awardCell.split('|');state.awardSelection={organization,decade:Number(decade)};renderAwards();};
    $('genreFormat').onchange=renderGenres; $('genreWorkForm').onchange=renderGenres; $('awardMode').onchange=renderAwards;
    $('awardFilms').onclick=event=>{const button=event.target.closest('[data-award-film]');if(button)openKnownMovie(button.dataset.awardFilm);};
    $('worldZoomIn').onclick=()=>{state.plotZoom=Math.min(2.5,state.plotZoom*1.2);drawWorld();};$('worldZoomOut').onclick=()=>{state.plotZoom=Math.max(.65,state.plotZoom/1.2);drawWorld();};$('worldReset').onclick=()=>{state.plotRotation={x:-.32,y:-.58};state.plotZoom=1;state.plotOffset={x:0,y:0};drawWorld();};$('worldToggle').onclick=()=>{state.flatWorld=!state.flatWorld;drawWorld();};


    document.addEventListener('click',event=>{const edit=event.target.closest('[data-edit]'),del=event.target.closest('[data-delete]');if(edit){const record=state.records.find(item=>String(item.id)===edit.dataset.edit);if(record)openDialog(record);}if(del)deleteRecord(del.dataset.delete);});
    const canvas=$('worldCanvas');
    canvas.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Enter'].includes(event.key))return;event.preventDefault();if(event.key==='Enter'){const rows=worldRecords();if(rows.length)showWorldFilm(rows[state.keyboardPoint++%rows.length]);return;}if(['+','='].includes(event.key))state.plotZoom=Math.min(2.5,state.plotZoom*1.1);else if(event.key==='-')state.plotZoom=Math.max(.65,state.plotZoom/1.1);else if(event.key==='ArrowLeft')state.plotRotation.y-=.15;else if(event.key==='ArrowRight')state.plotRotation.y+=.15;else if(event.key==='ArrowUp')state.plotRotation.x-=.15;else state.plotRotation.x+=.15;drawWorld();});
    const pointerDistance=points=>Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
    const pointerCenter=points=>({x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2});
    canvas.addEventListener('pointerdown',event=>{state.plotWasDragged=false;canvas.setPointerCapture(event.pointerId);state.plotPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...state.plotPointers.values()];state.plotDrag=points.length>1?{mode:'pinch',distance:pointerDistance(points),center:pointerCenter(points)}:{mode:'rotate',x:event.clientX,y:event.clientY,rotation:{...state.plotRotation}};});
    canvas.addEventListener('pointermove',event=>{if(!state.plotPointers.has(event.pointerId))return;const prior=state.plotPointers.get(event.pointerId);if(Math.hypot(event.clientX-prior.x,event.clientY-prior.y)>3)state.plotWasDragged=true;state.plotPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...state.plotPointers.values()];if(points.length>1&&state.plotDrag?.mode==='pinch'){const distance=pointerDistance(points),center=pointerCenter(points);state.plotZoom=Math.max(.65,Math.min(2.5,state.plotZoom*(distance/Math.max(1,state.plotDrag.distance))));state.plotOffset.x+=center.x-state.plotDrag.center.x;state.plotOffset.y+=center.y-state.plotDrag.center.y;state.plotDrag={mode:'pinch',distance,center};}else if(points.length===1&&state.plotDrag?.mode==='rotate'){state.plotRotation.y+= (event.clientX-state.plotDrag.x)*.008;state.plotRotation.x=Math.max(-1.35,Math.min(1.35,state.plotRotation.x+(event.clientY-state.plotDrag.y)*.008));state.plotDrag={...state.plotDrag,x:event.clientX,y:event.clientY};}drawWorld();});
    const endDrag=event=>{state.plotPointers.delete(event.pointerId);const point=[...state.plotPointers.values()][0];state.plotDrag=point?{mode:'rotate',x:point.x,y:point.y,rotation:{...state.plotRotation}}:null;};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
    canvas.addEventListener('wheel',event=>{event.preventDefault();state.plotZoom=Math.max(.65,Math.min(2.5,state.plotZoom*(event.deltaY>0?.9:1.1)));drawWorld();},{passive:false});
    canvas.addEventListener('click',event=>{if(state.plotDrag||state.plotWasDragged)return;const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;const point=(canvas._points||[]).slice().reverse().find(item=>Math.hypot(item.x-x,item.y-y)<item.r);if(point){const record=point.record;$('worldFilm').innerHTML=`<strong>${escapeHTML(record.title)}</strong> · ${escapeHTML(record.year||'公開年不明')} · ${escapeHTML(record.director||'監督不明')} · ★ ${Number(record.rating ?? 0).toFixed(1)}<br>${escapeHTML((recordGenres(record).join('・')||'ジャンル未分類'))} · ${escapeHTML((record.countries||[]).join('・')||'製作国不明')}<div>${card(record)}</div>`;}});
    window.addEventListener('cinelva-record-updated',()=>{state.records=Records.all();populateYears();drawYearCalendar();renderAwards();renderDirectors();renderList();});
    window.addEventListener('resize',()=>{if(!$('worldView').hidden)drawWorld();});
    window.addEventListener('storage',event=>{if(event.key===Records.KEY||event.key===null){try{state.records=Records.all();populateYears();drawYearCalendar();}catch(error){notify(`他のタブの記録を読み込めません：${error.message}`);}}});
  }
  function openKnownMovie(id){const existing=Insights.directorViewingRecord(state.records,{id}),movie=byId.get(String(id)),title=movie?.title||existing?.title;if(!title){notify('この作品の情報が未収録です。作品検索から追加してください。');return;}location.href='../search.html?'+new URLSearchParams({search:title});}
  async function init() {
    try { state.records=Records.all(); } catch(error) { notify(`保存データを読み込めません：${error.message}`); return; }
    const load=async(url,fallback)=>{try{const response=await fetch(url);return response.ok?await response.json():fallback;}catch{return fallback;}};
    const [movieData,awardData,directorData]=await Promise.all([load('../data/movies.json',{movies:[]}),load('../data/awards.json',{awards:[]}),load('../data/directors.json',{directors:{}})]);
    state.movies=movieData.movies||[];state.awards=awardData.awards||[];state.awardCoverage=awardData.coverage||{};state.directors=directorData.directors||{};for(const director of Object.values(state.directors))for(const work of director.works||[]){if(!isDirectorCredit(work,director.name))continue;byId.set(String(work.id),{...work,director:work.director||director.name});}for(const movie of [...(awardData.catalog||[]),...state.movies]){const old=byId.get(String(movie.id))||{};byId.set(String(movie.id),{...old,...movie,year:movie.year||old.year||Number(String(movie.date||'').slice(0,4))||null});}state.movies=[...byId.values()];
    populateYears();bindEvents();drawYearCalendar();
    // Restore the selected tab after a refresh, without affecting record deep links.
    try {
      const savedTab = sessionStorage.getItem(TAB_STORAGE_KEY);
      if (savedTab) setTab(savedTab==='genres'||savedTab==='world'?'summary':savedTab);
    } catch (_) { /* Private browsing can disable storage. */ }
    const params=new URLSearchParams(location.search),requestedId=params.get('record'),requestedTitle=params.get('title');
    if(requestedId||requestedTitle){const query=requestedTitle||requestedId;location.replace('../search.html?'+new URLSearchParams({search:query}));}
  }
  init();
})();
