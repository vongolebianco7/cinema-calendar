/* Lightweight, shared local-first quick rating for existing movie pages. */
(function(root) {
'use strict';
const Records=root.CinelvaLibraryRecords;
if(!Records)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=x=>String(x||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
const validId=x=>/^[1-9]\d*$/.test(String(x??''));
let selected=null,activeCard=null;
const getRecord=movie=>{
 const id=movie?.tmdbId??movie?.tmdb_id??movie?.id;
 if(!validId(id))return null;
 const records=Records.all();
 return records.find(r=>r.tmdbId!=null&&String(r.tmdbId)===String(id)) ||
   records.find(r=>r.tmdbId==null&&String(r.id)===String(id)) || null;
};
const style=document.createElement('style');
style.textContent=`
.cinelva-rate-button{min-height:38px;border:1px solid #a78a50;border-radius:6px;background:#25211a;color:#f9e8c8;padding:7px 12px;margin:8px 0;font:600 13px system-ui;cursor:pointer}
.cinelva-rate-dialog{border:1px solid #7a715e;border-radius:12px;background:#202020;color:#f8f5ee;padding:0;width:min(94vw,470px);max-height:min(85dvh,680px);position:fixed;inset:auto 12px 12px auto;margin:0;z-index:10001;box-shadow:0 16px 60px #0009}
.cinelva-rate-dialog::backdrop{background:#0009}.cinelva-rate-inner{padding:20px;display:grid;gap:12px}.cinelva-rate-inner label{display:grid;gap:5px;font:13px system-ui}.cinelva-rate-inner input,.cinelva-rate-inner textarea,.cinelva-rate-inner select{width:100%;padding:10px;border:1px solid #68635a;background:#121212;color:#fff;border-radius:5px;box-sizing:border-box}
.cinelva-rate-inner textarea{min-height:78px;resize:vertical}.cinelva-rate-actions{display:flex;gap:10px;justify-content:space-between}.cinelva-rate-actions button{min-height:44px;flex:1;border-radius:6px;border:1px solid #a78a50;background:#f3e3c4;color:#211c15;font-weight:700}.cinelva-rate-actions button:first-child{background:#343434;color:#fff}.cinelva-rate-actions button{font-size:12px;padding:7px 4px}.cinelva-rate-saved{display:inline-block;margin:4px 6px;padding:4px 8px;border-radius:4px;background:#294335;color:#d4ffe3;font:700 12px system-ui}.cinelva-rate-saved[hidden]{display:none}
`;
document.head.append(style);
const dialog=document.createElement('dialog');dialog.className='cinelva-rate-dialog';
dialog.innerHTML=`<form class="cinelva-rate-inner" method="dialog"><strong id="cinelvaRateTitle">作品を評価</strong><label>点数：<output id="cinelvaRateValue">0.0</output><input id="cinelvaRateScore" type="range" min="0" max="5" step="0.5" value="0"></label><label>鑑賞方法<select id="cinelvaRatePlace"><option value="">未指定</option><option value="映画館">映画館</option><option value="配信">配信</option></select></label><label>鑑賞日（任意）<input id="cinelvaRateDate" type="text" inputmode="numeric" placeholder="YYYY / YYYY-MM / YYYY-MM-DD"></label><label>コメント（任意）<textarea id="cinelvaRateComment" maxlength="2000" placeholder="ひとことでもOK"></textarea></label><p id="cinelvaRateMessage" role="status" style="margin:0;font-size:12px"></p><div class="cinelva-rate-actions"><button type="button" id="cinelvaRateClose">閉じる</button><button type="button" id="cinelvaRateSave">保存</button><button type="button" id="cinelvaRateNext">次の作品 →</button></div></form>`;
document.body.append(dialog);
const $=id=>dialog.querySelector('#'+id);
$('cinelvaRateClose').onclick=()=>dialog.close();
$('cinelvaRateScore').oninput=()=>$('cinelvaRateValue').textContent=Number($('cinelvaRateScore').value).toFixed(1);
function open(movie) {
 const id=movie?.tmdbId??movie?.tmdb_id??movie?.id;
 if(!validId(id)){return false;}
 const existing=getRecord(movie);
 selected={...movie,...existing,id:String(existing?.id??id),tmdbId:id,title:existing?.title||movie.title||movie.name||'作品'};
 $('cinelvaRateTitle').textContent=selected.title;
 $('cinelvaRateScore').value=existing?.rating??0;
 $('cinelvaRateValue').textContent=Number($('cinelvaRateScore').value).toFixed(1);
 $('cinelvaRatePlace').value=existing?.viewingMethod||'';
 $('cinelvaRateDate').value=existing?.watchedAt||'';
 $('cinelvaRateComment').value=existing?.comment||'';
 $('cinelvaRateMessage').textContent='';
 if(!dialog.open)dialog.show();
 return true;
}
function save() {
 if(!selected)return;
 const date=$('cinelvaRateDate').value.trim()||null,comment=$('cinelvaRateComment').value.trim();
 if(!Records.validDate(date)){$('cinelvaRateMessage').textContent='日付はYYYY、YYYY-MM、YYYY-MM-DDで入力してください';return;}
 try{
  Records.save({...selected,comment,viewingMethod:$('cinelvaRatePlace').value},Number($('cinelvaRateScore').value),date);
  $('cinelvaRateMessage').textContent='保存しました。別の作品を選んで続けて評価できます。';
  root.dispatchEvent(new CustomEvent('cinelva-record-updated',{detail:{id:selected.id}}));
  // Keep the non-modal editor open: another existing list card can be
  // selected without returning to a separate record-management page.
 }catch(error){$('cinelvaRateMessage').textContent='保存できません：'+error.message;}
}
$('cinelvaRateSave').onclick=save;
// A persistent panel must not trap mobile users behind its own overlay.
// Navigate among the existing listing cards from inside the panel itself.
function nextMovie(){
 const grid=activeCard?.closest('#dates,#cards,#grid') || document.querySelector('#dates,#grid,#cards');
 if(!grid)return;
 const cards=[...grid.querySelectorAll('.cinelva-rate-wrap,.cinelva-rate-calendar-card')];
 if(!cards.length)return;
 const index=cards.indexOf(activeCard);
 const next=cards[(index+1)%cards.length];
 const button=next?.querySelector('.cinelva-rate-button');
 if(button)button.click();
}
$('cinelvaRateNext').onclick=nextMovie;
// Keep the actual existing calendar/ranking/search listings. A sibling rating
// action leaves the original movie detail link/button operational.
function movieFromCard(card,kind){
 if(kind==='rankings'){
  const u=new URL(card.href,location.href);
  return {id:u.searchParams.get('id'),title:u.searchParams.get('search')||card.querySelector('.title')?.textContent};
 }
 return root.CinelvaRatingResolve?.(card.dataset.mi??card.dataset.i,kind);
}
function refreshBadges(){
 for(const wrap of document.querySelectorAll('.cinelva-rate-wrap,.cinelva-rate-calendar-card')){
  const card=wrap.matches('.cinelva-rate-calendar-card')?wrap:wrap.querySelector('.rankCard,.card[data-i]');
  const badge=wrap.querySelector('.cinelva-rate-saved');
  if(!card||!badge)continue;
  const item=getRecord(movieFromCard(card,wrap.dataset.rateKind));
  badge.hidden=!item;
  if(item)badge.textContent='採点済み ★ '+Number(item.rating??0).toFixed(1);
 }
}
root.addEventListener('cinelva-record-updated',refreshBadges);
root.addEventListener('storage',event=>{
 if(event.key==='cinelva-library-records-v2'||event.key===null)refreshBadges();
});
function enhanceGrid(grid,kind){
 if(!grid)return;
 const decorate=()=>{
  for(const card of [...grid.querySelectorAll(kind==='rankings'?'a.rankCard':'.card[data-i]')]){
   if(card.parentElement?.classList.contains('cinelva-rate-wrap'))continue;
   const wrap=document.createElement('div');wrap.className='cinelva-rate-wrap';wrap.dataset.rateKind=kind;
   card.parentElement.insertBefore(wrap,card);
   wrap.append(card);
   const rate=document.createElement('button');rate.type='button';rate.className='cinelva-rate-button';
   rate.textContent='★ 採点・コメント';rate.setAttribute('aria-label','この作品を採点・コメント');
   const badge=document.createElement('span');badge.className='cinelva-rate-saved';badge.hidden=true;badge.setAttribute('aria-label','この作品の保存済み評価');wrap.append(badge);
   rate.onclick=event=>{
    event.stopPropagation();event.preventDefault();
    activeCard=wrap;
    const movie=movieFromCard(card,kind);
    if(!open(movie))rate.textContent='作品IDを確認できません';
   };
   wrap.append(rate);
  }
  refreshBadges();
 };
 const observer=new MutationObserver(decorate);
 observer.observe(grid,{childList:true,subtree:false});
 decorate();
}
style.textContent+=`
.cinelva-rate-wrap{min-width:0;position:relative}
.cinelva-rate-wrap>.card,.cinelva-rate-wrap>.rankCard{display:block;width:100%;height:auto}
.cinelva-rate-wrap>.cinelva-rate-button{display:block;width:calc(100% - 12px);margin:4px 6px 9px}.cinelva-rate-calendar-card>.cinelva-rate-button{display:block;width:calc(100% - 12px);margin:6px;position:relative;z-index:2}
`;
function enhanceCalendar(){
 const dates=document.querySelector('#dates');
 if(!dates)return;
 const decorate=()=>{
  for(const card of dates.querySelectorAll('.streamMovie[data-mi],.tvMovie[data-mi]')){
   if(card.classList.contains('cinelva-rate-calendar-card'))continue;
   card.classList.add('cinelva-rate-calendar-card');
   card.dataset.rateKind='calendar';
   const badge=document.createElement('span');
   badge.className='cinelva-rate-saved';badge.hidden=true;
   badge.setAttribute('aria-label','この作品の保存済み評価');
   const button=document.createElement('button');
   button.type='button';button.className='cinelva-rate-button';
   button.textContent='★ 採点・コメント';
   button.setAttribute('aria-label','この作品を採点・コメント');
   button.onclick=event=>{
    event.preventDefault();event.stopPropagation();
    activeCard=card;
    if(!open(movieFromCard(card,'calendar')))button.textContent='作品IDを確認できません';
   };
   card.append(badge,button);
  }
  refreshBadges();
 };
 new MutationObserver(decorate).observe(dates,{childList:true,subtree:true});
 decorate();
}
enhanceGrid(document.querySelector('#cards'),'calendar');
enhanceGrid(document.querySelector('#grid'),location.pathname.includes('rankings')?'rankings':'search');
enhanceCalendar();
root.CinelvaQuickRate={open,normalize};

})(window);
