(() => {
 'use strict';
 const Q=globalThis.CinelvaDataQuality;
 let offers=[],filter={mode:typeof mode==='string'?mode:'streaming',service:typeof active==='string'?active:'すべて'};
 function render(){
  document.querySelectorAll('[data-official-offers]').forEach(target=>{
   const filtered=Q.activeOfficialOffers(offers).filter(row=>target.dataset.officialOffers!=='calendar'||(filter.mode==='streaming'&&(filter.service==='すべて'||row.service===filter.service)));
   target.replaceChildren();target.hidden=!filtered.length;if(!filtered.length)return;
   const heading=document.createElement('h3');heading.textContent='WOWOWオンデマンド · 公式掲載作品';target.append(heading);
   const note=document.createElement('p');note.className='small';note.textContent='テレビ放送とは別のオンデマンド掲載情報です。配信開始日は未確認です。契約・再生可否は提供元で確認してください。';target.append(note);
   for(const row of filtered){
    const article=document.createElement('article');article.style.cssText='padding:12px 0;border-top:1px solid var(--line);overflow-wrap:anywhere';
    const title=document.createElement('a');title.href='search.html?'+new URLSearchParams({id:String(row.id),search:row.title});title.textContent=row.title+'（'+row.year+'年）';
    const source=document.createElement('a');source.href=row.source_url;source.target='_blank';source.rel='noopener noreferrer';source.textContent='公式の配信期間を確認 ↗';
    const meta=document.createElement('p');meta.className='small';meta.textContent='掲載確認：'+row.checked_at.slice(0,10)+' UTC · 終了予定：'+row.ends_at.slice(0,10)+'（日本時間）';
    article.append(title,meta,source);target.append(article);
   }
  });
 }
 globalThis.CinelvaOfficialOffers={setFilter(value){filter=value;render();}};
 fetch('data/official_on_demand.json',{cache:'no-store'}).then(response=>response.ok?response.json():{offers:[]}).then(data=>{offers=data.offers||[];render();}).catch(()=>{offers=[];render();});
})();
