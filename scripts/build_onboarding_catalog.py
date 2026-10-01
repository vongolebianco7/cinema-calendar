"""Build a stable 100-film onboarding list from the repository's TMDB ranking data."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PICKS = {
    '日本': [
        ['七人の侍','羅生門','東京物語','生きる','用心棒','切腹','天国と地獄','雨月物語','砂の女'],
        ['火垂るの墓','となりのトトロ','風の谷のナウシカ','天空の城ラピュタ','AKIRA','乱','タンポポ','魔女の宅急便'],
        ['もののけ姫','PERFECT BLUE','GHOST IN THE SHELL / 攻殻機動隊','紅の豚','耳をすませば','HANA-BI','CURE','Love Letter'],
        ['千と千尋の神隠し','ハウルの動く城','パプリカ','時をかける少女','千年女優','誰も知らない','歩いても 歩いても','たそがれ清兵衛','おくりびと'],
        ['君の名は。','映画 聲の形','万引き家族','カメラを止めるな！','おおかみこどもの雨と雪','風立ちぬ','かぐや姫の物語','告白'],
        ['怪物','ゴジラ-1.0','PERFECT DAYS','ドライブ・マイ・カー','すずめの戸締まり','劇場版「鬼滅の刃」無限列車編','シン・エヴァンゲリオン劇場版:||','ルックバック'],
    ],
    '海外映画': [
        ['ゴッドファーザー','十二人の怒れる男','サイコ','裏窓','スター・ウォーズ エピソード４／新たなる希望','エイリアン','カサブランカ','2001年宇宙の旅','地獄の黙示録','時計じかけのオレンジ'],
        ['バック・トゥ・ザ・フューチャー','シャイニング','スター・ウォーズ エピソード５／帝国の逆襲','いまを生きる','ニュー・シネマ・パラダイス','フルメタル・ジャケット','E.T.','ブレードランナー'],
        ['ショーシャンクの空に','フォレスト・ガンプ／一期一会','シンドラーのリスト','パルプ・フィクション','タイタニック','マトリックス','セブン','羊たちの沈黙'],
        ['ダークナイト','ロード・オブ・ザ・リング','グラディエーター','戦場のピアニスト','アバター','プレステージ','ボーン・アイデンティティー','アメリ'],
        ['インターステラー','インセプション','パラサイト 半地下の家族','ラ・ラ・ランド','マッドマックス 怒りのデス・ロード','グランド・ブダペスト・ホテル','アベンジャーズ／インフィニティ・ウォー','スパイダーマン：スパイダーバース'],
        ['オッペンハイマー','トップガン マーヴェリック','エブリシング・エブリウェア・オール・アット・ワンス','DUNE／デューン 砂の惑星','哀れなるものたち','スパイダーマン：アクロス・ザ・スパイダーバース','野生の島のロズ','長ぐつをはいたネコと9つの命'],
    ],
}
rankings = json.loads((ROOT/'data/rankings.json').read_text())['rankings']
by_title = {}
preferred_ids = {'魔女の宅急便': 16859}  # Original animated film; the catalog also has a 2014 remake.
for region, genres in rankings.items():
    for genre, eras in genres.items():
        for era, movies in eras.items():
            for movie in movies:
                candidates = by_title.setdefault(movie['title'], {})
                entry = candidates.setdefault(movie['id'], {**movie, 'genres': set(), 'regions': set()})
                entry['genres'].add(genre)
                entry['regions'].add(region)
directors = json.loads((ROOT/'data/directors.json').read_text())['directors']
by_id = {}
for director in directors.values():
    for work in director.get('works', []):
        if work.get('id'):
            by_id.setdefault(work['id'], set()).add(director['name'])
selected, missing = [], []
for index in range(10):
    for region in ('日本', '海外映画'):
        for decade in PICKS[region]:
            if index >= len(decade):
                continue
            title = decade[index]
            candidates = by_title.get(title, {})
            movie = candidates.get(preferred_ids[title]) if title in preferred_ids else next(iter(candidates.values()), None)
            if not movie:
                missing.append(title)
                continue
            if region == '日本' and '邦画' not in movie['regions']:
                raise SystemExit(f'Japanese classification mismatch: {title}')
            if region == '海外映画' and '邦画' in movie['regions']:
                raise SystemExit(f'Overseas classification mismatch: {title}')
            names = by_id.get(movie['id'], set())
            record = {
                'id': movie['id'], 'title': title, 'year': int(movie['year']),
                'poster': movie['poster'], 'genres': sorted(movie['genres'] - {'ドキュメンタリー'})[:6],
                'region': region,
            }
            if len(names) == 1:
                record['director'] = next(iter(names))
            selected.append(record)
if missing or len(selected) != 100 or len({m['id'] for m in selected}) != 100:
    raise SystemExit(f'Invalid curated list: {len(selected)} films, missing {missing}, duplicates {[m["title"] for m in selected if sum(x["id"] == m["id"] for x in selected)>1]}')
(ROOT/'data/onboarding-films.json').write_text(json.dumps({'version':'2026-09-27-editorial-v2','definition':'Cinemap curated classics and major films v2','films':selected}, ensure_ascii=False, separators=(',', ':')))
print('Wrote 100 curated onboarding films.')
