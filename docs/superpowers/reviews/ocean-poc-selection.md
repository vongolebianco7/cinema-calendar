# Ocean Rendering PoC — Selection Record

CI success never satisfies a subjective visual gate.

## Fixed comparison inputs
- Modes: A / B / C / D / E
- States: 0 / 10 / 30 / 100 / 300 / 500 watched films
- Seed: `cinemap-poc-01`
- Primary device: iPhone Safari, portrait, HTTPS

## Mandatory gates
| Gate | Requirement | Pass condition | Evidence | Status |
|---|---|---|---|---|
| G1 | Reads immediately as underwater ocean | no explanation needed | iPhone screenshot | PENDING |
| G2 | No primitive/polygon-demo impression | natural forms dominate | iPhone screenshot | PENDING |
| G3 | Natural-object recognition | seabed/rock/plants/animals recognizable | iPhone screenshot | PENDING |
| G4 | Water reads as a medium | depth/scatter/occlusion visible | screenshot + motion | PENDING |
| G5 | Ecosystem, not placed props | relationships/layers/groups visible | 30 s observation | PENDING |
| G6 | Growth is visible | shuffled 0/30/100 can be ordered | blind comparison | PENDING |
| G7 | 500-state remains coherent | mature, not cluttered/repetitive | observation | PENDING |
| G8 | Performance | median >= 30 fps | HUD + device run | PENDING — 30 fps threshold |
| G9 | Touch operation | page interaction usable | iPhone | PENDING |
| G10 | Stability | 10 min no reload/black screen | endurance | PENDING |
| G11 | Initial readiness | cold <= 5 s, target <= 3 s | 3 cold runs | PENDING |
| G12 | Zero runtime cost | no paid/metered dependency | dependency review | PASS |
| G13 | Rights | shipped assets/libraries auditable | license inventory | PENDING |
| G14 | Automatic growth | records -> scenario -> rendering | fixed-state harness | PASS |
| G15 | Cinemap integration | existing Ocean contract works | smoke/contract | PENDING |

Any FAIL rejects the candidate.

## Automated elimination
A: REJECT for final comparison — prior iPhone evidence already failed the natural-ocean/polygon criterion; retained only as regression baseline.

B: REJECT — it only checked WebGPU availability and then used the same layered canvas family. It was not a WebGPU renderer.

C: REJECT — it reused renderer A with a CSS filter/renderProfile hint and did not establish a materially distinct rendering path.

D: HOLD — genuinely distinct layered 2.5D/canvas approach.

E: HOLD — genuinely distinct illustrated 2D/canvas approach.

**Finalists: D and E.**

Neither finalist is ADOPTED until real iPhone evidence passes G1–G11, G13 and G15. This is deliberate: CI must not fabricate visual approval.

## Final device protocol
Use identical seed/state and portrait viewport. For D and E: cold load x3; warm load x3; inspect 0/30/100/500 growth; interact for 30 seconds; background/return; 10-minute endurance; record median FPS and readiness. If both pass, choose the stronger natural-ocean/ecosystem result by blind D/E comparison. If only one passes, adopt it. If neither passes, reject both rather than shipping a weak Ocean.