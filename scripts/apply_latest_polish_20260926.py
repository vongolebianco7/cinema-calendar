from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s): (ROOT/p).write_text(s,encoding='utf-8')

# ---------- Discover: hard-lock recommendation rails + more AI examples ----------
p='discover.html'; s=read(p)
css='''\n/* recommendation rail hard lock */
.popularShelves,.popularShelves .presetShelf{min-width:0;max-width:100%;overflow:hidden}
.popularShelves .presetShelfGrid{display:flex!important;flex-wrap:nowrap!important;grid-template-columns:none!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:auto!important;overflow-y:hidden!important;overscroll-behavior-x:contain;touch-action:pan-x;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;padding:2px 1px 10px!important}
.popularShelves .presetCard{display:block!important;flex:0 0 92px!important;width:92px!important;min-width:92px!important;max-width:92px!important;scroll-snap-align:start}
@media(max-width:650px){.popularShelves .presetCard{flex-basis:84px!important;width:84px!important;min-width:84px!important;max-width:84px!important}}
'''
if 'recommendation rail hard lock' not in s:
    s=s.replace('</style>',css+'</style>',1)
old='<div class="conciergeExamples"><button>インターステラーが好き。似た映画を5本</button><button>130分以内で評価の高いSF</button><button>U-NEXTで見られる重厚な映画</button></div>'
new='''<div class="conciergeExamples"><button>インターステラーが好き。似た映画を5本</button><button>130分以内で評価の高いSF</button><button>U-NEXTで見られる重厚な映画</button><button>90分前後で後味がいい映画</button><button>雨の日に観たい静かな映画</button><button>映像美が圧倒的なSF</button><button>実話ベースで重い作品</button><button>家族と観られる高評価作品</button><button>2000年代の隠れた名作</button><button>Prime Videoで観られる犯罪映画</button><button>2時間超でも退屈しない大作</button><button>映画史的に重要な作品</button></div>'''
if old in s:
    s=s.replace(old,new,1)
s=s.replace('Cinemap v1.5.7','Cinemap v1.5.8')
write(p,s)

# ---------- Search detail: merge timeline/status + 5-star format recommendations ----------
p='search.html'; s=read(p)
css='''\n/* integrated viewing timeline + format recommendations */
.watchTimeline{display:grid;gap:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#111}.watchTimelineRow{display:grid;grid-template-columns:64px minmax(0,1fr);gap:10px;padding:10px 11px;border-top:1px solid #252525}.watchTimelineRow:first-child{border-top:0}.watchTimelineWhen{font-size:9px;color:#777;font-weight:850}.watchTimelineLabel{font-size:11px;font-weight:850}.watchTimelineDetail{font-size:10px;color:#999;margin-top:3px;line-height:1.45}.formatRatings{display:grid;gap:7px;margin-top:10px}.formatRating{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:10px 11px;border:1px solid #2d2d2d;border-radius:9px;background:#131313}.formatRating b{font-size:11px}.formatRating small{display:block;color:#888;font-size:9px;margin-top:4px;line-height:1.45}.formatStars{font-size:12px;letter-spacing:.05em;color:#f0c86a;white-space:nowrap;font-weight:900}.formatNote{font-size:9px;color:#666;line-height:1.5;margin-top:8px}.formatLink{display:inline-block;margin-top:9px;color:#ddd;font-size:10px}.formatRating.best{border-color:#665d39;background:#191710}
'''
if 'integrated viewing timeline + format recommendations' not in s:
    s=s.replace('</style>',css+'</style>',1)
