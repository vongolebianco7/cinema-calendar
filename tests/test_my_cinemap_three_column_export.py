from pathlib import Path
import subprocess

html = Path("my-cinemap.html").read_text(encoding="utf-8")
script_path = Path("js/cinelva-share-image.js")
script = script_path.read_text(encoding="utf-8")
result = subprocess.run(["node", "--check", str(script_path)], capture_output=True, text=True)
if result.returncode:
    raise SystemExit(f"Cinelva image export syntax failed:\n{result.stderr}")

for required in ["鑑賞実績の共有画像", "生涯", "id=\"art\"", "id=\"save\"", "id=\"share\"", "js/cinelva-library-records.js", "js/cinelva-share-image.js"]:
    if required not in html:
        raise SystemExit(f"Viewing-record share page missing: {required}")
for required in ["records.all()", "canvas.toBlob", "crossOrigin = 'anonymous'", "navigator.share", "render(false)"]:
    if required not in script:
        raise SystemExit(f"Viewing-record image export missing: {required}")
for forbidden in ["cinemap-my-list", "picks.splice", "候補に追加", "自分でつくる映画棚"]:
    if forbidden in html + script:
        raise SystemExit(f"Manual shelf UI or storage remains in share image flow: {forbidden}")

print("Cinelva viewing-record PNG and share export passed")
