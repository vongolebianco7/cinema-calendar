from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
immersive = (ROOT / 'preview/ocean/js/ocean-immersive.js').read_text(encoding='utf-8')
renderer = (ROOT / 'preview/ocean/js/ocean-webgl.js').read_text(encoding='utf-8')
scene = (ROOT / 'preview/ocean/js/ocean-scene.js').read_text(encoding='utf-8')
camera = (ROOT / 'preview/ocean/js/ocean-camera.js').read_text(encoding='utf-8')
shaders = (ROOT / 'preview/ocean/js/ocean-shaders.js').read_text(encoding='utf-8')

assert 'CinemapOceanEcosystem.build' in immersive, 'v0.5 must keep the deterministic ecosystem domain model'
assert "VERSION='0.5.0'" in immersive, 'Ocean must expose a visible v0.5.0 build marker'
assert "CACHE='5'" in immersive, 'renderer modules must share a v0.5 cache key'
assert 'CinemapOceanWebGL.mount' in immersive, 'immersive Ocean must mount the WebGL renderer'
assert "getContext('webgl2'" in renderer, 'primary Ocean renderer must use native WebGL2'
assert 'requestAnimationFrame(frame)' in renderer, 'Ocean uses one realtime frame loop'
assert 'devicePixelRatio' in renderer and 'Math.min(1.5' in renderer, 'iPhone render resolution must be bounded'
assert 'showFallback' in renderer and 'webglcontextlost' in renderer, 'WebGL failure/context loss must fail gracefully'
assert 'fish-atlas' not in renderer and 'creatures-' not in renderer, 'primary renderer must not return to sprite-atlas fish'
assert 'cosmosHalo' not in immersive and 'oceanBubbles' not in immersive, 'primary v0.5 DOM must not create soap-bubble/halo treatment'
assert 'world={width:44,height:16,depth:34}' in scene, 'Ocean must be a materially large continuous world'
assert 'large<2' in scene, 'megafauna must remain rare'
assert 'particleCount' in scene, 'sparse suspended particulate is part of the 3D volume'
assert 'overviewDistance:28' in camera and 'x:18' in camera and 'y:8' in camera, 'initial overview and travel bounds must be wide'
assert "mode:'overview'" in camera, 'first camera state must be overview'
assert 'dragDistance<8' in camera, 'drag must not accidentally become organism selection'
assert 'uFogColor' in shaders and 'caustic' in shaders, 'underwater depth fog and caustic light belong to the shader'
assert 'https://' not in renderer and 'https://' not in scene and 'https://' not in shaders, 'v0.5 renderer must not introduce external runtime requests'
print('Ocean WebGL v0.5 renderer contract passed')
