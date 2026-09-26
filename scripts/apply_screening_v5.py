from pathlib import Path

p=Path('search.html')
s=p.read_text(encoding='utf-8')

old='function formatVerdictLabelV4(x){if(x.key==="standard")return x.score>=5?"通常上映がおすすめ":x.score>=4?"十分楽しめる":"プレミアム方式を優先";if(x.key==="imax"&&x.score===5&&x.optimization===5)return "IMAX一択";return x.score>=5?"最優先で選ぶ":x.score>=4?"有力な選択肢":x.score>=3?"好みが合えば選ぶ":x.score>=2?"追加料金の優先度は低い":"通常上映を優先"}'
new='function formatVerdictLabelV5(x){if(x.key==="standard")return x.score>=4?"通常上映もおすすめ":"通常上映で十分楽しめる";return x.score>=5?"特におすすめ":x.score>=4?"おすすめ":x.score>=3?"相性あり":x.score>=2?"向く場面は限定的":"メリットは限定的"}'
if old not in s: raise SystemExit('verdict anchor not found')
s=s.replace(old,new,1)

anchor='function screeningRecommendationV3Html(m){'
helper='function applyScreeningCapsV5(m,rows){const gs=(m.genres||[]).map(g=>typeof g==="string"?g:(g&&g.name)||"").join(" "),countries=(m.origin_country||m.production_countries||[]).map(c=>typeof c==="string"?c:(c&&((c.iso_3166_1||c.name)))||"").join(" "),text=[m.title||"",m.original_title||"",m.overview||"",gs].join(" ").toLowerCase(),lang=String(m.original_language||"").toLowerCase(),isJapanese=lang==="ja"||/(^|\\s)(jp|japan|日本)(\\s|$)/i.test(countries),romance=/(romance|恋愛|ロマンス|ラブストーリー)/i.test(text),drama=/(drama|ドラマ|青春|家族)/i.test(text),spectacle=/(action|adventure|science fiction|sci-fi|sf|thriller|horror|fantasy|war|music|concert|sport|アクション|冒険|sf|サスペンス|スリラー|ホラー|ファンタジー|戦争|音楽|ライブ|スポーツ|レース|飛行|宇宙|海|爆発|戦闘|追跡|乗り物)/i.test(text),quietNarrative=(romance||drama)&&!spectacle,isJapaneseRomance=isJapanese&&romance&&!spectacle;return rows.map(x=>{const y={...x},expandedRatioVerified=x.key!=="imax"||x.optimization===5;if(y.key==="standard")y.score=Math.max(3,y.score);if(x.key==="imax"&&!expandedRatioVerified){y.score=Math.min(x.score,3);y.compatibilityWhy="拡張画角を確認できないため、IMAX固有の画面メリットは限定的と評価。大画面・音響の上乗せを考慮しても上限は3★。"}if((quietNarrative||isJapaneseRomance)&&(x.key==="motion"||x.key==="screenx")){y.score=Math.min(x.score,2);y.compatibility=Math.min(x.compatibility,2);y.compatibilityWhy=isJapaneseRomance?"会話や人物関係が中心の邦画恋愛として、体感演出・視野拡張の上乗せ効果は限定的と評価。":"静かな会話劇・ドラマとして、体感演出・視野拡張の上乗せ効果は限定的と評価。"}return y})}\n'
if anchor not in s: raise SystemExit('renderer anchor not found')
s=s.replace(anchor,helper+anchor,1)

s=s.replace('const rows=scoreScreeningFormatsV3(m),recommended=', 'const rows=applyScreeningCapsV5(m,scoreScreeningFormatsV3(m)),recommended=',1)
s=s.replace('(imaxLocked?\' 一択\':\'\')','(imaxLocked?\' おすすめ\':\'\')',1)
s=s.replace('E(formatVerdictLabelV4(x))','E(formatVerdictLabelV5(x))',1)
s=s.replace('IMAX撮影と拡張画角を確認済み。通常上映では失われる画面情報があるため、IMAXを最優先。','IMAX撮影と拡張画角を確認済み。通常上映より広い画面情報を活かせるため、CinemapではIMAXをおすすめします。')
s=s.replace('IMAX撮影と拡張画角を最優先。両方を公式確認できれば5★固定。未確認なら大画面との相性だけで高得点にしない。','IMAX撮影と拡張画角を重視。両方を公式確認できる作品は5★とし、未確認なら大画面との相性だけで高得点にしません。')
s=s.replace('IMAX撮影と拡張画角を確認済みならIMAXを最優先。','IMAX撮影と拡張画角を確認できる作品は、CinemapではIMAXとの相性を高く評価します。')
s=s.replace('プレミアム方式','特殊上映')
s=s.replace('最優先で選ぶ','特におすすめ')
s=s.replace('IMAX一択','IMAXおすすめ')
s=s.replace(' 一択',' おすすめ')

legend='Cinemapの相性評価は、作品情報と上映方式の特徴をもとにした参考評価です。劇場設備・座席・料金・好みにより体験は変わります。'
needle='<a class="formatLink" href="experience.html">上映方式を比較する →</a>'
if needle not in s: raise SystemExit('legend anchor not found')
s=s.replace(needle,'<div class="formatLegend">'+legend+'</div>'+needle,1)

p.write_text(s,encoding='utf-8')
print('applied screening v5')
