# Real Fish visual gate

This PoC deliberately stops Ocean expansion until one fish clears the realism bar.

## Binding visual gate
- On iPhone Safari, first impression must be a real fish underwater, not an icon, low-poly model, vector illustration, or game sprite.
- Visible scales, eye structure, fin translucency and photographic underwater lighting must survive phone-size display.
- Motion must remain smooth; target median >= 50 FPS.
- No schools, rocks, plants, growth mechanics or additional species are allowed to become the next implementation priority until this gate passes.

## Current implementation
- One photographic-style raster scene only.
- Movement is compositor-only CSS transform so the realism experiment does not sacrifice the smooth D baseline.
- The source is an OpenAI-generated project asset, avoiding third-party scraping, paid APIs and runtime external requests.
