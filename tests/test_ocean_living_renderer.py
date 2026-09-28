from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
immersive = (ROOT / 'preview/ocean/js/ocean-immersive.js').read_text(encoding='utf-8')
renderer = (ROOT / 'preview/ocean/js/ocean-3d.js').read_text(encoding='utf-8')
geometry = json.loads((ROOT / 'preview/ocean/assets/bsd/SmallFishA.json').read_text(encoding='utf-8'))

assert 'CinemapOceanEcosystem.build' in immersive, 'Ocean keeps the deterministic ecosystem domain model'
assert "VERSION='0.7.0'" in immersive and "CACHE='8'" in immersive, 'Ocean exposes the v0.7.0 build marker/cache key'
assert 'CinemapOcean3D.mount' in immersive and 'ocean-3d.js' in immersive, 'immersive Ocean mounts the textured WebGL2 renderer'
assert "getContext('webgl2'" in renderer, 'Ocean uses WebGL2 for real 3D geometry'
assert 'SmallFishA.json' in renderer and 'smallfish.webp' in renderer, 'renderer loads locally vendored fish geometry and texture'
assert 'devicePixelRatio' in renderer and 'Math.min(2' in renderer, 'iPhone render resolution is bounded'
assert 'requestAnimationFrame(draw)' in renderer, 'Ocean uses one realtime frame loop'
assert 'camera.x=clamp' in renderer and 'camera.y=clamp' in renderer, 'one-finger travel covers a broad bounded world'
assert 'uBend' in renderer and 'tail*tail' in renderer, 'fish bodies animate through mesh deformation rather than moving rigid cutouts'
assert 'rays' in renderer and 'fog' in renderer, 'water atmosphere is shader-driven'
assert len(geometry['position']) > 300 and len(geometry['normal']) == len(geometry['position']), 'vendored fish is real mesh geometry'
assert (ROOT / 'preview/ocean/assets/bsd/LICENSE-WebGLSamples.txt').exists(), 'BSD license is retained with vendored assets'
assert 'https://' not in renderer and 'http://' not in renderer, 'renderer introduces no external runtime requests'
assert 'cosmosHalo' not in renderer and 'fish-atlas' not in renderer, 'rejected halo/sprite treatments stay absent'
print('Ocean textured WebGL2 v0.7.0 renderer contract passed')
