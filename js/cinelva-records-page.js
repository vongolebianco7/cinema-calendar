(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const Records = globalThis.CinelvaLibraryRecords;
  const Insights = globalThis.CinelvaInsights;
  const currentYear = new Date().getFullYear();
  const state = { records: [], movies: [], awards: [], directors: {}, month: new Date().getMonth(), year: currentYear, selected: null, searchToken: 0, plotRotation: { x: -.32, y: -.58 }, plotZoom: 1, plotOffset: { x: 0, y: 0 }, plotPointers: new Map(), plotDrag: null, activeGenre: null, awardSelection: null };
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const byId = new Map();
  const poster = movie => movie.poster || movie.poster_path && `https://image.tmdb.org/t/p/w342${movie.poster_path}` || '';
  const recordMovies = () => state.records.filter(record => record.watched !== false);
  const ratedMovies = () => recordMovies().filter(record => typeof record.rating === 'number');
  const metadataFor = id => byId.get(String(id)) || {};
  const enriched = record => ({ ...metadataFor(record.id), ...record, countries: record.countries?.length ? record.countries : metadataFor(record.id).countries?.length ? metadataFor(record.id).countries : (record.region ? [record.region] : []), genres: record.genres?.length ? record.genres : metadataFor(record.id).genres || [], year: record.year || Number(String(metadataFor(record.id).date || '').slice(0, 4)) || null, director: record.director || metadataFor(record.id).director || '' });
  const dateOf = record => typeof record.watchedAt === 'string' ? record.watchedAt : '';
  const formatDate = value => value ? value.replaceAll('-', '.') : '鑑賞日未登録';
  function notify(message) { $('status').textContent = message; }
  function openDialog(record = null) {
    state.selected = record ? enriched(record) : null;
    $('dialogTitle').textContent = record ? '鑑賞記録を編集' : '鑑賞を記録';
    $('deleteRecord').hidden = !record;
    $('movieQuery').value = '';
    $('movieResults').replaceChildren();
    $('chosenMovie').textContent = record ? `${record.title}${record.year ? `（${record.year}年）` : ''}` : '作品を検索して選択してください。';
    $('watchedAt').value = record?.watchedAt || '';
    $('dateHint').textContent = record?.watchedAt && /^\d{4}(?:-\d{2})?$/.test(record.watchedAt) ? `この記録の日付は「${record.watchedAt}」まで分かっています。変更しない場合、その時期情報を保持します。` : '';
    $('movieQuery').parentElement.hidden = Boolean(record);
    $('unrated').checked = Boolean(record && record.rating == null);
    $('rating').value = record?.rating ?? 3;
    $('rating').disabled = $('unrated').checked;
    $('ratingOut').value = $('unrated').checked ? '—' : Number($('rating').value).toFixed(1);
    $('recordDialog').showModal();
    if (!record) $('movieQuery').focus();
  }
  function renderStats() {
    const records = recordMovies();
    const rated = records.filter(item => typeof item.rating === 'number');
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
    $('statAverage').textContent = rated.length ? (rated.reduce((sum, item) => sum + item.rating, 0) / rated.length).toFixed(1) : '—';
    $('statOrigin').textContent = `${japan} / ${foreign}`;
  }
  function posterHTML(movie) {
    const source = poster(movie);
    return `<div class="poster">${source ? `<img src="${escapeHTML(source)}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false">` : ''}<span ${source ? 'hidden' : ''}>${escapeHTML(movie.title || '作品画像なし')}</span></div>`;
  }
  function card(movie) {
    return `<article class="movie" data-record-card="${escapeHTML(movie.id)}">${posterHTML(movie)}<strong>${escapeHTML(movie.title)}</strong><small>${escapeHTML(movie.year || '公開年不明')} · ${escapeHTML(formatDate(dateOf(movie)))}</small><small class="score">${movie.rating == null ? '未評価' : `★ ${Number(movie.rating).toFixed(1)}`}</small><div class="record-actions"><button data-edit="${escapeHTML(movie.id)}">編集</button><button data-delete="${escapeHTML(movie.id)}">削除</button></div></article>`;
  }
  function renderList() {
    const query = $('recordSearch').value.trim().toLocaleLowerCase();
    const year = $('recordYear').value;
    const sort = $('recordSort').value;
    let rows = recordMovies().map(enriched).filter(item => (!query || `${item.title} ${item.director || ''}`.toLocaleLowerCase().includes(query)) && (year === 'all' || dateOf(item).slice(0, 4) === year));
    rows.sort(sort === 'title' ? (a, b) => a.title.localeCompare(b.title, 'ja') : sort === 'rating' ? (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || dateOf(b).localeCompare(dateOf(a)) : (a, b) => dateOf(b).localeCompare(dateOf(a)) || a.title.localeCompare(b.title, 'ja'));
    $('recordList').innerHTML = rows.length ? rows.map(card).join('') : `<div class="empty" style="grid-column:1/-1"><strong>${recordMovies().length ? '条件に合う鑑賞記録はありません。' : 'ここから、映画の記録がはじまります。'}</strong><p>作品検索から鑑賞日と評価を保存できます。</p><button class="button primary" data-add-record>鑑賞を記録</button></div>`;
  }
  function setTab(tab) {
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
    const first = new Date(state.year, state.month, 1), days = new Date(state.year, state.month + 1, 0).getDate(), offset = first.getDay();
    const map = new Map();
    for (const item of recordMovies()) { const date = dateOf(item); if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue; map.set(date, [...(map.get(date) || []), item]); }
    const monthCount = [...map.entries()].filter(([date]) => date.startsWith(`${state.year}-${String(state.month + 1).padStart(2, '0')}`)).reduce((sum, [, items]) => sum + items.length, 0);
    $('calendarMonth').textContent = `${state.year}年${state.month + 1}月 · ${monthCount}本`;
    let html = '<table style="min-width:0"><thead><tr>' + ['日','月','火','水','木','金','土'].map(day => `<th>${day}</th>`).join('') + '</tr></thead><tbody><tr>';
    for (let i = 0; i < offset; i++) html += '<td class="heat-0"></td>';
    for (let day = 1; day <= days; day++) {
      const date = `${state.year}-${String(state.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, records = map.get(date) || [];
      html += `<td><button class="award-cell heat-${Math.min(4, records.length)}" style="width:100%" data-date="${date}" aria-label="${day}日、${records.length}本">${day}${records.length ? `<small> ${records.length}</small>` : ''}</button></td>`;
      if ((offset + day) % 7 === 0 && day !== days) html += '</tr><tr>';
    }
    const trailing = (7 - (offset + days) % 7) % 7;
    for (let i = 0; i < trailing; i++) html += '<td class="heat-0"></td>';
    html += '</tr></tbody></table>';
    $('calendar').innerHTML = html;
    $('monthPrev').disabled = state.year <= 1900 && state.month === 0;
    $('monthNext').disabled = state.year >= currentYear && state.month >= new Date().getMonth();
    renderYearHeatmap(map);
  }
  function renderYearHeatmap() {
    const year = currentYear, start = new Date(year, 0, 1);
    const daysInYear = (new Date(year + 1, 0, 1) - start) / 86400000;
    const counts = new Map();
    for (const item of recordMovies()) { const date = dateOf(item); if (/^\d{4}-\d{2}-\d{2}$/.test(date) && date.slice(0, 4) === String(year)) counts.set(date, (counts.get(date) || 0) + 1); }
    const offset = start.getDay(), cells = Array(offset).fill('<span class="heat-day empty" aria-hidden="true"></span>');
    for (let index = 0; index < daysInYear; index++) { const date = new Date(year, 0, index + 1), iso = `${year}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`, count = counts.get(iso) || 0, level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3; cells.push(`<span class="heat-day" data-level="${level}" title="${iso}：${count}本" aria-label="${iso}、${count}本"></span>`); }
    $('yearHeatmap').innerHTML = cells.join('');
    $('yearHeatmap').setAttribute('aria-label', `${year}年の日付付き鑑賞記録。${counts.size}日、${[...counts.values()].reduce((a,b)=>a+b,0)}本`);
  }
  function renderDateFilms(date) {
    const rows = recordMovies().filter(item => dateOf(item) === date);
    $('calendarFilms').innerHTML = rows.length ? `<strong>${date} · ${rows.length}本</strong><div class="record-grid">${rows.map(enriched).map(card).join('')}</div>` : '<span class="hint">この日の鑑賞記録はありません。</span>';
  }
  const GENRE_COLORS = ['#f4b266','#6dd3ba','#86bfff','#d795ec','#f27f87','#e8d574','#72c7ed','#bdad93','#97d590','#ec9ac4','#e7a77a','#a4b7ef','#b2d36f','#e6a5a5','#bed9d4'];
  function recordGenres(record) { return Insights.classifyGenres(enriched(record).genres).genres; }
  function renderGenres() {
    const rows = recordMovies().map(enriched), names = Insights.GENRE_TAXONOMY;
    const counts = Object.fromEntries(names.map(name => [name, 0]));
    for (const record of rows) for (const name of recordGenres(record)) counts[name]++;
    const html = `<table><thead><tr><th>ジャンル</th>${names.map(name => `<th>${escapeHTML(name)}</th>`).join('')}</tr></thead><tbody>` + names.map((name, i) => `<tr><th><button data-genre="${escapeHTML(name)}">${escapeHTML(name)} · ${counts[name]}</button></th>${names.map((other, j) => { const overlap = rows.filter(record => { const genres = recordGenres(record); return genres.includes(name) && genres.includes(other); }).length; return `<td><button class="heat-${Math.min(4, overlap)}" data-genre-pair="${escapeHTML(name)}|${escapeHTML(other)}" aria-label="${escapeHTML(name)}と${escapeHTML(other)}の重なり ${overlap}本">${overlap || '·'}</button></td>`; }).join('')}</tr>`).join('') + '</tbody></table>';
    $('genreMatrix').innerHTML = html;
    const unclassified = rows.filter(record => !recordGenres(record).length).length;
    $('genreSummary').innerHTML = `<span class="chip">分類可能 ${rows.length - unclassified}本</span><span class="chip">未分類 ${unclassified}本</span><span class="chip">数字は交差する作品数</span>`;
    renderGenreFilms(state.activeGenre);
  }
  function renderGenreFilms(genre) {
    state.activeGenre = genre;
    const rows = recordMovies().map(enriched).filter(record => !genre || recordGenres(record).includes(genre));
    $('genreFilms').innerHTML = rows.length ? rows.map(card).join('') : '<div class="empty" style="grid-column:1/-1">このジャンルの鑑賞記録はありません。</div>';
  }
  function renderAwards() {
    const data = Insights.buildAwardHeatmap(recordMovies().map(enriched), state.awards);
    const decades = [...new Set([...data.decades, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020])].sort((a, b) => a - b);
    const rows = data.organizations;
    $('awardCoverage').textContent = `作品数を表示しています。収録は一部の主要賞と確認可能な授賞記録に限られます。対象作品の全件性を確認できないため達成率は表示しません。`;
    $('awardMatrix').innerHTML = `<table><thead><tr><th>映画賞 · 授賞年</th>${decades.map(decade => `<th>${decade}年代</th>`).join('')}</tr></thead><tbody>${rows.map(name => `<tr><th>${escapeHTML(name)}</th>${decades.map(decade => { const cell = data.cells[`${name}:${decade}`]; return `<td>${cell ? `<button class="award-cell heat-${Math.min(4, cell.count)}" data-award-cell="${escapeHTML(name)}|${decade}" aria-label="${escapeHTML(name)}、${decade}年代、鑑賞済み受賞作品${cell.count}本">${cell.count}</button>` : '<span class="hint" aria-label="受賞データ未収録">—</span>'}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
    if (state.awardSelection) {
      const cell = data.cells[`${state.awardSelection.organization}:${state.awardSelection.decade}`];
      $('awardFilms').innerHTML = cell?.films.length ? cell.films.map(enriched).map(card).join('') : '<div class="empty" style="grid-column:1/-1">該当する鑑賞済み作品はありません。受賞データ未収録と本数0は区別して確認してください。</div>';
    } else $('awardFilms').innerHTML = '<div class="hint" style="grid-column:1/-1">セルを選ぶと、照合できた鑑賞作品を表示します。</div>';
  }
  const normalizeName = value => String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
  function renderDirectors() {
    const names = [...new Set(recordMovies().map(item => enriched(item).director).filter(Boolean))].sort((a,b) => a.localeCompare(b,'ja'));
    const options = '<option value="">監督を選択</option>' + names.map(name => `<option>${escapeHTML(name)}</option>`).join('');
    if ($('directorOne').options.length !== names.length + 1) { $('directorOne').innerHTML = options; $('directorTwo').innerHTML = '<option value="">比較しない</option>' + names.map(name => `<option>${escapeHTML(name)}</option>`).join(''); }
    drawDirectorTimelines();
  }
  function drawDirectorTimelines() {
    const selected = [$('directorOne').value, $('directorTwo').value].filter(Boolean);
    const html = selected.map(name => {
      const entry = Object.values(state.directors).find(director => normalizeName(director.name) === normalizeName(name));
      const works = Array.isArray(entry?.works) ? entry.works.filter(work => Number(work.year)) : [];
      const watched = new Set(recordMovies().map(record => String(record.id)));
      if (!works.length) return `<div class="panel"><h3>${escapeHTML(name)}</h3><p class="hint">収録済みフィルモグラフィーがありません。鑑賞済み作品のみ表示します。</p>${recordMovies().filter(record => enriched(record).director === name).map(enriched).map(card).join('')}</div>`;
      const min = Math.min(...works.map(work => Number(work.year))), max = Math.max(...works.map(work => Number(work.year))), span = Math.max(1, max - min);
      const sorted = works.slice().sort((a,b) => Number(a.year) - Number(b.year));
      const nodes = sorted.map((work, index) => { const x = 2 + (Number(work.year) - min) / span * 96; const seen = watched.has(String(work.id)); return `<button class="timeline-node ${seen?'':'unwatched'}" style="left:${x}%" data-director-film="${escapeHTML(work.id)}" title="${escapeHTML(work.title)} · ${work.year}${seen?' · 鑑賞済み':' · 未鑑賞'}"><span>${escapeHTML(work.title)}</span></button>`; }).join('');
      const years = [...new Set([min, Math.round((min+max)/2), max])].map(year => `<span class="timeline-year" style="left:${2+(year-min)/span*96}%">${year}</span>`).join('');
      return `<div class="panel"><div class="section-head"><h3>${escapeHTML(name)}</h3><span class="hint">一覧 ${works.length}作品 · 鑑賞済み ${sorted.filter(work => watched.has(String(work.id))).length}作品</span></div><div class="timeline"><div class="timeline-row">${nodes}${years}</div></div><p class="hint">収録済み作品一覧に基づく表示です。全フィルモグラフィーの網羅性は保証されないため達成率を表示しません。</p></div>`;
    }).join('');
    $('directorTimeline').innerHTML = html || '<div class="empty">鑑賞記録から監督を特定できませんでした。</div>';
    if (selected.length === 1) {
      const entry = Object.values(state.directors).find(director => normalizeName(director.name) === normalizeName(selected[0]));
      const watched = new Set(recordMovies().map(record => String(record.id)));
      $('directorWorks').innerHTML = (entry?.works || []).filter(work => watched.has(String(work.id))).map(work => ({ ...work, id: work.id, rating: recordMovies().find(record => String(record.id) === String(work.id))?.rating, watchedAt: recordMovies().find(record => String(record.id) === String(work.id))?.watchedAt })).map(card).join('');
    } else $('directorWorks').replaceChildren();
  }
  function resizeCanvas(canvas) { const rect = canvas.getBoundingClientRect(), dpr = Math.min(2, globalThis.devicePixelRatio || 1); canvas.width = Math.max(1, Math.round(rect.width * dpr)); canvas.height = Math.max(1, Math.round(rect.height * dpr)); const context = canvas.getContext('2d'); context.scale(dpr, dpr); return { context, width: rect.width, height: rect.height }; }
  function projectPoint(coords, width, height) {
    let x = coords.x * 2 - 1, y = coords.y * 2 - 1, z = coords.z * 2 - 1;
    const { x: rx, y: ry } = state.plotRotation;
    const cosY = Math.cos(ry), sinY = Math.sin(ry), x1 = x*cosY - z*sinY, z1 = x*sinY + z*cosY;
    const cosX = Math.cos(rx), sinX = Math.sin(rx), y1 = y*cosX-z1*sinX, z2 = y*sinX+z1*cosX;
    const perspective = 3.2/(3.2+z2), scale = Math.min(width, height)*.36*state.plotZoom*perspective;
    return { x: width/2 + x1*scale + state.plotOffset.x, y: height/2 - y1*scale + state.plotOffset.y, depth: z2, scale };
  }
  function drawWorld() {
    const canvas = $('worldCanvas'); if (!canvas || $('worldView').hidden) return;
    let geometry;
    try { geometry = resizeCanvas(canvas); } catch { $('worldStatus').textContent = 'この環境では3D表示を利用できないため、2D作品一覧を表示します。'; $('worldFilm').innerHTML = recordMovies().map(enriched).map(card).join('') || '鑑賞記録はありません。'; return; }
    const { context: ctx, width, height } = geometry; ctx.clearRect(0,0,width,height); ctx.strokeStyle='rgba(224,236,231,.34)';ctx.fillStyle='rgba(224,236,231,.8)';ctx.lineWidth=1;
    const origin={x:width*.5,y:height*.5}, axes=[{end:{x:width*.88,y:height*.55},label:'公開年 →'},{end:{x:width*.40,y:height*.12},label:'製作国 緯度'},{end:{x:width*.25,y:height*.70},label:'ジャンル'}];
    for(const axis of axes){ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(axis.end.x,axis.end.y);ctx.stroke();ctx.fillText(axis.label,axis.end.x-48,axis.end.y-8);}
    ctx.fillStyle='#f4b266';ctx.fillText('1900',width*.14,height*.61);ctx.fillText('現在',width*.83,height*.6);ctx.fillText('北',width*.4,height*.18);ctx.fillText('南',width*.4,height*.82);
    const chosenYear=$('worldYear').value;
    const chosenGenre=$('worldGenre').value, chosenCountry=$('worldCountry').value;
    const data=recordMovies().map(enriched).map(record=>({record,plot:Insights.pointForRecord(record)})).filter(item=>(chosenYear==='all'||String(item.plot.year)===chosenYear)&&(chosenCountry==='all'||item.plot.country===chosenCountry)&&(chosenGenre==='all'||recordGenres(item.record).includes(chosenGenre)));
    data.sort((a,b)=>a.plot.coordinates.z-b.plot.coordinates.z);
    const hit=[];
    data.forEach(item=>{const p=projectPoint(item.plot.coordinates,width,height);const genreIndex=Math.max(0,Insights.GENRE_TAXONOMY.indexOf(item.plot.genre));const color=GENRE_COLORS[genreIndex%GENRE_COLORS.length];const radius=3.2*item.plot.size;ctx.beginPath();ctx.arc(p.x,p.y,radius+3,0,Math.PI*2);ctx.fillStyle=color+'44';ctx.fill();ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();hit.push({x:p.x,y:p.y,r:Math.max(radius+5,8),record:item.record});});
    canvas._points=hit; $('worldStatus').textContent=`${data.length}作品を表示。ドラッグで回転、ピンチまたはスクロールで拡大縮小できます。点の色はジャンル、点の大きさは評価を表します。`;
    $('worldLegend').innerHTML=Insights.GENRE_TAXONOMY.map((genre,index)=>`<span class="chip" style="border-color:${GENRE_COLORS[index]};color:${GENRE_COLORS[index]}">${escapeHTML(genre)}</span>`).join('');
  }
  function drawYearCalendar() { renderStats(); renderList(); renderCalendar(); }
  async function searchMovies(query) {
    const token=++state.searchToken, box=$('movieResults'); if(!query.trim()){box.replaceChildren();return;} box.innerHTML='<p class="hint">検索中…</p>';
    let rows=[];
    try { const response=await fetch(`https://backend-one-gray-94.vercel.app/api/movies?q=${encodeURIComponent(query)}&limit=12`); if(response.ok){const data=await response.json();rows=[...(data.movies||[]),...(data.external||[])];} } catch (_) { /* Local catalog fallback follows. */ }
    if(!rows.length) rows=state.movies.filter(movie=>`${movie.title||''} ${movie.original_title||''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())).slice(0,12);
    if(token!==state.searchToken)return;
    const seen=new Set(); rows=rows.filter(movie=>{const id=String(movie.id||movie.tmdbId||'');if(!id||seen.has(id))return false;seen.add(id);return true;}).slice(0,12);
    box.innerHTML=rows.length?rows.map(movie=>`<button type="button" class="search-result" data-choose-movie="${escapeHTML(movie.id||movie.tmdbId)}"><img src="${escapeHTML(poster(movie))}" alt="" onerror="this.hidden=true"><span>${escapeHTML(movie.title||movie.name)}<small>${escapeHTML(movie.year||String(movie.date||'').slice(0,4))} · ${escapeHTML(movie.director||movie.directors?.[0]||'')}</small></span></button>`).join(''):'<p class="hint">作品が見つかりません。作品名を変えて検索してください。</p>';
    box._movies=rows;
  }
  function chooseMovie(id) { const movie=$('movieResults')._movies?.find(item=>String(item.id||item.tmdbId)===String(id)) || metadataFor(id); if(!movie?.title)return; state.selected={...movie,id:String(id),year:movie.year||Number(String(movie.date||'').slice(0,4))||null,director:movie.director||movie.directors?.[0]||'',poster:poster(movie),genres:movie.genres||[],countries:movie.countries||[]}; $('chosenMovie').textContent=`選択中：${state.selected.title}${state.selected.year?`（${state.selected.year}年）`:''}`; }
  function saveRecord() {
    if(!state.selected){notify('作品を検索して選んでください。');return;}
    try { const typedDate=$('watchedAt').value, partialDate=/^\d{4}(?:-\d{2})?$/.test(state.selected.watchedAt||'')&&!typedDate, date=typedDate|| (partialDate?state.selected.watchedAt:null); const value=$('unrated').checked?Records.saveUnrated(state.selected,date):Records.save(state.selected,Number($('rating').value),date); state.records=Records.all(); $('recordDialog').close(); drawYearCalendar(); renderAwards(); notify(`「${value.title}」の鑑賞記録を保存しました。`); }
    catch(error){notify(`保存できませんでした：${error.message}`);}
  }
  function deleteRecord(id) { const record=state.records.find(item=>String(item.id)===String(id)); if(!record)return; if(!globalThis.confirm(`「${record.title}」の鑑賞記録を削除しますか？`))return; try{Records.remove(id);state.records=Records.all();$('recordDialog').close();drawYearCalendar();notify('鑑賞記録を削除しました。');}catch(error){notify(`削除できませんでした：${error.message}`);} }
  function exportRecords() { try { const payload={format:'cinelva-records-backup',version:2,exportedAt:new Date().toISOString(),records:Records.all()}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`cinelva-records-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);notify('鑑賞記録のバックアップを作成しました。');}catch(error){notify(`バックアップできませんでした：${error.message}`);} }
  function readBackup(text) {
    const data=JSON.parse(text); let rows=[];
    if(Array.isArray(data?.records)) rows=data.records;
    else if(data?.format==='cinemap-backup'&&data.entries){ const raw=data.entries[Records.KEY]||data.entries['cinemap-viewing-records-v1']; if(!raw)throw Error('鑑賞記録が含まれていないバックアップです。'); const parsed=JSON.parse(raw); rows=Array.isArray(parsed)?parsed:Object.entries(parsed).map(([id,item])=>({...item,id})); }
    else if(Array.isArray(data)) rows=data;
    else if(data&&typeof data==='object') rows=Object.entries(data).filter(([key,value])=>/^\d+$/.test(key)&&value&&typeof value==='object').map(([id,item])=>({...item,id}));
    if(rows.length>10000)throw Error('記録件数が上限を超えています。');
    return rows.map(row=>{const id=String(row?.id??row?.tmdbId??'');if(!/^[1-9]\d*$/.test(id)||typeof row.title!=='string'||!(row.rating==null||Records.validScore(row.rating))||!Records.validDate(row.watchedAt??null))throw Error('作品ID・評価・鑑賞日のデータを確認してください。');return {...row,id};});
  }
  async function importRecords(file) { if(!file)return;try{if(file.size>10*1024*1024)throw Error('10 MiB以内のJSONを選択してください。');const rows=readBackup(await file.text());if(!rows.length)throw Error('復元できる鑑賞記録がありません。');if(!globalThis.confirm(`${rows.length}件を復元します。同じ作品IDの既存記録は更新されます。続けますか？`))return;const before=localStorage.getItem(Records.KEY);try{for(const row of rows){const value=enriched(row);if(value.rating==null)Records.saveUnrated(value,value.watchedAt??null);else Records.save(value,value.rating,value.watchedAt??null);}}catch(error){if(before===null)localStorage.removeItem(Records.KEY);else localStorage.setItem(Records.KEY,before);throw error;}state.records=Records.all();populateYears();drawYearCalendar();notify(`${rows.length}件の鑑賞記録を復元しました。`);}catch(error){notify(`復元できませんでした：${error.message}`);} }
  function bindEvents() {
    document.querySelectorAll('.tab').forEach(button=>button.onclick=()=>setTab(button.dataset.tab));
    $('addRecord').onclick=()=>openDialog(); $('closeDialog').onclick=()=>$('recordDialog').close(); $('saveRecord').onclick=saveRecord;
    $('deleteRecord').onclick=()=>state.selected&&deleteRecord(state.selected.id);
    $('rating').oninput=()=>{$('ratingOut').value=Number($('rating').value).toFixed(1);}; $('unrated').onchange=()=>{$('rating').disabled=$('unrated').checked;$('ratingOut').value=$('unrated').checked?'—':Number($('rating').value).toFixed(1);};
    $('movieQuery').oninput=event=>searchMovies(event.target.value);
    $('movieResults').onclick=event=>{const button=event.target.closest('[data-choose-movie]');if(button)chooseMovie(button.dataset.chooseMovie);};
    $('recordSearch').oninput=renderList; $('recordSort').onchange=renderList; $('recordYear').onchange=renderList; $('worldYear').onchange=drawWorld; $('worldGenre').onchange=drawWorld; $('worldCountry').onchange=drawWorld;
    $('exportRecords').onclick=exportRecords; $('importRecords').onclick=()=>$('importFile').click(); $('importFile').onchange=event=>{const file=event.target.files?.[0];event.target.value='';importRecords(file);};
    $('monthPrev').onclick=()=>{state.month--;if(state.month<0){state.month=11;state.year--;}renderCalendar();}; $('monthNext').onclick=()=>{state.month++;if(state.month>11){state.month=0;state.year++;}renderCalendar();};
    $('calendar').onclick=event=>{const button=event.target.closest('[data-date]');if(button)renderDateFilms(button.dataset.date);};
    $('genreMatrix').onclick=event=>{const button=event.target.closest('[data-genre],[data-genre-pair]');if(!button)return;if(button.dataset.genrePair){const [first,second]=button.dataset.genrePair.split('|');const rows=recordMovies().map(enriched).filter(record=>recordGenres(record).includes(first)&&recordGenres(record).includes(second));$('genreFilms').innerHTML=rows.length?rows.map(card).join(''):`<div class="empty" style="grid-column:1/-1">${escapeHTML(first)}と${escapeHTML(second)}の両方に分類された記録はありません。</div>`;return;}renderGenreFilms(button.dataset.genre);};
    $('awardMatrix').onclick=event=>{const button=event.target.closest('[data-award-cell]');if(!button)return;const [organization,decade]=button.dataset.awardCell.split('|');state.awardSelection={organization,decade:Number(decade)};renderAwards();};
    $('directorOne').onchange=drawDirectorTimelines; $('directorTwo').onchange=drawDirectorTimelines;
    $('directorTimeline').onclick=event=>{const button=event.target.closest('[data-director-film]');if(!button)return;const movie=state.movies.find(item=>String(item.id)===button.dataset.directorFilm);if(!movie)return;const existing=state.records.find(item=>String(item.id)===String(movie.id));existing?openDialog(existing):openDialog({...movie,id:String(movie.id),year:Number(movie.year),poster:movie.poster});};
    document.addEventListener('click',event=>{const add=event.target.closest('[data-add-record]'),edit=event.target.closest('[data-edit]'),del=event.target.closest('[data-delete]');if(add)openDialog();if(edit){const record=state.records.find(item=>String(item.id)===edit.dataset.edit);if(record)openDialog(record);}if(del)deleteRecord(del.dataset.delete);});
    const canvas=$('worldCanvas');
    const pointerDistance=points=>Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
    const pointerCenter=points=>({x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2});
    canvas.addEventListener('pointerdown',event=>{canvas.setPointerCapture(event.pointerId);state.plotPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...state.plotPointers.values()];state.plotDrag=points.length>1?{mode:'pinch',distance:pointerDistance(points),center:pointerCenter(points)}:{mode:'rotate',x:event.clientX,y:event.clientY,rotation:{...state.plotRotation}};});
    canvas.addEventListener('pointermove',event=>{if(!state.plotPointers.has(event.pointerId))return;state.plotPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...state.plotPointers.values()];if(points.length>1&&state.plotDrag?.mode==='pinch'){const distance=pointerDistance(points),center=pointerCenter(points);state.plotZoom=Math.max(.65,Math.min(2.5,state.plotZoom*(distance/Math.max(1,state.plotDrag.distance))));state.plotOffset.x+=center.x-state.plotDrag.center.x;state.plotOffset.y+=center.y-state.plotDrag.center.y;state.plotDrag={mode:'pinch',distance,center};}else if(points.length===1&&state.plotDrag?.mode==='rotate'){state.plotRotation.y+= (event.clientX-state.plotDrag.x)*.008;state.plotRotation.x=Math.max(-1.35,Math.min(1.35,state.plotRotation.x+(event.clientY-state.plotDrag.y)*.008));state.plotDrag={...state.plotDrag,x:event.clientX,y:event.clientY};}drawWorld();});
    const endDrag=event=>{state.plotPointers.delete(event.pointerId);const point=[...state.plotPointers.values()][0];state.plotDrag=point?{mode:'rotate',x:point.x,y:point.y,rotation:{...state.plotRotation}}:null;};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
    canvas.addEventListener('wheel',event=>{event.preventDefault();state.plotZoom=Math.max(.65,Math.min(2.5,state.plotZoom*(event.deltaY>0?.9:1.1)));drawWorld();},{passive:false});
    canvas.addEventListener('click',event=>{if(state.plotDrag)return;const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;const point=(canvas._points||[]).slice().reverse().find(item=>Math.hypot(item.x-x,item.y-y)<item.r);if(point){const record=point.record;$('worldFilm').innerHTML=`<strong>${escapeHTML(record.title)}</strong> · ${escapeHTML(record.year||'公開年不明')} · ${escapeHTML(record.director||'監督不明')} · ${record.rating==null?'未評価':`★ ${Number(record.rating).toFixed(1)}`}<br>${escapeHTML((recordGenres(record).join('・')||'ジャンル未分類'))} · ${escapeHTML((record.countries||[]).join('・')||'製作国不明')}<div>${card(record)}</div>`;}});
    window.addEventListener('resize',()=>{if(!$('worldView').hidden)drawWorld();});
    window.addEventListener('storage',event=>{if(event.key===Records.KEY||event.key===null){try{state.records=Records.all();populateYears();drawYearCalendar();}catch(error){notify(`他のタブの記録を読み込めません：${error.message}`);}}});
  }
  async function init() {
    try { state.records=Records.all(); } catch(error) { notify(`保存データを読み込めません：${error.message}`); return; }
    try { const [movieResponse,awardResponse,directorResponse]=await Promise.all([fetch('../data/movies.json'),fetch('../data/awards.json'),fetch('../data/directors.json')]); const [movieData,awardData,directorData]=await Promise.all([movieResponse.ok?movieResponse.json():{movies:[]},awardResponse.ok?awardResponse.json():{awards:[]},directorResponse.ok?directorResponse.json():{directors:{}}]); state.movies=movieData.movies||[];state.awards=awardData.awards||[];state.directors=directorData.directors||{};for(const movie of state.movies)byId.set(String(movie.id),movie); } catch(error) { notify(`作品情報を一部読み込めません：${error.message}`); }
    populateYears();bindEvents();drawYearCalendar();renderGenres();renderAwards();
  }
  init();
})();
