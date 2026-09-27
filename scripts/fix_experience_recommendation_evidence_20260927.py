from pathlib import Path
import re

p = Path('experience.html')
text = p.read_text(encoding='utf-8')

old = "function reason(k){return k==='IMAX'?'大画面・スケール感との相性':k==='Dolby Cinema'?'黒・コントラストと立体音響':k==='4DX / MX4D'?'動きのある場面を身体で楽しむ':k==='ScreenX'?'左右まで広がる視界を楽しむ':'追加演出なしで作品に集中'}function tabFor(k)"
new = "function reason(k){return k==='IMAX'?'大画面・スケール感との相性':k==='Dolby Cinema'?'黒・コントラストと立体音響':k==='4DX / MX4D'?'動きのある場面を身体で楽しむ':k==='ScreenX'?'左右まで広がる視界を楽しむ':'追加演出なしで作品に集中'}function genreList(m){return (m.genres||m.genre_names||[]).map(x=>String(typeof x==='string'?x:(x&&x.name)||'')).filter(Boolean)}function evidenceFor(m,k){const gs=genreList(m),g=gs.join(' ').toLowerCase(),ev=[];const genreText=gs.length?'取得したジャンル: '+gs.join(' / '):'';if(k==='IMAX'&&/action|アクション|adventure|アドベンチャー|science fiction|sf|fantasy|ファンタジー|animation|アニメ|horror|ホラー|thriller|スリラー/.test(g))ev.push(genreText+'。このジャンル条件がCinemapのIMAX加点ルールに該当。');if(k==='Dolby Cinema'&&/action|アクション|adventure|アドベンチャー|science fiction|sf|fantasy|ファンタジー|horror|ホラー|thriller|スリラー|crime|犯罪|animation|アニメ|drama|ドラマ|romance|恋愛|documentary|ドキュメンタリー/.test(g))ev.push(genreText+'。このジャンル条件がCinemapのDolby Cinema加点ルールに該当。');if(k==='4DX / MX4D'&&/action|アクション|adventure|アドベンチャー|science fiction|sf|fantasy|ファンタジー|horror|ホラー|thriller|スリラー|crime|犯罪/.test(g))ev.push(genreText+'。このジャンル条件がCinemapの4DX / MX4D加点ルールに該当。');if(k==='ScreenX'&&/action|アクション|adventure|アドベンチャー|science fiction|sf|fantasy|ファンタジー|animation|アニメ/.test(g))ev.push(genreText+'。このジャンル条件がCinemapのScreenX加点ルールに該当。');if(k==='通常上映'&&/drama|ドラマ|romance|恋愛|documentary|ドキュメンタリー/.test(g))ev.push(genreText+'。このジャンル条件がCinemapの通常上映加点ルールに該当。');return ev}function tabFor(k)"
if old not in text:
    raise SystemExit('reason anchor not found')
text = text.replace(old, new, 1)

pattern = re.compile(r"rows\.map\(\(\[k,v\]\)=>\{const target=tabFor\(k\),tabLink=target\?'<button type=\\\"button\\\" class=\\\"formatScoreCta\\\" data-go-tab=\\\"'\+target\+'\\\">'\+tabLabel\(k\)\+' →</button>':'';return '<div class=\\\"formatScore\\\"><b>'\+k\+'</b><strong>'\+stars\(v\)\+'</strong><span class=\\\"formatScoreMeta\\\"><span>'\+reason\(k\)\+'</span><span class=\\\"formatScoreActions\\\"><button type=\\\"button\\\" class=\\\"formatReasonToggle\\\" aria-expanded=\\\"false\\\">理由を見る</button>'\+tabLink\+'</span><span class=\\\"formatReasonBody\\\">'\+reason\(k\)\+'。作品ジャンルとの相性を基準にした目安で、作品固有の上映仕様は未確認なら加点していません。</span></span></div>'\}\)\.join\(''\)")
replacement = "rows.map(([k,v])=>{const target=tabFor(k),tabLink=target?'<button type=\\\"button\\\" class=\\\"formatScoreCta\\\" data-go-tab=\\\"'+target+'\\\">'+tabLabel(k)+' →</button>':'';const evidence=evidenceFor(selectedMovie,k),reasonUi=evidence.length?'<button type=\\\"button\\\" class=\\\"formatReasonToggle\\\" aria-expanded=\\\"false\\\">根拠を見る</button>':'';const reasonBody=evidence.length?'<span class=\\\"formatReasonBody\\\"><b>確認できた作品情報</b><br>'+esc(evidence.join(' '))+'<br><small>※IMAX撮影・拡張画角・Dolby/4D/ScreenX専用版など作品固有の上映仕様は、確認できた情報がない限り根拠に含めません。</small></span>':'';return '<div class=\\\"formatScore\\\"><b>'+k+'</b><strong>'+stars(v)+'</strong><span class=\\\"formatScoreMeta\\\"><span>'+reason(k)+'</span><span class=\\\"formatScoreActions\\\">'+reasonUi+tabLink+'</span>'+reasonBody+'</span></div>'}).join('')"
text2, n = pattern.subn(replacement, text, count=1)
if n != 1:
    raise SystemExit(f'recommendation render anchor not found: {n}')
text = text2
text = text.replace("b.textContent=open?'理由を閉じる':'理由を見る'", "b.textContent=open?'根拠を閉じる':'根拠を見る'", 1)
text = text.replace("※ジャンル等からの目安です。作品固有の上映仕様・上映有無は劇場公式情報を確認してください。", "※星評価は取得できた作品ジャンルを使った目安です。根拠を表示できない方式では「根拠を見る」を出しません。作品固有の上映仕様・上映有無は劇場公式情報を確認してください。", 1)

p.write_text(text, encoding='utf-8')
