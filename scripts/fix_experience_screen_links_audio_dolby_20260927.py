from pathlib import Path

p = Path('experience.html')
text = p.read_text(encoding='utf-8')

repls = [
    (
        '<div class="ratioViewport ratio190" role="img" aria-label="IMAX1.90対1の海中シーン"></div>\n  </article>',
        '<div class="ratioViewport ratio190" role="img" aria-label="IMAX1.90対1の海中シーン"></div>\n   <a class="screenLink" href="theaters.html?format=IMAX">IMAX対応スクリーンを見る →</a>\n  </article>'
    ),
    (
        '<div class="ratioViewport ratio143" role="img" aria-label="IMAX GT1.43対1の海中シーン"></div>\n  </article>',
        '<div class="ratioViewport ratio143" role="img" aria-label="IMAX GT1.43対1の海中シーン"></div>\n   <a class="screenLink" href="theaters.html?format=IMAX%20GT">IMAX GT対応スクリーンを見る →</a>\n  </article>'
    ),
    (
        '<p><b>水平層＋高い位置の層</b>。上下を含む多方向から強く包む。</p></article>',
        '<p><b>水平層＋高い位置の層</b>。上下を含む多方向から強く包む。</p><a class="screenLink" href="theaters.html?format=IMAX">IMAX対応スクリーンを見る →</a></article>'
    ),
    (
        '<p><b>点の音が3D空間を移動</b>。頭上を通過する音まで位置として表現。</p><a class="screenLink" href="theaters.html?format=Dolby%20Atmos">Dolby Atmos対応スクリーンを見る →</a></article>',
        '<p><b>点の音が3D空間を移動</b>。頭上を通過する音まで位置として表現。</p><p class="dolbyCinemaNote"><b>Dolby Cinemaの音響もDolby Atmos</b>。映像はDolby Visionとの組み合わせです。</p><a class="screenLink" href="theaters.html?format=Dolby%20Atmos">Dolby Atmos対応スクリーンを見る →</a></article>'
    ),
]

for old, new in repls:
    if old not in text:
        raise SystemExit('anchor not found: ' + old[:80])
    text = text.replace(old, new, 1)

p.write_text(text, encoding='utf-8')
