# Ocean Manta Rigging Design

## Context

Cinemap Ocean currently deforms milestone creatures by applying a continuous WebGL mesh wave across a single image. This removed the previous vertical-slice artifact, but the resulting motion still reads as a rubber sheet rather than a living manta. The user rates the current visual quality around 20/100 and specifically rejects the fin motion as visibly mechanical and game-like.

This design deliberately narrows scope to **one manta ray only**. It does not change turtles, dolphins, whales, sharks, octopus, ordinary fish, milestone rules, population logic, or production deployment behavior. The manta must reach an acceptable visual standard before the rig is generalized.

## Goal

Make the manta’s pectoral fins read as continuous, organic swimming motion on an iPhone-sized viewport by replacing whole-image wave deformation with a weighted 2.5D skeletal rig.

The visible result matters more than passing source-level or CI checks. CI is a regression safety net, not the completion criterion.

## Selected approach

Use **one existing manta texture + seven logical bones** rendered through WebGL skinning:

- 1 torso/root bone
- 3 left-wing bones: root, mid, tip
- 3 right-wing bones: root, mid, tip

The source image remains a single seamless texture. No visible image slicing or separate wing image assets are introduced. Each mesh vertex receives weighted influence from nearby bones so deformation stays continuous across the body-wing transition.

This is preferred over:

- CSS articulated image pieces, because seams and paper-doll rotation would remain visible.
- Further tuning the current global sine-wave mesh, because it bends the entire image rather than modeling wing structure.
- New multi-part art assets, because they add unnecessary asset-production scope before the rigging model itself is proven.

## Rig topology

The manta coordinate system is normalized from `u=0..1`, `v=0..1` over the source texture.

The torso occupies the central band and is strongly influenced by the root bone. Each wing has three progressively distal bones. Exact bone anchor positions may be tuned visually, but the initial target layout is:

- root/torso: `(0.50, 0.52)`
- left wing root: `(0.39, 0.52)`
- left wing mid: `(0.23, 0.51)`
- left wing tip: `(0.07, 0.50)`
- right wing root: `(0.61, 0.52)`
- right wing mid: `(0.77, 0.51)`
- right wing tip: `(0.93, 0.50)`

Vertices in the torso center must remain predominantly root-controlled. Vertices approaching a wing smoothly blend between adjacent wing bones. No vertex may switch abruptly from one bone to another.

## Weighting

Use continuous distance-based or segment-based weights normalized per vertex.

Requirements:

- Maximum four bone influences per vertex.
- Torso-center vertices retain at least 80% root weight.
- Wing-root vertices blend root + wing-root bone.
- Wing-mid vertices blend wing-root + wing-mid + wing-tip as needed.
- Wing-tip vertices are predominantly controlled by the tip bone.
- Weight transitions must be smooth and monotonic across each wing.

Weights should be generated once when the mesh is created, not recomputed every frame.

## Motion model

The animation is not a symmetric `sin()` applied identically to every wing segment.

One stroke cycle has four conceptual phases:

1. **Power stroke** — the wing root begins pressing downward.
2. **Wave propagation** — mid and tip follow with a small time delay.
3. **Recovery transition** — the root reverses before the tip has fully completed the previous motion.
4. **Recovery stroke** — the wing returns more gently than it pressed down.

The visible motion must therefore be asymmetric in both time and amplitude.

Initial tuning targets:

- Cycle duration: approximately 3.2–4.0 s.
- Root rotation: smallest amplitude.
- Mid rotation: larger than root.
- Tip rotation: largest amplitude.
- Mid phase delay relative to root: about 70–130 ms.
- Tip phase delay relative to root: about 140–240 ms.
- Left/right wings: tiny phase offset, approximately 30–90 ms, to avoid perfect mirrored robotics.
- Torso motion: minimal; only subtle inherited deformation near wing roots.

The implementation may use a smooth piecewise easing curve, cubic interpolation, or sampled animation curve. A plain global sine wave is not acceptable as the sole motion driver.

