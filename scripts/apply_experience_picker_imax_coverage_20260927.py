from pathlib import Path
import json, re

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data/theater_formats.json'
THEATERS=ROOT/'theaters.html'
EXP=ROOT/'experience.html'

TOHO='https://www.tohotheater.jp/theater/find.html'
UC='https://www.unitedcinemas.jp/imax/index.html'
C109='https://109cinemas.net/imax/'
AEON='https://www.aeoncinema.com/facility/imax/'
SUN='https://www.cinemasunshine.co.jp/pages/imax-about'

def row(fmt,theater,pref,source,screen='IMAX'):
    return {'format':fmt,'theater':theater,'prefecture':pref,'screen':screen,'source_url':source}

IMAX_ROWS=[
# TOHO Cinemas — official facility list
row('IMAX','TOHOシネマズ 仙台','宮城県',TOHO),row('IMAX','TOHOシネマズ 立川立飛','東京都',TOHO),row('IMAX','TOHOシネマズ ららぽーと横浜','神奈川県',TOHO),row('IMAX','TOHOシネマズ なんば（本館・別館）','大阪府',TOHO),
row('IMAXレーザー','TOHOシネマズ 日比谷','東京都',TOHO,'IMAXレーザー'),row('IMAXレーザー','TOHOシネマズ 新宿','東京都',TOHO,'IMAXレーザー'),row('IMAXレーザー','TOHOシネマズ 流山おおたかの森','千葉県',TOHO,'IMAXレーザー'),row('IMAXレーザー','TOHOシネマズ 宇都宮','栃木県',TOHO,'IMAXレーザー'),row('IMAXレーザー','TOHOシネマズ 名古屋栄','愛知県',TOHO,'IMAXレーザー'),row('IMAXレーザー','TOHOシネマズ 赤池','愛知県',TOHO,'IMAXレーザー'),row('IMAXレーザー','TOHOシネマズ モレラ岐阜','岐阜県',TOHO,'IMAXレーザー'),row('IMAXレーザー','TOHOシネマズ ファボーレ富山','富山県',TOHO,'IMAXレーザー'),row('IMAXレーザー','TOHOシネマズ 二条','京都府',TOHO,'IMAXレーザー'),row('IMAXレーザー','TOHOシネマズ 西宮OS','兵庫県',TOHO,'IMAXレーザー'),
# 109 Cinemas — official IMAX list
row('IMAX GT','109シネマズ大阪エキスポシティ','大阪府',C109,'IMAXレーザー/GT'),row('IMAX','109シネマズ菖蒲','埼玉県',C109),row('IMAX','109シネマズ木場','東京都',C109),row('IMAX','109シネマズ二子玉川','東京都',C109),row('IMAX','109シネマズグランベリーパーク','東京都',C109),row('IMAX','109シネマズ川崎','神奈川県',C109),row('IMAX','109シネマズ湘南','神奈川県',C109),row('IMAX','109シネマズゆめが丘','神奈川県',C109),row('IMAX','109シネマズ名古屋','愛知県',C109),
# Lawson United Cinemas — official IMAX list
row('IMAXレーザー','ローソン・ユナイテッドシネマ札幌','北海道',UC,'IMAXレーザー'),row('IMAXレーザー','ローソン・ユナイテッドシネマ前橋','群馬県',UC,'IMAXレーザー'),row('IMAXレーザー','ユナイテッド・シネマ浦和','埼玉県',UC,'IMAXレーザー'),row('IMAXレーザー','ユナイテッド・シネマ松戸','千葉県',UC,'IMAXレーザー'),row('IMAXレーザー','ユナイテッド・シネマとしまえん','東京都',UC,'IMAXレーザー'),row('IMAXレーザー','ユナイテッド・シネマ金沢','石川県',UC,'IMAXレーザー'),row('IMAXレーザー','ユナイテッド・シネマ岡崎','愛知県',UC,'IMAXレーザー'),row('IMAXレーザー','ユナイテッド・シネマ岸和田','大阪府',UC,'IMAXレーザー'),row('IMAXレーザー','ローソン・ユナイテッドシネマ小倉','福岡県',UC,'IMAXレーザー'),row('IMAXレーザー','ユナイテッド・シネマ キャナルシティ13','福岡県',UC,'IMAXレーザー'),row('IMAXレーザー','ユナイテッド・シネマ長崎','長崎県',UC,'IMAXレーザー'),row('IMAXレーザー','ユナイテッド・シネマ PARCO CITY 浦添','沖縄県',UC,'IMAXレーザー'),row('IMAX','ユナイテッド・シネマ豊橋18','愛知県',UC),
# Aeon Cinema — official IMAX facility list
row('IMAXレーザー','イオンシネマ江釣子','岩手県',AEON,'IMAXレーザー'),row('IMAXレーザー','イオンシネマ新潟亀田インター','新潟県',AEON,'IMAXレーザー'),row('IMAXレーザー','イオンシネマ越谷レイクタウン','埼玉県',AEON,'IMAXレーザー'),row('IMAXレーザー','イオンシネマ シアタス調布','東京都',AEON,'IMAXレーザー'),row('IMAXレーザー','イオンシネマ八王子滝山','東京都',AEON,'IMAXレーザー'),row('IMAXレーザー','イオンシネマ市川妙典','千葉県',AEON,'IMAXレーザー'),row('IMAXレーザー','イオンシネマ幕張新都心','千葉県',AEON,'IMAXレーザー'),row('IMAXレーザー','イオンシネマ須坂','長野県',AEON,'IMAXレーザー'),row('IMAXレーザー','イオンシネマ各務原','岐阜県',AEON,'IMAXレーザー'),row('IMAXレーザー','イオンシネマ四條畷','大阪府',AEON,'IMAXレーザー'),row('IMAXレーザー','イオンシネマ岡山','岡山県',AEON,'IMAXレーザー'),row('IMAXレーザー','イオンシネマ福岡','福岡県',AEON,'IMAXレーザー'),
# Cinema Sunshine — official IMAX page
row('IMAX GT','グランドシネマサンシャイン 池袋','東京都',SUN,'シアター12 / IMAXレーザーGT'),row('IMAXレーザー','シネマサンシャイン土浦','茨城県',SUN,'IMAXレーザー'),row('IMAXレーザー','シネマサンシャインららぽーと沼津','静岡県',SUN,'IMAXレーザー'),row('IMAXレーザー','シネマサンシャイン大和郡山','奈良県',SUN,'IMAXレーザー'),row('IMAXレーザー','シネマサンシャイン衣山','愛媛県',SUN,'IMAXレーザー'),row('IMAXレーザー','シネマサンシャイン飯塚','福岡県',SUN,'IMAXレーザー'),
]

