# Cinelva 一般公開前監査 — 2026-10-28

判定: **NO-GO（一般公開の承認はしない）**。この記録は全ASVS項目への適合証明や第三者侵入テスト報告ではない。

## 対象・制約

初回取得main/frontend production: `8672ef287262dd921ec83f15dd54b184c6597daf`。作業中にmainのイベント更新 `f6ab09985cfcfde199f42d7ca113650d091cc5f8` を確認。既存変更を保持して追随する。backend production: `9092bac0f8b78b88a9f5f83243095dffbc65333b`、READY。frontendとbackendが別コミットであることを隠さない。既存Vercel team/project/domainを維持する。

本番では通常のページGETとデプロイ情報の読み取りのみ。攻撃・負荷試験、ユーザー記録の書込、DB同期、秘密情報の復号・ローテーションは実施していない。

## 構成と認証・データ境界

- 静的フロントエンドと公開映画カタログAPI。Prisma schemaに利用者・セッション・鑑賞記録のテーブルはない。鑑賞記録、評価、感想、ブックマークは既存localStorage形式を維持。
- ログイン、OAuth、セッションCookie、アカウント単位のCRUD APIは現在存在しないため、ログイン/ログアウト、PKCE/state、他アカウントIDOR、トークン失効は**対象外**。認証テスト成功と読み替えない。
- 同じブラウザプロファイルの利用者は記録を共有する。アカウントごとの分離は提供しない。別ブラウザcontextの分離検査と、同一利用者の永続化は異なるゲート。
- サーバーAPIは公開カタログの読み取り。agent POSTは条件検索であり個人記録の保存ではない。CORS `*` はcredentialなしの公開データ用途。認証情報付与はない。PUTは隔離した実ビルドで405を確認。
- 生のSQL文字列連結は使わずPrisma bindingを使用する検索を確認。TMDB upstreamは固定ホストのURLにパラメータを設定。利用者指定URLへの汎用proxyはない。全DOM sinkの形式的証明や全API変種の侵入検証は未実施。

## 今回修正した確認可能な問題

| 問題 | 対応・回帰検査 | 限界 |
|---|---|---|
| agentが無制限にJSON bodyを読み取る | Content-Type/宣言長と実ストリーム4096byte上限、400/413/415。長さ詐称もテスト | 低速接続等はホスト側制御。分散DoS耐性の保証ではない |
| レート制限mapが活動中の多数の識別子で増加 | 5000上限、期限切れ整理、新規識別子は満杯時拒否、既存カウンタ保持 | インスタンス内のbest effort。IPはVercelの転送ヘッダー境界を信頼。分散制限/課金抑止にはならない |
| health/status/calendar/tv/releases/theater-directoryの制限漏れ | 共通request guard、4096文字URL制限、60/分 | 公開カタログ自体の収集は禁止できない |
| NaN/小数等の検索limit/page、過長検索 | DB/TMDB前に400、既存正常レスポンス保持 | その他のフィルターの意味的組合せは既存検査の範囲 |
| upstream待機・エラー漏洩/キャッシュ | 主要TMDB fetchに8秒timeout、エラー詳細をログに渡さず、4xx/5xxはno-store | DBライブラリ/ホスト側ログの保持設定は未確認 |
| agent preflightがGETのみ | POST,OPTIONSを返す | credentialを許可しない |
| 静的フロントエンドの保護ヘッダー欠落 | CSP、nosniff、DENY、Referrer/Permissions Policy。base/plugin/frame/form制限、script/connect先限定 | 既存inline script/handler互換のためunsafe-inlineが残る。XSSの完全対策とは呼ばない。https画像は許可 |
| 通信/共有端末の説明不足 | privacyに検索語の送信、外部画像、ホストログ、共有端末と削除の説明を追加 | 実際の事業者ログ期間・削除対応と法的確認は運営者確認待ち |

OWASP Top 10/API Top 10/ASVSの認証・アクセス制御、入力/出力、データ保護、リソース消費、設定、依存関係、監視の観点で確認。全チェック項目の認証取得・網羅的合格ではない。

## 実行済み証拠

