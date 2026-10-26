(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CinelvaWatchProviders=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function normalize(rows){
  const seen=new Set();
  return (Array.isArray(rows)?rows:[]).flatMap(row=>{
   const id=Number(row?.provider_id),name=typeof row?.provider_name==='string'?row.provider_name.trim():'';
   if(!Number.isSafeInteger(id)||id<=0||!name||seen.has(id))return [];
   seen.add(id);return [{id,name}];
  });
 }
 async function mount({container,api}){
  if(!container||!api)return;
  // Service filters sit below the discovery shelves; do not compete with startup requests.
  if(typeof IntersectionObserver!=='undefined')await new Promise(resolve=>{
   const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();resolve();}},{rootMargin:'160px'});observer.observe(container);
  });
  if(!container.isConnected)return;
  const status=container.ownerDocument.createElement('p');status.className='status';status.setAttribute('role','status');
  status.textContent='配信サービスを読み込み中…';container.after(status);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
  try{
   const response=await fetch(api+'/api/watch-providers',{signal:controller.signal});
   if(!response.ok)throw Error('metadata unavailable');
   const data=await response.json(),providers=normalize(data.providers);
   if(!providers.length)throw Error('empty metadata');
   // Read selection after the request: choices made while loading must survive.
   const checked=new Map([...container.querySelectorAll('input:checked')].map(input=>[Number(input.value),input.closest('label')?.textContent.trim()||String(input.value)]));
   for(const [id,name] of checked)if(!providers.some(p=>p.id===id))providers.push({id,name});
   const fragment=container.ownerDocument.createDocumentFragment();
   for(const provider of providers){
    const label=container.ownerDocument.createElement('label'),input=container.ownerDocument.createElement('input');
    label.className='providerCheck';label.style.maxWidth='100%';label.style.boxSizing='border-box';input.style.flexShrink='0';input.type='checkbox';input.value=String(provider.id);input.checked=checked.has(provider.id);
    const name=container.ownerDocument.createElement('span');name.textContent=provider.name;name.style.minWidth='0';name.style.overflowWrap='anywhere';label.append(input,name);fragment.append(label);
   }
   container.replaceChildren(fragment);container.style.maxHeight='192px';container.style.overflowY='auto';
   status.textContent='日本向けの配信情報に掲載されているサービスです。見放題の有無は作品ごとに異なります。';
  }catch{
   status.textContent='サービス一覧を更新できませんでした。表示中のサービスは検索できます。';
  }finally{clearTimeout(timer);}
 }
 return {normalize,mount};
});
