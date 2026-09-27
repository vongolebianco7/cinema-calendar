from pathlib import Path
s=Path('index.html').read_text()
def test_fast_first_paint_exists():
    assert 'async function fastInitialCalendarPaint()' in s
    assert 'fetch("data/movies.json",{cache:"force-cache"})' in s
    boot=s.index('async function boot()')
    fast=s.index('await fastInitialCalendarPaint()',boot)
    heavy=s.index('Promise.all([',boot)
    assert fast < heavy
