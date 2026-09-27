from pathlib import Path

ui = Path('js/my-cinemap-art-direction.js').read_text(encoding='utf-8')
renderer = Path('js/my-cinemap-cinema-templates.js').read_text(encoding='utf-8')

required_ui = [
    '#list .compactMovieItem:nth-child(-n+5){grid-column:1!important}',
    '#list .compactMovieItem:nth-child(n+6){grid-column:2!important}',
    '#list .compactMovieItem:nth-child(6){grid-row:1!important}',
    'overflow-wrap:break-word!important',
    'writing-mode:horizontal-tb!important',
]
missing_ui = [token for token in required_ui if token not in ui]
if missing_ui:
    raise SystemExit(f'My Cinemap mobile two-column layout missing: {missing_ui}')

required_contrast = [
    'function drawContentScrim',
    'drawContentScrim(ctx,w,h,p,listTop,listBottom,columns)',
]
missing_contrast = [token for token in required_contrast if token not in renderer]
if missing_contrast:
    raise SystemExit(f'My Cinemap cinema-template contrast protection missing: {missing_contrast}')

print('My Cinemap mobile ranking columns and cinema-template text contrast passed')
