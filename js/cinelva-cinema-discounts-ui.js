(()=>{
 'use strict';
 const host=document.getElementById('discounts'),D=globalThis.CinelvaCinemaDiscounts;
 if(!host||!D)return;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const domains=['www.tohotheater.jp','www.toho-one.com','entm.auone.jp','www.saisoncard.co.jp','www.aeoncinema.com','www.aeon.co.jp','109cinemas.net','help.tjoy.jp','tjoy.jp','www.cinemasunshine.co.jp','help.fod.fujitv.co.jp','www.mcc-9.jp','cinema.korona.co.jp','www.smt-cinema.com','www.unitedcinemas.jp','life.bs.benefit-one.inc','bscontents.benefit-one.inc','bs.benefit-one.inc','www.ent.lawson.co.jp','www.tjoy.co.jp','www.ttcg.jp','kinocinema.jp','www.cinemart.co.jp','www.oscinemas.net','www.forum-movie.net'];
 const official=value=>{try{const u=new URL(value);return u.protocol==='https:'&&domains.includes(u.hostname)&&!u.username&&!u.password?esc(u.href):'';}catch(_){return '';}};
 const money=value=>Number(value).toLocaleString('ja-JP')+'円';
 const price=o=>o?o.maxPrice&&o.maxPrice!==o.price?money(o.price).replace('円','')+'〜'+money(o.maxPrice):money(o.price):'—';
 const dayLabel=date=>{const d=new Date(date+'T00:00:00Z');return `${d.getUTCMonth()+1}/${d.getUTCDate()}（${'日月火水木金土'[d.getUTCDay()]}）`;};
 const labels={public:'登録不要',member:'会員向け',card:'対象カードが必要'};
 const prefectures='北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県'.split(' ');
 const shortNames={toho:'TOHO',aeon:'イオン',109:'109',tjoy:'T・ジョイ',sunshine:'サンシャイン',smt:'MOVIX等',united:'ユナイテッド',ttcg:'テアトル',corona:'コロナ',forum:'フォーラム',kino:'キノシネマ',cinemart:'シネマート',os:'OS','central-miyazaki':'セントラル'};
 const winnerText=chains=>chains.length?chains.map(c=>shortNames[c.id]||c.name).join('・'):'—';
 const params=new URLSearchParams(location.search),named=params.get('discountTheater')||'';
 let data=null,requestedPrefecture=params.get('discountPrefecture')||params.get('prefecture')||'';
 host.innerHTML=`<h2>県内の安い系列・日付を探す</h2>
 <p class="discountMuted">県内の系列をまとめて比較し、どの系列で・いつ安く見られるかをカレンダーで確認できます。サービスデーと、繰り返し使える会員・カード・福利厚生優待を掲載しています。</p>
 <div class="discountControls">
  <label class="discountField" for="discountPrefecture">都道府県<select id="discountPrefecture"><option value="">都道府県を選択</option>${prefectures.map(p=>`<option value="${p}">${p}</option>`).join('')}</select></label>
  <label class="discountField" for="discountDate">鑑賞日<input type="date" id="discountDate"></label>
 </div>
 <div id="discountTheater" class="discountMuted"></div>
 <p class="discountMuted">一般大人1名・通常2Dの鑑賞券代（税込）です。登録不要と会員・カード等の条件付き料金は別に表示します。会費・ポイント消費は含みません。初回加入・初回購入など一度限りの特典は比較対象外です。</p>
 <div id="discountBestDates" class="discountStatus"></div>
 <div class="discountCalendarNav"><button type="button" id="discountPrev">前の2週間</button><span id="discountPeriod"></span><button type="button" id="discountNext">次の2週間</button></div>
 <div id="discountCalendar" class="discountCalendar" aria-label="県内の系列別・日別の掲載最安料金"></div>
 <div id="discountSummary" class="discountStatus" role="status" aria-live="polite">料金を読み込んでいます…</div>
 <div id="discountResults" class="discountResults"></div>
 <p id="discountCoverage" class="discountMuted"></p>
 <details><summary>料金と掲載範囲について</summary>
 <p class="discountMuted">公式一覧で所在地を確認した掲載系列・対象館の比較です。県内の全映画館・全割引を網羅するものではありません。未確認の料金や営業状況は推測しません。系列内でも店舗により料金や対象曜日が異なります。各系列の「割引の内訳・条件」で対象館を確認できます。</p>
 <p class="discountMuted">学生・シニア・ペア・個別クーポン・前売券・ポイント交換特典は比較対象外です。会員資格・対象カード・所属団体の契約・購入枠が必要な優待もあります。ベネポは支払いへの充当で、追加値引きには数えません。複数割引の加算はしていません。</p>
 <p class="discountMuted">レイトショーは対象の開始時刻に限ります。実際の上映作品・空席や、特別興行・特別席・特殊上映の追加料金は各館の公式情報で確認してください。料金と所在地情報は、それぞれ確認から60日を超える場合や期限より先の鑑賞日には使いません。</p>
 </details>`;
 const dateInput=host.querySelector('#discountDate'),prefInput=host.querySelector('#discountPrefecture'),results=host.querySelector('#discountResults'),summary=host.querySelector('#discountSummary');
 const today=D.today();dateInput.min=today;dateInput.max=D.addDays(today,60);
 const requestedDate=params.get('discountDate')||'';
 dateInput.value=D.addDays(requestedDate,0)&&requestedDate>=today&&requestedDate<=dateInput.max?requestedDate:today;
 let calendarStart=dateInput.value>D.addDays(today,47)?D.addDays(today,47):dateInput.value;
 function updateUrl(){
  const p=new URLSearchParams(location.search);p.delete('discountChain');
  if(prefInput.value)p.set('discountPrefecture',prefInput.value);else p.delete('discountPrefecture');
  if(dateInput.value)p.set('discountDate',dateInput.value);else p.delete('discountDate');
  history.replaceState(null,'',location.pathname+(p.toString()?'?'+p:'')+location.hash);
 }
 function method(o){return `<section class="discountWay"><h4>${esc(o.label)} · ${price(o)}</h4><span class="discountTag">${esc(labels[o.access]||'条件あり')}</span><p>${esc(o.condition)}</p><p class="discountFee">${esc(o.feeText)}</p><p class="discountMuted">対象館：${o.applicableTheaters.map(esc).join('・')}</p><ol class="discountSteps">${o.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="discountLinks">${official(o.sourceUrl)?`<a href="${official(o.sourceUrl)}" target="_blank" rel="noopener noreferrer">公式で条件・購入手順を確認</a>`:''}${official(o.feeSourceUrl)?`<a href="${official(o.feeSourceUrl)}" target="_blank" rel="noopener noreferrer">会費・ポイントの公式情報</a>`:''}</div><p class="discountMuted">条件確認日：${esc(o.verifiedAt)}</p></section>`;}
 function render(){
  if(!data)return;
  if(!D.addDays(dateInput.value,0)||dateInput.value<today||dateInput.value>dateInput.max){summary.textContent='今日以降の有効な鑑賞日を選択してください。';results.innerHTML='';return;}
  const options={date:dateInput.value,prefecture:prefInput.value},rows=D.regionalGuide(data,options),days=D.regionalCalendar(data,{...options,date:calendarStart});
  host.querySelector('#discountTheater').textContent=named&&prefInput.value?`選択元：${named}。${prefInput.value}の掲載系列をまとめて比較しています。`:'';
  const publicDays=days.filter(d=>d.publicPrice!==null),periodMin=publicDays.length?Math.min(...publicDays.map(d=>d.publicPrice)):null,minDays=publicDays.filter(d=>d.publicPrice===periodMin);
  host.querySelector('#discountBestDates').textContent=!prefInput.value?'':minDays.length?`この期間の登録不要の最安：${money(periodMin)} · ${dayLabel(minDays[0].date)}${minDays.length>1?` ほか${minDays.length-1}日`:''} · ${winnerText(minDays[0].publicChains)}`:'この期間の登録不要の料金は確認できません。条件付き優待はカレンダーと比較表で確認できます。';
  host.querySelector('#discountPeriod').textContent=days.length?`${dayLabel(days[0].date)}〜${dayLabel(days[days.length-1].date)}`:'';
  host.querySelector('#discountPrev').disabled=calendarStart<=today;host.querySelector('#discountNext').disabled=calendarStart>=D.addDays(today,47);
  host.querySelector('#discountCalendar').innerHTML=days.map(d=>`<button type="button" class="discountDay${d.publicPrice!==null&&d.publicPrice===periodMin?' discountLowest':''}" data-discount-date="${d.date}" aria-pressed="${d.date===dateInput.value}" aria-label="${esc(dayLabel(d.date))} 登録不要${d.publicPrice===null?'確認済み料金なし':money(d.publicPrice)+' '+d.publicChains.map(c=>c.name).join('・')} 条件付き${d.conditionalPrice===null?'確認済み料金なし':money(d.conditionalPrice)+' '+d.conditionalChains.map(c=>c.name).join('・')}"><span>${Number(d.date.slice(5,7))}/${Number(d.date.slice(8))}</span><small>${dayLabel(d.date).slice(dayLabel(d.date).indexOf('（'))}</small><small>登録不要</small><b>${d.publicPrice===null?'—':money(d.publicPrice)}</b><small class="discountWinner">${esc(winnerText(d.publicChains))}</small><small>条件付き</small><b>${d.conditionalPrice===null?'—':money(d.conditionalPrice)}</b><small class="discountWinner">${esc(winnerText(d.conditionalChains))}</small></button>`).join('');
  summary.textContent=!prefInput.value?'都道府県を選ぶと、県内の系列を横断して比較できます。':`${prefInput.value} · ${dayLabel(dateInput.value)} · ${rows.length}系列。条件付き優待も含む掲載鑑賞券代の安い順です。会費・利用資格を確認してください。`;
  results.innerHTML=!prefInput.value?'':rows.length?`<div class="discountTableScroll"><table class="discountTable"><caption>${esc(prefInput.value)} ${dayLabel(dateInput.value)}の系列比較（鑑賞券代）</caption><thead><tr><th scope="col">系列</th><th scope="col">登録不要</th><th scope="col">会員・カード等</th><th scope="col">割引の内訳・条件</th></tr></thead><tbody>${rows.map(c=>`<tr data-chain="${esc(c.id)}"${c.best?` data-price="${c.best.price}"`:''}><th scope="row"><h3>${esc(c.name)}</h3><small>${c.theaters.length}館の所在地確認済み</small></th><td class="discountPrice">${price(c.publicBest)}${c.publicBest?`<small>${esc(c.publicBest.label)}</small>`:''}</td><td class="discountPrice">${price(c.conditionalBest)}${c.conditionalBest?`<small>${esc(c.conditionalBest.label)}</small>`:''}</td><td><details><summary>割引の内訳・条件（${c.available.length}件）</summary><p class="discountMuted">${esc(c.note)}</p>${c.available.length?c.available.map(method).join(''):'<p>この日の確認済み割引はありません。公式情報をご確認ください。</p>'}<p class="discountMuted">県内の掲載対象館：${c.theaters.map(esc).join('・')}</p></details></td></tr>`).join('')}</tbody></table></div>`:'<p class="discountError">この日の比較に使える所在地・割引情報は再確認待ちです。最新条件は公式情報をご確認ください。</p>';
  host.querySelector('#discountCoverage').textContent=prefInput.value?`${prefInput.value}の掲載${rows.length}系列・${rows.reduce((n,c)=>n+c.theaters.length,0)}館の所在地と、確認済みの割引を比較しています。未掲載・料金未確認の系列や映画館もあります。日付をタップすると系列ごとの内訳を確認できます。`:'';
 }
 function valid(next){
  const strings=a=>Array.isArray(a)&&a.every(s=>typeof s==='string'&&s.normalize('NFKC').replace(/[\s・･ー−–—-]/g,''));
  return next?.version===1&&next.nationalGuideVersion===1&&next.regionalGuideVersion===1&&Array.isArray(next.chains)&&next.chains.length&&next.chains.every(c=>c&&typeof c.id==='string'&&typeof c.name==='string'&&Array.isArray(c.offers)&&c.offers.every(o=>o&&o.access!=='intro'&&o.repeatability==='recurring'&&Number.isInteger(o.price)&&o.price>0&&typeof o.label==='string'&&typeof o.condition==='string'&&typeof o.feeText==='string'&&strings(o.steps)&&(o.excludedTheaters===undefined||strings(o.excludedTheaters))&&(o.includedTheaters===undefined||strings(o.includedTheaters)&&o.includedTheaters.length)))&&Array.isArray(next.regionalCoverage)&&next.regionalCoverage.length&&next.regionalCoverage.every(r=>r&&prefectures.includes(r.prefecture)&&next.chains.some(c=>c.id===r.chain)&&strings(r.theaters)&&r.theaters.length&&typeof r.verifiedAt==='string'&&official(r.sourceUrl));
 }
 async function load(){
  data=null;results.innerHTML='';summary.textContent='料金を読み込んでいます…';
  try{
   const r=await fetch('data/cinema_discounts.json?v=20261027-prefecture',{cache:'no-cache'});if(!r.ok)throw Error('unavailable');
   const next=await r.json();if(!valid(next))throw Error('invalid');data=next;
   if(!prefectures.includes(requestedPrefecture)&&named){const norm=s=>s.normalize('NFKC').replace(/[\s・･ー−–—-]/g,'').toLowerCase();const r=data.regionalCoverage.find(r=>r.theaters.some(t=>norm(t)===norm(named)));requestedPrefecture=r?.prefecture||'';}
   prefInput.value=prefectures.includes(requestedPrefecture)?requestedPrefecture:'';render();
  }catch(_){data=null;results.innerHTML='';summary.innerHTML='<div class="discountError">料金を読み込めませんでした。<button type="button" id="discountRetry">再読み込み</button></div>';}
 }
 dateInput.addEventListener('change',()=>{if(D.addDays(dateInput.value,0)&&dateInput.value>=today)calendarStart=dateInput.value>D.addDays(today,47)?D.addDays(today,47):dateInput.value;updateUrl();render();});
 prefInput.addEventListener('change',()=>{requestedPrefecture=prefInput.value;updateUrl();render();});
 host.addEventListener('click',e=>{const day=e.target.closest('[data-discount-date]');if(day){dateInput.value=day.dataset.discountDate;updateUrl();render();}if(e.target.closest('#discountPrev')||e.target.closest('#discountNext')){const shift=e.target.closest('#discountPrev')?-14:14;calendarStart=D.addDays(calendarStart,shift);if(calendarStart>D.addDays(today,47))calendarStart=D.addDays(today,47);if(calendarStart<today)calendarStart=today;dateInput.value=calendarStart;updateUrl();render();}if(e.target.closest('#discountRetry'))load();});
 load();
})();
