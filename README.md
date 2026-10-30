# Cinelva

映画を探す・公開/配信予定を追う・作品を深く掘るための映画サービスです。

## Production

**Brand URL:** https://cinelva.vercel.app/
**Legacy frontend origin (browser-local records are separate):** https://vongolebianco7.github.io/cinema-calendar/

`cinelva.vercel.app` はユーザー向けブランドURLです。GitHub Pagesは保存済みの端末内データとの互換性を保つため維持しており、両オリジンのブラウザ保存データは自動同期されません。既存URLと保存キーは維持しています。公開状況は[リリース記録](docs/rebranding/cinelva/release-log.md)を参照してください。

mainのフロントエンド変更を検証するときは、実際に配信更新されたオリジンで対象ファイルを確認してください。Vercelフロントエンドの最新デプロイはfree build-rate limitで停止することがあります。その場合も課金やlimit回避はせず、GitHub Pagesの公開結果を確認します。Vercelは既存API用途に継続利用します。

## Hosting policy

- Branded frontend: Vercel (`cinelva.vercel.app`)
- Preserved legacy frontend: GitHub Pages (origin-scoped browser data)
- Source of truth: GitHub `main`; each host publishes independently
- Backend/API: existing approved infrastructure only
- Do not enable paid deployment, overage, or another billable service to bypass a hosting limit.

## Verification

フロントエンド変更の公開確認では、GitHub PagesとVercelの状態・コミットSHAを別々に確認します。READYだけでなく、canonical HTML、JavaScript、CSS、データの応答内容をmainと照合します。Vercelが制限中ならその事実を記録し、Pagesで公開されている場合に限りその実配信を報告します。保存データ互換性の確認では旧GitHub Pagesオリジンも維持します。

<!-- pages-refresh: 2026-09-26 legacy-redirect-fix -->
<!-- pages-refresh: 2026-09-26 theater-links-only -->
<!-- pages-refresh: 2026-09-26 detail-recovery -->
