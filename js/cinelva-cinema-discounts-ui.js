(()=>{
 'use strict';
 const host=document.getElementById('discounts'),D=globalThis.CinelvaCinemaDiscounts;
 if(!host||!D)return;
 const key='cinelva-cinema-discount-benefits-v1';
 const escaped=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const official=value=>{try{const u=new URL(value);return u.protocol==='https:'&&['www.tohotheater.jp','hlo.tohotheater.jp','109cinemas.net','cinecitta.co.jp','www.aeoncinema.com','theater.aeoncinema.com'].includes(u.hostname)?escaped(u.href):'';}catch(_){return '';}};
 const money=value=>Number(value).toLocaleString('ja-JP')+'円';
 const dayLabel=date=>{const d=new Date(date+'T00:00:00Z');return `${d.getUTCMonth()+1}/${d.getUTCDate()}（${'日月火水木金土'[d.getUTCDay()]}）`;};
 let data=null,saved=[];
 try{const v=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(v))saved=v.filter(x=>typeof x==='string');}catch(_){}
 host.innerHTML=`<h2>映画館で安く見る</h2>
 <p class="discountMuted">横浜・川崎の確認済み6館。一般大人1名・通常2D席の料金を、日付と使える割引で比較できます。</p>
 <div class="discountControls">
  <label class="discountField" for="discountDate">鑑賞日<input type="date" id="discountDate"></label>
  <label class="discountField" for="discountArea">エリア<select id="discountArea"><option value="">横浜・川崎</option><option value="横浜">横浜</option><option value="川崎">川崎</option></select></label>
  <label class="discountCheck"><input type="checkbox" id="discountEvening">20時以降の回の料金で比較</label>
 </div>
 <details open><summary>利用中の会員サービス・対象カード</summary>
  <p class="discountMuted">すでに条件を満たしているものだけ選択してください。料金は本人1名分です。入会費・年会費・月額料金は含みません。</p>
  <div id="discountBenefits" class="discountBenefits"></div>
  <p id="discountStorage" class="discountMuted">選択内容はこの端末のブラウザーに保存します。カード番号や会員番号の入力は不要です。</p>
 </details>
 <p class="discountMuted">これから14日間の料金目安（円・税込）</p>
 <div id="discountCalendar" class="discountCalendar" aria-label="料金比較カレンダー"></div>
 <div id="discountSummary" class="discountStatus" role="status" aria-live="polite">料金情報を読み込んでいます…</div>
 <div id="discountResults" class="discountResults"></div>
 <details><summary>比較対象と料金について</summary>
  <p class="discountMuted">公式料金表を確認して掲載した一部の料金です。掲載館・割引を網羅しておらず、上映作品・空席・上映回の有無は確認していません。選んだ日に作品が上映されるかは、各館の公式スケジュールでご確認ください。</p>
  <p class="discountMuted">IMAX・3D・4DX・LIVE ZOUNDなどの特殊上映、特別席、特別興行は追加料金や割引対象外となる場合があります。学生・シニア・ペア・朝の割引、ポイント・個別クーポン・前売券は比較対象外です。複数の割引を足し合わせず、選択条件に合う掲載料金を比較しています。</p>
  <p class="discountMuted">料金は変更される場合があります。確認から60日を過ぎた情報や、その確認期限を超える日付の金額は表示しません。最新料金と適用条件は公式サイトでご確認ください。</p>
 </details>`;
 const dateInput=host.querySelector('#discountDate'),areaInput=host.querySelector('#discountArea'),eveningInput=host.querySelector('#discountEvening'),results=host.querySelector('#discountResults'),summary=host.querySelector('#discountSummary'),calendar=host.querySelector('#discountCalendar'),benefits=host.querySelector('#discountBenefits');
 dateInput.value=D.today();dateInput.min=D.today();dateInput.max=D.addDays(D.today(),60);
 function options(){return {date:dateInput.value,area:areaInput.value,evening:eveningInput.checked,benefits:[...benefits.querySelectorAll('input:checked')].map(x=>x.dataset.discountBenefit)};}
 function render(){
  if(!data)return;
  const opts=options(),rows=D.compare(data,opts);
  calendar.innerHTML=D.calendar(data,{...opts,date:D.today()}).map(d=>`<button type="button" class="discountDay" data-discount-date="${d.date}" aria-label="${dayLabel(d.date)} ${d.price===null?'料金確認待ち':money(d.price)}" aria-pressed="${d.date===opts.date}"><span>${dayLabel(d.date).split('（')[0]}</span><span>${dayLabel(d.date).split('（')[1].replace('）','')}</span><b>${d.price===null?'未確認':String(d.price)}</b></button>`).join('');
  const count=rows.filter(r=>r.best).length;
  summary.textContent=rows.length?`${dayLabel(opts.date)} · ${rows.length}館を料金順に表示（${count}館の料金情報あり）。上映の有無は公式サイトでご確認ください。`:'今日以降の有効な日付を選択してください。';
  results.innerHTML=rows.map(v=>{
   const b=v.best,source=official(v.sourceUrl),schedule=official(v.scheduleUrl);
   const rest=v.offers.slice(1).map(o=>`<li>${escaped(o.label)}：${money(o.price)}<br>${escaped(o.condition)}</li>`).join('');
   return `<article class="discountCard" data-discount-venue="${escaped(v.id)}"><h3>${escaped(v.name)}</h3><div class="discountMuted">${escaped(v.place)}</div>
    ${b?`<div class="discountPrice" data-price="${b.price}">${money(b.price)} <small>税込／1名</small></div><p class="discountOffer">${escaped(b.label)}</p><p class="discountCondition">${escaped(b.condition)}</p>`:'<p class="discountPrice"><small>料金の再確認待ち</small></p><p class="discountCondition">料金を確認できないため、金額は公式サイトでご確認ください。</p>'}
    ${rest?`<details class="discountAlternatives"><summary>ほかの適用候補</summary><ul>${rest}</ul></details>`:''}
    <p class="discountMuted discountCondition">料金確認日：${escaped(v.verifiedAt||'未確認')}</p>
    <div class="discountLinks">${source?`<a href="${source}" target="_blank" rel="noopener noreferrer">公式料金・条件</a>`:''}${schedule?`<a href="${schedule}" target="_blank" rel="noopener noreferrer">公式上映スケジュール</a>`:''}</div></article>`;
  }).join('');
 }
 async function load(){
  data=null;results.innerHTML='';calendar.innerHTML='';summary.textContent='料金情報を読み込んでいます…';
  try{
   const response=await fetch('data/cinema_discounts.json?v=20261025',{cache:'no-cache'});
   if(!response.ok)throw Error('data unavailable');
   const next=await response.json();
   if(next.version!==1||!Array.isArray(next.venues)||!next.venues.length||!Array.isArray(next.benefits))throw Error('invalid data');
   data=next;
   benefits.innerHTML=data.benefits.map(b=>`<label class="discountCheck"><input type="checkbox" data-discount-benefit="${escaped(b.id)}" ${saved.includes(b.id)?'checked':''}><span>${escaped(b.label)}<small>${escaped(b.condition)}</small></span></label>`).join('');
   render();
  }catch(_){data=null;results.innerHTML='';calendar.innerHTML='';summary.innerHTML='<div class="discountError">料金情報を読み込めませんでした。<button type="button" id="discountRetry">再読み込み</button></div>';}
 }
 host.addEventListener('change',event=>{
  if(event.target.matches('[data-discount-benefit]')){
   saved=options().benefits;
   try{localStorage.setItem(key,JSON.stringify(saved));}catch(_){host.querySelector('#discountStorage').textContent='このブラウザーでは選択内容を保存できません。このページでは選択した条件を利用できます。';}
  }
  render();
 });
 host.addEventListener('click',event=>{
  const day=event.target.closest('[data-discount-date]');
  if(day){dateInput.value=day.dataset.discountDate;render();}
  if(event.target.closest('#discountRetry'))load();
 });
 load();
})();
