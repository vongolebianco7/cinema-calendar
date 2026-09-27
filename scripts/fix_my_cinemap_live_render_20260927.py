from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
HTML=ROOT/'my-cinemap.html'
ART=ROOT/'js/my-cinemap-art.js'
TOOLS=ROOT/'js/my-cinemap-tools.js'
TEST=ROOT/'tests/test_my_cinemap_live_render.py'

def prepare_test():
    TEST.write_text('''from pathlib import Path\nROOT=Path(__file__).resolve().parents[1]\nHTML=(ROOT/"my-cinemap.html").read_text(encoding="utf-8")\nART=(ROOT/"js/my-cinemap-art.js").read_text(encoding="utf-8")\nTOOLS=(ROOT/"js/my-cinemap-tools.js").read_text(encoding="utf-8")\n\ndef test_template_preview_css_is_available_without_helper_js():\n    assert '<style id="my-cinemap-template-preview-v2">' in HTML\n    assert '.templatePreview .previewRanks' in HTML\n    assert '.templatePreview .previewRank' in HTML\n\ndef test_helper_script_cache_key_is_bumped():\n    assert 'my-cinemap-tools.js?v=20260927-my-cinemap-live-v13' in ART\n    assert 'my-cinemap-preview-v9' not in ART\n\ndef test_existing_selected_movies_backfill_missing_poster():\n    assert 'async function fillMovieDetails(movie)' in TOOLS\n    assert 'if(!movie.poster&&detail.poster)movie.poster=detail.poster' in TOOLS\n    assert 'picks.forEach(fillMovieDetails)' in TOOLS\n    assert 'fillDirector(' not in TOOLS\n''',encoding='utf-8')

def apply():
    html=HTML.read_text(encoding='utf-8')
    css='''\n<style id="my-cinemap-template-preview-v2">\n.templatePreview{position:relative;display:block;width:100%;height:72px;overflow:hidden;border:1px solid var(--pv-border,#777);border-radius:6px;background:var(--pv-bg,#222);color:var(--pv-fg,#eee);padding:8px 7px}.previewMinimal{--pv-bg:#f3efe7;--pv-fg:#1f1d19;--pv-line:#d3cab9;--pv-accent:#b9aa8d;--pv-border:#b9aa8d}.previewNoir{--pv-bg:#1b1c1d;--pv-fg:#f4efe6;--pv-line:#514c46;--pv-accent:#b8955d;--pv-border:#8d744d}.previewBurgundy{--pv-bg:#57252d;--pv-fg:#f7eee4;--pv-line:#87505a;--pv-accent:#c89a68;--pv-border:#a66f52}.previewBlueGray{--pv-bg:#d9dfe3;--pv-fg:#1d2730;--pv-line:#aab4bb;--pv-accent:#827665;--pv-border:#8c9296}.templatePreview .previewTitle{display:block;text-align:center;font:500 8px/1 Georgia,serif}.templatePreview .previewRule{display:block;width:58%;height:1px;background:var(--pv-line);margin:5px auto 4px;opacity:.8}.templatePreview .previewRanks{display:grid;gap:2px}.templatePreview .previewRank{display:grid;grid-template-columns:12px minmax(0,1fr);gap:4px;align-items:center;min-height:8px;border-top:1px solid var(--pv-line);padding-top:1px}.templatePreview .previewRank b{display:grid;place-items:center;width:10px;height:10px;margin:0;font:600 6px Arial,sans-serif}.templatePreview .previewRank.medal b{border:1px solid var(--pv-accent);border-radius:50%;color:var(--pv-accent)}.templatePreview .previewRank i{display:block;height:2px;border-radius:999px;background:currentColor;opacity:.58}.templatePreview .previewLogo{position:absolute;left:0;right:0;bottom:3px;text-align:center;font:500 5px Georgia,serif;opacity:.7}\n</style>\n'''
    marker='<style id="my-cinemap-compact-templates-v1">'
    if 'my-cinemap-template-preview-v2' not in html:
        pos=html.index(marker)
        html=html[:pos]+css+html[pos:]
    HTML.write_text(html,encoding='utf-8')

    art=ART.read_text(encoding='utf-8')
    art=art.replace("my-cinemap-tools.js?v=20260927-my-cinemap-preview-v9","my-cinemap-tools.js?v=20260927-my-cinemap-live-v13")
    ART.write_text(art,encoding='utf-8')

    tools=TOOLS.read_text(encoding='utf-8')
    old="""  async function fillDirector(movie){\n    if(movie.director)return;\n    const id=Number(movie.tmdbId||(movie.source==='tmdb'?movie.id:0));\n    if(!Number.isInteger(id)||id<1)return;\n    // Only a selected film is looked up; each ID has at most one in-flight request.\n    if(!directorRequests.has(id))directorRequests.set(id,fetch('https://backend-one-gray-94.vercel.app/api/movie-detail?id='+id)\n      .then(r=>r.ok?r.json():null).then(d=>{const movie=d?.movie;if(!movie)return '';return movie.director_is_japanese?movie.director:(movie.director_original_name||movie.director||'')}).catch(()=>'').finally(()=>directorRequests.delete(id)));\n    const director=await directorRequests.get(id);\n    if(director&&!movie.director&&picks.includes(movie)){\n      movie.director=director;\n      localStorage.setItem('cinemap-my-list',JSON.stringify(picks));\n      render();\n    }\n  }\n"""
    new="""  async function fillMovieDetails(movie){\n    if(movie.director&&movie.poster)return;\n    const id=Number(movie.tmdbId||(movie.source==='tmdb'?movie.id:0));\n    if(!Number.isInteger(id)||id<1)return;\n    if(!directorRequests.has(id))directorRequests.set(id,fetch('https://backend-one-gray-94.vercel.app/api/movie-detail?id='+id)\n      .then(r=>r.ok?r.json():null).then(d=>d?.movie||null).catch(()=>null).finally(()=>directorRequests.delete(id)));\n    const detail=await directorRequests.get(id);\n    if(!detail||!picks.includes(movie))return;\n    const director=detail.director_is_japanese?detail.director:(detail.director_original_name||detail.director||'');\n    let changed=false;\n    if(!movie.director&&director){movie.director=director;changed=true}\n    if(!movie.poster&&detail.poster)movie.poster=detail.poster;\n    if(!movie.poster&&detail.poster)changed=true;\n    if(changed){localStorage.setItem('cinemap-my-list',JSON.stringify(picks));render()}\n  }\n"""
    if old not in tools:
        raise SystemExit('fillDirector block not found')
    tools=tools.replace(old,new)
    tools=tools.replace('fillDirector(chosen)','fillMovieDetails(chosen)').replace('fillDirector(picks[replaced])','fillMovieDetails(picks[replaced])').replace('fillDirector(movie)','fillMovieDetails(movie)')
    tools=tools.replace('renderCandidates();enhanceList()}','renderCandidates();enhanceList();picks.forEach(fillMovieDetails)}')
    # fix changed detection for poster before assignment
    tools=tools.replace("if(!movie.poster&&detail.poster)movie.poster=detail.poster;\n    if(!movie.poster&&detail.poster)changed=true;","if(!movie.poster&&detail.poster){movie.poster=detail.poster;changed=true}")
    TOOLS.write_text(tools,encoding='utf-8')

if __name__=='__main__':
    if len(sys.argv)<2: raise SystemExit('prepare-test|apply')
    {'prepare-test':prepare_test,'apply':apply}[sys.argv[1]]()
