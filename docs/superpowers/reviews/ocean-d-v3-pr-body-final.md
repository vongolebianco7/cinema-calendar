## D-v3 preview

Replaces D's per-frame procedural fish/rock/plant/light artwork with pre-decoded image sprites while retaining its smooth Canvas 2D motion/growth loop and DPR<=2 strategy.

### Automated contract
- zero paid/runtime external asset dependencies
- five visual categories have provenance
- primary habitat objects use cached `drawImage`
- old primitive habitat helpers removed
- fixed growth states retained
- iPhone performance floor remains >=50fps
- human G1/G2 cannot be auto-passed

### Merge rule
Preview/evaluation only. Do **not** merge as production Ocean until real iPhone Safari confirms G1 (reads as ocean), G2 (not polygon/primitive-CG), FPS>=50 and stability.
