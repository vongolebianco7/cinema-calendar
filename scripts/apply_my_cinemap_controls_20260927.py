from pathlib import Path
import sys

TEST = r'''from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "my-cinemap.html").read_text(encoding="utf-8")
TOOLS = (ROOT / "js/my-cinemap-tools.js").read_text(encoding="utf-8")
ART = (ROOT / "js/my-cinemap-art.js").read_text(encoding="utf-8")
API = (ROOT / "backend/app/api/movie-detail/route.ts").read_text(encoding="utf-8")


def test_deep_dive_removed_from_my_cinemap():
    assert '>深掘る<' not in HTML


def test_removed_templates_are_absent():
    for token in ['Sage Museum', 'data-theme="sage"', 'Screen Room', 'data-theme="screenroom"']:
        assert token not in HTML


def test_templates_use_compact_three_column_grid():
    assert 'my-cinemap-compact-templates-v1' in HTML
    assert 'grid-template-columns:repeat(3,minmax(0,1fr))!important' in HTML


def test_font_size_control_has_small_medium_large_and_small_default():
    assert 'id="fontSize"' in HTML
    assert '<option value="small" selected>小</option>' in HTML
    assert '<option value="medium">中</option>' in HTML
    assert '<option value="large">大</option>' in HTML
    assert "fontScale" in ART
    assert "artValue('fontSize')" in ART


def test_preview_poster_toggle_exists_and_is_local_preview_only():
    assert 'id="posterMode"' in HTML
    assert '<option value="off" selected>表示しない</option>' in HTML
    assert '<option value="on">表示する</option>' in HTML
    assert 'posterPreviewOn' in TOOLS
    assert "posterMode" in TOOLS
    assert "drawImage(" not in ART


def test_overseas_director_uses_original_name_without_extra_person_request():
    assert 'director_original_name' in API
    assert 'director_is_japanese' in API
    assert 'director_original_name' in TOOLS
    assert 'director_is_japanese' in TOOLS
    assert '/person/' not in TOOLS
'''

FINAL_STYLE = r'''<style id="my-cinemap-compact-templates-v1">
.designPicker .themeChoices{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;overflow:visible!important;padding:0!important}
.themeChoice.premiumTheme{display:block!important;min-width:0!important;min-height:0!important;padding:5px!important;border-radius:9px!important;white-space:normal!important}
.themeChoice.premiumTheme .templatePreview{display:block!important;width:100%!important;height:72px!important;border-radius:6px!important;margin:0 0 5px!important;padding:6px!important}
.themeChoice.premiumTheme>span:last-child{display:block!important;padding:0!important}
.themeChoice.premiumTheme b{display:block;font:500 11px/1.15 Georgia,serif!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.themeChoice.premiumTheme small{display:none!important}
.premiumTheme.active:before{right:4px!important;top:4px!important;width:14px!important;height:14px!important;font-size:10px!important}
.previewControls{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 12px}.previewControls label{font-size:12px;color:#bbb}.previewControls select{margin-top:5px}
.posterPreviewOff .compactMovieItem>img{display:none!important}.posterPreviewOff .compactMovieItem{grid-template-columns:24px minmax(0,1fr) 66px!important}
@media(max-width:430px){.themeChoice.premiumTheme .templatePreview{height:58px!important}.themeChoice.premiumTheme b{font-size:9px!important}.designPicker{padding:9px!important}}
</style>'''


def prepare_test():
    Path('tests/test_my_cinemap_controls.py').write_text(TEST, encoding='utf-8')


