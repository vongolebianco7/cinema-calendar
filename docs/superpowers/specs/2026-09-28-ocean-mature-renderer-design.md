# Ocean mature-renderer redesign

Date: 2026-09-28
Status: design for approval

## Intent

Ocean must feel like a real, explorable underwater ecosystem on iPhone, not a movie map with fish icons and not a collage of pre-rendered animals. Watching and rating films causes the user's own ecosystem to grow. The first view is a distant, wide establishing shot. The user should not be asked to review obvious prototypes.

## Why the previous approaches are rejected

1. CSS/2D asset composition produced a pasted-on aquarium look.
2. Hand-written WebGL and primitive procedural geometry produced debug/prototype visuals.
3. A precomposed cinematic background improved atmosphere but violated the product idea because animals were already baked into the scene.
4. A PlayCanvas quality spike proved that changing engines alone is insufficient when the scene is still authored from cones, capsules, spheres and a single static fish asset. The iPhone screenshot failed visual review and the spike was closed without merge.

## Chosen architecture

Use a mature Three.js underwater rendering stack as the starting point instead of authoring an ocean renderer from scratch.

Reference implementation: `forbiddenlink/ocean-simulator` (MIT). Reuse/adapt only the rendering and simulation techniques needed by Cinemap, with preserved license notices. Do not copy telemetry or unrelated product code.

Core runtime:
- Three.js for scene/rendering.
- `postprocessing` only for effects that materially improve the scene and remain performant on iPhone.
- Cinemap-owned adapter translating film records into ecosystem entities.
- Local/static build output. No runtime CDN, paid service, AI API, tracker, scraper or backend requirement.

The reference project's PostHog dependency is explicitly excluded. No analytics/tracking dependency is introduced.

## Visual system

The ocean is constructed from real-time layers rather than a background image:

- depth-aware underwater fog and Beer-Lambert-style color absorption;
- caustic light on terrain/objects;
- soft volumetric light shafts rather than geometric cones or circular sprites;
- marine snow / suspended particulate matter, never bubble-like rings around creatures;
- terrain/reef habitat with coherent lighting and materials;
- color grading and restrained bloom/SSAO where the iPhone performance budget allows;
- wide initial camera with foreground, midground and distant silhouettes so the space reads as a large ocean.

No pre-rendered animal may be baked into the environment. Every visible animal is a scene entity.

## Creature system

Production creatures use locally vendored, license-reviewed glTF/GLB assets rather than primitive fish geometry. Prefer CC0; attribution-compatible assets may be used only after a documented compliance review.

Minimum launch set should include multiple body plans, not recolors of one fish: small schooling fish, medium fish, ray, shark/large fish, turtle, jellyfish and one rare large creature if suitable compliant assets are available.

Animation requirements:
- animated/skinned/morph assets where available;
- otherwise a vetted deformation/swim shader may be used only if it looks natural in the visual gate;
- schooling uses boids/steering with depth, speed and scale variation;
- no identical synchronized movement;
- hero/rare creatures have slower, more legible paths.

## Cinemap ecosystem mapping

The renderer receives an ecosystem state from existing film records. Rendering code does not infer movie metadata from external services.

Growth rules remain deterministic:
- more watched films -> population and habitat density increase;
- broader film diversity -> more creature body plans / habitat variety;
- high ratings -> richer or rarer organisms;
- 5.0 ratings remain exceptional and can unlock rare large creatures or habitat landmarks;
- empty/new accounts start with a sparse but visually complete ocean, not a broken empty screen.

The renderer must make growth visible without turning the scene into a legend of genre-to-fish mappings.

## Interaction

Primary target: iPhone portrait.

- initial state: distant establishing view;
- one-finger drag: orbit/pan within bounded ocean space;
- pinch: smooth dolly/zoom with a substantially larger useful range than the rejected version;
- tap creature: lightweight film-origin detail, without freezing navigation;
- reset: animated return to the establishing view;
- no page-level horizontal scrolling.

## Performance budget

- target 45-60 fps on a current iPhone; 30 fps is the hard lower fallback target during dense scenes;
- device-pixel-ratio capped on mobile;
- instancing/batching for schools and repeated habitat assets;
- LOD / distance culling for distant organisms;
- adaptive quality tiers may reduce particles, SSAO/bloom, shadow resolution and population before reducing core interaction quality;
- no requirement for WebGPU; WebGL2 is the compatibility baseline.

## Compliance and cost

- fully free; no paid/metered API or automatic overage;
- no production generative-AI calls;
- no scraping;
- no tracker;
- third-party source and asset licenses committed alongside vendored material;
- runtime assets served from Cinemap's own static build, not fetched from third-party CDNs;
- retain required MIT/Zlib/asset notices.

## Quality gate

Passing CI is necessary but never sufficient.

Before any renderer change can be proposed for main:
1. deterministic tests pass;
2. 390x844 browser run has no page/console errors or horizontal overflow;
3. iPhone screenshot is captured from the actual build;
4. visual self-review explicitly checks: water/depth, natural lighting, creature quality, habitat quality, scale variation, no collage look, no primitive/debug look, no bubble-like creature halos, and distant initial framing;
5. if the screenshot is obviously prototype-quality, reject the implementation/asset choice before user review;
6. main is not changed automatically; PR remains for human approval under AGENTS.md.

## Acceptance criteria for the first production milestone

- A screenshot is immediately recognizable as a coherent underwater 3D scene without relying on a pre-rendered background.
- At least three visually distinct, real 3D creature assets are visible across near/mid/far depth in demo data.
- No cones/capsules/spheres are visibly recognizable as final light, plant, rock or creature art.
- Light shafts, fog, caustics/underwater light and particulate depth all contribute without overpowering the scene.
- Initial camera is a wide establishing shot and navigation has useful travel range on iPhone.
- Removing all film records measurably reduces life/habitat density; adding records grows it deterministically.
- No third-party runtime network request is required after the static app bundle/assets are served.

## Non-goals for milestone 1

- photorealistic AAA rendering;
- multiplayer;
- physics-heavy predator/prey simulation;
- backend persistence changes;
- audio;
- desktop-first controls;
- monetization or paid infrastructure.

## Migration strategy

Build the new renderer behind an isolated Ocean module/feature boundary. Keep the current production Ocean reachable until the replacement passes the visual gate. Do not incrementally mutate the rejected renderer into the new architecture. Once the new renderer passes tests and visual review, wire the existing ecosystem state into it and replace the old Ocean in one reversible PR.
