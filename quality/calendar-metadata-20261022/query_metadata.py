import json,os,pathlib,time,urllib.parse,urllib.request

API="https://api.themoviedb.org/3/search/movie"
KEY=os.environ["TMDB_API_KEY"]
QUERIES=[
  {
    "market_year": 1982,
    "title": "ブッシュマン"
  },
  {
    "market_year": 1982,
    "title": "エンドレス・ラブ"
  },
  {
    "market_year": 1984,
    "title": "インディー・ジョーンズ 魔宮の伝説"
  },
  {
    "market_year": 1987,
    "title": "キングコング2"
  },
  {
    "market_year": 1987,
    "title": "シュワルツェネッガー プレデター"
  },
  {
    "market_year": 1989,
    "title": "星の王子 ニューヨークに行く"
  },
  {
    "market_year": 1991,
    "title": "おもいでぽろぽろ"
  },
  {
    "market_year": 1991,
    "title": "ダンス・ウィズ・ウルブス"
  },
  {
    "market_year": 1992,
    "title": "ツイン・ピークス ローラ・パーマー最期の七日間"
  },
  {
    "market_year": 1993,
    "title": "クレヨンしんちゃん"
  },
  {
    "market_year": 1993,
    "title": "シュワルツェネッガー ラスト・アクション・ヒーロー"
  },
  {
    "market_year": 1994,
    "title": "RAMPO"
  },
  {
    "market_year": 1995,
    "title": "マディソン群の橋"
  },
  {
    "market_year": 1995,
    "title": "藏 (くら)"
  },
  {
    "market_year": 1997,
    "title": "ロスト・ワールド"
  },
  {
    "market_year": 1997,
    "title": "スターウォーズ(3部作)"
  },
  {
    "market_year": 1997,
    "title": "新世紀エヴァンゲリオン劇場版"
  },
  {
    "market_year": 1999,
    "title": "恋に落ちたシェイクスピア"
  },
  {
    "market_year": 2000,
    "title": "007/ワールド・イズ・ノット・ナイフ"
  },
  {
    "market_year": 2000,
    "title": "エクソシスト ディレクターズカット版"
  },
  {
    "market_year": 2000,
    "title": "ザ・キッド"
  },
  {
    "market_year": 2001,
    "title": "エクソシスト(ディレクターズ・カット版)"
  },
  {
    "market_year": 2002,
    "title": "スターウォーズ エピソード2"
  },
  {
    "market_year": 2003,
    "title": "007 ダイ・アナザー・ディ"
  },
  {
    "market_year": 2003,
    "title": "バトル・ロワイアルII 鎮魂歌(レクイエム)"
  },
  {
    "market_year": 2005,
    "title": "エイリアンVSプレディター"
  },
  {
    "market_year": 2005,
    "title": "ティム・バートンのコープス・プライド"
  },
  {
    "market_year": 2006,
    "title": "ナルニア国物語 第一章:ライオンと魔女"
  },
  {
    "market_year": 2006,
    "title": "デスノート 前編"
  },
  {
    "market_year": 2007,
    "title": "ダイハード4.0"
  },
  {
    "market_year": 2008,
    "title": "ザ・ハプニング"
  },
  {
    "market_year": 2009,
    "title": "20世紀少年<第二章>最後の希望"
  },
  {
    "market_year": 2009,
    "title": "ドロップ"
  },
  {
    "market_year": 2009,
    "title": "劇場版 仮面ライダーディケイド侍戦隊シンケンジャー 銀幕版"
  },
  {
    "market_year": 2009,
    "title": "マダカスカル2"
  },
  {
    "market_year": 2009,
    "title": "映画クレヨンしんちゃん オタケベ!カスカベ野生王国"
  },
  {
    "market_year": 2010,
    "title": "劇場版 ポケットモンスター ダイアモンド&パール 幻影の覇者 ゾロアーク"
  },
  {
    "market_year": 2011,
    "title": "猿の惑星:創世記(ジェネシス)"
  },
  {
    "market_year": 2012,
    "title": "劇場版ポケットモンスター ベストウィッシュ キュレムVS(たい)聖剣士ケルディオ"
  },
  {
    "market_year": 2013,
    "title": "映画ドラえもん のび太のひみつ道具博物館(ミュージアム)"
  },
  {
    "market_year": 2013,
    "title": "映画クレヨンしんちゃん バカうまっ!B級グルメサバイバル!!"
  },
  {
    "market_year": 2014,
    "title": "猿の惑星:新世紀(ライジング)"
  },
  {
    "market_year": 2014,
    "title": "LIFE!"
  },
  {
    "market_year": 2015,
    "title": "名探偵コナン 業火の向日葵(ひまわり)"
  },
  {
    "market_year": 2016,
    "title": "信長協奏曲 ノブナガコンツェルト"
  },
  {
    "market_year": 2018,
    "title": "映画クレヨンしんちゃん 爆盛!カンフーボーイズ ~拉麵大乱~"
  },
  {
    "market_year": 2019,
    "title": "コンフィデンスマンJP"
  },
  {
    "market_year": 2019,
    "title": "映画クレヨンしんちゃん 新婚旅行ハリケーン ~失われたひろし~"
  },
  {
    "market_year": 2023,
    "title": "タイタニック：ジェームズ・キャメロン25周年3Dリマスター"
  }
]
out={"metadata":[]}
for item in QUERIES:
    params={"query":item["title"],"region":"JP","include_adult":"false","page":1,"language":"ja-JP","api_key":KEY}
    try:
        url=API+"?"+urllib.parse.urlencode(params)
        with urllib.request.urlopen(url,timeout=20) as response:
            result=json.load(response)
        rows=result.get("results",[])
        out["metadata"].append({
            "market_year":item["market_year"],
            "source_title":item["title"],
            "request":"TMDB official /search/movie",
            "results":[{k:m.get(k) for k in ["id","title","original_title","release_date","poster_path"]} for m in rows[:10]]
        })
    except Exception as exc:
        out["metadata"].append({"market_year":item["market_year"],"source_title":item["title"],"error":type(exc).__name__})
    time.sleep(0.2)
pathlib.Path("metadata-diagnostic.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Queried",len(QUERIES),"remaining single-title records through the official TMDB API; no product data writes")
