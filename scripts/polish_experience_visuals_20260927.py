from pathlib import Path

p = Path('experience.html')
text = p.read_text(encoding='utf-8')

# Preload the three special-format assets used below the fold so iPhone does not wait
# until the card is painted before starting the requests.
preloads = '''<link rel="preload" as="image" href="assets/8897F0A1-FC35-4609-A239-1C800BF9EAE9.png?v=0424">\n<link rel="preload" as="image" href="assets/887F3A99-0D56-4E3F-9754-859B5C27E764.png?v=0432">\n<link rel="preload" as="image" href="assets/cinemap-experience.png?v=0420">\n'''
if 'assets/8897F0A1-FC35-4609-A239-1C800BF9EAE9.png?v=0424">' not in text.split('</head>', 1)[0]:
    marker = '<meta name="theme-color" content="#0a0c0f">\n'
    if marker not in text:
        raise SystemExit('theme-color marker not found')
    text = text.replace(marker, marker + preloads, 1)

# Be explicit that the normal-screening frame in this comparison is the scope case,
# without claiming every standard screening is always 2.39:1.
old = '<div class="sectionHead"><h2>見える範囲</h2><p>同じ1枚の1.43:1画像を、横幅を変えずに上下だけ中央クロップして比較します。</p></div>'
new = '<div class="sectionHead"><h2>見える範囲</h2><p>この比較では通常上映をシネマスコープ（2.39:1）として表示。同じ1枚の1.43:1画像を、横幅を変えずに上下だけ中央クロップして比較します。</p></div>'
if old in text:
    text = text.replace(old, new, 1)
elif 'この比較では通常上映をシネマスコープ（2.39:1）として表示' not in text:
    raise SystemExit('aspect section intro not found')

# Dolby Cinema uses Dolby Atmos for its cinema-audio component. Make that relationship
# visible in the heading and expose both useful theater filters.
old = '<div class="audioTop"><h3>Dolby Atmos</h3><span>3Dオブジェクト</span></div>'
new = '<div class="audioTop"><h3>Dolby Atmos <small>Dolby Cinema</small></h3><span>3Dオブジェクト</span></div>'
if old in text:
    text = text.replace(old, new, 1)
elif '<h3>Dolby Atmos <small>Dolby Cinema</small></h3>' not in text:
    raise SystemExit('Dolby Atmos heading not found')

old = '<p><b>点の音が3D空間を移動</b>。頭上を通過する音まで位置として表現。</p><a class="screenLink" href="theaters.html?format=Dolby%20Atmos">Dolby Atmos対応スクリーンを見る →</a>'
new = '<p><b>点の音が3D空間を移動</b>。頭上を通過する音まで位置として表現。Dolby Cinemaの音響もDolby Atmosです。</p><a class="screenLink" href="theaters.html?format=Dolby%20Atmos">Dolby Atmos対応スクリーンを見る →</a> <a class="screenLink" href="theaters.html?format=Dolby%20Cinema">Dolby Cinema対応スクリーンを見る →</a>'
if old in text:
    text = text.replace(old, new, 1)
elif 'Dolby Cinema対応スクリーンを見る →' not in text:
    raise SystemExit('Dolby Atmos card body not found')

# Improve legibility and motion cues without adding heavy JS or new assets.
polish = '''\n<style id="experience-polish-20260927">\n.audioTop h3 small{display:inline-block;margin-left:6px;padding:3px 6px;border:1px solid #8c61a8;border-radius:999px;color:#d7a0ff;font-size:9px;font-weight:800;vertical-align:middle;letter-spacing:.02em}\n.audio3d .horizontalRing,.audio3d .upperRing{border-width:3px!important;filter:drop-shadow(0 0 9px currentColor)!important;opacity:.9!important}\n.audio3d .horizontalRing{box-shadow:0 0 18px #46d9ff55,inset 0 0 12px #46d9ff22}\n.audio3d .upperRing{box-shadow:0 0 18px #9b6cff55,inset 0 0 12px #9b6cff22}\n.audio3d .atmosRoom .flightPath{border-top-width:3px!important;filter:drop-shadow(0 0 8px #d76cff)!important}\n.audio3d .atmosRoom .soundOrb{font-size:22px!important;text-shadow:0 0 18px #d76cff,0 0 8px #fff!important}\n.singleMotionScene .fxWind{opacity:.62!important;filter:blur(.6px) drop-shadow(0 0 5px #dff7ff)!important;animation-duration:4.3s!important}\n.singleMotionScene .fxWater{filter:drop-shadow(0 0 6px #bceeff)!important;animation-duration:4.7s!important}\n.singleMotionScene .fxFlash{mix-blend-mode:screen;animation-duration:7.2s!important}\n.singleMotionScene .fxAir{opacity:.82;filter:blur(2px) drop-shadow(0 0 7px #dff7ff)!important;animation-duration:2.5s!important}\n.motionCard .effectLegend span{border-color:#ffffff34!important;background:#0e141bcc!important;color:#edf4f8!important}\n@media(prefers-reduced-motion:reduce){.singleMotionScene .fxWind,.singleMotionScene .fxWater,.singleMotionScene .fxFlash,.singleMotionScene .fxAir{animation:none!important}}\n</style>\n'''
if 'experience-polish-20260927' not in text:
    if '</head>' not in text:
        raise SystemExit('head end not found')
    text = text.replace('</head>', polish + '</head>', 1)

p.write_text(text, encoding='utf-8')
