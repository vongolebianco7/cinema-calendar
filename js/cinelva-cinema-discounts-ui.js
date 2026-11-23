
[codex/ui-feedback-20261123 122b01a2] fix: shorten mobile cinema badge text
 1 file changed, 1 insertion(+), 1 deletion(-)
122b01a20d98235c8bccddcdab2311992c8a4cca
f562e0e10fb7dee54eed947fecc3b636c687701d
(()=>{
 'use strict';
 const host=document.getElementById('discounts'),D=globalThis.CinelvaCinemaDiscounts;
 if(!host||!D)return;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const domains=['www.tohotheater.jp','www.toho-one.com','entm.auone.jp','www.saisoncard.co.jp','www.aeoncinema.com','www.aeon.co.jp','109cinemas.net','help.tjoy.jp','tjoy.jp','www.cinemasunshine.co.jp','help.fod.fujitv.co.jp','www.mcc-9.jp','cinema.korona.co.jp','www.smt-cinema.com','www.unitedcinemas.jp','life.bs.benefit-one.inc','bscontents.benefit-one.inc','bs.benefit-one.inc','www.ent.lawson.co.jp','www.tjoy.co.jp','www.ttcg.jp','kinocinema.jp','www.cinemart.co.jp','www.oscinemas.net','www.forum-movie.net'];
 const official=value=>{try{const u=new URL(value);return u.protocol==='https:'&&domains.includes(u.hostname)&&!u.username&&!u.password?esc(u.href):'';}catch(_){return '';}};
 const money=value=>Number(value).toLocaleString('ja-JP')+'円';
 const price=o=>o?o.maxPrice&&o.maxPrice!==o.price?money(o.price).replace('円','')+'〜'+money(o.maxPrice):money(o.price):'未掲載';
 const dayLabel=date=>{const d=new Date(date+'T00:00:00Z');return `${d.getUTCMonth()+1}/${d.getUTCDate()}（${'日月火水木金土'[d.getUTCDay()]}）`;};
 const labels={public:'登録不要',member:'会員向け',card:'対象カードが必要'};
 const prefectures='北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県'.split(' ');
 const shortNames={toho:'TOHO',aeon:'イオン',109:'109',tjoy:'T・ジョイ',sunshine:'サンシャイン',smt:'MOVIX',united:'ユナイテッド',ttcg:'テアトル',corona:'コロナ',forum:'フォーラム',kino:'キノシネマ',cinemart:'シネマート',os:'OS','central-miyazaki':'セントラル'};
 const badgeNames={united:'UC'};
 const chainBadge=(id,name)=>`<span class="discountChainLogo discountChainLogo-${esc(id)}" aria-label="${esc(name)}" title="${esc(name)}">${esc(badgeNames[id]||shortNames[id]||name)}</span>`;
 const winnerText=chains=>chains.length?chains.map(c=>shortNames[c.id]||c.name).join('・'):'系列未掲載';
 const params=new URLSearchParams(location.search),named=params.get('discountTheater')||'';
 let data=null,requestedPrefecture=params.get('discountPrefecture')||params.get('prefecture')||'';
 let selectedPrefs=[...new Set((params.get('discountPrefectures')||requestedPrefecture).split(',').filter(p=>prefectures.includes(p)))];
 const monday=date=>{const day=new Date(date+'T00:00:00Z').getUTCDay();return D.addDays(date,-(day+6)%7);};
 host.innerHTML=`<h2>映画料金カレンダー</h2>
 <div class="discountControls">
  <div class="discountField"><span>都道府県（複数可）</span><button type="button" id="discountPrefOpen">都道府県を選択</button><span id="discountPrefSummary" class="discountMuted"></span><select id="discountPrefecture" hidden aria-hidden="true" tabindex="-1"><option value="">都道府県を選択</option>${prefectures.map(p=>`<option value="${p}">${p}</option>`).join('')}</select></div>
  <label class="discountField discountTimeField" for="discountTime">時間帯<select id="discountTime"><option value="day">昼間</option><option value="evening">夜間（20時以降）</option></select></label>
 </div>
 <input type="date" id="discountDate" hidden aria-hidden="true" tabindex="-1">
 <div id="discountTheater" class="discountMuted"></div>
 <div class="discountCalendarNav"><button type="button" id="discountPrev">前の2週間</button><span id="discountPeriod"></span><button type="button" id="discountNext">次の2週間</button></div>
 <div id="discountCalendar" class="discountCalendar" aria-label="県内の系列別・日別料金 上位3系列"></div>
 <div id="discountSummary" class="discountStatus" role="status" aria-live="polite">料金を読み込んでいます…</div>
 <div id="discountSortControl" class="discountSortControl" hidden><label for="discountSort">系列の並び順<select id="discountSort"><option value="public">登録不要料金（通常）</option><option value="conditional">会員・カード等の料金</option></select></label></div>
 <div id="discountResults" class="discountResults"></div>
 <dialog id="discountPrefDialog" class="discountDetailDialog" aria-labelledby="discountPrefTitle"><div class="discountDialogHead"><h3 id="discountPrefTitle">都道府県を選択</h3><button type="button" id="discountPrefClose">完了 ×</button></div><div class="discountPrefGrid">${prefectures.map(p=>`<label><input type="checkbox" data-pref-check="${p}"> ${p}</label>`).join('')}</div></dialog>
 <div id="discountTheaterPopup" class="discountTheaterPopup" popover="auto" aria-labelledby="discountTheaterTitle"><div class="discountDialogHead"><h3 id="discountTheaterTitle">対象映画館</h3><button type="button" id="discountTheaterClose">閉じる ×</button></div><div id="discountTheaterBody"></div></div>
 <dialog id="discountDetailDialog" class="discountDetailDialog" aria-labelledby="discountDetailTitle"><div class="discountDialogHead"><h3 id="discountDetailTitle">割引の内訳・条件</h3><button type="button" id="discountDialogClose" aria-label="閉じる">閉じる ×</button></div><div id="discountDialogBody"></div></dialog>
 <p id="discountCoverage" class="discountMuted"></p>
 <details><summary>料金と掲載範囲について</summary>
 <p class="discountMuted">公式一覧で所在地を確認した掲載系列・対象館の比較です。県内の全映画館・全割引を網羅するものではありません。未確認の料金や営業状況は推測しません。系列内でも店舗により料金や対象曜日が異なります。各系列の「割引の内訳・条件」で対象館を確認できます。</p>
 <p class="discountMuted">学生・シニア・ペア・個別クーポン・前売券・ポイント交換特典は比較対象外です。会員資格・対象カード・所属団体の契約・購入枠が必要な優待もあります。ベネポは支払いへの充当で、追加値引きには数えません。複数割引の加算はしていません。料金未確認は、その日の掲載対象館について確認済みの料金がない状態です。</p>
 <p class="discountMuted">レイトショーは対象の開始時刻に限ります。実際の上映作品・空席や、特別興行・特別席・特殊上映の追加料金は各館の公式情報で確認してください。料金と所在地情報は、それぞれ確認から60日を超える場合や期限より先の鑑賞日には使いません。</p>
 </details>`;
 const modalStyle=document.createElement('style');modalStyle.textContent=`
 #discounts .discountDetailDialog{box-sizing:border-box;position:fixed;inset:0;margin:auto;width:min(92vw,680px);max-width:680px;max-height:85dvh;overflow:auto;padding:20px;border:1px solid #777;border-radius:16px;background:#161616;color:#f6f6f6;box-shadow:0 20px 70px #000a;line-height:1.6;white-space:normal;overflow-wrap:anywhere;z-index:99999}
 #discounts .discountDetailDialog::backdrop{background:rgba(0,0,0,.76)}
 #discounts .discountDialogHead{display:flex;justify-content:space-between;align-items:center;gap:12px;position:sticky;top:-20px;padding:10px 0;background:#161616;z-index:1;border-bottom:1px solid #444}
 #discounts .discountDialogHead h3{margin:0;font-size:1.1rem}
 #discounts .discountDialogHead button,#discounts .discountDetailButton{cursor:pointer;border:1px solid #777;border-radius:8px;padding:9px 12px;background:#303030;color:#fff;font:inherit}
 #discounts .discountDetailButton{min-width:110px}
 #discounts .discountDetailDialog .discountWay{max-width:100%;min-width:0;overflow-wrap:anywhere}
 #discounts .discountPrefGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:12px 0}
 #discounts .discountPrefGrid label{font-size:14px;padding:9px 5px;min-width:0}
 #discounts #discountPrefOpen,#discounts .discountTheaterOpen{cursor:pointer;padding:10px 12px;border:1px solid #888;border-radius:9px;background:transparent;color:inherit;font:inherit}
 #discounts #discountTheaterBody ul{list-style:none;margin:10px 0;padding:0}
 #discounts #discountTheaterBody li{padding:10px 4px;border-bottom:1px solid #555}

 #discounts .discountTable{width:100%;border-collapse:separate;border-spacing:0 8px;table-layout:fixed}
 #discounts .discountTable caption{text-align:left;font-weight:700;padding:10px 4px}
 #discounts .discountTable thead th{font-size:12px;letter-spacing:.02em;text-align:left;padding:10px 12px;white-space:normal}
 #discounts .discountTable tbody tr{background:rgba(128,128,128,.075)}
 #discounts .discountTable tbody th,#discounts .discountTable tbody td{vertical-align:middle;padding:14px 12px;border-top:1px solid rgba(128,128,128,.22);border-bottom:1px solid rgba(128,128,128,.22)}
 #discounts .discountTable tbody th{border-left:1px solid rgba(128,128,128,.22);border-radius:12px 0 0 12px;text-align:left}
 #discounts .discountTable tbody td:last-child{border-right:1px solid rgba(128,128,128,.22);border-radius:0 12px 12px 0}
 #discounts .discountTable tbody th h3{font-size:15px;line-height:1.35;margin:0 0 6px}
 #discounts .discountTable .discountPrice{font-weight:800;font-size:19px;line-height:1.3;font-variant-numeric:tabular-nums}
 #discounts .discountTable .discountPrice small{display:block;fon…2490 tokens truncated…${d.date}" ${d.date<today?'disabled':''} aria-pressed="${d.date===selectedDate}" aria-label="${esc(dayLabel(d.date))}${d.publicPrice!==null&&d.publicPrice===calendarMin?' 登録不要最安':''} 登録不要上位 ${esc(publicLabel)} 条件付き最安 ${d.conditionalPrice===null?'料金未確認':money(d.conditionalPrice)+' '+d.conditionalChains.map(c=>c.name).join('・')}"><span class="discountDayDate">${Number(d.date.slice(5,7))}/${Number(d.date.slice(8))}<small>${dayLabel(d.date).slice(dayLabel(d.date).indexOf('（'))}</small></span>${d.date<today?'<small class="discountPastLabel">過去日・料金確認対象外</small>':''}${d.publicPrice!==null&&d.publicPrice===calendarMin?'<em class="discountLowestBadge">最安</em>':''}<small class="discountPublicLabel">登録不要・安い順</small><span class="discountCalendarRanks">${ranks||'<span class="discountCalendarUnconfirmed">料金未確認</span>'}</span><span class="discountConditional"><small>会員・カード等</small><b>${d.conditionalPrice===null?'料金未確認':money(d.conditionalPrice)}</b><small class="discountWinner">${esc(winnerText(d.conditionalChains))}</small></span></button>`;};
  const weekLabel=(start)=>{
   const current=monday(today);
   if(start===current)return '今週';
   if(start===D.addDays(current,7))return '翌週';
   return dayLabel(start)+'から';
  };
  host.querySelector('#discountCalendar').innerHTML=days.length?[days.slice(0,7),days.slice(7)].map(week=>
   `<section class="discountWeek"><h3>${weekLabel(week[0].date)}</h3>${week.map(renderDay).join('')}</section>`
  ).join(''):'';
  // Measure the actual Japanese labels and prices, then give all 14 dates the
  // same height. Recalculate when the viewport changes (320px iPhone layout).
  const equalizeDiscountDays=()=>{
   const cards=Array.from(host.querySelectorAll('#discountCalendar .discountDay'));
   for(const card of cards)card.style.height='auto';
   const height=Math.max(0,...cards.map(card=>Math.ceil(card.scrollHeight)+2));
   for(const card of cards)card.style.height=height+'px';
  };
  host._equalizeDiscountDays=equalizeDiscountDays;
  if(!host._discountResizeBound){
   const scheduleEqualize=()=>window.requestAnimationFrame(()=>host._equalizeDiscountDays?.());
   window.addEventListener('resize',scheduleEqualize,{passive:true});
   window.addEventListener('orientationchange',scheduleEqualize,{passive:true});
   const calendar=host.querySelector('#discountCalendar');
   let lastCalendarWidth=calendar?.getBoundingClientRect().width||0;
   if(calendar&&window.ResizeObserver){
    host._discountResizeObserver=new ResizeObserver(entries=>{
     const width=entries[0]?.contentRect?.width??calendar.getBoundingClientRect().width;
     if(Math.abs(width-lastCalendarWidth)>0.5){lastCalendarWidth=width;scheduleEqualize();}
    });
    host._discountResizeObserver.observe(calendar);
   }
   host._discountResizeBound=true;
  }
  equalizeDiscountDays();
  const visiblePrices=rows.map(sortPrice).filter(Number.isFinite),lowest=visiblePrices.length?Math.min(...visiblePrices):undefined;
  summary.textContent=!selectedPrefs.length?'都道府県を選ぶと、選択地域の系列を横断して比較できます。':`${selectedPrefs.join('・')} · ${dayLabel(selectedDate)} · ${timeInput.value==='evening'?'夜間':'昼間'} · ${rows.length}系列`;
  results.innerHTML=!selectedPrefs.length?'':rows.length?`<div class="discountTableScroll"><table class="discountTable"><caption class="discountVisuallyHidden">${esc(selectedPrefs.join('・'))} · ${dayLabel(selectedDate)}</caption><thead><tr><th scope="col">系列</th><th scope="col">登録不要</th><th scope="col">会員・カード等</th><th scope="col">割引の内訳・条件</th></tr></thead><tbody>${rows.map(c=>`<tr data-chain="${esc(c.id)}"${sortPrice(c)===lowest&&lowest!==undefined?' class="discountLowestPrice"':''}${Number.isFinite(sortPrice(c))?` data-price="${sortPrice(c)}"`:''}><th scope="row"><h3>${esc(c.name)}</h3>${sortPrice(c)===lowest&&lowest!==undefined?'<small class="discountPriceBadge">最安</small>':''}<button type="button" class="discountTheaterOpen" data-theater-chain="${esc(c.id)}">${c.theaters.length}館</button></th><td class="discountPrice">${tablePrice(c.publicBest)}${c.publicBest?`<small>${esc(c.publicBest.label)}</small>`:''}</td><td class="discountPrice">${tablePrice(c.conditionalBest)}${c.conditionalBest?`<small>${esc(c.conditionalBest.label)}</small>`:''}</td><td><button type="button" class="discountDetailButton" data-discount-chain="${esc(c.id)}" aria-label="${esc(c.name)}の割引の内訳・条件を開く">内訳・条件（${c.available.length}件）</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="discountError">この日の比較に使える所在地・割引情報は再確認待ちです。最新条件は公式情報をご確認ください。</p>';
  host.querySelector('#discountCoverage').textContent=selectedPrefs.length?`${selectedPrefs.join('・')}の掲載${rows.length}系列・${rows.reduce((n,c)=>n+c.theaters.length,0)}館の所在地と、確認済みの割引を比較しています。未掲載・料金未確認の系列や映画館もあります。日付をタップすると系列ごとの内訳を確認できます。`:'';
 }
 function valid(next){
  const strings=a=>Array.isArray(a)&&a.every(s=>typeof s==='string'&&s.normalize('NFKC').replace(/[\s・･ー−–—-]/g,''));
  return next?.version===1&&next.nationalGuideVersion===1&&next.regionalGuideVersion===1&&Array.isArray(next.chains)&&next.chains.length&&next.chains.every(c=>c&&typeof c.id==='string'&&typeof c.name==='string'&&Array.isArray(c.offers)&&c.offers.every(o=>o&&o.access!=='intro'&&o.repeatability==='recurring'&&Number.isInteger(o.price)&&o.price>0&&typeof o.label==='string'&&typeof o.condition==='string'&&typeof o.feeText==='string'&&strings(o.steps)&&(o.excludedTheaters===undefined||strings(o.excludedTheaters))&&(o.includedTheaters===undefined||strings(o.includedTheaters)&&o.includedTheaters.length)))&&Array.isArray(next.regionalCoverage)&&next.regionalCoverage.length&&next.regionalCoverage.every(r=>r&&prefectures.includes(r.prefecture)&&next.chains.some(c=>c.id===r.chain)&&strings(r.theaters)&&r.theaters.length&&typeof r.verifiedAt==='string'&&official(r.sourceUrl));
 }
 async function load(){
  data=null;results.innerHTML='';summary.textContent='料金を読み込んでいます…';
  try{
   const r=await fetch('data/cinema_discounts.json?v=20261030-calendar-top3',{cache:'no-cache'});if(!r.ok)throw Error('unavailable');
   const next=await r.json();if(!valid(next))throw Error('invalid');data=next;
   if(!prefectures.includes(requestedPrefecture)&&named){const norm=s=>s.normalize('NFKC').replace(/[\s・･ー−–—-]/g,'').toLowerCase();const r=data.regionalCoverage.find(r=>r.theaters.some(t=>norm(t)===norm(named)));requestedPrefecture=r?.prefecture||'';}
   if(!selectedPrefs.length&&prefectures.includes(requestedPrefecture))selectedPrefs=[requestedPrefecture];prefInput.value=selectedPrefs[0]||'';render();
  }catch(_){data=null;results.innerHTML='';summary.innerHTML='<div class="discountError">料金を読み込めませんでした。<button type="button" id="discountRetry">再読み込み</button></div>';}
 }
 timeInput.addEventListener('change',()=>{updateUrl();render();});
 sortInput.addEventListener('change',()=>{updateUrl();render();});
 dateInput.addEventListener('change',()=>{selectedDate=dateInput.value;if(D.addDays(selectedDate,0)&&selectedDate>=today)calendarStart=monday(selectedDate>D.addDays(today,47)?D.addDays(today,47):selectedDate);updateUrl();render();});
 prefInput.addEventListener('change',()=>{selectedPrefs=prefInput.value?[prefInput.value]:[];requestedPrefecture=prefInput.value;updateUrl();render();});
 host.addEventListener('click',e=>{const theater=e.target.closest('[data-theater-chain]');if(theater){const c=activeRows.find(c=>c.id===theater.dataset.theaterChain);if(c){host.querySelector('#discountTheaterTitle').textContent=c.name+' の対象映画館';host.querySelector('#discountTheaterBody').innerHTML='<table class="discountOfferFacts"><thead><tr><th scope="col">対象映画館</th></tr></thead><tbody>'+c.theaters.map(t=>'<tr><td><a href="theaters.html?search='+encodeURIComponent(t.replace(/^.*?：/,''))+'">'+esc(t)+'</a></td></tr>').join('')+'</tbody></table>';theaterPopup.showPopover();const r=theater.getBoundingClientRect(),p=theaterPopup.getBoundingClientRect();theaterPopup.style.left=Math.max(8,Math.min(innerWidth-p.width-8,r.left))+'px';theaterPopup.style.top=Math.max(8,Math.min(innerHeight-p.height-8,r.bottom+6))+'px';}return;}const detail=e.target.closest('[data-discount-chain]');if(detail){const c=activeRows.find(c=>c.id===detail.dataset.discountChain);if(c){returnFocus=detail;dialog.querySelector('#discountDetailTitle').textContent=c.name+' の割引・利用条件';dialogBody.innerHTML='<p class="discountMuted">'+esc(c.note)+'</p>'+(c.available.length?c.available.map(method).join(''):'<p>この日の確認済み割引はありません。公式情報をご確認ください。</p>')+'<p class="discountMuted">県内の掲載対象館：'+c.theaters.map(esc).join('・')+'</p>';dialog.showModal();}return;}const day=e.target.closest('[data-discount-date]');if(day){selectedDate=day.dataset.discountDate;dateInput.value=selectedDate;updateUrl();render();summary.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}if(e.target.closest('#discountPrev')||e.target.closest('#discountNext')){const shift=e.target.closest('#discountPrev')?-14:14;calendarStart=D.addDays(calendarStart,shift);if(calendarStart>monday(D.addDays(today,47)))calendarStart=monday(D.addDays(today,47));if(calendarStart<monday(today))calendarStart=monday(today);selectedDate=calendarStart<today?today:calendarStart;dateInput.value=selectedDate;updateUrl();render();}if(e.target.closest('#discountRetry'))load();});
 load();
})();