helpers=r'''
function starText(n){n=Math.max(1,Math.min(5,Math.round(Number(n)||1)));return "★".repeat(n)+"☆".repeat(5-n)}
function viewingTimelineHtml(m,av){
 const rows=[];
 if(m.date)rows.push({when:String(m.date).slice(0,10),label:"公開日",detail:"劇場公開・作品データ"});
 if(av.flatrate&&av.flatrate.length)rows.push({when:"現在",label:"見放題",detail:av.flatrate.join(" / ")});
 if(av.rent&&av.rent.length)rows.push({when:"現在",label:"レンタル",detail:av.rent.join(" / ")});
 if(av.buy&&av.buy.length)rows.push({when:"現在",label:"購入",detail:av.buy.join(" / ")});
 if(!rows.some(x=>x.when==="現在"))rows.push({when:"現在",label:"配信",detail:"配信情報を確認できていません。"});
 return '<div class="watchTimeline">'+rows.map(x=>'<div class="watchTimelineRow"><div class="watchTimelineWhen">'+E(x.when)+'</div><div><div class="watchTimelineLabel">'+E(x.label)+'</div><div class="watchTimelineDetail">'+E(x.detail)+'</div></div></div>').join("")+'</div>'
}
function formatRecommendationsHtml(m){
 const genres=(m.genres||[]).join(" ").toLowerCase(),overview=String(m.overview||"").toLowerCase(),guide=String(m.viewing_guide?.best||"").toLowerCase()+" "+String((m.viewing_guide?.reasons||[]).join(" ")).toLowerCase(),text=genres+" "+overview+" "+guide;
 const visual=/サイエンスフィクション|science fiction|sf|ファンタジー|fantasy|アニメ|animation|宇宙|映像|自然|海|壮大/.test(text),action=/アクション|action|アドベンチャー|adventure|戦争|war/.test(text),sound=/音楽|music|ミュージカル|musical|ライブ|concert/.test(text),intense=/ホラー|horror|スリラー|thriller/.test(text);
 const rows=[
  {name:"IMAX / IMAX GT",score:visual||action?4:3,reason:visual||action?"大画面・高解像度との相性が高い作品傾向":"画面スケールを重視するなら候補"},
  {name:"Dolby Cinema",score:visual||intense?4:3,reason:visual||intense?"高コントラスト映像と立体音響を活かしやすい":"映像と音をバランスよく強化"},
  {name:"Dolby Atmos",score:sound||action||intense?4:3,reason:sound||action||intense?"音楽・効果音・空間表現を楽しみやすい":"音響を重視するなら候補"},
  {name:"4DX / MX4D",score:action?4:2,reason:action?"動きの大きい場面を体感型で楽しみやすい":"体感演出との相性は作品次第"},
  {name:"SCREENX",score:action||visual?4:2,reason:action||visual?"広がりのある画作りを体感しやすい":"横方向の拡張映像は対応場面次第"},
  {name:"通常上映",score:3,reason:"演出をそのまま落ち着いて観たい場合の基準"}
 ];
 const boost=(re,needle)=>{if(re.test(guide)){const r=rows.find(x=>x.name.includes(needle));if(r)r.score=5}};
 boost(/imax/,"IMAX");boost(/dolby cinema/,"Dolby Cinema");boost(/dolby atmos|atmos/,"Dolby Atmos");boost(/4dx|mx4d/,"4DX");boost(/screenx/,"SCREENX");
 rows.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,"ja"));
 const max=rows[0]?.score||0;
 return '<div class="section"><h3>どの上映方式で見る？</h3><div class="small">作品のジャンル・概要・Cinemapの視聴ガイドから相性を5段階で整理。</div><div class="formatRatings">'+rows.map(x=>'<div class="formatRating '+(x.score===max?'best':'')+'"><div><b>'+E(x.name)+'</b><small>'+E(x.reason)+'</small></div><div class="formatStars" aria-label="'+x.score+' / 5">'+starText(x.score)+'</div></div>').join("")+'</div><div class="formatNote">★はCinemap独自のおすすめ度です。実際の上映方式は作品・劇場・上映回によって異なります。</div><a class="formatLink" href="experience.html">上映方式を比較する →</a></div>'
}
'''
if 'function viewingTimelineHtml(' not in s:
    s=s.replace('function renderDetail(m){',helpers+'\nfunction renderDetail(m){',1)
start=s.find("+(m.viewing_guide?'<div class=\"section\"><h3>最高の観方</h3>")
end=s.find("+(m.overview?",start)
if start>=0 and end>start:
    s=s[:start]+'+formatRecommendationsHtml(m)'+s[end:]
old="+'<div class=\"section\"><h3>現在の視聴状況</h3><div class=\"small\">'+p+'</div></div>'"
new="+'<div class=\"section\"><h3>公開・視聴タイムライン</h3>'+viewingTimelineHtml(m,av)+'</div>'"
if old in s:
    s=s.replace(old,new,1)
write(p,s)
