# Ocean Rendering PoC — Selection Record

This record is intentionally conservative. CI success never satisfies a visual gate.

## Fixed comparison inputs

- Modes: A / B / C / D / E
- States: 0 / 10 / 30 / 100 / 300 / 500 watched films
- Seed: `cinemap-poc-01`
- Primary device: iPhone Safari, portrait, HTTPS
- Final visual review: same camera/state/seed, then blind A/B of survivors

## Mandatory gates

| Gate | Requirement | Pass condition | Evidence / measurement | Status |
|---|---|---|---|---|
| G1 | Reads immediately as underwater ocean | no explanation needed | iPhone screenshot | PENDING |
| G2 | No primitive/polygon-demo impression | fewer than 2 polygon-warning checks | iPhone screenshot | PENDING |
| G3 | Natural-object recognition | seabed/rock/plants/animals read as such | iPhone screenshot | PENDING |
| G4 | Water reads as a medium, not a background colour | depth/scatter/occlusion visible | screenshot + motion | PENDING |
| G5 | Ecosystem, not placed props | relationships/layers/groups visible at 100 | 30 s observation | PENDING |
| G6 | Growth is visible | shuffled 0/30/100 states can be ordered | blind comparison | PENDING |
| G7 | 500-state remains coherent | mature, not cluttered/repetitive | 500-state observation | PENDING |
| G8 | Performance | median >= 30 fps; sustained sub-30 is FAIL | in-page HUD + device run | PENDING — 30 fps threshold |
| G9 | Touch operation | drag/pinch/page scroll usable | iPhone interaction | PENDING |
| G10 | Stability | 10 min, no reload/context loss/black screen | device endurance run | PENDING |
| G11 | Initial readiness | cold <= 5 s, target <= 3 s | 3 cold runs, median | PENDING |
| G12 | Zero runtime cost | no paid/runtime metered dependency | dependency review | PASS by design; recheck before adoption |
| G13 | Rights | every shipped asset/library auditable | license inventory | PENDING |
| G14 | Automatic growth | records -> scenario -> rendering without hand work | fixed-state harness | PASS |
| G15 | Cinemap integration | existing Ocean contract remains usable | smoke/contract tests | PENDING |

Any FAIL rejects that candidate regardless of score.

## Candidate identity

- A — current real-time Three.js/WebGL baseline.
- B — capability experiment; must prove an actually distinct WebGPU path before it can survive. Mere feature detection is not enough.
- C — asset-first real-time 3D profile. It must demonstrate a material rendering/content difference from A, not just CSS filtering.
- D — layered 2.5D/canvas composition emphasizing depth, vegetation, schools and water cues without a polygon seabed.
- E — illustrated 2D/canvas composition emphasizing natural recognition and growth over free-flight 3D.

## Current pre-device disposition

A: HOLD — useful baseline, but prior iPhone evidence failed the natural-ocean/polygon criterion.

B: HOLD — WebGPU availability alone is not a renderer. Reject unless a distinct implementation is demonstrated.

C: HOLD — must prove that asset-first is materially different from A in the actual frame.

D: HOLD — distinct implementation exists; requires G1–G11 device evidence.

E: HOLD — distinct implementation exists; requires G1–G11 device evidence.

No candidate is ADOPTED yet.

## Final decision vocabulary

`ADOPT` — all mandatory gates pass and score >= 75/100.

`HOLD` — evidence incomplete; never means pass.

`REJECT` — any mandatory gate fails or the candidate is not materially distinct.

## Next execution checkpoint

1. Run automated contract/build/license/smoke gates for the branch.
2. Reject candidates that are not materially distinct before asking for user review.
3. Produce identical-state HTTPS previews for surviving candidates.
4. Run the iPhone protocol: cold x3, warm x3, 30 s interaction, 10 min endurance, background return, 500-state stress.
5. Only after automated elimination, show at most two survivors for final blind A/B.
