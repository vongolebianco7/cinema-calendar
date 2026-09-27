/* Three-distance film universe. The artwork is fixed; placement and taste are data driven. */
(function (root) {
  'use strict';
  const model = root.CinemapUniverseModel;
  const baseGenres = ['SF','ドラマ','スリラー','コメディ','アニメ','アクション','ロマンス','ホラー','ミステリー','ファンタジー','クライム','アドベンチャー'];
  // Slots belong to genres, not to the user's records. Adding a film never moves an existing galaxy.
  const galaxySlot = genre => {
    const index=baseGenres.indexOf(genre);
    if(index>=0)return index;
    const named=['歴史','戦争','音楽','ドキュメンタリー','西部劇','ファミリー','情報未取得'];
    const extra=named.indexOf(genre);
    return extra>=0?baseGenres.length+extra:baseGenres.length+named.length+((model.position('genre:'+genre).x*37+model.position('genre:'+genre).y)%16);
  };
  const state = {genre:null,director:null,film:null};
  let catalog=[], records={};
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const infoLink = film => 'search.html?id='+encodeURIComponent(film.id)+'&search='+encodeURIComponent(film.title||'');
  const watched = film => !!records[String(film.id)]?.watched;
  const recordDate = value => {
    const date=new Date(value||'');
    return Number.isNaN(date.getTime())?'不明':date.toLocaleDateString('ja-JP');
  };
  const known = () => catalog.filter(watched);
  const inGenre = (film,genre) => model.primaryGenre(film)===genre;
  const visibleGenres = () => {
    const recorded=known();
    const extra=[...new Set(recorded.map(model.primaryGenre))].filter(g=>g!=='情報未取得'&&!baseGenres.includes(g)).sort();
    return [...baseGenres,...extra,...(recorded.some(f=>model.primaryGenre(f)==='情報未取得')?['情報未取得']:[])];
  };
  function filmCard(film, unknown=false) {
    const record=records[String(film.id)];
    return '<button class="universePlanet'+(unknown?' universePlanet--unknown':'')+(record?.rating===5?' universePlanet--best':'')+'" type="button" data-universe-film="'+esc(film.id)+'" aria-label="'+esc(film.title)+(unknown?'・未登録の候補':'・記録した作品')+'">'+(film.poster?'<span class="planetArtwork"><img src="'+esc(film.poster)+'" alt="" loading="lazy"></span>':'<span class="planetArtwork planetFallback"></span>')+'<span class="planetName">'+esc(film.title||'作品')+'</span><span class="planetMeta">'+(unknown?'未登録の候補':record?.rating!=null?Number(record.rating).toFixed(1)+' ★':'観た · 未評価')+'</span></button>';
  }
  function farView() {
    const films=known(), rated=films.filter(f=>records[String(f.id)]?.rating!=null).length;
    const stage=rated>=20?'本格Universe':rated>=10?'仮Universe':'形成中';
    const groups=visibleGenres().map(genre=>({genre,index:galaxySlot(genre),matching:films.filter(f=>inGenre(f,genre))}));
    const node=({genre,index,matching})=>{
      const p=model.position('genre:'+genre);
      const offsetX=(p.x%11)-5,offsetY=(p.y%37)-18;
      return '<button type="button" class="universeGalaxy'+(matching.length?' universeGalaxy--known':' universeGalaxy--unexplored')+'" data-universe-genre="'+esc(genre)+'" style="--gi:'+index+';--growth:'+Math.min(matching.length,8)+';--galaxy-x:'+(12.5+(index%4)*25+offsetX)+'%;--galaxy-y:'+(122+Math.floor(index/4)*215+offsetY)+'px;--mobile-x:'+(25+(index%2)*50+offsetX*.55)+'%;--mobile-y:'+(95+Math.floor(index/2)*157+offsetY*.6)+'px" aria-label="'+esc(genre)+'銀河、'+matching.length+'作品を記録。銀河へ入る"><span class="galaxyCloud"></span><strong>'+esc(genre)+'</strong><span class="galaxyCount">'+(matching.length?matching.length+'作品 · 銀河へ':'記録なし')+'</span></button>';
    };
    const explored=groups.filter(g=>g.matching.length);
    const visible=groups.filter(g=>g.index<12||g.matching.length);
    const lastSlot=Math.max(11,...visible.map(g=>g.index));
    const map='<div class="universeMap" role="group" aria-label="あなたの映画宇宙。銀河を選んで監督と作品を見る" style="--map-height:'+(Math.floor(lastSlot/4)+1)*215+'px;--map-mobile-height:'+(Math.floor(lastSlot/2)+1)*157+'px"><div class="universeMapHaze" aria-hidden="true"></div>'+visible.map(node).join('')+'<span class="universeMapCaption">'+explored.length+'銀河が育っています · '+films.length+'作品を記録</span></div>';
    const suggestions=model.recommend(records,catalog,3);
    return '<div class="universeIntro"><span class="universeEyebrow">YOUR FILM UNIVERSE · '+stage+'</span><h2>あなたの映画宇宙</h2><p>ひとつの宇宙に、映画のジャンルが銀河として広がります。銀河に触れると監督と作品へ近づきます。</p><div class="universeProgress">'+rated+'本評価済み'+(rated<10?' · あと'+(10-rated)+'本で仮Universe':rated<20?' · あと'+(20-rated)+'本で本格Universe':'')+'</div></div>'+map+'<div class="universeGuide"><strong>宇宙の歩き方</strong><span>銀河を選ぶ → 監督の星系 → 作品の惑星</span><small>明るい銀河には記録があり、暗い銀河にはまだ記録がありません。未登録は未鑑賞を意味しません。作品は代表ジャンルに一度だけ現れます。</small></div>'+(suggestions.length?'<button type="button" class="universeTeaser" data-universe-film="'+esc(suggestions[0].film.id)+'"><span>次の発見 · 未登録の作品候補</span><strong>'+esc(suggestions[0].film.title)+'</strong><small>鑑賞状況は不明です · 詳細を見る →</small></button>':'');
  }
  function middleView() {
    const genre=state.genre;
    const films=known().filter(f=>inGenre(f,genre));
    const directors=new Map();
    films.forEach(f=>{const name=f.director||'監督データ未取得';const group=directors.get(name)||[];group.push(f);directors.set(name,group);});
    const cells=[...directors].sort((a,b)=>b[1].length-a[1].length || a[0].localeCompare(b[0])).map(([name,works])=>'<button type="button" class="universeSystem'+(name==='監督データ未取得'?' universeSystem--unknown':'')+'" data-universe-director="'+esc(name)+'" style="--system-scale:'+(1+Math.min(works.length-1,4)*0.15)+'"><span class="systemSun"></span><strong>'+esc(name==='監督データ未取得'?'監督情報のない作品':name)+'</strong><small>'+works.length+'作品 · '+esc(works[0].title)+(works.length>1?' ほか':'')+' →</small></button>').join('');
    const candidates=model.recommend(records,catalog,4).filter(x=>inGenre(x.film,genre));
    return '<div class="universeInnerHeader"><button type="button" data-universe-back="far">← ジャンル一覧へ</button><span>'+esc(genre)+' 銀河</span></div><div class="universeSectionHead"><h2>'+esc(genre)+'の監督と作品</h2><p>ここには記録した'+films.length+'本が入っています。監督を選ぶと作品が見えます。</p></div><div class="universeSystems">'+(cells||'<p class="universeEmpty">まだ記録された作品がありません。未登録は未鑑賞を意味しません。</p>')+'</div>'+(candidates.length?'<div class="universeSuggestions"><h3>このジャンルの未登録候補</h3><p class="universeEmpty">鑑賞状況は不明です。</p><div class="universePlanets">'+candidates.map(x=>filmCard(x.film,true)).join('')+'</div></div>':'');
  }
  function closeView() {
    const films=known().filter(f=>inGenre(f,state.genre) && (f.director||'監督データ未取得')===state.director);
    const suggestions=model.recommend(records,catalog,8).filter(x=>inGenre(x.film,state.genre) && (x.film.director||'監督データ未取得')===state.director);
    const selected=state.film && catalog.find(f=>String(f.id)===state.film);
    const record=selected&&records[String(selected.id)];
    const related=selected ? catalog.filter(f=>String(f.id)!==String(selected.id) && (f.director===selected.director || f.genres?.some(g=>selected.genres?.includes(g)))).sort((a,b)=>Number(b.director===selected.director)-Number(a.director===selected.director) || (b.genres||[]).filter(g=>selected.genres?.includes(g)).length-(a.genres||[]).filter(g=>selected.genres?.includes(g)).length).slice(0,3):[];
    return '<div class="universeInnerHeader"><button type="button" data-universe-back="middle">← '+esc(state.genre)+'銀河へ</button><span>'+esc(state.director)+'</span></div><div class="universeSectionHead"><h2>'+esc(state.director)+' 星系</h2><p>作品の惑星を選ぶと、記録と近くの作品が見えます。</p></div><div class="universePlanets">'+films.map(f=>filmCard(f)).join('')+suggestions.slice(0,4).map(x=>filmCard(x.film,true)).join('')+'</div>'+(selected?'<div class="universeFilmDetail"><h3>'+esc(selected.title)+'</h3><p>'+(record?.watched?'自分の評価: '+(record.rating==null?'未評価':Number(record.rating).toFixed(1))+' · 記録日: '+esc(recordDate(record.recordedAt||record.updatedAt)):'未登録の候補 · 鑑賞状況は不明')+'</p><p>監督: '+esc(selected.director||'情報なし')+'</p><p>ジャンル: '+esc(selected.genres?.join(' · ')||'情報なし')+'</p><div class="universeDetailActions"><a href="'+infoLink(selected)+'">作品情報を見る</a>'+(root.CinemapRatingRuler?.(selected,record)||'')+'</div>'+(related.length?'<div class="universeRelated"><small>関連作品</small>'+related.map(f=>'<button type="button" data-universe-film="'+esc(f.id)+'">'+esc(f.title)+'</button>').join('')+'</div>':'')+'</div>':'');
  }
  function render(nextCatalog,nextRecords) {
    records=nextRecords||records;
    if(nextCatalog){const ids=new Set(nextCatalog.map(f=>String(f.id)));catalog=[...nextCatalog,...Object.values(records).filter(r=>r?.watched&&!ids.has(String(r.id)))];}
    const host=document.getElementById('universe');if(!host)return;
    const body=state.genre===null?farView():state.director===null?middleView():closeView();
    host.innerHTML='<div class="universeScene">'+body+'</div>';
  }
  document.addEventListener('click',event=>{
    const genre=event.target.closest('[data-universe-genre]');if(genre){state.genre=genre.dataset.universeGenre;state.director=null;state.film=null;render();return;}
    const director=event.target.closest('[data-universe-director]');if(director){state.director=director.dataset.universeDirector;state.film=null;render();return;}
    const film=event.target.closest('[data-universe-film]');if(film){state.film=film.dataset.universeFilm;const match=catalog.find(f=>String(f.id)===state.film);if(match && !inGenre(match,state.genre)){state.genre=model.primaryGenre(match);}state.director=match?.director||'監督データ未取得';render();return;}
    const back=event.target.closest('[data-universe-back]');if(back){if(back.dataset.universeBack==='far')state.genre=null;else{state.director=null;state.film=null;}render();}
  });
  root.CinemapUniverseView={render};
})(window);
