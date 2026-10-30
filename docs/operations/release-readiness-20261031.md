# Cinelva 公開準備状況（2026-10-31予定）

**判定: 本番公開は保留。** コード修正の統合・候補CIは完了。公開PR #573の最新head CI、実機、権利・運用等の残ゲートとユーザーの明示承認を別に確認する。

## 変更と検証

- 統合source: `ba255d21d77eb51505be230c428be3e52f493bdd`。全9ワークフロー成功。
- receipt-only最終候補: `0a2e7670d0b11ffb5b1a4a93d640a27b6ce3bfc2`。全10ワークフロー成功。
- 準備へのmerge: #574 `1da889458e3bb1222b43de9db77cc5c1cb2f3417`、#575 `5981f2f02ec7ebc616936e5061bfdbf3010788b4`、#580 `9e3a6d922c7307a289a08337c208042bac9349e3`、#579 `41ec239ae8658bc71a777debe2ed0ac0e3eee1c3`。今回の文書更新後の正確な公開PR headを最終承認に使う。
- 以前の準備統合: #568/#562/#540/#571/#570/#559/#561/#563/#572。0.0点を鑑賞記録として保存、明示的削除、目/ブックマーク、ライトテーマ、TMDB重複、ネイティブ選択色、映画館の非同期上書き、API境界、CSP、秘密情報検査、poster-free書き出し等。
- Fresh checkoutローカルquality: primary Node489/489、dedupe6/6、実行したPython/data/compliance/policy成功。実機Safariは未実施。
- ソースの全画面監査: Chromium248画面 + WebKit248画面（31ルート×4幅×2テーマ）、uncaught page errors0/local asset failures0。390pxライト/ダークの検索/並べ替えと0.0点画面を実画像で確認。
- artifact: run41069325503 /12985785084、ZIP SHA-256 `c4e6cdcda889302e46be74431d5531989e4d8c01600021271ce1aa72805f238d`。外部通信を制御したfixtureであり、実機・実配信データの証明ではない。
- 保存/編集/削除キャンセル・確定、0点/未評価/未鑑賞、復元、既存ID、独立ブックマークを既存の共通テストで検証。実ユーザーの保存領域は操作していない。
- 独立した読取レビュー: 変更20 source/test/configファイルにCritical/Importantなし。Minorのrunbook候補番号を今回訂正。
- 公開guardをlocalで実行し、4 required source workflowsとdigest `82b54a13590810b73d9ede27d620e11f2ff9ef429cf7a03272dd9a982ef98811` を検証成功。guardを無効化していない。
- #557の初回final WebKit転送待ち失敗は保持し、失敗jobだけの一度の再実行で成功。#557/#558/#576/#577の正確な最終headはすべて成功し、Git ancestryで準備mergeへの包含を確認したうえで重複提案を閉じた。

## 指摘・Issue・PR

125登録行は重複を含み、**全指摘総数・対応完了数・未完了数の一意な値は未確定**。23行に対象を限定したCI証拠を関連付けたが、本番/実機の確認待ちでopenを保持。23件を公開解決数として数えない。

PR565件のinline review threadsと会話/review timelineを確認、threads0、bot以外のコメント73、取得未解決0。これは監査時点#579までの一覧で、その後の文書PRは別。見えない過去会話は検索disabledのため未照合。

残Issue5: #239/#242/#243/#244/#529。文書更新前の残PR3: #573（公開承認）、#526（残Actions pin等の整理）、#514（利用許諾つき完全配信カタログ未確保）。この文書PRは統合まで一時的に追加される。

## URL・配信

- 既存正式URL: https://cinelva.vercel.app 。今回は公開操作なし。mainは`19ebe13cb99142a718ea8737be56c1284c5ce7e0`のまま。
- 確認用preview: https://56f60388.cinema-calendar.pages.dev 。source ba255d21のreview JS114044bytesとbyte一致、SHA-256 `1539fb88fe5071f65e69cd355aec91b92a8a5edd7122ed907d323f0cfa4e62ff`。
- 本番frontend metadataは80418f05。料金JSはHTTP200/26311bytesで同sourceとbyte一致。backend最新production metadataは395f48b2で、frontendと一致しない。これは配信metadataと1アセットの確認で、主要機能すべての本番smokeではない。承認後に両方を検証する。

## 残存リスク・費用・運用

- 実機iPhone Safariは未確認。CI WebKitを実機と表現しない。
- 素材・名称/商標・ログ/非公開security窓口の確認は未完了。素材台帳のlegal_clearanceはfalse。API条件の資料確認だけで個別素材の許諾を推定しない。
- 配信観測569/1312（43.4%）が7日以内、743stale（2026-10-30T14:15Z）。上映/映画館directory/興収もstale。未確認・取得失敗・配信なしを区別し、現在の上映/配信を保証しない。
- 過去8作品のポスター欠落報告は現データで再調査。6配信行すべてAPI200/画像あり、うち3行はタイトル完全一致、3行は言語/別名の追加照合が必要。屋外2作品もcanonical metadataあり。古い欠落報告も現在の許諾/上映/画像ロード成功もそのまま断定しない。
- hosted WebKit1000件review-open245msは200ms目標を45ms超過。その他の現行計測予算は通過。実機/FPSは未計測。
- 新規有料サービス・課金設定変更は0。実請求/利用可能枠の完全監査は未完了。Neon既知の転送超過・停止は継続し、11月1日リセットと無料枠実使用量確認前のcompute起動/DB同期はしない。Vercel Preview無料日次上限の失敗も記録し、別アカウント/課金で回避しない。
- 公開・監視・復旧の具体手順は `public-launch-runbook-20261031.md`。文書は自動監視の設定や公開後確認の実施を意味しない。

これらが未確認のまま公開GO、全指摘対応完了、主要機能の本番検証完了とは報告しない。本番実行は、最新候補の証拠と残条件を確認したユーザーの承認後だけ行う。
