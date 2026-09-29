#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]
html=(root/'preview/ocean/real-fish/index.html').read_text()
manifest=json.loads((root/'preview/ocean/real-fish/asset-manifest.json').read_text())
errors=[]
if 'fish.jpg' not in html: errors.append('missing fish.jpg reference')
if re.search(r'<canvas|ellipse\(|bezierCurveTo\(',html): errors.append('procedural/vector primitive found')
if 'requestAnimationFrame' not in html or 'translate3d' not in html: errors.append('smooth-motion instrumentation missing')
if manifest['runtimeExternalRequests'] != 0: errors.append('runtime external requests must be zero')
if manifest['acceptance']['fpsMedianMinimum'] < 50: errors.append('FPS floor below 50')
asset=root/'preview/ocean/real-fish/fish.jpg'
if not asset.exists() or asset.stat().st_size < 10000: errors.append('real-fish raster asset missing or implausibly small')
if errors:
 print('\n'.join(errors),file=sys.stderr);sys.exit(1)
print('REAL FISH POC STATIC GATE PASSED')
