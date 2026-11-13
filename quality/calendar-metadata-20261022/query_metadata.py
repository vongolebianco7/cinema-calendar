import json,os,pathlib,time,urllib.parse,urllib.request
API="https://api.themoviedb.org/3/search/movie"
KEY=os.environ["TMDB_API_KEY"]
QUERIES=[
  {
    "source_title": "ブッシュマン",
    "market_year": 1982,
    "query": "The Gods Must Be Crazy"
  },
  {
    "source_title": "エンドレス・ラブ",
    "market_year": 1982,
    "query": "Endless Love 1981"
  },
  {
    "source_title": "インディー・ジョーンズ 魔宮の伝説",
    "market_year": 1984,
    "query": "Indiana Jones and the Temple of Doom"
  },
  {
    "source_title": "キングコング2",
    "market_year": 1987,
    "query": "King Kong Lives"
  },
  {
    "source_title": "シュワルツェネッガー プレデター",
    "market_year": 1987,
    "query": "Predator"
  },
  {
    "source_title": "星の王子 ニューヨークに行く",
    "market_year": 1989,
    "query": "Coming to America"
  },
  {
    "source_title": "おもいでぽろぽろ",
    "market_year": 1991,
    "query": "Only Yesterday"
  },
  {
    "source_title": "ダンス・ウィズ・ウルブス",
    "market_year": 1991,
    "query": "Dances with Wolves"
  },
  {
    "source_title": "ツイン・ピークス ローラ・パーマー最期の七日間",
    "market_year": 1992,
    "query": "Twin Peaks: Fire Walk with Me"
  },
  {
    "source_title": "クレヨンしんちゃん",
    "market_year": 1993,
    "query": "Crayon Shin-chan: Action Mask vs. Leotard Devil"
  },
  {
    "source_title": "シュワルツェネッガー ラスト・アクション・ヒーロー",
    "market_year": 1993,
    "query": "Last Action Hero"
  },
  {
    "source_title": "RAMPO",
    "market_year": 1994,
    "query": "RAMPO"
  },
  {
    "source_title": "マディソン群の橋",
    "market_year": 1995,
    "query": "The Bridges of Madison County"
  },
  {
    "source_title": "藏 (くら)",
    "market_year": 1995,
    "query": "Kura"
  },
  {
    "source_title": "藏 (くら)",
    "market_year": 1995,
    "query": "藏"
  },
  {
    "source_title": "ロスト・ワールド",
    "market_year": 1997,
    "query": "The Lost World: Jurassic Park"
  },
  {
    "source_title": "スターウォーズ(3部作)",
    "market_year": 1997,
    "query": "Star Wars"
  },
  {
    "source_title": "スターウォーズ(3部作)",
    "market_year": 1997,
    "query": "The Empire Strikes Back"
  },
  {
    "source_title": "スターウォーズ(3部作)",
    "market_year": 1997,
    "query": "Return of the Jedi"
  },
  {
    "source_title": "新世紀エヴァンゲリオン劇場版",
    "market_year": 1997,
    "query": "Death and Rebirth"
  },
  {
    "source_title": "新世紀エヴァンゲリオン劇場版",
    "market_year": 1997,
    "query": "The End of Evangelion"
  },
  {
    "source_title": "恋に落ちたシェイクスピア",
    "market_year": 1999,
    "query": "Shakespeare in Love"
  },
  {
    "source_title": "007/ワールド・イズ・ノット・ナイフ",
    "market_year": 2000,
    "query": "The World Is Not Enough"
  },
  {
    "source_title": "エクソシスト ディレクターズカット版",
    "market_year": 2000,
    "query": "The Exorcist"
  },
  {
    "source_title": "ザ・キッド",
    "market_year": 2000,
    "query": "The Kid 2000"
  },
  {
    "source_title": "エクソシスト(ディレクターズ・カット版)",
    "market_year": 2001,
    "query": "The Exorcist"
  },
  {
    "source_title": "スターウォーズ エピソード2",
    "market_year": 2002,
    "query": "Star Wars: Episode II – Attack of the Clones"
  },
  {
    "source_title": "007 ダイ・アナザー・ディ",
    "market_year": 2003,
    "query": "Die Another Day"
  },
  {
    "source_title": "バトル・ロワイアルII 鎮魂歌(レクイエム)",
    "market_year": 2003,
    "query": "Battle Royale II: Requiem"
  },
  {
    "source_title": "エイリアンVSプレディター",
    "market_year": 2005,
    "query": "AVP: Alien vs. Predator"
  },
  {
    "source_title": "ティム・バートンのコープス・プライド",
    "market_year": 2005,
    "query": "Corpse Bride"
  },
  {
    "source_title": "ナルニア国物語 第一章:ライオンと魔女",
    "market_year": 2006,
    "query": "The Chronicles of Narnia: The Lion, the Witch and the Wardrobe"
  },
  {
    "source_title": "デスノート 前編",
    "market_year": 2006,
    "query": "Death Note 2006"
  },
  {
    "source_title": "ダイハード4.0",
    "market_year": 2007,
    "query": "Live Free or Die Hard"
  },
  {
    "source_title": "ザ・ハプニング",
    "market_year": 2008,
    "query": "The Happening"
  },
  {
    "source_title": "20世紀少年<第二章>最後の希望",
    "market_year": 2009,
    "query": "20th Century Boys 2: The Last Hope"
  },
  {
    "source_title": "ドロップ",
    "market_year": 2009,
    "query": "Drop 2009"
  },
  {
    "source_title": "劇場版 仮面ライダーディケイド侍戦隊シンケンジャー 銀幕版",
    "market_year": 2009,
    "query": "Kamen Rider Decade: All Riders vs. Dai-Shocker"
  },
  {
    "source_title": "劇場版 仮面ライダーディケイド侍戦隊シンケンジャー 銀幕版",
    "market_year": 2009,
    "query": "Samurai Sentai Shinkenger the Movie"
  },
  {
    "source_title": "マダカスカル2",
    "market_year": 2009,
    "query": "Madagascar: Escape 2 Africa"
  },
  {
    "source_title": "映画クレヨンしんちゃん オタケベ!カスカベ野生王国",
    "market_year": 2009,
    "query": "Crayon Shin-chan: Roar! Kasukabe Animal Kingdom"
  },
  {
    "source_title": "劇場版 ポケットモンスター ダイアモンド&パール 幻影の覇者 ゾロアーク",
    "market_year": 2010,
    "query": "Pokémon: Zoroark: Master of Illusions"
  },
  {
    "source_title": "猿の惑星:創世記(ジェネシス)",
    "market_year": 2011,
    "query": "Rise of the Planet of the Apes"
  },
  {
    "source_title": "劇場版ポケットモンスター ベストウィッシュ キュレムVS(たい)聖剣士ケルディオ",
    "market_year": 2012,
    "query": "Pokémon the Movie: Kyurem vs. the Sword of Justice"
  },
  {
    "source_title": "映画ドラえもん のび太のひみつ道具博物館(ミュージアム)",
    "market_year": 2013,
    "query": "Doraemon: Nobita's Secret Gadget Museum"
  },
  {
    "source_title": "映画クレヨンしんちゃん バカうまっ!B級グルメサバイバル!!",
    "market_year": 2013,
    "query": "Crayon Shin-chan: Bakauma! B-grade Gourmet Survival!!"
  },
  {
    "source_title": "猿の惑星:新世紀(ライジング)",
    "market_year": 2014,
    "query": "Dawn of the Planet of the Apes"
  },
  {
    "source_title": "LIFE!",
    "market_year": 2014,
    "query": "The Secret Life of Walter Mitty"
  },
  {
    "source_title": "名探偵コナン 業火の向日葵(ひまわり)",
    "market_year": 2015,
    "query": "Detective Conan: Sunflowers of Inferno"
  },
  {
    "source_title": "信長協奏曲 ノブナガコンツェルト",
    "market_year": 2016,
    "query": "Nobunaga Concerto"
  },
  {
    "source_title": "映画クレヨンしんちゃん 爆盛!カンフーボーイズ ~拉麵大乱~",
    "market_year": 2018,
    "query": "Crayon Shin-chan: Kung Fu Boys – Ramen Rebellion"
  },
  {
    "source_title": "コンフィデンスマンJP",
    "market_year": 2019,
    "query": "The Confidence Man JP: The Movie"
  },
  {
    "source_title": "映画クレヨンしんちゃん 新婚旅行ハリケーン ~失われたひろし~",
    "market_year": 2019,
    "query": "Crayon Shin-chan: Honeymoon Hurricane – The Lost Hiroshi"
  },
  {
    "source_title": "タイタニック：ジェームズ・キャメロン25周年3Dリマスター",
    "market_year": 2023,
    "query": "Titanic 3D"
  }
]
out={"metadata":[],"candidate_details":[]}
def get_json(url):
    with urllib.request.urlopen(url,timeout=20) as response:
        return json.load(response)
