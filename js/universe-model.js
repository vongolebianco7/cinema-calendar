/* Deterministic, local taste model. Unknown film attributes stay unknown. */
(function (root) {
  'use strict';
  const weights = new Map([[2.5,-2],[3,-1],[3.5,0],[4,1],[4.5,2],[5,3.5]]);
  const ratingWeight = rating => weights.get(Number(rating)) ?? null;
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
  const api={ratingWeight,features,preferences,recommend,position};
  root.CinemapUniverseModel=api;
  if (typeof module !== 'undefined') module.exports=api;
})(typeof window === 'undefined' ? globalThis : window);
