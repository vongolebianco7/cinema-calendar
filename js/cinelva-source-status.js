(async()=>{
 const host=document.getElementById('sourceStatusList');if(!host)return;
 const modes={automated:'公式APIから自動取得',manual:'人が公式出典を確認して登録','disabled-pending-permission':'許諾確認待ち・自動取得停止中','disabled-resource-scope':'取得範囲を見直すまで自動更新停止中',unavailable:'確認済み情報源がないため掲載していません'};
 try{
  const response=await fetch('data/source-status.json',{cache:'no-store'});if(!response.ok)throw Error('status unavailable');
  const data=await response.json();if(!Array.isArray(data.sources)||!data.sources.length)throw Error('status empty');
  const nodes=data.sources.map(row=>{
   const article=document.createElement('article');article.className='source-status-item';article.dataset.sourceCategory=row.id;
   const title=document.createElement('h3');title.textContent=row.name||'情報源';article.append(title);
   const text=value=>{const p=document.createElement('p');p.textContent=value;article.append(p);};
   text(modes[row.status]||'取得状態は未確認です');
   const source=document.createElement('p');source.textContent='情報源：'+(row.source||'未確認');
   if(/^https:\/\//.test(row.source_url||'')){const link=document.createElement('a');link.href=row.source_url;link.textContent=' 出典を確認';link.target='_blank';link.rel='noopener noreferrer';source.append(link);}article.append(source);
   text('収録日時：'+(row.source_observed_at?row.source_observed_at.replace('T',' ').replace(/\.\d{3}Z$/,' UTC'):'未確認'));
   if(Number.isInteger(row.record_count))text('収録件数：'+row.record_count+'件');
   if(row.trigger)text('更新処理：'+row.trigger);
   if(row.coverage)text('対象範囲：'+row.coverage);
   const age=(Date.now()-Date.parse(row.source_observed_at||''))/3600000;
   if(row.freshness==='stale'||Number.isFinite(row.max_age_hours)&&Number.isFinite(age)&&age>row.max_age_hours)text('収録日時が更新の目安を超えています。最新情報は出典でご確認ください。');
   if(row.id==='theater-directory')text('営業状況は未確認です。来館前に映画館の公式情報をご確認ください。');
   if(row.id==='editorial-features')text('各記事・作品の個別の出典をご確認ください。');
   if(row.observations){const o=row.observations;text('一覧生成時点の観測済み'+o.total+'件のうち過去7日以内'+o.fresh+'件、期限超過'+o.stale+'件、日時未確認'+o.unknown+'件。未観測の作品もあります。');}
   return article;
  });
  const generated=document.createElement('p');generated.textContent='この一覧の生成日時：'+String(data.generated_at||'未確認').replace('T',' ').replace(/\.\d{3}Z$/,' UTC')+'。個別の配信状況は作品ページの観測日時もご確認ください。';
  host.replaceChildren(generated,...nodes);
 }catch{host.textContent='収録状態を取得できませんでした。以下の個別の出典をご確認ください。';}
})();
