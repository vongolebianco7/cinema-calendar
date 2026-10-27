# 日本向け8サービス・完全無料データ調達の調査（2026-10-27）

## 結論

**無料・合法・一般公開可能・国内8サービスの見放題映画を漏れなく収録**という4条件を同時に満たすデータソースは、今回確認した公式資料からは見つかっていない。Cinelvaは作品数を0件と偽装せず「未集計」を維持する。

## 公式資料に基づく比較

| 候補 | 無料利用 | 公開・利用条件 | 網羅性・実装判断 |
| --- | --- | --- | --- |
| TMDB Watch Providers | 非商用利用は無料、クレジット必須 | TMDBのロゴ・免責表示が必要。Watch ProvidersデータはJustWatchの帰属表示も必要 | **作品単位の提供先照会**。8サービスの完全カタログを保証しないため、全件数の根拠にはしない |
| JustWatch Data Export | 契約締結後に認証情報が渡される | パートナー契約が必要。一般サイトのスクレイピング・データ抽出は禁止 | 全タイトルのオファー情報を毎日取得できるが、**無償公開利用権は確認できない** |
| Watchmode Developer | 月2,500クレジットまで無料 | 非商用限定、帰属表示必須。無料枠は最大3か国 | 8サービスの日本国内映画全件を漏れなく取得・維持できる保証はない |

### 参照した一次資料

- TMDB API FAQ: https://developer.themoviedb.org/docs/faq
- TMDB API利用規約: https://www.themoviedb.org/api-terms-of-use
- TMDB Watch Providers: https://developer.themoviedb.org/reference/movie-watch-providers
- JustWatchパートナー提供内容: https://apis.justwatch.com/docs/content_partner/
- JustWatch Data Export（契約後にS3認証情報提供）: https://apis.justwatch.com/docs/data_export/
- JustWatch利用規約（無許可スクレイピング禁止）: https://support.justwatch.com/article/just-watchs-terms-of-use
- Watchmode料金・制約: https://api.watchmode.com/pricing

## 無料方針で実施できること

1. **非商用を維持**し、TMDB APIとJustWatchの帰属表示・利用条件を満たす。
2. 既存の作品単位の提供先情報は「参考情報」と明記し、見放題／レンタル／購入、対象地域、プランを混同しない。
3. 作品単位のデータを蓄積しても、**全件収録と監査済みであるとは主張しない**。
4. 全件比較を有効にするのは、8サービスの国内向け見放題映画について公開利用許諾と独立した網羅性検証を確保した後だけにする。
5. データの欠落を0件として表示しない。検証できないサービスは「未集計」とする。

## 未解決の外部依存

- 8サービスを横断する**無料かつ再配布・公開表示が許された完全データ**の取得
- 日本・映画のみ・見放題プラン単位の網羅性監査
- 48時間以内の更新を持続できる合法な取得手段

これらが満たされない限り、8サービスの全件比較機能を完成扱いにしたり本番公開したりしない。
