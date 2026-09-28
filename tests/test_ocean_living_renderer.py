from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
immersive=(ROOT/'preview/ocean/js/ocean-immersive.js').read_text(encoding='utf-8')
renderer=(ROOT/'preview/ocean/js/ocean-v8.js').read_text(encoding='utf-8')
geometry=json.loads((ROOT/'preview/ocean/assets/bsd/SmallFishA.json').read_text(encoding='utf-8'))
habitat=ROOT/'preview/ocean/assets/cc0/great-barrier-reef-06.jpg'
license_file=ROOT/'preview/ocean/assets/cc0/LICENSE-Great-Barrier-Reef-06.txt'
assert 'CinemapOceanEcosystem.build' in immersive
assert "VERSION='0.9.0'" in immersive and "CACHE='11'" in immersive
assert 'CinemapOceanV8.mount' in immersive and 'ocean-v8.js' in immersive
assert "getContext('webgl2'" in renderer
assert 'SmallFishA.json' in renderer and 'smallfish.webp' in renderer
assert 'assets/cc0/great-barrier-reef-06.jpg' in renderer
assert 'ocean-cinematic-bg.webp' not in renderer
assert habitat.exists() and habitat.stat().st_size>50000
assert license_file.exists() and 'CC0 1.0' in license_file.read_text(encoding='utf-8')
assert 'devicePixelRatio' in renderer and 'Math.min(2' in renderer
assert 'requestAnimationFrame(draw)' in renderer and 'cam.x=clamp' in renderer and 'cam.y=clamp' in renderer
assert 'tail*tail' in renderer and 'population=clamp' in renderer and 'org.length' in renderer
assert len(geometry['position'])>300 and len(geometry['normal'])==len(geometry['position'])
assert (ROOT/'preview/ocean/assets/bsd/LICENSE-WebGLSamples.txt').exists()
assert 'https://' not in renderer and 'http://' not in renderer
assert 'cosmosHalo' not in renderer and 'fish-atlas' not in renderer and 'bubble' not in renderer
print('Ocean asset-led WebGL2 v0.9.0 renderer contract passed')
