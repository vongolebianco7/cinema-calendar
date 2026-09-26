(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ScreeningModelV7=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const ORDER=['standard','imax','dolby_cinema','motion','screenx'];
  const LABELS={standard:'通常上映',imax:'IMAX',dolby_cinema:'Dolby Cinema',motion:'4DX / MX4D',screenx:'ScreenX'};
  const clamp=(n,min=1,max=5)=>Math.max(min,Math.min(max,Math.round(n)));
  const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
  const names=x=>(Array.isArray(x)?x:[]).map(v=>typeof v==='string'?v:(v&&v.name)||'').join(' ');
  const textOf=m=>[m.title,m.original_title,m.overview,names(m.genres),names(m.keywords),m.tagline].filter(Boolean).join(' ').toLowerCase();
  const hit=(text,re)=>re.test(text)?1:0;
  const level=(base,signals)=>clamp(base+signals.reduce((n,v)=>n+v,0));
  function extractedTraits(m){
    const t=textOf(m);
    const action=hit(t,/action|アクション|battle|戦闘|war|戦争|explosion|爆発|chase|追跡|race|レース|car|車|vehicle|乗り物|flight|飛行|fighter|戦闘機/);
    const travel=hit(t,/journey|旅|road|道路|highway|荒野|desert|砂漠|mountain|山|ocean|海|space|宇宙|landscape|風景|horizon|地平線|nature|自然/);
    const sports=hit(t,/sport|スポーツ|basketball|バスケット|サッカー|football|baseball|野球|court|コート|stadium|スタジアム|game|試合/);
    const music=hit(t,/music|音楽|score|劇伴|concert|ライブ|musical|ミュージカル|song|歌/);
    const dark=hit(t,/dark|暗|night|夜|noir|ノワール|gotham|ゴッサム|horror|ホラー|thriller|スリラー|rain|雨|neon|ネオン/);
    const colorful=hit(t,/color|colour|色彩|animation|アニメ|fantasy|ファンタジー|art|美術|visual|映像/);
    const quiet=hit(t,/quiet|静か|contemplative|内省|romance|恋愛|drama|ドラマ|conversation|会話|日常/);
    const crowd=hit(t,/crowd|群衆|観客|arena|アリーナ|stadium|スタジアム|court|コート/);
    const impact=hit(t,/impact|衝撃|collision|接触|jump|ジャンプ|fall|落下|explosion|爆発|crash|クラッシュ|water|水|storm|嵐|wind|風/);
    const lateral=hit(t,/lateral|横移動|court|コート|field|フィールド|road|道路|city|都市|crowd|群衆|landscape|風景|horizon|地平線/);
    return {
      scale:level(2,[action,travel,sports]),
      spatial:level(2,[travel,crowd,lateral]),
      motion:level(1,[action,sports,impact,hit(t,/speed|高速|sprint|ダッシュ|running|走|dribble|ドリブル/)]),
      physical:level(1,[impact,action,sports]),
      setpiece:level(1,[action,sports,hit(t,/major|大規模|spectacle|スペクタクル|climax|クライマックス/)]),
      visual:level(2,[dark,colorful,travel]),
      audio:level(2,[music,action,sports,hit(t,/sound|音響|bass|低音|atmos|歓声|crowd/)]),
      contemplative:level(1,[quiet]),
      framing:2,
      lateral:level(1,[lateral,sports,travel]),
      sports:level(1,[sports])
    };
  }
  function mergeTraits(m,e){
    return {...extractedTraits(m),...((m&&m.cinematic_traits)||{}),...((e&&e.cinematic_traits)||{})};
  }
  function evidenceFor(m,db){
    db=db||{};
    const def=db.default||{};
    const id=String(m.tmdbId||m.id||'');
    const year=String(m.year||String(m.date||'').slice(0,4)||'');
    const fixtures=db.title_fixtures||{};
    const candidates=[m.title,m.original_title].filter(Boolean).map(t=>fixtures[String(t)+'|'+year]||{});
    return Object.assign({},def,(db.films||{})[id]||{},...candidates);
  }
  const known=v=>v!==undefined&&v!==null&&v!=='unknown';
  function officialStatus(key,e){
    if(key==='standard')return {verified:true,label:'基本上映'};
    if(key==='imax'){
      const v=known(e.imax_camera)||known(e.imax_expanded_ratio)||e.filmed_for_imax===true||e.imax_dmr_only===true;
      return {verified:v,label:v?'IMAX作品情報あり':'IMAX作品情報は未確認'};
    }
    if(key==='dolby_cinema'){
      const v=e.dolby_vision_master===true||e.dolby_atmos_mix===true;
      return {verified:v,label:v?'Dolby作品情報あり':'Dolby作品情報は未確認'};
    }
    if(key==='motion'){
      const v=e.official_4dx===true||e.official_mx4d===true;
      return {verified:v,label:v?'公式4DX/MX4D版を確認':'公式4DX/MX4D版は未確認'};
    }
    const v=e.official_screenx===true;
    return {verified:v,label:v?'公式ScreenX版を確認':'公式ScreenX版は未確認'};
  }
  function sourceList(key,e){return (e.sources||[]).filter(s=>(s.formats||[]).includes(key));}
  function imaxRow(tr,e){
    const expanded=known(e.imax_expanded_ratio)&&e.imax_expanded_ratio!=='none';
    const captured=['imax_film','imax_certified_digital'].includes(e.imax_camera)||e.filmed_for_imax===true;
    let score=2,reason='IMAX固有の拡張画角は未確認です。作品特性による大画面・音響の上乗せを中心に見ます。';
    if(expanded&&captured){score=5;reason='IMAXカメラ撮影と拡張画角を作品固有情報で確認。通常上映より広い画面情報を含むシーンがあります。';}
    else if(expanded){score=4;reason='IMAXで拡張画角となる作品固有情報を確認。画面情報の広がりが明確です。';}
    else if(Math.max(tr.scale,tr.audio,tr.motion,tr.setpiece)>=4){score=3;reason='拡張画角は未確認。一方、大画面・低音・大規模な見せ場を活かしやすい作品特性があります。';}
    const stat=officialStatus('imax',e);
    return {key:'imax',name:LABELS.imax,score,reason,availability:stat.label,verifiedVersion:stat.verified,sources:sourceList('imax',e),details:{expandedRatio:e.imax_expanded_ratio||'unknown',capture:e.imax_camera||'unknown'}};
  }
  function dolbyRow(tr,e){
    let picture=clamp(tr.visual,2,5),audio=clamp(tr.audio,2,5);
    if(e.dolby_vision_master===true)picture=Math.max(4,picture);
    if(e.dolby_atmos_mix===true)audio=Math.max(4,audio);
    let score=2;
    if(e.dolby_vision_master===true&&e.dolby_atmos_mix===true&&picture>=4&&audio>=4)score=5;
    else if((Math.max(picture,audio)>=4&&Math.min(picture,audio)>=2)||(picture>=3&&audio>=3))score=4;
    else if(Math.max(picture,audio)>=3)score=3;
    const p=picture>=4?'暗部・明暗差・色彩・撮影表現の強みが出やすい':'映像面の上乗せは中程度';
    const a=audio>=4?'空間音響・低音・音楽・環境音の強みが出やすい':'音響面の上乗せは中程度';
    const stat=officialStatus('dolby_cinema',e);
    return {key:'dolby_cinema',name:LABELS.dolby_cinema,score,reason:p+'。'+a+'。',availability:stat.label,verifiedVersion:stat.verified,sources:sourceList('dolby_cinema',e),subscores:{picture,audio}};
  }
  function motionRow(tr,e){
    let score=2;
    const physical=Math.max(tr.motion,tr.physical),scene=Math.max(tr.setpiece,tr.sports);
    if((e.official_4dx===true||e.official_mx4d===true)&&physical>=5&&scene>=4)score=5;
    else if(physical>=4&&scene>=4)score=4;
    else if(physical>=3&&scene>=3)score=3;
    if(tr.contemplative>=4&&physical<4)score=2;
    const stat=officialStatus('motion',e);
    const reason=score>=4?'移動・衝撃・加速など身体感覚に変換しやすい重要場面が複数あります。':score===3?'体感演出が効く場面はありますが、作品全体を通した身体性は中程度です。':'座席の動きや体感効果が作品の中心になりやすい場面は多くありません。';
    return {key:'motion',name:LABELS.motion,score,reason,availability:stat.label,verifiedVersion:stat.verified,sources:sourceList('motion',e)};
  }
  function screenxRow(tr,e){
    const breadth=Math.max(tr.spatial,tr.lateral);
    let score=2;
    if(e.official_screenx===true&&breadth>=4&&tr.framing<=3)score=5;
    else if(breadth>=4&&tr.framing<=3)score=4;
    else if(breadth>=3)score=3;
    if(tr.framing>=5)score=Math.min(score,3);
    const stat=officialStatus('screenx',e);
    const reason=score>=4?'広い景観・競技空間・横方向の移動など、周辺視野まで広がることで活きる空間表現があります。':score===3?'横方向への広がりが効く場面はありますが、作品全体の核とまでは言いにくい構成です。':'周辺視野への拡張が作品体験の中心になりやすい場面は多くありません。';
    return {key:'screenx',name:LABELS.screenx,score,reason,availability:stat.label,verifiedVersion:stat.verified,sources:sourceList('screenx',e)};
  }
  function standardRow(maxSpecial){
    const score=maxSpecial>=4?3:4;
    return {key:'standard',name:LABELS.standard,score,reason:score===4?'特殊上映で大きく伸びる決定的な要素は少なく、通常上映でも作品の中心的な表現を十分に受け取りやすい構成です。':'特殊上映で伸びる要素がありますが、通常上映でも作品の基本的な映像・音響は楽しめます。',availability:'基本上映',verifiedVersion:true,sources:[]};
  }
  function scoreMovie(m,db){
    const e=evidenceFor(m,db),tr=mergeTraits(m,e);
    const special=[imaxRow(tr,e),dolbyRow(tr,e),motionRow(tr,e),screenxRow(tr,e)];
    const standard=standardRow(Math.max(...special.map(x=>x.score)));
    return [standard,...special];
  }
  function renderReason(row){
    const sub=row.subscores?`<div class="screeningSubscores"><span>映像 ${stars(row.subscores.picture)}</span><span>音響 ${stars(row.subscores.audio)}</span></div>`:'';
    const src=row.sources&&row.sources.length?`<div class="screeningSources">${row.sources.map(s=>`<a target="_blank" rel="noopener noreferrer" href="${String(s.url||'')}">${String(s.label||'公式情報')} ↗</a>`).join('')}</div>`:'';
    return `${sub}<div class="screeningReason">${row.reason}</div><div class="screeningEvidenceState">${row.availability}</div>${src}`;
  }
  return {ORDER,LABELS,stars,evidenceFor,extractedTraits,scoreMovie,renderReason};
});
