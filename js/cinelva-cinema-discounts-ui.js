(()=>{
 'use strict';
 const host=document.getElementById('discounts'),D=globalThis.CinelvaCinemaDiscounts;
 if(!host||!D)return;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const domains=['www.tohotheater.jp','www.toho-one.com','entm.auone.jp','www.saisoncard.co.jp','www.aeoncinema.com','www.aeon.co.jp','109cinemas.net','help.tjoy.jp','tjoy.jp','www.cinemasunshine.co.jp','help.fod.fujitv.co.jp','www.mcc-9.jp','cinema.korona.co.jp','www.smt-cinema.com','www.unitedcinemas.jp'];
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
 host.innerHTML=`<h2>映画館で安く見る方法</h2>
 <p class="discountMuted">系列共通の割引を、金額・条件・購入手順で見比べられます。劇場ごとに異なる料金・対象曜日・対象外条件も掲載しています。会員登録なしの割引と、会員・カード向けの優待をまとめました。</p>
 <div class="discountControls">
  <label class="discountField" for="discountDate">鑑賞日<input type="date" id="discountDate"></label>
  <label class="discountField" for="discountChain">映画館・系列<select id="discountChain"><option value="">すべての掲載系列</option></select></label>
 </div>
 <div id="discountTheater" class="discountMuted"></div>
 <p class="discountMuted">一般大人1名・通常2Dの鑑賞券代（税込）です。会員・カードの料金や対象外の劇場を、各方法の中で確認してください。</p>
 <div id="discountSummary" class="discountStatus" role="status" aria-live="polite">割引方法を読み込んでいます…</div>
 <div id="discountResults" class="discountResults"></div>
 <p class="discountMuted">系列を選ぶと、全国の対象劇場で使える方法を確認できます。<a href="#directory">近くの映画館から探す</a>場合は、検索結果の「安く見る方法」から劇場別の条件を確認してください。未掲載の系列・割引もあります。</p>
 <details><summary>料金と掲載範囲について</summary>
  <p class="discountMuted">掲載した割引の利用方法を紹介しています。利用資格・対象劇場・購入枠・特別興行によって適用されない場合があります。新規加入やカード発行には条件があり、当日すぐ使えるとは限りません。</p>
  <p class="discountMuted">学生・シニア・ペア・ポイント・個別クーポン・前売券は比較対象外です。複数の割引は加算していません。全国共通の優待にも対象外の劇場があります。個別の通常料金・営業状況・上映作品・空席は、各館の公式情報で確認してください。</p>
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
 function way(o,upcoming){
  const source=official(o.sourceUrl),feeSource=official(o.feeSourceUrl);
  return `<section class="discountWay"><div class="discountWayHead"><h4>${esc(o.label)}</h4><span class="discountTag">${esc(labels[o.access]||'条件あり')}</span></div>
   <div class="discountPrice" data-price="${o.price}">${price(o)} <small>鑑賞券／1名</small></div>
   <p class="discountDateLabel">${upcoming?'次の対象日：':'選択日に利用できる候補：'}${dayLabel(o.nextDate)}</p>
   <p>${esc(o.condition)}</p><p class="discountFee">${esc(o.feeText)}</p>
   <ol class="discountSteps">${o.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>
   <div class="discountLinks">${source?`<a href="${source}" target="_blank" rel="noopener noreferrer">公式で条件・購入手順を確認</a>`:''}${feeSource?`<a href="${feeSource}" target="_blank" rel="noopener noreferrer">会費の公式情報</a>`:''}</div>
   <p class="discountMuted">条件確認日：${esc(o.verifiedAt)}</p></section>`;
 }
 function render(){
  if(!data)return;
  const rows=D.guide(data,{date:dateInput.value,chain:chainInput.value,theater:selectedTheater});
  const count=rows.reduce((n,c)=>n+c.available.length,0);
  summary.textContent=rows.length?`${dayLabel(dateInput.value)} · ${rows.length}系列・映画館。選択日の割引候補は${count}件です。利用条件を確認してください。`:'今日以降の有効な鑑賞日を選択してください。';
  theaterBox.innerHTML=selectedTheater?`確認する映画館：${esc(selectedTheater)} <button type="button" id="discountClearTheater">系列全体を見る</button>`:'';
  results.innerHTML=rows.map(c=>{
   const publicText=c.publicBest?price(c.publicBest):'対象の掲載割引なし';
   const conditionalText=c.conditionalBest?price(c.conditionalBest):'対象の掲載割引なし';
   const methods=c.available.map(o=>way(o,false)).join('');
   const upcoming=c.upcoming.map(o=>way(o,true)).join('');
   const nextPublic=c.upcoming.find(o=>o.access==='public');
   const nextHint=nextPublic?`<p>日付を変えるなら <strong>${dayLabel(nextPublic.nextDate)} · ${price(nextPublic)}</strong><br>${esc(nextPublic.label)}（掲載した対象館・上映条件に限ります）</p>`:'';
   const url=official(c.theaterUrl);
   return `<article class="discountCard" data-discount-chain="${esc(c.id)}"><h3>${esc(c.name)}</h3><p class="discountMuted">${esc(c.note)}</p>
    <div class="discountOverview"><p>登録不要の掲載料金 <strong>${publicText}</strong></p><p>会員・カード等の条件あり <strong>${conditionalText}</strong></p>${nextHint}</div>
    ${methods||'<p class="discountCondition">この日の対象となる確認済み割引はありません。料金情報の再確認待ち、対象外の劇場の場合もあります。</p>'}
    ${upcoming?`<details class="discountUpcoming"><summary>別の日に使える割引を見る（${c.upcoming.length}件）</summary>${upcoming}</details>`:''}
    ${url?`<div class="discountLinks"><a href="${url}" target="_blank" rel="noopener noreferrer">対象劇場・公式料金を確認</a></div>`:''}</article>`;
  }).join('');
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
 dateInput.addEventListener('change',()=>{updateUrl();render();});
 chainInput.addEventListener('change',()=>{requestedChain=chainInput.value;selectedTheater='';updateUrl();render();});
 host.addEventListener('click',e=>{if(e.target.closest('#discountRetry'))load();if(e.target.closest('#discountClearTheater')){selectedTheater='';updateUrl();render();}});
 load();
})();
