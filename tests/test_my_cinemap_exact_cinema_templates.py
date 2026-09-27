from pathlib import Path

art_direction = Path('js/my-cinemap-art-direction.js').read_text(encoding='utf-8')
renderer = Path('js/my-cinemap-cinema-templates.js')

required_ui = [
    "data-theme=\"cinema-projector\"",
    "data-theme=\"cinema-theater\"",
    "data-theme=\"cinema-artdeco\"",
    "data-theme=\"cinema-archive\"",
    "data-theme=\"cinema-screening\"",
    "#list{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))",
]
missing_ui = [token for token in required_ui if token not in art_direction]
if missing_ui:
    raise SystemExit(f'exact cinema template UI / compact two-column ranking list missing: {missing_ui}')

for forbidden in ['mountCinemaBackgroundPicker', 'cinemaBackgroundField', "CINEMA_BG_KEY='cinemap-my-cinema-background'", '映画背景（オプション）']:
    if forbidden in art_direction:
        raise SystemExit(f'legacy cinema background option still exposed: {forbidden}')

if not renderer.exists():
    raise SystemExit('exact cinema template renderer missing')
renderer_text = renderer.read_text(encoding='utf-8')

assets = [
    'assets/105DE5C4-9F65-41AF-A72F-0731A88CA8E6.png',
    'assets/309A0142-0B8A-4070-A341-63A2446D0CBE.png',
    'assets/48E0565E-2BBD-45A0-B6C9-A3A554976D0D.png',
    'assets/99AFA977-5A97-4544-A7AD-60E16A93F874.png',
    'assets/AB933939-93EB-43D6-814A-C60BE58B42F6.png',
]
for asset in assets:
    path = Path(asset)
    if not path.exists() or path.stat().st_size < 100_000:
        raise SystemExit(f'uploaded cinema template asset missing: {asset}')
    if asset not in renderer_text and asset not in art_direction:
        raise SystemExit(f'uploaded cinema template asset is not used: {asset}')

for required in ['originalDrawArtwork', 'drawImageCover', 'cinemaTemplates', "theme.startsWith('cinema-')"]:
    if required not in renderer_text:
        raise SystemExit(f'exact cinema template renderer incomplete: {required}')

print('Exact uploaded cinema templates, no background-option UI, and two-column selected ranking list passed')
