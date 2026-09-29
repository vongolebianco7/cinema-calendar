# D-v3 art-layer contract

`d-v3-assets.js` is intentionally replaceable. The compositor consumes decoded `fish[]`, `rock`, `grass`, and `caustic` images. If G2 fails, replace this module's art without reverting to per-frame primitive geometry or rewriting the motion/growth loop.
