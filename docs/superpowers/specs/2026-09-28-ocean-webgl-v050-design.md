# Ocean WebGL v0.5.0 Design

## Purpose

Replace the current image-atlas/CSS Ocean presentation with a coherent real-time underwater scene. Ocean must feel like a living personal marine ecosystem that grows as the user watches and rates films, not like a movie map whose genres have been replaced by fish images.

The primary target is iPhone Safari. The experience must remain completely free to operate and must not add paid APIs, metered services, paid AI/model endpoints, scraping, trackers, unnecessary external requests, or new recurring infrastructure cost.

## Current problem

Ocean v0.4 is composed mainly from raster creature atlases/background art plus DOM/CSS animation. That architecture makes depth, lighting, movement, scale and camera motion visually inconsistent. Repeated tuning of CSS positions and overlays cannot remove the pasted-on appearance.

v0.5 therefore replaces the primary renderer rather than continuing to polish the 2D composition.

## Chosen architecture

Use native browser WebGL2 with repository-owned JavaScript and shaders. Do not add a runtime CDN, third-party rendering service, external asset request, or paid dependency.

Keep the existing deterministic ecosystem model as the source of user progression wherever practical: watched/rated film records determine maturity, organism diversity, schools, habitat richness and rare discoveries. Introduce a renderer adapter that converts that deterministic scene description into 3D render entities. Rendering and ecosystem/progression logic remain separate.

The initial v0.5 renderer is deliberately procedural/stylized rather than photorealistic asset-heavy CGI. Quality comes from a coherent camera, lighting, fog, animation, scale and habitat, not from importing unverified third-party models. This also keeps copyright/licensing and payload risk low.

## Scene composition

The WebGL scene is one continuous underwater volume with:

- a seabed plane/terrain with gentle depth variation;
- reef/rock/coral forms placed as environmental clusters rather than card-like decorations;
- procedural vegetation with slow current-driven sway;
- small, medium and rare large marine organisms occupying distinct depth and scale bands;
- schooling organisms moving as groups rather than synchronized horizontal sprites;
- suspended particulate matter distributed through 3D space;
- directional surface light and underwater light shafts;
- animated caustic-like illumination on the seabed/reef;
- distance fog and depth-dependent color attenuation;
- foreground, midground and background silhouettes that make camera translation visibly three-dimensional.

There must be no circular/elliptical glow, border or halo around individual fish. Bubble-like particles must not be attached to fish. Ambient particles, if used, must read as sparse water particulate rather than soap bubbles.

## Organism rendering and motion

Organisms are rendered as lightweight procedural meshes assembled from simple geometry. At minimum, fish-like organisms have a body, tail and fins with independent animation. Species variation comes from deterministic combinations of body proportions, fin/tail geometry, size, palette, swim speed, depth preference and group behavior.

Movement is continuous in world space. Fish turn before changing direction; the body orientation follows velocity. Tail/fin animation responds to swim speed. Schools have a shared travel tendency plus per-member offsets so they do not look like duplicated sprites moving in lockstep.

Rare/high-value discoveries may use larger silhouettes and distinct movement, but the scene must cap large animals so they remain special and do not crowd the camera.

## Ecosystem growth

Watching/rating more films enriches the habitat rather than merely increasing identical fish count.

Growth dimensions include:

- species diversity;
- school richness and population;
- reef/coral coverage;
- vegetation density;
- distant life;
- rare large organisms;
- environmental light/detail richness.

The existing rating semantics remain unchanged. A 5.0 rating stays a rare/high-value signal rather than being treated as just another positive rating. The same local user data continues to drive Ocean; v0.5 adds no account, backend or external data requirement.

## Camera and iPhone interaction

Ocean opens in a wide establishing view. The first frame should communicate the whole habitat before focusing on any individual animal.

On iPhone:

- one-finger drag/orbit pans the viewpoint through a materially larger world, not a small percentage translation of one screen;
- pinch changes camera distance/field of view within safe bounds;
- tapping an organism selects it without accidental selection after a drag;
- selection eases the camera toward that organism while retaining environmental context;
- a clear reset/overview action returns to the wide establishing view.

The camera has soft world bounds to prevent leaving the habitat, but the usable travel range must be large enough that several full swipes reveal meaningfully different parts of the ecosystem. Camera movement uses damping/easing and must not fight native page navigation outside the Ocean viewport.

## Visual direction

Target a cinematic, premium, slightly stylized underwater documentary/aquarium mood consistent with Cinemap's dark editorial brand. Avoid game HUD clutter, neon outlines, cartoon bubbles, repeated tile patterns, obvious sprite sheets and UI chrome over the habitat.

The scene should read in this order on first load:

