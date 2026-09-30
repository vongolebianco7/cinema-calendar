# Ocean relative scale and habitat bands

Ocean uses approximate real-world body lengths as the visual baseline, multiplied by a single `DISPLAY_SCALE` of 1.2. This keeps species recognizable relative to one another instead of independently sizing each model. The renderer currently uses clownfish 0.11 m, butterflyfish 0.20 m, anglerfish 0.45 m, grouper 0.75 m, swordfish 3.0 m, shark 3.4 m, manta 4.5 m, and whale 12 m as deterministic reference lengths.

Habitat placement is also deterministic. Reef life stays near the reef, benthic and drifter life stays near the seabed, and pelagic life occupies the middle water column. Hero animals can use an upper/mid-water presentation lane so milestone rewards remain visible without changing their relative body scale.

These values are presentation baselines, not biological claims for every species or individual. Exact milestone species that do not yet have an exact local model are intentionally not substituted with a different animal.
