from pathlib import Path

# Calendar/detail page: integrate current viewing status into timeline,
# add five-star format recommendations, and keep Critic Map links recoverable by title.
p=Path('index.html')
s=p.read_text(encoding='utf-8')

start=s.find('function movieTimelineHtml(m){')
end=s.find('function movieHistoryHtml(m){', start)
if start < 0 or end < 0:
    raise SystemExit('movieTimelineHtml markers not found')

timeline=r'''function movieTimelineHtml(m){
 const items=[],seen=new Set(),av=m.id&&(availabilitySnapshot.movies||{})[String(m.id)];
 const add=(date,type,label,detail,source,note,status)=>{
  if(!date)return;
  const k=[date,type,label,detail].join("|");if(seen.has(k))return;seen.add(k);
  items.push({date,type,label,detail:detail||"",source:source||"",note:note||"",status:status||""})
 };
 related(m).forEach(x=>{
  if(x.event==="theatrical"||x.service==="劇場公開")add(x.date,"theatrical","劇場公開",x.service==="劇場公開"?"国内劇場公開データ":x.service,x.source_url,"カレンダー掲載データ","listed");
  else if(x.event==="streaming")add(x.date,"streaming","配信開始",x.service,x.source_url,"カレンダー掲載データ","listed");
  else if(x.event==="tv")add(x.date,"tv","TV放映",[(x.program||x.service),x.time].filter(Boolean).join(" · "),x.source_url,"カレンダー掲載データ","listed");
 });
 const key=normTitle(m.title),alt=normTitle(m.original_title||"");
 (releaseHistory.records||[]).filter(x=>{
   if(m.id&&x.id&&String(m.id)===String(x.id))return true;
   let t=normTitle(x.title),o=normTitle(x.original_title||"");
   return t===key||(alt&&t===alt)||(o&&(o===key||o===alt))
 }).forEach(r=>{
   const confirmed=r.record_type==="放送局の公式過去番組ページ";
   const type=r.kind==="tv"?"tv":r.kind==="streaming"?"streaming":"theatrical";
   const label=type==="tv"?"TV放映":type==="streaming"?"配信開始":"劇場公開";
   add(r.date,type,label,[r.service,r.program,r.time].filter(Boolean).join(" · "),r.source_url,confirmed?"公式の過去記録":"当時掲載された予定・公開日",confirmed?"confirmed":"scheduled")
 });
 if(av&&av.checked_at){
   const d=String(av.checked_at).slice(0,10),services=[...(av.flatrate||av.services||[]),...(av.rent||[]),...(av.buy||[])];
   if(services.length)add(d,"availability","現在の配信状況を観測",[...new Set(services)].join(" / "),av.source_url,"観測日であり配信開始日ではありません","observed");
 }
 items.sort((a,b)=>a.date.localeCompare(b.date)||a.type.localeCompare(b.type));
 const flat=av?(av.flatrate||av.services||[]):[],rent=av?(av.rent||[]):[],buy=av?(av.buy||[]):[];
 const nowRows=[flat.length?'<b>見放題</b> '+flat.join(" / "):"",rent.length?'<b>レンタル</b> '+rent.join(" / "):"",buy.length?'<b>購入</b> '+buy.join(" / "):""].filter(Boolean);
 const upcoming=related(m).filter(x=>x.event==="tv"&&x.date>=new Date().toLocaleDateString("sv-SE")).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
 const nowHtml='<div class="timelineNow"><div><strong>いま観る</strong><span>'+(nowRows.length?nowRows.join('<br>'):'配信先を確認できていません')+'</span></div><div><strong>次のTV放映</strong><span>'+(upcoming.length?upcoming.map(x=>(x.program||x.service)+' '+x.date+(x.time?' '+x.time:'')).join('<br>'):'放映予定を確認できていません')+'</span></div></div>';
 if(!items.length)return '<section class="detailSection history timelineSection"><div class="timelineHead"><div><p class="eyebrow">NOW / HISTORY</p><h3>公開・視聴タイムライン</h3></div></div>'+nowHtml+'<div class="small" style="margin-top:10px">出典または観測記録を確認できる履歴がまだありません。</div></section>';
 const typeName={theatrical:"THEATER",streaming:"STREAMING",tv:"TV",availability:"NOW"};
 return '<section class="detailSection history timelineSection"><div class="timelineHead"><div><p class="eyebrow">NOW / HISTORY</p><h3>公開・視聴タイムライン</h3></div><span class="small">'+items.length+' records</span></div>'+nowHtml+'<div class="movieTimeline">'+items.map(x=>'<div class="timelineItem"><div class="timelineRail"><i></i></div><div class="timelineBody"><div class="timelineMeta"><time>'+x.date+'</time><span>'+typeName[x.type]+'</span></div><b>'+x.label+'</b>'+(x.detail?'<div class="small">'+x.detail+'</div>':'')+'<div class="timelineNote small">'+x.note+(x.source?' · <a target="_blank" rel="noopener noreferrer" href="'+x.source+'">出典</a>':'')+'</div></div></div>').join("")+'</div><p class="small timelineCaution">予定データ・過去の実施記録・現在の配信状況の観測を区別しています。観測日は配信開始日を意味しません。</p></section>'
}
'''
s=s[:start]+timeline+s[end:]

