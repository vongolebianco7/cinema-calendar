from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
immersive = (ROOT / 'preview/ocean/js/ocean-immersive.js').read_text(encoding='utf-8')
renderer = (ROOT / 'preview/ocean/js/ocean-cinematic.js').read_text(encoding='utf-8')

assert 'CinemapOceanEcosystem.build' in immersive, 'Ocean must keep the deterministic ecosystem domain model'
assert "VERSION='0.6.1'" in immersive, 'Ocean must expose a visible v0.6.1 build marker'
assert "CACHE='7'" in immersive, 'renderer modules must share the v0.6.1 cache key'
assert 'CinemapOceanCinematic.mount' in immersive, 'immersive Ocean must mount the cinematic renderer'
assert 'ocean-webgl.js' not in immersive and 'ocean-geometry.js' not in immersive, 'rejected low-poly renderer must not be loaded'
assert 'requestAnimationFrame(frame)' in renderer, 'Ocean uses one realtime frame loop'
assert 'devicePixelRatio' in renderer and 'Math.min(2' in renderer, 'iPhone render resolution must be bounded'
assert 'showFallback' in renderer, 'canvas failure must fail gracefully'
assert 'fish-atlas' not in renderer and 'cosmosHalo' not in renderer, 'primary renderer must not return to sprite/halo treatment'
assert 'world={w:2000,h:1000}' in renderer, 'Ocean must be a materially large continuous world'
assert "zoom:.34" in renderer and "r.width/1250" in renderer, 'first camera state must be a wide overview'
assert 'camera.x=clamp' in renderer and 'camera.y=clamp' in renderer, 'one-finger travel must cover a broad bounded world'
for layer in ['function water','function distantReef','function seabed','function foreground']:
    assert layer in renderer, f'{layer} must be an explicit atmospheric layer'
for habitat in ['function rock','function coral','function kelp','function schools']:
    assert habitat in renderer, f'{habitat} must make habitat growth visible beyond focal animals'
assert 'bezierCurveTo' in renderer and 'createLinearGradient' in renderer and 'createRadialGradient' in renderer, 'organic silhouettes and continuous shading replace triangle primitives'
for treatment in ['function whale','function ray','function turtle','function jelly','function fishBody']:
    assert treatment in renderer, f'{treatment} must have a distinct organic treatment'
assert 'https://' not in renderer, 'renderer must not introduce external runtime requests'
print('Ocean cinematic v0.6.1 renderer contract passed')
