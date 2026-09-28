/* One navigable film ocean. Render only the current detail level. */
(function (root) {
  'use strict';
  const model=root.CinemapOceanModel;
  const genres=Object.keys(model.genreCenters);
  const camera={zoom:1,focusX:50,focusY:50,panX:0,panY:0,yaw:0,pitch:0};
  try { const prior=JSON.parse(sessionStorage.getItem('cinemap-ocean-camera')||'null');
    if(prior&&Object.keys(camera).every(k=>Number.isFinite(prior[k]))) Object.assign(camera,prior);
  } catch { /* Storage is optional. */ }
  let catalog=[],records={},selected=null,flight=null,draggedAt=0,decade='',newbornId=null;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const known=()=>catalog.filter(f=>records[String(f.id)]?.watched);
  const visibleGenres=()=>genres;
  const inDecade=f=>!decade||Math.floor(Number(f.year)/10)*10===Number(decade);
  const tier=()=>camera.zoom<1.65?'far':camera.zoom<3.2?'middle':'near';
  const link=f=>'search.html?id='+encodeURIComponent(f.id)+'&search='+encodeURIComponent(f.title||'');
  const recordDate=v=>{const d=new Date(v||'');return Number.isNaN(d.getTime())?'不明':d.toLocaleDateString('ja-JP');};
  const hue=name=>model.position('color:'+name).x*3;
  const nodeStyle=(p,extra='')=>'left:'+p.x+'%;top:'+p.y+'%;--depth:'+p.z+'px;'+extra;
  const fishStyle=fish=>{
    const columns=fish.atlas===0?3:4,rows=fish.atlas===0?2:3;
    return '--fish-x:'+(fish.index%columns/(columns-1)*100)+'%;--fish-y:'+(Math.floor(fish.index/columns)/(rows-1)*100)+'%;--fish-size:'+(columns*100)+'% '+(rows*100)+'%;--fish-hue:'+fish.hue+'deg;';
  };
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const genreNodes=()=>{
    const films=known().filter(inDecade);
    return visibleGenres().map(g=>{
      const p=model.centerForGenre(g), n=films.filter(f=>model.genreStrengths(f)[g]).length;
      if(!n&&genres.indexOf(g)%4!==0)return '';
      const representative=films.find(f=>model.genreStrengths(f)[g]);
      const fish=model.speciesFor(representative||{genres:[g]});
      const school=Array.from({length:Math.min(n,4)},(_,i)=>'<span class="oceanSchool" aria-hidden="true" style="--swim-offset:'+(i-1.5)*25+'px;--swim-depth:'+i*12+'px"></span>').join('');
      return '<button type="button" class="cosmosBody cosmosGalaxy oceanAtlas'+fish.atlas+(n?' cosmosGalaxy--active':' cosmosGalaxy--dormant')+'" data-cosmos-genre="'+esc(g)+'" style="'+nodeStyle({x:p[0],y:p[1],z:p[2]},'--hue:'+hue(g)+';--mass:'+Math.min(n,10)+';'+fishStyle(fish))+'" aria-label="'+esc(g)+'、'+n+'作品の記録"><span class="cosmosHalo"></span>'+school+'<span class="oceanHiddenMeta" aria-hidden="true"></span></button>';
    }).join('');
  };
  // Before ten ratings there is too little evidence for a useful suggestion.
  // Keep the personal map dominant even after suggestions become available.
  const candidates=()=>known().length<10?[]:model.recommend(records,catalog,5);
  const directorGroups=()=>{
    const byName=new Map();
    [...known().filter(inDecade),...candidates().map(x=>x.film).filter(inDecade)].forEach(f=>{
      if(!f.director)return;
      if(!byName.has(f.director))byName.set(f.director,[]);
      byName.get(f.director).push(f);
    });
    return [...byName].map(([name,works])=>({name,works,point:model.directorPosition(name,catalog.filter(f=>f.director===name).length?catalog:works)}));
  };
  const midNodes=()=>{
    const focus={x:camera.focusX,y:camera.focusY};
    const systems=directorGroups().filter(x=>x.point&&distance(x.point,focus)<31).sort((a,b)=>distance(a.point,focus)-distance(b.point,focus)).slice(0,32);
    const directorMarkup=systems.map(s=>{const n=s.works.filter(f=>records[String(f.id)]?.watched).length;return '<button type="button" class="cosmosBody cosmosDirector" data-cosmos-director="'+esc(s.name)+'" style="'+nodeStyle(s.point,'--hue:'+hue(s.name)+';--mass:'+Math.min(n,10))+'" aria-label="映画の群れ"><span class="cosmosHalo"></span></button>';}).join('');
    const anonymous=known().filter(f=>inDecade(f)&&!f.director&&distance(model.filmPosition(f),focus)<27).slice(0,12).map(f=>planet(f,false)).join('');
    return directorMarkup+anonymous;
  };
  function planet(f,unknown){
    const p=model.filmPosition(f),record=records[String(f.id)],best=record?.rating===5;
    const score=Number(record?.rating);
    const tone=record?.watched&&Number.isFinite(score)?Math.round((clamp(score,2.5,5)-3.5)*22):0;
    const fish=model.speciesFor(f);
    const era=Number(f.year)<1980?' vintage':Number(f.year)>=2010?' recent':'';
    return '<button type="button" class="cosmosBody cosmosPlanet oceanAtlas'+fish.atlas+(unknown?' cosmosPlanet--unknown':'')+(best?' cosmosPlanet--best':'')+(newbornId===String(f.id)?' oceanNewborn':'')+era+'" data-cosmos-film="'+esc(f.id)+'" style="'+nodeStyle(p,'--score-tone:'+tone+'deg;'+fishStyle(fish))+'" aria-label="海の生き物"><span class="cosmosHalo"></span></button>';
  }
  const nearNodes=()=>{
    const focus={x:camera.focusX,y:camera.focusY};
    const recommended=candidates().map(x=>x.film);
    const films=[...known(),...recommended].filter(inDecade);
    if(selected?.kind==='film'&&!films.some(f=>String(f.id)===selected.id)){
      const f=catalog.find(x=>String(x.id)===selected.id);if(f)films.push(f);
    }
    return films.filter(f=>distance(model.filmPosition(f),focus)<22||String(f.id)===selected?.id)
      .sort((a,b)=>distance(model.filmPosition(a),focus)-distance(model.filmPosition(b),focus))
      .slice(0,45).map(f=>planet(f,!records[String(f.id)]?.watched)).join('');
  };
  function detail(){
    if(!selected)return '';
    if(selected.kind==='genre')return '<div class="cosmosDetail"><h3>'+esc(selected.name)+'</h3><p>この近くの監督と作品へ移動しました。作品は複数ジャンルの間に位置することがあります。</p><button type="button" data-cosmos-closer>作品まで近づく →</button></div>';
    if(selected.kind==='director')return '<div class="cosmosDetail"><h3>'+esc(selected.name)+'</h3><p>監督の位置は作品群から決まり、複数のジャンルの間に存在できます。</p><button type="button" data-cosmos-closer>作品まで近づく →</button><div class="cosmosDirectorQueue"><strong>この監督の作品を続けて評価</strong>'+catalog.filter(f=>f.director===selected.name).slice(0,12).map(f=>'<div><span>'+esc(f.title)+'</span>'+(root.CinemapRatingRuler?.(f,records[String(f.id)],true)||'')+'</div>').join('')+'</div></div>';
    const film=catalog.find(f=>String(f.id)===selected.id);if(!film)return '';
    const record=records[String(film.id)],recommendation=candidates().find(x=>String(x.film.id)===selected.id);
    return '<div class="cosmosDetail"><h3>'+esc(film.title)+'</h3><p>'+(record?.watched?'自分の評価: '+(record.rating==null?'未評価':Number(record.rating).toFixed(1))+' · 記録日: '+esc(recordDate(record.recordedAt||record.updatedAt)):'未登録の候補 · 鑑賞状況は不明')+'</p><p>監督: '+esc(film.director||'情報なし')+' · ジャンル: '+esc(film.genres?.join('・')||'情報なし')+'</p>'+(recommendation?.reasons?.length?'<p>候補になった理由: '+esc(recommendation.reasons.join('・'))+'</p>':'')+'<div class="cosmosDetailActions"><a href="'+link(film)+'">作品詳細へ →</a>'+(root.CinemapRatingRuler?.(film,record)||'')+'</div>'+(film.director?'<button type="button" data-cosmos-director="'+esc(film.director)+'">'+esc(film.director)+'作品を続けて評価 →</button>':'')+'</div>';
  }
  const worldTransform=()=>`translate3d(${camera.panX}px,${camera.panY}px,0) rotateX(${camera.pitch}deg) rotateY(${camera.yaw}deg) scale(${camera.zoom})`;
  function applyCamera(animated=false){
    const world=document.querySelector('#universe .cosmosWorld');
    if(world){world.style.transition=animated?'transform .68s cubic-bezier(.2,.8,.2,1)':'none';world.style.transform=worldTransform();world.style.setProperty('--inverse-zoom',String(1/camera.zoom));}
    try { sessionStorage.setItem('cinemap-ocean-camera',JSON.stringify(camera)); } catch { /* Storage is optional. */ }
  }
  function render(nextCatalog,nextRecords,newFilmId){
    newbornId=newFilmId==null?null:String(newFilmId);
    if(nextRecords)records=nextRecords;
    if(nextCatalog){const ids=new Set(nextCatalog.map(f=>String(f.id)));catalog=[...nextCatalog,...Object.values(records).filter(r=>r?.watched&&!ids.has(String(r.id)))];}
    const host=document.getElementById('universe');if(!host)return;
    const level=tier(),n=known().length;
    const nodes=level==='far'?genreNodes():level==='middle'?midNodes():nearNodes();
    const options=visibleGenres().map(g=>'<option value="'+esc(g)+'">'+esc(g)+'</option>').join('');
    const names=[...new Set([...catalog.filter(f=>f.director).map(f=>f.director),...catalog.map(f=>f.title)])];
    host.innerHTML='<section class="cosmosScene"><div class="cosmosControls oceanChrome"><button type="button" data-cosmos-home>全体を見る</button><label>海域へ移動 <select data-cosmos-jump><option value="">ジャンルを選ぶ</option>'+options+'</select></label><label>公開年代 <select data-cosmos-decade><option value="">すべて</option>'+Array.from({length:12},(_,i)=>1910+i*10).map(y=>'<option value="'+y+'"'+(decade===String(y)?' selected':'')+'>'+y+'年代</option>').join('')+'</select></label><form class="cosmosSearch" data-cosmos-search><label for="cosmosQuery">監督・作品を探す</label><input id="cosmosQuery" list="cosmosSuggestions" placeholder="作品名・監督名"><datalist id="cosmosSuggestions">'+names.slice(0,400).map(x=>'<option value="'+esc(x)+'"></option>').join('')+'</datalist><button>移動</button></form></div><div class="cosmosViewport" role="group" aria-label="映画の海。ドラッグで視点を動かし、ピンチで拡大縮小"><div class="cosmosWorld">'+nodes+'</div></div><div class="cosmosFoot oceanChrome"><span>ドラッグで泳ぐ · ピンチで潜る · 生き物をタップ</span><span>'+n+' creatures</span></div>'+detail()+'</section>';
    applyCamera();
    bindGestures(host.querySelector('.cosmosViewport'));
  }
  function fly(point,zoom,selection){
    if(!point)return;
    const stage=document.querySelector('#universe .cosmosViewport');
    const rect=stage?.getBoundingClientRect();
    camera.zoom=zoom;camera.focusX=point.x;camera.focusY=point.y;camera.yaw=0;camera.pitch=0;
    camera.panX=(.5-point.x/100)*(rect?.width||800)*zoom;
    camera.panY=(.5-point.y/100)*(rect?.height||580)*zoom;
    selected=selection;
    applyCamera(true);
    clearTimeout(flight);
    flight=setTimeout(()=>render(),720);
  }
  function home(){clearTimeout(flight);Object.assign(camera,{zoom:1,focusX:50,focusY:50,panX:0,panY:0,yaw:0,pitch:0});selected=null;render();}
  function bindGestures(viewport){
    const pointers=new Map();let pinchDistance=0,moved=false;
    viewport.addEventListener('pointerdown',e=>{moved=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});if(pointers.size===2){const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}});
    viewport.addEventListener('pointermove',e=>{
      const previous=pointers.get(e.pointerId);if(!previous)return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:previous.startX,startY:previous.startY});
      if(Math.hypot(e.clientX-previous.startX,e.clientY-previous.startY)>5){moved=true;if(!viewport.hasPointerCapture(e.pointerId))viewport.setPointerCapture(e.pointerId);}
      if(pointers.size>=2){
        const [a,b]=[...pointers.values()],dist=Math.hypot(a.x-b.x,a.y-b.y);
        if(pinchDistance){const next=clamp(camera.zoom*dist/pinchDistance,.85,4.8);camera.panX*=next/camera.zoom;camera.panY*=next/camera.zoom;camera.zoom=next;}
        pinchDistance=dist;
      }else{
        const dx=e.clientX-previous.x,dy=e.clientY-previous.y;
        camera.panX+=dx;camera.panY+=dy;
        camera.focusX=clamp(camera.focusX-dx/(viewport.clientWidth*camera.zoom)*100,0,100);
        camera.focusY=clamp(camera.focusY-dy/(viewport.clientHeight*camera.zoom)*100,0,100);
        camera.yaw=clamp(camera.yaw+dx*.035,-12,12);camera.pitch=clamp(camera.pitch-dy*.035,-9,9);
      }
      applyCamera();
    });
    const end=e=>{if(!pointers.delete(e.pointerId))return;if(pointers.size<2)pinchDistance=0;if(!pointers.size&&moved){draggedAt=Date.now();render();}};
    viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
    viewport.addEventListener('wheel',e=>{e.preventDefault();const next=clamp(camera.zoom*(e.deltaY>0?.88:1.12),.85,4.8);camera.panX*=next/camera.zoom;camera.panY*=next/camera.zoom;camera.zoom=next;applyCamera();clearTimeout(flight);flight=setTimeout(()=>render(),150);},{passive:false});
  }
  document.addEventListener('click',e=>{if(e.target.closest('.cosmosViewport')&&Date.now()-draggedAt<120){e.preventDefault();e.stopPropagation();}},true);
  document.addEventListener('click',e=>{
    if(!e.target.closest('#universe'))return;
    const genre=e.target.closest('[data-cosmos-genre]');if(genre){const g=genre.dataset.cosmosGenre,p=model.centerForGenre(g);fly({x:p[0],y:p[1]},2.2,{kind:'genre',name:g});return;}
    const director=e.target.closest('[data-cosmos-director]');if(director){const name=director.dataset.cosmosDirector;fly(model.directorPosition(name,catalog),3.8,{kind:'director',name});return;}
    let film=e.target.closest('[data-cosmos-film]');
    if(film){
      // In crowded constellations an overlapping planet can receive a tap on
      // another planet's centre. Choose the visually nearest centre instead.
      const closest=[...document.querySelectorAll('#universe .cosmosPlanet')].map(node=>{const r=node.getBoundingClientRect();return {node,d:Math.hypot(e.clientX-(r.left+r.right)/2,e.clientY-(r.top+r.bottom)/2)};}).sort((a,b)=>a.d-b.d)[0];
      if(closest?.d<48)film=closest.node;
      const id=film.dataset.cosmosFilm,f=catalog.find(x=>String(x.id)===id);if(f)fly(model.filmPosition(f),3.8,{kind:'film',id});return;
    }
    if(e.target.closest('[data-cosmos-home]')){home();return;}
    if(e.target.closest('[data-cosmos-closer]')){const p=selected?.kind==='genre'?model.centerForGenre(selected.name):model.directorPosition(selected?.name,catalog);if(p)fly(Array.isArray(p)?{x:p[0],y:p[1]}:p,3.8,selected);}
  });
  document.addEventListener('change',e=>{if(!e.target.matches('[data-cosmos-jump]')||!e.target.value)return;const g=e.target.value,p=model.centerForGenre(g);fly({x:p[0],y:p[1]},2.2,{kind:'genre',name:g});});
  document.addEventListener('change',e=>{if(e.target.matches('[data-cosmos-decade]')){decade=e.target.value;render();}});
  document.addEventListener('submit',e=>{
    if(!e.target.matches('[data-cosmos-search]'))return;e.preventDefault();
    const query=e.target.querySelector('input').value.trim().toLocaleLowerCase();if(!query)return;
    const movie=catalog.find(f=>f.title?.toLocaleLowerCase()===query)||catalog.find(f=>f.title?.toLocaleLowerCase().includes(query));
    if(movie){fly(model.filmPosition(movie),3.8,{kind:'film',id:String(movie.id)});return;}
    const director=catalog.find(f=>f.director?.toLocaleLowerCase()===query)||catalog.find(f=>f.director?.toLocaleLowerCase().includes(query));
    if(director)fly(model.directorPosition(director.director,catalog),3.8,{kind:'director',name:director.director});
    else e.target.querySelector('input').setCustomValidity('該当する作品・監督がありません');
  });
  document.addEventListener('input',e=>{if(e.target.id==='cosmosQuery')e.target.setCustomValidity('');});
  root.CinemapOceanView={render};
})(window);
