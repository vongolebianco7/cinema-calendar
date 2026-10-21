/* Lightweight, shared local-first quick rating for existing movie pages. */
(function(root) {
'use strict';
const Records=root.CinelvaLibraryRecords;
if(!Records)return;
let recordCache=null,lastRecordData=null,lastLegacyData=null,lastDeletedData=null;
const allRecords=()=>{let data,legacy,deleted;try{data=localStorage.getItem(Records.KEY);legacy=localStorage.getItem(Records.LEGACY);deleted=localStorage.getItem(Records.DELETED)}catch{}if(!recordCache||data!==lastRecordData||legacy!==lastLegacyData||deleted!==lastDeletedData){recordCache=Records.all();lastRecordData=data;lastLegacyData=legacy;lastDeletedData=deleted}return recordCache};
root.addEventListener('cinelva-record-updated',()=>{recordCache=null});
root.addEventListener('storage',()=>{recordCache=null});

const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=x=>String(x||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
const validId=x=>/^[1-9]\d*$/.test(String(x??''));
const canonicalId=movie=>root.CinelvaMovieIdentity?.id(movie)||movie?.tmdbId||movie?.tmdb_id||movie?.id;
let selected=null,activeCard=null;
// Fill missing community scores only when a card becomes visible. Strict title matching
// avoids attributing an unrelated film's TMDB rating to a release.
const tmdbCache=new Map();let tmdbActive=0;const tmdbQueue=[];
const normalizedTitle=x=>String(x||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
let backendBasePromise=null;
function ratingBackend(){
 return backendBasePromise??=(fetch(new URL('../data/backend.json',document.querySelector('script[src*="cinelva-quick-rate.js"]')?.src||location.href)).then(r=>r.ok?r.json():null).then(c=>c?.enabled&&String(c.base_url||'').startsWith('https://')?c.base_url.replace(/\/$/,''):null).catch(()=>null));
}
function resolveCommunityRating(movie,done){
 const title=movie?.title||movie?.name;
 if(!title||movie._localRecord)return;
 const titleKey=normalizedTitle(title),wanted=Number(root.CinelvaMovieIdentity?.id(movie)||movie.tmdbId||movie.tmdb_id||movie.id||0),releaseYear=Number(movie.year||String(movie.release_date||'').slice(0,4));const key=String(wanted)+'|'+titleKey+'|'+releaseYear;if(!titleKey||(!wanted&&!releaseYear))return;
 if(tmdbCache.has(key)){tmdbCache.get(key).then(done);return;}
 const task=new Promise(resolve=>{tmdbQueue.push(async()=>{
  try{
   const base=await ratingBackend();if(!base)return resolve(null);
   const response=await fetch(base+'/api/movies?q='+encodeURIComponent(title)+'&limit=8');
   if(!response.ok)return resolve(null);
   const data=await response.json(),candidates=[...(data.movies||[]),...(data.external||[])];
   const matches=candidates.filter(x=>wanted?Number(x.tmdbId||x.tmdb_id||x.id)===wanted:Number(x.year||String(x.release_date||'').slice(0,4))===releaseYear&&[x.title,x.original_title].some(t=>normalizedTitle(t)===titleKey));const unique=new Set(matches.map(x=>String(x.tmdbId||x.tmdb_id||x.id)));const match=unique.size===1?matches[0]:null;
   const score=Number(match?.vote_average??match?.score);
   resolve(Number.isFinite(score)&&score>0?score:null);
  }catch{resolve(null);}
 });pumpTmdb();});
 tmdbCache.set(key,task);task.then(done);
}
function pumpTmdb(){while(tmdbActive<2&&tmdbQueue.length){tmdbActive++;tmdbQueue.shift()().finally(()=>{tmdbActive--;pumpTmdb()});}}
const reviewIcon='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.6"/></svg>';
const style=document.createElement('style');
style.textContent=`\n.cinelva-rating-pair{display:flex;flex:1 1 auto;flex-wrap:wrap;gap:3px 9px;min-width:0;font-size:10px;line-height:1.4;color:#c9cbd0}.cinelva-rating-pair span{white-space:nowrap}.cinelva-rating-controls-no-gauge{justify-content:flex-end!important;gap:8px!important}.cinelva-rating-controls-no-gauge>.cinelva-rate-button{margin:0!important}\n
.cinelva-rate-dialog{width:min(94vw,390px);max-height:85dvh;overflow:auto}.cinelva-rate-inner{padding:14px;gap:9px}.cinelva-review-header{display:flex;align-items:center;justify-content:space-between;gap:10px}.cinelva-review-header strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cinelva-review-header button{background:transparent;border:0;color:inherit;font-size:27px;width:36px;height:36px;cursor:pointer}.cinelva-review-score{display:flex;align-items:baseline;gap:5px;flex-wrap:wrap}.cinelva-review-score output{font-size:30px;font-weight:750}.cinelva-review-score input{flex-basis:100%}.cinelva-review-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cinelva-rate-inner label[hidden]{display:none}.cinelva-rate-inner textarea{min-height:52px}

.cinelva-rate-button{min-height:38px;border:1px solid #a78a50;border-radius:6px;background:#25211a;color:#f9e8c8;padding:7px 12px;margin:8px 0;font:600 13px system-ui;cursor:pointer}
.cinelva-rate-dialog{border:1px solid #7a715e;border-radius:12px;background:#202020;color:#f8f5ee;padding:0;width:min(94vw,470px);max-height:min(85dvh,680px);position:fixed;inset:auto 12px 12px auto;margin:0;z-index:10001;box-shadow:0 16px 60px #0009}
.cinelva-rate-dialog::backdrop{background:#0009}.cinelva-rate-inner{padding:20px;display:grid;gap:12px}.cinelva-rate-inner label{display:grid;gap:5px;font:13px system-ui}.cinelva-rate-inner input,.cinelva-rate-inner textarea,.cinelva-rate-inner select{width:100%;padding:10px;border:1px solid #68635a;background:#121212;color:#fff;border-radius:5px;box-sizing:border-box}
.cinelva-rate-inner textarea{min-height:78px;resize:vertical}.cinelva-rate-actions{display:flex;gap:10px;justify-content:space-between}.cinelva-rate-actions button{min-height:44px;flex:1;border-radius:6px;border:1px solid #a78a50;background:#f3e3c4;color:#211c15;font-weight:700}.cinelva-rate-actions button:first-child{background:#343434;color:#fff}.cinelva-rate-actions button{font-size:12px;padding:7px 4px}
`;
style.textContent+=`\n/* Compact overrides must follow the base dialog declarations. */\n.cinelva-rate-dialog{width:min(94vw,390px);max-height:85dvh;overflow:auto}\n.cinelva-rate-inner{padding:14px;gap:9px}\n.cinelva-rate-inner textarea{min-height:52px}\n`;
style.textContent+=`\n.cinelva-inline-score.is-editing{border-color:#e7b944!important;box-shadow:0 0 0 1px #e7b94455}.cinelva-inline-score.is-editing .cinelva-score-track{touch-action:none}\n.cinelva-score-track{position:relative;display:flex;align-items:center;flex:1;min-width:0;height:32px}.cinelva-score-track::before{content:'';pointer-events:none;position:absolute;left:8px;right:8px;top:50%;transform:translateY(-50%);height:13px;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(10% - 1px),#ffffff65 calc(10% - 1px),#ffffff65 10%);opacity:.8}.cinelva-score-track input{position:relative;z-index:1}.cinelva-inline-score input::-webkit-slider-thumb{width:22px;height:22px;margin-top:-8.5px;border:3px solid #1b1b1b;box-shadow:0 0 0 2px #f1c95a,0 2px 8px #0009}.cinelva-inline-score input::-moz-range-thumb{width:20px;height:20px;border:3px solid #1b1b1b;box-shadow:0 0 0 2px #f1c95a,0 2px 8px #0009}\n`;style.textContent+=`\n.cinelva-rate-button{display:inline-grid;place-items:center;min-width:40px;width:40px;height:40px;padding:0;border-radius:50%;font-size:21px;background:#ffffff0d;color:#eae4d6;border-color:#ffffff38;transition:all .18s}.cinelva-rate-button:hover,.cinelva-rate-button:focus-visible{background:#e7b94420;border-color:#e7b944}.cinelva-rate-button.is-watched{color:#f3c84e;border-color:#e7b94488}.cinelva-rate-wrap>.cinelva-rate-button{display:inline-grid;width:40px;margin:6px 8px}.cinelva-rate-dialog{background:#161719;border:1px solid #ffffff24;border-radius:18px;box-shadow:0 20px 70px #000b}.cinelva-rate-inner input,.cinelva-rate-inner textarea,.cinelva-rate-inner select{border-radius:10px;background:#232427;border-color:#ffffff28}.cinelva-rate-actions button{border-radius:999px}.cinelva-review-score output{color:#f3c84e}.cinelva-review-header button{border-radius:50%}.cinelva-review-header button:hover{background:#ffffff16}\n`;
style.textContent+="\n/* Shared review dialog: larger slider hit target without enlarging the visible rail. */\n.cinelva-rate-dialog .cinelva-review-score{align-items:center}\n.cinelva-rate-dialog #cinelvaRateScore{height:48px;min-height:48px;box-sizing:border-box;padding:0;margin:0;cursor:pointer;touch-action:pan-x;accent-color:#e4bd70;background:transparent;border:0;appearance:none;-webkit-appearance:none}\n.cinelva-rate-dialog #cinelvaRateScore::-webkit-slider-runnable-track{height:6px;border-radius:999px;background:#85878e}\n.cinelva-rate-dialog #cinelvaRateScore::-moz-range-track{height:6px;border-radius:999px;background:#85878e}\n.cinelva-rate-dialog #cinelvaRateScore::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;margin-top:-8px;background:#fff;border:2px solid #e4bd70;border-radius:6px}\n.cinelva-rate-dialog #cinelvaRateScore::-moz-range-thumb{width:22px;height:22px;background:#fff;border:2px solid #e4bd70;border-radius:6px}\n.cinelva-rate-dialog #cinelvaRateX{display:grid!important;place-items:center!important;flex:0 0 44px;width:44px!important;height:44px!important;line-height:1!important;padding:0!important;margin:0!important;border-radius:50%!important;box-sizing:border-box;text-align:center}\n.cinelva-rate-dialog .cinelva-spoiler-toggle{display:flex;align-items:center;gap:10px;width:max-content;cursor:pointer}\n.cinelva-rate-dialog .cinelva-spoiler-toggle input{width:20px;height:20px;min-width:20px;margin:0;accent-color:#e4bd70}\n.cinelva-rate-dialog .cinelva-spoiler-toggle span{font-size:13px}\n";
style.textContent+="\n/* One-line spoiler warning; red is reserved for a meaningful spoiler state. */\n.cinelva-rate-dialog .cinelva-spoiler-toggle{display:inline-flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;white-space:nowrap!important;max-width:100%;width:max-content!important;padding:7px 10px;border:1px solid #a44747;border-radius:9px;background:#431b1b4d;color:#ffb8b8;cursor:pointer}\n.cinelva-rate-dialog .cinelva-spoiler-toggle input{flex:0 0 18px!important;width:18px!important;height:18px!important;min-width:18px!important;padding:0!important;margin:0!important;accent-color:#d94b4b!important}\n.cinelva-rate-dialog .cinelva-spoiler-toggle .cinelva-spoiler-alert{display:inline-grid;place-items:center;flex:0 0 18px;width:18px;height:18px;border:1.5px solid #f06b6b;border-radius:50%;font-size:12px;line-height:1;font-weight:800;color:#ff8181}\n.cinelva-rate-dialog .cinelva-spoiler-toggle>span:last-child{white-space:nowrap!important;font-size:13px!important}\n.cinelva-rate-dialog .cinelva-spoiler-toggle:has(input:checked){background:#8e25254d;border-color:#f06b6b;color:#fff}\n";
style.textContent+="\n/* Shared review modal: readable mobile typography with safe, bounded sizing. */\n.cinelva-rate-dialog{box-sizing:border-box;max-width:calc(100vw - 20px)!important;overflow-x:hidden!important}\n.cinelva-rate-dialog .cinelva-rate-inner{box-sizing:border-box;min-width:0;width:100%;gap:clamp(10px,2.5vw,14px);padding:clamp(14px,4vw,20px)}\n.cinelva-rate-dialog .cinelva-rate-inner>*{min-width:0;max-width:100%;box-sizing:border-box}\n.cinelva-rate-dialog .cinelva-review-header strong{min-width:0;max-width:calc(100% - 56px);font-size:clamp(17px,4.4vw,20px);line-height:1.4}\n.cinelva-rate-dialog .cinelva-review-score output{font-size:clamp(34px,9vw,42px);line-height:1.2;font-variant-numeric:tabular-nums}\n.cinelva-rate-dialog .cinelva-review-score>span{font-size:clamp(16px,4vw,19px);line-height:1.3}\n.cinelva-rate-dialog .cinelva-rate-inner label{font-size:clamp(14px,3.8vw,16px);line-height:1.5}\n.cinelva-rate-dialog .cinelva-rate-inner input:not([type=range]):not([type=checkbox]):not([type=hidden]),\n.cinelva-rate-dialog .cinelva-rate-inner select,\n.cinelva-rate-dialog .cinelva-rate-inner textarea{font-size:16px!important;line-height:1.45;max-width:100%;min-width:0}\n.cinelva-rate-dialog .cinelva-rate-inner textarea{min-height:76px}\n.cinelva-rate-dialog #cinelvaDateTrigger{font-size:clamp(15px,4vw,17px)}\n.cinelva-rate-dialog .cinelva-rate-actions{min-width:0;max-width:100%;gap:8px}\n.cinelva-rate-dialog .cinelva-rate-actions button{min-width:0;font-size:clamp(14px,3.8vw,16px);line-height:1.35;overflow-wrap:anywhere}\n.cinelva-rate-dialog .cinelva-spoiler-toggle{max-width:100%!important;min-width:0!important}\n.cinelva-rate-dialog .cinelva-spoiler-toggle>span:last-child{font-size:clamp(14px,3.7vw,16px)!important}\n.cinelva-rate-dialog #cinelvaRateMessage{font-size:14px!important;overflow-wrap:anywhere}\n@media(max-width:350px){.cinelva-rate-dialog .cinelva-rate-inner{padding:12px}.cinelva-rate-dialog .cinelva-rate-actions{gap:6px}}\n";
style.textContent+="\n/* Shared compact review controls: legible at three columns without overflow. */\n.cinelva-rating-controls.cinelva-rating-controls-no-gauge{\n grid-template-columns:minmax(0,1fr) 22px!important;\n grid-template-rows:42px!important;height:50px!important;min-height:50px!important;max-height:50px!important;\n padding:4px 5px!important;column-gap:3px!important;box-sizing:border-box!important;overflow:hidden!important\n}\n.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-pair{\n min-width:0!important;grid-template-rows:20px 20px!important;height:42px!important;min-height:42px!important;max-height:42px!important;gap:2px!important\n}\n.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>.cinelva-rating-line{\n grid-template-columns:minmax(0,1fr) auto!important;height:20px!important;min-height:20px!important;max-height:20px!important;line-height:20px!important;min-width:0!important;gap:2px!important;font-size:11px!important\n}\n.cinelva-rating-controls-no-gauge .rating-caption{\n font-size:clamp(9px,2.6vw,11px)!important;letter-spacing:-.35px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;min-width:0!important\n}\n.cinelva-rating-controls-no-gauge .rating-value{\n font-size:clamp(10px,2.9vw,12px)!important;line-height:20px!important;min-width:0!important;font-variant-numeric:tabular-nums!important\n}\n.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions{\n grid-template-columns:21px!important;grid-template-rows:21px 21px!important;\n width:21px!important;min-width:21px!important;max-width:21px!important;\n height:44px!important;min-height:44px!important;max-height:44px!important;gap:2px!important\n}\n.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button{\n width:21px!important;min-width:21px!important;max-width:21px!important;\n height:21px!important;min-height:21px!important;max-height:21px!important;flex:0 0 21px!important\n}\n.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button svg{\n width:16px!important;min-width:16px!important;max-width:16px!important;\n height:16px!important;min-height:16px!important;max-height:16px!important;flex:0 0 16px!important\n}\n";
style.textContent+="\n/* Larger review controls, without allowing horizontal overflow. */\n.cinelva-rate-dialog .cinelva-review-header strong{font-size:clamp(18px,4.7vw,22px)!important}\n.cinelva-rate-dialog .cinelva-review-score output{font-size:clamp(38px,10vw,46px)!important}\n.cinelva-rate-dialog .cinelva-review-score>span{font-size:clamp(17px,4.5vw,20px)!important}\n.cinelva-rate-dialog .cinelva-rate-inner label{font-size:clamp(15px,4vw,17px)!important}\n.cinelva-rate-dialog .cinelva-rate-actions button{font-size:clamp(15px,4vw,17px)!important}\n.cinelva-rate-dialog #cinelvaRateX{font-size:30px!important;line-height:1!important}\n.cinelva-rate-dialog .cinelva-spoiler-toggle>span:last-child{font-size:clamp(15px,4vw,17px)!important}\n.cinelva-rate-dialog .cinelva-spoiler-alert{font-size:14px!important;flex-basis:20px!important;width:20px!important;height:20px!important}\n.cinelva-rate-dialog .cinelva-rate-inner{overflow-wrap:anywhere}\n";
style.textContent+="\n/* Review-specific spoiler toggle belongs beside its comment label, not below the field. */\n.cinelva-rate-dialog .cinelva-comment-field{display:grid;gap:7px;min-width:0;max-width:100%;width:100%;box-sizing:border-box}\n.cinelva-rate-dialog .cinelva-comment-heading{display:flex;flex-wrap:nowrap;align-items:center;justify-content:space-between;gap:8px;min-width:0;width:100%}\n.cinelva-rate-dialog .cinelva-comment-heading>label{display:block!important;flex:1 1 auto;min-width:0;width:auto!important;margin:0;font-size:clamp(14px,3.8vw,16px)!important;white-space:nowrap}\n.cinelva-rate-dialog .cinelva-spoiler-button{display:inline-flex!important;align-items:center;justify-content:center;flex:0 1 auto;gap:5px;min-width:0;max-width:54%;padding:6px 9px!important;border:1px solid #777f8c!important;border-radius:8px!important;background:rgba(115,125,140,.09)!important;color:#929ba8!important;white-space:nowrap!important;line-height:1.2!important;font-size:clamp(11px,3.2vw,13px)!important;cursor:pointer;box-sizing:border-box}\n.cinelva-rate-dialog .cinelva-spoiler-button .cinelva-spoiler-alert{display:grid;place-items:center;flex:0 0 15px;width:15px;height:15px;border:1.5px solid currentColor;border-radius:50%;font-size:10px;font-weight:800;line-height:1}\n.cinelva-rate-dialog .cinelva-spoiler-button[aria-pressed=\"true\"]{background:#9c2828!important;border-color:#ff7474!important;color:#fff!important}\n.cinelva-rate-dialog .cinelva-comment-field textarea{display:block;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}\n@media(max-width:350px){.cinelva-rate-dialog .cinelva-spoiler-button{padding:5px 6px!important;gap:3px!important;font-size:11px!important}}\n";
document.head.append(style);
const dialog=document.createElement('dialog');dialog.className='cinelva-rate-dialog';
dialog.innerHTML=`<form class="cinelva-rate-inner" method="dialog"><div class="cinelva-review-header"><strong id="cinelvaRateTitle">レビュー</strong><button type="button" id="cinelvaRateX" aria-label="閉じる">×</button></div><div class="cinelva-review-score"><output id="cinelvaRateValue">0.0</output><span>/ 5.0</span><input aria-label="点数" id="cinelvaRateScore" type="range" min="0" max="5" step="0.1" value="0"></div><div class="cinelva-review-date"><label>鑑賞日<input id="cinelvaRateDate" type="hidden"><button type="button" id="cinelvaDateTrigger" aria-label="鑑賞日を選択" aria-expanded="false"></button></label><div id="cinelvaDatePicker" class="cinelva-date-picker" hidden><div class="cinelva-date-nav"><button type="button" id="cinelvaDatePrev" aria-label="前月">‹</button><strong id="cinelvaDateMonth"></strong><button type="button" id="cinelvaDateNext" aria-label="翌月">›</button></div><div id="cinelvaDateGrid" class="cinelva-date-grid"></div></div></div><div class="cinelva-review-method"><label>鑑賞方法<select id="cinelvaRatePlace"><option value="">未指定</option><option value="映画館">映画館</option><option value="配信・サブスク">配信・サブスク</option><option value="TV">TV</option><option value="DVD・Blu-ray">DVD／ブルーレイ</option><option value="その他">その他</option></select></label><label id="cinelvaRateVenueWrap" hidden><span id="cinelvaRateVenueLabel">方式</span><select id="cinelvaRateVenue"></select></label></div><div class="cinelva-comment-field"><div class="cinelva-comment-heading"><label for="cinelvaRateComment">感想（任意）</label><button type="button" class="cinelva-spoiler-button" id="cinelvaRateSpoiler" aria-pressed="false"><span class="cinelva-spoiler-alert" aria-hidden="true">!</span><span>ネタバレあり</span></button></div><textarea id="cinelvaRateComment" maxlength="2000" rows="3"></textarea></div><p id="cinelvaRateMessage" role="status" style="margin:0;font-size:12px"></p><div class="cinelva-rate-actions"><button type="button" id="cinelvaRateClose">閉じる</button><button type="button" id="cinelvaRateSave">保存</button></div></form>`;
document.body.append(dialog);
const $=id=>dialog.querySelector('#'+id);
const dateYear=document.createElement('select');
dateYear.id='cinelvaDateYear';dateYear.setAttribute('aria-label','鑑賞年を選択');
const dateMonth=document.createElement('select');
dateMonth.id='cinelvaDateMonthSelect';dateMonth.setAttribute('aria-label','鑑賞月を選択');
for(let m=0;m<12;m++){const option=document.createElement('option');option.value=String(m);option.textContent=(m+1)+'月';dateMonth.append(option);}
const monthTitle=$('cinelvaDateMonth');
monthTitle.replaceWith(dateYear,dateMonth);
function fillDateYears(){
 const current=new Date().getFullYear();
 const max=Math.max(current+5,pickerYear),min=Math.min(1900,pickerYear);
 dateYear.replaceChildren();
 for(let y=max;y>=min;y--){const option=document.createElement('option');option.value=String(y);option.textContent=y+'年';dateYear.append(option);}
}
dateYear.onchange=()=>{pickerYear=Number(dateYear.value);drawDatePicker();};
dateMonth.onchange=()=>{pickerMonth=Number(dateMonth.value);drawDatePicker();};
const dateInput=$('cinelvaRateDate'),dateTrigger=$('cinelvaDateTrigger'),datePicker=$('cinelvaDatePicker');
let pickerYear=0,pickerMonth=0;
const dateISO=(y,m,d)=>String(y).padStart(4,'0')+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
function closeDatePicker(){datePicker.hidden=true;dateTrigger.setAttribute('aria-expanded','false');}
function drawDatePicker(){
 if(![...dateYear.options].some(option=>Number(option.value)===pickerYear))fillDateYears();
 dateYear.value=String(pickerYear);dateMonth.value=String(pickerMonth);
 const grid=$('cinelvaDateGrid');grid.replaceChildren();
 for(const label of ['日','月','火','水','木','金','土']){
  const el=document.createElement('span');el.className='cinelva-date-weekday';el.textContent=label;grid.append(el);
 }
 const offset=new Date(pickerYear,pickerMonth,1).getDay();
 const days=new Date(pickerYear,pickerMonth+1,0).getDate();
 for(let i=0;i<offset;i++){const spacer=document.createElement('span');grid.append(spacer);}
 for(let d=1;d<=days;d++){
  const iso=dateISO(pickerYear,pickerMonth,d);
  const btn=document.createElement('button');btn.type='button';btn.textContent=String(d);
  btn.className='cinelva-date-day';btn.setAttribute('aria-label',iso);
  if(iso===dateInput.value)btn.setAttribute('aria-current','date');
  btn.onclick=()=>{dateInput.value=iso;dateTrigger.textContent=iso.replaceAll('-','/');closeDatePicker();dateTrigger.focus();};
  grid.append(btn);
 }
}
dateTrigger.onclick=()=>{
 if(!datePicker.hidden){closeDatePicker();return;}
 const [y,m]=dateInput.value.split('-').map(Number);
 const now=new Date();pickerYear=y||now.getFullYear();pickerMonth=(m||now.getMonth()+1)-1;
 fillDateYears();drawDatePicker();datePicker.hidden=false;dateTrigger.setAttribute('aria-expanded','true');
};
$('cinelvaDatePrev').onclick=()=>{pickerMonth--;if(pickerMonth<0){pickerMonth=11;pickerYear--;}drawDatePicker();};
$('cinelvaDateNext').onclick=()=>{pickerMonth++;if(pickerMonth>11){pickerMonth=0;pickerYear++;}drawDatePicker();};
dialog.addEventListener('click',event=>{if(!datePicker.hidden&&!event.target.closest('.cinelva-review-date'))closeDatePicker();});
$('cinelvaRateClose').onclick=()=>dialog.close();
$('cinelvaRateX').onclick=()=>dialog.close();
function syncDialogScore(){
 const score=Number($('cinelvaRateScore').value);
 $('cinelvaRateValue').textContent=score.toFixed(1);
 $('cinelvaRateScore').style.setProperty('--dialog-progress',(score/5*100)+'%');
 $('cinelvaRateValue').style.setProperty('color',score===0?'#fff':'#e4bd70','important');
}
$('cinelvaRateSpoiler').onclick=()=>{const button=$('cinelvaRateSpoiler');button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));};
$('cinelvaRateScore').oninput=syncDialogScore;
const scoreSlider=$('cinelvaRateScore');
// Safari can require grabbing the thumb. A tap anywhere on the visible track
// should jump to that point, while native drag and keyboard controls remain intact.
scoreSlider.addEventListener('pointerdown',event=>{
 if(event.button!==0||!event.isPrimary)return;
 const rect=scoreSlider.getBoundingClientRect();
 if(!rect.width)return;
 const min=Number(scoreSlider.min)||0,max=Number(scoreSlider.max)||5,step=Number(scoreSlider.step)||0.1;
 const ratio=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
 const value=Math.min(max,Math.max(min,Math.round((min+ratio*(max-min)-min)/step)*step+min));
 scoreSlider.value=value.toFixed(1);
 syncDialogScore();
 scoreSlider.dispatchEvent(new Event('change',{bubbles:true}));
});

const cinemaOptions=['通常','IMAX','Dolby Cinema','Dolby Atmos','4DX','MX4D','ScreenX','その他'];
const streamingOptions=['Netflix','Amazon Prime Video','Disney+','U-NEXT','Hulu','Apple TV+','ABEMA','DMM TV','Lemino','WOWOW','その他'];
function syncViewingVenue(saved=''){
 const method=$('cinelvaRatePlace').value,wrap=$('cinelvaRateVenueWrap'),select=$('cinelvaRateVenue');
 wrap.hidden=!(method==='映画館'||method==='配信・サブスク'||method==='配信');select.replaceChildren();
 if(wrap.hidden)return;
 $('cinelvaRateVenueLabel').textContent=method==='映画館'?'上映方式':'配信サービス';
 const options=method==='映画館'?cinemaOptions:streamingOptions;
 for(const value of ['',...options,...(saved&&!options.includes(saved)?[saved]:[])]){
  const option=document.createElement('option');option.value=value;option.textContent=value||'未指定';select.append(option);
 }
 select.value=saved||'';
}
$('cinelvaRatePlace').addEventListener('change',()=>syncViewingVenue());
function open(movie,options={}) {
 const id=canonicalId(movie);
 if(!validId(id)){return false;}
 const existing=allRecords().find(r=>movie._localRecord?String(r.id)===String(movie.id):String(r.tmdbId??r.tmdb_id??r.id)===String(id)&&((r.tmdbId||r.tmdb_id)||String(r.title)===String(movie.title)&&Number(r.year)>0&&Number(r.year)===Number(movie.year)));
 selected={...movie,...existing,_editingExisting:Boolean(existing),id:String(existing?.id??id),...(movie._localRecord?{}:{tmdbId:id}),title:existing?.title||movie.title||movie.name||'作品'};
 $('cinelvaRateTitle').textContent=selected.title;
 $('cinelvaRateScore').value=existing?.rating??0;
 syncDialogScore();
 $('cinelvaRatePlace').value=existing?.viewingMethod==='配信'?'配信・サブスク':existing?.viewingMethod==='DVD／ブルーレイ'?'DVD・Blu-ray':(existing?.viewingMethod||'');
 syncViewingVenue(existing?.viewingVenue||'');
 $('cinelvaRateDate').value=existing?existing.watchedAt||'':new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
 dateTrigger.textContent=dateInput.value?dateInput.value.replaceAll('-','/'):'鑑賞日未登録';closeDatePicker();
 $('cinelvaRateComment').value=existing?.comment||'';
 $('cinelvaRateSpoiler').setAttribute('aria-pressed',String(Boolean(existing?.hasSpoilers??existing?.spoiler??existing?.containsSpoilers)));
 $('cinelvaRateMessage').textContent='';
 if(!dialog.open)dialog.showModal();
 if(options.showDate)dateTrigger.click();
 return true;
}
function save() {
 if(!selected)return;
 const date=$('cinelvaRateDate').value.trim()||(selected.watchedAt && !/^\d{4}-\d{2}-\d{2}$/.test(selected.watchedAt)?selected.watchedAt:null),comment=$('cinelvaRateComment').value.trim();
 if(!Records.validDate(date)){$('cinelvaRateMessage').textContent='カレンダーから鑑賞日を選択してください';return;}
 try{
  if(Number($('cinelvaRateScore').value)===0){if(selected._editingExisting&&allRecords().some(r=>String(r.id)===String(selected.id)&&String(r.tmdbId??r.tmdb_id??r.id)===String(selected.tmdbId??selected.id)))Records.remove(selected.id);}
  else {const {_editingExisting,_localRecord,...movie}=selected;Records.save({...movie,comment,hasSpoilers:$('cinelvaRateSpoiler').getAttribute('aria-pressed')==='true',spoiler:$('cinelvaRateSpoiler').getAttribute('aria-pressed')==='true',viewingMethod:$('cinelvaRatePlace').value,viewingVenue:$('cinelvaRatePlace').value?$('cinelvaRateVenue').value:''},Number($('cinelvaRateScore').value),date);}
  root.dispatchEvent(new CustomEvent('cinelva-record-updated',{detail:{id:selected.id}}));
  dialog.close();
 }catch(error){$('cinelvaRateMessage').textContent='保存できません：'+error.message;}
}
$('cinelvaRateSave').onclick=save;
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
if(!location.pathname.includes('rankings'))enhanceGrid(document.querySelector('#grid'),'search'); // Rankings supply their own shared review region.
// The real index calendar renders cards in #dates, not #cards. Do not add
// another listing page or alter the original calendar click-to-detail action.
function enhanceCalendar(grid){
 if(!grid)return;
 const decorate=(cards=grid.querySelectorAll('.streamMovie[data-mi],.tvMovie[data-mi]'))=>{
  for(const card of cards){
   if(card.querySelector('.cinelva-rate-button')||card.querySelector('.cinelva-rating-controls'))continue;
   const rate=document.createElement('button');rate.type='button';rate.className='cinelva-rate-button';
   rate.setAttribute('aria-label','この映画をレビュー');rate.innerHTML=reviewIcon;
   rate.onclick=event=>{
    event.stopPropagation();event.preventDefault();
    activeCard=rate;
    const movie=root.CinelvaRatingResolve?.(card.dataset.mi,'calendar');
    if(!open(movie))rate.setAttribute('aria-label','作品IDを確認できません');
   };
   const movie=root.CinelvaRatingResolve?.(card.dataset.mi,'calendar');
   const movieId=canonicalId(movie);
   if(!validId(movieId))continue;
   card.append(rate);
   attachInlineScore(rate,movie);
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
style.textContent+=`
/* Streaming and theatrical movie tiles share one compact, aligned review area. */
.streamingWeekMovies>.streamMovie{display:flex!important;flex-direction:column!important;min-width:0}
.streamingWeekMovies>.streamMovie>.streamMovieTitle{flex:1 1 auto!important}
.streamingWeekMovies>.streamMovie>.cinelva-rating-controls{margin-top:4px!important}
.streamingWeekMovies>.streamMovie>.cinelva-rate-button{display:none!important}
`;
function attachInlineScore(button,movie) {
 const id=canonicalId(movie);
 if(!validId(id))return;
 const syncWatched=()=>{
  const record=allRecords().find(r=>(movie._localRecord?String(r.id)===String(movie.id):String(r.tmdbId??r.tmdb_id??r.id)===String(id)&&((r.tmdbId||r.tmdb_id)||String(r.title)===String(movie.title)&&Number(r.year)>0&&Number(r.year)===Number(movie.year))));
  button.classList.toggle('is-watched',Boolean(record&&record.watched===true));
  button.setAttribute('aria-label',record&&record.watched===true?'この映画の評価を編集':'この映画をレビュー');
 };
  const bookmark=document.createElement('button');
 bookmark.type='button';bookmark.className='cinelva-bookmark-button';
 bookmark.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12v17l-6-4-6 4z"/></svg>';
 bookmark.dataset.bookmarkId=String(id);
 let bookmarkToastTimer;
 function showBookmarkToast(message){
  let toast=document.getElementById('cinelva-bookmark-toast');
  if(!toast){toast=document.createElement('div');toast.id='cinelva-bookmark-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.append(toast);}
  toast.textContent=message;toast.classList.add('is-visible');
  clearTimeout(bookmarkToastTimer);
  bookmarkToastTimer=setTimeout(()=>toast.classList.remove('is-visible'),1800);
 }
 const bookmarkKey='cinelva-want-to-watch-v1';
 const getBookmarks=()=>{try{const v=JSON.parse(localStorage.getItem(bookmarkKey)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}};
 const syncBookmark=()=>{
  const marked=!!getBookmarks()[String(id)];
  bookmark.classList.toggle('is-bookmarked',marked);
  bookmark.style.setProperty('color',marked?'#329cff':'#aeb3bd','important');
  bookmark.querySelector('svg')?.style.setProperty('fill',marked?'#329cff':'none','important');
  bookmark.setAttribute('aria-pressed',String(marked));
  bookmark.setAttribute('aria-label',marked?'観たいを解除':'観たいに登録');
  bookmark.title=marked?'観たいを解除':'観たいに登録';
 };
 bookmark.onclick=event=>{
  event.preventDefault();event.stopPropagation();
  try{
   const data=getBookmarks(),key=String(id),marked=!!data[key];
   if(marked)delete data[key];
   else data[key]={id:key,title:movie.title||movie.name||'作品',poster:root.CinelvaMovieIdentity?.posterFor(movie)||movie.poster||movie.posterUrl||movie.poster_path||'',year:movie.year||String(movie.release_date||'').slice(0,4),savedAt:new Date().toISOString()};
   localStorage.setItem(bookmarkKey,JSON.stringify(data));
   syncBookmark();
   showBookmarkToast(marked?'ブックマークを解除しました':'ブックマークしました');
   root.dispatchEvent(new CustomEvent('cinelva-bookmarks-updated',{detail:{id:key,marked:!marked}}));
  }catch(error){bookmark.setAttribute('aria-label','保存できませんでした');}
 };
 root.addEventListener('cinelva-record-updated',syncWatched);
 root.addEventListener('cinelva-bookmarks-updated',syncBookmark);
 root.addEventListener('storage',event=>{if(event.key===bookmarkKey)syncBookmark();});
 syncBookmark();
 if(movie._localRecord){bookmark.disabled=true;bookmark.setAttribute('aria-pressed','false');bookmark.classList.remove('is-bookmarked');bookmark.title='作品ID未確認';bookmark.onclick=null;}

 const ratings=document.createElement('div');ratings.className='cinelva-rating-pair';
 const personal=document.createElement('div'),audience=document.createElement('div');
 personal.className='cinelva-rating-line cinelva-rating-personal';
 audience.className='cinelva-rating-line cinelva-rating-audience';
 const updatePersonal=()=>{
  const rec=allRecords().find(r=>(movie._localRecord?String(r.id)===String(movie.id):String(r.tmdbId??r.tmdb_id??r.id)===String(id)&&((r.tmdbId||r.tmdb_id)||String(r.title)===String(movie.title)&&Number(r.year)>0&&Number(r.year)===Number(movie.year)))&&r.watched===true);
  const watched=Boolean(rec&&rec.rating!==0);
  const score=watched&&Number.isFinite(Number(rec.rating))&&rec.rating!==null?Number(rec.rating).toFixed(1):watched?'0.0':'未鑑賞';
  personal.innerHTML='<span class="rating-caption">MY評価</span><span class="rating-value"></span>';personal.querySelector('.rating-value').textContent=score;
  personal.classList.toggle('is-unwatched',!watched);
  personal.style.setProperty('color',watched?'#e4bd70':'#aab0bb','important');
 };
 const tmdbScore=Number(movie?.vote_average??movie?.voteAverage??movie?.tmdbRating??movie?.score);
 const votes=movie?.vote_count??movie?.voteCount??movie?.votes;
 const validTmdb=Number.isFinite(tmdbScore)&&tmdbScore>0&&votes!==0;
 audience.innerHTML='<span class="rating-caption">TMDB評価</span><span class="rating-value"></span>';audience.querySelector('.rating-value').textContent=validTmdb?(tmdbScore/2).toFixed(1):'-';
 audience.classList.toggle('is-unrated',!validTmdb);
 if(!validTmdb&&typeof IntersectionObserver!=='undefined'){
  const observer=new IntersectionObserver(entries=>{
   if(!entries.some(e=>e.isIntersecting))return;
   observer.disconnect();
   resolveCommunityRating(movie,score=>{
    if(!score||!audience.isConnected)return;
    audience.querySelector('.rating-value').textContent=(score/2).toFixed(1);
    audience.classList.remove('is-unrated');
   });
  },{rootMargin:'180px'});
  observer.observe(button);
 }
 personal.title='MY評価';audience.title='TMDB評価';
 ratings.setAttribute('aria-label','MY評価 / TMDB評価');
 ratings.append(personal,audience);
 const controls=document.createElement('div');controls.className='cinelva-rating-controls cinelva-rating-controls-no-gauge';
 button.before(controls);
 const actions=document.createElement('div');actions.className='cinelva-rating-actions';
 actions.append(button,bookmark);controls.append(ratings,actions);
 bookmark.style.setProperty('pointer-events','auto','important');
 bookmark.style.setProperty('cursor','pointer','important');
 bookmark.style.setProperty('position','relative','important');
 bookmark.style.setProperty('z-index','10','important');
 // Compact geometry: 2 x 17px rows, 17px buttons, 4px vertical padding.
 const force=(el,values)=>Object.entries(values).forEach(([k,v])=>el.style.setProperty(k,v,'important'));
 force(controls,{'display':'grid','grid-template-columns':'minmax(0,1fr) 17px','grid-template-rows':'35px','align-items':'center','column-gap':'3px','width':'100%','box-sizing':'border-box','height':'43px','min-height':'43px','max-height':'43px','padding':'4px 5px','overflow':'hidden'});
 force(ratings,{'display':'grid','grid-template-columns':'minmax(0,1fr)','grid-template-rows':'17px 17px','grid-column':'1','grid-row':'1','align-items':'center','width':'100%','min-width':'0','height':'35px','min-height':'35px','max-height':'35px','gap':'1px','overflow':'hidden','visibility':'visible','opacity':'1'});
 for(const line of [personal,audience])force(line,{'display':'grid','grid-template-columns':'minmax(0,1fr) auto','align-items':'center','gap':'2px','width':'100%','min-width':'0','height':'17px','min-height':'17px','max-height':'17px','font-size':'10px','line-height':'17px','overflow':'hidden','white-space':'nowrap','visibility':'visible'});
 force(actions,{'display':'grid','grid-template-columns':'17px','grid-template-rows':'17px 17px','grid-column':'2','grid-row':'1','align-items':'center','justify-content':'center','gap':'1px','width':'17px','height':'35px','min-height':'35px','max-height':'35px'});
 for(const action of [button,bookmark]){force(action,{'display':'grid','place-items':'center','width':'17px','min-width':'17px','max-width':'17px','height':'17px','min-height':'17px','max-height':'17px','padding':'0','margin':'0','border':'1px solid #525765','border-radius':'4px','box-sizing':'border-box','background':'transparent','transform':'none'});const svg=action.querySelector('svg');if(svg)force(svg,{'width':'12px','height':'12px','min-width':'12px','min-height':'12px'});}
 root.addEventListener('cinelva-record-updated',updatePersonal);
 updatePersonal();
 for(const type of ['pointerdown','pointermove','pointerup','touchstart','touchmove','touchend','mousedown','mouseup','click','dblclick']){
  controls.addEventListener(type,event=>event.stopPropagation());
 }
 controls.addEventListener('keydown',event=>event.stopPropagation());
 syncWatched();
}
function refreshRatingLabels(){
 const saved=allRecords();
 for(const input of document.querySelectorAll('.cinelva-inline-score input')){
  if(document.activeElement===input||input.dataset.dragging==='true')continue;
  const id=input.dataset.movieId;
  if(id){const record=saved.find(r=>String(r.tmdbId??r.tmdb_id??r.id)===id);input.value=Number(record?.rating??0).toFixed(1);input.dataset.hasRecord=String(Boolean(record));input.dispatchEvent(new Event('input'));input.closest('.cinelva-inline-score')?.classList.toggle('is-watched',Boolean(record));}
 }
 const byId=new Map();
 for(const record of saved){
  if(record.watched===false)continue;
  const id=record.tmdbId??record.tmdb_id??record.id;
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
/* Final narrow-card layout. Explicit fixed tracks avoid inherited grid min-size overflow. */
.cinelva-rating-controls{
 display:grid!important;grid-template-columns:minmax(0,1fr)!important;
 grid-template-rows:22px 16px 22px!important;
 align-content:start!important;align-items:stretch!important;
 height:64px!important;min-height:64px!important;max-height:64px!important;
 padding:2px 6px!important;margin:0!important;gap:0!important;
 box-sizing:border-box!important;overflow:hidden!important;position:relative!important;
}
.cinelva-rating-controls>.cinelva-inline-score{
 display:grid!important;grid-template-columns:minmax(0,1fr)!important;
 grid-template-rows:22px 16px 22px!important;
 align-content:start!important;align-items:stretch!important;
 grid-column:1!important;grid-row:1/4!important;
 height:60px!important;min-height:0!important;max-height:60px!important;
 width:100%!important;min-width:0!important;
 margin:0!important;padding:0!important;gap:0!important;
 box-sizing:border-box!important;overflow:visible!important;
 pointer-events:none!important;position:relative!important;
}
.cinelva-rating-controls>.cinelva-inline-score::before{display:none!important;content:none!important}
.cinelva-rating-controls>.cinelva-rate-button{
 grid-column:1!important;grid-row:1!important;
 justify-self:start!important;align-self:center!important;
 width:25px!important;height:22px!important;min-height:22px!important;
 position:relative!important;z-index:7!important;margin:0!important;
}
.cinelva-rating-controls>.cinelva-rating-clear{
 position:absolute!important;top:2px!important;right:6px!important;
 height:22px!important;min-height:22px!important;max-height:22px!important;
 max-width:calc(100% - 36px)!important;
 padding:1px 5px!important;margin:0!important;
 line-height:18px!important;box-sizing:border-box!important;
 border:1px solid #aeb5c07a!important;border-radius:5px!important;
 background:#ffffff0d!important;z-index:7!important;
}
.cinelva-rating-controls .cinelva-inline-value{
 display:block!important;grid-column:1!important;grid-row:2!important;
 position:static!important;top:auto!important;
 justify-self:center!important;align-self:center!important;
 width:auto!important;max-width:100%!important;min-width:0!important;
 height:16px!important;min-height:0!important;
 padding:0!important;margin:0!important;
 font:600 10px/16px system-ui!important;
 text-align:center!important;white-space:nowrap!important;
 letter-spacing:0!important;overflow:hidden!important;
}
.cinelva-rating-controls .cinelva-inline-value::before{content:none!important;display:none!important}
.cinelva-rating-controls .cinelva-inline-score::after{
 content:"スコア"!important;display:block!important;
 grid-column:1!important;grid-row:2!important;
 justify-self:start!important;align-self:center!important;
 position:relative!important;z-index:1!important;
 font:400 10px/16px system-ui!important;color:#c3c8d0!important;
 pointer-events:none!important;
}
.cinelva-rating-controls .cinelva-score-track{
 display:block!important;grid-column:1!important;grid-row:3!important;
 align-self:center!important;
 position:relative!important;
 width:100%!important;min-width:0!important;
 height:22px!important;min-height:22px!important;max-height:22px!important;
 margin:0!important;padding:0!important;
 box-sizing:border-box!important;overflow:visible!important;
}
.cinelva-rating-controls .cinelva-score-track input[type=range]{
 display:block!important;width:100%!important;
 height:22px!important;min-height:22px!important;max-height:22px!important;
 margin:0!important;padding:0!important;
}
`;
style.textContent+=`
/* Review order: score, slider, date. Keep the score denominator beside its value. */
.cinelva-rate-dialog .cinelva-review-score{
 display:grid!important;
 grid-template-columns:max-content max-content minmax(0,1fr)!important;
 grid-template-rows:40px 32px!important;
 justify-content:start!important;
 column-gap:6px!important;row-gap:5px!important;
 align-items:center!important;
}
.cinelva-rate-dialog .cinelva-review-score output{
 grid-column:1!important;grid-row:1!important;
 justify-self:start!important;align-self:center!important;
}
.cinelva-rate-dialog .cinelva-review-score>span{
 grid-column:2!important;grid-row:1!important;
 justify-self:start!important;align-self:center!important;
 margin:0!important;white-space:nowrap!important;
}
.cinelva-rate-dialog .cinelva-review-score input[type=range]{
 grid-column:1/-1!important;grid-row:2!important;
 width:100%!important;min-width:0!important;
}
.cinelva-rate-dialog>.cinelva-review-date,
.cinelva-rate-dialog .cinelva-rate-inner>.cinelva-review-date{
 display:block!important;max-width:100%!important;
}
.cinelva-rate-dialog .cinelva-rate-inner>.cinelva-review-date label{
 display:flex!important;flex-direction:row!important;
 justify-content:flex-start!important;align-items:center!important;
 gap:10px!important;
}
.cinelva-rate-dialog .cinelva-rate-inner>.cinelva-review-date input[type=date]{
 flex:0 0 148px!important;width:148px!important;max-width:148px!important;
 height:36px!important;font-size:14px!important;
}
`;
style.textContent+=`
/* Trademark-safe text chips: no third-party logo assets or implied endorsement. */
.cinelva-rate-dialog .cinelva-venue-chips{
 display:flex!important;flex-wrap:wrap!important;gap:6px!important;
 margin-top:-3px!important;margin-bottom:3px!important;
}
.cinelva-rate-dialog .cinelva-venue-chips[hidden]{display:none!important}
.cinelva-rate-dialog .cinelva-venue-chip{
 appearance:none!important;border:1px solid #ffffff35!important;
 border-radius:7px!important;background:#292b30!important;color:#e9e9ed!important;
 padding:6px 9px!important;min-height:32px!important;
 font:500 12px/18px system-ui!important;white-space:nowrap!important;
 cursor:pointer!important;
}
.cinelva-rate-dialog .cinelva-venue-chip[aria-pressed="true"]{
 border-color:#e7b944!important;background:#e7b94426!important;color:#f5d17c!important;
}
`;
style.textContent+=`
/* Compact list-card review: two rows only, no スコア label. */
.cinelva-rating-controls{
 grid-template-rows:24px 26px!important;
 height:54px!important;min-height:54px!important;max-height:54px!important;
 padding:2px 6px!important;
}
.cinelva-rating-controls>.cinelva-inline-score{
 grid-template-rows:24px 26px!important;
 grid-row:1/3!important;height:50px!important;max-height:50px!important;
}
.cinelva-rating-controls>.cinelva-inline-score::after{
 display:none!important;content:none!important;
}
.cinelva-rating-controls .cinelva-inline-value{
 grid-row:1!important;grid-column:1!important;
 justify-self:center!important;align-self:center!important;
 max-width:calc(100% - 88px)!important;
 font:600 11px/20px system-ui!important;height:20px!important;
}
.cinelva-rating-controls .cinelva-inline-value::before{display:none!important;content:none!important}
.cinelva-rating-controls>.cinelva-rate-button{
 grid-row:1!important;align-self:center!important;
}
.cinelva-rating-controls>.cinelva-rating-clear{
 top:3px!important;right:5px!important;
 padding:1px 4px!important;
}
.cinelva-rating-controls .cinelva-score-track{
 grid-row:2!important;height:26px!important;min-height:26px!important;max-height:26px!important;
}
.cinelva-rating-controls .cinelva-score-track input[type=range]{
 height:26px!important;min-height:26px!important;max-height:26px!important;
}
`;
style.textContent+=`
.cinelva-rating-controls{display:grid!important;grid-template-columns:29px minmax(0,1fr) 49px!important;grid-template-rows:24px 26px!important;column-gap:0!important;height:54px!important;min-height:54px!important;max-height:54px!important;padding:2px 5px!important;box-sizing:border-box!important}
.cinelva-rating-controls>.cinelva-inline-score{display:grid!important;grid-template-columns:29px minmax(0,1fr) 49px!important;grid-template-rows:24px 26px!important;grid-column:1/-1!important;grid-row:1/3!important;width:100%!important;min-width:0!important;height:50px!important;max-height:50px!important}
.cinelva-rating-controls>.cinelva-rate-button{grid-column:1!important;grid-row:1!important;justify-self:start!important;align-self:center!important;width:27px!important;min-width:27px!important;z-index:5!important}
.cinelva-rating-controls>.cinelva-rating-clear{position:relative!important;top:auto!important;right:auto!important;grid-column:3!important;grid-row:1!important;justify-self:end!important;align-self:center!important;width:49px!important;min-width:0!important;max-width:49px!important;height:22px!important;min-height:22px!important;padding:1px 2px!important;margin:0!important;z-index:5!important}
.cinelva-rating-controls .cinelva-inline-value{grid-column:2!important;grid-row:1!important;justify-self:center!important;align-self:center!important;position:static!important;width:100%!important;max-width:100%!important;min-width:0!important;text-align:center!important;font:600 10px/20px system-ui!important;overflow:hidden!important;white-space:nowrap!important}
.cinelva-rating-controls .cinelva-score-track{grid-column:1/-1!important;grid-row:2!important;width:100%!important;min-width:0!important}
`;
style.textContent+=`
/* Consistent review baseline in three-column cards, including one-line titles. */
.streamMovieTitle{min-height:2.6em!important;max-height:2.6em!important;line-height:1.3!important;-webkit-line-clamp:2!important}
.streamMovie{display:flex!important;flex-direction:column!important;min-width:0!important}
.streamMovie>.cinelva-rating-controls{margin-top:auto!important}
.tvMovieTitle{min-height:2.7em!important;line-height:1.35!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important}
.tvMovie{display:flex!important;flex-direction:column!important;min-width:0!important}
.tvMovie>.cinelva-rating-controls{margin-top:auto!important}
.cinelva-rating-controls>.cinelva-rating-clear{
 width:42px!important;max-width:42px!important;
 height:20px!important;min-height:20px!important;max-height:20px!important;
 font-size:10px!important;line-height:16px!important;
 padding:1px 2px!important;border-radius:4px!important;
}
.cinelva-rating-controls{grid-template-columns:29px minmax(0,1fr) 42px!important}
.cinelva-rating-controls>.cinelva-inline-score{grid-template-columns:29px minmax(0,1fr) 42px!important}
`;
style.textContent+=`
/* Two-row quick rating without redundant clear control. */
.cinelva-rating-controls,.cinelva-rating-controls>.cinelva-inline-score{
 grid-template-columns:29px minmax(0,1fr) 29px!important;
}
.cinelva-rating-controls>.cinelva-rating-clear{display:none!important}
.cinelva-rate-dialog .cinelva-venue-chips{display:none!important}
.cinelva-rate-dialog .cinelva-review-method{margin-bottom:7px!important}
`;
style.textContent+=`
.cinelva-rate-dialog .cinelva-review-date{position:relative!important}
.cinelva-rate-dialog .cinelva-review-date label{display:flex!important;align-items:center!important;gap:10px!important}
.cinelva-rate-dialog #cinelvaDateTrigger{
 width:148px!important;max-width:148px!important;min-height:36px!important;
 padding:6px 9px!important;background:#232427!important;color:#f4f4f4!important;
 border:1px solid #ffffff35!important;border-radius:9px!important;
 font:500 14px/20px system-ui!important;text-align:center!important;
}
.cinelva-rate-dialog .cinelva-date-picker{
 position:relative!important;margin-top:7px!important;width:min(100%,320px)!important;
 padding:9px!important;background:#25272b!important;border:1px solid #ffffff35!important;
 border-radius:10px!important;box-sizing:border-box!important;
}
.cinelva-rate-dialog .cinelva-date-picker[hidden]{display:none!important}
.cinelva-rate-dialog .cinelva-date-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.cinelva-rate-dialog .cinelva-date-nav button{
 width:36px;height:32px;border:1px solid #ffffff35;border-radius:7px;
 background:#33353a;color:#fff;font-size:23px;
}
.cinelva-rate-dialog .cinelva-date-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;text-align:center}
.cinelva-rate-dialog .cinelva-date-weekday{font-size:11px;color:#adb1ba;line-height:27px}
.cinelva-rate-dialog .cinelva-date-day{
 min-width:0;width:100%;height:33px;padding:0;border:0;border-radius:6px;
 background:transparent;color:#f4f4f4;font:500 13px system-ui;
}
.cinelva-rate-dialog .cinelva-date-day[aria-current="date"]{background:#e7b944;color:#181818;font-weight:700}
`;
style.textContent+=`
/* Calendar three-column cards: consistent content rhythm and tight review placement. */
@media(max-width:760px){
 .tvWeekMovies{align-items:stretch!important}
 .tvWeekMovies>.tvMovie{
  display:flex!important;flex-direction:column!important;
  min-width:0!important;padding:6px!important;gap:0!important;
 }
 .tvMoviePoster{flex:0 0 auto!important}
 .tvMovieTop{margin-top:7px!important}
 .tvMovieChannel{margin-top:5px!important}
 .tvMovieProgram{margin-top:5px!important;line-height:1.3!important}
 .tvMovieTitle{
  margin-top:4px!important;line-height:1.35!important;
  min-height:2.7em!important;max-height:2.7em!important;
 }
 .tvMovieStatus{
  margin-top:4px!important;min-height:14px!important;
  align-content:start!important;
 }
 .tvMovie>.cinelva-rating-controls{
  margin-top:6px!important;margin-bottom:0!important;
  flex:0 0 54px!important;align-self:stretch!important;
 }
}
`;
style.textContent+=`
/* Compact eye / score / bookmark row above the rating track. */
.cinelva-rating-controls{
 grid-template-columns:27px minmax(0,1fr) 27px!important;
 grid-template-rows:20px 22px!important;
 height:46px!important;min-height:46px!important;max-height:46px!important;
 padding:2px 5px!important;column-gap:0!important;row-gap:0!important;
}
.cinelva-rating-controls>.cinelva-inline-score{
 grid-template-columns:27px minmax(0,1fr) 27px!important;
 grid-template-rows:20px 22px!important;
 height:42px!important;max-height:42px!important;
}
.cinelva-rating-controls>.cinelva-rate-button{
 width:25px!important;min-width:25px!important;height:20px!important;
 margin:0!important;padding:0!important;grid-column:1!important;grid-row:1!important;
}
.cinelva-rating-controls .cinelva-inline-value{grid-column:2!important;grid-row:1!important;line-height:20px!important}
.cinelva-rating-controls .cinelva-score-track{
 grid-column:1/-1!important;grid-row:2!important;height:22px!important;
}
.cinelva-rating-controls>.cinelva-bookmark-button{
 grid-column:3!important;grid-row:1!important;
 align-self:center!important;justify-self:end!important;
 display:grid!important;place-items:center!important;
 width:25px!important;height:20px!important;min-height:20px!important;
 padding:0!important;margin:0!important;border:0!important;
 background:transparent!important;color:#aeb3bd!important;
 border-radius:4px!important;cursor:pointer!important;z-index:6!important;
}
.cinelva-rating-controls>.cinelva-bookmark-button.is-bookmarked{color:#f3c84e!important}
.cinelva-rating-controls>.cinelva-bookmark-button.is-bookmarked svg{fill:#f3c84e!important}
@media(max-width:760px){
 .tvMovie>.cinelva-rating-controls{flex:0 0 46px!important;margin-top:5px!important}
}
`;
style.textContent+=`
.cinelva-rating-controls:has(.cinelva-rating-date-prompt:not([hidden])){height:auto!important;max-height:none!important;grid-template-rows:20px 22px auto!important}
.cinelva-rating-date-prompt{grid-column:1/-1!important;grid-row:3!important;width:100%!important;padding:3px 0!important;margin:0!important;border:0!important;background:transparent!important;color:#e7b944!important;font-size:10px!important;text-align:center!important}
.cinelva-rating-date-prompt[hidden]{display:none!important}
@media(max-width:760px){.tvMovie>.cinelva-rating-controls:has(.cinelva-rating-date-prompt:not([hidden])){flex:0 0 auto!important}}
`;
style.textContent+=`
.cinelva-rate-dialog .cinelva-date-nav{gap:5px!important}
.cinelva-rate-dialog #cinelvaDateYear,.cinelva-rate-dialog #cinelvaDateMonthSelect{
 min-width:0!important;max-width:100%!important;min-height:32px!important;
 padding:3px 5px!important;border:1px solid #ffffff35!important;
 border-radius:7px!important;background:#33353a!important;color:#fff!important;
 font:600 13px system-ui!important;
}
.cinelva-rate-dialog #cinelvaDateYear{flex:1 1 100px!important}
.cinelva-rate-dialog #cinelvaDateMonthSelect{flex:0 1 74px!important}
.cinelva-rate-dialog .cinelva-date-nav>button{flex:0 0 30px!important;width:30px!important}
`;
style.textContent+=`
/* Small, two-line rating summary on three-column mobile movie cards. */
.cinelva-rating-controls.cinelva-rating-controls-no-gauge{display:flex!important;align-items:center!important;gap:4px!important;padding:3px 4px!important;min-height:32px!important}
.cinelva-rating-controls-no-gauge>.cinelva-rate-button{flex:0 0 21px!important;width:21px!important;min-width:21px!important;height:25px!important;padding:0!important}
.cinelva-rating-controls-no-gauge>.cinelva-rate-button svg{width:16px!important;height:16px!important}
.cinelva-rating-controls-no-gauge>.cinelva-bookmark-button{flex:0 0 19px!important;width:19px!important;min-width:19px!important;height:25px!important;padding:0!important}
.cinelva-rating-controls-no-gauge>.cinelva-bookmark-button svg{width:16px!important;height:16px!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair{display:flex!important;flex:1 1 0!important;flex-direction:column!important;align-items:flex-start!important;gap:0!important;min-width:0!important;max-width:none!important;overflow:hidden!important;font:500 9px/1.25 system-ui,sans-serif!important;letter-spacing:0!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair span{display:block!important;max-width:100%!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;font-size:9px!important;line-height:1.25!important;font-weight:500!important}
`;
style.textContent+=`
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair{gap:2px!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>span{display:flex!important;width:100%!important;align-items:center!important;justify-content:space-between!important;gap:3px!important;font-size:9px!important;line-height:1.25!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair .rating-label{flex:0 1 auto!important;min-width:0!important;font-size:8px!important;white-space:nowrap!important;letter-spacing:-.03em!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair .rating-number{flex:0 0 auto!important;font-size:9px!important;font-variant-numeric:tabular-nums!important;text-align:right!important}
`;
style.textContent+=`
/* Equal-width label column prevents MY/TMDB label length from shifting scores. */
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:1px!important;min-width:0!important;flex:1 1 0!important;width:0!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>span{display:grid!important;grid-template-columns:minmax(0,1fr) 25px!important;align-items:baseline!important;column-gap:2px!important;min-width:0!important;max-width:100%!important;width:100%!important;overflow:hidden!important;white-space:nowrap!important;font-size:8px!important;line-height:1.25!important}
.cinelva-rating-controls-no-gauge .rating-label{display:block!important;overflow:hidden!important;text-overflow:clip!important;white-space:nowrap!important;min-width:0!important;font-size:8px!important;font-weight:500!important;letter-spacing:-.15px!important}
.cinelva-rating-controls-no-gauge .rating-number{display:block!important;width:25px!important;text-align:right!important;white-space:nowrap!important;font-size:9px!important;font-variant-numeric:tabular-nums!important;font-weight:650!important}
`;
style.textContent+=`
/* Mobile: show RATING once, with two fully readable aligned rows. */
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair::before{content:"RATING";display:block!important;grid-column:1!important;color:#aeb5c5;font:600 8px/1.1 system-ui,sans-serif!important;letter-spacing:.6px!important;margin-bottom:1px!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair{gap:0!important;align-content:center!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>span{grid-template-columns:minmax(0,1fr) 23px!important;column-gap:2px!important}
.cinelva-rating-controls-no-gauge .rating-label{font-size:8px!important;letter-spacing:0!important}
.cinelva-rating-controls-no-gauge .rating-number{width:23px!important}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge{min-height:39px!important}
`;
style.textContent+=`
/* Full-width rating rows, with eye/bookmark in a separate action row. */
.cinelva-rating-controls.cinelva-rating-controls-no-gauge{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:3px!important;width:100%!important;min-width:0!important;padding:5px 4px!important;box-sizing:border-box!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair{display:grid!important;grid-template-columns:minmax(0,1fr)!important;flex:none!important;width:100%!important;min-width:0!important;gap:2px!important;overflow:visible!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair::before{content:none!important;display:none!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>span{display:grid!important;grid-template-columns:minmax(0,1fr) 25px!important;gap:2px!important;align-items:center!important;width:100%!important;min-width:0!important;max-width:none!important;overflow:visible!important}
.cinelva-rating-controls-no-gauge .rating-label{font-size:8px!important;line-height:1.3!important;letter-spacing:-.25px!important;white-space:nowrap!important;overflow:visible!important}
.cinelva-rating-controls-no-gauge .rating-number{width:25px!important;text-align:right!important;font-size:9px!important;font-variant-numeric:tabular-nums!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-actions{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:6px!important;width:100%!important;min-width:0!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button{position:relative!important;margin:0!important;flex:0 0 24px!important;width:24px!important;min-width:24px!important;height:24px!important;padding:2px!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button svg{width:17px!important;height:17px!important}
`;
style.textContent+=`
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair .rating-label{font-size:9px!important;letter-spacing:-.3px!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>span:first-child .rating-label,.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>span:first-child .rating-number{color:#e4bd70!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>span:nth-child(2) .rating-label,.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>span:nth-child(2) .rating-number{color:#b8c6d9!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>span{grid-template-columns:minmax(0,1fr) 24px!important}
`;
style.textContent+=`
/* Explicit visible text lines: prevent old nested-span rules from hiding the ratings. */
.cinelva-rating-controls.cinelva-rating-controls-no-gauge{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:4px!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair{display:flex!important;flex-direction:column!important;visibility:visible!important;opacity:1!important;width:100%!important;min-width:0!important;flex:0 0 auto!important;height:auto!important;overflow:visible!important;gap:2px!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>.cinelva-rating-line{display:block!important;visibility:visible!important;opacity:1!important;position:static!important;width:100%!important;height:auto!important;white-space:nowrap!important;overflow:visible!important;font:600 9px/1.4 system-ui,sans-serif!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>.cinelva-rating-personal{color:#e4bd70!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>.cinelva-rating-audience{color:#b8c6d9!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-actions{display:flex!important;justify-content:space-between!important;width:100%!important}
`;
style.textContent+=`
/* ROOT FIX: legacy inline-gauge CSS fixes all controls to 46-64px, clipping ratings. */
.cinelva-rating-controls.cinelva-rating-controls-no-gauge{
 display:flex!important;flex-direction:column!important;grid-template-columns:none!important;grid-template-rows:none!important;
 height:auto!important;min-height:0!important;max-height:none!important;flex:0 0 auto!important;
 overflow:visible!important;align-self:stretch!important;align-content:normal!important;
 padding:6px 7px!important;gap:4px!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-pair{
 display:flex!important;flex-direction:column!important;min-height:30px!important;height:auto!important;
 flex:0 0 auto!important;visibility:visible!important;overflow:visible!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions{
 display:flex!important;flex:0 0 24px!important;height:24px!important;min-height:24px!important;
 align-items:center!important;justify-content:space-between!important;
}
`;
style.textContent+=`
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>.cinelva-rating-personal.is-unwatched{color:#aab0bb!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>.cinelva-rating-audience.is-unrated{color:#9da8b8!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>.cinelva-rating-line{font-size:10px!important;line-height:1.5!important}
`;
style.textContent+=`
.cinelva-rating-controls.cinelva-rating-controls-no-gauge{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;grid-template-rows:auto!important;align-items:center!important;gap:4px!important;padding:5px 6px!important}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-pair{grid-column:1!important;grid-row:1!important;min-height:0!important;gap:1px!important}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions{grid-column:2!important;grid-row:1!important;width:auto!important;height:auto!important;min-height:0!important;display:flex!important;gap:3px!important;align-items:center!important}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge .cinelva-rating-line{font-size:9px!important;line-height:13px!important;height:13px!important;min-height:13px!important}
`;
style.textContent+=`
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions{flex-direction:column!important;justify-content:center!important;align-items:center!important;gap:2px!important}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button{width:22px!important;min-width:22px!important;height:22px!important;flex:0 0 22px!important;padding:2px!important}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-pair{align-self:center!important}
`;
style.textContent+=`
/* Uniform rating tiles across calendar, search and rankings. */
.cinelva-rating-controls.cinelva-rating-controls-no-gauge{
 display:grid!important;grid-template-columns:minmax(0,1fr) 24px!important;grid-template-rows:44px!important;
 width:100%!important;min-width:0!important;height:54px!important;min-height:54px!important;max-height:54px!important;
 box-sizing:border-box!important;padding:5px 7px!important;gap:4px!important;align-items:center!important;overflow:hidden!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-pair{
 display:flex!important;flex-direction:column!important;justify-content:center!important;gap:2px!important;
 width:100%!important;min-width:0!important;height:44px!important;min-height:44px!important;max-height:44px!important;
 overflow:hidden!important;align-self:center!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>.cinelva-rating-line{
 display:block!important;width:100%!important;min-width:0!important;height:16px!important;min-height:16px!important;
 line-height:16px!important;font-size:10px!important;font-weight:600!important;white-space:nowrap!important;
 overflow:hidden!important;text-overflow:clip!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions{
 display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;
 gap:2px!important;width:24px!important;min-width:24px!important;height:44px!important;min-height:44px!important;max-height:44px!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button{
 width:21px!important;min-width:21px!important;max-width:21px!important;height:21px!important;min-height:21px!important;
 max-height:21px!important;flex:0 0 21px!important;padding:1px!important;margin:0!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button svg{width:16px!important;height:16px!important}
`;
style.textContent+=`
/* Consistent value column and matching action button frames. */
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>.cinelva-rating-line{
 display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;column-gap:3px!important;
}
.cinelva-rating-controls-no-gauge .rating-caption{display:block!important;min-width:0!important;white-space:nowrap!important}
.cinelva-rating-controls-no-gauge .rating-value{display:block!important;text-align:right!important;font-variant-numeric:tabular-nums!important;white-space:nowrap!important}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button{
 display:flex!important;align-items:center!important;justify-content:center!important;
 width:21px!important;min-width:21px!important;max-width:21px!important;
 height:21px!important;min-height:21px!important;max-height:21px!important;
 padding:1px!important;border:1px solid #525765!important;border-radius:5px!important;
 background:transparent!important;box-sizing:border-box!important;box-shadow:none!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button svg{
 display:block!important;width:16px!important;height:16px!important;flex:0 0 16px!important;
}
`;
style.textContent+=`
/* Two legible rows: reserve space for right-aligned values before icon column. */
.cinelva-rating-controls.cinelva-rating-controls-no-gauge{
 display:grid!important;grid-template-columns:minmax(0,1fr) 18px!important;
 grid-template-rows:40px!important;column-gap:3px!important;
 padding:4px 5px!important;height:48px!important;min-height:48px!important;max-height:48px!important;
 overflow:visible!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-pair{
 display:grid!important;grid-template-rows:18px 18px!important;
 width:100%!important;min-width:0!important;height:40px!important;min-height:40px!important;max-height:40px!important;
 gap:1px!important;overflow:visible!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>.cinelva-rating-line{
 display:grid!important;grid-template-columns:minmax(0,1fr) minmax(13px,auto)!important;
 width:100%!important;min-width:0!important;height:18px!important;min-height:18px!important;
 gap:2px!important;align-items:center!important;overflow:visible!important;
 font-size:9px!important;line-height:18px!important;
}
.cinelva-rating-controls-no-gauge .rating-caption{font-size:9px!important;white-space:nowrap!important;letter-spacing:-.25px!important}
.cinelva-rating-controls-no-gauge .rating-value{
 font-size:9px!important;display:block!important;min-width:13px!important;text-align:right!important;
 white-space:nowrap!important;overflow:visible!important;font-variant-numeric:tabular-nums!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions{
 display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;
 width:18px!important;min-width:18px!important;max-width:18px!important;height:40px!important;min-height:40px!important;
 gap:2px!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button{
 width:18px!important;min-width:18px!important;max-width:18px!important;
 height:18px!important;min-height:18px!important;max-height:18px!important;flex:0 0 18px!important;
 padding:1px!important;border:1px solid #525765!important;border-radius:4px!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button svg{
 width:14px!important;height:14px!important;min-width:14px!important;min-height:14px!important;flex:0 0 14px!important;
}
`;
style.textContent+=`
/* Match the eye and bookmark exactly, including the clickable frame. */
.cinelva-rating-controls-no-gauge>.cinelva-rating-actions{
 display:grid!important;grid-template-columns:20px!important;grid-template-rows:20px 20px!important;
 row-gap:2px!important;justify-content:center!important;align-content:center!important;
 width:20px!important;min-width:20px!important;max-width:20px!important;
 height:42px!important;min-height:42px!important;
}
.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button{
 appearance:none!important;display:grid!important;place-items:center!important;
 width:20px!important;min-width:20px!important;max-width:20px!important;
 height:20px!important;min-height:20px!important;max-height:20px!important;
 flex:none!important;box-sizing:border-box!important;padding:0!important;margin:0!important;
 border:1px solid #525765!important;border-radius:4px!important;background:transparent!important;
 box-shadow:none!important;transform:none!important;
}
.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button svg{
 display:block!important;width:15px!important;min-width:15px!important;max-width:15px!important;
 height:15px!important;min-height:15px!important;max-height:15px!important;
 margin:0!important;padding:0!important;flex:none!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge{
 grid-template-columns:minmax(0,1fr) 20px!important;column-gap:3px!important;
}
`;
style.textContent+=`
.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>.cinelva-rating-personal .rating-value{
 font-weight:800!important;font-variant-numeric:tabular-nums!important;
}
.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>.cinelva-bookmark-button{
 pointer-events:auto!important;cursor:pointer!important;position:relative!important;z-index:10!important;
 color:#aeb3bd!important;
}
.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>.cinelva-bookmark-button.is-bookmarked{
 color:#f3c84e!important;
}
.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>.cinelva-bookmark-button.is-bookmarked svg{
 fill:#f3c84e!important;stroke:#f3c84e!important;
}
.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>.cinelva-bookmark-button:not(.is-bookmarked) svg{
 fill:none!important;
}
`;
style.textContent+=`
/* Final compact dimensions override all earlier legacy tile rules. */
.cinelva-rating-controls.cinelva-rating-controls-no-gauge{
 grid-template-columns:minmax(0,1fr) 17px!important;grid-template-rows:35px!important;
 height:43px!important;min-height:43px!important;max-height:43px!important;
 padding:4px 5px!important;column-gap:3px!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-pair{
 grid-template-rows:17px 17px!important;height:35px!important;min-height:35px!important;max-height:35px!important;gap:1px!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-pair>.cinelva-rating-line{
 height:17px!important;min-height:17px!important;max-height:17px!important;line-height:17px!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions{
 grid-template-columns:17px!important;grid-template-rows:17px 17px!important;
 width:17px!important;min-width:17px!important;max-width:17px!important;
 height:35px!important;min-height:35px!important;max-height:35px!important;gap:1px!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button{
 width:17px!important;min-width:17px!important;max-width:17px!important;
 height:17px!important;min-height:17px!important;max-height:17px!important;flex:none!important;
}
.cinelva-rating-controls.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>button svg{
 width:12px!important;min-width:12px!important;max-width:12px!important;
 height:12px!important;min-height:12px!important;max-height:12px!important;flex:none!important;
}
`;
style.textContent+=`
.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>.cinelva-bookmark-button.is-bookmarked{color:#329cff!important}
.cinelva-rating-controls-no-gauge>.cinelva-rating-actions>.cinelva-bookmark-button.is-bookmarked svg{fill:#329cff!important;stroke:#329cff!important}
#cinelva-bookmark-toast{position:fixed;left:50%;bottom:calc(28px + env(safe-area-inset-bottom,0px));transform:translate(-50%,12px);opacity:0;pointer-events:none;z-index:2147483647;background:#272e3b;color:#fff;border:1px solid #50617a;border-radius:20px;padding:9px 16px;font:600 13px system-ui;box-shadow:0 5px 24px #0009;transition:opacity .2s,transform .2s;white-space:nowrap}
#cinelva-bookmark-toast.is-visible{opacity:1;transform:translate(-50%,0)}
.cinelva-review-method{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.cinelva-review-method label{min-width:0}
.cinelva-review-method select{width:100%;max-width:100%}
.cinelva-review-method label[hidden]{display:none!important}
`;
root.CinelvaQuickRate={open,normalize,mountInline(target,movie){if(!target||target.dataset.gaugeMounted||!validId(canonicalId(movie)))return false;target.dataset.gaugeMounted='true';target.textContent='';const button=document.createElement('button');button.type='button';button.className='cinelva-rate-button';button.innerHTML=reviewIcon;button.setAttribute('aria-label','レビューを編集');button.onclick=e=>{e.preventDefault();e.stopPropagation();open(movie);};target.append(button);attachInlineScore(button,movie);return true;}};
function mountRecordReviews(scope=document){const nodes=[...(scope.matches?.('.record-common-review')?[scope]:[]),...(scope.querySelectorAll?.('.record-common-review')||[])];if(!nodes.length)return;const records=allRecords();for(const slot of nodes){if(slot.dataset.gaugeMounted)continue;const movie=records.find(r=>String(r.id)===slot.dataset.recordId);if(movie)root.CinelvaQuickRate.mountInline(slot,{...movie,tmdbId:root.CinelvaMovieIdentity?.id(movie)||root.CinelvaMovieIdentity?.id(root.CinelvaMovieIdentity?.resolve(movie))||undefined,_localRecord:!(root.CinelvaMovieIdentity?.id(movie)||root.CinelvaMovieIdentity?.id(root.CinelvaMovieIdentity?.resolve(movie)))});}}
if(typeof MutationObserver!=='undefined'){const start=()=>{mountRecordReviews();new MutationObserver(rows=>{for(const row of rows)for(const node of row.addedNodes)if(node.nodeType===1)mountRecordReviews(node)}).observe(document.body,{childList:true,subtree:true})};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();}


})(window);
