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
