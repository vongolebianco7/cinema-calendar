/* Deterministic, local taste model. Unknown film attributes stay unknown. */
(function (root) {
  'use strict';
  const anchors = [[0.1,-2.5],[2.5,-2],[3,-1],[3.5,0],[4,1],[4.5,2],[5,3.5]];
  function ratingWeight(rating) {
    const score=Number(rating);
    if (!Number.isFinite(score) || score<0.1 || score>5 || !Number.isInteger(score*10)) return null;
    for (let i=1;i<anchors.length;i++) {
      if (score<=anchors[i][0]) {
        const [from,weight]=anchors[i-1], [to,next]=anchors[i];
        return weight+(score-from)*(next-weight)/(to-from);
      }
    }
    return anchors.at(-1)[1];
  }
  function features(film) {
    const result = {};
    const genres = Array.isArray(film?.genres) ? film.genres.filter(Boolean) : [];
    genres.forEach((name,index) => { result['genre:'+name] = index ? 0.75 : 1; });
    if (film?.director) result['director:'+film.director] = 1;
    if (film?.region) result['region:'+film.region] = 0.35;
    if (Number.isFinite(Number(film?.year)) && Number(film.year)>=1880) result['decade:'+Math.floor(Number(film.year)/10)*10] = 0.5;
    if (film?.subgenre) result['subgenre:'+film.subgenre] = 0.75;
    if (film?.series) result['series:'+film.series] = 0.65;
    if (Array.isArray(film?.countries)) film.countries.filter(Boolean).forEach(name => { result['country:'+name] = 0.45; });
    if (film?.featureProfile && typeof film.featureProfile === 'object') {
      for (const [name,value] of Object.entries(film.featureProfile)) {
        if (Number.isFinite(value) && value>=0 && value<=1) result['trait:'+name] = value;
      }
    }
    return result;
  }
  function preferences(records, catalog) {
    const byId = new Map(catalog.map(film=>[String(film.id),film]));
    const result = {};
    for (const record of Object.values(records||{})) {
      if (!record?.watched) continue;
      const weight = ratingWeight(record.rating);
      if (weight===null) continue;
      const film = byId.get(String(record.id)) || record;
      for (const [feature,strength] of Object.entries(features(film))) {
        const item = result[feature] ||= {sum:0,evidence:0,score:0};
        item.sum += weight*strength;
        item.evidence++;
      }
    }
    Object.values(result).forEach(item=>{item.score=item.sum/(item.evidence+1);});
    return result;
  }
  function recommend(records, catalog, limit=8) {
    const prefs=preferences(records,catalog);
    if (!Object.keys(prefs).length) return [];
    return catalog.filter(film=>!records?.[String(film.id)]?.watched).map(film=>{
      const contributions=Object.entries(features(film)).map(([name,strength])=>({name,value:(prefs[name]?.score||0)*strength}));
      const score=contributions.reduce((sum,item)=>sum+item.value,0);
      const reasons=contributions.filter(item=>item.value>0 && /^(genre|director|subgenre):/.test(item.name)).sort((a,b)=>b.value-a.value).slice(0,2).map(item=>item.name.split(':').slice(1).join(':'));
      return {film,score,reasons};
    }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score || Number(a.film.id)-Number(b.film.id)).slice(0,limit);
  }
  function position(key) {
    let hash=2166136261;
    for (const char of String(key)) {hash^=char.codePointAt(0);hash=Math.imul(hash,16777619);}
    const x=10+(hash>>>0)%81;
    hash=Math.imul(hash^0x9e3779b9,16777619);
    return {x,y:12+(hash>>>0)%77};
  }
  const genreCenters = {
    'SF':[24,23,-55],'戦争':[45,20,14],'スリラー':[66,29,-20],'コメディ':[83,22,45],
    'アニメ':[21,52,35],'アクション':[43,57,-35],'ロマンス':[63,55,45],'ホラー':[83,52,-30],
    'ミステリー':[23,78,-15],'ファンタジー':[43,79,55],'クライム':[65,76,-45],'アドベンチャー':[84,78,20],
    'ドキュメンタリー':[8,39,9],'音楽':[57,9,28],'ファミリー':[9,90,30]
  };
  const centerForGenre = name => genreCenters[name] || (()=>{const p=position('genre:'+name);return [p.x,p.y,(p.x%7-3)*15];})();
  function genreStrengths(film) {
    const declared=film?.genreStrengths;
    if(declared && typeof declared==='object' && !Array.isArray(declared)) {
      const entries=Object.entries(declared).filter(([name,v])=>name && Number.isFinite(v)&&v>0&&v<=1);
      if(entries.length)return Object.fromEntries(entries);
    }
    // Ordered catalog genres have no measured intensity. These are layout weights, not asserted film traits.
    return Object.fromEntries((film?.genres||[]).filter(Boolean).map((name,i)=>[name,i===0?1:i===1?.7:.5]));
  }
  function filmPosition(film) {
    // Drama is retained as source metadata but is too broad to define a galaxy.
    const strengths=Object.entries(genreStrengths(film)).filter(([name])=>name in genreCenters);
    const base=strengths.length?strengths.reduce((v,[genre,weight])=>{const p=centerForGenre(genre);v[0]+=p[0]*weight;v[1]+=p[1]*weight;v[2]+=p[2]*weight;v[3]+=weight;return v;},[0,0,0,0]):[50,50,0,1];
    const jitter=position('film:'+film.id);
    return {x:Math.max(5,Math.min(95,base[0]/base[3]+(jitter.x-50)*.08)),y:Math.max(5,Math.min(95,base[1]/base[3]+(jitter.y-50)*.08)),z:Math.round(base[2]/base[3]+(jitter.x-jitter.y)*.25)};
  }
  function directorPosition(name,films) {
    const works=films.filter(f=>f.director===name);
    if(!works.length)return null;
    const points=works.map(filmPosition);
    return {x:points.reduce((s,p)=>s+p.x,0)/points.length,y:points.reduce((s,p)=>s+p.y,0)/points.length,z:points.reduce((s,p)=>s+p.z,0)/points.length};
  }
  const api={ratingWeight,features,preferences,recommend,position,genreCenters,centerForGenre,genreStrengths,filmPosition,directorPosition};
  root.CinemapUniverseModel=api;
  if (typeof module !== 'undefined') module.exports=api;
})(typeof window === 'undefined' ? globalThis : window);