start=s.find('function experienceFitHtml(m){')
end=s.find('function festivalAwardOrg', start)
if start < 0 or end < 0:
    raise SystemExit('experienceFitHtml markers not found')

experience=r'''function experienceFitHtml(m){
 const g=(m.genres||[]).join(" ").toLowerCase(),text=[m.title,m.overview,...(m.genres||[])].join(" ").toLowerCase();
 const action=/アクション|action|adventure|アドベンチャー|sf|science fiction|fantasy|ファンタジー|戦争|war/.test(g);
 const visual=action||/宇宙|映像|自然|海|壮大|スペクタクル|animation|アニメ/.test(text);
 const music=/music|音楽|ミュージカル|concert|ライブ|歌|band|バンド/.test(text);
 const drama=/ドラマ|drama|歴史|history|crime|犯罪/.test(g);
 const rows=[
  {name:"IMAX",score:visual?5:action?4:3,reason:visual?"大画面と画角の広さを活かしやすい作品。":"IMAX版が設定されている場合は大画面で観る価値があります。",anchor:"visual"},
  {name:"Dolby Cinema",score:(visual||drama)?5:4,reason:visual?"高コントラスト映像と立体音響をまとめて重視したい場合に最有力。":"映像と音の両方を高品質で楽しみたい場合におすすめ。",anchor:"visual"},
  {name:"Dolby Atmos",score:(music||action)?5:4,reason:music?"音楽・音響表現を立体的に味わいやすい作品。":"空間を使った音響を重視するなら有力。",anchor:"audio"},
  {name:"4DX / MX4D",score:action?4:2,reason:action?"動きの大きいシーンを体感演出で楽しみやすい作品。":"体感演出を最優先したい場合の選択肢。",anchor:"special"},
  {name:"SCREENX",score:visual?4:2,reason:visual?"横方向まで広がる画面体験と相性がよい可能性があります。":"SCREENX版が設定されている場合の選択肢。",anchor:"special"}
 ];
 rows.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,"ja"));
 const max=rows[0].score,stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
 return '<section class="detailSection experienceFit"><h3>どの上映方式で観る？</h3><p class="small" style="margin:0 0 12px">作品のジャンル・概要からCinemap独自の相性を5段階で表示します。公式対応が未確認の方式は断定しません。</p><div class="experienceFitGrid">'+rows.map(x=>'<a class="experienceFitCard '+(x.score===max?'best':'')+'" href="experience.html#'+x.anchor+'"><span><b>'+x.name+'</b><em class="experienceStars" aria-label="'+x.score+' / 5">'+stars(x.score)+'</em></span><small>'+x.reason+'</small><i>違いを見る →</i></a>').join("")+'</div><p class="small" style="margin-top:9px">★はCinemap独自のおすすめ度です。実際の上映方式は作品・劇場・上映回によって異なります。</p><a class="experienceTheaterLink" href="theaters.html?search='+encodeURIComponent(m.title||"")+'">対応する映画館・上映を探す →</a></section>'
}
'''
s=s[:start]+experience+s[end:]

# Remove the now-redundant separate current-viewing section from the detail flow.
s=s.replace("+timeline+experienceFit+watch+info", "+timeline+experienceFit+info")
# Critic Map links carry title as a recovery key.
s=s.replace("critic.html?id='+encodeURIComponent(m.tmdbId||m.id)+'\">Critic Mapを開く", "critic.html?id='+encodeURIComponent(m.tmdbId||m.id)+'&search='+encodeURIComponent(m.title||'')+'\">Critic Mapを開く")

if '/* timeline integrated + format stars */' not in s:
    s=s.replace('</style></head>', '''
/* timeline integrated + format stars */
.timelineNow{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0 15px}.timelineNow>div{border:1px solid #2d3036;border-radius:7px;padding:9px 10px;background:#111}.timelineNow strong{display:block;font-size:10px;color:#ddd;margin-bottom:5px}.timelineNow span{display:block;font-size:10px;line-height:1.55;color:#aaa}.experienceFitCard.best{border-color:#75652f;background:linear-gradient(135deg,#191710,#0b0d11)}.experienceStars{font-style:normal!important;color:#f0c86a!important;border:0!important;padding:0!important;font-size:12px!important;letter-spacing:.03em!important}.experienceFitCard.best b:after{content:"  おすすめ";font-size:8px;color:#f0c86a;font-weight:700}
@media(max-width:600px){.timelineNow{grid-template-columns:1fr}}
</style></head>''',1)
s=s.replace('Cinemap v0.4.72','Cinemap v0.4.73')
p.write_text(s,encoding='utf-8')

# Discover creator-origin links should also preserve the originating title for Critic Map fallback.
p=Path('discover.html')
s=p.read_text(encoding='utf-8')
s=s.replace("'<a href=\"critic.html?id='+encodeURIComponent(fromId)+'\">元の作品のCritic Mapへ戻る</a>'", "'<a href=\"critic.html?id='+encodeURIComponent(fromId)+'&search='+encodeURIComponent(fromTitle||'')+'\">元の作品のCritic Mapへ戻る</a>'")
p.write_text(s,encoding='utf-8')
print('final detail polish applied')
