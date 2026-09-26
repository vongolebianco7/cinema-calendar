# Screening Format Recommendation v2 — Design

## Goal
Cinemap should recommend a screening format only when the film actually benefits from that format. The recommendation must explain *why* in user-facing language, so the result is auditable rather than a black-box star rating.

## Core principle
Premium formats are not inherently better. A format earns a high score only when there is verifiable evidence that the film was created, framed, mastered, mixed, or officially presented to exploit that format.

When evidence is weak or unavailable, Cinemap should default conservatively toward standard presentation rather than upsell a premium format.

## User-facing output
For each available format, show:
- 1–5 star recommendation score
- short verdict label, e.g. `IMAX最優先`, `Dolby Cinema向き`, `通常上映で十分`
- 1–3 concise reasons derived from verified attributes
- evidence confidence: `確認済み` / `一部確認` / `情報不足`
- optional evidence/source link(s) when available

Example:

> IMAX ★★★★★ — IMAX最優先  
> 理由: IMAX認定カメラで撮影。IMAX上映では一部シーンが1.43:1まで拡張され、通常上映より広い画が見える。映像設計そのものがIMAX前提のため、追加料金を払う価値が高い。

Example fallback:

> IMAX ★☆☆☆☆ — 通常上映で十分  
> 理由: IMAX専用画角やIMAX撮影の確認が取れない。大画面・音響の一般的な恩恵はあるが、IMAX固有の映像情報が増える根拠がないため、通常上映を推奨。

## Display order
The display order must be stable and must not reshuffle per film. Recommendation rank is shown with badges/stars inside this fixed order.

Canonical order:
1. 通常上映
2. IMAX
3. Dolby Cinema
4. 4DX / MX4D
5. ScreenX

3D is treated as a film-specific presentation attribute rather than a permanent tier in this primary hierarchy. Show it when the film has an actual 3D presentation and score it independently.

## Dolby hierarchy
Dolby Atmos and Dolby Cinema must not be rendered as peer formats.

- `Dolby Cinema` is the full premium cinema presentation combining Dolby Vision image presentation and Dolby Atmos immersive sound.
- `Dolby Atmos` is an audio format/feature that can exist in a non-Dolby-Cinema auditorium.
- Therefore Dolby Atmos should appear as a supporting attribute beneath the relevant recommendation rather than as a standalone top-level card in the primary format order.

Recommended UI behavior:
- Dolby Cinema card: show whether `Dolby Vision` and `Dolby Atmos` are verified.
- Non-Dolby-Cinema Atmos venue/release: surface `Dolby Atmos対応` as a sub-attribute or note.
- Never imply that Atmos alone is equivalent to Dolby Cinema.

## Evidence model
Per film, store only evidence-backed attributes:
- `imax_camera`: none / imax_film / imax_certified_digital / unknown
- `imax_expanded_ratio`: none / 1.90 / 1.43 / mixed / unknown
- `filmed_for_imax`: true / false / unknown
- `imax_dmr_only`: true / false / unknown
- `dolby_vision_master`: true / false / unknown
- `dolby_atmos_mix`: true / false / unknown
- `native_3d_or_stereo_authored`: true / false / unknown
- `official_4dx`: true / false / unknown
- `official_screenx`: true / false / unknown
- `official_mx4d`: true / false / unknown
- `cinematography_notes`: short verified note
- `director_or_dp_intent`: short verified note
- `sources`: structured source URLs + labels

Do not infer premium-format support from genre, budget, popularity, franchise, or studio alone.

## Scoring rules

### IMAX
5 stars:
- IMAX film or IMAX-certified camera is confirmed; AND
- expanded IMAX aspect ratio is confirmed (1.90 or 1.43), especially when material expands beyond the standard theatrical ratio.

4 stars:
- officially Filmed for IMAX / IMAX-optimized; or
- significant IMAX-shot material is confirmed, but expansion is partial or limited.

3 stars:
- no meaningful expanded image confirmed, but there is verified IMAX-specific mastering/presentation value beyond a generic large screen.

