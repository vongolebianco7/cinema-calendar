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

Any later creature or habitat asset must be added to `assets/licenses.json` before it can ship.
