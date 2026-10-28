# Cinelva 公開前監査（2026-10-28）

判定: **NO-GO（監査・修正中）**。この文書は全項目の合格証明ではない。修正PRのCI・本番反映が未了であり、重大・高リスクがゼロと断定できる網羅的証拠はまだない。

## 確認した構成と基準

- GitHub main: `8672ef287262dd921ec83f15dd54b184c6597daf`。古いcheckpointよりlive mainを優先。
- frontend: 既存 `cinema-calendar` / `cinelva.vercel.app`、production `dpl_FtjYDBttgSGNj9BLHEemQmPzPtMR` READY、mainと同じSHA。
- backend: 既存 `backend` / `backend-one-gray-94.vercel.app`、production `dpl_7kMaZAZZkioHGFohqPoEeasHSjvW` READY、`9092bac0f8b78b88a9f5f83243095dffbc65333b`。このSHAから基準mainまでbackendソースの差分なし。新しいbackend deploymentはCANCELEDであり、READYと混同しない。
- frontend環境変数なし。backendはTMDB_API_KEYがproductionのみ、DATABASE_URLがproduction/previewに設定、双方sensitive。値の復号・出力はしていない。previewの実DBがproductionと分離されているかは値を取得せず確認できていない。
- static HTML/JS + Next.js公開映画カタログAPI + Prisma/PostgreSQL。DB schemaにUser/Review等の個人データモデルなし。APIにユーザー記録の保存・更新・削除ルートなし。唯一のPOSTは映画検索コンシェルジュ。
- 鑑賞記録、感想、評価、ブックマーク、ランキングは同一originのlocalStorage。アカウント、ログイン、セッションCookie、OAuthなし。従ってIDOR/BOLA、ログアウト失効、state/PKCEのアカウント用検査は現構成では非該当。将来認証を追加する際は再監査必須。同一ブラウザの共用者からの分離はない。
- 公開映画カタログの `Access-Control-Allow-Origin: *` はcredential-free。認証情報を許可するCORSヘッダーなし。CORSを認可の代替とみなさない。
- open PR: #514（別機能）、#521（古いcheckpoint）。自動mergeや古い状態の復元はしない。
- main branch protection無効、repository rulesets空。production guardは存在するが、管理者による直接pushをGitHub側で阻止する設定ではない。

## 確認した問題と修正

|問題|影響・限界|修正|
|---|---|---|
|static responseにnosniff/frame/CSP等がない|クリックジャッキング等の防御不足。XSSの存在自体を証明したものではない|DENY、nosniff、referrer/permissions、CSPのbase/object/frame/form境界を追加|
|agentがrequest.json()で全文を先に読み込む|message長チェック前の過大本文のメモリ消費|4KiBのストリーム読取上限、宣言長と実測byte双方の検証・キャンセル、string型検証|
|agentの上流例外が未処理、timeoutなし|エラー時の安定性・情報漏えい余地|8秒timeout、汎用502、POST検証エラー含めno-store、8秒本文期限、非同期キャンセル|
|TMDB例外オブジェクトをconsole.warnへ渡す|例外がURL等を含む場合の秘密情報漏えい余地。漏えいの発生は未確認|固定メッセージのみ出力|
|agentのpreflightがPOSTを許可しない|別originのJSON POSTがブラウザで拒否される|agent OPTIONSのみPOSTを許可し、読み取りAPIはGET/OPTIONSを維持|
|Actionsが移動可能なmajor tag参照|供給網の再現性不足|公式の7種Actionの現在のcommit SHAに固定（checkout/setup-node/setup-python/upload/download/pages）|
|privacy/termsの実通信・削除説明不足|検索語/API/画像通信、共用端末の扱いが不明|実構成に沿って通信、共用端末、削除・バックアップ、情報の範囲と権利を追記。法的承認は未了|

CSPは既存inline scriptを壊さない限定ポリシーであり、script-srcを制限する厳格CSPではない。stored/DOM XSSの全sinkレビューを終えたという意味ではない。