def patch_data():
    data=json.loads(DATA.read_text(encoding='utf-8'))
    other=[x for x in data.get('screens',[]) if not str(x.get('format','')).upper().startswith('IMAX')]
    data['screens']=IMAX_ROWS+other
    data['generated_at']='2026-09-27'
    data['note']='公式チェーン/劇場ページで確認できる上映設備をCinemap用に整理。IMAXはIMAX/IMAXレーザー/IMAX GTを同一ファミリーとして検索し、GTは個別絞り込み可能。'
    DATA.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def patch_theaters():
    text=THEATERS.read_text(encoding='utf-8')
    old='const rows=(formatData.screens||[]).filter(x=>String(x.format).toLowerCase()===String(selectedFormat).toLowerCase());'
    new='const rows=(formatData.screens||[]).filter(x=>formatMatches(x.format,selectedFormat));'
    if old in text:text=text.replace(old,new,1)
    if 'function formatMatches' not in text:
        marker='function renderFormatDirectory(){'
        helper='function formatMatches(actual,wanted){actual=String(actual||"").trim().toLowerCase();wanted=String(wanted||"").trim().toLowerCase();if(wanted==="imax")return actual.startsWith("imax");return actual===wanted}\n'
        text=text.replace(marker,helper+marker,1)
    THEATERS.write_text(text,encoding='utf-8')

