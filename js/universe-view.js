/* Three-distance film universe. The artwork is fixed; placement and taste are data driven. */
(function (root) {
  'use strict';
  const model = root.CinemapUniverseModel;
  const baseGenres = ['SF','ドラマ','スリラー','コメディ','アニメ','アクション','ロマンス','ホラー','ミステリー','ファンタジー','クライム','アドベンチャー'];
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
  const inGenre = (film,genre) => genre==='情報未取得' ? !film.genres?.length : !!film.genres?.includes(genre);
  const visibleGenres = () => {
    const recorded=known();
    const extra=[...new Set(recorded.flatMap(f=>f.genres||[]))].filter(g=>!baseGenres.includes(g)).sort();
    return [...baseGenres,...extra,...(recorded.some(f=>!f.genres?.length)?['情報未取得']:[])];
  };
  function filmCard(film, unknown=false) {
    const record=records[String(film.id)];
    return '<button class="universePlanet'+(unknown?' universePlanet--unknown':'')+(record?.rating===5?' universePlanet--best':'')+'" type="button" data-universe-film="'+esc(film.id)+'" aria-label="'+esc(film.title)+(unknown?'・未登録の候補':'・記録した作品')+'">'+(film.poster?'<span class="planetArtwork"><img src="'+esc(film.poster)+'" alt="" loading="lazy"></span>':'<span class="planetArtwork planetFallback"></span>')+'<span class="planetName">'+esc(film.title||'作品')+'</span><span class="planetMeta">'+(unknown?'未登録の候補':record?.rating!=null?record.rating+' ★':'観た · 未評価')+'</span></button>';
  }
  function farView() {
    const films=known(), rated=films.filter(f=>records[String(f.id)]?.rating!=null).length;
    const stage=rated>=20?'本格Universe':rated>=10?'仮Universe':'形成中';
    const groups=visibleGenres().map((genre,index)=>({genre,index,matching:films.filter(f=>inGenre(f,genre))}));
    const card=({genre,index,matching})=>{
      const p=model.position('genre:'+genre);
      const posters=matching.slice(0,3).map(f=>f.poster?'<img src="'+esc(f.poster)+'" alt="" loading="lazy">':'').join('');
      return '<button type="button" class="universeGalaxy'+(matching.length?'':' universeGalaxy--unexplored')+'" data-universe-genre="'+esc(genre)+'" style="--px:'+p.x+'%;--py:'+p.y+'%;--gi:'+index+'" aria-label="'+esc(genre)+'銀河、'+matching.length+'作品を記録。監督と作品を見る"><span class="galaxyCloud"></span><strong>'+esc(genre)+' <span class="galaxyType">銀河</span></strong><span class="galaxyCount">'+(matching.length?'観た作品 '+matching.length+'本':'記録はまだありません')+'</span>'+(matching.length?'<span class="galaxyPosters">'+posters+'</span><span class="galaxyExample">'+esc(matching[0].title)+(matching.length>1?' ほか':'')+'</span><span class="galaxyAction">監督と作品を見る →</span>':'')+'</button>';
    };
    const explored=groups.filter(g=>g.matching.length).sort((a,b)=>b.matching.length-a.matching.length||a.index-b.index);
    const unexplored=groups.filter(g=>!g.matching.length);
    const nodes=explored.map(card).join('');
    const hidden='<details class="universeUnexplored"><summary>まだ記録のないジャンルを見る · '+unexplored.length+'銀河</summary><div class="universeGalaxies universeGalaxies--empty">'+unexplored.map(card).join('')+'</div><p>未登録は「観ていない」という意味ではありません。</p></details>';
    const suggestions=model.recommend(records,catalog,3);
    return '<div class="universeIntro"><span class="universeEyebrow">YOUR FILM UNIVERSE · '+stage+'</span><h2>あなたの映画宇宙</h2><p>観た映画がジャンルごとに集まります。好きな銀河を開いて、監督と作品をたどれます。</p><div class="universeProgress">'+rated+'本評価済み'+(rated<10?' · あと'+(10-rated)+'本で仮Universe':rated<20?' · あと'+(20-rated)+'本で本格Universe':'')+'</div></div><div class="universeGuide"><strong>この宇宙の見方</strong><span>銀河＝ジャンル → 恒星＝監督 → 惑星＝作品</span><small>1作品が複数の銀河に入ることがあります。光る惑星は5.0、暗い惑星は未登録の候補です。</small></div><div class="universeSectionHead universeFarHeading"><h3>あなたが記録したジャンル</h3><p>ポスターのある銀河をタップして、作品を見てみましょう。</p></div>'+(nodes?'<div class="universeGalaxies universeGalaxies--recorded">'+nodes+'</div>':'<div class="universeStart"><p>まだ作品がありません。映画を評価すると、この場所にあなたの銀河が生まれます。</p><a href="my-records.html?view=add">映画を記録する →</a></div>')+hidden+(suggestions.length?'<button type="button" class="universeTeaser" data-universe-film="'+esc(suggestions[0].film.id)+'"><span>次の発見 · 未登録の作品候補</span><strong>'+esc(suggestions[0].film.title)+'</strong><small>鑑賞状況は不明です · 詳細を見る →</small></button>':'');
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
    return '<div class="universeInnerHeader"><button type="button" data-universe-back="middle">← '+esc(state.genre)+'銀河へ</button><span>'+esc(state.director)+'</span></div><div class="universeSectionHead"><h2>'+esc(state.director)+' 星系</h2><p>作品の惑星を選ぶと、記録と近くの作品が見えます。</p></div><div class="universePlanets">'+films.map(f=>filmCard(f)).join('')+suggestions.slice(0,4).map(x=>filmCard(x.film,true)).join('')+'</div>'+(selected?'<div class="universeFilmDetail"><h3>'+esc(selected.title)+'</h3><p>'+(record?.watched?'自分の評価: '+(record.rating==null?'未評価':record.rating)+' · 記録日: '+esc(recordDate(record.recordedAt||record.updatedAt)):'未登録の候補 · 鑑賞状況は不明')+'</p><p>監督: '+esc(selected.director||'情報なし')+'</p><div class="universeDetailActions"><a href="'+infoLink(selected)+'">作品情報を見る</a>'+(record?.watched?'<button type="button" data-rate-movie="'+esc(selected.id)+'">評価を変更</button>':'<button type="button" data-watch="'+esc(selected.id)+'">観たと記録</button>')+'</div>'+(related.length?'<div class="universeRelated"><small>関連作品</small>'+related.map(f=>'<button type="button" data-universe-film="'+esc(f.id)+'">'+esc(f.title)+'</button>').join('')+'</div>':'')+'</div>':'');
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
    const film=event.target.closest('[data-universe-film]');if(film){state.film=film.dataset.universeFilm;const match=catalog.find(f=>String(f.id)===state.film);if(match && !inGenre(match,state.genre)){state.genre=visibleGenres().find(g=>inGenre(match,g))||'情報未取得';}state.director=match?.director||'監督データ未取得';render();return;}
    const back=event.target.closest('[data-universe-back]');if(back){if(back.dataset.universeBack==='far')state.genre=null;else{state.director=null;state.film=null;}render();}
  });
  root.CinemapUniverseView={render};
})(window);