## 今回実行した検査

- 基準mainおよび修正後 `python scripts/quality_gate.py`: **PASSED**。record/backup/storage、映画ID、映画賞、配信、割引、ブランド等の既存決定的回帰検査を含む。
- `node --test tests/cinelva-release-security.test.cjs`: **12/12成功**。修正前6件失敗を確認後、宣言長/実byte/UTF-8/不正JSON/型/例外/正常結果/CORSを検証。実ユーザーデータ・外部TMDB通信なし。
- `npm ci --ignore-scripts --no-audit --no-fund` と `npm audit --json`: **既知脆弱性0（124 dependencies）**。これは未公表の脆弱性がない証明ではない。
- `npm run build`: **成功**（本番秘密情報なし）。`node tests/cinelva-backend-snapshot-smoke.cjs`: **成功**。DB接続不能の隔離fixtureでcalendar/tv/movies/theater-directory/releasesの5 APIがstatic snapshotを返し、healthが503を返すことを確認。
- Git全履歴（local cloneのall refs）7,629 blobを高確度patternで検査: **0 findings**。GitHub token/AWS access key/private key/TMDB assignment等の限定検査。すべての種類の秘密情報や外部失効状態を網羅しない。値は報告・ログに出さない。ローテーションは未実施。
- GitHub CIにtracked sourceのcredential pattern scanを追加。新security回帰は既存shared quality gateが自動検出する。
- SQLはPrismaとparameterized tagged query。API上流hostは定数TMDB。今回調べたAPIに任意URL fetchやファイルpath入力はない。XSS/SSRF/CSRF/SQLi全攻撃の網羅的なペネトレーションテストは未了。
- production homepage GET/HEAD **200**、HSTSあり、防御ヘッダーは修正前の状態。productionへ攻撃payload・負荷試験・記録書込を送っていない。
- local Playwright browser配布ファイル取得失敗（壊れた/空ZIP）でChromium/WebKit E2E未実行。既存CIの実ブラウザ結果を必須とする。物理iPhone Safari **未確認**。

## データ品質の実測（2026-10-28 17:52 JST付近）

`python scripts/audit_data_freshness.py --output ...`:

- 配信availability: 1,119観測中、7日以内740（66.1%）、7日超379。48時間以内0。全サービスの全作品母集団が不明なため、網羅率や欠落率は算出不能。観測数を全作品数と呼ばない。
- movies/postersのsnapshotは48.1時間経過し48時間鮮度gateを超過。今回生成日時を偽って更新していない。
- 映画館上映時刻は許諾待ちで自動取得無効、snapshot古い。既存の期限切れ非表示ガードを維持。
- テレビの完全番組表は取得不可、興収snapshotも古い。映画祭・野外上映等の公式feedは既存対象範囲のみ。
- 賞・作品IDの既存整合性テストは成功したが、全ポスター/監督作品の実作品照合や8サービス全作品照合は未了。無料・公式データ以外の取得を追加していない。

## 公開前の未解決事項

