# Cinemap

映画を探す・公開/配信予定を追う・作品を深く掘るための映画サービスです。

## Production

**Frontend (production):** https://vongolebianco7.github.io/cinema-calendar/

Cinemap のユーザー向けフロントエンドは **GitHub Pages を正式な本番環境**とします。`main` に反映されたフロントエンド変更は GitHub Pages を基準に確認します。

Vercel のフロントエンドは旧環境として扱い、今後の本番判定には使用しません。Vercel は、必要なバックエンド/API用途のみ継続利用します。

## Hosting policy

- Frontend: GitHub Pages
- Source of truth: `main`
- Backend/API: 既存のAPI基盤を必要な範囲で継続
- フロントエンドのVercel build-rate-limitには依存しない
- 追加課金・クレジット消費を伴うデプロイ手段は使用しない

## Verification

フロントエンドの変更後は、GitHub Pages 上の実画面を確認して完了判定します。

<!-- pages-refresh: 2026-09-26 legacy-redirect-fix -->
<!-- pages-refresh: 2026-09-26 theater-links-only -->
<!-- pages-refresh: 2026-09-26 detail-recovery -->
