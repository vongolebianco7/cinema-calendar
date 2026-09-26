from pathlib import Path

p = Path('search.html')
s = p.read_text(encoding='utf-8')

css = r'''
/* screening recommendation v3 */
.formatHero{margin-top:10px;padding:15px 16px;border:1px solid #514b33;border-radius:13px;background:linear-gradient(135deg,#1b1911,#121212)}
.formatHeroEyebrow{font-size:9px;color:#aaa;letter-spacing:.08em;font-weight:800}.formatHeroTitle{font-size:21px;font-weight:900;margin-top:5px}.formatHeroStars{font-size:15px;color:#f0c86a;letter-spacing:.04em}.formatHeroReason{margin-top:7px;color:#c7c7c7;font-size:11px;line-height:1.55}
.formatCompactGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:9px}.formatCompact{border:1px solid #2c2c2c;border-radius:9px;background:#121212;overflow:hidden}.formatCompact[open]{border-color:#494949}.formatCompact summary{list-style:none;cursor:pointer;padding:9px 8px}.formatCompact summary::-webkit-details-marker{display:none}.formatCompactName{display:block;font-size:10px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.formatCompactStars{display:block;margin-top:3px;color:#f0c86a;font-size:10px;letter-spacing:-.03em}.formatCompactVerdict{display:block;margin-top:4px;color:#888;font-size:8px;line-height:1.35}.formatCompactBody{border-top:1px solid #282828;padding:9px 8px}.formatMetric{margin-top:7px}.formatMetric:first-child{margin-top:0}.formatMetric b{display:block;color:#777;font-size:8px;letter-spacing:.05em}.formatMetric span{display:block;color:#bbb;font-size:9px;line-height:1.5;margin-top:2px}.formatSources{margin-top:7px}.formatSources a{display:block;color:#aaa;font-size:8px;line-height:1.5;margin-top:3px}.formatLegend{color:#666;font-size:8px;line-height:1.5;margin-top:8px}
@media(max-width:650px){.formatCompactGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.formatCompact:first-child{grid-column:1/-1}.formatHeroTitle{font-size:19px}}
'''
if '/* screening recommendation v3 */' not in s:
    s = s.replace('</style>', css + '\n</style>', 1)

