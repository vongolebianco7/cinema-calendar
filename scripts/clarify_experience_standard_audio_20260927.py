from pathlib import Path

p = Path('experience.html')
text = p.read_text(encoding='utf-8')

old_head = '<div class="sectionHead"><h2>音響</h2><p>通常5.1/7.1ch、IMAX 12ch、Dolby Atmosを比較。Atmosは高さ方向を含む立体的な配置がポイントです。</p></div>'
new_head = '<div class="sectionHead"><h2>音響</h2><p>多くの通常上映で使われる5.1ch / 7.1ch、IMAX 12ch、Dolby Atmosを比較。Atmosは高さ方向を含む立体的な配置がポイントです。劇場やスクリーンによって構成は異なります。</p></div>'
if old_head not in text:
    raise SystemExit('audio section head not found')
text = text.replace(old_head, new_head, 1)

old_card = '<article class="audioCard"><div class="audioTop"><h3>5.1 / 7.1ch</h3><span>水平リング</span></div>'
new_card = '<article class="audioCard"><div class="audioTop"><h3>一般的な通常上映（5.1 / 7.1ch）</h3><span>水平リング</span></div>'
if old_card not in text:
    raise SystemExit('standard audio card not found')
text = text.replace(old_card, new_card, 1)

p.write_text(text, encoding='utf-8')
