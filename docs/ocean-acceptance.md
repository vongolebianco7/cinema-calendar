# Ocean/Aquarium Acceptance Gates

## Product goal
Ocean/Aquarium is a personal marine ecosystem that visibly grows as the user watches and rates films. It must not degrade into a genre map where genre nodes are merely replaced by fish.

## State model
Each gate is evaluated from current `main` and may have only one state: `UNKNOWN`, `PASS`, `FAIL`, or `BLOCKED`.

Do not report percentage completion. A gate is `PASS` only when current-main code/tests or an applicable iPhone/mobile browser check provides evidence. After every approved-scope merge, re-evaluate the gates from current `main` and select the highest-priority unmet gate that can be addressed safely.

## Priority order
When multiple gates are unmet, choose the lowest numbered Critical gate first, then High gates in numeric order. A `BLOCKED` gate does not justify skipping a safe higher-priority `FAIL` gate unless the blocker directly prevents that work.

| ID | Priority | Acceptance requirement |
| --- | --- | --- |
| OCEAN-01 | Critical | Recording a watched film updates the user's Ocean ecosystem through the existing recording journey. |
| OCEAN-02 | Critical | The user's rating changes ecosystem growth/character in a meaningful deterministic way; ratings are not decorative metadata. |
| OCEAN-03 | Critical | The ecosystem is not a one-to-one genre-to-fish visualization; growth combines viewing history, ratings, diversity and ecosystem state. |
| OCEAN-04 | Critical | Primary Ocean viewing/recording interactions are usable at the project's iPhone/mobile target without page-level horizontal overflow or core console/page errors. |
| OCEAN-05 | Critical | `python scripts/quality_gate.py` and applicable Autonomous quality-gate/mobile checks pass for the current integrated change. |
| OCEAN-06 | High | Increasing viewing history can increase biodiversity rather than only adding copies of the same genre species. |
| OCEAN-07 | High | Environmental elements such as habitat/vegetation/seabed richness visibly mature alongside fauna. |
| OCEAN-08 | High | Sparse-history and mature-history Oceans are visibly distinguishable as ecosystems, not merely by counters or labels. |
| OCEAN-09 | High | Ocean state derived from user records survives reload through the project's approved free/local persistence path. |
| OCEAN-10 | High | Renderer failure has a usable fallback that preserves essential record/ecosystem information instead of a blank screen. |
| OCEAN-11 | High | No critical visual regression obscures core ecosystem content or controls on the primary mobile viewport. |

## Completion rule
Ocean/Aquarium is complete only when every gate above is `PASS` on current `main`. PR creation, CI success, a merge, visual improvement, or a subjective statement such as “mostly complete” is not completion.

## Human escalation
Use `HUMAN_REQUIRED` only for payment, authentication, irreversible actions, or a major unresolved product/specification choice. Otherwise continue with the highest-priority safely actionable unmet gate.
