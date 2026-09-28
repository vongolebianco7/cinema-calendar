from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
immersive=(ROOT/'preview/ocean/js/ocean-immersive.js').read_text();renderer=(ROOT/'preview/ocean/js/ocean-webgl.js').read_text();scene=(ROOT/'preview/ocean/js/ocean-scene.js').read_text();camera=(ROOT/'preview/ocean/js/ocean-camera.js').read_text();shaders=(ROOT/'preview/ocean/js/ocean-shaders.js').read_text();geometry=(ROOT/'preview/ocean/js/ocean-geometry.js').read_text()
assert 'CinemapOceanEcosystem.build' in immersive and "VERSION='0.5.0'" in immersive and "CACHE='5'" in immersive
assert 'CinemapOceanWebGL.mount' in immersive and "getContext('webgl2'" in renderer and 'requestAnimationFrame(frame)' in renderer
assert 'devicePixelRatio' in renderer and 'Math.min(1.5' in renderer and 'showFallback' in renderer and 'webglcontextlost' in renderer
assert 'fish-atlas' not in renderer and 'creatures-' not in renderer and 'cosmosHalo' not in immersive and 'oceanBubbles' not in immersive
assert 'world={width:44,height:16,depth:34}' in scene and 'large<2' in scene and 'particleCount' in scene
assert 'overviewDistance:56' in camera and 'maxDistance:70' in camera and 'minDistance:14' in camera and 'x:18' in camera and 'y:8' in camera
assert "mode:'overview'" in camera and 'dragDistance<8' in camera
assert 'uFogColor' in shaders and 'caustic' in shaders and 'function coral()' in geometry and 'geo.coral()' in renderer
assert 'viewMatrix(camera)' in renderer and 'cross([0,1,0],z)' in renderer
assert 'https://' not in renderer and 'https://' not in scene and 'https://' not in shaders
print('Ocean WebGL v0.5 renderer contract passed')
