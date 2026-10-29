(()=>{
 'use strict';
 const bookmarkKey='cinelva-want-to-watch-v1',enabledKey='cinelva-release-notices-enabled-v1',dismissedKey='cinelva-release-notices-dismissed-v1';
 const $=id=>document.getElementById(id);let panel,list,status,loaded=null;
 const readObject=key=>{try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}};
 function ensurePanel(){
  list=$('wantWatchList');if(!list)return false;
  if(panel?.isConnected)return true;
  const style=document.createElement('style');style.textContent='.cinelva-release-notice{margin:12px 0 16px;padding:12px;border:1px solid var(--line,#444);border-radius:10px;background:var(--panel,#17191d);color:var(--ink,#eee);font-size:13px}.cinelva-release-notice label{display:flex;align-items:flex-start;gap:9px;line-height:1.55}.cinelva-release-notice input{width:20px;height:20px;flex:none;margin:0;accent-color:#d4a945}.cinelva-release-notice small{display:block;color:var(--muted,#aaa);margin:7px 0}.cinelva-release-notice-list{display:grid;gap:8px}.cinelva-release-notice-item{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:9px;border-radius:8px;background:var(--soft,#22252a)}.cinelva-release-notice-item a{color:inherit}.cinelva-release-notice-item button{flex:none;border:1px solid var(--line,#555);border-radius:7px;padding:5px 8px;background:transparent;color:inherit;font-size:12px}';
  panel=document.createElement('section');panel.className='cinelva-release-notice';panel.setAttribute('aria-label','公開・配信予定のお知らせ');
  const label=document.createElement('label'),toggle=document.createElement('input');toggle.type='checkbox';toggle.id='cinelvaReleaseNoticeToggle';toggle.checked=localStorage.getItem(enabledKey)==='1';
  const copy=document.createElement('span');copy.textContent='見たい映画の公開・配信予定を確認する（この端末のみ）';label.append(toggle,copy);
  const note=document.createElement('small');note.textContent='有効にすると、このページまたは「見たい映画」を開いたときに当日分を確認します。バックグラウンド通知は行いません。予定日当日の表示で、現在の公開・配信状況を保証するものではありません。';
  status=document.createElement('div');status.className='cinelva-release-notice-status';status.setAttribute('role','status');
  const results=document.createElement('div');results.className='cinelva-release-notice-list';results.id='cinelvaReleaseNoticeList';
  panel.append(label,note,status,results);list.before(panel);document.head.append(style);
  toggle.addEventListener('change',()=>{try{localStorage.setItem(enabledKey,toggle.checked?'1':'0');refresh(true)}catch{status.textContent='このブラウザーでは設定を保存できません。';}});
  return true;
 }
 async function catalog(){
  if(!loaded)loaded=Promise.all(['../data/movies.json','../data/streaming.json'].map(async path=>{const response=await fetch(path,{cache:'force-cache'});if(!response.ok)throw Error('予定データを取得できません');const data=await response.json();return Array.isArray(data.movies)?data.movies:[]})).then(groups=>groups.flat());
  return loaded;
 }
 async function refresh(force=false){
  if(!ensurePanel())return;
  const toggle=$('cinelvaReleaseNoticeToggle'),output=$('cinelvaReleaseNoticeList');output.replaceChildren();
  if(!toggle.checked){status.textContent='公開予定のお知らせはオフです。';return;}
  const dismissed=readObject(dismissedKey);if(!force&&status.dataset.loaded==='1')return;
  status.textContent='公開・配信予定を確認しています…';
  try{
   const rows=await catalog(),bookmarks=readObject(bookmarkKey),notices=globalThis.CinelvaReleaseNotices?.collectReleaseNotices({bookmarks:Object.values(bookmarks),catalog:rows,dismissed:Object.keys(dismissed)});
   if(!notices)throw Error('通知機能を読み込めません');
   if(!notices.length){status.textContent='今日が公開・配信予定日のブックマークはありません。';status.dataset.loaded='1';return;}
   status.textContent=`今日が公開・配信予定日の映画：${notices.length}本`;
   for(const item of notices){
    const article=document.createElement('article');article.className='cinelva-release-notice-item';
    const copy=document.createElement('div'),title=document.createElement('strong');title.textContent=item.title;const detail=document.createElement('div');detail.textContent=`${item.event==='streaming'?'配信開始予定':'劇場公開予定'} · ${item.service||'公開予定'}${item.source?' · '+item.source:''}`;
    const source=document.createElement('a');source.href=item.source_url;source.target='_blank';source.rel='noopener noreferrer';source.textContent='公式情報';copy.append(title,detail,source);
    const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='閉じる';dismiss.setAttribute('aria-label',`${item.title}のお知らせを閉じる`);dismiss.addEventListener('click',()=>{try{dismissed[item.key]=true;localStorage.setItem(dismissedKey,JSON.stringify(dismissed));article.remove();if(!output.children.length)status.textContent='今日のお知らせはありません。';}catch{status.textContent='このブラウザーでは設定を保存できません。';}});
    article.append(copy,dismiss);output.append(article);
   }
   status.dataset.loaded='1';
  }catch{status.textContent='公開予定を読み込めませんでした。時間をおいてもう一度ご確認ください。';status.dataset.loaded='0';}
 }
 document.querySelector('[data-tab="watchlist"]')?.addEventListener('click',()=>refresh(true));
 window.addEventListener('cinelva-bookmarks-updated',()=>refresh(true));
 window.addEventListener('storage',event=>{if([bookmarkKey,enabledKey,dismissedKey].includes(event.key)){const toggle=$('cinelvaReleaseNoticeToggle');if(toggle&&event.key===enabledKey)toggle.checked=localStorage.getItem(enabledKey)==='1';refresh(true);}});
 if(ensurePanel())status.textContent='「見たい映画」を開いたときに予定日を確認します。';
})();
