from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[1]

# Official Kogyo Tsushin all-time ranking snapshot, 2026-09-06.
ROWS = [
(1,'劇場版「鬼滅の刃」無限列車編',407.5,2020,'邦画'),(2,'劇場版「鬼滅の刃」無限城編 第一章 猗窩座再来',403.6,2025,'邦画'),(3,'千と千尋の神隠し',316.8,2001,'邦画'),(4,'タイタニック',277.7,1997,'洋画'),(5,'アナと雪の女王',255.0,2014,'洋画'),(6,'君の名は。',251.7,2016,'邦画'),(7,'もののけ姫',214.6,1997,'邦画'),(8,'国宝',209.0,2025,'邦画'),(9,'ONE PIECE FILM RED',203.4,2022,'邦画'),(10,'ハリー・ポッターと賢者の石',203.0,2001,'洋画'),(11,'ハウルの動く城',196.0,2004,'邦画'),(12,'踊る大捜査線 THE MOVIE2 レインボーブリッジを封鎖せよ！',173.5,2003,'邦画'),
(13,'ハリー・ポッターと秘密の部屋',173.0,2002,'洋画'),(14,'THE FIRST SLAM DUNK',166.7,2022,'邦画'),(15,'アバター',159.0,2009,'洋画'),(16,'名探偵コナン 100万ドルの五稜星（みちしるべ）',158.0,2024,'邦画'),(17,'ズートピア2',157.1,2025,'洋画'),(18,'崖の上のポニョ',155.0,2008,'邦画'),(19,'すずめの戸締まり',149.4,2022,'邦画'),(20,'名探偵コナン 隻眼の残像(フラッシュバック)',147.4,2025,'邦画'),(21,'映画ちいかわ 人魚の島のひみつ',146.7,2026,'邦画'),(22,'天気の子',142.3,2019,'邦画'),(23,'ザ・スーパーマリオブラザーズ・ムービー',140.2,2023,'洋画'),(24,'劇場版 呪術廻戦 0',138.9,2021,'邦画'),(25,'名探偵コナン 黒鉄の魚影（サブマリン）',138.8,2023,'邦画'),(26,'トップガン マーヴェリック',138.1,2022,'洋画'),(27,'ラスト・サムライ',137.0,2003,'洋画'),(27,'名探偵コナン ハイウェイの堕天使',137.0,2026,'邦画'),(29,'ボヘミアン・ラプソディ',135.1,2018,'洋画'),(30,'E．T．',135.0,1982,'洋画'),(30,'アルマゲドン',135.0,1998,'洋画'),(30,'ハリー・ポッターとアズカバンの囚人',135.0,2004,'洋画'),(33,'アナと雪の女王2',133.7,2019,'洋画'),(34,'ジュラシック・パーク',128.5,1993,'洋画'),(35,'トイ・ストーリー5',128.3,2026,'洋画'),(36,'スター・ウォーズ エピソード1 ファントム・メナス',127.1,1999,'洋画'),(37,'美女と野獣',124.0,2017,'洋画'),(38,'アラジン',121.6,2019,'洋画'),(39,'風立ちぬ',120.2,2013,'邦画'),(40,'アリス・イン・ワンダーランド',118.0,2010,'洋画'),(41,'スター・ウォーズ／フォースの覚醒',116.5,2015,'洋画'),(42,'劇場版ハイキュー！！ ゴミ捨て場の決戦',116.4,2024,'邦画'),(43,'南極物語',110.0,1983,'邦画'),(43,'マトリックス・リローデッド',110.0,2003,'洋画'),(43,'ファインディング・ニモ',110.0,2003,'洋画'),(43,'ハリー・ポッターと炎のゴブレット',110.0,2005,'洋画'),(47,'パイレーツ・オブ・カリビアン ワールド・エンド',109.0,2007,'洋画'),(48,'劇場版 チェンソーマン レゼ篇',108.3,2025,'邦画'),(49,'トイ・ストーリー3',108.0,2010,'洋画'),(50,'インデペンデンス・デイ',106.5,1996,'洋画'),(51,'ロード・オブ・ザ・リング/王の帰還',103.2,2004,'洋画'),(52,'シン・エヴァンゲリオン劇場版:||',102.8,2021,'邦画'),(53,'踊る大捜査線 THE MOVIE',101.0,1998,'邦画'),(54,'トイ・ストーリー4',100.9,2019,'洋画'),(55,'パイレーツ・オブ・カリビアン デッドマンズ・チェスト',100.2,2006,'洋画'),(56,'子猫物語',98.0,1986,'邦画'),(57,'名探偵コナン ハロウィンの花嫁',97.8,2022,'邦画'),(58,'M：I-2',97.0,2000,'洋画'),(59,'ハリー・ポッターと死の秘宝 PART2',96.7,2011,'洋画'),(60,'A．I．',96.6,2001,'洋画'),(61,'ジュラシック・ワールド',95.3,2015,'洋画'),(62,'バック・トゥ・ザ・フューチャーPART2',95.0,1989,'洋画'),(62,'ロスト・ワールド／ジュラシック・パーク',95.0,1997,'洋画'),(64,'ハリー・ポッターと不死鳥の騎士団',94.0,2007,'洋画'),(64,'君たちはどう生きるか',94.0,2023,'邦画'),(66,'モンスターズ・インク',93.7,2002,'洋画'),(66,'名探偵コナン 紺青の拳（フィスト）',93.7,2019,'邦画'),(68,'スター・ウォーズ エピソード2 クローンの攻撃',93.6,2002,'洋画'),(69,'劇場版コード・ブルー -ドクターヘリ緊急救命-',93.0,2018,'邦画'),(70,'借りぐらしのアリエッティ',92.6,2010,'邦画'),(71,'スター・ウォーズ エピソード3 シスの復讐',92.3,2005,'洋画'),(72,'天と地と',92.0,1990,'邦画'),(73,'ベイマックス',91.8,2014,'洋画'),(73,'名探偵コナン　ゼロの執行人',91.8,2018,'邦画'),(75,'ロード・オブ・ザ・リング',90.7,2002,'洋画'),(76,'ダ・ヴィンチ・コード',90.5,2006,'洋画'),(77,'ジョーズ',90.0,1975,'洋画'),(78,'モンスターズ・ユニバーシティ',89.6,2013,'洋画'),(79,'パイレーツ・オブ・カリビアン／生命の泉',88.7,2011,'洋画'),(80,'ターミネーター2',87.9,1991,'洋画'),(81,'永遠の0',87.6,2013,'邦画'),(82,'マトリックス',87.0,1999,'洋画'),(83,'ROOKIES-卒業-',85.5,2009,'邦画'),(84,'世界の中心で、愛をさけぶ',85.0,2004,'邦画'),(85,'Michael／マイケル',84.3,2026,'洋画'),(86,'STAND BY ME ドラえもん',83.8,2014,'邦画'),(87,'シン・ゴジラ',82.5,2016,'邦画'),(88,'敦煌',82.0,1988,'邦画'),(88,'バック・トゥ・ザ・フューチャーPART3',82.0,1990,'洋画'),(88,'ターミネーター3',82.0,2003,'洋画'),(91,'HERO',81.5,2007,'邦画'),(92,'ディープ・インパクト',81.0,1998,'洋画'),(93,'ジュラシック・ワールド／炎の王国',80.7,2018,'洋画'),(94,'THE LAST MESSAGE 海猿',80.4,2010,'邦画'),(95,'キングダム 大将軍の帰還',80.3,2024,'邦画'),(96,'ハリー・ポッターと謎のプリンス',80.0,2009,'洋画'),(97,'ザ・スーパーマリオギャラクシー・ムービー',79.3,2026,'洋画'),(98,'ロード・オブ・ザ・リング 二つの塔',79.0,2003,'洋画'),(99,'ゲド戦記',78.4,2006,'邦画'),(100,'映画 妖怪ウォッチ 誕生の秘密だニャン！',78.0,2014,'邦画')]

