/* Three-distance film universe. The artwork is fixed; placement and taste are data driven. */
(function (root) {
  'use strict';
  const model = root.CinemapUniverseModel;
  const genres = ['SF','ドラマ','サスペンス','コメディ','アニメ','アクション','ロマンス','ホラー','ミステリー','ファンタジー','クライム','情報未取得'];
  const state = {genre:null,director:null,film:null};
  let catalog=[], records={};
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const infoLink = film => 'search.html?id='+encodeURIComponent(film.id)+'&search='+encodeURIComponent(film.title||'');
  const watched = film => !!records[String(film.id)]?.watched;
  const known = () => catalog.filter(watched);
  const inGenre = (film,genre) => genre==='情報未取得' ? !film.genres?.length : !!film.genres?.includes(genre);
  function filmCard(film, unknown=false) {
    const record=records[String(film.id)];
    return '<button class="universePlanet'+(unknown?' universePlanet--unknown':'')+(record?.rating===5?' universePlanet--best':'')+'" type="button" data-universe-film="'+esc(film.id)+'" aria-label="'+esc(film.title)+(unknown?'・未登録の候補':'・記録した作品')+'">'+(film.poster?'<span class="planetArtwork"><img src="'+esc(film.poster)+'" alt="" loading="lazy"></span>':'<span class="planetArtwork planetFallback"></span>')+'<span class="planetName">'+esc(film.title||'作品')+'</span><span class="planetMeta">'+(unknown?'未登録の候補':record?.rating!=null?record.rating+' ★':'観た · 未評価')+'</span></button>';
  }
  function farView() {
    const films=known(), rated=films.filter(f=>records[String(f.id)]?.rating!=null).length;
    const stage=rated>=20?'本格Universe':rated>=10?'仮Universe':'形成中';
    const nodes=genres.map((genre,index)=>{
      const matching=films.filter(f=>inGenre(f,genre));
      const p=model.position('genre:'+genre);
      return '<button type="button" class="universeGalaxy'+(matching.length?'':' universeGalaxy--unexplored')+'" data-universe-genre="'+esc(genre)+'" style="--px:'+p.x+'%;--py:'+p.y+'%;--gi:'+index+'" aria-label="'+esc(genre)+'銀河、'+matching.length+'作品を記録"><span class="galaxyCloud"></span><strong>'+esc(genre)+'</strong><small>'+(matching.length?matching.length+'作品を記録':'未登録の領域')+'</small></button>';
    }).join('');
    const suggestions=model.recommend(records,catalog,3);
    return '<div class="universeIntro"><span class="universeEyebrow">YOUR FILM UNIVERSE · '+stage+'</span><h2>あなたの映画宇宙</h2><p>銀河を選ぶと監督星系へ。評価するたびに、次の発見が変わります。</p><div class="universeProgress">'+rated+'本評価済み'+(rated<10?' · あと'+(10-rated)+'本で仮Universe':rated<20?' · あと'+(20-rated)+'本で本格Universe':'')+'</div></div><div class="universeGalaxies">'+nodes+'</div>'+(suggestions.length?'<div class="universeTeaser"><span>未発見惑星の候補</span><strong>'+esc(suggestions[0].film.title)+'</strong><small>未登録のため鑑賞状況は不明です</small></div>':'');
  }
  function middleView() {
    const genre=state.genre;
    const films=known().filter(f=>inGenre(f,genre));
    const directors=new Map();
    films.forEach(f=>{const name=f.director||'監督データ未取得';const group=directors.get(name)||[];group.push(f);directors.set(name,group);});
    const cells=[...directors].sort((a,b)=>b[1].length-a[1].length || a[0].localeCompare(b[0])).map(([name,works])=>'<button type="button" class="universeSystem" data-universe-director="'+esc(name)+'"><span class="systemSun"></span><strong>'+esc(name)+'</strong><small>'+works.length+'作品 · 恒星を開く</small></button>').join('');
    const candidates=model.recommend(records,catalog,4).filter(x=>inGenre(x.film,genre));
    return '<div class="universeInnerHeader"><button type="button" data-universe-back="far">← 銀河へ</button><span>'+esc(genre)+' 銀河</span></div><div class="universeSectionHead"><h2>監督星系</h2><p>このジャンルで記録した作品から見える星系です。</p></div><div class="universeSystems">'+(cells||'<p class="universeEmpty">まだ記録された作品がありません。未登録は未鑑賞を意味しません。</p>')+'</div>'+(candidates.length?'<div class="universeSuggestions"><h3>この銀河の未発見候補</h3><div class="universePlanets">'+candidates.map(x=>filmCard(x.film,true)).join('')+'</div></div>':'');
  }
  function closeView() {
    const films=known().filter(f=>inGenre(f,state.genre) && (f.director||'監督データ未取得')===state.director);
    const suggestions=model.recommend(records,catalog,8).filter(x=>inGenre(x.film,state.genre) && (x.film.director||'監督データ未取得')===state.director);
    const selected=state.film && catalog.find(f=>String(f.id)===state.film);
    const record=selected&&records[String(selected.id)];
    const related=selected ? catalog.filter(f=>String(f.id)!==String(selected.id) && (f.director===selected.director || f.genres?.some(g=>selected.genres?.includes(g)))).slice(0,3):[];
    return '<div class="universeInnerHeader"><button type="button" data-universe-back="middle">← '+esc(state.genre)+'銀河へ</button><span>'+esc(state.director)+'</span></div><div class="universeSectionHead"><h2>'+esc(state.director)+' 星系</h2><p>作品の惑星を選ぶと、記録と近くの作品が見えます。</p></div><div class="universePlanets">'+films.map(f=>filmCard(f)).join('')+suggestions.slice(0,4).map(x=>filmCard(x.film,true)).join('')+'</div>'+(selected?'<div class="universeFilmDetail"><h3>'+esc(selected.title)+'</h3><p>'+(record?.watched?'自分の評価: '+(record.rating==null?'未評価':record.rating)+' · 記録日: '+esc((record.recordedAt||record.updatedAt||'').slice(0,10)):'未登録の候補 · 鑑賞状況は不明')+'</p><p>監督: '+esc(selected.director||'情報なし')+'</p><div class="universeDetailActions"><a href="'+infoLink(selected)+'">作品情報を見る</a>'+(record?.watched?'<button type="button" data-rate-movie="'+esc(selected.id)+'">評価を変更</button>':'<button type="button" data-watch="'+esc(selected.id)+'">観たと記録</button>')+'</div>'+(related.length?'<div class="universeRelated"><small>関連作品</small>'+related.map(f=>'<button type="button" data-universe-film="'+esc(f.id)+'">'+esc(f.title)+'</button>').join('')+'</div>':'')+'</div>':'');
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
    const film=event.target.closest('[data-universe-film]');if(film){state.film=film.dataset.universeFilm;const match=catalog.find(f=>String(f.id)===state.film);if(match && !inGenre(match,state.genre)){state.genre=genres.find(g=>inGenre(match,g))||'情報未取得';}state.director=match?.director||'監督データ未取得';render();return;}
    const back=event.target.closest('[data-universe-back]');if(back){if(back.dataset.universeBack==='far')state.genre=null;else{state.director=null;state.film=null;}render();}
  });
  root.CinemapUniverseView={render};
})(window);
