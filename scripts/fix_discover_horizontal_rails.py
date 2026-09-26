from pathlib import Path

path = Path("discover.html")
text = path.read_text(encoding="utf-8")

old_top = ':root{--bg:#090909;--panel:#131313;--line:#292929;--text:#f4f2ed;--muted:#9398a1;--red:#e54848}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Yu Gothic",sans-serif}'
new_top = ':root{--bg:#090909;--panel:#131313;--line:#292929;--text:#f4f2ed;--muted:#9398a1;--red:#e54848}*{box-sizing:border-box}html,body{max-width:100%;overflow-x:hidden}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Yu Gothic",sans-serif}'

old_primary = '.presetShelfGrid{display:flex!important;grid-template-columns:none!important;gap:9px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;padding:2px 1px 9px;scrollbar-width:none;-webkit-overflow-scrolling:touch}.presetShelfGrid::-webkit-scrollbar{display:none}.presetCard{flex:0 0 92px;width:92px;max-width:92px;scroll-snap-align:start;padding:0;text-align:left;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#111;color:inherit;cursor:pointer}'
new_primary = '/* canonical recommendation rail */\n.presetShelfGrid{display:flex!important;flex-wrap:nowrap!important;grid-template-columns:none!important;width:100%;max-width:100%;min-width:0;gap:9px;overflow-x:auto!important;overflow-y:hidden!important;overscroll-behavior-x:contain;touch-action:pan-x;scroll-snap-type:x proximity;padding:2px 1px 10px;scrollbar-width:none;-webkit-overflow-scrolling:touch}.presetShelfGrid::-webkit-scrollbar{display:none}.presetCard{display:block;flex:0 0 92px;width:92px;min-width:92px;max-width:92px;scroll-snap-align:start;padding:0;text-align:left;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#111;color:inherit;cursor:pointer}'

old_override = '''/* recommendation rail hard lock */
.popularShelves,.popularShelves .presetShelf{min-width:0;max-width:100%;overflow:hidden}
.popularShelves .presetShelfGrid{display:flex!important;flex-wrap:nowrap!important;grid-template-columns:none!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:auto!important;overflow-y:hidden!important;overscroll-behavior-x:contain;touch-action:pan-x;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;padding:2px 1px 10px!important}
.popularShelves .presetCard{display:block!important;flex:0 0 92px!important;width:92px!important;min-width:92px!important;max-width:92px!important;scroll-snap-align:start}
@media(max-width:650px){.popularShelves .presetCard{flex-basis:84px!important;width:84px!important;min-width:84px!important;max-width:84px!important}}
'''
new_override = '''.popularShelves,.popularShelves .presetShelf{min-width:0;max-width:100%;overflow:hidden}
@media(max-width:650px){.presetCard{flex-basis:84px;width:84px;min-width:84px;max-width:84px}}
'''

for old, new, label in [
    (old_top, new_top, "page overflow guard"),
    (old_primary, new_primary, "canonical rail"),
    (old_override, new_override, "duplicate override removal"),
]:
    if old not in text:
        raise SystemExit(f"anchor not found: {label}")
    text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")
print("normalized discover recommendation rails")
