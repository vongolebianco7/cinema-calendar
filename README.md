# Cinelva

映画を探す・公開/配信予定を追う・作品を深く掘るための映画サービスです。

## Production

**Brand URL:** https://cinelva.vercel.app/\n\n**Existing GitHub Pages origin (preserved for browser-local records):** https://vongolebianco7.github.io/cinema-calendar/

ユーザー向けのブランドURLは **https://cinelva.vercel.app/** です。GitHub Pages は旧オリジンとして維持します。両URLのブラウザ保存データは自動同期されません。2026-10-16にCinelvaへ改名しました。元のロゴ図形、既存URL、端末内データの保存キーを維持しています。公開状況と残件は[リリース記録](docs/rebranding/cinelva/release-log.md)を参照してください。`main` に反映されたフロントエンド変更は GitHub Pages を基準に確認します。

Vercel のフロントエンドは旧環境として扱い、今後の本番判定には使用しません。Vercel は、必要なバックエンド/API用途のみ継続利用します。

## Hosting policy

- Branded frontend: Vercel production (`cinelva.vercel.app`)\n- Legacy frontend origin: GitHub Pages (data retained; no forced redirect)
- Source of truth: GitHub `main` (Vercel production deployment; Pages remains accessible)
- Backend/API: 既存のAPI基盤を必要な範囲で継続
- フロントエンドのVercel build-rate-limitには依存しない
- 追加課金・クレジット消費を伴うデプロイ手段は使用しない

## Verification

フロントエンドの変更後は、Vercel の本番 `cinelva.vercel.app` が対象コミットで READY となっていることを確認します。保存データの互換性チェックには旧 GitHub Pages オリジンも使用します。

<!-- pages-refresh: 2026-09-26 legacy-redirect-fix -->
<!-- pages-refresh: 2026-09-26 theater-links-only -->
<!-- pages-refresh: 2026-09-26 detail-recovery -->
