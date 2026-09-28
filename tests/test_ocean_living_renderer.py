from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
immersive=(ROOT/'preview/ocean/js/ocean-immersive.js').read_text(encoding='utf-8')
renderer_root=ROOT/'preview/ocean/renderer'
main=(renderer_root/'src/main.js').read_text(encoding='utf-8')
environment=(renderer_root/'src/environment.js').read_text(encoding='utf-8')
creatures=(renderer_root/'src/creatures.js').read_text(encoding='utf-8')
policy=(renderer_root/'src/runtime-policy.js').read_text(encoding='utf-8')
pkg=json.loads((renderer_root/'package.json').read_text(encoding='utf-8'))
notices=(renderer_root/'THIRD_PARTY_NOTICES.md').read_text(encoding='utf-8')
assert 'CinemapOceanEcosystem.build' in immersive
assert pkg['dependencies']['three']=='0.185.1'
assert 'WebGLRenderer' in main and 'ACESFilmicToneMapping' in main
assert 'FogExp2' in environment and 'ShaderMaterial' in environment and 'AdditiveBlending' in environment
assert 'createCreatureSchool' in creatures and 'stepSchool' in creatures
assert "network:'local-only'" in policy and 'externalAssets:false' in policy
assert 'Three.js' in notices and 'MIT' in notices and 'forbiddenlink/ocean-simulator' in notices
for text in (main,environment,creatures,policy):
    assert 'https://' not in text and 'http://' not in text
    assert 'posthog' not in text.lower()
print('Ocean mature Three.js renderer contract passed')