for item in QUERIES:
    params={"query":item["query"],"region":"JP","include_adult":"false","page":1,"language":"ja-JP","api_key":KEY}
    try:
        result=get_json(API+"?"+urllib.parse.urlencode(params))
        rows=result.get("results",[])
        eligible=[]
        for m in rows[:10]:
            release=(m.get("release_date") or "")[:4]
            if m.get("poster_path") and release.isdigit() and abs(int(release)-int(item["market_year"]))<=2:
                eligible.append(m)
        out["metadata"].append({
            "market_year":item["market_year"],
            "source_title":item["source_title"],
            "query":item["query"],
            "request":"TMDB official /search/movie",
            "results":[{k:m.get(k) for k in ["id","title","original_title","release_date","poster_path"]} for m in rows[:10]]
        })
        for m in eligible:
            try:
                detail=get_json("https://api.themoviedb.org/3/movie/"+str(m["id"])+"/release_dates?"+urllib.parse.urlencode({"api_key":KEY}))
                jp=next((r.get("release_dates",[]) for r in detail.get("results",[]) if r.get("iso_3166_1")=="JP"),[])
                out["candidate_details"].append({
                    "source_title":item["source_title"],"market_year":item["market_year"],"query":item["query"],
                    "id":m["id"],"title":m.get("title"),"original_title":m.get("original_title"),
                    "tmdb_release_date":m.get("release_date"),"poster_path":m.get("poster_path"),
                    "japan_release_dates":[{"date":x.get("release_date"),"type":x.get("type"),"note":x.get("note")} for x in jp]
                })
            except Exception as exc:
                out["candidate_details"].append({"source_title":item["source_title"],"query":item["query"],"id":m["id"],"error":type(exc).__name__})
            time.sleep(0.15)
    except Exception as exc:
        out["metadata"].append({"market_year":item["market_year"],"source_title":item["source_title"],"query":item["query"],"error":type(exc).__name__})
    time.sleep(0.15)
pathlib.Path("metadata-diagnostic.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Queried",len(QUERIES),"official title variants and Japan release dates for year-window poster candidates; no product data writes")