box_path = ROOT / 'data/boxoffice.json'
data = json.loads(box_path.read_text(encoding='utf-8'))
data['generated_at'] = '2026-09-27'
data['all_time'] = [dict(rank=r,title=t,gross=g,year=y,region=reg) for r,t,g,y,reg in ROWS]
for src in data.get('sources',[]):
    if src.get('name','').startswith('興行通信社'):
        src['as_of'] = '2026-09-06'
box_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

rank_path = ROOT / 'rankings.html'
text = rank_path.read_text(encoding='utf-8')

# Replace eager hydration (which blocks the ranking on N movie API calls) with viewport-lazy hydration.
text, n = re.subn(
    r'async function hydrateBoxCards\(list\)\{.*?\}\nfunction productionBucket',
    '''async function hydrateOneBoxCard(card){const name=card.dataset.boxFilm;if(!name)return;const movie=await resolveMovie(name);if(!movie)return;const img=card.querySelector("[data-box-poster]"),ph=card.querySelector("[data-box-placeholder]");if(img&&movie.poster){img.src=movie.poster;img.hidden=false;if(ph)ph.hidden=true}if(movie.tmdbId||movie.id)card.href="search.html?id="+encodeURIComponent(movie.tmdbId||movie.id)+"&search="+encodeURIComponent(movie.title||name)}\nfunction hydrateBoxCardsLazy(){const cards=[...document.querySelectorAll("[data-box-film]")];if(!("IntersectionObserver" in window)){cards.slice(0,18).forEach(c=>hydrateOneBoxCard(c));return}const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;io.unobserve(e.target);hydrateOneBoxCard(e.target)}),{rootMargin:"500px 0px"});cards.forEach(c=>io.observe(c))}\nfunction productionBucket''',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('hydrateBoxCards block not found')

new_render = r'''async function renderBox(){const regions=["すべて","国内","国外"];$("#boxRegionChips").innerHTML=regions.map(x=>'<button class="chip '+(x===boxRegion?'active':'')+'" data-box-region="'+x+'">'+x+'</button>').join("");const years=Object.keys(boxoffice.by_year||{}).sort((a,b)=>Number(b)-Number(a)),periods=["歴代",...years];if(!periods.includes(boxEra))boxEra="歴代";$("#boxEraChips").innerHTML=periods.map(x=>'<button class="chip '+(x===boxEra?'active':'')+'" data-box-era="'+x+'">'+x+'</button>').join("");document.querySelectorAll('[data-box-region]').forEach(b=>b.onclick=()=>{boxRegion=b.dataset.boxRegion;render()});document.querySelectorAll('[data-box-era]').forEach(b=>b.onclick=()=>{boxEra=b.dataset.boxEra;render()});let raw=boxEra==="歴代"?(boxoffice.all_time||[]):((boxoffice.by_year||{})[boxEra]||[]);const bucket=m=>productionBucket(null,m);let list=boxRegion==="すべて"?raw:raw.filter(x=>bucket(x)===boxRegion);list=[...list].sort((a,b)=>(b.gross||0)-(a.gross||0));$("#grid").className="rankGrid";$("#grid").innerHTML=list.length?list.map((m,i)=>'<a class="rankCard" data-box-film="'+String(m.title).replace(/&/g,"&amp;").replace(/"/g,"&quot;")+'" href="search.html?search='+encodeURIComponent(m.title)+'"><img data-box-poster hidden loading="lazy" alt=""><div class="rankPosterPlaceholder" data-box-placeholder></div><div class="body"><div class="no">#'+(i+1)+'</div><div class="title">'+m.title+'</div><div class="meta">'+(m.year||boxEra||'')+' · '+bucket(m)+'</div><div class="meta" style="font-weight:800;color:#e5e7eb">'+Number(m.gross||0).toFixed(1)+'億円</div></div></a>').join(''):'<div class="empty">該当作品がありません</div>';$("#sourceNote").textContent="日本国内興行収入 · 国内/国外は公式資料の邦画/洋画区分を優先 · "+(boxEra==="歴代"?"歴代ベスト100":""+boxEra+"年");hydrateBoxCardsLazy()}'''
text, n = re.subn(r'async function renderBox\(\)\{.*?\}\nfunction awardFilmName', new_render + '\nfunction awardFilmName', text, count=1, flags=re.S)
if n != 1:
    raise SystemExit('renderBox block not found')
rank_path.write_text(text, encoding='utf-8')
print(f'Expanded all-time box office to {len(ROWS)} rows and made rendering non-blocking')
