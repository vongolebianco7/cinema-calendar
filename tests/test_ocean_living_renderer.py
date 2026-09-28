from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
immersive = (ROOT / 'preview/ocean/js/ocean-immersive.js').read_text(encoding='utf-8')
css = (ROOT / 'preview/ocean/js/ocean-living.css').read_text(encoding='utf-8')

assert 'CinemapOceanEcosystem.build' in immersive, 'renderer must consume the ecosystem scene model'
assert 'oceanReefArt' in immersive, 'renderer must render the authored/generated reef as habitat'
assert 'growth-reef-mobile.webp' in css and 'growth-reef.webp' in css, 'reef art must support mobile and desktop'
assert '--w:' in immersive and 'var(--w)' in css, 'organism size must come from per-organism scene traits'
assert 'Math.min(6' not in immersive, 'renderer should consume bounded school count from the scene model'
assert 'https://' not in css, 'living Ocean CSS must not introduce external asset requests'
print('Living Ocean renderer contract passed')
