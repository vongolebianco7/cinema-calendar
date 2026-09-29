# Ocean D-v3 checkpoint

Status: implementation complete for automated scope; human G1/G2 remains deliberately pending.

## Changes
- Retains D-v2 Canvas 2D animation loop and DPR<=2 performance strategy.
- Replaces procedural fish, rock, vegetation and light shapes with decoded cached image sprites.
- Uses self-authored local SVG data images; no runtime external requests, paid APIs, or third-party asset ambiguity.
- Seabed is a soft depth gradient plus micro-grain rather than a hard polygon ridge.
- Fixed seed and 0/30/100/300/500 states remain available.

## Mandatory adoption gate
Do not merge as final Ocean solely because CI is green. On iPhone Safari, 100-state D must satisfy:
1. motion remains smooth (target median >=50fps; preferred >=55),
2. no blank/reload/context failure,
3. G1 reads as an underwater scene without explanation,
4. G2 does not read as polygons / primitive-CG / simple geometry.

If G2 fails, retain the compositor/performance work but replace visual assets again. Never lower the gate.
