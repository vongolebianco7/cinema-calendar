# D-v3 execution ledger

- Checkpoint 1: branch `feat/ocean-d-v3-sprites` created from main.
- Ruling: do not depend on third-party binary downloads for the first D-v3 visual gate. Use self-authored cached image sprites so rights and runtime-network budgets are deterministic. Cost if wrong: visual quality may still fail G2, in which case only sprite art is replaced; compositor survives.
- Checkpoint 2: five fish image variants, irregular rock, vegetation and caustic image assets implemented in `d-v3-assets.js` and decoded before animation.
- Checkpoint 3: D renderer converted from procedural fish/rock/plant/light primitives to `drawImage` composition. Seabed retains only micro-grain procedural detail and a soft gradient; no hard polygon ridge.
- Checkpoint 4: tests enforce sprite usage, zero runtime fetch, DPR<=2, provenance for all five categories and >=50fps performance budget.
- Checkpoint 5: automated implementation scope complete. Remaining gate is real iPhone Safari G1/G2 plus measured FPS. Do not claim final adoption before that evidence.
