from pathlib import Path
import re, sys

TEST = r'''from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'my-cinemap.html').read_text(encoding='utf-8')
TOOLS=(ROOT/'js/my-cinemap-tools.js').read_text(encoding='utf-8')
ART=(ROOT/'js/my-cinemap-art.js').read_text(encoding='utf-8')

def test_template_cards_show_layout_content():
    assert HTML.count('class="previewRanks"') >= 4
    assert HTML.count('class="previewRank') >= 12

def test_poster_toggle_removed_and_selected_ranking_keeps_posters():
    assert 'id="posterMode"' not in HTML
    assert 'syncPosterPreview' not in TOOLS
    assert 'posterPreviewOff' not in TOOLS
    assert 'posterPreviewOn' not in TOOLS
    assert "m.poster?'<img src=\"'+E(m.poster)+'\">'" in HTML

def test_large_font_has_scaled_fit_floor():
    assert "const fontScale={small:1,medium:1.18,large:1.36}" in ART
    assert "(columns===2?21:24)*fontScale" in ART
    assert "16*fontScale" in ART

def test_first_font_option_editorial_is_removed():
    assert 'value="editorial"' not in HTML
    assert "editorial:{" not in ART
    assert "||'modern'" in ART
'''

def prepare_test():
    Path('tests/test_my_cinemap_followup.py').write_text(TEST,encoding='utf-8')

def apply():
    hp=Path('my-cinemap.html'); tp=Path('js/my-cinemap-tools.js'); ap=Path('js/my-cinemap-art.js')
    html=hp.read_text(encoding='utf-8'); tools=tp.read_text(encoding='utf-8'); art=ap.read_text(encoding='utf-8')

    # 1) Template thumbnails: show an actual miniature ranking composition.
    preview_inner='<span class="previewTitle">MY TOP</span><span class="previewRule"></span><span class="previewRanks"><span class="previewRank medal"><b>1</b><i></i></span><span class="previewRank medal"><b>2</b><i></i></span><span class="previewRank medal"><b>3</b><i></i></span></span><span class="previewLogo">Cinemap</span>'
    html=re.sub(r'<span class="templatePreview (preview(?:Minimal|Noir|Burgundy|BlueGray))" aria-hidden="true"></span>', lambda m:f'<span class="templatePreview {m.group(1)}" aria-hidden="true">{preview_inner}</span>', html)

    # 2) Remove poster toggle; ranking selection itself always shows poster when available.
    html=re.sub(r'<label>画面内ポスター<select id="posterMode">[\s\S]*?</select></label>', '', html)
    html=html.replace(',posterMode:document.getElementById("posterMode").value','')
    html=re.sub(r'if\(s\.posterMode\)document\.getElementById\("posterMode"\)\.value=s\.posterMode;','',html)
    html=html.replace('["format","layout","fontSize","posterMode"]','["format","layout","fontSize"]')
    tools=re.sub(r"\s*const syncPosterPreview=\(\)=>\{[^\n]+\};",'',tools)
    tools=tools.replace('function enhanceList(){syncPosterPreview();','function enhanceList(){')
    tools=re.sub(r"\s*document\.getElementById\('posterMode'\)\?\.addEventListener\('change',syncPosterPreview\);\s*syncPosterPreview\(\);",'',tools)
    tools=re.sub(r'\.posterPreviewOff[^}]+}\s*','',tools)
    tools=re.sub(r'\.posterPreviewOn[^}]+}\s*','',tools)

    # 3) Large font: scale the fit floor too, so long titles do not collapse back to small.
    art=art.replace('nameSize,columns===2?21:24,font.movie', 'nameSize,(columns===2?21:24)*fontScale,font.movie')
    art=art.replace('(columns===2?doubleMetaSize:singleMetaSize)*fontScale,16,artSans', '(columns===2?doubleMetaSize:singleMetaSize)*fontScale,16*fontScale,artSans')

    # 4) Remove first font option (editorial) and make modern the fallback/default.
    html=re.sub(r'<option value="editorial"[^>]*>[^<]*</option>','',html)
    tools=re.sub(r'<option value=["\']editorial["\'][^>]*>[^<]*</option>','',tools)
    art=re.sub(r'\s*editorial:\{title:artDisplay,movie:artBodySerif,titleWeight:500,movieWeight:600\},','',art)
    art=art.replace("artValue('fontStyle')||'editorial'", "artValue('fontStyle')||'modern'")
    art=art.replace("fontKey==='editorial'?", "fontKey==='modern'?")

    # Cache refresh.
    html=re.sub(r'js/my-cinemap-art\.js\?v=[^"<]+','js/my-cinemap-art.js?v=20260927-my-cinemap-followup-v12',html)
    html=re.sub(r'js/my-cinemap-tools\.js\?v=[^"<]+','js/my-cinemap-tools.js?v=20260927-my-cinemap-followup-v12',html)

    hp.write_text(html,encoding='utf-8'); tp.write_text(tools,encoding='utf-8'); ap.write_text(art,encoding='utf-8')

if __name__=='__main__':
    mode=sys.argv[1] if len(sys.argv)>1 else ''
    {'prepare-test':prepare_test,'apply':apply}.get(mode,lambda:(_ for _ in ()).throw(SystemExit('usage: prepare-test|apply')))()
