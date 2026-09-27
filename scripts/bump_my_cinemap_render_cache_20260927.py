from pathlib import Path
p=Path('my-cinemap.html')
s=p.read_text(encoding='utf-8')
old='js/my-cinemap-art.js?v=20260927-my-cinemap-followup-v12'
new='js/my-cinemap-art.js?v=20260927-my-cinemap-renderfix-v13'
if old in s:
    s=s.replace(old,new)
elif new not in s:
    raise SystemExit('expected My Cinemap art script reference not found')
p.write_text(s,encoding='utf-8')
