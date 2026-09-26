from pathlib import Path

forbidden = [
    'cinema-calendar-three.vercel.app',
    'cinema-calendar-vongole1.vercel.app',
    'cinema-calendar-git-main-vongole1.vercel.app',
]
files = list(Path('.').glob('*.html')) + list(Path('js').rglob('*.js'))
hits = []
for path in files:
    text = path.read_text(encoding='utf-8')
    for domain in forbidden:
        if domain in text:
            hits.append(f'{path}: {domain}')
if hits:
    raise SystemExit('legacy frontend domains remain:\n' + '\n'.join(hits))
print('no legacy frontend domains in user-facing HTML/JS')
