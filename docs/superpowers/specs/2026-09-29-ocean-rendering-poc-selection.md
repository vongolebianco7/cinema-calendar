# Ocean Rendering PoC Selection — Design Specification

Date: 2026-09-29
Status: design approved in chat; implementation-plan review pending

## Purpose
Select the rendering architecture for Cinemap Ocean using reproducible iPhone Safari evidence rather than implementation effort, CI success, or developer preference.

## Product intent
Ocean is a personal marine ecosystem grown from movie viewing records: watch -> rate -> life appears -> species diversify -> schools/habitat grow -> rare/large life appears -> the sea matures. A zero-record state may be quiet, but must still look like a natural sea. The chosen architecture must remain fully free to run and comply with licenses/terms.

## Candidates
A. Current-style Three.js/WebGL real-time 3D, rebuilt as a fair baseline.
B. WebGPU-first real-time 3D with compatible fallback only if it remains zero-cost and supportable.
C. Asset-led real-time 3D using properly licensed lightweight glTF assets rather than procedural primitives as the visual basis.
D. Hybrid 2.5D: 3D spatial/depth layer plus sprites/layers/shaders where they improve naturalness and performance.
E. 2D/Canvas/WebGL composition where full free-flight 3D is traded for stronger visual fidelity and stability.

At minimum A/C/D must be completed before selection. No candidate wins by default because it resembles the current implementation.

## Fixed comparison scene
Every candidate receives identical deterministic ecosystem inputs and camera targets using the same seed. Required states: 0, 10, 30, 100, 300, 500 viewing records. The 100-record scene must be capable of representing terrain/seabed, reef/rock structure, vegetation/coral, small schooling life, medium life, one large-life class, foreground/midground/background, underwater particles/light/attenuation, swimming motion and slow environmental motion. Viewing count is not rendered creature count; records are compressed into ecosystem state.

## Mandatory gates
A candidate is REJECTED if any mandatory gate fails.

G1 Natural sea recognition: an unexplained iPhone screenshot is immediately recognizable as an underwater sea.
G2 No primitive/polygon-demo impression: seabed, rocks and vegetation do not read as PlaneGeometry, primitives, cards/lines or copied tutorial assets. Detailed G2 rule: two or more of the following is automatic FAIL — visible polygon/plane structure; primitive-looking rocks; line/card-looking vegetation; obvious repeated-object copies; terrain/objects fail to blend; game-stage impression; Three.js/tutorial-demo impression; CG is noticed before water/sea.
G3 Natural-object recognition: seabed/rock/vegetation/fish read immediately as those natural objects.
G4 Water-medium recognition: water is perceptible through depth, attenuation/scattering/particles/light rather than merely a blue-green background.
G5 Ecosystem recognition: 100-record state reads as a living ecosystem, not objects arranged in a tank/stage.
G6 Growth legibility: shuffled 0/10/30/100/300/500 captures can broadly be reordered by maturity without labels.
G7 Scale robustness: 500-record state remains coherent, non-repetitive and not overcrowded.
G8 Performance: normal median >=30fps on target iPhone Safari; sustained sub-30fps is FAIL. 1%-low-equivalent target >=20fps.
G9 Interaction: drag/pinch and surrounding page scroll remain usable without camera/page-control conflict.
G10 Stability: 10-minute test has zero forced Safari reloads, black screens and WebGL/WebGPU context losses.
G11 Startup: cold usable <=5s (target <=3s), measured three times and judged by median; warm target <=3s.
G12 Cost: runtime cost is JPY 0; no paid/usage-metered API, rendering service, asset dependency or CDN requirement.
G13 Rights: every library and visual asset has documented acceptable license/terms before adoption.
G14 Automatic growth: fixed record datasets deterministically produce ecosystem state without manual scene authoring per user.
G15 Integration: candidate can be embedded without breaking existing iPhone page layout/scroll behavior.

