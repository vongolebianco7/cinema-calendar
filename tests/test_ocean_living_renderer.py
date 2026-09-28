from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
immersive=(ROOT/'preview/ocean/js/ocean-immersive.js').read_text(encoding='utf-8')
renderer=(ROOT/'preview/ocean/js/ocean-v8.js').read_text(encoding='utf-8')
geometry=json.loads((ROOT/'preview/ocean/assets/bsd/SmallFishA.json').read_text(encoding='utf-8'))
assert 'CinemapOceanEcosystem.build' in immersive
assert "VERSION='0.8.0'" in immersive and "CACHE='9'" in immersive
assert 'CinemapOceanV8.mount' in immersive and 'ocean-v8.js' in immersive
assert "getContext('webgl2'" in renderer
assert 'SmallFishA.json' in renderer and 'smallfish.webp' in renderer
assert 'ocean-cinematic-bg.webp' in renderer and (ROOT/'preview/ocean/assets/generated/ocean-cinematic-bg.webp').exists()
assert 'devicePixelRatio' in renderer and 'Math.min(2' in renderer
assert 'requestAnimationFrame(draw)' in renderer and 'cam.x=clamp' in renderer and 'cam.y=clamp' in renderer
assert 'tail*tail' in renderer and 'population=clamp' in renderer and 'org.length' in renderer
assert len(geometry['position'])>300 and len(geometry['normal'])==len(geometry['position'])
assert (ROOT/'preview/ocean/assets/bsd/LICENSE-WebGLSamples.txt').exists()
assert 'https://' not in renderer and 'http://' not in renderer
assert 'cosmosHalo' not in renderer and 'fish-atlas' not in renderer
print('Ocean cinematic WebGL2 v0.8.0 renderer contract passed')