1. underwater volume and depth;
2. habitat/reef silhouette;
3. schools and movement;
4. individual discoverable organisms;
5. UI.

The first view must not be dominated by one fish.

## Performance strategy

Primary acceptance viewport is 390x844 on iPhone-class Safari.

Use one requestAnimationFrame loop and minimize allocations inside the frame loop. Reuse geometry/buffers and batch/instance repeated environmental geometry where practical. Clamp device pixel ratio for the 3D canvas. Use deterministic quality tiers based on viewport/device capability and measured frame pressure; quality reduction may lower particle count, school member count, vegetation detail, shadow/lighting samples or render resolution, but must not change user progression data.

Target smooth interaction near 60 fps on a modern iPhone; sustained performance materially below 30 fps during ordinary navigation is a release blocker. CI cannot prove physical-device fps, so deterministic browser checks verify renderer health and scene limits while human/visual review checks perceived smoothness before release.

## Compatibility and failure behavior

If WebGL2 is unavailable or context creation fails, Ocean must fail gracefully instead of presenting a broken black screen. Keep a lightweight static/fallback Ocean view or an explicit compatible fallback state using only repository-local assets. A WebGL context loss must not corrupt film records or other Cinemap state.

Existing navigation and movie-recording journeys remain reachable. Ocean must not introduce page-level horizontal overflow at 390px.

## Versioning and cache visibility

Display an unobtrusive `OCEAN v0.5.x` marker in the Ocean UI. Renderer JS/CSS/module asset URLs use an explicit version/cache key so the visible marker and loaded implementation cannot silently disagree after deployment.

## File boundaries

Prefer focused modules under `preview/ocean/js/` rather than another monolithic renderer file:

- `ocean-webgl.js`: renderer lifecycle, WebGL2 setup, frame loop and resize/context handling;
- `ocean-scene.js`: deterministic scene-to-render-entity adapter and world placement;
- `ocean-geometry.js`: procedural fish/habitat geometry and reusable buffers;
- `ocean-shaders.js`: shader source and program creation;
- `ocean-camera.js`: iPhone pointer/pinch camera controller and bounds;
- existing `ocean-ecosystem.js`: progression/domain logic, changed only where a clean render adapter requires it;
- existing Ocean entry page/loader: select v0.5 renderer and fallback;
- tests: deterministic scene, camera bounds/gesture semantics, no forbidden per-fish halo/bubble treatment, WebGL/fallback boot, 390px overflow and core navigation.

Exact file names may be adjusted to existing repository conventions during planning, but responsibilities must remain separated.

## Validation and quality gate

Each stable milestone runs `python scripts/quality_gate.py`. UI milestones also run the repository's existing mobile browser/Playwright checks.

Before a v0.5 PR is considered ready for human approval, automated checks must cover:

- Ocean boots without console/page errors in a WebGL2-capable browser;
- fallback behavior is reachable when WebGL2 initialization is forced to fail;
- 390x844 has no page-level horizontal overflow;
- initial camera is the overview camera;
- camera travel covers multiple materially distinct world regions;
- pinch/zoom bounds are enforced;
- drag does not trigger organism selection;
- deterministic input records produce deterministic ecosystem placement/species parameters;
- no per-organism circular/elliptical halo/bubble DOM/CSS treatment is present;
- visible version is `OCEAN v0.5.x` and asset cache keys match;
- existing navigation and movie-recording smoke journeys still pass.

Visual review must use at least overview and explored/closer iPhone-sized screenshots. A change is not visually accepted merely because CI passes. Review explicitly rejects: pasted sprite appearance, soap-bubble halos, tiny effective camera range, first-load close-up, repeated synchronized fish motion, flat/no-depth composition, or UI dominating the habitat.

## Rollout

Develop v0.5 on a branch and keep v0.4 intact until the WebGL renderer passes deterministic quality gates and mobile visual review. The implementation PR is the review boundary. Do not automatically merge or deploy; repository policy requires human approval for the PR.

## Non-goals for v0.5.0

- photorealistic AAA/game-engine rendering;
- external 3D model marketplaces or unverified copyrighted assets;
- server-side rendering, accounts or cloud saves;
- multiplayer/social aquarium features;
- paid/CDN rendering services;
- runtime generative AI;
- scraping or new movie-data sources;
- replacing unrelated Cinemap pages or recording flows.

## Acceptance summary

v0.5.0 is successful when an iPhone user can open Ocean and immediately perceive a coherent, spacious underwater ecosystem; explore meaningfully different regions with several swipes; see organisms swim and turn as inhabitants of that space rather than pasted images; understand that richer viewing history produces a richer habitat; and do all of this without paid/external runtime services or regressions to existing Cinemap journeys.