## Scored criteria after gates
Only all-gate-pass candidates receive a score. 100 points: natural sea 20; ecosystem 15; growth delight/legibility 15; underwater depth 10; creature naturalness/motion 10; interaction 10; performance headroom 5; startup 5; maintainability 5; extensibility 5. Adoption threshold: >=75/100, then top two advance to final real-device A/B.

## Reproducible iPhone Safari procedure
Record candidate, commit, preview URL, timestamp, iPhone model, iOS/Safari, orientation, Low Power Mode, network, battery, charging, device temperature, Reduce Motion and content-blocker state. Standard run: portrait; Low Power Mode off; ~50% brightness; same network; VPN off for benchmark; minimal unrelated Safari tabs; discard runs when device is hot.

Use deterministic URLs/state controls equivalent to `pocState=0|10|30|100|300|500` plus `seed=cinemap-poc-01`. Candidate architecture must not alter the input dataset.

Cold load: 3 runs, record visual and usable times, then screenshot after 5s idle. Warm load: 3 runs. Do not mix cold/warm averages.

Visual capture: same camera/seed for 0/30/100/500. Evaluate G1-G4 before exposing implementation identity.

Growth test: capture 0/10/30/100/300/500, shuffle, and judge maturity ordering from visual ecosystem change rather than UI labels or creature count.

30-second interaction script: 0-5 idle; 5-10 slow left-to-right drag; 10-15 right-to-left; 15-20 pinch out; 20-25 pinch in; 25-30 scroll page outside Ocean. Record lag, jank, camera errors, pinch, page-scroll interference and rendering defects.

Instrumentation: development HUD/log records median FPS, 1%-low equivalent, median frame time, long-frame count and dropped-frame estimate. Visual quality is never inferred from these metrics.

10-minute endurance at 100 records: 0-2 idle; 2-4 drag/pinch; 4-6 idle; 6-8 page scroll and return; 8-10 interaction. Record performance at start/5m/10m, heat, reload/context loss/black screen/interaction failure.

Background recovery: Home for 30s -> Safari -> interact; switch tab for 30s -> return -> interact.

500-record stress: verify record-to-ecosystem compression, density, diversity, maturity, performance and memory stability; never render 500 creatures merely because input contains 500 records.

Abnormal-result rule: one anomaly triggers two same-condition reruns; >=2 matching anomalies is reproducible FAIL. Hot-device results are discarded and rerun after cooling. Network anomalies invalidate load measurements only, not visual/FPS results.

Order-bias control: do not always run A->E. Rotate order between rounds so later candidates are not systematically penalized by device heat. Prefer two rounds for finalists.

## Evidence record per candidate
Store: candidate ID; commit; preview URL; device/iOS/date; G1-G15 PASS/FAIL with reason; score if eligible; cold/warm medians; FPS/1%-low/frame-time; 10-minute degradation; reload/context-loss counts; background recovery; interaction results; 0/30/100/500 captures; license/cost audit; fixable issues; architecture limits; final ADOPT/HOLD/REJECT decision.

## Decision policy
1. Build candidates as isolated PoCs, not production Ocean replacements.
2. Run automated/measurable gates first and reject obvious failures.
3. Perform screenshot/video visual gates independently of CI status.
4. A candidate with any mandatory failure cannot be adopted regardless of score.
5. Only all-gate-pass candidates >=75 advance.
6. Present at most the top two candidates to the user for final iPhone A/B, minimizing user effort.
7. Only after that A/B selection may the winning architecture replace production Ocean.
8. CI green, WebGL/WebGPU rendering success, or implementation completion must never be reported as visual completion.

## Explicit non-goals
Do not continue polishing PR #100 as the architecture-selection strategy. Do not solve naturalness primarily through camera/lighting/color changes. Do not equate more polygons or more objects with ecosystem quality. Do not require paid services or runtime AI generation. Do not ask the user to manually execute the full benchmark suite; automate instrumentation/state switching/capture where practical and reserve user effort for final A/B.