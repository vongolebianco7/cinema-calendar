# Third-party notices — Cinemap Ocean renderer

## Three.js

- Project: Three.js
- License: MIT
- Usage: WebGL renderer, scene graph, materials, geometry and local glTF loading.
- Runtime policy: bundled locally for Cinemap; no CDN dependency.

## forbiddenlink/ocean-simulator

- Project: `forbiddenlink/ocean-simulator`
- License: MIT
- Usage: architecture/reference source for underwater rendering techniques including depth fog, light absorption/scattering, caustic treatment, volumetric shafts, draw-call-aware schooling and adaptive quality.
- Integration rule: tracker/analytics code and unrelated application code are not copied. Cinemap keeps its own ecology model and product UI.

## Ocean 3D assets

- Quaternius: fish, clownfish, butterflyfish, swordfish, whale, manta ray, shark, anglerfish and rocks — CC0 1.0.
- MiniPoly: coral reef set — CC0 1.0.
- Kenney: shipwreck — CC0 1.0.
- Draco decoder: Google — Apache-2.0.
- Provenance and per-file mapping are recorded in `assets/licenses.json`.
- All models and decoders are vendored into the repository; there are no runtime model/CDN requests.
