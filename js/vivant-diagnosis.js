(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VivantDiagnosis = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const AXES = ['trust', 'nerve', 'empathy', 'curiosity', 'patience', 'mischief'];
  const questions = [
    { prompt: '旅先で予定がひとつ空きました。', choices: [
      ['a', '路地の小さな喫茶店に入る', { curiosity: 2, empathy: 1 }], ['b', '地図にない展望台を探す', { nerve: 2, curiosity: 1 }], ['c', '宿の人に町の話を聞く', { trust: 2, patience: 1 }], ['d', '近くの市場を一周する', { mischief: 1, empathy: 1, curiosity: 1 }]] },
    { prompt: '待ち合わせに少し早く着いたときは？', choices: [
      ['a', '周りの人の会話をぼんやり聞く', { curiosity: 1, patience: 2 }], ['b', '先に店へ入って席を選ぶ', { nerve: 1, trust: 1, patience: 1 }], ['c', '相手が来たら驚く仕掛けを考える', { mischief: 2, empathy: 1 }], ['d', '今日の段取りを頭の中で整える', { patience: 2, curiosity: 1 }]] },
    { prompt: '食堂で最後のひと皿が残っています。', choices: [
      ['a', 'みんなに声をかけて分ける', { empathy: 2, trust: 1 }], ['b', '店の人におすすめの食べ方を聞く', { trust: 1, curiosity: 2 }], ['c', '譲り合いの様子を見てから決める', { patience: 2, empathy: 1 }], ['d', '思い切って注文し、話の種にする', { nerve: 2, mischief: 1 }]] },
    { prompt: '知らない街で急に雨が降ってきました。', choices: [
      ['a', '近くの人に雨宿りの場所を尋ねる', { trust: 2, empathy: 1 }], ['b', '濡れてもよさそうな道を歩く', { nerve: 2, mischief: 1 }], ['c', '店先を眺めながら雨が弱まるのを待つ', { patience: 2, curiosity: 1 }], ['d', '傘を買って、ついでに寄り道する', { curiosity: 2, empathy: 1 }]] },
    { prompt: '古い引き出しから見慣れない鍵が出てきました。', choices: [
      ['a', '何の鍵か、持ち主に聞いてみる', { trust: 2, curiosity: 1 }], ['b', '形をよく見て、合いそうな場所を考える', { curiosity: 2, patience: 1 }], ['c', 'なくさないよう目立つ場所に置く', { patience: 2, empathy: 1 }], ['d', '宝箱の鍵ということにして楽しむ', { mischief: 2, curiosity: 1 }]] },
    { prompt: '友人が「どちらでもいい」と言っています。', choices: [
      ['a', '候補を二つに絞って聞き直す', { empathy: 2, patience: 1 }], ['b', '自分が行きたい方を提案する', { nerve: 2, trust: 1 }], ['c', '本人が気になっていたものを思い出す', { empathy: 1, curiosity: 2 }], ['d', 'くじ引きで決めてみる', { mischief: 2, patience: 1 }]] },
    { prompt: '旅の荷物にひとつだけ足すなら？', choices: [
      ['a', '使い慣れた小さなノート', { patience: 2, curiosity: 1 }], ['b', '誰かに渡せるお菓子', { empathy: 2, trust: 1 }], ['c', '行き先を決めないための余白', { nerve: 1, curiosity: 2 }], ['d', '話題になりそうな変な小物', { mischief: 2, empathy: 1 }]] },
    { prompt: '帰り道、知らない子が道に迷っているようです。', choices: [
      ['a', '目線を合わせて声をかける', { empathy: 2, trust: 1 }], ['b', '近くの大人や店の人にも協力を頼む', { trust: 2, patience: 1 }], ['c', '周囲を見て、案内できる場所を探す', { curiosity: 2, patience: 1 }], ['d', 'まず安心できるよう明るく話す', { mischief: 1, empathy: 2 }]] }
  ].map(question => ({ prompt: question.prompt, choices: question.choices.map(([id, label, traits]) => ({ id, label, traits })) }));

  const resultRows = [
    ['r01','別班','現地対応員','nerve curiosity','状況を見極めたうえで、必要な場面では前に出る選択が重なりました。'],
    ['r02','公安','情報分析官','curiosity patience','手がかりを集め、急がず筋道を追う傾向が表れています。'],
    ['r03','テント','交渉担当','trust empathy','相手との距離を測りながら、話を前へ進める力が出ています。'],
    ['r04','丸菱商事','海外事業開発','trust curiosity','人と土地への関心を、次の機会につなげる選択が目立ちました。'],
    ['r05','警視庁','捜査支援','patience curiosity','小さな違和感を拾い、順に確かめる姿勢が出ています。'],
    ['r06','自衛隊','後方支援','patience empathy','周囲を見ながら、場がうまく回る方法を選んでいます。'],
    ['r07','バルカ共和国','通訳・調整役','trust empathy','異なる立場の間に入り、互いの話をつなぐタイプです。'],
    ['r08','日本大使館','文化交流担当','curiosity empathy','知らない相手や場所にも関心を向ける傾向があります。'],
    ['r09','バルカ警察','現場連絡係','nerve trust','迷ったときも人に声をかけ、場を動かす選択ができています。'],
    ['r10','ノゴーン・ベキ一行','土地交渉の窓口','patience trust','急がず相手の事情を読み、関係を築く傾向が表れました。'],
    ['r11','丸菱商事','稟議書の守護神','patience mischief','段取りを大切にしつつ、場を少し軽くする工夫も得意です。'],
    ['r12','公安','会議室・資料管理','patience curiosity','細部に気づき、抜けのない準備を選ぶ傾向が出ています。'],
    ['r13','別班','出張手配の達人','trust patience','人の動きと予定を気にかけ、先回りして整えるタイプです。'],
    ['r14','テント','現地食堂の広報','mischief empathy','まず相手を笑顔にして、輪を広げていく力が出ています。'],
    ['r15','バルカ観光局','迷子案内の名人','empathy curiosity','困っている人に気づき、周囲の情報を使って助ける傾向です。'],
    ['r16','警視庁','差し入れ担当','empathy patience','張りつめた場の空気を読み、さりげなく支えるタイプです。'],
    ['r17','丸菱商事','送別会幹事','mischief trust','人を巻き込み、みんなが楽しめる段取りを考えています。'],
    ['r18','別班','作戦会議のホワイトボード係','mischief curiosity','散らかった話を面白がり、見える形にする力がありそうです。']
  ];
  const results = resultRows.map(([id, organization, role, axisText, reason]) => {
    const axes = axisText.split(' ');
    const vector = Object.fromEntries(AXES.map(axis => [axis, axes.includes(axis) ? 2 : 0]));
    return { id, organization, role, vector, reason };
  });

  const genreRows = [
    ['アクション','nerve curiosity', 'マッドマックス 怒りのデス・ロード|ダイ・ハード|ミッション：インポッシブル／ゴースト・プロトコル|ターミネーター2|エイリアン2|グラディエーター|ジョン・ウィック|スピード|トップガン マーヴェリック|ベイビー・ドライバー'],
    ['SF','curiosity patience','2001年宇宙の旅|ブレードランナー|ブレードランナー 2049|インターステラー|メッセージ|エイリアン|E.T.|バック・トゥ・ザ・フューチャー|マトリックス|ターミネーター'],
    ['ドラマ','empathy patience','ショーシャンクの空に|フォレスト・ガンプ／一期一会|グリーンブック|レインマン|東京物語|パラサイト 半地下の家族|万引き家族|ライフ・イズ・ビューティフル|グッド・ウィル・ハンティング／旅立ち|英国王のスピーチ'],
    ['コメディ','mischief empathy','ホーム・アローン|ローマの休日|ゴーストバスターズ|バック・トゥ・ザ・フューチャー PART2|スクール・オブ・ロック|グランド・ブダペスト・ホテル|トゥルーマン・ショー|アメリ|天使にラブ・ソングを…|テルマエ・ロマエ'],
    ['アニメーション','curiosity empathy','となりのトトロ|千と千尋の神隠し|もののけ姫|君の名は。|トイ・ストーリー|ウォーリー|スパイダーマン：スパイダーバース|インサイド・ヘッド|ファインディング・ニモ|美女と野獣'],
    ['アドベンチャー','nerve curiosity','インディ・ジョーンズ／最後の聖戦|ジュラシック・パーク|ロード・オブ・ザ・リング／旅の仲間|パイレーツ・オブ・カリビアン／呪われた海賊たち|ライフ・オブ・パイ／トラと漂流した227日|スタンド・バイ・ミー|グーニーズ|アラビアのロレンス|レヴェナント：蘇えりし者|アバター'],
    ['犯罪','patience nerve','ゴッドファーザー|ゴッドファーザー PART II|パルプ・フィクション|ヒート|セブン|レオン|ユージュアル・サスペクツ|オーシャンズ11|羅生門|ジョーカー'],
    ['サスペンス','curiosity patience','羊たちの沈黙|裏窓|めまい|プレステージ|ゾディアック|ゴーン・ガール|セッション|ユージュアル・サスペクツ|オールド・ボーイ|CURE'],
    ['ロマンス','empathy trust','タイタニック|恋人たちの予感|ビフォア・サンライズ 恋人までの距離|ラ・ラ・ランド|きみに読む物語|君に読む物語|花束みたいな恋をした|シェルブールの雨傘|ブロークバック・マウンテン|エターナル・サンシャイン'],
    ['ホラー','nerve curiosity','シャイニング|エクソシスト|ジョーズ|ゲット・アウト|リング|ナイト・オブ・ザ・リビングデッド|ヘレディタリー／継承|ミッドサマー|チャイルド・プレイ|クワイエット・プレイス'],
    ['ファンタジー','curiosity empathy','オズの魔法使|ハリー・ポッターと賢者の石|パンズ・ラビリンス|シェイプ・オブ・ウォーター|ビッグ・フィッシュ|もののけ姫|美女と野獣|アラジン|ネバーエンディング・ストーリー|パイレーツ・オブ・カリビアン／デッドマンズ・チェスト'],
    ['ミュージカル','mischief empathy','雨に唄えば|サウンド・オブ・ミュージック|ウエスト・サイド物語|シカゴ|グレイテスト・ショーマン|ヘアスプレー|アナと雪の女王|レ・ミゼラブル|ムーラン・ルージュ|ブルース・ブラザース']
  ];
  let movieNo = 0;
  const movies = genreRows.flatMap(([genre, traitText, titles]) => titles.split('|').map(title => ({
    id: `film-${String(++movieNo).padStart(3, '0')}`, title, genre,
    traits: Object.fromEntries(AXES.map(axis => [axis, traitText.split(' ').includes(axis) ? 2 : 0]))
  })));

  function hash(text) {
    let value = 2166136261;
    for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
    return value >>> 0;
  }
  function scoreAnswers(answerIds) {
    const ids = Array.isArray(answerIds) ? answerIds : [];
    const scores = Object.fromEntries(AXES.map(axis => [axis, 0]));
    questions.forEach((question, index) => {
      const choice = question.choices.find(item => item.id === ids[index]);
      if (choice) for (const axis of AXES) scores[axis] += choice.traits[axis] || 0;
    });
    return scores;
  }
  function similarity(left, right) {
    return AXES.reduce((total, axis) => total + left[axis] * right[axis], 0);
  }
  function getResult(answerIds) {
    const scores = scoreAnswers(answerIds);
    return results.map((result, index) => ({ result, index, score: similarity(scores, result.vector) }))
      .sort((a, b) => b.score - a.score || (hash(`${(answerIds || []).join('|')}:${a.result.id}`) - hash(`${(answerIds || []).join('|')}:${b.result.id}`)))[0].result;
  }
  function recommendMovies(answerIds, watchedIds = []) {
    const profile = scoreAnswers(answerIds);
    const result = getResult(answerIds);
    const excluded = new Set(watchedIds);
    const seed = hash((answerIds || []).join('|'));
    const seenTitles = new Set();
    const ranked = movies.filter(movie => {
      if (excluded.has(movie.id) || seenTitles.has(movie.title)) return false;
      seenTitles.add(movie.title);
      return true;
    }).map(movie => ({
      movie,
      score: similarity(profile, movie.traits) + similarity(result.vector, movie.traits) * 0.2 + (hash(`${seed}:${movie.id}`) % 1000) / 100000
    })).sort((a, b) => b.score - a.score || a.movie.id.localeCompare(b.movie.id));
    const selected = [];
    const genres = new Set();
    for (const item of ranked) {
      if (genres.has(item.movie.genre)) continue;
      selected.push(item.movie); genres.add(item.movie.genre);
      if (selected.length === 3) return selected;
    }
    for (const item of ranked) if (!selected.some(movie => movie.id === item.movie.id)) {
      selected.push(item.movie);
      if (selected.length === 3) break;
    }
    return selected;
  }

  return { AXES, QUESTIONS: questions, RESULTS: results, MOVIES: movies, getResult, recommendMovies };
});
