from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
pattern=r'function experienceFitHtml\(m\)\{.*?\n\}\nfunction festivalAwardOrg'
replacement=r'''let INDEX_SCREENING_EVIDENCE={default:{},films:{},title_fixtures:{}};
fetch("data/screening_format_evidence.json?"+Date.now(),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(!d)return;INDEX_SCREENING_EVIDENCE=d;if(detailMovie){const h=document.querySelector("[data-index-screening-v6]");if(h)h.outerHTML=experienceFitHtml(detailMovie)}}).catch(()=>{});
function indexClampScore(n){return Math.max(1,Math.min(5,Math.round(n)))}
function indexTraitText(m){return ((m.title||"")+" "+(m.original_title||"")+" "+(m.genres||[]).join(" ")+" "+(m.overview||"")).toLowerCase()}
function indexKeywordScore(text,patterns,base=1){let n=base;patterns.forEach(x=>{if(x.test(text))n++});return indexClampScore(n)}
function indexScreeningEvidenceRow(m){const id=String(m.tmdbId||m.id||""),year=String(m.year||String(m.date||"").slice(0,4)),key=(m.title||"")+"|"+year;return {...(INDEX_SCREENING_EVIDENCE.default||{}),...(INDEX_SCREENING_EVIDENCE.films?.[id]||{}),...(INDEX_SCREENING_EVIDENCE.title_fixtures?.[key]||{})}}
function indexFormatVerdict(x){if(x.key==="standard")return x.score>=4?"通常上映もおすすめ":"通常上映で十分楽しめる";return x.score>=5?"特におすすめ":x.score>=4?"おすすめ":x.score>=3?"相性あり":x.score>=2?"向く場面は限定的":"メリットは限定的"}
function indexFormatStars(n){return '★'.repeat(n)+'☆'.repeat(5-n)}
function applyIndexScreeningCapsV6(m,rows){const gs=(m.genres||[]).map(g=>typeof g==="string"?g:(g&&g.name)||"").join(" "),countries=(m.origin_country||m.production_countries||m.countries||[]).map(c=>typeof c==="string"?c:(c&&((c.iso_3166_1||c.name)))||"").join(" "),text=[m.title||"",m.original_title||"",m.overview||"",gs].join(" ").toLowerCase(),lang=String(m.original_language||"").toLowerCase(),isJapanese=lang==="ja"||/(^|\s)(jp|japan|日本)(\s|$)/i.test(countries),romance=/(romance|恋愛|ロマンス|ラブストーリー)/i.test(text),drama=/(drama|ドラマ|青春|家族)/i.test(text),spectacle=/(action|adventure|science fiction|sci-fi|sf|thriller|horror|fantasy|war|music|concert|sport|アクション|冒険|sf|サスペンス|スリラー|ホラー|ファンタジー|戦争|音楽|ライブ|スポーツ|レース|飛行|宇宙|海|爆発|戦闘|追跡|乗り物)/i.test(text),quietNarrative=(romance||drama)&&!spectacle,isJapaneseRomance=isJapanese&&romance&&!spectacle;return rows.map(x=>{const y={...x};if(y.key==="standard")y.score=Math.max(3,y.score);if(y.key==="imax"&&!y.expandedRatioVerified){y.score=Math.min(x.score,3);y.reason="拡張画角を確認できないため、IMAX固有の画面メリットは限定的と評価。"}if((quietNarrative||isJapaneseRomance)&&(y.key==="motion"||y.key==="screenx")){y.score=Math.min(x.score,2);y.reason=isJapaneseRomance?"会話や人物関係が中心の邦画恋愛として、体感演出・視野拡張の上乗せ効果は限定的と評価。":"静かな会話劇・ドラマとして、体感演出・視野拡張の上乗せ効果は限定的と評価。"}return y})}
function experienceFitHtml(m){
 const e=indexScreeningEvidenceRow(m),t=indexTraitText(m),expandedRatioVerified=!!(e.filmed_for_imax===true&&e.imax_expanded_ratio&&e.imax_expanded_ratio!=="unknown");
 const spectacle=indexKeywordScore(t,[/アクション|action|adventure|戦争|war|science fiction|sf|宇宙|space/,/大規模|壮大|epic|怪獣|monster/,/飛行|flight|戦闘|battle|爆発|explosion/],1);
 const dolbyFit=indexKeywordScore(t,[/ホラー|horror|スリラー|thriller|夜|闇|暗|宇宙|space/,/アニメ|animation|fantasy|ファンタジー|色彩|ネオン|自然|海|美術/,/音楽|music|ミュージカル|concert|ライブ|劇伴|sound/],1);
 const motionFit=indexKeywordScore(t,[/アクション|action|adventure|戦争|war/,/車|car|race|レース|バイク|列車|train|飛行機|fighter|船|ship|宇宙船/,/追跡|chase|高速|speed|飛行|flight|落下|fall|爆発|explosion|嵐|storm|水中|underwater/],1);
 const spatialFit=indexKeywordScore(t,[/宇宙|space|海|ocean|水中|underwater|自然|nature|砂漠|desert|山|mountain/,/飛行|flight|空|sky|戦場|battle|都市|city|群衆|crowd/,/ライブ|concert|舞台|stage|ダンス|dance|adventure/],1);
 let imaxScore=expandedRatioVerified?5:indexClampScore((String(e.imax_camera||"").includes("imax")||e.filmed_for_imax===true?4:1)*.7+spectacle*.3);
 let dolbyOpt=e.dolby_vision_master===true&&e.dolby_atmos_mix===true?5:(e.dolby_vision_master===true||e.dolby_atmos_mix===true?4:2),dolbyScore=indexClampScore(dolbyOpt*.35+dolbyFit*.65);
 let motionOpt=(e.official_4dx===true||e.official_mx4d===true)?4:2,motionScore=indexClampScore(motionOpt*.4+motionFit*.6);
 let screenxOpt=e.official_screenx===true?4:2,screenxScore=indexClampScore(screenxOpt*.5+spatialFit*.5);
 const premiumMax=Math.max(imaxScore,dolbyScore,motionScore,screenxScore),standardScore=premiumMax>=4?3:premiumMax<=2?5:4;
 let rows=[
  {key:"standard",name:"通常上映",score:standardScore,reason:"作品本来の画面・音を楽しむ基準となる上映方式です。"},
  {key:"imax",name:"IMAX",score:imaxScore,expandedRatioVerified,reason:expandedRatioVerified?"IMAX撮影と拡張画角を確認できるため、CinemapではIMAXとの相性を高く評価します。":"大画面との相性は考慮しますが、拡張画角が未確認なら高評価にはしません。"},
  {key:"dolby_cinema",name:"Dolby Cinema",score:dolbyScore,reason:"暗部・色彩・撮影美・音楽・空間音響とDolby Cinemaの相性を評価します。Dolby Atmosは独立した上映方式として扱いません。"},
  {key:"motion",name:"4DX / MX4D",score:motionScore,reason:"乗り物・高速移動・戦闘・爆発など、体感演出に変換しやすい場面を評価します。"},
  {key:"screenx",name:"ScreenX",score:screenxScore,reason:"景観・宇宙・海・飛行・群衆など、左右への視野拡張が没入感に効くかを評価します。"}
 ];
 rows=applyIndexScreeningCapsV6(m,rows);
 const order=["standard","imax","dolby_cinema","motion","screenx"],recommended=rows.slice().sort((a,b)=>b.score-a.score||order.indexOf(a.key)-order.indexOf(b.key))[0];
 return '<section class="detailSection experienceFit" data-index-screening-v6><h3>どの上映方式で観る？</h3><div class="formatHero" style="margin:10px 0 12px"><div class="small">この作品なら</div><div style="font-size:19px;font-weight:900;margin-top:4px">'+recommended.name+' '+indexFormatStars(recommended.score)+' <span style="font-size:11px;color:#e8b44f">'+indexFormatVerdict(recommended)+'</span></div><div class="small" style="margin-top:5px;line-height:1.6">'+recommended.reason+'</div></div><div class="experienceFitGrid">'+rows.map(x=>'<div class="experienceFitCard '+(x.key===recommended.key?'best':'')+'"><span><b>'+x.name+'</b><em class="experienceStars" aria-label="'+x.score+' / 5">'+indexFormatStars(x.score)+'</em></span><small>'+x.reason+'</small><i>'+indexFormatVerdict(x)+'</i></div>').join("")+'</div><p class="small" style="margin-top:9px">Cinemapの相性評価は、作品情報と上映方式の特徴をもとにした参考評価です。劇場設備・座席・料金・好みにより体験は変わります。</p><a class="experienceTheaterLink" href="search.html?id='+encodeURIComponent(m.tmdbId||m.id||"")+'&search='+encodeURIComponent(m.title||"")+'">詳しい根拠を見る →</a></section>'
}
function festivalAwardOrg'''

ns,n=re.subn(pattern,lambda _m: replacement,s,count=1,flags=re.S)
if n!=1:
    raise SystemExit(f'expected 1 experienceFitHtml block, replaced {n}')
p.write_text(ns,encoding='utf-8')
print('applied index screening sync v6')
