from pathlib import Path
import re
import subprocess
import tempfile

REPLACEMENT = '''function theaterScheduleHtml(m){
 // theater-official-links-v1
 const q=encodeURIComponent(((m&&m.title)||"")+" 上映時間 映画館");
 const links=[
  ["TOHOシネマズ","https://www.tohotheater.jp/"],
  ["イオンシネマ","https://www.aeoncinema.com/"],
  ["ユナイテッド・シネマ","https://www.unitedcinemas.jp/"],
  ["MOVIX／ピカデリー","https://www.smt-cinema.com/"],
  ["T・ジョイ","https://tjoy.jp/"],
  ["109シネマズ","https://109cinemas.net/"],
  ["作品名で上映館を検索","https://www.google.com/search?q="+q]
 ];
 const items=links.map(function(x){return '<a href="'+x[1]+'" target="_blank" rel="noopener noreferrer">'+esc(x[0])+'</a>'}).join('');
 return '<div class="theaterOfficialOnly"><p class="small">Cinemap内では一部劇場だけの上映時刻は表示していません。</p><strong>上映時間を公式サイトで確認</strong><div class="links">'+items+'</div></div>';
}'''

changed = []
for name in ("index.html", "search.html"):
    path = Path(name)
    text = path.read_text(encoding="utf-8")
    if "function theaterScheduleHtml(m)" not in text:
        continue
    pattern = r"function theaterScheduleHtml\(m\)\{.*?(?=\nfunction [A-Za-z_$])"
    new, count = re.subn(pattern, REPLACEMENT + "\n", text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"could not replace theaterScheduleHtml in {name}")
    path.write_text(new, encoding="utf-8")
    changed.append(path)

if not changed:
    raise SystemExit("no theaterScheduleHtml implementation found")

for path in changed:
    text = path.read_text(encoding="utf-8")
    for js in re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", text, re.S | re.I):
        if not js.strip():
            continue
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
            f.write(js)
            tmp = f.name
        subprocess.run(["node", "--check", tmp], check=True)
    print(f"updated and syntax-checked {path}")