def apply():
    html = Path('my-cinemap.html').read_text(encoding='utf-8')
    tools = Path('js/my-cinemap-tools.js').read_text(encoding='utf-8')
    art = Path('js/my-cinemap-art.js').read_text(encoding='utf-8')
    api = Path('backend/app/api/movie-detail/route.ts').read_text(encoding='utf-8')

    # Remove deep-dive link from the base ranking list.
    html = html.replace("<a href=\"critic.html?id='+encodeURIComponent(m.tmdbId||m.id||'')+'&search='+encodeURIComponent(m.title||'')+'\" style=\"font-size:10px;color:#aaa;text-decoration:none\">深掘る</a>", "")

    # Remove Sage Museum. Screen Room is removed defensively if it exists in older variants.
    import re
    html = re.sub(r'<button[^>]*data-theme="sage"[\s\S]*?</button>\s*', '', html)
    html = re.sub(r'<button[^>]*data-theme="screenroom"[\s\S]*?</button>\s*', '', html)
    html = html.replace('"minimal","noir","burgundy","sage","bluegray"', '"minimal","noir","burgundy","bluegray"')

    # Add font-size and poster-preview controls directly below export options.
    marker = '</div><div class="designPicker">'
    controls = '</div><div class="previewControls"><label>文字サイズ<select id="fontSize"><option value="small" selected>小</option><option value="medium">中</option><option value="large">大</option></select></label><label>画面内ポスター<select id="posterMode"><option value="off" selected>表示しない</option><option value="on">表示する</option></select></label></div><div class="designPicker">'
    if 'id="fontSize"' not in html:
        html = html.replace(marker, controls, 1)

    # Persist and restore the two new controls.
    html = html.replace('layout:document.getElementById("layout").value,savedAt:', 'layout:document.getElementById("layout").value,fontSize:document.getElementById("fontSize").value,posterMode:document.getElementById("posterMode").value,savedAt:')
    html = html.replace('if(s.format)document.getElementById("format").value=s.format;', 'if(s.format)document.getElementById("format").value=s.format;if(s.fontSize)document.getElementById("fontSize").value=s.fontSize;if(s.posterMode)document.getElementById("posterMode").value=s.posterMode;')
    html = html.replace('["format","layout"].forEach(id=>document.getElementById(id).onchange=render);', '["format","layout","fontSize","posterMode"].forEach(id=>document.getElementById(id).onchange=render);')

    if 'my-cinemap-compact-templates-v1' not in html:
        html = html.replace('</head>', FINAL_STYLE + '\n</head>', 1)

    # Force cache refresh for updated assets.
    html = re.sub(r'js/my-cinemap-art\.js\?v=[^"<]+', 'js/my-cinemap-art.js?v=20260927-my-cinemap-controls-v11', html)
    html = re.sub(r'js/my-cinemap-tools\.js\?v=[^"<]+', 'js/my-cinemap-tools.js?v=20260927-my-cinemap-controls-v11', html)

    # Font-size scale: current rendering is small/default, medium +18%, large +36%.
    anchor = "const shape=artValue('format'),layout=artValue('layout'),theme=artValue('theme')||'minimal',p=artPalettes[theme]||artPalettes.minimal;"
    if "artValue('fontSize')" not in art:
        art = art.replace(anchor, anchor + "\n  const fontScale={small:1,medium:1.18,large:1.36}[artValue('fontSize')]||1;")
        art = art.replace("const nameSize=sparse?Math.min(48,cellH*.26):Math.min(29,Math.max(21,cellH*.19));", "const nameSize=(sparse?Math.min(48,cellH*.26):Math.min(29,Math.max(21,cellH*.19)))*fontScale;")
        art = art.replace("writeLines(ctx,meta,tx,top+nameHeight+6,tw,1,24,19,artSans,400)", "writeLines(ctx,meta,tx,top+nameHeight+6,tw,1,24*fontScale,19*fontScale,artSans,400)")

    # Preview poster visibility is a local UI concern only; exported canvas remains typography-only.
    if 'posterPreviewOn' not in tools:
        tools = tools.replace("const movieKey=m=>String(m?.tmdbId||m?.id||`${m?.title||''}|${m?.year||''}`);", "const movieKey=m=>String(m?.tmdbId||m?.id||`${m?.title||''}|${m?.year||''}`);\n  const syncPosterPreview=()=>{const on=document.getElementById('posterMode')?.value==='on';document.body.classList.toggle('posterPreviewOn',on);document.body.classList.toggle('posterPreviewOff',!on)};")
        tools = tools.replace("function enhanceList(){const list=document.getElementById('list');", "function enhanceList(){syncPosterPreview();const list=document.getElementById('list');")
        tools = tools.replace("window.addEventListener('DOMContentLoaded',", "document.getElementById('posterMode')?.addEventListener('change',syncPosterPreview);\n  syncPosterPreview();\n  window.addEventListener('DOMContentLoaded',")

    # Use TMDB original_name for non-Japanese productions, without extra person API calls.
    old = 'const directorObj=crew.find((x:any)=>x.job==="Director"),director=directorObj?.name||"";'
    new = 'const directorObj=crew.find((x:any)=>x.job==="Director"),director=directorObj?.name||"",directorOriginalName=directorObj?.original_name||director,directorIsJapanese=(m.production_countries||[]).some((c:any)=>c.iso_3166_1==="JP");'
    if 'directorOriginalName' not in api:
        api = api.replace(old, new)
        api = api.replace('director,director_id:', 'director,director_original_name:directorOriginalName,director_is_japanese:directorIsJapanese,director_id:')

    old_fill = ".then(r=>r.ok?r.json():null).then(d=>d?.movie?.director||'').catch(()=>'').finally(()=>directorRequests.delete(id)))"
    new_fill = ".then(r=>r.ok?r.json():null).then(d=>{const movie=d?.movie;if(!movie)return '';return movie.director_is_japanese?movie.director:(movie.director_original_name||movie.director||'')}).catch(()=>'').finally(()=>directorRequests.delete(id)))"
    if 'director_original_name' not in tools:
        tools = tools.replace(old_fill, new_fill)

    Path('my-cinemap.html').write_text(html, encoding='utf-8')
    Path('js/my-cinemap-tools.js').write_text(tools, encoding='utf-8')
    Path('js/my-cinemap-art.js').write_text(art, encoding='utf-8')
    Path('backend/app/api/movie-detail/route.ts').write_text(api, encoding='utf-8')


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else ''
    if mode == 'prepare-test':
        prepare_test()
    elif mode == 'apply':
        apply()
    else:
        raise SystemExit('usage: apply_my_cinemap_controls_20260927.py [prepare-test|apply]')
