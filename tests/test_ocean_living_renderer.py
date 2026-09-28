from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
immersive = (ROOT / 'preview/ocean/js/ocean-immersive.js').read_text(encoding='utf-8')
renderer = (ROOT / 'preview/ocean/js/ocean-cinematic.js').read_text(encoding='utf-8')

assert 'CinemapOceanEcosystem.build' in immersive, 'v0.6 must keep the deterministic ecosystem domain model'
assert "VERSION='0.6.0'" in immersive, 'Ocean must expose a visible v0.6.0 build marker'
assert "CACHE='6'" in immersive, 'renderer modules must share a v0.6 cache key'
assert 'CinemapOceanCinematic.mount' in immersive, 'immersive Ocean must mount the cinematic renderer'
assert 'ocean-webgl.js' not in immersive and 'ocean-geometry.js' not in immersive, 'rejected low-poly renderer must not be loaded'
assert 'requestAnimationFrame(frame)' in renderer, 'Ocean uses one realtime frame loop'
assert 'devicePixelRatio' in renderer and 'Math.min(2' in renderer, 'iPhone render resolution must be bounded'
assert 'showFallback' in renderer, 'canvas failure must fail gracefully'
assert 'fish-atlas' not in renderer and 'cosmosHalo' not in renderer, 'primary renderer must not return to sprite/halo treatment'
assert 'world={w:1600,h:900}' in renderer, 'Ocean must be a materially large continuous world'
assert "zoom:.38" in renderer and "r.width/1050" in renderer, 'first camera state must be a wide overview'
assert 'camera.x=clamp' in renderer and 'camera.y=clamp' in renderer, 'one-finger travel must cover a broad bounded world'
assert 'drawWater' in renderer and 'drawLightShafts' in renderer and 'drawTerrain' in renderer, 'water volume and depth are explicit layers'
assert 'drawReef' in renderer and 'drawKelp' in renderer and 'drawSchool' in renderer, 'habitat growth is visible beyond focal animals'
assert 'bezierCurveTo' in renderer and 'createLinearGradient' in renderer, 'organic silhouettes and continuous shading replace triangle primitives'
for family in ['whale','manta','hammerhead','turtle','jelly','octopus','seahorse']:
    assert f"'{family}'" in renderer, f'{family} must have a distinct silhouette path'
assert 'https://' not in renderer, 'v0.6 renderer must not introduce external runtime requests'
print('Ocean cinematic v0.6 renderer contract passed')
