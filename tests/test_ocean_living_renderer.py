from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
renderer_root=ROOT/'preview/ocean/renderer'
main=(renderer_root/'src/main.js').read_text(encoding='utf-8')
environment=(renderer_root/'src/environment.js').read_text(encoding='utf-8')
assets=(renderer_root/'src/asset-world.js').read_text(encoding='utf-8')
policy=(renderer_root/'src/runtime-policy.js').read_text(encoding='utf-8')
pkg=json.loads((renderer_root/'package.json').read_text(encoding='utf-8'))
licenses=json.loads((renderer_root/'assets/licenses.json').read_text(encoding='utf-8'))
notices=(renderer_root/'THIRD_PARTY_NOTICES.md').read_text(encoding='utf-8')
assert pkg['dependencies']['three']=='0.185.1'
assert 'WebGLRenderer' in main and 'ACESFilmicToneMapping' in main and 'createAssetWorld' in main
assert 'FogExp2' in environment and 'ShaderMaterial' in environment and 'AdditiveBlending' in environment
assert 'GLTFLoader' in assets and 'DRACOLoader' in assets and 'SkeletonUtils' in assets
for name in ('whale','manta','shark','angler','clownfish','butterflyfish','swordfish'):
    assert name in assets or (renderer_root/'assets/creatures'/f'{name}.glb').exists()
for path in list((renderer_root/'assets/creatures').glob('*.glb'))+list((renderer_root/'assets/habitat').glob('*.glb')):
    assert path.read_bytes()[:4]==b'glTF'
assert len(licenses['assets'])>=6
assert "network:'local-only'" in policy and 'externalAssets:false' in policy
assert 'Three.js' in notices and 'MIT' in notices and 'CC0' in notices
for text in (main,environment,assets,policy):
    assert 'https://' not in text and 'http://' not in text
    assert 'posthog' not in text.lower()
print('Ocean vendored-asset Three.js renderer contract passed')