def patch_experience():
    text=EXP.read_text(encoding='utf-8')
    if 'id="formatFinder"' in text:return
    css='''\n<style id="experience-decision-v1">
.expQuickNav{display:flex;gap:8px;overflow:auto;scrollbar-width:none;padding:2px 0 18px}.expQuickNav a{white-space:nowrap;border:1px solid #30343a;border-radius:999px;padding:8px 11px;font-size:11px;color:#d6d9dd}.decisionBox{border:1px solid #30343a;border-radius:16px;background:#0b0d10;padding:16px;margin:8px 0 28px}.decisionBox h2{margin:0 0 6px;font-size:22px}.decisionBox>p{margin:0;color:#9ba2aa;font-size:12px;line-height:1.6}.filmPicker{display:flex;gap:8px;margin-top:14px}.filmPicker input{min-width:0;flex:1;background:#08090b;border:1px solid #343941;color:#fff;border-radius:8px;padding:12px}.filmPicker button{border:1px solid #ddd;background:#eee;color:#111;border-radius:8px;padding:0 14px;font-weight:800}.formatResult{margin-top:14px}.formatScore{display:grid;grid-template-columns:118px 84px 1fr;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #24282e}.formatScore:first-child{border-top:0}.formatScore b{font-size:13px}.formatScore strong{letter-spacing:.08em;color:#e8c56b;font-size:13px}.formatScore span{font-size:11px;color:#9ba2aa;line-height:1.45}.decisionNote{font-size:10px;color:#777;margin-top:10px;line-height:1.55}.compareScroll{overflow:auto;margin:12px 0 34px}.experienceCompare{width:100%;min-width:720px;border-collapse:collapse;font-size:11px}.experienceCompare th,.experienceCompare td{padding:10px;border-bottom:1px solid #282c31;text-align:left;vertical-align:top}.experienceCompare th{color:#eee;background:#0d0f12;position:sticky;top:56px}.experienceCompare td:first-child{font-weight:800;color:#eee}.compareCta{display:inline-flex;margin-top:7px;color:#d7e7f5;text-decoration:underline}@media(max-width:600px){.decisionBox{padding:13px;border-radius:12px}.filmPicker{display:grid;grid-template-columns:1fr auto}.formatScore{grid-template-columns:92px 70px 1fr;gap:7px}.formatScore strong{font-size:11px}.formatScore span{font-size:10px}.expQuickNav{margin-left:-2px}}
</style>'''
    text=text.replace('</head>',css+'\n</head>',1)
    block='''\n<nav class="expQuickNav" aria-label="上映方式ページ内ナビ"><a href="#formatFinder">作品から選ぶ</a><a href="#experienceCompare">違いを比較</a><a href="#aspect">画角</a><a href="#visual">映像</a><a href="#audio">音響</a><a href="#special">体感</a></nav>
<section class="decisionBox" id="formatFinder"><h2>作品から上映方式を選ぶ</h2><p>作品のジャンル傾向から、各上映方式との相性を5段階で比較します。作品固有のIMAX撮影やScreenX専用素材を未確認の場合は断定しません。</p><div class="filmPicker"><input id="formatFilm" type="search" placeholder="作品名を入力（例：オデュッセイア）" aria-label="上映方式を選ぶ作品名"><button id="formatJudge" type="button">おすすめを見る</button></div><div class="formatResult" id="formatResult"><div class="decisionNote">まず作品名を入力してください。</div></div></section>
<section class="section" id="experienceCompare"><div class="sectionHead"><h2>上映方式を横比較</h2><p>迷ったときに見るための総合比較。実際の仕様・追加料金は劇場ごとに異なります。</p></div><div class="compareScroll"><table class="experienceCompare"><thead><tr><th>方式</th><th>画面・画角</th><th>映像</th><th>音響</th><th>体感</th><th>向く作品</th></tr></thead><tbody><tr><td>通常上映</td><td>作品標準</td><td>標準</td><td>5.1/7.1等</td><td>なし</td><td>ドラマ、会話劇など</td></tr><tr><td>IMAX</td><td>大型・作品により拡張画角</td><td>高輝度・高精細系</td><td>専用音響</td><td>なし</td><td>SF、アクション、スケールの大きい作品<br><a class="compareCta" href="theaters.html?format=IMAX">対応映画館 →</a></td></tr><tr><td>Dolby Cinema</td><td>作品標準中心</td><td>黒・コントラスト重視</td><td>Dolby Atmos</td><td>なし</td><td>暗部表現、音響重視</td></tr><tr><td>4DX / MX4D</td><td>作品標準</td><td>標準</td><td>劇場仕様</td><td>座席・風・水など</td><td>アクション、アトラクション性</td></tr><tr><td>ScreenX</td><td>左右へ拡張</td><td>3面パノラマ</td><td>劇場仕様</td><td>視界の拡張</td><td>専用シーンのある作品</td></tr></tbody></table></div></section>'''
    m=re.search(r'(<main class="wrap">\s*<section[^>]*class="[^"]*hero[^"]*".*?</section>)',text,re.S)
    if m:text=text[:m.end()]+block+text[m.end():]
    else:text=text.replace('<main class="wrap">','<main class="wrap">'+block,1)
    js='''\n<script id="experience-decision-js-v1">(()=>{const input=document.getElementById('formatFilm'),btn=document.getElementById('formatJudge'),out=document.getElementById('formatResult');if(!input||!btn||!out)return;const clamp=n=>Math.max(1,Math.min(5,n));const stars=n=>'★'.repeat(Math.round(n))+'☆'.repeat(5-Math.round(n));function genresOf(m){return (m.genres||m.genre_names||[]).map(x=>String(typeof x==='string'?x:(x&&x.name)||'').toLowerCase()).join(' ')}function scoreMovie(m){const g=genresOf(m),s={'通常上映':4,'IMAX':3.5,'Dolby Cinema':3.5,'4DX / MX4D':2,'ScreenX':2};if(/action|アクション|adventure|アドベンチャー|science fiction|sf|fantasy|ファンタジー/.test(g)){s.IMAX+=1;s['Dolby Cinema']+=.5;s['4DX / MX4D']+=.8;s.ScreenX+=.4}if(/horror|ホラー|thriller|スリラー|crime|犯罪/.test(g)){s['Dolby Cinema']+=1;s.IMAX+=.3;s['4DX / MX4D']+=.3}if(/animation|アニメ/.test(g)){s.IMAX+=.6;s['Dolby Cinema']+=.5;s.ScreenX+=.2}if(/drama|ドラマ|romance|恋愛|documentary|ドキュメンタリー/.test(g)){s['通常上映']+=.5;s['Dolby Cinema']+=.2;s['4DX / MX4D']-=.8;s.ScreenX-=.5}Object.keys(s).forEach(k=>s[k]=clamp(s[k]));return s}function reason(k){return k==='IMAX'?'大画面・スケール感との相性':k==='Dolby Cinema'?'黒・コントラストと立体音響':k==='4DX / MX4D'?'動きのある場面を身体で楽しむ':k==='ScreenX'?'左右まで広がる視界を楽しむ':'追加演出なしで作品に集中'}async function run(){const q=input.value.trim();if(!q)return;btn.disabled=true;out.innerHTML='<div class="decisionNote">作品情報を確認中…</div>';try{const r=await fetch('https://backend-one-gray-94.vercel.app/api/movies?q='+encodeURIComponent(q)+'&limit=5',{cache:'no-store'}),d=await r.json(),m=[...(d.movies||[]),...(d.external||[])][0];if(!m)throw 0;const scores=scoreMovie(m),rows=Object.entries(scores).sort((a,b)=>b[1]-a[1]);out.innerHTML='<div class="decisionNote"><b>'+(m.title||q)+'</b>の作品傾向からの目安</div>'+rows.map(([k,v])=>'<div class="formatScore"><b>'+k+'</b><strong>'+stars(v)+'</strong><span>'+reason(k)+'</span></div>').join('')+'<div class="decisionNote">※ジャンル等からの目安です。作品固有の上映仕様・上映有無は劇場公式情報を確認してください。</div>'}catch(e){out.innerHTML='<div class="decisionNote">作品情報を取得できませんでした。作品名を変えて再検索してください。</div>'}finally{btn.disabled=false}}btn.addEventListener('click',run);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run()}})})();</script>'''
    text=text.replace('</body>',js+'\n</body>',1)
    EXP.write_text(text,encoding='utf-8')

if __name__=='__main__':
    patch_data();patch_theaters();patch_experience();print('Applied experience decision UI and broad IMAX coverage')