1. PR exact-headの4必須workflow、receipt-only commit、final-head CI、production guard、本番両ソース反映とread-only smokeが未了。
2. 全主要画面E2E（検索/人物/候補/CRUD/0評価/感想・spoiler/bookmark/Top10確認/集計/戻る・タブ/保存失敗）とlight/dark/mobile表示は既存CIの今回結果を要確認。過去の成功だけで今回合格扱いにしない。
3. 全DOM/HTML sinkとimport由来URLの悪用検査、全API入力・例外・response-size検証、全static解析は未完。P0重大・高リスクゼロをまだ証明できない。
4. in-memory rate limiterはinstance毎で、distributedな無料枠保護を保証しない。health/status等のDB読み取りAPIに同等の制限がなく、unbounded DB読み取りもある。request IP信頼境界、ホスティング側無料の防御・利用量監視/停止設定、DB最大接続等を確認してから公開する。
5. backend previewにproduction DATABASE_URLが流用されていないかを所有者が設定画面で確認する。値をチャットへ送らない。
6. 非公開のsecurity連絡手段が未整備（公開Issuesのみ）。GitHub private vulnerability reporting等の実受付確認が必要。秘密情報をpublic Issueへ投稿しない。
7. Vercel/DBのログ保持期間・閲覧権限、DB暗号化/backup/restore、alert配送先・復旧演習・無料枠の上限停止が未確認。ローカル記録はサーバーbackup対象外で、ユーザーのexportが復旧手段。
8. TMDB/JustWatch等の帰属は既存creditsを維持。画像・poster・第三者データの全許諾、依存ライセンス15表現、サービス名商標・法務文書は法的確認未了。利用量/商用化が変わる際のHobby条件も要確認。
9. 物理iPhoneでの操作・キーボード・アクセシビリティ、実データ量での性能、SNSの実OGP表示は未確認。
10. GitHub必須checksをruleset/branch protectionで強制する設定が未了。権限変更は勝手に実施していない。

## 参照・再開

- OWASP API Security Top10: https://owasp.github.io/www-project-api-security/
- ASVS: https://owasp.org/projects/asvs
- 既存 `AGENTS.md`, `docs/operations/work-resume.md`, `quality/production-proof.json` を優先。`scripts/verify-production-release.cjs` を迂回しない。
- 本番: https://cinelva.vercel.app 。現状の公開継続と「一般公開品質GO」の認定は別。未了項目が残る間は新たな一般公開GOを出さない。

独立レビュー後、実ReadableStreamでキャンセルが停止/拒否するケースと本文停止を再現・修正。UTF-8一byte分割、期限408、超過413、POST preflightの回帰を追加。初回PR CI backend materialized-config検査は新headerテストがrootの実行時configを読んだため失敗し、既存の厳密source-configuration readerを利用するようテストを修正。guardの迂回なし。

### 追加検証

- Cloud Chromeで本番トップ表示と映画館割引を読み取り専用で実操作。神奈川県選択、14日分カレンダー、11/4日付クリック、8系列の比較、最安同額の109/ユナイテッド・TOHO/イオン併記を確認。実機iPhoneや全県の検証ではない。記録は書き込んでいない。
- built backendの隔離テストを拡張し、15ルート×PUT/PATCH/DELETEの45操作が405となること、agent preflightと不正JSON400/過大本文413/型不正400、no-storeを確認。既存backend CIから継続実行する。
- 独立レビュー再確認: ストリームの指摘2件は解消、12/12回帰成功、新たなimportant所見なし。全体監査の未了項目は依然残る。
- 作業中mainのイベントfeed更新 `f6ab09985cfcfde199f42d7ca113650d091cc5f8` を保持する。

### 本番実操作で見つかった監督作品欄の短編混入

本番のインターステラー詳細で、Doodlebug、Quay、Cinema16短編集が監督作品欄に表示された。backendのmovie creditsはDirector役割だけを検証し上映時間を検証していなかったため、既存の長編インデックスが詳細画面に適用されていなかった。既存 `director-feature-index.json` の確認済みID、または40分以上の確認可能なruntimeだけを採用するよう修正。未確認の作品を長編と推測せず、`verified_feature_subset` として返す。2件のRED→GREEN回帰でNolan短編・短編集・重複・自作品・Producer混入、未登録監督の時間不明/短編を除外。未知の監督の時間未確認作品は表示されないという範囲制限がある。

## 2026-10-28 継続実行チェックポイント

