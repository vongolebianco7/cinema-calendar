/* Lightweight, shared local-first quick rating for existing movie pages. */
(function(root) {
'use strict';
const Records=root.CinelvaLibraryRecords;
if(!Records)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=x=>String(x||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
const validId=x=>/^[1-9]\d*$/.test(String(x??''));
let selected=null,activeCard=null;
const reviewIcon='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.6"/></svg>';
const style=document.createElement('style');
style.textContent=`
.cinelva-rate-dialog{width:min(94vw,390px);max-height:85dvh;overflow:auto}.cinelva-rate-inner{padding:14px;gap:9px}.cinelva-review-header{display:flex;align-items:center;justify-content:space-between;gap:10px}.cinelva-review-header strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cinelva-review-header button{background:transparent;border:0;color:inherit;font-size:27px;width:36px;height:36px;cursor:pointer}.cinelva-review-score{display:flex;align-items:baseline;gap:5px;flex-wrap:wrap}.cinelva-review-score output{font-size:30px;font-weight:750}.cinelva-review-score input{flex-basis:100%}.cinelva-review-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cinelva-rate-inner label[hidden]{display:none}.cinelva-rate-inner textarea{min-height:52px}

.cinelva-rate-button{min-height:38px;border:1px solid #a78a50;border-radius:6px;background:#25211a;color:#f9e8c8;padding:7px 12px;margin:8px 0;font:600 13px system-ui;cursor:pointer}
.cinelva-rate-dialog{border:1px solid #7a715e;border-radius:12px;background:#202020;color:#f8f5ee;padding:0;width:min(94vw,470px);max-height:min(85dvh,680px);position:fixed;inset:auto 12px 12px auto;margin:0;z-index:10001;box-shadow:0 16px 60px #0009}
.cinelva-rate-dialog::backdrop{background:#0009}.cinelva-rate-inner{padding:20px;display:grid;gap:12px}.cinelva-rate-inner label{display:grid;gap:5px;font:13px system-ui}.cinelva-rate-inner input,.cinelva-rate-inner textarea,.cinelva-rate-inner select{width:100%;padding:10px;border:1px solid #68635a;background:#121212;color:#fff;border-radius:5px;box-sizing:border-box}
.cinelva-rate-inner textarea{min-height:78px;resize:vertical}.cinelva-rate-actions{display:flex;gap:10px;justify-content:space-between}.cinelva-rate-actions button{min-height:44px;flex:1;border-radius:6px;border:1px solid #a78a50;background:#f3e3c4;color:#211c15;font-weight:700}.cinelva-rate-actions button:first-child{background:#343434;color:#fff}.cinelva-rate-actions button{font-size:12px;padding:7px 4px}
`;
style.textContent+=`\n/* Compact overrides must follow the base dialog declarations. */\n.cinelva-rate-dialog{width:min(94vw,390px);max-height:85dvh;overflow:auto}\n.cinelva-rate-inner{padding:14px;gap:9px}\n.cinelva-rate-inner textarea{min-height:52px}\n`;
style.textContent+=`\n.cinelva-score-track{position:relative;display:flex;align-items:center;flex:1;min-width:0;height:32px}.cinelva-score-track::before{content:'';pointer-events:none;position:absolute;left:8px;right:8px;top:50%;transform:translateY(-50%);height:13px;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(10% - 1px),#ffffff65 calc(10% - 1px),#ffffff65 10%);opacity:.8}.cinelva-score-track input{position:relative;z-index:1}.cinelva-inline-score input::-webkit-slider-thumb{width:22px;height:22px;margin-top:-8.5px;border:3px solid #1b1b1b;box-shadow:0 0 0 2px #f1c95a,0 2px 8px #0009}.cinelva-inline-score input::-moz-range-thumb{width:20px;height:20px;border:3px solid #1b1b1b;box-shadow:0 0 0 2px #f1c95a,0 2px 8px #0009}\n`;style.textContent+=`\n.cinelva-rate-button{display:inline-grid;place-items:center;min-width:40px;width:40px;height:40px;padding:0;border-radius:50%;font-size:21px;background:#ffffff0d;color:#eae4d6;border-color:#ffffff38;transition:all .18s}.cinelva-rate-button:hover,.cinelva-rate-button:focus-visible{background:#e7b94420;border-color:#e7b944}.cinelva-rate-button.is-watched{color:#f3c84e;border-color:#e7b94488}.cinelva-rate-wrap>.cinelva-rate-button{display:inline-grid;width:40px;margin:6px 8px}.cinelva-rate-dialog{background:#161719;border:1px solid #ffffff24;border-radius:18px;box-shadow:0 20px 70px #000b}.cinelva-rate-inner input,.cinelva-rate-inner textarea,.cinelva-rate-inner select{border-radius:10px;background:#232427;border-color:#ffffff28}.cinelva-rate-actions button{border-radius:999px}.cinelva-review-score output{color:#f3c84e}.cinelva-review-header button{border-radius:50%}.cinelva-review-header button:hover{background:#ffffff16}\n`;document.head.append(style);
const dialog=document.createElement('dialog');dialog.className='cinelva-rate-dialog';
dialog.innerHTML=`<form class="cinelva-rate-inner" method="dialog"><div class="cinelva-review-header"><strong id="cinelvaRateTitle">レビュー</strong><button type="button" id="cinelvaRateX" aria-label="閉じる">×</button></div><div class="cinelva-review-score"><output id="cinelvaRateValue">0.0</output><span>/ 5.0</span><div class="cinelva-review-date"><label>鑑賞日<input aria-label="鑑賞日" id="cinelvaRateDate" type="date"></label></div><input aria-label="点数" id="cinelvaRateScore" type="range" min="0" max="5" step="0.1" value="0"></div><div class="cinelva-review-method"><label>▣ 鑑賞方法<select id="cinelvaRatePlace"><option value="">未指定</option><option value="映画館">映画館</option><option value="配信">配信</option><option value="TV">TV</option><option value="その他">その他</option></select></label><label id="cinelvaRateVenueRow" hidden>映画館・サービス<select id="cinelvaRateVenue"><option value="">選択してください</option></select></label></div><label>✎ レビュー<textarea id="cinelvaRateComment" maxlength="2000" rows="3"></textarea></label><p id="cinelvaRateMessage" role="status" style="margin:0;font-size:12px"></p><div class="cinelva-rate-actions"><button type="button" id="cinelvaRateClose">×</button><button type="button" id="cinelvaRateSave">✓ 保存</button></div></form>`;
document.body.append(dialog);
const $=id=>dialog.querySelector('#'+id);
$('cinelvaRateClose').onclick=()=>dialog.close();
$('cinelvaRateX').onclick=()=>dialog.close();
const venueOptions={
 '映画館':['通常上映','IMAX','Dolby Cinema','Dolby Atmos','4DX','MX4D','ScreenX','その他の上映方式'],
 '配信':['Netflix','Amazon Prime Video','Disney+','U-NEXT','Hulu','Apple TV+','Lemino','ABEMA','WOWOWオンデマンド','その他の配信'],
 'TV':['地上波','BS','CS','その他のTV'],
 'その他':['DVD・Blu-ray','機内上映','その他']
};
function updateVenueOptions(selectedVenue=''){
 const method=$('cinelvaRatePlace').value, row=$('cinelvaRateVenueRow'), venue=$('cinelvaRateVenue');
 row.hidden=!method;
 row.firstChild.textContent=method==='映画館'?'上映方式':method==='配信'?'配信サービス':method==='TV'?'放送種別':'鑑賞形式';
 venue.replaceChildren();
 const options=['',...(venueOptions[method]||[])];
 if(selectedVenue&&!options.includes(selectedVenue))options.push(selectedVenue);
 for(const item of options){const option=document.createElement('option');option.value=item;option.textContent=item||'選択してください';venue.append(option);}
 venue.value=selectedVenue||'';
}
$('cinelvaRatePlace').onchange=()=>updateVenueOptions();
function syncDialogScore(){
 const score=Number($('cinelvaRateScore').value);
 $('cinelvaRateValue').textContent=score.toFixed(1);
 $('cinelvaRateScore').style.setProperty('--dialog-progress',(score/5*100)+'%');
}
$('cinelvaRateScore').oninput=syncDialogScore;
function open(movie) {
 const id=movie?.tmdbId??movie?.tmdb_id??movie?.id;
 if(!validId(id)){return false;}
 const existing=Records.all().find(r=>String(r.tmdbId??r.id)===String(id));
 selected={...movie,...existing,id:String(existing?.id??id),tmdbId:id,title:existing?.title||movie.title||movie.name||'作品'};
 $('cinelvaRateTitle').textContent=selected.title;
 $('cinelvaRateScore').value=existing?.rating??0;
 syncDialogScore();
 $('cinelvaRatePlace').value=existing?.viewingMethod||'';
 updateVenueOptions(existing?.viewingVenue||'');
 $('cinelvaRateDate').value=/^\d{4}-\d{2}-\d{2}$/.test(existing?.watchedAt||'')?existing.watchedAt:new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
 $('cinelvaRateComment').value=existing?.comment||'';
 $('cinelvaRateMessage').textContent='';
 if(!dialog.open)dialog.showModal();
 return true;
}
function save() {
 if(!selected)return;
 const date=$('cinelvaRateDate').value.trim()||(selected.watchedAt && !/^\d{4}-\d{2}-\d{2}$/.test(selected.watchedAt)?selected.watchedAt:null),comment=$('cinelvaRateComment').value.trim();
 if(!Records.validDate(date)){$('cinelvaRateMessage').textContent='カレンダーから鑑賞日を選択してください';return;}
 try{
  Records.save({...selected,comment,viewingMethod:$('cinelvaRatePlace').value,viewingVenue:$('cinelvaRateVenue').value.trim()},Number($('cinelvaRateScore').value),date);
  root.dispatchEvent(new CustomEvent('cinelva-record-updated',{detail:{id:selected.id}}));
  dialog.close();
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
   rate.innerHTML=reviewIcon;rate.setAttribute('aria-label','この作品をレビュー');
   rate.onclick=event=>{
    event.stopPropagation();event.preventDefault();
    activeCard=rate;
    let movie=null;
    if(kind==='rankings'){
     const u=new URL(card.href,location.href),id=u.searchParams.get('id');
     movie={id,title:u.searchParams.get('search')||card.querySelector('.title')?.textContent};
    }else movie=root.CinelvaRatingResolve?.(card.dataset.i,kind);
    if(!open(movie))rate.setAttribute('aria-label','作品IDを確認できません');
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
.cinelva-rate-wrap>.cinelva-rate-button{display:inline-grid;place-items:center;width:40px;height:40px;margin:6px 8px;border-radius:50%}
`;
enhanceGrid(document.querySelector('#cards'),'calendar');
enhanceGrid(document.querySelector('#grid'),location.pathname.includes('rankings')?'rankings':'search');
// The real index calendar renders cards in #dates, not #cards. Do not add
// another listing page or alter the original calendar click-to-detail action.
function enhanceCalendar(grid){
 if(!grid)return;
 const decorate=(cards=grid.querySelectorAll('.streamMovie[data-mi],.tvMovie[data-mi]'))=>{
  for(const card of cards){
   if(card.querySelector('.cinelva-rate-button'))continue;
   const rate=document.createElement('button');rate.type='button';rate.className='cinelva-rate-button';
   rate.setAttribute('aria-label','この映画をレビュー');rate.innerHTML=reviewIcon;
   rate.onclick=event=>{
    event.stopPropagation();event.preventDefault();
    activeCard=rate;
    const movie=root.CinelvaRatingResolve?.(card.dataset.mi,'calendar');
    if(!open(movie))rate.setAttribute('aria-label','作品IDを確認できません');
   };
   card.append(rate);
   attachInlineScore(rate,root.CinelvaRatingResolve?.(card.dataset.mi,'calendar'));
  }
  refreshRatingLabels();
 };
 const observer=new MutationObserver(records=>{
  const cards=[];
  for(const record of records){
   for(const node of record.addedNodes){
    if(node.nodeType!==1)continue;
    if(node.matches?.('.streamMovie[data-mi],.tvMovie[data-mi]'))cards.push(node);
    node.querySelectorAll?.('.streamMovie[data-mi],.tvMovie[data-mi]').forEach(card=>cards.push(card));
   }
  }
  if(cards.length)decorate(cards);
 });
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
 const value=document.createElement('output');value.className='cinelva-inline-value';value.textContent=Number(input.value)>0?Number(input.value).toFixed(1):'未鑑賞';
 let committedScore=Number(existing?.rating??0);
 const sync=()=>{const score=Number(input.value),text=score>0?score.toFixed(1):'未鑑賞';if(value.textContent!==text)value.textContent=text;wrap.classList.toggle('is-watched',committedScore>0);button.classList.toggle('is-watched',committedScore>0);input.style.setProperty('--score-progress',String(score/5*100)+'%');track.style.setProperty('--score-progress',String(score/5*100)+'%');};
 input.oninput=sync;
 input.onchange=e=>{e.stopPropagation();const score=input.value.trim()===''?NaN:Number(input.value);if(!Number.isFinite(score)||score<0||score>5||Math.abs(Math.round(score*10)-score*10)>1e-7){input.value=Number(existing?.rating??0).toFixed(1);sync();return;}
 try{const latest=Records.all().find(r=>String(r.id)===String(id));Records.save({...movie,id:String(id),title:movie.title||movie.name||latest?.title||'作品'},score===0?null:score,latest?.watchedAt??null);committedScore=score;root.dispatchEvent(new CustomEvent('cinelva-record-updated',{detail:{id:String(id)}}));sync();}catch(error){input.setCustomValidity(error.message);input.reportValidity();}};
 const track=document.createElement('span');track.className='cinelva-score-track';track.append(input);wrap.append(track,value);
 // The visible track owns gestures. Native range drag on iOS is unreliable inside swipeable cards.
 let activePointer=null, activeTouch=null;
 const moveTo=x=>{
  const rect=track.getBoundingClientRect();
  if(rect.width<=0)return;
  const fraction=Math.max(0,Math.min(1,(x-rect.left)/rect.width));
  const score=Math.round(fraction*50)/10;
  // Update thumb, native input, and numeric label together on every gesture.
  track.style.setProperty('--smooth-progress',(fraction*100).toFixed(3)+'%');
  input.value=score.toFixed(1);
  value.textContent=score===0?'未鑑賞':score.toFixed(1);
  value.value=value.textContent;
 };
 const finish=()=>{activePointer=null;activeTouch=null;delete input.dataset.dragging;track.style.removeProperty('--smooth-progress');input.dispatchEvent(new Event('change'));};
 track.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch')return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();e.stopPropagation();activePointer=e.pointerId;input.dataset.dragging='true';
  track.setPointerCapture?.(e.pointerId);moveTo(e.clientX);
 });
 track.addEventListener('pointermove',e=>{if(activePointer!==e.pointerId)return;e.preventDefault();e.stopPropagation();moveTo(e.clientX);});
 track.addEventListener('pointerup',e=>{if(activePointer!==e.pointerId)return;e.preventDefault();e.stopPropagation();moveTo(e.clientX);finish();});
 track.addEventListener('pointercancel',()=>{activePointer=null;delete input.dataset.dragging;track.style.removeProperty('--smooth-progress');});
 track.addEventListener('touchstart',e=>{
  const touch=e.changedTouches[0];if(!touch)return;
  activeTouch=touch.identifier;input.dataset.dragging='true';moveTo(touch.clientX);e.stopPropagation();e.preventDefault();
 },{passive:false});
 track.addEventListener('touchmove',e=>{
  const touch=Array.from(e.changedTouches).find(t=>t.identifier===activeTouch);
  if(!touch)return;moveTo(touch.clientX);e.stopPropagation();e.preventDefault();
 },{passive:false});
 track.addEventListener('touchend',e=>{
  const touch=Array.from(e.changedTouches).find(t=>t.identifier===activeTouch);
  if(!touch)return;moveTo(touch.clientX);e.stopPropagation();e.preventDefault();finish();
 },{passive:false});
 track.addEventListener('touchcancel',()=>{activeTouch=null;delete input.dataset.dragging;track.style.removeProperty('--smooth-progress');});
 // Keep the live number following the finger even when iOS retargets touchmove
 // to the swipeable card or a parent outside the small rating track.
 const followTouch=e=>{
  if(activeTouch===null)return;
  const touch=Array.from(e.changedTouches).find(t=>t.identifier===activeTouch);
  if(!touch)return;
  moveTo(touch.clientX);
  e.preventDefault();
 };
 document.addEventListener('touchmove',followTouch,{capture:true,passive:false});
 document.addEventListener('touchend',e=>{
  if(activeTouch===null)return;
  const touch=Array.from(e.changedTouches).find(t=>t.identifier===activeTouch);
  if(touch){moveTo(touch.clientX);finish();}
 },{capture:true,passive:true});
 document.addEventListener('touchcancel',e=>{
  if(activeTouch!==null&&Array.from(e.changedTouches).some(t=>t.identifier===activeTouch)){
   activeTouch=null;delete input.dataset.dragging;track.style.removeProperty('--smooth-progress');
  }
 },{capture:true,passive:true});
 const controls=document.createElement('div');controls.className='cinelva-rating-controls';
 const clear=document.createElement('button');clear.type='button';clear.className='cinelva-rating-clear';clear.textContent='クリア';clear.setAttribute('aria-label','評価をクリア');
 clear.onclick=e=>{e.preventDefault();e.stopPropagation();input.value='0';input.dispatchEvent(new Event('input'));input.dispatchEvent(new Event('change'));};
 button.before(controls);controls.append(button,wrap,clear);
 // Bubble-phase isolation allows the slider's own touch handlers to run first.
 // Capture-phase stopPropagation on controls prevented track touch events entirely.
 for(const type of ['pointerdown','pointermove','pointerup','touchstart','touchmove','touchend','mousedown','mouseup','click','dblclick']){
  controls.addEventListener(type,event=>event.stopPropagation());
 }
 controls.addEventListener('keydown',event=>event.stopPropagation());
 sync();
}
function refreshRatingLabels(){
 const saved=Records.all();
 for(const input of document.querySelectorAll('.cinelva-inline-score input')){
  if(document.activeElement===input||input.dataset.dragging==='true')continue;
  const id=input.dataset.movieId;
  if(id){const record=saved.find(r=>String(r.id)===id);input.value=Number(record?.rating??0).toFixed(1);input.dispatchEvent(new Event('input'));input.closest('.cinelva-inline-score')?.classList.toggle('is-watched',Number(record?.rating??0)>0);}
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
  if(!button.querySelector('svg'))button.innerHTML=reviewIcon;
  button.setAttribute('aria-label',record?'この映画の評価を編集':'この映画をレビュー');
 }
}
enhanceCalendar(document.querySelector('#dates'));
root.addEventListener('cinelva-record-updated',refreshRatingLabels);
root.addEventListener('storage',refreshRatingLabels);
refreshRatingLabels();
style.textContent+=`
/* Minimal review icon and substantial, accessible rating tracks. */
.cinelva-rate-button{border:1px solid #ffffff26;background:transparent;color:#e6e7e9;box-shadow:none}
.cinelva-rate-button svg{display:block;width:19px;height:19px;pointer-events:none}
.cinelva-rate-button:hover,.cinelva-rate-button:focus-visible{background:#ffffff12;border-color:#ffffff70;color:#fff}
.cinelva-rate-button.is-watched{border-color:#e7b94477;color:#e7b944}
.cinelva-score-track{min-height:44px;height:44px}
.cinelva-score-track::before{display:none}
.cinelva-inline-score input{height:44px;min-height:44px}
.cinelva-inline-score input::-webkit-slider-runnable-track{height:12px;border-radius:999px;background:linear-gradient(90deg,#e7b944 var(--score-progress),#ffffff29 var(--score-progress))}
.cinelva-inline-score input::-webkit-slider-thumb{width:24px;height:24px;margin-top:-6px;border:3px solid #171819;box-shadow:0 0 0 1px #e7b94480}
.cinelva-inline-score input::-moz-range-track{height:12px;border-radius:999px;background:#ffffff29}
.cinelva-inline-score input::-moz-range-progress{height:12px;border-radius:999px;background:#e7b944}
.cinelva-inline-score input::-moz-range-thumb{width:22px;height:22px;border:3px solid #171819}
.cinelva-review-score input[type=range]{appearance:none;-webkit-appearance:none;height:44px;padding:0;background:transparent;border:0;cursor:pointer}
.cinelva-review-score input[type=range]::-webkit-slider-runnable-track{height:12px;border-radius:999px;background:#e7b944}
.cinelva-review-score input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;margin-top:-6px;border:3px solid #171819;border-radius:50%;background:#fff}
.cinelva-review-score input[type=range]::-moz-range-track{height:12px;border-radius:999px;background:#e7b944}
.cinelva-review-score input[type=range]::-moz-range-thumb{width:22px;height:22px;border:3px solid #171819;border-radius:50%;background:#fff}
`;
style.textContent+=`
/* Compact single-line card controls: icon and score share one row. */
.cinelva-rate-button,.cinelva-rate-wrap>.cinelva-rate-button{
 width:32px;min-width:32px;height:36px;min-height:36px;margin:2px 0 2px 4px;
 padding:0;border:0;border-radius:4px;background:transparent;color:#d6d6d6;
 box-shadow:none;vertical-align:middle;
}
.cinelva-rate-button svg{width:17px;height:17px}
.cinelva-rate-button:hover,.cinelva-rate-button:focus-visible{background:#ffffff12;border-color:transparent}
.cinelva-rate-button.is-watched{border-color:transparent;color:#e7b944}
.cinelva-inline-score{
 display:inline-flex;vertical-align:middle;width:calc(100% - 43px);max-width:220px;
 min-width:0;height:36px;min-height:36px;box-sizing:border-box;
 gap:5px;margin:2px 3px 2px 2px;padding:0 3px;
 border:0;border-radius:0;background:transparent;
}
.cinelva-inline-score.is-watched{border:0;background:transparent}
.cinelva-score-track{height:36px;min-height:36px;min-width:0}
.cinelva-inline-score input{height:36px;min-height:36px;touch-action:pan-y}
.cinelva-inline-score input::-webkit-slider-runnable-track{
 height:6px;border-radius:2px;
 background:linear-gradient(90deg,#e7b944 var(--score-progress),#ffffff40 var(--score-progress));
}
.cinelva-inline-score input::-webkit-slider-thumb{
 width:4px;height:19px;margin-top:-6.5px;border:0;border-radius:1px;
 background:#f2d178;box-shadow:0 0 0 1px #171819;
}
.cinelva-inline-score input::-moz-range-track{height:6px;border-radius:2px;background:#ffffff40}
.cinelva-inline-score input::-moz-range-progress{height:6px;border-radius:2px;background:#e7b944}
.cinelva-inline-score input::-moz-range-thumb{
 width:4px;height:19px;border:0;border-radius:1px;background:#f2d178;
}
.cinelva-inline-value{min-width:2.4em;font-size:12px;font-weight:600;color:#b9b9b9}
.cinelva-review-score input[type=range]::-webkit-slider-runnable-track{height:6px;border-radius:2px}
.cinelva-review-score input[type=range]::-webkit-slider-thumb{
 width:5px;height:22px;margin-top:-8px;border:0;border-radius:1px;background:#fff;
}
.cinelva-review-score input[type=range]::-moz-range-track{height:6px;border-radius:2px}
.cinelva-review-score input[type=range]::-moz-range-thumb{
 width:5px;height:22px;border:0;border-radius:1px;background:#fff;
}
`;
style.textContent+=`
/* Structural flex row: prevent card CSS from wrapping note and rating onto separate lines. */
.cinelva-rating-controls{display:flex!important;flex-direction:row!important;align-items:center!important;flex-wrap:nowrap!important;width:100%;max-width:100%;min-width:0;gap:3px;margin:2px 0 3px}
.cinelva-rating-controls>.cinelva-rate-button{flex:0 0 32px;display:grid!important;place-items:center;margin:0;padding:0}
.cinelva-rating-controls>.cinelva-inline-score{flex:1 1 auto;width:auto;max-width:none;min-width:0;margin:0;padding:0 2px}
.cinelva-rating-controls .cinelva-score-track{flex:1 1 auto;min-width:0}
.cinelva-rating-controls .cinelva-inline-value{flex:0 0 auto}
`;
style.textContent+=`
/* Neutral while sliding; yellow after releasing and successfully saving. */
.cinelva-inline-score:not(.is-watched) input::-webkit-slider-runnable-track{background:linear-gradient(90deg,#9da3ac var(--score-progress),#ffffff40 var(--score-progress))}
.cinelva-inline-score:not(.is-watched) input::-webkit-slider-thumb{background:#c7cbd1}
.cinelva-inline-score:not(.is-watched) input::-moz-range-progress{background:#9da3ac}
.cinelva-inline-score:not(.is-watched) input::-moz-range-thumb{background:#c7cbd1}
.cinelva-inline-value{min-width:3.6em;font-size:11px;white-space:nowrap}
.cinelva-inline-score:not(.is-watched) .cinelva-inline-value{color:#b9b9b9}
`;
style.textContent+=`
/* Subtle blue-charcoal rating surface: distinct from the movie card without a pill border. */
.cinelva-rating-controls{
 background:#292d35!important;border:0!important;border-radius:6px!important;
 padding:3px 7px!important;margin:4px 0 5px!important;
 box-sizing:border-box!important;box-shadow:none!important;
}
.cinelva-rating-controls>.cinelva-rate-button{color:#dce0e7}
.cinelva-rating-controls>.cinelva-inline-score{background:transparent!important;border:0!important}
.cinelva-rating-controls .cinelva-inline-value{color:#dce0e7}
.cinelva-rating-controls .cinelva-inline-score.is-watched .cinelva-inline-value{color:#f1c44e}
.cinelva-rating-controls .cinelva-rate-button.is-watched{color:#f1c44e}
`;
style.textContent+=`
/* Mobile fix: the native range must own measurable horizontal space. */
.cinelva-rating-controls{display:flex!important;align-items:center!important;gap:5px!important;padding:4px 7px!important}
.cinelva-rating-controls>.cinelva-rate-button{flex:0 0 25px!important;width:25px!important;min-width:25px!important;height:32px!important}
.cinelva-rating-controls>.cinelva-inline-score{
 display:flex!important;flex:1 1 0%!important;width:0!important;min-width:0!important;
 max-width:none!important;align-items:center!important;gap:5px!important;
}
.cinelva-rating-controls .cinelva-score-track{
 display:block!important;position:relative!important;flex:1 1 0%!important;
 width:100%!important;min-width:24px!important;height:36px!important;
}
.cinelva-rating-controls .cinelva-score-track input[type="range"]{
 display:block!important;position:relative!important;box-sizing:border-box!important;
 width:100%!important;min-width:24px!important;max-width:none!important;
 margin:0!important;padding:0!important;appearance:none!important;-webkit-appearance:none!important;
 height:36px!important;background:transparent!important;border:0!important;
}
.cinelva-rating-controls .cinelva-inline-value{
 display:block!important;flex:0 0 3.7em!important;min-width:3.7em!important;
 width:auto!important;white-space:nowrap!important;text-align:right!important;
 font-size:10px!important;
}
.cinelva-rating-controls .cinelva-score-track input[type="range"]::-webkit-slider-runnable-track{
 height:6px!important;border:0!important;border-radius:2px!important;
 background:linear-gradient(90deg,#e7b944 var(--score-progress),#ffffff40 var(--score-progress))!important;
}
.cinelva-rating-controls .cinelva-inline-score:not(.is-watched) input[type="range"]::-webkit-slider-runnable-track{
 background:linear-gradient(90deg,#9da3ac var(--score-progress),#ffffff40 var(--score-progress))!important;
}
.cinelva-rating-controls .cinelva-score-track input[type="range"]::-webkit-slider-thumb{
 -webkit-appearance:none!important;appearance:none!important;width:4px!important;height:19px!important;
 margin-top:-6.5px!important;border:0!important;border-radius:1px!important;background:#f2d178!important;
}
.cinelva-rating-controls .cinelva-inline-score:not(.is-watched) input[type="range"]::-webkit-slider-thumb{background:#c7cbd1!important}
`;
style.textContent+=`
/* Mobile 3-column cards: reserve width for a real horizontal rating track. */
.cinelva-rating-controls{width:100%!important;min-width:0!important;display:grid!important;grid-template-columns:20px minmax(0,1fr)!important;column-gap:5px!important;padding:5px!important;overflow:hidden!important}
.cinelva-rating-controls>.cinelva-rate-button{width:20px!important;min-width:20px!important;height:28px!important;min-height:28px!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
.cinelva-rating-controls>.cinelva-inline-score{width:100%!important;min-width:0!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:4px!important;padding:0!important;margin:0!important}
.cinelva-rating-controls .cinelva-score-track{width:100%!important;min-width:0!important;height:28px!important;display:flex!important;align-items:center!important}
.cinelva-rating-controls .cinelva-score-track::before{display:none!important}
.cinelva-rating-controls .cinelva-score-track input[type=range]{display:block!important;flex:1 1 auto!important;width:100%!important;min-width:0!important;height:28px!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important}
.cinelva-rating-controls .cinelva-inline-value{min-width:0!important;width:auto!important;flex:none!important;font-size:10px!important;letter-spacing:-.3px!important;text-align:right!important}
/* Dialog: isolate from global page form styles and fit a narrow phone viewport. */
dialog.cinelva-rate-dialog{box-sizing:border-box!important;position:fixed!important;left:50%!important;right:auto!important;top:50%!important;bottom:auto!important;transform:translate(-50%,-50%)!important;width:min(92vw,390px)!important;max-width:92vw!important;max-height:85dvh!important;margin:0!important;padding:0!important;overflow-x:hidden!important;overflow-y:auto!important;border-radius:12px!important}
.cinelva-rate-dialog .cinelva-rate-inner{box-sizing:border-box!important;width:100%!important;min-width:0!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:10px!important;padding:14px!important}
.cinelva-rate-dialog .cinelva-rate-inner *{box-sizing:border-box!important;min-width:0}
.cinelva-rate-dialog .cinelva-review-header{display:flex!important;align-items:center!important;justify-content:space-between!important}
.cinelva-rate-dialog .cinelva-review-score{display:grid!important;grid-template-columns:auto 1fr!important;align-items:center!important;gap:6px!important}
.cinelva-rate-dialog .cinelva-review-score input[type=range]{grid-column:1/-1!important;width:100%!important;min-width:0!important;display:block!important}
.cinelva-rate-dialog .cinelva-review-row{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
.cinelva-rate-dialog .cinelva-rate-inner input:not([type=range]),.cinelva-rate-dialog .cinelva-rate-inner select,.cinelva-rate-dialog .cinelva-rate-inner textarea{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important}
.cinelva-rate-dialog .cinelva-rate-actions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}
.cinelva-rate-dialog .cinelva-rate-actions button{width:100%!important;min-width:0!important;min-height:38px!important;margin:0!important;padding:6px 3px!important;font-size:12px!important}
@media(max-width:370px){.cinelva-rate-dialog .cinelva-review-row{grid-template-columns:minmax(0,1fr)!important}}
`;
style.textContent+=`
/* Two-row rating: full-width touch slider, eye + status above. */
.cinelva-rating-controls{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:22px 34px!important;gap:0!important;padding:5px 8px 4px!important;overflow:visible!important;touch-action:pan-y}
.cinelva-rating-controls>.cinelva-rate-button{grid-column:1!important;grid-row:1!important;justify-self:start!important;width:23px!important;height:22px!important;min-height:22px!important;min-width:23px!important;margin:0!important;z-index:1!important}
.cinelva-rating-controls>.cinelva-inline-score{grid-column:1!important;grid-row:1/3!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:22px 34px!important;width:100%!important;min-width:0!important;gap:0!important;padding:0!important;margin:0!important;pointer-events:none!important}
.cinelva-rating-controls .cinelva-inline-value{grid-column:1!important;grid-row:1!important;justify-self:end!important;align-self:center!important;width:auto!important;max-width:calc(100% - 27px)!important;min-width:0!important;font-size:11px!important;line-height:20px!important;pointer-events:none!important}
.cinelva-rating-controls .cinelva-score-track{grid-column:1!important;grid-row:2!important;display:block!important;width:100%!important;height:34px!important;min-height:34px!important;min-width:0!important;pointer-events:auto!important;touch-action:pan-y!important}
.cinelva-rating-controls .cinelva-score-track input[type=range]{display:block!important;position:relative!important;width:100%!important;min-width:0!important;height:34px!important;min-height:34px!important;max-width:none!important;box-sizing:border-box!important;pointer-events:auto!important;touch-action:pan-y!important;cursor:pointer!important;z-index:10!important;opacity:1!important;-webkit-appearance:none!important;appearance:none!important;background:transparent!important}
.cinelva-rating-controls .cinelva-score-track input[type=range]::-webkit-slider-runnable-track{height:6px!important;border-radius:2px!important}
.cinelva-rating-controls .cinelva-score-track input[type=range]::-webkit-slider-thumb{width:12px!important;height:22px!important;margin-top:-8px!important;border-radius:3px!important;box-shadow:none!important}
`;
style.textContent+=`
.cinelva-rating-controls .cinelva-score-track{touch-action:none!important;pointer-events:auto!important;cursor:pointer!important}
.cinelva-rating-controls .cinelva-score-track input[type=range]{pointer-events:none!important;touch-action:none!important}
.cinelva-rating-controls>.cinelva-inline-score{pointer-events:auto!important}
`;
style.textContent+=`
/* Restore native iOS range dragging; previous pointer interception disabled it. */
.cinelva-rating-controls .cinelva-score-track{pointer-events:auto!important;touch-action:pan-y!important}
.cinelva-rating-controls .cinelva-score-track input[type=range]{
 pointer-events:auto!important;touch-action:pan-y!important;
 width:100%!important;height:44px!important;min-height:44px!important;
 position:relative!important;z-index:20!important;cursor:pointer!important;
}
.cinelva-rating-controls .cinelva-score-track{height:44px!important;min-height:44px!important}
.cinelva-rating-controls{grid-template-rows:28px 44px!important;padding:4px 7px!important}
.cinelva-rating-controls>.cinelva-rate-button{height:28px!important;min-height:28px!important;align-self:center!important;justify-self:start!important}
.cinelva-rating-controls>.cinelva-inline-score{grid-template-rows:28px 44px!important}
.cinelva-rating-controls .cinelva-inline-value{align-self:center!important;line-height:28px!important}
.cinelva-rating-controls .cinelva-score-track input[type=range]::-webkit-slider-thumb{
 -webkit-appearance:none!important;width:20px!important;height:26px!important;
 margin-top:-10px!important;border-radius:5px!important;
}
`;
style.textContent+=`
/* Wide, responsive native slider and unobtrusive explicit clear action. */
.cinelva-rating-controls{position:relative!important;grid-template-rows:28px 44px!important;min-height:78px!important}
.cinelva-rating-controls>.cinelva-inline-score{grid-template-rows:28px 44px!important}
.cinelva-rating-controls .cinelva-score-track{height:44px!important;min-height:44px!important}
.cinelva-rating-controls .cinelva-score-track input[type=range]{pointer-events:auto!important;touch-action:pan-y!important;height:44px!important;min-height:44px!important;z-index:30!important}
.cinelva-rating-controls .cinelva-score-track input[type=range]::-webkit-slider-thumb{-webkit-appearance:none!important;width:24px!important;height:26px!important;margin-top:-10px!important;border-radius:6px!important}
.cinelva-rating-controls>.cinelva-rating-clear{position:absolute!important;right:7px!important;top:5px!important;z-index:5!important;background:transparent!important;border:0!important;padding:0 2px!important;margin:0!important;min-height:24px!important;font:500 10px system-ui!important;color:#9da3ac!important;cursor:pointer!important}
.cinelva-rating-controls .cinelva-inline-value{margin-right:34px!important}
.cinelva-rating-controls .cinelva-rating-clear:focus-visible{outline:2px solid #e7c477!important}
`;
style.textContent+=`
/* Compact two-line quick rating; slim vertical handle and responsive direct-touch track. */
.cinelva-rating-controls{grid-template-rows:22px 26px!important;min-height:0!important;height:56px!important;padding:3px 6px 4px!important;gap:0!important}
.cinelva-rating-controls>.cinelva-inline-score{grid-template-rows:22px 26px!important}
.cinelva-rating-controls>.cinelva-rate-button{height:22px!important;min-height:22px!important;align-self:center!important}
.cinelva-rating-controls .cinelva-inline-value{line-height:22px!important;align-self:center!important}
.cinelva-rating-controls .cinelva-score-track{height:26px!important;min-height:26px!important;touch-action:none!important;pointer-events:auto!important;cursor:pointer!important}
.cinelva-rating-controls .cinelva-score-track input[type=range]{height:26px!important;min-height:26px!important;pointer-events:none!important;touch-action:none!important}
.cinelva-rating-controls .cinelva-score-track input[type=range]::-webkit-slider-runnable-track{height:5px!important;border-radius:3px!important}
.cinelva-rating-controls .cinelva-score-track input[type=range]::-webkit-slider-thumb{-webkit-appearance:none!important;width:4px!important;height:19px!important;margin-top:-7px!important;border-radius:2px!important;box-shadow:none!important}
.cinelva-rating-controls>.cinelva-rating-clear{top:2px!important;min-height:22px!important}
`;
style.textContent+=`
/* Render a continuous thumb position independently of 0.1-point rounding. */
.cinelva-rating-controls .cinelva-score-track{position:relative!important;--smooth-progress:var(--score-progress,0%)}
.cinelva-rating-controls .cinelva-score-track::after{
 content:""!important;display:block!important;position:absolute!important;
 left:clamp(2px,var(--smooth-progress,0%),calc(100% - 2px))!important;
 top:50%!important;transform:translate(-50%,-50%)!important;
 width:3px!important;height:19px!important;border-radius:2px!important;
 background:#f0c86c!important;pointer-events:none!important;z-index:40!important;
}
.cinelva-rating-controls .cinelva-score-track input[type=range]::-webkit-slider-thumb{opacity:0!important;background:transparent!important;box-shadow:none!important}
`;
style.textContent+=`
/* Make the live score visible during drag regardless of watched/saved state. */
.cinelva-rating-controls .cinelva-inline-value{
 display:block!important;visibility:visible!important;opacity:1!important;
 position:relative!important;z-index:45!important;pointer-events:none!important;
 font-variant-numeric:tabular-nums!important;
}
`;
style.textContent+=`
/* Live fill follows the same continuous finger position as the thumb. */
.cinelva-rating-controls .cinelva-score-track::before{
 content:""!important;display:block!important;position:absolute!important;
 left:0!important;right:0!important;top:50%!important;
 height:5px!important;transform:translateY(-50%)!important;
 border-radius:3px!important;pointer-events:none!important;z-index:35!important;
 background:linear-gradient(to right,#e7b944 0%,#e7b944 var(--smooth-progress,var(--score-progress,0%)),#ffffff40 var(--smooth-progress,var(--score-progress,0%)),#ffffff40 100%)!important;
}
.cinelva-rating-controls .cinelva-score-track input[type=range]::-webkit-slider-runnable-track{
 background:transparent!important;
}
`;
style.textContent+=`
/* Review form: readable iPhone layout, no date/select overlap. */
.cinelva-rate-dialog .cinelva-review-row{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important}
.cinelva-rate-dialog .cinelva-review-row label{display:flex!important;flex-direction:column!important;gap:7px!important;min-width:0!important;width:100%!important}
.cinelva-rate-dialog .cinelva-review-row input,
.cinelva-rate-dialog .cinelva-review-row select{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important;margin:0!important;height:44px!important;font-size:16px!important}
.cinelva-rate-dialog .cinelva-rate-actions{display:grid!important;grid-template-columns:1fr 2fr!important;gap:10px!important}
.cinelva-rate-dialog .cinelva-rate-actions button{min-height:44px!important}
`;
style.textContent+=`
/* Compact date; dependent method + venue selectors in one row. */
.cinelva-rate-dialog .cinelva-review-date{max-width:190px!important;min-width:0!important}
.cinelva-rate-dialog .cinelva-review-date label{min-width:0!important}
.cinelva-rate-dialog .cinelva-review-date input[type=date]{width:100%!important;max-width:190px!important;min-width:0!important;height:38px!important;padding:5px 8px!important;font-size:14px!important;box-sizing:border-box!important}
.cinelva-rate-dialog .cinelva-review-method{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;align-items:end!important}
.cinelva-rate-dialog .cinelva-review-method label{display:flex!important;flex-direction:column!important;gap:6px!important;min-width:0!important}
.cinelva-rate-dialog .cinelva-review-method label[hidden]{display:none!important}
.cinelva-rate-dialog .cinelva-review-method select{width:100%!important;min-width:0!important;max-width:100%!important;height:42px!important;box-sizing:border-box!important;font-size:14px!important;padding:7px 24px 7px 8px!important}
.cinelva-rate-dialog #cinelvaRateComment{display:block!important;min-height:94px!important;height:94px!important;line-height:1.5!important;resize:vertical!important}
`;
style.textContent+=`
/* iPhone: keep the date picker compact, with no oversized inherited input width. */
.cinelva-rate-dialog .cinelva-review-date{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important}
.cinelva-rate-dialog .cinelva-review-date label{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-width:0!important}
.cinelva-rate-dialog .cinelva-review-date input[type=date]{
 display:block!important;flex:0 0 148px!important;width:148px!important;max-width:148px!important;
 min-width:0!important;height:36px!important;min-height:36px!important;
 padding:4px 7px!important;margin:0!important;box-sizing:border-box!important;
 font-size:14px!important;line-height:24px!important;color-scheme:dark!important;
}
/* Only the portion to the LEFT of the slider thumb is yellow. */
.cinelva-rate-dialog .cinelva-review-score input[type=range]::-webkit-slider-runnable-track{
 background:linear-gradient(to right,#e7b944 0%,#e7b944 var(--dialog-progress,0%),#777b83 var(--dialog-progress,0%),#777b83 100%)!important;
}
.cinelva-rate-dialog .cinelva-review-score input[type=range]::-moz-range-track{background:#777b83!important}
.cinelva-rate-dialog .cinelva-review-score input[type=range]::-moz-range-progress{background:#e7b944!important}
`;
style.textContent+=`
/* iOS Safari zooms focused textareas when the computed font size is under 16px. */
.cinelva-rate-dialog #cinelvaRateComment{
 font-size:16px!important;
 line-height:1.5!important;
 -webkit-text-size-adjust:100%;
}
`;
style.textContent+=`
/* Review textarea stays three lines tall and scrolls internally for long reviews. */
.cinelva-rate-dialog #cinelvaRateComment{
 height:96px!important;min-height:96px!important;max-height:96px!important;
 overflow-y:auto!important;overscroll-behavior:contain!important;resize:none!important;
 -webkit-overflow-scrolling:touch;font-size:16px!important;
}
/* A real modal dialog blocks interaction and scrolling behind it. */
.cinelva-rate-dialog[open]{
 position:fixed!important;inset:0!important;margin:auto!important;
 width:min(94vw,390px)!important;max-height:min(85dvh,700px)!important;
 overflow-y:auto!important;overscroll-behavior:contain!important;
}
.cinelva-rate-dialog::backdrop{background:rgba(0,0,0,.65)!important}
`;
style.textContent+=`
/* Inline movie-card rating: lower the score/unwatched label below the action icons. */
.cinelva-rating-controls .cinelva-inline-value{
 position:relative!important;
 top:7px!important;
}
`;
style.textContent+=`
/* Make the clear action visually identifiable without changing its hit target. */
.cinelva-rating-controls>.cinelva-rating-clear{
 border:1px solid #aeb5c07a!important;
 border-radius:5px!important;
 background:#ffffff0d!important;
 padding:2px 6px!important;
 line-height:16px!important;
 color:#dce0e7!important;
}
/* Label the slider directly above its track, not over the clear/eye actions. */
.cinelva-rating-controls .cinelva-score-track::after{
 content:""!important;
}
.cinelva-rating-controls .cinelva-score-track::before{
 /* Keep the existing live yellow fill intact. */
}
.cinelva-rating-controls .cinelva-inline-score{position:relative!important}
.cinelva-rating-controls .cinelva-inline-score::before{
 content:"スコア"!important;
 position:absolute!important;
 left:3px!important;top:-14px!important;
 font:500 10px/12px system-ui!important;
 letter-spacing:.02em!important;
 color:#c3c8d0!important;
 pointer-events:none!important;
}
`;
style.textContent+=`
/* Center the native modal: override older translate(-50%,-50%) positioning. */
dialog.cinelva-rate-dialog[open]{
 position:fixed!important;
 inset:0!important;
 top:0!important;right:0!important;bottom:0!important;left:0!important;
 margin:auto!important;
 transform:none!important;
 width:min(94vw,390px)!important;
 max-width:94vw!important;
 max-height:85dvh!important;
}
`;
style.textContent+=`
/* Two-row card rating: eye | score + value | clear; slider below. */
.cinelva-rating-controls{
 box-sizing:border-box!important;
 display:grid!important;
 grid-template-columns:minmax(0,1fr)!important;
 grid-template-rows:25px 26px!important;
 height:56px!important;min-height:56px!important;
 padding:2px 6px 3px!important;
 overflow:hidden!important;
 position:relative!important;
}
.cinelva-rating-controls>.cinelva-inline-score{
 grid-column:1!important;grid-row:1/3!important;
 display:grid!important;grid-template-columns:minmax(0,1fr)!important;
 grid-template-rows:25px 26px!important;
 min-width:0!important;width:100%!important;
 position:relative!important;pointer-events:none!important;
}
.cinelva-rating-controls>.cinelva-inline-score::before{content:none!important;display:none!important}
.cinelva-rating-controls .cinelva-inline-value{
 grid-column:1!important;grid-row:1!important;
 justify-self:center!important;align-self:center!important;
 position:static!important;top:auto!important;
 margin:0!important;padding:0!important;
 width:auto!important;max-width:calc(100% - 112px)!important;
 min-width:0!important;line-height:20px!important;
 text-align:center!important;white-space:nowrap!important;
 font-size:11px!important;letter-spacing:0!important;
}
.cinelva-rating-controls .cinelva-inline-value::before{
 content:"スコア "!important;color:#c3c8d0!important;font-weight:500!important;
}
.cinelva-rating-controls>.cinelva-rate-button{
 grid-column:1!important;grid-row:1!important;
 justify-self:start!important;align-self:center!important;
 position:relative!important;z-index:6!important;
 margin:0!important;
}
.cinelva-rating-controls>.cinelva-rating-clear{
 position:absolute!important;top:3px!important;right:5px!important;
 box-sizing:border-box!important;z-index:7!important;
 height:23px!important;min-height:23px!important;
 max-width:64px!important;margin:0!important;
 padding:2px 6px!important;line-height:16px!important;
 border:1px solid #aeb5c07a!important;border-radius:5px!important;
 background:#ffffff0d!important;
}
.cinelva-rating-controls .cinelva-score-track{
 grid-column:1!important;grid-row:2!important;
 min-width:0!important;width:100%!important;
}
`;
style.textContent+=`
/* Compact review header: rating and date on one row, slider directly below. */
.cinelva-rate-dialog .cinelva-review-score{
 display:grid!important;
 grid-template-columns:auto auto minmax(0,1fr)!important;
 grid-template-rows:42px 30px!important;
 column-gap:5px!important;row-gap:5px!important;
 align-items:center!important;
}
.cinelva-rate-dialog .cinelva-review-score output{
 grid-column:1!important;grid-row:1!important;
 font-size:28px!important;line-height:1!important;
}
.cinelva-rate-dialog .cinelva-review-score>span{
 grid-column:2!important;grid-row:1!important;
 font-size:13px!important;white-space:nowrap!important;
}
.cinelva-rate-dialog .cinelva-review-score .cinelva-review-date{
 grid-column:3!important;grid-row:1!important;
 min-width:0!important;width:auto!important;
 max-width:none!important;justify-self:end!important;
}
.cinelva-rate-dialog .cinelva-review-score .cinelva-review-date label{
 display:flex!important;flex-direction:row!important;
 align-items:center!important;justify-content:flex-end!important;
 gap:5px!important;white-space:nowrap!important;
 font-size:11px!important;
}
.cinelva-rate-dialog .cinelva-review-score .cinelva-review-date input[type=date]{
 flex:0 1 116px!important;width:116px!important;max-width:116px!important;
 min-width:0!important;height:34px!important;min-height:34px!important;
 padding:3px 4px!important;font-size:12px!important;
}
.cinelva-rate-dialog .cinelva-review-score input[type=range]{
 grid-column:1/-1!important;grid-row:2!important;
 margin:0!important;height:30px!important;min-height:30px!important;
}
@media(max-width:370px){
 .cinelva-rate-dialog .cinelva-review-score .cinelva-review-date label{font-size:10px!important}
 .cinelva-rate-dialog .cinelva-review-score .cinelva-review-date input[type=date]{width:108px!important;max-width:108px!important}
}
`;
style.textContent+=`
/* Stable three-row card layout: controls, score, slider. No overlapping text. */
.cinelva-rating-controls{
 display:grid!important;grid-template-columns:minmax(0,1fr)!important;
 grid-template-rows:24px 17px 25px!important;
 box-sizing:border-box!important;
 height:70px!important;min-height:70px!important;
 padding:2px 7px!important;gap:0!important;
 overflow:hidden!important;position:relative!important;
}
.cinelva-rating-controls>.cinelva-inline-score{
 display:grid!important;grid-template-columns:minmax(0,1fr)!important;
 grid-template-rows:24px 17px 25px!important;
 grid-column:1!important;grid-row:1/4!important;
 width:100%!important;min-width:0!important;
 margin:0!important;padding:0!important;
 pointer-events:none!important;
}
.cinelva-rating-controls>.cinelva-inline-score::before{content:none!important;display:none!important}
.cinelva-rating-controls>.cinelva-rate-button{
 grid-column:1!important;grid-row:1!important;
 justify-self:start!important;align-self:center!important;
 z-index:7!important;margin:0!important;
}
.cinelva-rating-controls>.cinelva-rating-clear{
 position:absolute!important;right:6px!important;top:3px!important;
 max-width:calc(100% - 45px)!important;
 min-height:22px!important;height:22px!important;
 padding:1px 6px!important;line-height:18px!important;
 box-sizing:border-box!important;z-index:7!important;
 border:1px solid #aeb5c07a!important;border-radius:5px!important;
}
.cinelva-rating-controls .cinelva-inline-value{
 grid-column:1!important;grid-row:2!important;
 justify-self:center!important;align-self:center!important;
 position:static!important;top:auto!important;
 margin:0!important;padding:0!important;
 max-width:100%!important;width:auto!important;
 font:600 11px/16px system-ui!important;
 white-space:nowrap!important;text-align:center!important;
}
.cinelva-rating-controls .cinelva-inline-value::before{
 content:"スコア  "!important;font-weight:400!important;color:#c3c8d0!important;
}
.cinelva-rating-controls .cinelva-score-track{
 grid-column:1!important;grid-row:3!important;
 width:100%!important;min-width:0!important;
 height:25px!important;min-height:25px!important;
 align-self:center!important;
}
.cinelva-rating-controls .cinelva-score-track input[type=range]{
 height:25px!important;min-height:25px!important;
}
`;
root.CinelvaQuickRate={open,normalize};

})(window);
