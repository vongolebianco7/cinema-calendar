/* Lightweight, shared local-first quick rating for existing movie pages. */
(function(root) {
'use strict';
const Records=root.CinelvaLibraryRecords;
if(!Records)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=x=>String(x||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
const validId=x=>/^[1-9]\d*$/.test(String(x??''));
let selected=null,activeCard=null;
const style=document.createElement('style');
style.textContent=`
.cinelva-rate-dialog{width:min(94vw,390px);max-height:85dvh;overflow:auto}.cinelva-rate-inner{padding:14px;gap:9px}.cinelva-review-header{display:flex;align-items:center;justify-content:space-between;gap:10px}.cinelva-review-header strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cinelva-review-header button{background:transparent;border:0;color:inherit;font-size:27px;width:36px;height:36px;cursor:pointer}.cinelva-review-score{display:flex;align-items:baseline;gap:5px;flex-wrap:wrap}.cinelva-review-score output{font-size:30px;font-weight:750}.cinelva-review-score input{flex-basis:100%}.cinelva-review-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cinelva-rate-inner label[hidden]{display:none}.cinelva-rate-inner textarea{min-height:52px}

.cinelva-rate-button{min-height:38px;border:1px solid #a78a50;border-radius:6px;background:#25211a;color:#f9e8c8;padding:7px 12px;margin:8px 0;font:600 13px system-ui;cursor:pointer}
.cinelva-rate-dialog{border:1px solid #7a715e;border-radius:12px;background:#202020;color:#f8f5ee;padding:0;width:min(94vw,470px);max-height:min(85dvh,680px);position:fixed;inset:auto 12px 12px auto;margin:0;z-index:10001;box-shadow:0 16px 60px #0009}
.cinelva-rate-dialog::backdrop{background:#0009}.cinelva-rate-inner{padding:20px;display:grid;gap:12px}.cinelva-rate-inner label{display:grid;gap:5px;font:13px system-ui}.cinelva-rate-inner input,.cinelva-rate-inner textarea,.cinelva-rate-inner select{width:100%;padding:10px;border:1px solid #68635a;background:#121212;color:#fff;border-radius:5px;box-sizing:border-box}
.cinelva-rate-inner textarea{min-height:78px;resize:vertical}.cinelva-rate-actions{display:flex;gap:10px;justify-content:space-between}.cinelva-rate-actions button{min-height:44px;flex:1;border-radius:6px;border:1px solid #a78a50;background:#f3e3c4;color:#211c15;font-weight:700}.cinelva-rate-actions button:first-child{background:#343434;color:#fff}.cinelva-rate-actions button{font-size:12px;padding:7px 4px}
`;
style.textContent+=`\n/* Compact overrides must follow the base dialog declarations. */\n.cinelva-rate-dialog{width:min(94vw,390px);max-height:85dvh;overflow:auto}\n.cinelva-rate-inner{padding:14px;gap:9px}\n.cinelva-rate-inner textarea{min-height:52px}\n`;\nstyle.textContent+=`\n.cinelva-rate-button{display:inline-grid;place-items:center;min-width:40px;width:40px;height:40px;padding:0;border-radius:50%;font-size:21px;background:#ffffff0d;color:#eae4d6;border-color:#ffffff38;transition:all .18s}.cinelva-rate-button:hover,.cinelva-rate-button:focus-visible{background:#e7b94420;border-color:#e7b944}.cinelva-rate-button.is-watched{color:#f3c84e;border-color:#e7b94488}.cinelva-rate-wrap>.cinelva-rate-button{display:inline-grid;width:40px;margin:6px 8px}.cinelva-rate-dialog{background:#161719;border:1px solid #ffffff24;border-radius:18px;box-shadow:0 20px 70px #000b}.cinelva-rate-inner input,.cinelva-rate-inner textarea,.cinelva-rate-inner select{border-radius:10px;background:#232427;border-color:#ffffff28}.cinelva-rate-actions button{border-radius:999px}.cinelva-review-score output{color:#f3c84e}.cinelva-review-header button{border-radius:50%}.cinelva-review-header button:hover{background:#ffffff16}\n`;document.head.append(style);
const dialog=document.createElement('dialog');dialog.className='cinelva-rate-dialog';
dialog.innerHTML=`<form class="cinelva-rate-inner" method="dialog"><div class="cinelva-review-header"><strong id="cinelvaRateTitle">レビュー</strong><button type="button" id="cinelvaRateX" aria-label="閉じる">×</button></div><div class="cinelva-review-score"><output id="cinelvaRateValue">0.0</output><span>/ 5.0</span><input aria-label="点数" id="cinelvaRateScore" type="range" min="0" max="5" step="0.1" value="0"></div><div class="cinelva-review-row"><label>▦ 鑑賞日<input aria-label="鑑賞日をカレンダーから選択" id="cinelvaRateDate" type="date"></label><label>▣ 鑑賞方法<select id="cinelvaRatePlace"><option value="">未指定</option><option value="映画館">映画館</option><option value="配信">配信</option></select></label></div><label id="cinelvaRateVenueRow" hidden>映画館・サービス<input id="cinelvaRateVenue" maxlength="120" list="cinelvaRateVenueOptions" placeholder="名称を選択・入力"><datalist id="cinelvaRateVenueOptions"><option value="TOHOシネマズ"><option value="イオンシネマ"><option value="109シネマズ"><option value="MOVIX"><option value="T・ジョイ"><option value="ユナイテッド・シネマ"><option value="Netflix"><option value="Prime Video"><option value="Disney+"><option value="U-NEXT"><option value="Hulu"><option value="Apple TV+"><option value="Lemino"></datalist></label><label>✎ レビュー<textarea id="cinelvaRateComment" maxlength="2000" rows="2"></textarea></label><p id="cinelvaRateMessage" role="status" style="margin:0;font-size:12px"></p><div class="cinelva-rate-actions"><button type="button" id="cinelvaRateClose">×</button><button type="button" id="cinelvaRateSave">✓ 保存</button><button type="button" id="cinelvaRateNext">次へ →</button></div></form>`;
document.body.append(dialog);
const $=id=>dialog.querySelector('#'+id);
$('cinelvaRateClose').onclick=()=>dialog.close();
$('cinelvaRateX').onclick=()=>dialog.close();
$('cinelvaRatePlace').onchange=()=>{$('cinelvaRateVenueRow').hidden=!$('cinelvaRatePlace').value;};
$('cinelvaRateScore').oninput=()=>$('cinelvaRateValue').textContent=Number($('cinelvaRateScore').value).toFixed(1);
function open(movie) {
 const id=movie?.tmdbId??movie?.tmdb_id??movie?.id;
 if(!validId(id)){return false;}
 const existing=Records.all().find(r=>String(r.tmdbId??r.id)===String(id));
 selected={...movie,...existing,id:String(existing?.id??id),tmdbId:id,title:existing?.title||movie.title||movie.name||'作品'};
 $('cinelvaRateTitle').textContent=selected.title;
 $('cinelvaRateScore').value=existing?.rating??0;
 $('cinelvaRateValue').textContent=Number($('cinelvaRateScore').value).toFixed(1);
 $('cinelvaRatePlace').value=existing?.viewingMethod||'';
 $('cinelvaRateVenue').value=existing?.viewingVenue||'';
 $('cinelvaRateVenueRow').hidden=!$('cinelvaRatePlace').value;
 $('cinelvaRateDate').value=/^\\d{4}-\\d{2}-\\d{2}$/.test(existing?.watchedAt||'')?existing.watchedAt:'';
 $('cinelvaRateComment').value=existing?.comment||'';
 $('cinelvaRateMessage').textContent='';
 if(!dialog.open)dialog.show();
 return true;
}
function save() {
 if(!selected)return;
 const date=$('cinelvaRateDate').value.trim()||(selected.watchedAt && !/^\\d{4}-\\d{2}-\\d{2}$/.test(selected.watchedAt)?selected.watchedAt:null),comment=$('cinelvaRateComment').value.trim();
 if(!Records.validDate(date)){$('cinelvaRateMessage').textContent='カレンダーから鑑賞日を選択してください';return;}
 try{
  Records.save({...selected,comment,viewingMethod:$('cinelvaRatePlace').value,viewingVenue:$('cinelvaRateVenue').value.trim()},Number($('cinelvaRateScore').value),date);
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
 const grid=activeCard?.closest('#cards,#grid,#dates') || document.querySelector('#grid,#cards,#dates');
 if(!grid)return;
 const actions=[...grid.querySelectorAll('.cinelva-rate-button')].filter(button=>button.isConnected);
 if(!actions.length)return;
 const index=actions.indexOf(activeCard);
 actions[(index+1+actions.length)%actions.length].click();
}
$('cinelvaRateNext').onclick=nextMovie;
// Keep the actual existing calendar/ranking/search listings. A sibling rating
// action leaves the original movie detail link/button operational.
function enhanceGrid(grid,kind){
 if(!grid)return;
 const decorate=()=>{
  for(const card of [...grid.querySelectorAll(kind==='rankings'?'a.rankCard':'.card[data-i]')]){
   if(card.parentElement?.classList.contains('cinelva-rate-wrap'))continue;
   const wrap=document.createElement('div');wrap.className='cinelva-rate-wrap';
   card.parentElement.insertBefore(wrap,card);
   wrap.append(card);
   const rate=document.createElement('button');rate.type='button';rate.className='cinelva-rate-button';
   rate.textContent='👁';rate.setAttribute('aria-label','この作品をレビュー');
   rate.onclick=event=>{
    event.stopPropagation();event.preventDefault();
    activeCard=rate;
    let movie=null;
    if(kind==='rankings'){
     const u=new URL(card.href,location.href),id=u.searchParams.get('id');
     movie={id,title:u.searchParams.get('search')||card.querySelector('.title')?.textContent};
    }else movie=root.CinelvaRatingResolve?.(card.dataset.i,kind);
    if(!open(movie))rate.textContent='作品IDを確認できません';
   };
   wrap.append(rate);
   const movie=kind==='rankings'?(()=>{const u=new URL(card.href,location.href);return {id:u.searchParams.get('id'),title:u.searchParams.get('search')||card.querySelector('.title')?.textContent};})():root.CinelvaRatingResolve?.(card.dataset.i,kind);
   attachInlineScore(rate,movie);
  }
 };
 const observer=new MutationObserver(decorate);
 observer.observe(grid,{childList:true,subtree:false});
 decorate();
}
style.textContent+=`
.cinelva-inline-score{display:flex;align-items:center;gap:9px;margin:4px 8px 10px;padding:7px 10px;border:1px solid #ffffff20;border-radius:999px;background:#ffffff08;transition:background .2s,border-color .2s}.cinelva-inline-score input{width:100%;min-width:0;flex:1;height:26px;appearance:none;-webkit-appearance:none;background:transparent;cursor:pointer;touch-action:pan-y}.cinelva-inline-score input::-webkit-slider-runnable-track{height:5px;border-radius:99px;background:linear-gradient(90deg,#e7b944 var(--score-progress),#ffffff30 var(--score-progress))}.cinelva-inline-score input::-webkit-slider-thumb{-webkit-appearance:none;width:17px;height:17px;margin-top:-6px;border:2px solid #161616;border-radius:50%;background:#e7b944;box-shadow:0 0 0 2px #e7b94444}.cinelva-inline-score input::-moz-range-track{height:5px;border-radius:99px;background:#ffffff30}.cinelva-inline-score input::-moz-range-progress{height:5px;border-radius:99px;background:#e7b944}.cinelva-inline-score input::-moz-range-thumb{width:15px;height:15px;border:2px solid #161616;border-radius:50%;background:#e7b944}.cinelva-inline-value{min-width:2.7em;text-align:right;color:#b6b6b6;font:700 14px system-ui;font-variant-numeric:tabular-nums}.cinelva-inline-score.is-watched{border-color:#e7b94470;background:#e7b94418}.cinelva-inline-score.is-watched .cinelva-inline-value{color:#f3c84e}

.cinelva-rate-wrap{min-width:0;position:relative}
.cinelva-rate-wrap>.card,.cinelva-rate-wrap>.rankCard{display:block;width:100%;height:auto}
.cinelva-rate-wrap>.cinelva-rate-button{display:block;width:calc(100% - 12px);margin:4px 6px 9px}
`;
enhanceGrid(document.querySelector('#cards'),'calendar');
enhanceGrid(document.querySelector('#grid'),location.pathname.includes('rankings')?'rankings':'search');
// The real index calendar renders cards in #dates, not #cards. Do not add
// another listing page or alter the original calendar click-to-detail action.
function enhanceCalendar(grid){
 if(!grid)return;
 const decorate=()=>{
  for(const card of grid.querySelectorAll('.streamMovie[data-mi],.tvMovie[data-mi]')){
   if(card.querySelector('.cinelva-rate-button'))continue;
   const rate=document.createElement('button');rate.type='button';rate.className='cinelva-rate-button';
   rate.setAttribute('aria-label','この映画をレビュー');
   rate.onclick=event=>{
    event.stopPropagation();event.preventDefault();
    activeCard=rate;
    const movie=root.CinelvaRatingResolve?.(card.dataset.mi,'calendar');
    if(!open(movie))rate.textContent='作品IDを確認できません';
   };
   card.append(rate);
   attachInlineScore(rate,root.CinelvaRatingResolve?.(card.dataset.mi,'calendar'));
  }
  refreshRatingLabels();
 };
 const observer=new MutationObserver(decorate);
 observer.observe(grid,{childList:true,subtree:true});
 decorate();
}
function attachInlineScore(button, movie) {
 const id=movie?.tmdbId??movie?.tmdb_id??movie?.id;
 if(!validId(id))return;
 const existing=Records.all().find(r=>String(r.id)===String(id));
 const wrap=document.createElement('span');wrap.className='cinelva-inline-score';
 const input=document.createElement('input');input.type='range';input.min='0';input.max='5';input.step='0.1';
 input.value=Number(existing?.rating??0).toFixed(1);input.dataset.movieId=String(id);input.setAttribute('aria-label','一覧で点数をゲージで設定');
 input.onclick=e=>e.stopPropagation();
 input.onkeydown=e=>e.stopPropagation();
 const value=document.createElement('output');value.className='cinelva-inline-value';value.textContent=input.value;
 const sync=()=>{const score=Number(input.value);value.textContent=score.toFixed(1);wrap.classList.toggle('is-watched',score>0);button.classList.toggle('is-watched',score>0);input.style.setProperty('--score-progress',String(score/5*100)+'%');};
 input.oninput=sync;
 input.onchange=e=>{e.stopPropagation();const score=input.value.trim()===''?NaN:Number(input.value);if(!Number.isFinite(score)||score<0||score>5||Math.round(score*10)!==score*10){input.value=Number(existing?.rating??0).toFixed(1);sync();return;}
 try{const latest=Records.all().find(r=>String(r.id)===String(id));Records.save({...movie,id:String(id),title:movie.title||movie.name||latest?.title||'作品'},score,latest?.watchedAt??null);root.dispatchEvent(new CustomEvent('cinelva-record-updated',{detail:{id:String(id)}}));sync();}catch(error){input.setCustomValidity(error.message);input.reportValidity();}};
 wrap.append(input,value);button.after(wrap);sync();
}
function refreshRatingLabels(){
 const saved=Records.all();
 for(const input of document.querySelectorAll('.cinelva-inline-score input')){
  if(document.activeElement===input)continue;
  const id=input.dataset.movieId;
  if(id){const record=saved.find(r=>String(r.id)===id);input.value=Number(record?.rating??0).toFixed(1);input.dispatchEvent(new Event('input'));}
 }
 const byId=new Map();
 for(const record of saved){
  if(record.watched===false)continue;
  const id=record.tmdbId??record.id;
  if(validId(id))byId.set(String(id),record);
 }
 for(const button of document.querySelectorAll('.cinelva-rate-button')){
  const card=button.closest('a.rankCard,.card[data-i],.streamMovie[data-mi],.tvMovie[data-mi]')||
    button.parentElement?.querySelector('a.rankCard,.card[data-i]');
  let id=null;
  if(card?.matches('a.rankCard')) id=new URL(card.href,location.href).searchParams.get('id');
  else if(card?.dataset.mi!==undefined) id=root.CinelvaRatingResolve?.(card.dataset.mi,'calendar')?.id;
  else if(card?.dataset.i!==undefined) id=root.CinelvaRatingResolve?.(card.dataset.i,'listing')?.id;
  const record=id!=null?byId.get(String(id)):null;
  const label='👁';
  if(button.textContent!==label)button.textContent=label;
  button.setAttribute('aria-label',record?'この映画の評価を編集':'この映画をレビュー');
 }
}
enhanceCalendar(document.querySelector('#dates'));
root.addEventListener('cinelva-record-updated',refreshRatingLabels);
root.addEventListener('storage',refreshRatingLabels);
refreshRatingLabels();
root.CinelvaQuickRate={open,normalize};

})(window);