- `main` の最新base `26429f4318856f685914c9d32bcfdd9e1c02563b` (2026-10-28)。PR #528 の初回レビュー対象head `a7c5a6d1` は9/10 GitHub workflows success、`Validate frontend` failed。故障ジョブはCSP browser testのWebKitで、CSPがHTTP localhost assetsをHTTPSへ昇格した後、TLS非対応fixtureに接続してJSが読めず `CinemapCalendarContext` 未定義となった。Chromiumの同検査は13画面成功。これは製品側Safariの欠陥と確認されたものではない。
- fixtureをHTTPから一時自己署名TLSに変更し、本番と同じCSPを弱めずWebKitが実際に受け取る設計に修正。証明書はテスト毎に生成し終了時に削除する。ブラウザを同一contextに分ける保存隔離テストは維持。
- PR #526の追加差分（ストリーム本文の8秒deadline/byte上限、45禁止HTTP method検査、監督作品のverified feature filter、Action pins、既存CI/Privacy更新）を最新mainへ統合。#528の上限時rate limiter、長さ4096のURL拒否、厳格CSP、履歴scanは保持。agent JSON Content-Type 415、error no-storeを保持。
- 統合後ローカル: `python3 scripts/quality_gate.py` 成功（404 Node tests + Python/data/compliance/brand/work-state/dependency gates）。P0 security/API/records/directorに絞った38 testすべて成功。PR security browser suiteはローカルのPlaywright browser binary未導入で起動不可。WebKit/Chromium検証は修正後のGitHub Actions結果待ち。
- 保存・バックアップ互換性の既存品質ゲートは成功。DB schema/localStorage key/バックアップ形式/ユーザーデータは変更していない。プロダクションDB/利用者記録の書込みはしていない。
- 次: 統合ブランチをPR #528 source branchへpushし、4必須workflowとその他のrequired checksを正確なsource SHAで確認→必要ならreceipt-only commit→final-head CI→guardを維持して判断。実機iPhone、公開前法務・素材権、非公開security intake、運用/無料枠、Preview DB分離は未完了。公開判定はNO-GOのまま。

### 2026-10-28 追加CI診断: built API smoke

- exact head `e6cc8e7934dbba82781a530959a6c0b1ff2171b5` のFull Python contract 192件が成功。CSP/WebKit検査は別のValidate frontend workflowで継続中。
- Reproducible backend buildはNext.js/TypeScript build、dependency audit、license inventory、secret-history scan、HTTP security testsまで成功。その後 `tests/cinelva-backend-snapshot-smoke.cjs` の実行で、同じスコープ内に `const preflight` が重複していてSyntaxErrorとなった。API handlerやPrisma build失敗ではない。
- PR #526の追加preflight検査と#528の先行検査が二重に残っていたため、検査を1回に統合し、POST,OPTIONS/CORS/no-credentialsを同時に確認するよう修正。ローカル `node --check tests/cinelva-backend-snapshot-smoke.cjs` は成功。built backendでの再実行は修正headのActions待ち。

### 2026-10-28 追加CI診断: safe integer と fixture CORS

- source head `9cc3bd0a251800674369b663c57afc47380e8bb8` でbackend build後の実API smokeが失敗。`/api/movie-detail?id=9007199254740992` が不正入力400でなく、隔離DBへの照会後503となった。ID検査を `Number.isSafeInteger` に変更し、精度を保証できないIDをDB/upstreamより前に400で拒否する。
- 同じheadのValidate frontendではChromiumがCSP付き13画面を通過。WebKitでdiscover.htmlのpage errorsにオフラインAPI fixtureのCORS拒否が出た。オフライン応答に本番APIと同等の非credentialed CORS headersを付与し、ブラウザ側の実CSPを維持する。
- `node --check tests/cinelva-security-headers-browser.cjs`、detail/security focused tests 14件、`git diff --check` は成功。改訂後のCIは未実行。実機iPhoneは引き続き未確認。判定NO-GO。
- 再開: 最新PR #528 headのValidate frontend、Reproducible backend build、他required checksを確認し、失敗時はjob logを読み、receipt-only/final-head CI/guard手順を維持する。

- 追試 `fc7540e`: backend build/API smokeとFull Python contract、brand、mobile smokeは成功。Validate frontendはWebKitのCORSアクセス拒否が残った。fixtureのOPTIONS preflightを204で返し、same-origin JSON snapshotもfixtureで完結させる修正を追加。実際のCSPヘッダーは維持し、次headで再検査。
