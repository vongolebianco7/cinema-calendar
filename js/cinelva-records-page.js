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
  const enriched = record => {const metadata=metadataFor(record.id),array=value=>Array.isArray(value)?value:[],countries=array(record.countries).length?array(record.countries):array(metadata.countries).length?array(metadata.countries):(record.region?[record.region]:[]);return {...metadata,...record,countries:countries.filter(country=>typeof country==='string'),genres:array(record.genres).length?array(record.genres):array(metadata.genres),year:record.year||metadata.year||Number(String(metadata.date||'').slice(0,4))||null,director:record.director||metadata.director||''};};
  const dateOf = record => typeof record.watchedAt === 'string' ? record.watchedAt : '';
  const classificationFor = record => { const movie=enriched(record); const classified=Insights.classifyGenres([...(movie.genres||[]),...(Array.isArray(movie.formats)?movie.formats:[]),...(Array.isArray(movie.workForms)?movie.workForms:[])]);return {...classified,formats:movie.format?[movie.format]:classified.formats,workForms:movie.workForm?[movie.workForm]:classified.workForms}; };
  const formatDate = value => value ? value.replaceAll('-', '.') : '鑑賞日未登録';
  function notify(message) { $('status').textContent = message; }
  function openDialog(record = null) {
    state.selected = record ? enriched(record) : null;
    $('dialogTitle').textContent = record ? '鑑賞記録を編集' : '鑑賞を記録';
    $('deleteRecord').hidden = !record;
    $('movieQuery').value = '';
    $('movieResults').replaceChildren();
    $('chosenMovie').textContent = record ? `${record.title}${record.year ? `（${record.year}年）` : ''}` : '作品を検索して選択してください。';
    $('recordFormat').value=record?.format||''; $('recordWorkForm').value=record?.workForm||''; $('watchedAt').value = record?.watchedAt || '';
    $('dateHint').textContent = record?.watchedAt && /^\d{4}(?:-\d{2})?$/.test(record.watchedAt) ? `この記録の日付は「${record.watchedAt}」まで分かっています。変更しない場合、その時期情報を保持します。` : '';
    $('movieQuery').parentElement.hidden = Boolean(record);
    $('saveRecord').disabled=false; $('unrated').checked = Boolean(record && record.rating == null);
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
    renderAnnualComparison();
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
    target.innerHTML = `<table aria-label="年間鑑賞本数の比較"><thead><tr><th>年</th><th>鑑賞本数</th><th>前年との比較</th></tr></thead><tbody>${years.map(year => {
      const count = counts.get(year), previous = counts.get(year - 1);
      const change = previous == null ? '比較できる前年データなし' : previous === 0 ? '前年は0本' : `${count - previous > 0 ? '+' : ''}${count - previous}本`;
      const width = Math.round(count / maximum * 100);
      return `<tr><th scope="row"><button class="button" data-calendar-year="${year}">${year}年</button></th><td><div class="annual-count"><span>${count}本</span><span class="annual-bar" aria-hidden="true" style="width:${width}%"></span></div></td><td>${change}</td></tr>`;
    }).join('')}</tbody></table>`;
  }
  function posterHTML(movie) {
    const source = poster(movie);
    return `<div class="poster">${source ? `<img src="${escapeHTML(source)}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false">` : ''}<span ${source ? 'hidden' : ''}>${escapeHTML(movie.title || '作品画像なし')}</span></div>`;
  }
  function card(movie) {
    return `<article class="movie" data-record-card="${escapeHTML(movie.id)}">${posterHTML(movie)}<strong>${escapeHTML(movie.title)}</strong><small>${escapeHTML(movie.year || '公開年不明')} · ${escapeHTML(formatDate(dateOf(movie)))}</small><small class="score ${Number(movie.rating)>=4?'high-rating':''}">${movie.rating == null ? '未評価' : `★ ${Number(movie.rating).toFixed(1)}`}</small><div class="record-actions"><button data-edit="${escapeHTML(movie.id)}">編集</button><button data-delete="${escapeHTML(movie.id)}">削除</button></div></article>`;
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
    const monthCount=recordMovies().filter(item=>dateOf(item).startsWith(`${state.year}-${String(state.month+1).padStart(2,'0')}`)).length;
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
    const year = state.year, start = new Date(year, 0, 1);
    $('yearHeatmapTitle').textContent=`${year}年の鑑賞頻度`;
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
    $('awardFilms').innerHTML=cell?cell.entries.map(entry=>`<article class="panel"><strong>${escapeHTML(entry.title)}</strong><p>${entry.watched?'鑑賞済み':entry.id?'未鑑賞':'作品ID未照合・判定保留'} · 授賞年 ${entry.awardYears.join('・')}</p><p class="hint">${escapeHTML(entry.categories.join('・'))}</p>${entry.id?`<button class="button" data-award-film="${escapeHTML(entry.id)}">${entry.watched?'記録を編集':'鑑賞を記録'}</button>`:''}${entry.sources.map(url=>` <a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">受賞の出典</a>`).join('')}</article>`).join(''):'<p class="hint" style="grid-column:1/-1">セルを選ぶと収録済みの受賞作品と鑑賞状況を確認できます。作品IDがない受賞記録は照合保留です。</p>';
  }
  const normalizeName = value => String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
  function renderDirectors() {
    const names = [...new Set([...recordMovies().map(item => enriched(item).director),...Object.values(state.directors).map(item=>item.name)].filter(Boolean))].sort((a,b) => a.localeCompare(b,'ja'));
    const options = '<option value="">監督を選択</option>' + names.map(name => `<option>${escapeHTML(name)}</option>`).join('');
    const one=$('directorOne').value,two=$('directorTwo').value;
    $('directorOne').innerHTML=options; $('directorTwo').innerHTML='<option value="">比較しない</option>'+names.map(name=>`<option>${escapeHTML(name)}</option>`).join('');
    $('directorOne').value=one||recordMovies().map(enriched).find(item=>item.director)?.director||''; $('directorTwo').value=two;
    drawDirectorTimelines();
  }
  function drawDirectorTimelines() {
    const selected = [$('directorOne').value, $('directorTwo').value].filter(Boolean);
    const html = selected.map(name => {
      const entry = Object.values(state.directors).find(director => normalizeName(director.name) === normalizeName(name));
      const works = Array.isArray(entry?.works) ? entry.works.filter(work => Number(work.year)) : [];
      const matchedRecord = work => Insights.directorViewingRecord(state.records, work);
      if (!works.length) return `<div class="panel"><h3>${escapeHTML(name)}</h3><p class="hint">収録済みフィルモグラフィーがありません。鑑賞済み作品のみ表示します。</p>${recordMovies().filter(record => enriched(record).director === name).map(enriched).map(card).join('')}</div>`;
      const min = Math.min(...works.map(work => Number(work.year))), max = Math.max(...works.map(work => Number(work.year))), span = Math.max(1, max - min);
      const sorted = works.slice().sort((a,b) => Number(a.year) - Number(b.year));
      const awardIds=new Set(state.awards.map(item=>String(item.tmdb_id||'')));
      const width=Math.max(700,sorted.length*90), lanes=[];
      const nodes=sorted.map(work=>{const x=30+(Number(work.year)-min)/span*(width-60),seen=Boolean(matchedRecord(work)),awarded=awardIds.has(String(work.id)),highRated=Number(work.votes)>=100&&Number(work.score)>=7.5;let lane=lanes.findIndex(last=>x-last>110);if(lane<0)lane=lanes.length;lanes[lane]=x;return `<button class="timeline-node ${seen?'':'unwatched'} ${awarded?'awarded':''} ${highRated?'high-rated':''}" style="left:${x}px;top:${32+lane*80}px" data-director-film="${escapeHTML(work.id)}" aria-label="${escapeHTML(work.title)} · ${work.year}${seen?' · 鑑賞済み':' · 未鑑賞'}${awarded?' · 受賞記録あり':''}${highRated?' · TMDB高評価':''}" title="${escapeHTML(work.title)} · ${work.year}${awarded?' · 受賞記録あり':''}"><span>${escapeHTML(work.title)}${awarded?' ★':''}</span></button>`;}).join('');
      const years = [...new Set([min, Math.round((min+max)/2), max])].map(year => `<span class="timeline-year" style="left:${30+(year-min)/span*(width-60)}px;top:0">${year}</span>`).join('');
      return `<div class="panel"><div class="section-head"><h3>${escapeHTML(name)}</h3><span class="hint">一覧 ${works.length}作品 · 鑑賞済み ${sorted.filter(work => matchedRecord(work)).length}作品</span></div><div class="timeline"><div class="timeline-row" style="width:${width}px;height:${Math.max(150,lanes.length*80+80)}px">${nodes}${years}</div></div><p class="hint">収録済み作品一覧に基づく表示です。全フィルモグラフィーの網羅性は保証されないため達成率を表示しません。金色の縁は収録された受賞作品、外枠はTMDB評価7.5以上・100票以上です。</p></div>`;
    }).join('');
    $('directorTimeline').innerHTML = html || '<div class="empty">鑑賞記録から監督を特定できませんでした。</div>';
    if (selected.length === 1) {
      const entry = Object.values(state.directors).find(director => normalizeName(director.name) === normalizeName(selected[0]));
      const matchedRecord = work => Insights.directorViewingRecord(state.records, work);
      $('directorWorks').innerHTML = (entry?.works || []).map(work => ({ work, record: matchedRecord(work) })).filter(item => item.record).map(({work,record}) => ({...work,...record,id:record.id,title:record.title||work.title,year:record.year||work.year})).map(card).join('');
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
  function worldRecords(){return recordMovies().map(enriched).filter(record=>{const p=Insights.pointForRecord(record);return ($('worldYear').value==='all'||String(p.year)===$('worldYear').value)&&($('worldCountry').value==='all'||(record.countries||[]).includes($('worldCountry').value))&&($('worldGenre').value==='all'||recordGenres(record).includes($('worldGenre').value));});}
  function showWorldFilm(record){$('worldFilm').innerHTML=card(record);}
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
    if(!rows.length) rows=state.movies.filter(movie=>`${movie.title||''} ${movie.original_title||''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())).slice(0,12);
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
    finally{if(String(state.selected?.id)===String(id)){$('saveRecord').disabled=false;$('chosenMovie').textContent=`選択中：${state.selected.title}${state.selected.year?`（${state.selected.year}年）`:''}`;}}
  }
  function saveRecord() {
    if(!state.selected){notify('作品を検索して選んでください。');return;}
    try { state.selected.format=$('recordFormat').value;state.selected.workForm=$('recordWorkForm').value; const typedDate=$('watchedAt').value, partialDate=/^\d{4}(?:-\d{2})?$/.test(state.selected.watchedAt||'')&&!typedDate, date=typedDate|| (partialDate?state.selected.watchedAt:null); const value=$('unrated').checked?Records.saveUnrated(state.selected,date):Records.save(state.selected,Number($('rating').value),date); state.records=Records.all(); $('recordDialog').close(); drawYearCalendar(); renderAwards(); notify(`「${value.title}」の鑑賞記録を保存しました。`); }
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
    $('addRecord').onclick=()=>openDialog(); $('closeDialog').onclick=()=>$('recordDialog').close(); $('saveRecord').onclick=saveRecord;
    $('deleteRecord').onclick=()=>state.selected&&deleteRecord(state.selected.id);
    $('rating').oninput=()=>{$('ratingOut').value=Number($('rating').value).toFixed(1);}; $('unrated').onchange=()=>{$('rating').disabled=$('unrated').checked;$('ratingOut').value=$('unrated').checked?'—':Number($('rating').value).toFixed(1);};
    $('movieQuery').oninput=event=>searchMovies(event.target.value);
    $('movieResults').onclick=event=>{const button=event.target.closest('[data-choose-movie]');if(button)chooseMovie(button.dataset.chooseMovie);};
    $('recordSearch').oninput=renderList; $('recordSort').onchange=renderList; $('recordYear').onchange=renderList; $('worldYear').onchange=drawWorld; $('worldGenre').onchange=drawWorld; $('worldCountry').onchange=drawWorld;
    $('exportRecords').onclick=exportRecords; $('importRecords').onclick=()=>$('importFile').click(); $('importFile').onchange=event=>{const file=event.target.files?.[0];event.target.value='';importRecords(file);};
    $('monthPrev').onclick=()=>{state.month--;if(state.month<0){state.month=11;state.year--;}renderCalendar();}; $('monthNext').onclick=()=>{state.month++;if(state.month>11){state.month=0;state.year++;}renderCalendar();};
    $('annualComparison').onclick=event=>{const button=event.target.closest('[data-calendar-year]');if(button){state.year=Number(button.dataset.calendarYear);state.month=0;renderCalendar();}};
    $('calendar').onclick=event=>{const button=event.target.closest('[data-date]');if(button)renderDateFilms(button.dataset.date);};
    $('genreMatrix').onclick=event=>{const button=event.target.closest('[data-genre],[data-genre-pair]');if(!button)return;if(button.dataset.genrePair){const [first,second]=button.dataset.genrePair.split('|');const rows=classifiedRecords().filter(record=>recordGenres(record).includes(first)&&recordGenres(record).includes(second));$('genreFilms').innerHTML=rows.length?rows.map(card).join(''):`<div class="empty" style="grid-column:1/-1">${escapeHTML(first)}と${escapeHTML(second)}の両方に分類された記録はありません。</div>`;return;}renderGenreFilms(button.dataset.genre);};
    $('awardMatrix').onclick=event=>{const button=event.target.closest('[data-award-cell]');if(!button)return;const [organization,decade]=button.dataset.awardCell.split('|');state.awardSelection={organization,decade:Number(decade)};renderAwards();};
    $('genreFormat').onchange=renderGenres; $('genreWorkForm').onchange=renderGenres; $('awardMode').onchange=renderAwards;
    $('awardFilms').onclick=event=>{const button=event.target.closest('[data-award-film]');if(button)openKnownMovie(button.dataset.awardFilm);};
    $('worldZoomIn').onclick=()=>{state.plotZoom=Math.min(2.5,state.plotZoom*1.2);drawWorld();};$('worldZoomOut').onclick=()=>{state.plotZoom=Math.max(.65,state.plotZoom/1.2);drawWorld();};$('worldReset').onclick=()=>{state.plotRotation={x:-.32,y:-.58};state.plotZoom=1;state.plotOffset={x:0,y:0};drawWorld();};$('worldToggle').onclick=()=>{state.flatWorld=!state.flatWorld;drawWorld();};
    $('directorOne').onchange=drawDirectorTimelines; $('directorTwo').onchange=drawDirectorTimelines;
    $('directorTimeline').onclick=event=>{const button=event.target.closest('[data-director-film]');if(button)openKnownMovie(button.dataset.directorFilm);};
    document.addEventListener('click',event=>{const add=event.target.closest('[data-add-record]'),edit=event.target.closest('[data-edit]'),del=event.target.closest('[data-delete]');if(add)openDialog();if(edit){const record=state.records.find(item=>String(item.id)===edit.dataset.edit);if(record)openDialog(record);}if(del)deleteRecord(del.dataset.delete);});
    const canvas=$('worldCanvas');
    canvas.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Enter'].includes(event.key))return;event.preventDefault();if(event.key==='Enter'){const rows=worldRecords();if(rows.length)showWorldFilm(rows[state.keyboardPoint++%rows.length]);return;}if(['+','='].includes(event.key))state.plotZoom=Math.min(2.5,state.plotZoom*1.1);else if(event.key==='-')state.plotZoom=Math.max(.65,state.plotZoom/1.1);else if(event.key==='ArrowLeft')state.plotRotation.y-=.15;else if(event.key==='ArrowRight')state.plotRotation.y+=.15;else if(event.key==='ArrowUp')state.plotRotation.x-=.15;else state.plotRotation.x+=.15;drawWorld();});
    const pointerDistance=points=>Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
    const pointerCenter=points=>({x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2});
    canvas.addEventListener('pointerdown',event=>{state.plotWasDragged=false;canvas.setPointerCapture(event.pointerId);state.plotPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...state.plotPointers.values()];state.plotDrag=points.length>1?{mode:'pinch',distance:pointerDistance(points),center:pointerCenter(points)}:{mode:'rotate',x:event.clientX,y:event.clientY,rotation:{...state.plotRotation}};});
    canvas.addEventListener('pointermove',event=>{if(!state.plotPointers.has(event.pointerId))return;const prior=state.plotPointers.get(event.pointerId);if(Math.hypot(event.clientX-prior.x,event.clientY-prior.y)>3)state.plotWasDragged=true;state.plotPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...state.plotPointers.values()];if(points.length>1&&state.plotDrag?.mode==='pinch'){const distance=pointerDistance(points),center=pointerCenter(points);state.plotZoom=Math.max(.65,Math.min(2.5,state.plotZoom*(distance/Math.max(1,state.plotDrag.distance))));state.plotOffset.x+=center.x-state.plotDrag.center.x;state.plotOffset.y+=center.y-state.plotDrag.center.y;state.plotDrag={mode:'pinch',distance,center};}else if(points.length===1&&state.plotDrag?.mode==='rotate'){state.plotRotation.y+= (event.clientX-state.plotDrag.x)*.008;state.plotRotation.x=Math.max(-1.35,Math.min(1.35,state.plotRotation.x+(event.clientY-state.plotDrag.y)*.008));state.plotDrag={...state.plotDrag,x:event.clientX,y:event.clientY};}drawWorld();});
    const endDrag=event=>{state.plotPointers.delete(event.pointerId);const point=[...state.plotPointers.values()][0];state.plotDrag=point?{mode:'rotate',x:point.x,y:point.y,rotation:{...state.plotRotation}}:null;};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
    canvas.addEventListener('wheel',event=>{event.preventDefault();state.plotZoom=Math.max(.65,Math.min(2.5,state.plotZoom*(event.deltaY>0?.9:1.1)));drawWorld();},{passive:false});
    canvas.addEventListener('click',event=>{if(state.plotDrag||state.plotWasDragged)return;const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;const point=(canvas._points||[]).slice().reverse().find(item=>Math.hypot(item.x-x,item.y-y)<item.r);if(point){const record=point.record;$('worldFilm').innerHTML=`<strong>${escapeHTML(record.title)}</strong> · ${escapeHTML(record.year||'公開年不明')} · ${escapeHTML(record.director||'監督不明')} · ${record.rating==null?'未評価':`★ ${Number(record.rating).toFixed(1)}`}<br>${escapeHTML((recordGenres(record).join('・')||'ジャンル未分類'))} · ${escapeHTML((record.countries||[]).join('・')||'製作国不明')}<div>${card(record)}</div>`;}});
    window.addEventListener('resize',()=>{if(!$('worldView').hidden)drawWorld();});
    window.addEventListener('storage',event=>{if(event.key===Records.KEY||event.key===null){try{state.records=Records.all();populateYears();drawYearCalendar();}catch(error){notify(`他のタブの記録を読み込めません：${error.message}`);}}});
  }
  function openKnownMovie(id){const existing=Insights.directorViewingRecord(state.records,{id}),movie=byId.get(String(id));if(existing)openDialog(existing);else if(movie){openDialog({...movie,id:String(id),watchedAt:null,rating:null});$('dialogTitle').textContent='鑑賞を記録';$('deleteRecord').hidden=true;}else notify('この作品の情報が未収録です。作品検索から追加してください。');}
  async function init() {
    try { state.records=Records.all(); } catch(error) { notify(`保存データを読み込めません：${error.message}`); return; }
    const load=async(url,fallback)=>{try{const response=await fetch(url);return response.ok?await response.json():fallback;}catch{return fallback;}};
    const [movieData,awardData,directorData]=await Promise.all([load('../data/movies.json',{movies:[]}),load('../data/awards.json',{awards:[]}),load('../data/directors.json',{directors:{}})]);
    state.movies=movieData.movies||[];state.awards=awardData.awards||[];state.awardCoverage=awardData.coverage||{};state.directors=directorData.directors||{};for(const director of Object.values(state.directors))for(const work of director.works||[])byId.set(String(work.id),{...work,director:director.name});for(const movie of [...(awardData.catalog||[]),...state.movies]){const old=byId.get(String(movie.id))||{};byId.set(String(movie.id),{...old,...movie,year:movie.year||old.year||Number(String(movie.date||'').slice(0,4))||null});}state.movies=[...byId.values()];
    populateYears();bindEvents();drawYearCalendar();
    const params=new URLSearchParams(location.search),requestedId=params.get('record');
    if(requestedId){
      const requestedTitle=params.get('title')||'',existing=state.records.find(item=>String(item.id)===String(requestedId));
      if(existing||byId.has(String(requestedId)))openKnownMovie(requestedId);
      else if(requestedTitle){openDialog();$('movieQuery').value=requestedTitle;searchMovies(requestedTitle);}
      else notify('作品名で検索して記録してください。');
    }
  }
  init();
})();