## Rendering

Create a manta-specific skinning renderer rather than generalizing immediately to every animal.

The existing manta source texture is reused. The manta mesh should have enough spatial resolution for a smooth silhouette but should stay well below a level that harms iPhone performance. Start near the existing mesh density and increase only if visible edge faceting remains.

The vertex shader should receive:

- base vertex position
- texture coordinate
- bone indices
- bone weights
- bone transforms for the seven bones

Each frame computes the bone transforms on the CPU and uploads them as uniforms. The GPU performs weighted vertex skinning.

The fragment shader remains a normal textured pass with the current transparency/background-keying behavior preserved.

## Integration boundary

Only `manta-ray` uses the new rigging path during this phase.

Recommended structure:

- Add a manta-specific rigging module near the existing Ocean milestone renderer.
- `milestone-atlas.js` selects the rigged renderer only when the species is `manta-ray` and a rig config is present.
- Existing WebGL deformation remains untouched for other animals during this experiment.
- The manta catalog entry gains a `rig` block rather than overloading the generic deformation parameters.

No main-branch merge is allowed until the visual acceptance criteria below are met.

## Visual acceptance criteria

The manta is not considered successful merely because the renderer works or tests pass.

On an iPhone-sized viewport, all of the following must be visually true:

1. No visible hinge, crease, or angular joint between torso, wing root, mid-wing, and tip.
2. The wing bends as a continuous curve from root to tip.
3. Motion visibly propagates root → mid → tip instead of all points moving together.
4. The wing tip travels more than the root.
5. The torso remains visually stable and does not look gelatinous.
6. Downstroke and recovery do not look like identical mirrored halves of a loop.
7. Left and right wings do not look perfectly mechanically synchronized.
8. The manta does not resemble a flat card, paper puppet, or rubber sheet.
9. The result is clearly less game-like than the current implementation when viewed side-by-side.
10. The reviewer should be able to call the manta at least roughly 70/100 before any attempt is made to generalize the approach.

If these criteria are not met, the experiment remains incomplete even if every automated test is green.

## Review method

Evaluation must use a dedicated preview that isolates one manta at a useful size against the Ocean background, plus the normal 500-film Ocean scene.

For the isolated preview:

- Keep the manta largely stationary in screen space so the wing motion can be judged independently from horizontal travel.
- Capture at least one short visual comparison of current vs rigged motion under the same viewport and scale.
- Check at iPhone dimensions first.

For the full scene:

- Verify that the manta still integrates spatially with the Ocean environment.
- Verify no major performance regression at the 500-film population target.

The assistant must inspect the actual rendered result before asking the user to review it. Passing CI alone is insufficient.

## Performance constraints

- Preserve the existing shared animation scheduler; do not create a dedicated perpetual RAF loop per manta.
- Keep animation work paused when the manta is offscreen or the document is hidden.
- No paid APIs, paid services, external runtime dependencies, or remote rendering services.
- No new network requests during animation.
- Existing 500-film Ocean performance contract must continue to pass.
- iPhone/WebKit compatibility is mandatory.

## Accessibility

`prefers-reduced-motion` remains supported. Reduced motion should lower bone rotation amplitudes and slow the cycle rather than disabling the creature entirely.

## Failure handling

If WebGL skinning setup fails, fall back to the current direct/static manta rendering rather than throwing or taking down the Ocean page. A failed advanced renderer must not trigger whole-page Ocean fallback behavior.

## Non-goals

This phase does not:

- Rig any species other than manta ray.
- Replace the manta artwork.
- Build a general-purpose skeletal animation framework for all Cinemap creatures.
- Add 3D models.
- Change milestone counts or Ocean progression.
- Change horizontal swim speed or route logic.
- Merge automatically after CI success.

## Exit condition

The phase exits only when the manta-specific rig can be judged visually against the existing implementation and meets the visual acceptance criteria above. Only then may a separate design/implementation decision be made about applying the technique to turtles, dolphins, whales, sharks, or other milestone creatures.
