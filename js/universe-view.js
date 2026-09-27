/* One navigable film universe. The scene is CSS 3D and renders only the current detail level. */
(function (root) {
  'use strict';
  const model=root.CinemapUniverseModel;
  const genres=Object.keys(model.genreCenters);
  const camera={zoom:1,focusX:50,focusY:50,panX:0,panY:0,yaw:0,pitch:0};
  let catalog=[],records={},selected=null,flight=null,draggedAt=0;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const known=()=>catalog.filter(f=>records[String(f.id)]?.watched);
  const visibleGenres=()=>[...genres,...[...new Set(known().flatMap(f=>Object.keys(model.genreStrengths(f))))].filter(g=>!genres.includes(g)).sort()];
  const tier=()=>camera.zoom<1.65?'far':camera.zoom<3.2?'middle':'near';
  const link=f=>'search.html?id='+encodeURIComponent(f.id)+'&search='+encodeURIComponent(f.title||'');
  const recordDate=v=>{const d=new Date(v||'');return Number.isNaN(d.getTime())?'不明':d.toLocaleDateString('ja-JP');};
  const hue=name=>model.position('color:'+name).x*3;
  const nodeStyle=(p,extra='')=>'left:'+p.x+'%;top:'+p.y+'%;--depth:'+p.z+'px;'+extra;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const genreNodes=()=>{
    const films=known();
    return visibleGenres().map(g=>{
      const p=model.centerForGenre(g), n=films.filter(f=>model.genreStrengths(f)[g]).length;
      return '<button type="button" class="cosmosBody cosmosGalaxy'+(n?' cosmosGalaxy--active':' cosmosGalaxy--dormant')+'" data-cosmos-genre="'+esc(g)+'" style="'+nodeStyle({x:p[0],y:p[1],z:p[2]},'--hue:'+hue(g)+';--mass:'+Math.min(n,10))+'" aria-label="'+esc(g)+'銀河、'+n+'作品の記録"><span class="cosmosHalo"></span><strong>'+esc(g)+'</strong><small>'+(n?n+'作品':'記録なし')+'</small></button>';
    }).join('');
  };
  const candidates=()=>model.recommend(records,catalog,12);
  const directorGroups=()=>{
    const byName=new Map();
    [...known(),...candidates().map(x=>x.film)].forEach(f=>{
      if(!f.director)return;
      if(!byName.has(f.director))byName.set(f.director,[]);
      byName.get(f.director).push(f);
    });
    return [...byName].map(([name,works])=>({name,works,point:model.directorPosition(name,catalog.filter(f=>f.director===name).length?catalog:works)}));
  };
  const midNodes=()=>{
    const focus={x:camera.focusX,y:camera.focusY};
    const systems=directorGroups().filter(x=>x.point&&distance(x.point,focus)<31).sort((a,b)=>distance(a.point,focus)-distance(b.point,focus)).slice(0,32);
    const directorMarkup=systems.map(s=>'<button type="button" class="cosmosBody cosmosDirector" data-cosmos-director="'+esc(s.name)+'" style="'+nodeStyle(s.point,'--hue:'+hue(s.name))+'" aria-label="'+esc(s.name)+'星系、'+s.works.length+'作品"><span class="cosmosHalo"></span><strong>'+esc(s.name)+'</strong><small>'+s.works.length+'作品</small></button>').join('');
    const anonymous=known().filter(f=>!f.director&&distance(model.filmPosition(f),focus)<27).slice(0,12).map(f=>planet(f,false)).join('');
    return directorMarkup+anonymous;
  };
  function planet(f,unknown){
    const p=model.filmPosition(f),record=records[String(f.id)],best=record?.rating===5;
    const score=Number(record?.rating);
    const glow=record?.watched&&Number.isFinite(score)?Math.max(0,(score-2.5)/2.5):0;
    return '<button type="button" class="cosmosBody cosmosPlanet'+(unknown?' cosmosPlanet--unknown':'')+(best?' cosmosPlanet--best':'')+'" data-cosmos-film="'+esc(f.id)+'" style="'+nodeStyle(p,'--glow:'+glow.toFixed(2))+'" aria-label="'+esc(f.title)+(unknown?'、未登録の候補':'、記録済み')+'"><span class="cosmosHalo">'+(f.poster?'<img src="'+esc(f.poster)+'" alt="" loading="lazy">':'')+'</span><strong>'+esc(f.title)+'</strong><small>'+(unknown?'未登録の候補':record?.rating!=null?Number(record.rating).toFixed(1):'観た')+'</small></button>';
  }
  const nearNodes=()=>{
    const focus={x:camera.focusX,y:camera.focusY};
    const recommended=candidates().map(x=>x.film);
    const films=[...known(),...recommended];
    if(selected?.kind==='film'&&!films.some(f=>String(f.id)===selected.id)){
      const f=catalog.find(x=>String(x.id)===selected.id);if(f)films.push(f);
    }
    return films.filter(f=>distance(model.filmPosition(f),focus)<22||String(f.id)===selected?.id)
      .sort((a,b)=>distance(model.filmPosition(a),focus)-distance(model.filmPosition(b),focus))
      .slice(0,45).map(f=>planet(f,!records[String(f.id)]?.watched)).join('');
  };
  function detail(){
    if(!selected)return '<p class="cosmosHint">銀河を選ぶと星系へ、さらに近づくと作品の惑星を探索できます。未登録は未鑑賞を意味しません。</p>';
    if(selected.kind==='genre')return '<div class="cosmosDetail"><h3>'+esc(selected.name)+'銀河</h3><p>この近くの監督星系と作品へ移動しました。1本の作品が複数ジャンルの間に位置することがあります。</p><button type="button" data-cosmos-closer>作品まで近づく →</button></div>';
    if(selected.kind==='director')return '<div class="cosmosDetail"><h3>'+esc(selected.name)+' 星系</h3><p>監督の位置は作品群から決まり、複数の銀河の間に存在できます。</p><button type="button" data-cosmos-closer>惑星まで近づく →</button></div>';
    const film=catalog.find(f=>String(f.id)===selected.id);if(!film)return '';
    const record=records[String(film.id)],recommendation=candidates().find(x=>String(x.film.id)===selected.id);
    return '<div class="cosmosDetail"><h3>'+esc(film.title)+'</h3><p>'+(record?.watched?'自分の評価: '+(record.rating==null?'未評価':Number(record.rating).toFixed(1))+' · 記録日: '+esc(recordDate(record.recordedAt||record.updatedAt)):'未登録の候補 · 鑑賞状況は不明')+'</p><p>監督: '+esc(film.director||'情報なし')+' · ジャンル: '+esc(film.genres?.join('・')||'情報なし')+'</p>'+(recommendation?.reasons?.length?'<p>候補になった理由: '+esc(recommendation.reasons.join('・'))+'</p>':'')+'<div class="cosmosDetailActions"><a href="'+link(film)+'">作品詳細へ →</a>'+(root.CinemapRatingRuler?.(film,record)||'')+'</div></div>';
  }
  const worldTransform=()=>`translate3d(${camera.panX}px,${camera.panY}px,0) rotateX(${camera.pitch}deg) rotateY(${camera.yaw}deg) scale(${camera.zoom})`;
  function applyCamera(animated=false){
    const world=document.querySelector('#universe .cosmosWorld');
    if(world){world.style.transition=animated?'transform .68s cubic-bezier(.2,.8,.2,1)':'none';world.style.transform=worldTransform();}
  }
  function render(nextCatalog,nextRecords){
    if(nextRecords)records=nextRecords;
    if(nextCatalog){const ids=new Set(nextCatalog.map(f=>String(f.id)));catalog=[...nextCatalog,...Object.values(records).filter(r=>r?.watched&&!ids.has(String(r.id)))];}
    const host=document.getElementById('universe');if(!host)return;
    const level=tier(),n=known().length;
    const nodes=level==='far'?genreNodes():level==='middle'?midNodes():nearNodes();
    const options=visibleGenres().map(g=>'<option value="'+esc(g)+'">'+esc(g)+'銀河</option>').join('');
    const names=[...new Set([...catalog.filter(f=>f.director).map(f=>f.director),...catalog.map(f=>f.title)])];
    host.innerHTML='<section class="cosmosScene"><div class="cosmosHeader"><span class="universeEyebrow">YOUR FILM UNIVERSE · '+(n>=20?'成長中':n>=10?'仮Universe':'形成中')+'</span><h2>あなたの映画宇宙</h2><p>ひとつの宇宙を探索する。銀河はジャンル、恒星は監督、惑星は作品です。</p></div><div class="cosmosControls"><button type="button" data-cosmos-home>全体を見る</button><label>銀河へ移動 <select data-cosmos-jump><option value="">ジャンルを選ぶ</option>'+options+'</select></label><form class="cosmosSearch" data-cosmos-search><label for="cosmosQuery">監督・作品を探す</label><input id="cosmosQuery" list="cosmosSuggestions" placeholder="作品名・監督名"><datalist id="cosmosSuggestions">'+names.slice(0,400).map(x=>'<option value="'+esc(x)+'"></option>').join('')+'</datalist><button>移動</button></form></div><div class="cosmosViewport" role="group" aria-label="映画宇宙。ドラッグで視点を動かし、ピンチで拡大縮小"><div class="cosmosWorld">'+nodes+'</div><div class="cosmosLevel">'+(level==='far'?'遠景 · ジャンル銀河':level==='middle'?'中景 · 監督星系':'近景 · 作品惑星')+'</div></div><div class="cosmosFoot"><span>1本指で移動 · ピンチで拡大縮小 · 天体をタップして接近</span><span>'+n+'作品を記録</span></div>'+detail()+'</section>';
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
    viewport.addEventListener('pointerdown',e=>{moved=false;(e.target.closest('button')||viewport).setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}});
    viewport.addEventListener('pointermove',e=>{
      const previous=pointers.get(e.pointerId);if(!previous)return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(Math.hypot(e.clientX-previous.x,e.clientY-previous.y)>3)moved=true;
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
    const end=e=>{if(!pointers.delete(e.pointerId))return;if(pointers.size<2)pinchDistance=0;if(!pointers.size){if(moved)draggedAt=Date.now();render();}};
    viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
    viewport.addEventListener('wheel',e=>{e.preventDefault();const next=clamp(camera.zoom*(e.deltaY>0?.88:1.12),.85,4.8);camera.panX*=next/camera.zoom;camera.panY*=next/camera.zoom;camera.zoom=next;applyCamera();clearTimeout(flight);flight=setTimeout(()=>render(),150);},{passive:false});
  }
  document.addEventListener('click',e=>{if(e.target.closest('.cosmosViewport')&&Date.now()-draggedAt<400){e.preventDefault();e.stopPropagation();}},true);
  document.addEventListener('click',e=>{
    if(!e.target.closest('#universe'))return;
    const genre=e.target.closest('[data-cosmos-genre]');if(genre){const g=genre.dataset.cosmosGenre,p=model.centerForGenre(g);fly({x:p[0],y:p[1]},2.2,{kind:'genre',name:g});return;}
    const director=e.target.closest('[data-cosmos-director]');if(director){const name=director.dataset.cosmosDirector;fly(model.directorPosition(name,catalog),3.8,{kind:'director',name});return;}
    const film=e.target.closest('[data-cosmos-film]');if(film){const id=film.dataset.cosmosFilm,f=catalog.find(x=>String(x.id)===id);if(f)fly(model.filmPosition(f),3.8,{kind:'film',id});return;}
    if(e.target.closest('[data-cosmos-home]')){home();return;}
    if(e.target.closest('[data-cosmos-closer]')){const p=selected?.kind==='genre'?model.centerForGenre(selected.name):model.directorPosition(selected?.name,catalog);if(p)fly(Array.isArray(p)?{x:p[0],y:p[1]}:p,3.8,selected);}
  });
  document.addEventListener('change',e=>{if(!e.target.matches('[data-cosmos-jump]')||!e.target.value)return;const g=e.target.value,p=model.centerForGenre(g);fly({x:p[0],y:p[1]},2.2,{kind:'genre',name:g});});
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
  root.CinemapUniverseView={render};
})(window);
