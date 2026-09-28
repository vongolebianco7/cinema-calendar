# Ocean Living Ecosystem Design

## Intent
Ocean is not a genre map with fish icons. It is a personal marine ecosystem whose habitat visibly becomes richer as the user watches and rates films. The first glance on iPhone must read as a living seascape, not a collection grid.

## Constraints
- Fully local/static at runtime. No paid or metered API, generative-AI endpoint, scraping, tracker, auth, or new external request.
- Reuse the repository's existing Cinemap Ocean art assets as authored/generated visual material; runtime composition is deterministic JavaScript/CSS.
- Preserve movie recording and navigation flows.
- iPhone/390px is the primary viewport; no page-level horizontal overflow.
- This branch produces a PR only. It does not merge or deploy automatically.

## Experience model
A watched film contributes one deterministic organism, but organisms are not laid out as equal-size icons. A stable seed derived from the film ID controls depth, scale, direction, speed and placement. Ratings change ecological prominence: favourites are larger/more foregrounded; 5.0 films can become rare hero creatures. Low or missing ratings remain part of the ecosystem without being visually erased.

The habitat is a first-class output. Viewing count, discovered families/species and ratings determine a maturity state. Maturity controls reef visibility, vegetation, schools, distant life, light shafts and atmosphere. Existing `growth-reef*.webp` art becomes an environmental layer rather than leaving growth represented only by CSS blobs.

## Architecture
`ocean-ecosystem.js` is a pure deterministic model. It accepts catalog + records and returns a scene description: maturity, habitat intensity and organisms with stable visual traits. It does not touch the DOM or network.

`ocean-immersive.js` consumes that scene description and renders layered habitat + organisms. `ocean-living.css` owns the new composition and iPhone presentation so the large legacy stylesheet does not need another invasive rewrite.

## Acceptance criteria
1. 0, 10, 30 and 100 watched-film states produce monotonically richer habitat values.
2. Organisms have visibly varied scale/depth; the renderer no longer assigns every watched film the same size band.
3. Rating 5.0 produces stronger prominence than an otherwise equivalent unrated/ordinary record.
4. Genre does not own a biome or determine placement coordinates.
5. The reef/environment changes with maturity, using the existing authored/generated reef asset.
6. Scene generation is deterministic for identical records/catalog.
7. Runtime performs no new external request and adds no dependency.
8. Existing Autonomous quality gate and mobile browser checks pass before review.

## Non-goals for this slice
- Runtime AI generation.
- New backend/storage/authentication.
- Replacing the existing recording model.
- Final art-library expansion. This slice fixes the ecosystem composition engine and makes existing art behave as a habitat; later art expansion can be reviewed against this baseline.