js = r'''
// screening recommendation v3
let SCREENING_V3_EVIDENCE={default:{},films:{},title_fixtures:{}};
fetch("data/screening_format_evidence.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(!d)return;SCREENING_V3_EVIDENCE=d;if(window.__screeningCurrentMovie){const h=document.querySelector("[data-screening-v3-host]");if(h)h.outerHTML=screeningRecommendationV3Html(window.__screeningCurrentMovie)}}).catch(()=>{});
function clampScore(n){return Math.max(1,Math.min(5,Math.round(n)))}
function traitText(m){return ((m.title||"")+" "+(m.genres||[]).join(" ")+" "+(m.overview||"")+" "+(m.viewing_guide?.best||"")+" "+((m.viewing_guide?.reasons||[]).join(" "))).toLowerCase()}
function keywordScore(text,patterns,base=1){let n=base;patterns.forEach(p=>{if(p.test(text))n++});return clampScore(n)}
function darkVisualScore(m){const t=traitText(m);return keywordScore(t,[/ホラー|horror|スリラー|thriller|ノワール|noir/,/夜|闇|暗|地下|洞窟|宇宙|space/,/犯罪|crime|サスペンス|suspense/],1)}
function colorRichScore(m){const t=traitText(m);return keywordScore(t,[/アニメ|animation|fantasy|ファンタジー/,/色彩|カラフル|color|colour|ネオン|neon/,/自然|nature|海|ocean|花|舞台|美術/],1)}
function musicAudioScore(m){const t=traitText(m);return keywordScore(t,[/音楽|music|ミュージカル|musical|concert|コンサート|ライブ|live/,/劇伴|score|サウンド|sound|歌|song/,/戦争|war|アクション|action|宇宙|space/],1)}
function motionPhysicalityScore(m){const t=traitText(m);return keywordScore(t,[/アクション|action|adventure|アドベンチャー|戦争|war/,/車|自動車|car|race|レース|バイク|motor|列車|train|飛行機|fighter|戦闘機|船|ship|宇宙船|spacecraft/,/追跡|chase|高速|speed|飛行|flight|落下|fall|爆発|explosion|嵐|storm|水中|underwater/],1)}
function spatialImmersionScore(m){const t=traitText(m);return keywordScore(t,[/宇宙|space|海|ocean|水中|underwater|自然|nature|砂漠|desert|山|mountain/,/飛行|flight|空|sky|戦場|battle|都市|city|群衆|crowd/,/ライブ|concert|コンサート|舞台|stage|ダンス|dance|adventure|アドベンチャー/],1)}
function spectacleScore(m){const t=traitText(m);return keywordScore(t,[/アクション|action|adventure|アドベンチャー|war|戦争|science fiction|サイエンスフィクション/,/宇宙|space|大規模|壮大|epic|怪獣|monster/,/飛行|flight|戦闘|battle|爆発|explosion/],1)}
function screeningV3EvidenceRow(m){const id=String(m.tmdbId||m.id||"");const year=String(m.year||String(m.date||"").slice(0,4));const key=(m.title||"")+"|"+year;return {...(SCREENING_V3_EVIDENCE.default||{}),...(SCREENING_V3_EVIDENCE.films?.[id]||{}),...(SCREENING_V3_EVIDENCE.title_fixtures?.[key]||{})}}
function optimizationScore(key,e){if(key==="imax"){if(e.filmed_for_imax===true&&e.imax_expanded_ratio&&e.imax_expanded_ratio!=="unknown")return 5;if(e.filmed_for_imax===true||String(e.imax_camera||"").includes("imax"))return 4;if(e.imax_dmr_only===true)return 2;if(e.filmed_for_imax===false)return 1;return 1}if(key==="dolby_cinema"){if(e.dolby_vision_master===true&&e.dolby_atmos_mix===true)return 5;if(e.dolby_vision_master===true||e.dolby_atmos_mix===true)return 4;if(e.dolby_vision_master===false&&e.dolby_atmos_mix===false)return 1;return 2}if(key==="motion"){if(e.official_4dx===true||e.official_mx4d===true)return 4;if(e.official_4dx===false&&e.official_mx4d===false)return 1;return 2}if(key==="screenx"){if(e.official_screenx===true)return 4;if(e.official_screenx===false)return 1;return 2}return 3}
function compatibilityScore(key,m){if(key==="imax")return spectacleScore(m);if(key==="dolby_cinema")return Math.max(darkVisualScore(m),colorRichScore(m),musicAudioScore(m));if(key==="motion")return motionPhysicalityScore(m);if(key==="screenx")return spatialImmersionScore(m);return 3}
function formatSourcesV3(key,e){return (e.sources||[]).filter(x=>(x.formats||[]).includes(key))}
function formatLabelV3(key){return {standard:"通常上映",imax:"IMAX",dolby_cinema:"Dolby Cinema",motion:"4DX / MX4D",screenx:"ScreenX"}[key]||key}
function compatibilityWhyV3(key,m,score){if(key==="imax")return score>=4?"大規模映像・宇宙・戦闘など、画面スケールの恩恵が大きい作品特性。":"画面スケール面の相性は標準的。";if(key==="dolby_cinema"){const bits=[];if(darkVisualScore(m)>=3)bits.push("暗部・明暗差");if(colorRichScore(m)>=3)bits.push("色彩・美術");if(musicAudioScore(m)>=3)bits.push("音楽・空間音響");return bits.length?bits.join("、")+"を活かしやすい。":"Dolby Vision / Atmosの強みと強く結びつく作品特性は少ない。"}if(key==="motion")return score>=4?"乗り物・高速移動・戦闘・爆発など、身体感覚に変換しやすい場面が多い。":"体感演出を継続的に活かせる場面は多くない。";if(key==="screenx")return score>=4?"広い景観・飛行・海・宇宙・群衆など、視野の広がりが没入感につながる。":"左右への視野拡張が決定的な価値になりにくい作品特性。";return "基準となる上映方式。"}
function optimizationWhyV3(key,e,opt){if(key==="imax"){if(opt>=5)return "IMAX撮影と拡張画角を確認済み。";if(opt>=4)return "IMAX向け撮影・制作を確認済み。";return "IMAX専用画角・撮影上の明確な追加価値は未確認。"}if(key==="dolby_cinema"){if(opt>=5)return "Dolby VisionとDolby Atmosの両方を確認済み。";if(opt>=4)return "Dolby VisionまたはAtmosの作品固有対応を確認済み。";return "Dolby専用最適化は未確認。作品特性との相性を主に評価。"}if(key==="motion")return opt>=4?"4DX / MX4D公式対応を確認済み。":"作品固有の4DX / MX4D対応は未確認。作品特性との相性を主に評価。";if(key==="screenx")return opt>=4?"ScreenX公式対応を確認済み。":"ScreenX専用拡張映像は未確認。作品特性との相性を主に評価。";return "追加の専用最適化を必要としない。"}
function verdictV3(score){return score>=5?"最優先":score>=4?"かなり向く":score>=3?"候補":score>=2?"優先度低め":"通常上映で十分"}
function scoreScreeningFormatsV3(m){const e=screeningV3EvidenceRow(m);const rows=["imax","dolby_cinema","motion","screenx"].map(key=>{const optimization=optimizationScore(key,e),compatibility=compatibilityScore(key,m);let score;if(key==="imax"){score=clampScore(optimization*.7+compatibility*.3);if(optimization<=1)score=Math.min(score,2)}else if(key==="dolby_cinema")score=clampScore(optimization*.35+compatibility*.65);else if(key==="motion")score=clampScore(optimization*.4+compatibility*.6);else score=clampScore(optimization*.5+compatibility*.5);return {key,name:formatLabelV3(key),score,optimization,compatibility,compatibilityWhy:compatibilityWhyV3(key,m,compatibility),optimizationWhy:optimizationWhyV3(key,e,optimization),sources:formatSourcesV3(key,e)}});const premiumMax=Math.max(...rows.map(x=>x.score));const standardScore=premiumMax>=4?2:premiumMax<=2?5:4;rows.unshift({key:"standard",name:"通常上映",score:standardScore,optimization:3,compatibility:3,compatibilityWhy:"プレミアム方式固有の恩恵が弱い場合の基準。",optimizationWhy:"追加料金なしで作品本来の画面・音を楽しめる。",sources:[]});return rows}
function screeningRecommendationV3Html(m){window.__screeningCurrentMovie=m;const rows=scoreScreeningFormatsV3(m),recommended=rows.slice().sort((a,b)=>b.score-a.score||(["standard","imax","dolby_cinema","motion","screenx"].indexOf(a.key)-["standard","imax","dolby_cinema","motion","screenx"].indexOf(b.key)))[0];const heroReason=recommended.key==="standard"?"プレミアム方式の追加価値が弱いため、追加料金をかけず通常上映を優先。":recommended.compatibilityWhy;return '<div class="section" data-screening-v3-host><h3>どの上映方式で見る？</h3><div class="formatHero"><div class="formatHeroEyebrow">この作品なら</div><div class="formatHeroTitle">'+E(recommended.name)+' <span class="formatHeroStars">'+starText(recommended.score)+'</span></div><div class="formatHeroReason">'+E(heroReason)+'</div></div><div class="formatCompactGrid">'+rows.map(x=>'<details class="formatCompact" data-format-detail data-format-key="'+x.key+'"><summary><span class="formatCompactName">'+E(x.name)+'</span><span class="formatCompactStars">'+starText(x.score)+'</span><span class="formatCompactVerdict">'+E(verdictV3(x.score))+'</span></summary><div class="formatCompactBody"><div class="formatMetric"><b>作品との相性</b><span>'+starText(x.compatibility)+' · '+E(x.compatibilityWhy)+'</span></div><div class="formatMetric"><b>専用最適化</b><span>'+starText(x.optimization)+' · '+E(x.optimizationWhy)+'</span></div><div class="formatMetric"><b>判定根拠</b><span>'+E(x.key==="dolby_cinema"?"暗部・色彩・撮影美・音楽・空間音響を重視。":x.key==="motion"?"乗り物・高速移動・戦闘・爆発・風・水など身体性を重視。":x.key==="screenx"?"景観・宇宙・海・飛行・群衆・ライブなど空間没入性を重視。":x.key==="imax"?"IMAX撮影・拡張画角を最重視し、スペクタクル適性を補助評価。":"他方式の固有メリットと追加料金を比較。")+'</span></div>'+(x.sources.length?'<div class="formatSources">'+x.sources.map(src=>'<a target="_blank" rel="noopener noreferrer" href="'+E(src.url)+'">根拠：'+E(src.label)+'</a>').join('')+'</div>':'')+'</div></details>').join('')+'</div><div class="formatLegend">★は「専用最適化」と「作品との相性」を方式ごとに異なる重みで評価。対応しているだけでは高評価にしません。</div><a class="formatLink" href="experience.html">上映方式を比較する →</a></div>'}
'''

if '// screening recommendation v3' not in s:
    marker = 'function renderDetail(m){'
    if marker not in s:
        raise SystemExit('renderDetail marker not found')
    s = s.replace(marker, js + '\n' + marker, 1)

call = '+formatRecommendationsHtml(m)+'
if call not in s:
    raise SystemExit('formatRecommendationsHtml call not found')
s = s.replace(call, '+screeningRecommendationV3Html(m)+', 1)

p.write_text(s, encoding='utf-8')
print('screening recommendation v3 applied')