- 変更前・変更後とも `python scripts/quality_gate.py` 成功。変更後は途中のVM fixture不備とprefixページmetadataの差分を修正し、最終runで成功。既存ゲートのassertionは削除していない。
- 新規HTTP/static security 7テスト成功。既存API日付/監督テストと合わせ27テスト成功。本文・cache・limiter・headersは修正前失敗を確認。
- `NEXT_TELEMETRY_DISABLED=1 DATABASE_URL=<unused local fixture> npm run build` 成功。実DB・TMDB資格情報なし。
- 実コンパイル済みbackendで5つのsnapshot GET、DB停止時health503、不正limit/page/ID、本文413/400/415、POST preflight、PUT405成功。実ユーザーデータは使わない。
- `npm ci --ignore-scripts --no-audit --no-fund` と最新 `npm audit --json`: 124依存エントリ、既知脆弱性0（critical/high/moderate/low全0）。将来の安全を保証しない。
- offline secret-pattern scan: 初回tracked 1769ファイル、到達可能history 13033オブジェクトに該当なし。3つの候補はenv.exampleの正確なUSER/PASSWORD/HOSTプレースホルダーで、固定例外により分類。GitHub形式、AWS access ID、秘密鍵、接続URLが対象。任意のAPIキー、未到達object、削除済みremote ref、全entropy検査は未確認。値は出力しない。
- 変更した2ワークフローのcheckout/setup-node/upload-artifactを既存v4の取得済みSHAへ固定。contents:readを維持、checkout credentials不保持。backend workflowに全履歴scanとHTTP testsを追加。未変更ワークフローのタグ参照は別途残る。
- fresh reviewer: 今回のpatchにCritical/Important指摘なし。minor: 同一context別タブの共有/再読込と、CSP下の成功API/deferred interactionは追加検証余地。独立reviewは一般公開承認ではない。
- ローカルPlaywright browserのダウンロードは破損zipで失敗。ローカルChromium/WebKitや物理iPhoneを検証済みとしない。CSPを実際に付与する13ページmobile smokeと別context storage検査をCIへ追加したが、CI結果確定前はpending。
- 必須source CI、receipt-only commit、final-head CI、production guard、新修正の本番反映は**未完了**。この版で成功を主張しない。

## データ・UI・機能の監査範囲

共有ゲートは鑑賞記録CRUD/backup/storage/重複排除、映画ID/日付の投影、検索、監督、配信情報、ブランド、3列、テーマ、作品賞等の既存deterministic checksを含む。全主要journeyの今回のE2E成功とは異なる。実機iPhone、利用者テスト、全イベント/作品の事実照合は未実施。

現snapshot: カレンダー1205イベント、配信カレンダー278行、availability1119作品、監督911件、屋外30件。イベント行数とユニーク作品数を混同しない。availabilityの観測は2026-10-24生成で作品別checked_atを使用。現行配信作品の完全カタログではない。Netflix等8対象の全作品母数と欠落率は不明で、0%/全網羅とは主張しない。PR514の許諾付き日本向け全件カタログは未確保でdraftを維持。

映画館の県/日付/同額最安/価格/ベネポは既存単体検査とCI browser journeyの対象。今回実機操作確認は未完了。ポスター・賞・監督の全事実正確性は既存スキーマ/ID checksを超えて保証しない。

## 公開前の未解決ゲート

1. **素材の利用権**: `rights-review-20261021.md` の画像54件のファイル別許諾証跡と15ライセンス式の確認が未解決。TMDB等の帰属表示は許諾証明の代わりにならない。所有者による取得元/使用範囲の確認、または確認可能な素材への置換が必要。
2. **非公開のsecurity intake**: 現privacyの問い合わせは公開GitHub Issues。秘密を公開投稿しない注意あり。非公開脆弱性報告機能の有効化・受信担当・応答手順は未確認。未確認のメールアドレス/フォームを捏造しない。
3. **実機・E2E・publication**: 最新patchの必須CI、CSP下の主要操作とproduction guard、main/production一致、読取専用smoke。物理iPhoneは運営者の実機確認が必要。
4. **保存保護・復旧**: 個人記録の自動サーバーバックアップはない。利用者export/importが復旧手段。ホスト/DBの保存時暗号化、PITR、バックアップ保持期間、復旧訓練、アクセス権最小化は管理設定の実査が未完了。カタログschemaが個人記録を保持しないことと別問題。
5. **監視/無料枠**: Hobby継続、使用量上限/通知、無料枠超過時対応、障害連絡先、ログPIIと保持期間の運営者確認。実際の契約/制限設定の証拠なしに「超過防止済み」としない。
6. **残存XSSリスク**: localStorageは同一originのJSから読める。CSPのinline許可と多数の既存HTML render sinkが残るため、パッチ成功だけで重大脆弱性ゼロと断定しない。未許可の第三者script追加を避ける。

## 次の実行

branch `audit/public-release-20261028` のPRで全source CIを確認→成功headのreceiptのみ更新→final-head CI→許可されたmerge→通常のVercel自動反映。API/git認証制約やCI失敗は具体的に記録し、回避しない。NO-GOは素材・窓口・運用・実機等のゲートが解消されるまで保持。

本番: https://cinelva.vercel.app
参考: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html / https://vercel.com/docs/project-configuration/vercel-json
