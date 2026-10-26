(()=>{
 'use strict';
 const host=document.getElementById('discounts'),D=globalThis.CinelvaCinemaDiscounts;
 if(!host||!D)return;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const domains=['www.tohotheater.jp','www.toho-one.com','entm.auone.jp','www.saisoncard.co.jp','www.aeoncinema.com','www.aeon.co.jp','109cinemas.net','help.tjoy.jp','tjoy.jp','www.cinemasunshine.co.jp','help.fod.fujitv.co.jp','www.mcc-9.jp','cinema.korona.co.jp','www.smt-cinema.com','www.unitedcinemas.jp','life.bs.benefit-one.inc','bscontents.benefit-one.inc','bs.benefit-one.inc'];
 const official=value=>{try{const u=new URL(value);return u.protocol==='https:'&&domains.includes(u.hostname)&&!u.username&&!u.password?esc(u.href):'';}catch(_){return '';}};
 const money=value=>Number(value).toLocaleString('ja-JP')+'円';
 const price=o=>o.maxPrice&&o.maxPrice!==o.price?money(o.price).replace('円','')+'〜'+money(o.maxPrice):money(o.price);
 const dayLabel=date=>{const d=new Date(date+'T00:00:00Z');return `${d.getUTCMonth()+1}/${d.getUTCDate()}（${'日月火水木金土'[d.getUTCDay()]}）`;};
 const labels={public:'会員登録不要',member:'会員登録が必要',card:'対象カードが必要',intro:'初回加入限定'};
 const params=new URLSearchParams(location.search);
 let data=null,selectedTheater=params.get('discountTheater')||'';
 const inferred=D.chainForTheater(selectedTheater);
 let requestedChain=inferred||params.get('discountChain')||'';
 if(!inferred)selectedTheater='';
 host.innerHTML=`<h2>映画館の割引カレンダー</h2>
 <p class="discountMuted">系列共通の割引を、金額・条件・購入手順で見比べられます。劇場ごとに異なる料金・対象曜日・対象外条件も掲載しています。会員登録なしの割引と、会員・カード向けの優待をまとめました。</p>
 <div class="discountControls">
  <label class="discountField" for="discountDate">鑑賞日<input type="date" id="discountDate"></label>
  <label class="discountField" for="discountChain">映画館・系列<select id="discountChain"><option value="">すべての掲載系列</option></select></label>
 </div>
 <div id="discountTheater" class="discountMuted"></div>
 <p class="discountMuted">一般大人1名・通常2Dの鑑賞券代（税込）です。会員・カードの料金や対象外の劇場を、各方法の中で確認してください。</p>
 <p class="discountMuted">カレンダーの日付をタップすると、その日の割引を安い順で比較できます。掲載方法の鑑賞券代を表示しています。会費・ポイント消費は別で、条件付き料金には初回加入限定の優待も含みます。</p>
 <div class="discountCalendarNav"><button type="button" id="discountPrev">前の2週間</button><span id="discountPeriod"></span><button type="button" id="discountNext">次の2週間</button></div>
 <div id="discountCalendar" class="discountCalendar" aria-label="日別の掲載最安料金"></div>
 <div id="discountSummary" class="discountStatus" role="status" aria-live="polite">割引方法を読み込んでいます…</div>
 <div id="discountResults" class="discountResults"></div>
 <p class="discountMuted">系列を選ぶと、全国の対象劇場で使える方法を確認できます。<a href="#directory">近くの映画館から探す</a>場合は、検索結果の「安く見る方法」から劇場別の条件を確認してください。未掲載の系列・割引もあります。</p>
 <details><summary>料金と掲載範囲について</summary>
  <p class="discountMuted">掲載した割引の利用方法を紹介しています。利用資格・対象劇場・購入枠・特別興行によって適用されない場合があります。新規加入やカード発行には条件があり、当日すぐ使えるとは限りません。</p>
  <p class="discountMuted">学生・シニア・ペア・個別クーポン・前売券は比較対象外です。保有ポイントを使った支払額は最安料金に含めません。複数の割引は加算していません。全国共通の優待にも対象外の劇場があります。個別の通常料金・営業状況・上映作品・空席は、各館の公式情報で確認してください。</p>
  <p class="discountMuted">確認から60日を過ぎた割引や、確認期限を超える鑑賞日の金額は表示しません。最新条件は必ず公式ページでご確認ください。</p>
 </details>`;
 const dateInput=host.querySelector('#discountDate'),chainInput=host.querySelector('#discountChain'),results=host.querySelector('#discountResults'),summary=host.querySelector('#discountSummary'),theaterBox=host.querySelector('#discountTheater');
 const today=D.today();dateInput.min=today;dateInput.max=D.addDays(today,60);
 const requestedDate=params.get('discountDate')||'';
 dateInput.value=D.addDays(requestedDate,0)&&requestedDate>=today&&requestedDate<=dateInput.max?requestedDate:today;
 function updateUrl(){
  const p=new URLSearchParams(location.search);
  p.delete('discountPrefecture');
  if(dateInput.value)p.set('discountDate',dateInput.value);else p.delete('discountDate');
  if(chainInput.value)p.set('discountChain',chainInput.value);else p.delete('discountChain');
  if(selectedTheater)p.set('discountTheater',selectedTheater);else p.delete('discountTheater');
  history.replaceState(null,'',location.pathname+(p.toString()?'?'+p:'')+location.hash);
 }
 let calendarStart=dateInput.value>D.addDays(today,47)?D.addDays(today,47):dateInput.value;
 function render(){
  if(!data)return;
  if(!D.addDays(dateInput.value,0)||dateInput.value<today||dateInput.value>dateInput.max){summary.textContent='今日以降の有効な鑑賞日を選択してください。';results.innerHTML='';return;}
  const options={date:dateInput.value,chain:chainInput.value,theater:selectedTheater};
  const rows=D.guide(data,options),offers=rows.flatMap(c=>c.available.map(o=>({...o,chainName:c.name,chainNote:c.note}))).sort((a,b)=>a.price-b.price||(a.maxPrice||a.price)-(b.maxPrice||b.price));
  summary.textContent=`${dayLabel(dateInput.value)} · ${offers.length}件の割引候補。安い順に表示しています。利用条件・追加費用を確認してください。`;
  theaterBox.innerHTML=selectedTheater?`確認する映画館：${esc(selectedTheater)} <button type="button" id="discountClearTheater">系列全体を見る</button>`:'';
  const days=D.guideCalendar(data,{...options,date:calendarStart});
  host.querySelector('#discountPeriod').textContent=days.length?`${dayLabel(days[0].date)}〜${dayLabel(days[days.length-1].date)}`:'';
  host.querySelector('#discountPrev').disabled=calendarStart<=today;
  host.querySelector('#discountNext').disabled=calendarStart>=D.addDays(today,47);
  host.querySelector('#discountCalendar').innerHTML=days.map(d=>`<button type="button" class="discountDay" data-discount-date="${d.date}" aria-pressed="${d.date===dateInput.value}"><span>${Number(d.date.slice(5,7))}/${Number(d.date.slice(8))}</span><small>${dayLabel(d.date).slice(dayLabel(d.date).indexOf('（'))}</small><small>登録不要</small><b>${d.publicPrice===null?'—':money(d.publicPrice)}</b><small>条件付き</small><b>${d.conditionalPrice===null?'—':money(d.conditionalPrice)}</b></button>`).join('');
  results.innerHTML=offers.length?`<div class="discountTableScroll"><table class="discountTable"><caption>${dayLabel(dateInput.value)}の割引比較（鑑賞券代）</caption><thead><tr><th scope="col">割引方法</th><th scope="col">金額</th><th scope="col">条件・使い方</th></tr></thead><tbody>${offers.map(o=>`<tr class="discountWay"><th scope="row"><h4>${esc(o.label)}</h4><small>${esc(o.chainName)}</small><span class="discountTag">${esc(labels[o.access]||'条件あり')}</span></th><td class="discountPrice" data-price="${o.price}">${price(o)}</td><td><p>${esc(o.condition)}</p><p class="discountMuted">${esc(o.chainNote)}</p>${o.excludedTheaters?.length?`<p>対象外：${o.excludedTheaters.map(esc).join('・')}</p>`:''}${o.includedTheaters?.length?`<p>対象劇場：${o.includedTheaters.map(esc).join('・')}</p>`:''}<p class="discountFee">${esc(o.feeText)}</p><details><summary>購入手順・公式情報</summary><ol class="discountSteps">${o.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="discountLinks">${official(o.sourceUrl)?`<a href="${official(o.sourceUrl)}" target="_blank" rel="noopener noreferrer">公式で条件・購入手順を確認</a>`:''}${official(o.feeSourceUrl)?`<a href="${official(o.feeSourceUrl)}" target="_blank" rel="noopener noreferrer">会費・ポイントの公式情報</a>`:''}</div><p>条件確認日：${esc(o.verifiedAt)}</p></details></td></tr>`).join('')}</tbody></table></div>`:'<p class="discountError">この日の対象となる確認済み割引はありません。再確認待ち・対象外の劇場の場合もあります。別の日付や公式情報をご確認ください。</p>';
 }
 function valid(next){
  return next?.version===1&&next.nationalGuideVersion===1&&Array.isArray(next.chains)&&next.chains.length&&next.chains.every(c=>c&&typeof c.id==='string'&&typeof c.name==='string'&&Array.isArray(c.offers)&&c.offers.every(o=>o&&Number.isInteger(o.price)&&o.price>0&&typeof o.label==='string'&&typeof o.condition==='string'&&typeof o.feeText==='string'&&Array.isArray(o.steps)&&o.steps.every(s=>typeof s==='string')&&(o.excludedTheaters===undefined||Array.isArray(o.excludedTheaters)&&o.excludedTheaters.every(s=>typeof s==='string'&&s.trim()))&&(o.includedTheaters===undefined||Array.isArray(o.includedTheaters)&&o.includedTheaters.length>0&&o.includedTheaters.every(s=>typeof s==='string'&&s.trim()))));
 }
 async function load(){
  data=null;results.innerHTML='';summary.textContent='割引方法を読み込んでいます…';
  try{
   const r=await fetch('data/cinema_discounts.json?v=20261026',{cache:'no-cache'});if(!r.ok)throw Error('unavailable');
   const next=await r.json();if(!valid(next))throw Error('invalid');data=next;
   chainInput.innerHTML='<option value="">すべての掲載系列</option>'+data.chains.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
   chainInput.value=data.chains.some(c=>c.id===requestedChain)?requestedChain:'';
   render();
  }catch(_){data=null;results.innerHTML='';summary.innerHTML='<div class="discountError">割引方法を読み込めませんでした。<button type="button" id="discountRetry">再読み込み</button></div>';}
 }
 dateInput.addEventListener('change',()=>{if(D.addDays(dateInput.value,0)&&dateInput.value>=today)calendarStart=dateInput.value>D.addDays(today,47)?D.addDays(today,47):dateInput.value;updateUrl();render();});
 chainInput.addEventListener('change',()=>{requestedChain=chainInput.value;selectedTheater='';updateUrl();render();});
 host.addEventListener('click',e=>{const day=e.target.closest('[data-discount-date]');if(day){dateInput.value=day.dataset.discountDate;updateUrl();render();}if(e.target.closest('#discountPrev')||e.target.closest('#discountNext')){const shift=e.target.closest('#discountPrev')?-14:14;calendarStart=D.addDays(calendarStart,shift);if(calendarStart>D.addDays(today,47))calendarStart=D.addDays(today,47);if(calendarStart<today)calendarStart=today;dateInput.value=calendarStart;updateUrl();render();}if(e.target.closest('#discountRetry'))load();if(e.target.closest('#discountClearTheater')){selectedTheater='';updateUrl();render();}});
 load();
})();
