# Ocean Phase 3 Ecosystem Design

## Goal
Transform Cinemap Ocean from a polygon-fish 3D demo into a continuous, living marine ecosystem that visibly reflects the user's movie history while preserving Phase 2's deterministic growth loop.

## Product success criterion
A screenshot of a mature (100-record) Ocean must read, without explanatory copy, as a grown aquarium/ocean ecosystem rather than a set of genre-shaped polygon objects. The scene must show foreground reef/seabed, mid-water life, distant depth, vegetation, schooling, multiple creature silhouettes and scales, and underwater light/particles as one coherent environment.

## Constraints
- iPhone is the primary target; acceptance viewport is 390x844.
- Completely free: no paid API, metered API, paid AI API, hosted generation, or new paid dependency.
- No scraping and no unnecessary external/runtime network access.
- Deterministic: the same local movie records produce the same ecosystem.
- Preserve Phase 2: rating a film must still create visible life/growth and survive reload.
- Renderer failure must degrade locally and leave the dashboard usable.
- Follow AGENTS.md, COMPLIANCE.md, and docs/free-only-policy.md.

## Architecture
Retain the existing Three.js renderer and its current responsibility boundaries (`environment`, `creatures`, `schooling`, `quality`, `asset-world`). Phase 3 is a renderer redesign, not a second rendering system. The ecosystem model remains data-driven and deterministic; renderer modules consume a compact ecosystem state and never fetch runtime assets or services.

### 1. Continuous underwater space
Build one continuous composition with three perceptual depths: a readable foreground reef/seabed, mid-water schools and hero creatures, and a hazier distant layer. Remove regular/grid-like placement. Existing seabed, rocks, kelp, water dome, caustics, shafts and particles remain foundations but are redistributed into irregular habitat patches and depth layers.

### 2. Creature diversity
Do not represent diversity as recolors of one fish mesh. Creature profiles must differ in silhouette, body proportions, scale, preferred depth, speed, turn radius, grouping behavior and rarity. Small fish favor schools, medium fish form loose groups, and large/rare life is sparse and individually readable. Distant life may use lower-cost geometry, but must preserve silhouette diversity.

### 3. Ecology density
Record growth changes the environment, not only fish count. Deterministic ecology inputs drive reef density, coral, seaweed/kelp, ambient schools, species richness and rare/large life. A mature 100-record scene must feel populated into the background while keeping clear negative space and avoiding a particle-cloud look.

### 4. Motion
Motion must communicate animal behavior rather than synchronized object animation. Schools share a loose heading but have individual phase/offset; medium creatures wander independently; large creatures move slowly through wider paths. Vegetation and particles provide subtle ambient motion. Avoid identical speeds, identical turns and repeated spawn timing.

### 5. Underwater rendering
Use local Three.js materials/shaders only. Combine depth fog, vertical water color gradient, restrained caustics, soft light shafts, suspended particles and seabed shading. Effects are subordinate to readability: no neon palette, excessive bloom, or opaque fog that hides the ecosystem.

### 6. iPhone performance
Quality tiers cap geometry, particles, school size and expensive effects. Prefer instancing/shared geometry/materials for repeated distant life and habitat props. Rendering must remain responsive at 390x844 and must not introduce page-level horizontal overflow.

## Growth states and acceptance fixtures
Deterministic test fixtures represent 0, 10, 30 and 100 watched films.
- 0: quiet water/seabed; no fake mature ecosystem.
- 10: first readable life and sparse habitat.
- 30: multiple silhouettes, vegetation/reef and at least one visible school.
- 100: foreground habitat + mid-water schools + multiple creature scales + distant life/depth all present together.

The 100-record state is the visual Phase 3 acceptance target; lower states must be visibly less mature rather than scaled copies of it.

## Error handling
Environment and creature construction must fail independently where practical. The existing renderer/dashboard fallback remains mandatory. No Phase 3 visual feature may make local records inaccessible when WebGL/renderer initialization fails.

## Testing
Extend deterministic renderer tests with inspectable scene/ecology metadata rather than pixel-perfect screenshots alone. Assert maturity differentiation (0/10/30/100), habitat/school/scale diversity at 100, deterministic output for identical records, iPhone no-overflow, no fatal page errors, Phase 2 persistence, and renderer-failure fallback. Existing CI remains the merge gate.

## Out of scope
Phase 4 long-term unlock design, Phase 5 free exploration/navigation redesign, server persistence/authentication, generated 3D assets, runtime AI, and externally hosted asset catalogs.