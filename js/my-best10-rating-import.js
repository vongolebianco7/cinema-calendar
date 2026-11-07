/* My Best 10: safe, deterministic filtering for personal-rating imports. */
(function(root){
  'use strict';
  function releaseYear(record){
    const match=String(record?.year??'').trim().match(/^(\d{4})/);
    if(!match)return null;
    const year=Number(match[1]);
    return year>=1&&year<=9999?year:null;
  }
  function matchesPeriod(record,period){
    if(!period||period==='all')return true;
    const year=releaseYear(record);
    if(year===null)return false;
    if(period==='pre1950')return year<1950;
    const start=Number(period);
    return Number.isInteger(start)&&start>=1950&&start<=2090&&start%10===0&&year>=start&&year<start+10;
  }
  function filterCandidates(records,period='all'){
    const unique=new Map();
    (Array.isArray(records)?records:[])
      .filter(record=>record&&record.watched!==false&&typeof record.rating==='number'&&Number.isFinite(record.rating)&&record.rating>0&&record.rating<=5&&String(record.title||'').trim()&&matchesPeriod(record,period))
      .sort((a,b)=>b.rating-a.rating||String(a.title).localeCompare(String(b.title),'ja')||String(a.tmdbId||a.id).localeCompare(String(b.tmdbId||b.id)))
      .forEach(record=>{
        const id=String(record.tmdbId||record.tmdb_id||record.id||'');
        if(id&&!unique.has(id))unique.set(id,record);
      });
    return [...unique.values()].slice(0,10);
  }
  function periodLabel(period){
    if(!period||period==='all')return 'オールタイムベスト';
    if(period==='pre1950')return '1950年代以前';
    return String(period)+'年代';
  }
  root.CinelvaBest10RatingImport={releaseYear,matchesPeriod,filterCandidates,periodLabel};
})(window);
