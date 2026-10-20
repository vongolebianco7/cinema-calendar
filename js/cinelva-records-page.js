(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const Records = globalThis.CinelvaLibraryRecords;
  const Insights = globalThis.CinelvaInsights;
  const currentYear = new Date().getFullYear();
  const state = { records: [], movies: [], awards: [], directors: {}, month: new Date().getMonth(), year: currentYear, selected: null, searchToken: 0, plotRotation: { x: -.32, y: -.58 }, plotZoom: 1, plotOffset: { x: 0, y: 0 }, plotPointers: new Map(), plotDrag: null, activeGenre: null, awardSelection: null, awardCoverage: {}, flatWorld: false, keyboardPoint: 0 };
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const byId = new Map();
  const poster = movie => {
    const validSource = item => {
      if(typeof item!=='string'||!item.trim())return '';
      const value=item.trim();
      if(value.startsWith('/'))return 'https://image.tmdb.org/t/p/w342'+value;
      if(/^https:\/\//i.test(value))return value;
      return '';
    };
    const sourceFrom = item => {
      if(!item)return '';
      for(const value of [item.poster,item.poster_url,item.posterUrl,item.poster_path,item.posterPath,item.posterURL,item.images?.poster,item.images?.poster_path]){
        const url=validSource(value);
        if(url)return url;
      }
      return '';
    };
    // Prefer explicit artwork; resolve missing record artwork from the catalog
    // using a unique TMDB identifier before attempting title-based recovery.
    const catalogPoster = id => {
      if(!id)return '';
      const match=state.movies.find(item=>String(item.tmdbId??item.tmdb_id??item.id??'')===String(id)&&sourceFrom(item));
      return match?sourceFrom(match):'';
    };
    const shared=globalThis.CinelvaMovieIdentity?.posterFor(movie);
    if(shared)return shared;
    const direct=sourceFrom(movie);
    if(direct){globalThis.CinelvaMovieIdentity?.ingest(movie);return direct;}
    const id=String(movie.tmdbId??movie.tmdb_id??movie.id??'');
    const metadata=metadataFor(id);
    const byIdentifier=sourceFrom(metadata)||catalogPoster(id);
    if(byIdentifier)return byIdentifier;
    // Imported records sometimes use a different local ID from the catalog.
    // Only reuse artwork when normalized title and release year both match.
    const normalizedTitle=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[\\s\\u3000・･:：!！?？'’"“”()（）\-ー]/g,'');
    const title=normalizedTitle(movie.title);
    const year=Number(movie.year||String(movie.release_date||movie.date||'').slice(0,4));
    if(!title||!year||!Array.isArray(state.movies))return '';
    const matches=state.movies.filter(item=>normalizedTitle(item.title)===title&&Number(item.year||String(item.release_date||item.date||'').slice(0,4))===year);
    if(matches.length!==1)return '';
    return sourceFrom(matches[0]);
  };
  const recordMovies = () => state.records.filter(record => record.watched !== false);
  const ratedMovies = () => recordMovies().filter(record => typeof record.rating === 'number');
  const metadataFor = id => byId.get(String(id)) || {};
  const countryAliases = {"united states":"アメリカ","united states of america":"アメリカ","usa":"アメリカ","us":"アメリカ","アメリカ合衆国":"アメリカ","united kingdom":"イギリス","uk":"イギリス","gb":"イギリス","great britain":"イギリス","英国":"イギリス","japan":"日本","jp":"日本","france":"フランス","germany":"ドイツ","italy":"イタリア","spain":"スペイン","canada":"カナダ","australia":"オーストラリア","south korea":"韓国","china":"中国","hong kong":"香港","taiwan":"台湾","india":"インド","brazil":"ブラジル","mexico":"メキシコ","russia":"ロシア","new zealand":"ニュージーランド","sweden":"スウェーデン","denmark":"デンマーク","norway":"ノルウェー","finland":"フィンランド","netherlands":"オランダ","switzerland":"スイス","austria":"オーストリア","ireland":"アイルランド","poland":"ポーランド","argentina":"アルゼンチン","thailand":"タイ","vietnam":"ベトナム","philippines":"フィリピン","indonesia":"インドネシア","turkey":"トルコ","iran":"イラン","israel":"イスラエル","portugal":"ポルトガル","greece":"ギリシャ","belgium":"ベルギー"};
  const countryJP = value => countryAliases[String(value||'').trim().toLowerCase()] || String(value||'').trim();
  const enriched = record => {const metadata=metadataFor(record.tmdbId??record.tmdb_id??record.id),array=value=>Array.isArray(value)?value:[],countries=array(record.countries).length?array(record.countries):array(metadata.countries).length?array(metadata.countries):(record.region?[record.region]:[]);return {...metadata,...record,countries:[...new Set(countries.filter(country=>typeof country==='string').map(countryJP))],genres:array(record.genres).length?array(record.genres):array(metadata.genres),year:record.year||metadata.year||Number(String(metadata.date||'').slice(0,4))||null,director:record.director||metadata.director||''};};
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
    if(state.year!==selectedYear)state.year=selectedYear;
    renderYearHeatmap();
    $('csLifetime').textContent=String(all.length);$('csCount').textContent=String(filtered.length);
    const statsHost=$('csExtraStats');
    if(statsHost){
      const scored=filtered.map(r=>Number(r.rating)).filter(n=>Number.isFinite(n)&&n>0);
      const methodOf=r=>String(r.viewingMethod||r.viewing_method||r.method||'').trim();
      const totals={'映画館':0,'配信':0,'DVD／ブルーレイ':0,'その他':0,'未指定':0};
      for(const record of filtered){
        const method=methodOf(record).normalize('NFKC').toLowerCase().replace(/\\s+/g,'');
        let category='その他';
        if(!method)category='未指定';
        else if(method==='映画館'||method==='cinema'||method==='theater'||method==='theatre')category='映画館';
        else if(method==='配信'||method==='streaming'||method==='stream'||method==='vod'||method==='サブスク')category='配信';
        else if(/dvd|blu.?ray|ブルーレイ|ブルーレー|bd|ディスク/.test(method))category='DVD／ブルーレイ';
        totals[category]++;
      }
      const avg=scored.length?(scored.reduce((a,b)=>a+b,0)/scored.length).toFixed(2):'—';
      const items=[['平均評価',avg==='—'?avg:'★ '+avg],['4点以上',scored.filter(n=>n>=4).length+'本']];
      statsHost.replaceChildren(...items.map(([label,value])=>{const card=document.createElement('div');card.className='cs-extra-stat';const l=document.createElement('span');l.textContent=label;const v=document.createElement('strong');v.textContent=value;card.append(l,v);return card;}));
      let breakdown=document.getElementById('csMethodBreakdown');
      if(!breakdown){breakdown=document.createElement('section');breakdown.id='csMethodBreakdown';breakdown.className='cs-method-breakdown';statsHost.insertAdjacentElement('afterend',breakdown);}
      const heading=document.createElement('h3');heading.textContent='鑑賞方法の内訳（'+(period==='all'?'オールタイム':period+'年')+'）';
      const grid=document.createElement('div');grid.className='cs-method-grid';
      const categories=['映画館','配信','DVD／ブルーレイ','その他',...(totals['未指定']?['未指定']:[])];
      for(const category of categories){
        const count=totals[category];
        const cell=document.createElement('div');cell.className='cs-method-item';
        const name=document.createElement('span');name.className='cs-method-name';name.textContent=category;
        const value=document.createElement('strong');value.textContent=count+'本';
        const track=document.createElement('div');track.className='cs-method-track';
        const fill=document.createElement('span');fill.style.width=(filtered.length?count/filtered.length*100:0)+'%';track.append(fill);
        const pct=document.createElement('small');pct.textContent=(filtered.length?Math.round(count/filtered.length*100):0)+'%';
        cell.append(name,value,track,pct);grid.append(cell);
      }
      breakdown.replaceChildren(heading,grid);
    }

    $('csPeriodLabel').textContent=period==='all'?'全期間の鑑賞本数':period+'年の鑑賞本数';
    const prism='<svg class="cs-prism" viewBox="0 0 42 48" aria-hidden="true"><defs><linearGradient id="csFacetA" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f4e7f0"/><stop offset=".48" stop-color="#b6d8df"/><stop offset="1" stop-color="#8f9dc8"/></linearGradient><linearGradient id="csFacetB" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d5e8ee"/><stop offset="1" stop-color="#9cabc9"/></linearGradient></defs><path d="M21 2 37 10v28L21 46 5 38V10Z" fill="#b5c5da" stroke="#e2e5ef" stroke-width="1.1"/><path d="M21 2 37 10 21 18 5 10Z" fill="#e7dce9"/><path d="M5 10 21 18v28L5 38Z" fill="url(#csFacetA)"/><path d="M37 10 21 18v28l16-8Z" fill="url(#csFacetB)"/><path d="M21 2v16M5 10l16 8 16-8M21 18v28" stroke="#f4f4f8" stroke-width=".9" fill="none"/><path d="M10 15v19M33 14v20" stroke="#fff" stroke-opacity=".3" stroke-width=".8"/></svg>';
    $('csPrisms').innerHTML=prism.repeat(Math.floor(all.length/1000));
    const achieved=Math.floor(all.length%1000/100);
    $('csCrowns').innerHTML=Array.from({length:achieved},()=>'<svg class="cs-crown" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 16 2 5l6 5 3-7 3 7 6-5-1 11ZM3 19h16" fill="none" stroke="#d9bd7f" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>').join('');

    /* Earned-only lifetime milestones: one prism per 1,000 and one gold crown per remaining 100. */
    if(!document.getElementById('cinelva-earned-milestones-style')){
      const medalStyle=document.createElement('style');
      medalStyle.id='cinelva-earned-milestones-style';
      medalStyle.textContent='.cs-milestones{display:flex;align-items:center;gap:12px;flex-wrap:wrap;min-height:0}.cs-prisms{display:flex;gap:5px;align-items:center;flex-wrap:wrap}.cs-crowns{display:grid;grid-template-columns:repeat(5,22px);gap:2px 4px;align-items:center}.cs-crown{width:22px;height:22px}.cs-prism{width:38px;height:44px;display:block}.cs-prisms:empty,.cs-crowns:empty,.cs-milestones:has(.cs-prisms:empty):has(.cs-crowns:empty){display:none}';
      document.head.append(medalStyle);
    }
    const counts=new Map();all.forEach(r=>{const y=dateOf(r).slice(0,4);if(/^\d{4}$/.test(y))counts.set(y,(counts.get(y)||0)+1)});
    const max=Math.max(1,...counts.values());
    $('csYears').innerHTML=[...counts.keys()].sort().map(y=>'<div class="cs-year '+(y===period?'active':'')+'"><span>'+counts.get(y)+'</span><i class="bar" style="height:'+Math.max(2,Math.round(counts.get(y)/max*65))+'px"></i><span>'+y+'</span></div>').join('')||'<span class="cs-empty">鑑賞年の記録なし</span>';
    const top=filtered.filter(r=>Number(r.rating)>0&&Number(r.rating)<=5).sort((a,b)=>Number(b.rating)-Number(a.rating)||dateOf(b).localeCompare(dateOf(a)));
    $('csTop').innerHTML=top.length?top.map((r,i)=>{const src=poster(r),id=escapeHTML(r.tmdbId??r.tmdb_id??r.id);return '<div class="cs-film"'+(i>=10?' style="display:none" data-top-extra="1"':'')+'>'+(src?'<img src="'+escapeHTML(src)+'" alt="'+escapeHTML(r.title||'')+'" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="cs-poster-empty" hidden>ポスターなし</div>':'<div class="cs-poster-empty">ポスターなし</div>')+'<div class="cs-film-name" title="'+escapeHTML(r.title)+'">'+(i+1)+'. '+escapeHTML(r.title)+'</div><div class="cs-top-review" data-top-review-id="'+id+'"></div></div>'}).join('')+(top.length>10?'<button type="button" id="csTopMore" class="button" style="grid-column:1/-1">さらに10本表示（全'+top.length+'本）</button>':''):'<p class="cs-empty" style="grid-column:1/-1">評価済みの作品はありません。</p>';
    $('csTop').querySelectorAll('[data-top-review-id]').forEach(node=>{const movie=top.find(r=>String(r.tmdbId??r.tmdb_id??r.id)===node.dataset.topReviewId);if(movie){const id=Number(movie.tmdbId??movie.tmdb_id??movie.id);globalThis.CinelvaQuickRate?.mountInline?.(node,{...movie,id,tmdbId:id});}});
    const more=$('csTopMore');if(more)more.addEventListener('click',()=>{
      const extras=[...$('csTop').querySelectorAll('[data-top-extra]')];
      const hidden=extras.filter(el=>el.style.display==='none');
      if(!hidden.length){extras.forEach(el=>el.style.display='none');more.textContent='さらに10本表示（全'+top.length+'本）';more.setAttribute('aria-expanded','false');const collapse=$('csTopCollapse');if(collapse)collapse.hidden=true;return;}
      hidden.slice(0,10).forEach(el=>el.style.display='');
      const remaining=extras.filter(el=>el.style.display==='none').length;
      more.textContent=remaining?'さらに10本表示（残り'+remaining+'本）':'閉じる';
      let collapse=$('csTopCollapse');
      if(!collapse){collapse=document.createElement('button');collapse.type='button';collapse.id='csTopCollapse';collapse.className='cs-top-collapse';collapse.textContent='×';collapse.setAttribute('aria-label','ランキングを閉じる');collapse.addEventListener('click',()=>{extras.forEach(el=>el.style.display='none');more.textContent='さらに10本表示（全'+top.length+'本）';more.setAttribute('aria-expanded','false');collapse.hidden=true;more.scrollIntoView({block:'center',behavior:'smooth'});});$('csTop').append(collapse);}
      collapse.hidden=false;
      more.setAttribute('aria-expanded',String(!remaining));
    });
    const renderRows=(id,items,colors)=>{const max=Math.max(1,...items.map(x=>x[1]));$(id).innerHTML=items.length?items.map(([name,count],i)=>'<div class="cs-row"><span>'+escapeHTML(name)+'</span><div class="cs-track"><i style="width:'+(count/max*100)+'%;background:'+colors[i%colors.length]+'"></i></div><span class="cs-count">'+count+'</span></div>').join(''):'<p class="cs-empty">集計できる記録がありません。</p>'};
    const genreCounts=new Map(),countryCounts=new Map(),methodCounts=new Map(),decades=new Map();
    filtered.forEach(r=>{
      for(const g of new Set(Insights.classifyGenres(r.genres||[]).genres))genreCounts.set(g,(genreCounts.get(g)||0)+1);
      for(const c of new Set(r.countries||[]))countryCounts.set(c,(countryCounts.get(c)||0)+1);
      const method=String(r.viewingMethod||'').trim()||'不明';methodCounts.set(method,(methodCounts.get(method)||0)+1);
      const release=Number(r.year);if(release>=1880&&release<=2100){const d=Math.floor(release/10)*10;decades.set(d,(decades.get(d)||0)+1)}
    });
    const sorted=m=>[...m].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ja'));
    const palettes=[['#4b92cf','#81b7e0','#b0d4ed','#285b8d','#d3e6f4','#6383b4','#9db9d5','#456477'],['#b88a50','#e2bf79','#8b693f','#efd9a5','#aa7e69','#c9a478','#725638','#d9c7ad'],['#456FAD','#C27B4A','#75A69A','#B65B79','#A89A59','#806AB1','#6597B0','#B4A3A0'],['#418F88','#D09A52','#7C6FB4','#C76F7A','#5D8DB8','#9DAD69','#A87A9F','#B4A187']];
    const countryColor=name=>{const n=String(name).normalize('NFKC').toLowerCase();const rules=[[/日本|japan/,'#c34261'],[/アメリカ|united states|usa/,'#3176c7'],[/韓国|south korea|korea/,'#7252bf'],[/イギリス|united kingdom|uk|britain/,'#31528a'],[/フランス|france/,'#26a39b'],[/イタリア|italy/,'#26844e'],[/ドイツ|germany/,'#d2a137'],[/中国|china/,'#bd6033'],[/インド|india/,'#db8535'],[/スペイン|spain/,'#b65e97']];return rules.find(([re])=>re.test(n))?.[1]||null;};
    const storageKey='cinelva-donut-value-mode';
    let donutMode='percent';
    try{donutMode=localStorage.getItem(storageKey)==='count'?'count':'percent';}catch(_){}
    const breakdowns=document.querySelector('#summaryView .cs-breakdowns');
    if(breakdowns){
      let toolbar=breakdowns.previousElementSibling;
      if(!toolbar||!toolbar.classList.contains('cs-donut-global-mode')){
        toolbar=document.createElement('div');
        toolbar.className='cs-donut-global-mode';
        breakdowns.before(toolbar);
      }
      toolbar.replaceChildren();
      const label=document.createElement('span');label.textContent='グラフの表示';toolbar.append(label);
      for(const [value,title] of [['percent','%'],['count','本数']]){
        const button=document.createElement('button');button.type='button';
        button.textContent=title;button.setAttribute('aria-pressed',String(donutMode===value));
        button.onclick=()=>{
          if(value===donutMode)return;
          try{localStorage.setItem(storageKey,value);}catch(_){}
          renderCinemaSummary();
        };
        toolbar.append(button);
      }
    }
    function renderDonut(id,entries,multi=false){

      const host=$(id),all=sorted(entries),total=all.reduce((sum,item)=>sum+item[1],0);
      if(!total){host.innerHTML='<p class="cs-empty">集計できる記録がありません。</p>';return;}
      // Preserve every category: never silently group the long tail as "other".
      // Coordinated muted multi-hue palettes: distinct adjacent categories,
      // while each chart keeps its own overall color character.
      const chartPalettes={
        csGenres:['#7299B0','#B08C72','#8E82B0','#75A49A','#B17F92','#A5A06C','#7291A1','#A28B85'],
        csCountries:['#629D88','#A18E68','#718FA7','#A77986','#8E9F70','#9A82A8','#B08F72','#6E9B9D'],
        csDecades:['#B69A64','#8E91B2','#A97D74','#7F9F8C','#B08BA3','#7896A9','#A49B72','#9687A4'],
        csMethods:['#9382B4','#7398AB','#AD897B','#819F8A','#B28CA0','#A29B70','#7E91B1','#9D8D85']
      };
      const swatches=chartPalettes[id]||chartPalettes.csGenres;
      const colors=all.map((_,i)=>{
        const base=swatches[i%swatches.length];
        if(i<swatches.length)return base;
        // Keep the hue family but differentiate long-tail categories by lightness.
        const cycle=Math.floor(i/swatches.length);
        const adjustment=cycle%2===1?10:-10;
        const hex=base.slice(1);
        const rgb=[0,2,4].map(k=>parseInt(hex.slice(k,k+2),16));
        const adjusted=rgb.map(v=>Math.max(0,Math.min(255,Math.round(v+(adjustment>0?(255-v)*adjustment/100:v*adjustment/100)))));
        return '#'+adjusted.map(v=>v.toString(16).padStart(2,'0')).join('');
      });
      const mode=donutMode;
      const layout=document.createElement('div');layout.className='cs-stack-layout';
      const bar=document.createElement('div');bar.className='cs-stack-bar';
      bar.setAttribute('role','img');
      bar.setAttribute('aria-label',all.map(([name,n])=>name+' '+n+'本').join('、'));
      all.forEach(([name,n],i)=>{
        const segment=document.createElement('span');
        segment.className='cs-stack-segment';
        segment.style.flexGrow=String(n);
        segment.style.backgroundColor=colors[i];
        segment.title=name+'：'+n+'本（'+(n/total*100).toFixed(1)+'%）';
        bar.append(segment);
      });
      layout.append(bar);
      const legend=document.createElement('div');legend.className='cs-donut-legend cs-stack-legend';
      all.forEach(([name,n],i)=>{
        const row=document.createElement('div');row.className='cs-donut-legend-row';
        const dot=document.createElement('span');dot.className='cs-donut-dot';dot.style.background=colors[i];dot.setAttribute('aria-hidden','true');
        const label=document.createElement('span');label.className='cs-donut-label';label.textContent=name;label.title=name;
        const value=document.createElement('span');value.className='cs-donut-value';
        value.textContent=mode==='count'?n+'本':(n/total*100).toFixed(1).replace(/\\.0$/,'')+'%';
        row.append(dot,label,value);legend.append(row);
      });
      layout.append(legend);
      if(multi){const note=document.createElement('div');note.className='cs-donut-note';note.textContent='複数ジャンルを含む登録件数の構成比';layout.append(note);}
      host.replaceChildren(layout);
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
    const id=escapeHTML(movie.id),title=escapeHTML(movie.title||'作品名不明');
    const when=escapeHTML(formatDate(dateOf(movie)));
    const method=escapeHTML(movie.viewingMethod||'');
    return '<article class="movie cinelva-unified-record-card" data-record-card="'+id+'">'+
      '<div class="cinelva-record-poster">'+posterHTML(movie)+'</div>'+
      '<strong class="cinelva-record-title">'+title+'</strong>'+
      '<div class="cinelva-record-meta"><small>'+escapeHTML(movie.year||'公開年不明')+'</small><small>'+when+'</small><small>'+(method||'鑑賞方法未設定')+'</small></div>'+
      '<div class="cinelva-record-review" data-record-review-id="'+id+'"></div>'+
      '<div class="cinelva-record-footer"><button type="button" class="record-delete-icon" data-delete="'+id+'" aria-label="鑑賞記録を削除：'+title+'" title="記録を削除">削除</button></div></article>';
  }
  function mountRecordReviewAreas(scope){
    if(!scope)return;
    scope.querySelectorAll('[data-record-review-id]').forEach(node=>{
      if(node.dataset.gaugeMounted==='true')return;
      const id=node.dataset.recordReviewId;
      const record=state.records.find(item=>String(item.id)===id);
      const movie=record?enriched(record):state.movies.find(item=>String(item.id)===id);
      if(!movie)return;
      const tmdbId=Number(movie.tmdbId??movie.tmdb_id??movie.id??id);
      const film={...movie,id:Number.isInteger(tmdbId)&&tmdbId>0?tmdbId:id,tmdbId:Number.isInteger(tmdbId)&&tmdbId>0?tmdbId:undefined};
      let mounted=false;
      try{mounted=globalThis.CinelvaQuickRate?.mountInline?.(node,film)===true;}catch(error){console.warn('Common review mount error',error);}
      if(mounted)return;
      // Keep ratings and review access visible even if an imported ID lacks TMDB metadata.
      const score=Number(record?.rating??movie.rating??0);
      const community=Number(movie.vote_average??movie.voteAverage??movie.tmdbRating??0);
      node.replaceChildren();
      const box=document.createElement('div');box.className='cinelva-rating-controls cinelva-record-review-fallback';
      const ratings=document.createElement('div');ratings.className='cinelva-rating-pair';
      for(const [name,value] of [['MY評価',Number.isFinite(score)?score.toFixed(1):'—'],['TMDB評価',community>0?(community/2).toFixed(1):'—']]){
        const line=document.createElement('div');line.className='cinelva-rating-line';
        const caption=document.createElement('span');caption.className='rating-caption';caption.textContent=name;
        const number=document.createElement('span');number.className='rating-value';number.textContent=value;
        line.append(caption,number);ratings.append(line);
      }
      const edit=document.createElement('button');edit.type='button';edit.className='cinelva-rate-button';edit.textContent='◉';edit.setAttribute('aria-label','レビューを編集');
      edit.addEventListener('click',()=>{const latest=state.records.find(item=>String(item.id)===id);if(latest)openDialog(latest);});
      box.append(ratings,edit);node.append(box);
    });
  }
  function showReviewDetail(id) {
    const record=state.records.find(item=>String(item.id)===String(id));
    const dialog=$('reviewDetailDialog'),body=$('reviewDetailBody');
    if(!record||!dialog||!body)return;
    const movie=enriched(record),rating=Number(record.rating??0);
    const date=record.watchedAt||record.watched_at||'';
    const method=record.viewingMethod||record.viewing_method||'';
    const comment=record.comment||record.review||'';
    const fields=[
      ['鑑賞日', date?formatDate(date):'未登録'],
      ['鑑賞方法',method||'未登録'],
      ['公開年',movie.year||'不明'],
    ];
    body.innerHTML='<div class="review-detail-film">'+posterHTML(movie)
      +'<div class="review-detail-film-copy"><h3>'+escapeHTML(movie.title||'作品名不明')+'</h3>'
      +'<p class="review-detail-score"><span>あなたの評価</span><strong>'+rating.toFixed(1)+'</strong><small> / 5.0</small></p></div></div>'
      +'<dl class="review-detail-info">'+fields.map(([label,value])=>'<div><dt>'+escapeHTML(label)+'</dt><dd>'+escapeHTML(String(value))+'</dd></div>').join('')+'</dl>'
      +'<div class="review-detail-comment"><h4>レビュー・感想</h4><p>'+escapeHTML(String(comment).trim()||'まだ感想は記録されていません。')+'</p></div>';
    $('reviewDetailEdit').dataset.reviewEdit=String(record.id);
    dialog.showModal();
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
    mountRecordReviewAreas($('recordList'));
  }
  const TAB_STORAGE_KEY = 'cinelva-active-tab-v1';
  function setTab(tab) {
    const tabs = [...document.querySelectorAll('.tab[data-tab]')];
    if (tab === 'calendar') tab = 'summary';
    if (!tabs.some(button => button.dataset.tab === tab) || !$(tab + 'View')) return;
    try { sessionStorage.setItem(TAB_STORAGE_KEY, tab); } catch (_) { /* Storage may be unavailable. */ }
    document.querySelectorAll('.tab').forEach(button => button.setAttribute('aria-selected', String(button.dataset.tab === tab)));
    document.querySelectorAll('.view').forEach(section => { section.hidden = section.id !== tab + 'View'; });
    if (tab === 'summary') { renderCinemaSummary(); renderAwards(); }
    if (tab === 'world') drawWorld();
    if (tab === 'genres') renderGenres();
    if (tab === 'awards') renderAwards();
    if (tab === 'directors') renderDirectors();
  }
  // Dashboard shortcuts use the same tab transition as the main navigation.
  document.getElementById('summaryView')?.addEventListener('click',event=>{
    const shortcut=event.target.closest('[data-dashboard-tab]');
    if(!shortcut)return;
    const tab=shortcut.dataset.dashboardTab;
    if(tab!=='awards'&&tab!=='directors')return;
    setTab(tab);
    document.getElementById(tab+'View')?.scrollIntoView({block:'start'});
  });
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
  function renderAllTimeYears() {
    const totals=new Map(),months=new Map();
    for(const record of recordMovies()){
      const date=dateOf(record),match=/^(\d{4})(?:-(\d{2}))?/.exec(date);
      if(!match)continue;
      const year=Number(match[1]),month=Number(match[2]);
      if(year<1900||year>2100)continue;
      totals.set(year,(totals.get(year)||0)+1);
      if(!months.has(year))months.set(year,Array(12).fill(0));
      if(month>=1&&month<=12)months.get(year)[month-1]++;
    }
    const years=[...new Set([currentYear,...totals.keys()])].sort((a,b)=>b-a);
    $('yearHeatmapTitle').textContent='年間鑑賞カレンダー · オールタイム';
    const host=$('yearHeatmap');
    host.classList.remove('cinelva-annual-calendar');
    host.classList.add('cinelva-alltime-years');
    host.innerHTML=years.map(year=>{
      const total=totals.get(year)||0,monthly=months.get(year)||Array(12).fill(0);
      const gold=total>=50;
      return '<button type="button" class="cy-year-card'+(gold?' is-gold':'')+'" data-calendar-year="'+year+'" aria-label="'+year+'年、'+total+'本'+(gold?'、GOLD':'')+'">'+
        '<span class="cy-year-head"><strong>'+year+'</strong><span class="cy-year-count">'+total+'<small>本</small></span>'+(gold?'<span class="cy-year-gold">GOLD</span>':'')+'</span>'+
        '<span class="cy-year-months">'+monthly.map((n,i)=>'<span class="cy-year-month" title="'+(i+1)+'月：'+n+'本"><i style="--cy-year-level:'+Math.min(1,.18+n*.16)+';'+(n?'':'opacity:.16;')+'"></i><small>'+(i+1)+'</small></span>').join('')+'</span></button>';
    }).join('');
    host.setAttribute('aria-label','年別鑑賞実績。年間50本以上はGOLD');
    $('calendarFilms').innerHTML='';
  }
  function renderYearHeatmap() {
    if($('csPeriod')?.value==='all'){renderAllTimeYears();return;}
    const year=state.year, records=recordMovies(), daily=new Map(), monthly=Array(12).fill(0);
    for(const item of records){
      const date=dateOf(item); if(!date.startsWith(String(year)))continue;
      const month=Number(date.slice(5,7))-1;
      if(month>=0&&month<12)monthly[month]++;
      if(/^\d{4}-\d{2}-\d{2}$/.test(date))daily.set(date,(daily.get(date)||0)+1);
    }
    $('yearHeatmapTitle').textContent='年間鑑賞カレンダー';
    $('yearHeatmap').classList.remove('cinelva-alltime-years');
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
      const achieved=count>=5;
      const tone=achieved?'gold-month':count===0?'empty-month':count===4?'deep-month':count===3?'mid-month':count===2?'light-month':'one-month';
      return '<section class="cy-month '+tone+'" aria-label="'+(m+1)+'月 '+count+'本"><button class="cy-month-head" data-calendar-month="'+m+'"><span class="cy-month-name">'+(m+1)+'月</span><span class="cy-month-total"><strong>'+count+'</strong><small>本</small></span>'+(achieved?medal:'')+'</button><div class="cy-dots">'+cells.join('')+'</div></section>';
    }).join('');
    $('yearHeatmap').setAttribute('aria-label',year+'年の年間鑑賞カレンダー');
  }
  function renderDateFilms(date) {
    const rows = recordMovies().filter(item => dateOf(item) === date);
    $('calendarFilms').innerHTML = rows.length ? `<strong>${date} · ${rows.length}本</strong><div class="record-grid">${rows.map(enriched).map(card).join('')}</div>` : '<span class="hint">この日の鑑賞記録はありません。</span>';
    mountRecordReviewAreas($('calendarFilms'));
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
    const decades = [...new Set([...data.decades,1950,1960,1970,1980,1990,2000,2010,2020])].sort((a,b)=>b-a);
    const awardDisplayName = name => /^(?:BAFTA|British Academy Film Awards|英国アカデミー賞)$/i.test(String(name).trim()) ? '英国アカデミー賞（BAFTA）' : name;
    // Editorial order is intentionally curated, not an objective numeric rating of prestige.
    const priority=['アカデミー賞','カンヌ国際映画祭','ヴェネチア国際映画祭','ベルリン国際映画祭','英国アカデミー賞','BAFTA','ゴールデングローブ賞','日本アカデミー賞','キネマ旬報ベスト・テン'];
    const awardRank=name=>{const index=priority.indexOf(name);return index<0?priority.length:index;};
    const includeDomestic=$('awardOther')?.checked===true;
    const organizations=[...data.organizations].filter(name=>includeDomestic||name!=='キネマ旬報ベスト・テン').sort((a,b)=>awardRank(a)-awardRank(b)||a.localeCompare(b,'ja'));
    const category=$('awardCategory')?.value||'all';
    const inCategory=name=>{
      if(category==='all')return true;
      if(category==='picture')return /作品賞|パルム・ドール|金獅子賞|金熊賞|グランプリ|審査員大賞|審査員グランプリ|作品賞（第1位）/.test(name);
      if(category==='director')return /監督賞/.test(name);
      if(category==='acting')return /主演|助演|男優賞|女優賞|俳優賞/.test(name);
      if(category==='writing')return /脚本|脚色/.test(name);
      if(category==='animation')return /アニメ/.test(name);
      if(category==='technical')return /撮影|編集|美術|音楽|作曲|音響|録音|視覚効果|特殊効果|衣装|メイクアップ|照明/.test(name);
      return false;
    };
    const scopedCell=(name,decade)=>{
      const original=data.cells[`${name}:${decade}`];
      if(!original)return null;
      if(category==='all')return original;
      const entries=original.entries.filter(entry=>entry.categories.some(inCategory));
      // The source stores categories per film, so count each film once per cell.
      const count=entries.filter(entry=>entry.watched).length;
      return {...original,entries,count,completionRate:null};
    };
    const hasRate=category==='all'&&organizations.some(name=>decades.some(decade=>scopedCell(name,decade)?.completionRate!==null));
    $('awardMode').querySelector('[value="rate"]').disabled=!hasRate;
    if(!hasRate)$('awardMode').value='count';
    const rate=$('awardMode').value==='rate';
    const cells=organizations.flatMap(name=>decades.map(decade=>scopedCell(name,decade)).filter(Boolean));
    const populated=cells.filter(cell=>cell.entries?.length);
    const watchedIds=new Set(populated.flatMap(cell=>cell.entries.filter(entry=>entry.watched).map(entry=>String(entry.id||entry.title))));
    const awardCount=new Set(populated.flatMap(cell=>cell.entries.map(entry=>String(entry.id||entry.title)))).size;
    const activeDecades=decades.filter(decade=>organizations.some(name=>(scopedCell(name,decade)?.count||0)>0)).length;
    const topAward=[...organizations].map(name=>({name,count:decades.reduce((sum,d)=>sum+(scopedCell(name,d)?.count||0),0)})).sort((a,b)=>b.count-a.count)[0];
    // Personal award affinity: unique watched winners only, never nominations.
    const ratingById=new Map();
    for(const record of recordMovies()){
      const movie=enriched(record),rating=Number(record.rating);
      if(Number.isFinite(rating)&&rating>0){
        for(const key of [movie.tmdbId,movie.tmdb_id,movie.id,movie.title].filter(Boolean))
          ratingById.set(String(key),rating);
      }
    }
    // Dashboard award metrics always mean the top picture prize, regardless of
    // the category selected in the separate award collection.
    const isPictureWinner=entry=>(entry.categories||[]).some(c=>/作品賞|パルム・ドール|金獅子賞|金熊賞/.test(String(c)));
    const pictureEntries=(name,decade)=>(data.cells[name+':'+decade]?.entries||[]).filter(isPictureWinner);
    // Original geometric CINELVA award symbols. Not official festival trademarks.
    // Approved artwork is rendered from a real PNG sprite. Do not redraw or replace it with SVG.
    const awardEmblem=name=>{
      const n=String(name);
      const variant=/日本アカデミー/i.test(n)?'japan-academy':/カンヌ/i.test(n)?'cannes':/ヴェネチア|ベネチア/i.test(n)?'venice':/ベルリン/i.test(n)?'berlin':/BAFTA|英国アカデミー/i.test(n)?'bafta':/ゴールデングローブ/i.test(n)?'golden-globes':/アカデミー賞|Oscar/i.test(n)?'academy':'academy';
      return '<span class="cinelva-affinity-visual cinelva-award-emblem cinelva-award-emblem--'+variant+'" aria-hidden="true"></span>';
    };
    const awardAffinity=organizations.map(name=>{
      const unique=new Map();
      for(const decade of decades)for(const entry of pictureEntries(name,decade)){
        if(!entry.watched)continue;
        const key=String(entry.id||entry.title);
        if(!unique.has(key))unique.set(key,entry);
      }
      const scores=[...unique.values()].map(entry=>ratingById.get(String(entry.id||entry.title))).filter(v=>Number.isFinite(v)&&v>0);
      return {name,watched:unique.size,scored:scores.length,average:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0,high:scores.filter(v=>v>=4).length};
    }).filter(row=>row.scored>0).sort((a,b)=>(b.average*Math.min(b.scored,3)/3)-(a.average*Math.min(a.scored,3)/3)||b.scored-a.scored);
    const allAwardGroups=organizations.map(name=>{
      const ids=new Set();
      for(const decade of decades)for(const entry of pictureEntries(name,decade))if(entry.watched)ids.add(String(entry.id||entry.title));
      return {name,count:ids.size};
    });
    const mostWatchedAward=[...allAwardGroups].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'ja'))[0];
    const highestAward=awardAffinity[0];
    const awardHighlights='<div class="cs-collection-highlights">'+
      '<div class="cs-highlight"><span class="cs-highlight-label">作品賞を鑑賞した映画賞</span><strong class="cs-highlight-value">'+allAwardGroups.filter(x=>x.count>0).length+'賞</strong></div>'+
      '<div class="cs-highlight"><span class="cs-highlight-label">作品賞を最も鑑賞した映画賞</span><strong class="cs-highlight-value">'+escapeHTML(mostWatchedAward?.count?awardDisplayName(mostWatchedAward.name):'—')+'</strong><small class="cs-highlight-detail">'+(mostWatchedAward?.count||0)+'本</small></div>'+
      '<div class="cs-highlight"><span class="cs-highlight-label">作品賞の平均評価が最高の映画賞</span><strong class="cs-highlight-value">'+escapeHTML(highestAward?awardDisplayName(highestAward.name):'—')+'</strong><small class="cs-highlight-detail">'+(highestAward?'★ '+highestAward.average.toFixed(2)+' / '+highestAward.scored+'本評価':'評価なし')+'</small></div>'+
      '<div class="cs-highlight"><span class="cs-highlight-label">映画賞別の鑑賞記録</span><button type="button" class="cs-highlight-value" data-dashboard-tab="awards">映画賞コレクションを見る →</button></div>'+
      '</div>';
    let awardAffinityHost=$('csAwardAffinity');
    if(!awardAffinityHost){awardAffinityHost=document.createElement('section');awardAffinityHost.id='csAwardAffinity';awardAffinityHost.className='cinelva-affinity';$('csAffinities')?.append(awardAffinityHost);}
    awardAffinityHost.innerHTML='<h3>映画賞の鑑賞分析</h3>'+awardHighlights+'<h3>高評価の作品賞 TOP5</h3><p class="cinelva-affinity-note">各映画賞の作品賞受賞作のみを集計。評価3本未満は順位を補正し、未評価は平均点から除外します。</p>'+
      (awardAffinity.length?'<div class="cinelva-affinity-list">'+awardAffinity.slice(0,5).map((row,i)=>'<div class="cinelva-affinity-row"><span class="cinelva-affinity-rank">'+(i+1)+'</span>'+awardEmblem(row.name)+'<button type="button" class="cinelva-affinity-link" data-dashboard-tab="awards" aria-label="映画賞コレクションを開く">'+escapeHTML(awardDisplayName(row.name))+'</button><span class="cinelva-affinity-meta">★ '+row.average.toFixed(2)+' · '+row.scored+'本評価 · 4点以上 '+row.high+'本</span></div>').join('')+'</div>':'<p class="cs-empty">評価済みの受賞作品がありません。</p>');
    const summary=$('awardSummary');
    if(summary)summary.innerHTML=`<div class="award-stat"><span>鑑賞した受賞作品</span><strong>${watchedIds.size}<small>本</small></strong></div><div class="award-stat"><span>収録対象作品</span><strong>${awardCount}<small>本</small></strong></div><div class="award-stat"><span>鑑賞がある年代</span><strong>${activeDecades}<small>年代</small></strong></div><div class="award-stat"><span>最も鑑賞した映画賞</span><strong class="award-stat-name">${escapeHTML(topAward?.count?awardDisplayName(topAward.name):'—')}</strong></div>`;
    $('awardCoverage').textContent=`収録された主要映画賞の受賞作品に基づく記録です。網羅的な受賞歴ではありません。${hasRate?'達成率は対象作品の全件性を確認できた年代のみ表示します。':'対象作品の全件性が確認できないため、達成率は表示できません。'}`;
    $('awardMatrix').innerHTML=`<table class="award-table"><thead><tr><th scope="col">映画賞</th>${decades.map(d=>`<th scope="col">${d}<small>年代</small></th>`).join('')}<th scope="col" class="award-total-head">鑑賞計</th></tr></thead><tbody>${organizations.map(name=>{const total=decades.reduce((sum,decade)=>sum+(scopedCell(name,decade)?.count||0),0);return `<tr><th scope="row">${escapeHTML(awardDisplayName(name))}</th>${decades.map(decade=>{const cell=scopedCell(name,decade);if(!cell)return '<td class="award-empty" aria-label="受賞データの確認対象外"><span aria-hidden="true">—</span></td>';const value=category!=='all'&&!cell.entries.length?'—':rate?(cell.completionRate===null?'—':`${Math.round(cell.completionRate*100)}%`):cell.count;const selected=state.awardSelection?.organization===name&&state.awardSelection?.decade===decade;const level=rate?Math.ceil((cell.completionRate||0)*4):Math.min(4,cell.count);return `<td><button type="button" class="award-cell heat-${level}${selected?' is-selected':''}" aria-pressed="${selected}" data-award-cell="${escapeHTML(name)}|${decade}" aria-label="${escapeHTML(awardDisplayName(name))}、${decade}年代、鑑賞済み受賞作品${cell.count}本">${value}</button></td>`;}).join('')}<td class="award-row-total">${total}<small>本</small></td></tr>`;}).join('')}</tbody></table>`;
    const cell=state.awardSelection&&scopedCell(state.awardSelection.organization,state.awardSelection.decade);
    const awardHeading=state.awardSelection?'<div class="award-detail-head"><div><span class="award-detail-kicker">AWARD COLLECTION</span><h3>'+escapeHTML(awardDisplayName(state.awardSelection.organization))+' · '+state.awardSelection.decade+'年代</h3><p>受賞作品の鑑賞状況 · '+(cell?.count||0)+'本鑑賞済み</p></div><button type="button" class="award-detail-close" data-close-award aria-label="詳細を閉じる">×</button></div>':'';
    const awardEntries=cell?[...cell.entries].sort((a,b)=>Number(b.watched)-Number(a.watched)||String(a.title).localeCompare(String(b.title),'ja')):null;
    const awardCard=entry=>{
      const entryId=String(entry.id||'');
      const record=state.records.find(item=>entryId&&String(item.id)===entryId)
        ||state.records.find(item=>normalizeRecordSearch(item.title)===normalizeRecordSearch(entry.title));
      const info=byId.get(entryId)||state.movies.find(item=>entryId&&String(item.id)===entryId)||{};
      const metadata={...info,...(record?enriched(record):{}),id:entryId||info.id||'',title:info.title||entry.title,year:info.year||entry.awardYears?.[0]||''};
      const status=record?'鑑賞済み':entryId?'未鑑賞':'照合保留';
      const headline='<div class="award-film-top"><span class="award-watch-state '+(record?'is-watched':'is-unwatched')+'">'+status+'</span><span class="award-film-year">'+escapeHTML((entry.awardYears||[]).join('・'))+'</span></div>';
      const category='<small class="award-card-category">'+escapeHTML((entry.categories||[]).join('・'))+'</small>';
      const sources=(entry.sources||[]).filter(url=>/^https:\/\//.test(url)).map(url=>'<a class="award-card-source" href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">出典 ↗</a>').join('');
      const id=String(metadata.id||'');
      const detail=id?'<a class="award-card-open" href="../search.html?id='+encodeURIComponent(id)+'&search='+encodeURIComponent(metadata.title)+'" aria-label="作品詳細：'+escapeHTML(metadata.title)+'">'+escapeHTML(metadata.title)+'</a>':'<strong>'+escapeHTML(metadata.title)+'</strong>';
      return '<article class="movie award-film-unit">'+headline+posterHTML(metadata)+detail+category+'<div class="award-common-review" data-award-review-id="'+escapeHTML(id)+'"></div>'+sources+'</article>';
    };
    $('awardFilms').innerHTML=cell?awardHeading+(awardEntries.length?awardEntries.map(awardCard).join(''):'<p class="hint">この年代の受賞作品はまだ収録されていません。</p>'):'<div class="award-invite"><span aria-hidden="true">✦</span><p>マトリクスの数字をタップすると、その年代の受賞作品と鑑賞状況を見られます。</p></div>';
    if(cell&&globalThis.CinelvaQuickRate?.mountInline){
      $('awardFilms').querySelectorAll('[data-award-review-id]').forEach(node=>{
        const id=node.dataset.awardReviewId;
        if(!id)return;
        const entry=awardEntries.find(x=>String(x.id||'')===id);
        const film=byId.get(id)||state.movies.find(x=>String(x.id)===id)||{};
        globalThis.CinelvaQuickRate.mountInline(node,{...film,id:Number(id),tmdbId:Number(id),title:film.title||entry?.title||'作品'});
      });
    }
  }
  const normalizeName = value => String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
  const directorJapaneseNames = new Map([["christopher nolan","クリストファー・ノーラン"],["steven spielberg","スティーヴン・スピルバーグ"],["martin scorsese","マーティン・スコセッシ"],["quentin tarantino","クエンティン・タランティーノ"],["david fincher","デヴィッド・フィンチャー"],["denis villeneuve","ドゥニ・ヴィルヌーヴ"],["james cameron","ジェームズ・キャメロン"],["ridley scott","リドリー・スコット"],["stanley kubrick","スタンリー・キューブリック"],["wes anderson","ウェス・アンダーソン"],["greta gerwig","グレタ・ガーウィグ"],["bong joon-ho","ポン・ジュノ"],["park chan-wook","パク・チャヌク"],["hayao miyazaki","宮崎駿"],["akira kurosawa","黒澤明"],["hirokazu kore-eda","是枝裕和"],["makoto shinkai","新海誠"],["yorgos lanthimos","ヨルゴス・ランティモス"],["guillermo del toro","ギレルモ・デル・トロ"],["alfonso cuarón","アルフォンソ・キュアロン"],["paul thomas anderson","ポール・トーマス・アンダーソン"],["francis ford coppola","フランシス・フォード・コッポラ"],["sofia coppola","ソフィア・コッポラ"],["clint eastwood","クリント・イーストウッド"],["tim burton","ティム・バートン"],["peter jackson","ピーター・ジャクソン"],["george lucas","ジョージ・ルーカス"],["rian johnson","ライアン・ジョンソン"],["damien chazelle","デイミアン・チャゼル"],["robert zemeckis","ロバート・ゼメキス"]]);
  for(const [en,ja] of Object.entries({
    "jordan peele":"ジョーダン・ピール","ari aster":"アリ・アスター","robert eggers":"ロバート・エガース","jordan vogt-roberts":"ジョーダン・ヴォート＝ロバーツ",
    "josef rusnak":"ジョセフ・ラスナック","paul greengrass":"ポール・グリーングラス","martin campbell":"マーティン・キャンベル",
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
        for(const alias of [d.name,d.nameJa,d.name_ja,d.japanese_name,d.original_name,...(d.also_known_as||[])]){
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
    if (/\bshort\b|短編|短篇|\btv\b|\btv_series\b|\bepisode\b/.test(type)) return false;
    if (work.cast===true||work.actor===true||work.self===true||work.is_director===false||work.isDirector===false) return false;
    const role=String(work.job||work.role||work.credit_type||work.creditType||'').trim().toLowerCase();
    if (role && !['director','監督'].includes(role)) return false;
    const department=String(work.department||'').trim().toLowerCase();
    if (department && !['directing','監督'].includes(department)) return false;
    const named=String(work.director||work.director_name||work.directorName||'').trim();
    // Use the same kana-equivalence rules as the director picker.
    // Without this, sourced works can disappear for ヴ/ブ or イィ spellings.
    const directorSpellingKey=value=>normalizeName(directorJapanese(value))
      .replace(/ヴ/g,'ブ').replace(/ィ/g,'イ').replace(/ェ/g,'エ').replace(/ー/g,'');
    if (named && directorSpellingKey(named)!==directorSpellingKey(directorName)) return false;
    // Missing credits are not evidence of direction; require an explicit match.
    return role==='director'||role==='監督'||work.is_director===true||work.isDirector===true||Boolean(named);
  };
  // Milestones use distinct watched feature films, not review edits or ratings.
  // A complete collection is only awarded when the full filmography is known.
  const directorMedalHistory=new Map();
  let directorMedalUpdatePending=false;
  const directorMedalTier=(watched,total,verified)=>{
    if(verified&&total>0&&watched>=total)return {rank:4,label:'Complete',symbol:'✦'};
    if(watched>=10)return {rank:3,label:'Gold',symbol:'★'};
    if(watched>=5)return {rank:2,label:'Silver',symbol:'★'};
    if(watched>=3)return {rank:1,label:'Bronze',symbol:'★'};
    return null;
  };
  const ensureDirectorMedalStyles=()=>{
    if(document.getElementById('cinelva-director-medals-style'))return;
    const style=document.createElement('style');style.id='cinelva-director-medals-style';
    style.textContent=`
      .director-pick{position:relative}
      .director-card-photo{position:relative;display:block}
      .director-medal-wrap{position:absolute;z-index:2;right:4px;bottom:4px;display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;filter:drop-shadow(0 1px 3px #0008)}
      .director-medal-label{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:9px;font-weight:500;line-height:1.15;letter-spacing:.02em;color:#c48b60;text-shadow:0 1px 3px #000,0 0 4px #000;text-align:center;white-space:nowrap}
      .director-medal-label[data-tier="2"]{color:#b9c3d2}
      .director-medal-label[data-tier="3"]{color:#e6bc5b}
      .director-medal-label[data-tier="4"]{color:#73b7f6}
      .director-medal{position:relative;display:block;width:24px;height:24px;flex:none;border-radius:50%;box-sizing:border-box;overflow:hidden;pointer-events:none;box-shadow:0 2px 5px #0008;background-image:url('../assets/E2B78401-CCF3-46CB-B9AB-32CE69754AC0.png');background-repeat:no-repeat;background-size:120.96px 40.32px;background-position:-4.46px -7.2px}
      .director-medal[data-tier="2"]{background-position:-33.68px -7.2px}
      .director-medal[data-tier="3"]{background-position:-63.2px -7.2px}
      .director-medal[data-tier="4"]{background-position:-92.58px -7.2px}
      .director-medal-wrap.director-medal-earned{animation:cinelva-medal-earned .85s ease-out both}
      @keyframes cinelva-medal-earned{0%{transform:scale(.75);opacity:.45}50%{transform:scale(1.12);opacity:1}100%{transform:scale(1);opacity:1}}
      @media(max-width:390px){.director-medal-wrap{right:3px;bottom:3px}}
      @media(prefers-reduced-motion:reduce){.director-medal-wrap.director-medal-earned{animation:none!important}}
    `;
    document.head.append(style);
  };
  function renderDirectors() {
    const groups=new Map();
    const knownDirectors=Object.values(state.directors||{});
    const canonical=name=>normalizeName(directorJapanese(name)).replace(/[・･.．\s\u3000]/g,'').replace(/ヴ/g,'ブ').replace(/ィ/g,'イ').replace(/ェ/g,'エ').replace(/ー/g,'');
    // A one-character difference is not sufficient evidence to merge people.
    // Prefer the stable sourced TMDB person ID; reject ambiguous aliases.
    const knownByName=new Map();
    const ambiguousNames=new Set();
    for(const d of knownDirectors)for(const alias of [d.name,d.nameJa,d.name_ja,d.japanese_name,d.original_name,...(d.also_known_as||[])]){
      if(!alias)continue;
      const key=canonical(alias);
      if(knownByName.has(key)&&String(knownByName.get(key).id)!==String(d.id))ambiguousNames.add(key);
      else knownByName.set(key,d);
    }
    for(const key of ambiguousNames)knownByName.delete(key);
    // Look up by stable person identity first; translated names can differ between
    // historical viewing records and the current TMDB snapshot.
    const directorByPersonId=new Map(knownDirectors.map(person=>[String(person.id),person]));
    const personIdsByMovie=new Map();
    for(const person of knownDirectors)for(const work of person.works||[]){
      const key=String(work.id),ids=personIdsByMovie.get(key)||new Set();
      ids.add(String(person.id));personIdsByMovie.set(key,ids);
    }
    // Legacy imports sometimes have no TMDB ID. A unique exact title/year pair
    // from an authoritative directing credit is a safe additional lookup.
    const personIdsByFilmTitleYear=new Map();
    const titleYearKey=(title,year)=>{
      const normalized=String(title||'').normalize('NFKC').toLowerCase().replace(/[\s・･:：!！?？'’"“”.,，。－ー-]/g,'');
      const date=String(year||'').match(/(?:18|19|20)\d{2}/)?.[0];
      return normalized&&date?normalized+'|'+date:'';
    };
    for(const person of knownDirectors)for(const work of person.works||[]){
      for(const title of [work.original_title,work.title]){
        const key=titleYearKey(title,work.year||work.release_date||work.date);
        if(!key)continue;
        const ids=personIdsByFilmTitleYear.get(key)||new Set();
        ids.add(String(person.id));
        personIdsByFilmTitleYear.set(key,ids);
      }
    }
    const resolveDirector=(name,records=[])=>{
      const matched=knownByName.get(canonical(name));
      if(matched)return matched;
      // A unique sourced director of a reviewed movie is a safe fallback when
      // the old record uses an unrecognized Japanese/English spelling.
      const candidates=new Set();
      for(const movie of records){
        const explicitId=movie.director_id??movie.directorId;
        if(explicitId&&directorByPersonId.has(String(explicitId)))
          candidates.add(String(explicitId));
        else{
          const ids=personIdsByMovie.get(String(movie.tmdbId??movie.tmdb_id??movie.id));
          if(ids?.size===1)candidates.add([...ids][0]);
          else if(!ids?.size){
            // Only match when both the exact title/year and its credited
            // director are unambiguous across all sourced profiles.
            const titles=[movie.original_title,movie.originalTitle,movie.title];
            for(const title of titles){
              const key=titleYearKey(title,movie.year||movie.release_date||movie.releaseDate||movie.date);
              const matches=personIdsByFilmTitleYear.get(key);
              if(matches?.size===1){candidates.add([...matches][0]);break;}
            }
          }
        }
      }
      return candidates.size===1?directorByPersonId.get([...candidates][0]):undefined;
    };
    const directorIdentity=name=>{
      const found=resolveDirector(name);
      return found?'tmdb-person:'+found.id:'name:'+canonical(name);
    };
    const filmIdentity=movie=>String(movie.tmdbId??movie.tmdb_id??movie.id);
    const movieById=new Map(state.movies.map(movie=>[filmIdentity(movie),movie]));
    const directorKey=name=>directorIdentity(name);
    for(const record of ratedMovies().filter(item=>Number(item.rating)>0)){
      const movie=enriched(record),name=String(movie.director||'').trim();
      if(!name)continue;
      const displayName=directorJapanese(name),key=directorKey(name);
      if(!groups.has(key))groups.set(key,{name:displayName,records:[],ids:new Set()});
      const group=groups.get(key),id=filmIdentity(movie);
      if(!group.ids.has(id)){group.ids.add(id);group.records.push(movie);}
    }
    // Reviews determine which directors appear; every watched film counts for those directors.
    for(const record of recordMovies()){
      const movie=enriched(record),group=groups.get(directorKey(movie.director));
      if(group&&!group.ids.has(filmIdentity(movie))){group.ids.add(filmIdentity(movie));group.records.push(movie);}
    }
    const host=$('directorTimeline'),works=$('directorWorks');
    host.replaceChildren();works.replaceChildren();
    // Director selection is based on the user's reviewed movies only; catalog-only directors stay hidden.
    const filmographyFor=group=>{
      const director=resolveDirector(group.name,group.records);
      const sourcedName=director?.name||group.name;
      const watched=new Map(group.records.map(movie=>[filmIdentity(movie),movie]));
      const all=new Map();
      for(const work of director?.works||[]){
        // Sourced director credits are authoritative. General movie metadata may
        // have another lead director or missing runtime and must not veto them.
        if(!isDirectorCredit(work,sourcedName))continue;
        const id=filmIdentity(work), metadata=movieById.get(id)||{};
        const combined={...metadata,...work,id};
        all.set(id,combined);
      }
      for(const movie of group.records){if(!isDirectorCredit(movie,group.name))continue;const id=filmIdentity(movie);all.set(id,{...(all.get(id)||{}),...movie,id});}
      const films=[...all.values()];
      // Counts are derived from distinct, verified director credits, not arbitrary minimums per person.
      const sourcedCount=new Set((director?.works||[]).filter(work=>isDirectorCredit(work,sourcedName)).map(filmIdentity)).size;
      const catalogAvailable=Boolean(director && sourcedCount>0 && director?.coverage?.truncated!==true);
      return {director,watched,films,catalogAvailable,watchedCount:films.filter(movie=>watched.has(String(movie.id))).length};
    };
    const sorted=[...groups.values()].map(group=>({...group,filmography:filmographyFor(group)})).filter(group=>group.filmography.watchedCount>0).sort((a,b)=>b.filmography.watchedCount-a.filmography.watchedCount||a.name.localeCompare(b.name,'ja'));
    // Each director contributes only their highest earned tier.
    const medalCounts={1:0,2:0,3:0,4:0};
    const nearlyComplete=[];
    for(const group of sorted){
      const f=group.filmography;
      const tier=directorMedalTier(f.watchedCount,f.films.length,f.catalogAvailable);
      if(tier)medalCounts[tier.rank]++;
      if(f.catalogAvailable&&f.films.length>f.watchedCount&&f.films.length-f.watchedCount===1)nearlyComplete.push(group.name);
    }
    const directorDashboard=document.createElement('section');
    directorDashboard.className='director-collection-dashboard';
    directorDashboard.setAttribute('aria-label','監督コレクションの達成実績');
    directorDashboard.innerHTML='<h3>コレクション実績</h3><div class="director-achievement-grid">'+[
      [4,'Complete','全作品'],[3,'Gold','10本以上'],[2,'Silver','5本以上'],[1,'Bronze','3本以上']
    ].map(([rank,name,threshold])=>'<div class="director-achievement" data-tier="'+rank+'"><strong>'+medalCounts[rank]+'</strong><span>'+name+'</span><small>'+threshold+'</small></div>').join('')+'</div>'+
      (nearlyComplete.length?'<p class="director-nearly-complete">Completeまであと1作品：'+nearlyComplete.slice(0,3).map(escapeHTML).join('、')+'</p>':'');
    // Director affinity uses reviewed films only. Unrated watches never
    // contribute a zero to the mean, and a single review is not over-ranked.
    const affinity=sorted.map(group=>{
      const scores=group.records.map(movie=>Number(movie.rating)).filter(v=>Number.isFinite(v)&&v>0);
      return {...group,scored:scores.length,average:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0,high:scores.filter(v=>v>=4).length};
    }).filter(group=>group.scored>0).sort((a,b)=>(b.average*Math.min(b.scored,3)/3)-(a.average*Math.min(a.scored,3)/3)||b.scored-a.scored);
    const watchedDirectorGroups=new Map();
    for(const record of recordMovies()){
      const movie=enriched(record),name=String(movie.director||'').trim();
      if(!name)continue;
      const key=directorKey(name);
      if(!watchedDirectorGroups.has(key))watchedDirectorGroups.set(key,{name:directorJapanese(name),ids:new Set()});
      watchedDirectorGroups.get(key).ids.add(filmIdentity(movie));
    }
    const mostWatchedDirector=[...watchedDirectorGroups.values()].sort((a,b)=>b.ids.size-a.ids.size||a.name.localeCompare(b.name,'ja'))[0];
    const highestDirector=affinity[0];
    const directorHighlights='<div class="cs-collection-highlights">'+
      '<div class="cs-highlight"><span class="cs-highlight-label">鑑賞した監督</span><strong class="cs-highlight-value">'+watchedDirectorGroups.size+'人</strong></div>'+
      '<div class="cs-highlight"><span class="cs-highlight-label">最も鑑賞した監督</span><strong class="cs-highlight-value">'+escapeHTML(mostWatchedDirector?.name||'—')+'</strong><small class="cs-highlight-detail">'+(mostWatchedDirector?.ids.size||0)+'本</small></div>'+
      '<div class="cs-highlight"><span class="cs-highlight-label">最高平均評価の監督</span><strong class="cs-highlight-value">'+escapeHTML(highestDirector?.name||'—')+'</strong><small class="cs-highlight-detail">'+(highestDirector?'★ '+highestDirector.average.toFixed(2)+' / '+highestDirector.scored+'本評価':'評価なし')+'</small></div>'+
      '<div class="cs-highlight"><span class="cs-highlight-label">監督別の鑑賞記録</span><button type="button" class="cs-highlight-value" data-dashboard-tab="directors">監督コレクションを見る →</button></div>'+
      '</div>';
    const affinityPanel=document.createElement('section');
    affinityPanel.className='cinelva-affinity';
    affinityPanel.innerHTML='<h3>監督の鑑賞分析</h3>'+directorHighlights+'<h3>高評価の監督 TOP10</h3><p class="cinelva-affinity-note">平均評価・評価本数・4点以上の本数。評価3本未満は順位を補正します。</p>'+
      (affinity.length?'<div class="cinelva-affinity-list">'+affinity.slice(0,10).map((group,i)=>'<div class="cinelva-affinity-row"><span class="cinelva-affinity-rank">'+(i+1)+'</span><span class="cinelva-affinity-visual">'+(()=>{const profile=group.filmography?.director;const source=String(profile?.profile_path||profile?.profilePath||profile?.photo||profile?.image||'');const url=source.startsWith('/')?'https://image.tmdb.org/t/p/w185'+source:source;return /^https:\/\//i.test(url)?'<img src="'+escapeHTML(url)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="cinelva-affinity-placeholder" aria-hidden="true">監督</span>';})()+'</span><button type="button" class="cinelva-affinity-link" data-dashboard-tab="directors" aria-label="監督コレクションを開く">'+escapeHTML(group.name)+'</button><span class="cinelva-affinity-meta">★ '+group.average.toFixed(2)+' · '+group.scored+'本評価 · 4点以上 '+group.high+'本</span></div>').join('')+'</div>':'<p class="cs-empty">監督別の評価記録がありません。</p>');
    $('csDirectorAffinity')?.replaceChildren(affinityPanel);
    if(!sorted.length){host.append(directorDashboard);host.insertAdjacentHTML('beforeend','<p class="empty">監督情報がある鑑賞記録はまだありません。</p>');return;}
    const list=document.createElement('div');list.className='director-picker';
    const detail=document.createElement('div');detail.className='director-filmography';
    detail.id='directorFilmography';
    detail.hidden=true; // Do not show an empty gold-bordered panel before a director is selected.
    // Keep mobile columns independent of legacy stylesheet precedence and cached CSS.
    list.style.setProperty('display','grid','important');
    list.style.setProperty('grid-template-columns','repeat(3,minmax(0,1fr))','important');
    list.style.setProperty('gap','8px','important');
    list.style.setProperty('width','100%','important');
    list.style.setProperty('max-width','none','important');
    list.style.setProperty('flex-direction','initial','important');
    list.dataset.layout='three-column';
    detail.style.setProperty('grid-column','1 / -1','important');
    const sortBar=document.createElement('div');
    sortBar.className='director-sort-bar';
    sortBar.style.cssText='display:flex;align-items:center;justify-content:flex-end;gap:8px;margin:0 0 12px;flex-wrap:wrap';
    const sortLabel=document.createElement('label');
    sortLabel.textContent='並び順';
    sortLabel.setAttribute('for','directorCollectionSort');
    sortLabel.style.cssText='font-size:12px;color:#c5c5c5';
    const sortSelect=document.createElement('select');
    sortSelect.id='directorCollectionSort';
    sortSelect.setAttribute('aria-label','監督コレクションの並び順');
    sortSelect.style.cssText='max-width:210px;min-height:36px;padding:6px 10px;border:1px solid #555;border-radius:8px;background:#171b23;color:#f1f1f1;font-size:13px';
    for(const [value,label] of [
      ['reviewed','レビュー済み本数順'],
      ['completion','鑑賞率が高い順'],
      ['total','監督作品が多い順'],
      ['name','監督名の五十音順']
    ]){const option=document.createElement('option');option.value=value;option.textContent=label;sortSelect.append(option);}
    try{const saved=sessionStorage.getItem('cinelva-director-sort');if([...sortSelect.options].some(x=>x.value===saved))sortSelect.value=saved;}catch(_){}
    sortBar.append(sortLabel,sortSelect);
    host.append(directorDashboard,sortBar,list,detail);
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
    const filmTile=(movie,watched,directorName,index)=>{
      const title=escapeHTML(movie.title||movie.name||'作品名不明'),year=directorFilmYear(movie,directorName);
      const rating=Number(movie.rating||0);
      return '<article class="director-film-tile '+(watched?'is-watched':'is-unwatched')+'">'+
        '<a class="director-film-poster" href="../search.html?id='+encodeURIComponent(String(movie.id||''))+'" aria-label="'+title+'の作品情報">'+posterHTML(movie)+'</a>'+
        '<div class="director-film-meta"><span class="director-film-year">'+(year||'年不明')+'</span><span class="director-film-title" title="'+title+'">'+title+'</span>'+
        ''+'<span class="director-film-rate-slot" data-film-index="'+index+'"></span></div></article>';
    };
    const show=(group,row)=>{
      list.querySelectorAll('.director-pick').forEach(button=>{button.classList.toggle('active',button===row);button.setAttribute('aria-expanded',String(button===row));});
      const {director,watched,watchedCount,catalogAvailable}=group.filmography;
      const films=[...group.filmography.films].sort((a,b)=>(directorFilmYear(a,group.name)||9999)-(directorFilmYear(b,group.name)||9999)||String(a.title||'').localeCompare(String(b.title||''),'ja'));
      const profileImage=director?.profile_path||director?.profilePath||director?.photo||director?.image||'';
      const photoUrl=profileImage.startsWith('/')?'https://image.tmdb.org/t/p/w185'+profileImage:profileImage;
      const safePhoto=/^https:\/\//.test(photoUrl)?photoUrl:'';
      const profileDetails=[director?.birth_date||director?.birthday?('生年月日：'+(director.birth_date||director.birthday)):'',director?.place_of_birth?('出身地：'+director.place_of_birth):''].filter(Boolean);
      if(director?.name_status==='transliterated'&&director.original_name){profileDetails.unshift('原名：'+director.original_name);profileDetails.push('日本語名は原名からのカタカナ表記です。');}
      const biography=director?.biography_ja?'<details class="director-biography"><summary>経歴を読む</summary><p>'+escapeHTML(director.biography_ja)+'</p></details>':'';
      const sourceUrl=/^https:\/\/www\.themoviedb\.org\/person\/\d+$/.test(director?.source_url||'')?director.source_url:'';
      const progress=catalogAvailable?watchedCount+' / '+films.length+'本 採点済み':watchedCount+'本 鑑賞済み · 総数未取得';
      const progressTrack=catalogAvailable?'<div class="director-progress-track"><span style="width:'+Math.round(watchedCount/Math.max(1,films.length)*100)+'%"></span></div>':'';
      const coverageNote=catalogAvailable?'収録作品 '+films.length+'本のうち '+watchedCount+'本を鑑賞。公開年の古い順に表示。'+(director?.coverage?.truncated===false?'TMDBの監督クレジットから収録（本数による切り捨てなし）。':'※全フィルモグラフィーを保証する数字ではありません。'):'監督作品の一覧は未取得です。鑑賞記録のある作品だけを表示しています。';
      detail.innerHTML='<div class="director-profile">'+(safePhoto?'<img class="director-profile-photo" src="'+escapeHTML(safePhoto)+'" alt="'+escapeHTML(group.name)+'の写真" loading="lazy">':'')+'<div class="director-profile-body"><h3>'+escapeHTML(group.name)+'</h3><strong class="director-progress">'+progress+'</strong>'+progressTrack+profileDetails.map(v=>'<p>'+escapeHTML(v)+'</p>').join('')+biography+'</div></div>'+
        '<div class="director-poster-grid">'+films.map((movie,index)=>filmTile(movie,watched.has(String(movie.id)),group.name,index)).join('')+'</div>'+
        '<p class="director-coverage-note">'+coverageNote+(sourceUrl?' <a href="'+escapeHTML(sourceUrl)+'" target="_blank" rel="noopener noreferrer">監督の出典情報</a>':'')+'</p>';
      const close=document.createElement('button');
      close.type='button';
      close.className='director-filmography-close';
      close.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      close.setAttribute('aria-label',group.name+'の作品一覧を閉じる');
      close.addEventListener('click',()=>{detail.hidden=true;row.classList.remove('active');row.setAttribute('aria-expanded','false');row.focus({preventScroll:true});row.scrollIntoView({block:'center',behavior:'smooth'});});
      detail.prepend(close);
      // Reuse the exact eye-shaped control from other movie lists.
      detail.querySelectorAll('.director-film-rate-slot').forEach(slot=>{
        const movie=films[Number(slot.dataset.filmIndex)];
        if(!movie)return;
        const existing=group.records.find(item=>String(filmIdentity(item))===String(filmIdentity(movie)));
        const target=existing?{...movie,...existing}:movie;
        globalThis.CinelvaQuickRate?.mountInline?.(slot,target);
      });
      detail.hidden=false;
      row.insertAdjacentElement('afterend',detail);
    };
    ensureDirectorMedalStyles();
    sorted.forEach(group=>{
      const row=document.createElement('button');row.type='button';row.className='director-pick';row.setAttribute('aria-expanded','false');
      const d=group.filmography.director,photo=d?.profile_path||d?.profilePath||d?.photo||d?.image||'';
      const portrait=photo.startsWith('/')?'https://image.tmdb.org/t/p/w185'+photo:photo;
      const photoMarkup=/^https:\/\//.test(portrait)?'<img class="director-pick-photo" src="'+escapeHTML(portrait)+'" alt="" loading="lazy">':'<span class="director-pick-monogram" aria-hidden="true">🎬</span>';
      const seen=group.filmography.watchedCount,total=group.filmography.films.length,complete=group.filmography.catalogAvailable;
      const tier=directorMedalTier(seen,total,complete);
      const medalKey=String(d?.id||group.name);
      const previous=directorMedalHistory.get(medalKey);
      const earned=directorMedalUpdatePending&&previous!==undefined&&tier&&tier.rank>previous;
      directorMedalHistory.set(medalKey,tier?.rank||0);
      const laurel='<path d="M12 23C7 20 5 16 6 11M12 23c5-3 7-7 6-12M6.2 17.7 3.7 15.5 3.5 12.7M7.1 14.4 4.8 11.9 5.3 9.5M8.5 11.1 7 8.3 8.3 6.2M17.8 17.7l2.5-2.2.2-2.8M16.9 14.4l2.3-2.5-.5-2.4M15.5 11.1 17 8.3l-1.3-2.1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5 18l-3-1 1-3 3 2M6 13l-3-2 2-3 2 3M8 9L7 5l3-2v4M19 18l3-1-1-3-3 2M18 13l3-2-2-3-2 3M16 9l1-4-3-2v4" fill="currentColor" opacity=".9"/>';
      const crown='<path d="M5 16 3.5 8.5 8.5 12l3.5-6 3.5 6 5-3.5L19 16Z" fill="currentColor"/><path d="M5 18h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="3.5" cy="8.5" r="1" fill="currentColor"/><circle cx="12" cy="6" r="1" fill="currentColor"/><circle cx="20.5" cy="8.5" r="1" fill="currentColor"/>';
      const medalMarkup=tier?'<span class="director-medal-wrap'+(earned?' director-medal-earned':'')+'" role="img" aria-label="監督コレクション '+tier.label+'達成"><span class="director-medal" data-tier="'+tier.rank+'" aria-hidden="true"></span><span class="director-medal-label" data-tier="'+tier.rank+'" aria-hidden="true">'+tier.label+'</span></span>':'';
      row.innerHTML='<span class="director-card-photo">'+photoMarkup+medalMarkup+'</span><span class="director-pick-name">'+escapeHTML(group.name)+'</span><span class="director-card-stats"><span><b>'+seen+'</b><small>レビュー済み</small></span><span><b>'+(complete?total:'—')+'</b><small>監督作品総数</small></span></span>';
      row.setAttribute('aria-label',group.name+'、レビュー済み'+seen+'本、監督作品総数'+(complete?total+'本':'未確認'));
      row.addEventListener('click',()=>{if(row.classList.contains('active')){row.classList.remove('active');row.setAttribute('aria-expanded','false');detail.hidden=true;}else show(group,row);});
      list.append(row);
    });
    directorMedalUpdatePending=false;
    const cards=[...list.children].map((row,index)=>({row,group:sorted[index]}));
    const compareCards=(a,b)=>{
      const aCount=a.group.filmography.watchedCount,bCount=b.group.filmography.watchedCount;
      const aTotal=a.group.filmography.catalogAvailable?a.group.filmography.films.length:null;
      const bTotal=b.group.filmography.catalogAvailable?b.group.filmography.films.length:null;
      const name=()=>a.group.name.localeCompare(b.group.name,'ja');
      switch(sortSelect.value){
        case 'completion': return (bTotal?bCount/bTotal:-1)-(aTotal?aCount/aTotal:-1)||bCount-aCount||name();
        case 'total': return (bTotal??-1)-(aTotal??-1)||bCount-aCount||name();
        case 'name': return name();
        default: return bCount-aCount||name();
      }
    };
    const applySort=()=>{
      // Close the expanded profile before moving its parent card.
      detail.hidden=true;
      list.querySelectorAll('.director-pick.active').forEach(row=>{row.classList.remove('active');row.setAttribute('aria-expanded','false');});
      cards.sort(compareCards).forEach(({row})=>list.append(row));
      try{sessionStorage.setItem('cinelva-director-sort',sortSelect.value);}catch(_){}
    };
    sortSelect.addEventListener('change',applySort);
    applySort();
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
  function drawYearCalendar() { populateYears(); renderStats(); renderList(); renderCalendar(); if(!$('genresView').hidden)renderGenres(); renderAwards(); if(!$('worldView').hidden)drawWorld(); }
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
    if($('addRecord')) $('addRecord').onclick=null; $('closeDialog').onclick=()=>$('recordDialog').close(); $('saveRecord').onclick=saveRecord;
    $('deleteRecord').onclick=()=>state.selected&&deleteRecord(state.selected.id);
    $('rating').oninput=()=>{$('ratingOut').value=Number($('rating').value).toFixed(1);};
    $('movieQuery').oninput=event=>searchMovies(event.target.value);
    $('movieResults').onclick=event=>{const button=event.target.closest('[data-choose-movie]');if(button)chooseMovie(button.dataset.chooseMovie);};
    $('csPeriod').onchange=()=>{renderCinemaSummary();renderYearHeatmap();};
    $('recordSearch').oninput=renderList; $('recordSort').onchange=renderList; $('recordYear').onchange=renderList; $('worldYear').onchange=drawWorld; $('worldGenre').onchange=drawWorld; $('worldCountry').onchange=drawWorld;
    $('exportRecords').onclick=exportRecords; $('importRecords').onclick=()=>$('importFile').click(); $('importFile').onchange=event=>{const file=event.target.files?.[0];event.target.value='';importRecords(file);};
    $('monthPrev').onclick=()=>{state.month--;if(state.month<0){state.month=11;state.year--;}renderCalendar();}; $('monthNext').onclick=()=>{state.month++;if(state.month>11){state.month=0;state.year++;}renderCalendar();};
    $('directorWorks').onclick=event=>{const button=event.target.closest('[data-director-film]');if(button)openKnownMovie(button.dataset.directorFilm);};
    $('calendarMode').onchange=renderCalendar;
    $('calendar').onclick=event=>{const button=event.target.closest('[data-date]');if(button)renderDateFilms(button.dataset.date);};
    $('yearHeatmap').onclick=event=>{const year=event.target.closest('[data-calendar-year]');if(year){state.year=Number(year.dataset.calendarYear);syncCalendarYear();return;}const day=event.target.closest('[data-date]');if(day){const date=day.dataset.date;renderDateFilms(date);$('calendarFilms').scrollIntoView({behavior:'smooth',block:'center'});return;}const month=event.target.closest('[data-calendar-month]');if(month){const prefix=state.year+'-'+String(Number(month.dataset.calendarMonth)+1).padStart(2,'0')+'-';const rows=recordMovies().filter(item=>dateOf(item).startsWith(prefix)).map(enriched);$('calendarFilms').innerHTML=rows.length?'<strong>'+state.year+'年'+(Number(month.dataset.calendarMonth)+1)+'月 · '+rows.length+'本</strong><div class="record-grid">'+rows.map(card).join('')+'</div>':'<span class="hint">この月の鑑賞記録はありません。</span>';mountRecordReviewAreas($('calendarFilms'));$('calendarFilms').scrollIntoView({behavior:'smooth',block:'center'});}};
    $('genreMatrix').onclick=event=>{const button=event.target.closest('[data-genre],[data-genre-pair]');if(!button)return;if(button.dataset.genrePair){const [first,second]=button.dataset.genrePair.split('|');const rows=classifiedRecords().filter(record=>recordGenres(record).includes(first)&&recordGenres(record).includes(second));$('genreFilms').innerHTML=rows.length?rows.map(card).join(''):`<div class="empty" style="grid-column:1/-1">${escapeHTML(first)}と${escapeHTML(second)}の両方に分類された記録はありません。</div>`;return;}renderGenreFilms(button.dataset.genre);};
    $('awardMatrix').onclick=event=>{const button=event.target.closest('[data-award-cell]');if(!button)return;const [organization,decade]=button.dataset.awardCell.split('|');state.awardSelection={organization,decade:Number(decade)};renderAwards();};
    $('genreFormat').onchange=renderGenres; $('genreWorkForm').onchange=renderGenres; $('awardMode').onchange=renderAwards; $('awardCategory').onchange=renderAwards; $('awardOther').onchange=renderAwards;
    $('awardFilms').onclick=event=>{if(event.target.closest('[data-close-award]')){state.awardSelection=null;renderAwards();return;}const button=event.target.closest('[data-award-film]');if(button)openKnownMovie(button.dataset.awardFilm);};
    $('worldZoomIn').onclick=()=>{state.plotZoom=Math.min(2.5,state.plotZoom*1.2);drawWorld();};$('worldZoomOut').onclick=()=>{state.plotZoom=Math.max(.65,state.plotZoom/1.2);drawWorld();};$('worldReset').onclick=()=>{state.plotRotation={x:-.32,y:-.58};state.plotZoom=1;state.plotOffset={x:0,y:0};drawWorld();};$('worldToggle').onclick=()=>{state.flatWorld=!state.flatWorld;drawWorld();};


    document.addEventListener('click',event=>{
      const button=event.target.closest('[data-record-bookmark]');
      if(!button)return;
      const id=String(button.dataset.recordBookmark),record=state.records.find(item=>String(item.id)===id);
      if(!record)return;
      try{
        const key='cinelva-want-to-watch-v1';
        const data=JSON.parse(localStorage.getItem(key)||'{}');
        if(data[id])delete data[id];
        else data[id]={id,title:record.title||'',savedAt:new Date().toISOString()};
        localStorage.setItem(key,JSON.stringify(data));
        const marked=Boolean(data[id]);
        button.classList.toggle('is-bookmarked',marked);
        button.setAttribute('aria-pressed',String(marked));
        window.dispatchEvent(new CustomEvent('cinelva-bookmarks-updated',{detail:{marked,id}}));
      }catch(error){console.warn('Bookmark save failed',error);}
    });
    document.addEventListener('click',event=>{
      const trigger=event.target.closest('[data-review-detail]');
      if(trigger){event.preventDefault();showReviewDetail(trigger.dataset.reviewDetail);return;}
      const edit=event.target.closest('[data-review-edit]');
      if(edit){
        const record=state.records.find(item=>String(item.id)===edit.dataset.reviewEdit);
        $('reviewDetailDialog').close();
        if(record)openDialog(record);
      }
    });
    $('reviewDetailClose').onclick=()=>$('reviewDetailDialog').close();
    document.addEventListener('click',event=>{const edit=event.target.closest('[data-edit]'),del=event.target.closest('[data-delete]');if(edit){const record=state.records.find(item=>String(item.id)===edit.dataset.edit);if(record)openDialog(record);}if(del)deleteRecord(del.dataset.delete);});
    const canvas=$('worldCanvas');
    canvas.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Enter'].includes(event.key))return;event.preventDefault();if(event.key==='Enter'){const rows=worldRecords();if(rows.length)showWorldFilm(rows[state.keyboardPoint++%rows.length]);return;}if(['+','='].includes(event.key))state.plotZoom=Math.min(2.5,state.plotZoom*1.1);else if(event.key==='-')state.plotZoom=Math.max(.65,state.plotZoom/1.1);else if(event.key==='ArrowLeft')state.plotRotation.y-=.15;else if(event.key==='ArrowRight')state.plotRotation.y+=.15;else if(event.key==='ArrowUp')state.plotRotation.x-=.15;else state.plotRotation.x+=.15;drawWorld();});
    const pointerDistance=points=>Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
    const pointerCenter=points=>({x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2});
    canvas.addEventListener('pointerdown',event=>{state.plotWasDragged=false;canvas.setPointerCapture(event.pointerId);state.plotPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...state.plotPointers.values()];state.plotDrag=points.length>1?{mode:'pinch',distance:pointerDistance(points),center:pointerCenter(points)}:{mode:'rotate',x:event.clientX,y:event.clientY,rotation:{...state.plotRotation}};});
    canvas.addEventListener('pointermove',event=>{if(!state.plotPointers.has(event.pointerId))return;const prior=state.plotPointers.get(event.pointerId);if(Math.hypot(event.clientX-prior.x,event.clientY-prior.y)>3)state.plotWasDragged=true;state.plotPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...state.plotPointers.values()];if(points.length>1&&state.plotDrag?.mode==='pinch'){const distance=pointerDistance(points),center=pointerCenter(points);state.plotZoom=Math.max(.65,Math.min(2.5,state.plotZoom*(distance/Math.max(1,state.plotDrag.distance))));state.plotOffset.x+=center.x-state.plotDrag.center.x;state.plotOffset.y+=center.y-state.plotDrag.center.y;state.plotDrag={mode:'pinch',distance,center};}else if(points.length===1&&state.plotDrag?.mode==='rotate'){state.plotRotation.y+= (event.clientX-state.plotDrag.x)*.008;state.plotRotation.x=Math.max(-1.35,Math.min(1.35,state.plotRotation.x+(event.clientY-state.plotDrag.y)*.008));state.plotDrag={...state.plotDrag,x:event.clientX,y:event.clientY};}drawWorld();});
    const endDrag=event=>{state.plotPointers.delete(event.pointerId);const point=[...state.plotPointers.values()][0];state.plotDrag=point?{mode:'rotate',x:point.x,y:point.y,rotation:{...state.plotRotation}}:null;};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
    canvas.addEventListener('wheel',event=>{event.preventDefault();state.plotZoom=Math.max(.65,Math.min(2.5,state.plotZoom*(event.deltaY>0?.9:1.1)));drawWorld();},{passive:false});
    canvas.addEventListener('click',event=>{if(state.plotDrag||state.plotWasDragged)return;const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;const point=(canvas._points||[]).slice().reverse().find(item=>Math.hypot(item.x-x,item.y-y)<item.r);if(point){const record=point.record;$('worldFilm').innerHTML=`<strong>${escapeHTML(record.title)}</strong> · ${escapeHTML(record.year||'公開年不明')} · ${escapeHTML(record.director||'監督不明')} · あなたの評価 ★ ${Number(record.rating ?? 0).toFixed(1)}<br>${escapeHTML((recordGenres(record).join('・')||'ジャンル未分類'))} · ${escapeHTML((record.countries||[]).join('・')||'製作国不明')}<div>${card(record)}</div>`;}});
    // Updating a review must not destroy the director/award/review overlay that opened it.
    // Defer the affected DOM refresh until those overlays have been dismissed.
    let pendingReviewRefresh=false;
    const hasParentOverlay=()=>Boolean(
      document.querySelector('#directorFilmography:not([hidden])')||
      document.querySelector('#reviewDetailDialog[open]')||
      document.querySelector('#recordDialog[open]')||
      document.querySelector('.award-detail-head')
    );
    const refreshAfterReview=()=>{
      if(hasParentOverlay()){pendingReviewRefresh=true;return;}
      pendingReviewRefresh=false;
      populateYears();drawYearCalendar();renderAwards();renderDirectors();renderList();
    };
    window.addEventListener('cinelva-record-updated',()=>{
      directorMedalUpdatePending=true;
      state.records=Records.all();
      refreshAfterReview();
    });
    // Closing a parent overlay resumes the deferred refresh without closing it on save.
    document.addEventListener('click',event=>{
      if(!pendingReviewRefresh)return;
      if(event.target.closest('.director-filmography-close,[data-close-award],[data-close-review-detail],.review-detail-close')) {
        setTimeout(()=>{if(pendingReviewRefresh)refreshAfterReview();},0);
      }
    });
    document.addEventListener('close',()=>{
      if(pendingReviewRefresh)setTimeout(()=>refreshAfterReview(),0);
    },true);
    window.addEventListener('resize',()=>{if(!$('worldView').hidden)drawWorld();});
    window.addEventListener('storage',event=>{if(event.key===Records.KEY||event.key===null){try{state.records=Records.all();populateYears();drawYearCalendar();}catch(error){notify(`他のタブの記録を読み込めません：${error.message}`);}}});
  }
  function openKnownMovie(id){const existing=Insights.directorViewingRecord(state.records,{id}),movie=byId.get(String(id)),title=movie?.title||existing?.title;if(!title){notify('この作品の情報が未収録です。作品検索から追加してください。');return;}location.href='../search.html?'+new URLSearchParams({search:title});}
  async function init() {
    try { state.records=Records.all(); } catch(error) { notify(`保存データを読み込めません：${error.message}`); return; }
    const load=async(url,fallback)=>{
      const essential=/\/data\/directors(?:-mobile)?\.json(?:[?#]|$)/.test(url);
      for(let attempt=0;attempt<(essential?3:1);attempt++){
        try{
          const response=await fetch(url,{cache:essential?'no-store':'default'});
          if(!response.ok)throw new Error('HTTP '+response.status);
          const result=await response.json();
          if(essential&&(!result.directors||!Object.keys(result.directors).length))throw new Error('Empty director catalog');
          return result;
        }catch(error){
          if(attempt===(essential?2:0)){
            if(essential)notify('監督作品データを取得できませんでした。通信状況を確認して再読み込みしてください。');
            return fallback;
          }
        }
      }
      return fallback;
    };
    const [movieData,awardData,directorData]=await Promise.all([load('../data/movies.json',{movies:[]}),load('../data/awards.json',{awards:[]}),load('../data/directors-mobile.json?v=20261019-mobile-catalog',{directors:{}})]);
    // If the compact catalog has not been deployed yet, fall back to the full sourced snapshot.
    if(!Object.keys(directorData.directors||{}).length){
      const original=await load('../data/directors.json?v=20261019-full-catalog',{directors:{}});
      Object.assign(directorData,original);
    }
    state.movies=movieData.movies||[];state.awards=awardData.awards||[];state.awardCoverage=awardData.coverage||{};state.directors=directorData.directors||{};for(const director of Object.values(state.directors))for(const work of director.works||[]){if(!isDirectorCredit(work,director.name))continue;byId.set(String(work.id),{...work,director:work.director||director.name});}for(const movie of [...(awardData.catalog||[]),...state.movies]){const old=byId.get(String(movie.id))||{};byId.set(String(movie.id),{...old,...movie,year:movie.year||old.year||Number(String(movie.date||'').slice(0,4))||null});}state.movies=[...byId.values()];
    populateYears();bindEvents();drawYearCalendar();
    // Restore the selected tab after a refresh, without affecting record deep links.
    try {
      const savedTab = sessionStorage.getItem(TAB_STORAGE_KEY);
      setTab(savedTab==='genres'||savedTab==='world'?'summary':(savedTab||'summary'));
    } catch (_) { /* Private browsing can disable storage. */ }
    const params=new URLSearchParams(location.search),requestedId=params.get('record'),requestedTitle=params.get('title');
    if(!requestedId&&!requestedTitle&&params.get('tab')==='watchlist')setTab('watchlist');
    if(requestedId||requestedTitle){const query=requestedTitle||requestedId;location.replace('../search.html?'+new URLSearchParams({search:query}));}
  }
  init();
})();