2 stars:
- IMAX DMR / premium large-format presentation only, with no verified IMAX-exclusive framing.

1 star:
- no verified IMAX-specific creative benefit. Recommend standard presentation unless another premium format is better supported.

Important: do not claim IMAX is literally worthless when there is no expanded ratio; larger screen/projection/audio can still help. The product decision, however, is to treat this as poor value relative to the surcharge unless the user explicitly prefers scale.

### Dolby Cinema
5 stars:
- Dolby Vision master and Dolby Atmos mix both confirmed; AND
- the film has strong evidence that HDR contrast / shadow detail / color grading / immersive mix materially benefits the presentation.

4 stars:
- both Dolby Vision and Atmos confirmed, but without strong film-specific creative notes.

3 stars:
- one of Dolby Vision or Atmos is confirmed and relevant; or premium projection/audio clearly benefits the work.

2 stars:
- Dolby Cinema availability is known but film-specific mastering evidence is weak.

1 star:
- no verified Dolby-specific mastering benefit.

### 3D
5 stars:
- stereoscopic presentation was natively authored/captured and is a major part of the intended visual design.

3–4 stars:
- high-quality official conversion with strong film-specific use of depth.

1–2 stars:
- weak/late conversion, limited evidence, or no clear creative benefit.

### 4DX / MX4D
Score from official format support plus suitability of the film's motion/action design, but never from genre alone. High scores require official presentation support and a plausible film-specific benefit.

### SCREENX
High scores require official ScreenX version and evidence that side-wall material was authored/extended for the release. Do not recommend based only on spectacle.

### Standard presentation
Standard is not a fallback with zero score. It should become the recommended option when no premium format has a verified film-specific advantage.

Examples:
- no IMAX expansion, no Dolby-specific master evidence -> `通常上映 ★★★★★`
- IMAX 1.43 footage confirmed -> standard score drops, IMAX becomes primary
- no IMAX benefit but Dolby Vision + Atmos confirmed -> Dolby Cinema becomes primary

## Recommendation selection
1. Score every supported format independently.
2. Apply evidence confidence penalty for unknowns.
3. Select the highest scoring format as `おすすめ`.
4. If all premium formats are <=2 stars, select `通常上映` as the primary recommendation.
5. If two formats are close, explain the tradeoff rather than forcing a false single winner.
   - Example: `IMAX = 画角優先`, `Dolby Cinema = HDR/音響優先`.
6. Recommendation rank must not change the canonical display order.

## Reason generation
Reasons must be generated from the exact evidence that affected the score, not generic copy.

Each reason should answer one of:
- What extra image do I get?
- What audio / HDR benefit do I get?
- Was the film actually authored for this format?
- Why is the premium surcharge justified or not justified?

Avoid vague reasons such as `迫力がある作品だからIMAXがおすすめ`.

## Loading-state resilience
The film detail / recommendation UI must never remain indefinitely at `作品を読み込み中…`.

Requirements:
- explicit loading timeout
- visible failure state
- retry action
- preserve already-loaded basic film metadata when only recommendation data fails
- recommendation section can degrade independently without blocking the whole page

## Compliance / sourcing
- Use official studio, IMAX, Dolby, distributor, theater-format, or other clearly licensed/allowed sources where possible.
- Do not scrape prohibited sources.
- Store source references with the evidence so the recommendation can be traced.
- If evidence cannot be verified, mark it unknown and reduce confidence rather than guessing.

## Testing
Add regression checks for:
- fixed display order is `通常上映 → IMAX → Dolby Cinema → 4DX/MX4D → ScreenX`
- Dolby Atmos is not a peer top-level format card
- IMAX expanded-ratio film -> IMAX ranks first with reason mentioning expanded image
- IMAX DMR-only film -> standard can outrank IMAX
- Dolby Vision + Atmos film without IMAX-specific benefit -> Dolby Cinema ranks first
- unknown format metadata -> no premium format gets an unjustified high score
- loading failure -> visible error/retry replaces endless loading
- reason text is present for every displayed recommendation
