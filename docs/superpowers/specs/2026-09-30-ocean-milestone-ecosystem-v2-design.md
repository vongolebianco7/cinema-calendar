# Cinemap Ocean Milestone Ecosystem v2 — Design

Date: 2026-09-30

## Goal

Turn milestone creatures from one-off decorative replacements into a believable, high-quality reward ecosystem that grows with a user's movie history.

Success means:
- the first 100 films feel rewarding at 25-film intervals;
- milestone species can accumulate naturally over time instead of appearing only once;
- large and iconic species feel rare, cinematic, and visibly larger than ordinary fish;
- no placeholder/simple SVG art is shipped as a final milestone creature;
- the developer preview can inspect milestones well beyond 500 films;
- the existing 500-fish performance work remains intact.

## Core reward structure

The first four unlocks are fixed:

| Movies | Reward |
|---:|---|
| 25 | Clownfish / カクレクマノミ |
| 50 | Sea turtle / ウミガメ |
| 75 | Seahorse / タツノオトシゴ |
| 100 | Ocean sunfish / マンボウ |

The cadence intentionally starts dense so users experience ecosystem growth early.

## Recurring population rewards

Some milestone species should keep increasing after their first unlock.

### Clownfish
- Unlocks at 25 films.
- Gains +1 individual every 100 films after that: 25, 125, 225, 325, ...
- These should read as a growing local colony around reef/anemone habitat, not as giant hero animals.

### Sea turtle
- Unlocks at 50 films.
- Gains additional individuals more slowly than clownfish.
- Recommended cadence: 50, 250, 450, 650, ...
- Individuals should be spatially separated and cruise slowly rather than form a tight school.

### Seahorse
- Unlocks at 75 films.
- Can recur on a similarly slow cadence, recommended 75, 275, 475, 675, ...
- They belong near reef/vegetation structure and should not fill open mid-water.

### General rule
- Small/medium social or habitat-associated species may recur.
- Large apex or iconic species should generally remain singletons or recur only at very long intervals.
- Recurring rewards replace ordinary logical creatures so total creature count remains equal to the movie count.

## Large milestone ladder

After the first 100 films, the system escalates from unusual species to iconic large marine life. The exact later thresholds can be tuned during implementation, but the approved species pool is:

- Giant octopus / 大ダコ
- Manta ray / マンタ
- Dolphin / イルカ
- Hammerhead shark / ハンマーヘッドシャーク
- Large shark / 大型サメ
- Dugong / ジュゴン
- Minke whale / ミンククジラ
- Orca / シャチ
- Humpback whale / ザトウクジラ
- Whale shark / ジンベイザメ
- Blue whale / シロナガスクジラ

Recommended escalation:

| Movies | Large milestone |
|---:|---|
| 150 | Giant octopus |
| 200 | Manta ray |
| 300 | Dolphin |
| 400 | Hammerhead shark |
| 500 | Large shark |
| 600 | Dugong |
| 700 | Minke whale |
| 800 | Orca |
| 1000 | Humpback whale |
| 1200 | Whale shark |
| 1500 | Blue whale |

The later ladder should feel increasingly rare and spectacular rather than mechanically repeating every 100 films forever.

## Art quality gate

The current simple inline SVG milestone art is not acceptable as final art.

For every milestone species:
1. create or source a dedicated local asset first;
2. verify the silhouette is immediately recognizable;
3. verify transparency/cropping at iPhone size;
4. verify it still reads correctly over the approved Ocean background;
5. only then wire it into the ecosystem.

No final milestone creature may ship using a generic fish body, a crude geometric SVG, or another species as a substitute.

## Scale and motion

Milestone animals use biologically inspired relative presentation, not identical card-like sizing.

- Clownfish, seahorse: small, habitat-local.
- Sea turtle, sunfish, giant octopus: clearly larger than common fish.
- Manta, dolphin, sharks, dugong: hero-scale foreground/midground animals.
- Minke whale, orca, humpback whale, whale shark, blue whale: very large, slow-moving cinematic animals.

Large animals should move more slowly and over longer paths. The biggest animals may partially exceed the viewport to communicate scale.

No rectangular gold outline should be required to identify a milestone creature; the animal itself, its scale, placement, and subtle lighting should provide the reward feeling.

## Habitat-aware placement

- Clownfish: reef/anemone zone.
- Sea turtle: reef edge / open mid-water.
- Seahorse: vegetation / reef structure.
- Ocean sunfish: open mid-water.
- Giant octopus: seabed / rock structure.
- Manta: broad open-water glide.
- Dolphin: open upper-mid water.
- Hammerhead and large shark: open mid-water, separated from dense small-fish schools.
- Dugong: calmer shallow/seagrass-like zone.
- Whales, orca, whale shark: large open-water routes with ample negative space.

## Rendering and performance

Preserve the hybrid renderer introduced for 500-creature performance:
- a limited number of hero/foreground DOM creatures;
- the remaining ordinary population on Canvas;
- a single animation loop;
- reduced update frequency for far-background layers.

Milestone animals should occupy the scarce high-quality DOM/hero slots. Ordinary fish should be demoted to Canvas as needed so adding a whale never regresses performance.

The logical population invariant remains:
- N watched films = N total logical creatures;
- milestone and recurring special creatures replace ordinary creatures rather than increasing total count.

## Preview / QA redesign

The current preview must no longer stop at 500.

Add direct preview states for at least:
- 25
- 50
- 75
- 100
- 150
- 200
- 300
- 400
- 500
- 600
- 700
- 800
- 1000
- 1200
- 1500

Also add a development-only milestone gallery showing each special species in isolation at its intended scale. This gallery exists to catch poor art, duplicate-image composition, bad cropping, and scale mistakes before the species is integrated into the full Ocean.

## Acceptance criteria

1. 25 films shows one clownfish milestone creature.
2. 50 films shows the first sea turtle.
3. 75 films shows the first seahorse.
4. 100 films shows the first ocean sunfish.
5. 125 films shows two clownfish while preserving exact total logical population.
6. Recurring species follow their recurrence rules without creating dense piles.
7. Large milestone animals are visibly larger than ordinary fish and use species-specific motion/placement.
8. No crude placeholder SVG milestone art is present in production.
9. Preview states exist through at least 1500 films.
10. 500+ creature scenes preserve the existing hybrid performance behavior and remain responsive on iPhone-size WebKit/Chromium smoke tests.
11. Existing Ocean background, HUD separation, exact population semantics, and record persistence remain unchanged.
