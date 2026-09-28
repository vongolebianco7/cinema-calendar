from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
immersive = (ROOT / 'preview/ocean/js/ocean-immersive.js').read_text(encoding='utf-8')
css = (ROOT / 'preview/ocean/js/ocean-living.css').read_text(encoding='utf-8')

assert 'CinemapOceanEcosystem.build' in immersive, 'renderer must consume the ecosystem scene model'
assert 'oceanReefArt' in immersive, 'renderer must render the authored/generated reef as habitat'
assert 'growth-reef-mobile.webp' in css and 'growth-reef.webp' in css, 'reef art must support mobile and desktop'
assert 'o.visualScale' in immersive and '--w:' in immersive and 'width:var(--w)' in css, 'organism size must come from ecological scale rather than one shared clamp'
assert 'Math.min(6' not in immersive, 'renderer should consume bounded school count from the scene model'
assert 'o.atlas===0?3:4' in immersive, 'the 3x2 fish atlas and 4x3 creature atlases need different cell grids'
assert 'background-size:300% 200%' in css, 'fish atlas must use its native 3x2 grid to avoid clipped creatures'
assert 'oceanMotion-' in immersive and '.oceanMotion-grounded' in css and '.oceanMotion-cruise' in css, 'ecological roles must not share one swimming animation'
assert 'oceanAmbientSchool' in immersive and '.oceanAmbientSchool i' in css, 'mature abundance should include composed schools, not only isolated icons'
assert 'oceanAnimal::after' in css and 'mix-blend-mode:soft-light' in css, 'organisms need a shared water-light veil so sprites feel submerged rather than pasted on top'
assert 'oceanDepthFar::after' in css and 'oceanDepthNear::after' in css, 'water-light integration must vary with depth instead of applying one flat sprite treatment'
assert 'oceanAnimal{mix-blend-mode:normal' in css, 'organism silhouettes must remain readable while their lighting veil blends into the water'
assert 'https://' not in css, 'living Ocean CSS must not introduce external asset requests'
print('Living Ocean renderer contract passed')
