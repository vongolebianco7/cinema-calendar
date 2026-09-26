from pathlib import Path
import re

SCRIPT='<script src="js/screening-model-v7.js"></script>'

def add_script(s):
    if SCRIPT not in s:
        if '</head>' not in s: raise SystemExit('missing </head>')
        s=s.replace('</head>',SCRIPT+'</head>',1)
    return s

# Top-page modal: keep layout but remove a single final verdict and use shared scoring.
p=Path('index.html'); s=add_script(p.read_text(encoding='utf-8'))
pat=r'function experienceFitHtml\(m\)\{.*?\n\}\nfunction festivalAwardOrg'
rep='''function experienceFitHtml(m){
 const rows=window.ScreeningModelV7?window.ScreeningModelV7.scoreMovie(m,INDEX_SCREENING_EVIDENCE):[];
 const stars=n=>window.ScreeningModelV7.stars(n);
 const cards=rows.map(x=>{const sub=x.subscores?'<div class="small" style="margin-top:5px">映像 '+stars(x.subscores.picture)+'　音響 '+stars(x.subscores.audio)+'</div>':'';const src=(x.sources||[]).length?'<div class="small" style="margin-top:6px">'+x.sources.map(a=>'<a target="_blank" rel="noopener noreferrer" href="'+a.url+'">'+a.label+' ↗</a>').join('　')+'</div>':'';return '<div class="experienceFitCard"><span><b>'+x.name+'</b><em class="experienceStars" aria-label="'+x.score+' / 5">'+stars(x.score)+'</em></span>'+sub+'<small>'+x.reason+'</small><div class="small" style="margin-top:6px">'+x.availability+'</div>'+src+'</div>'}).join('');
 return '<section class="detailSection experienceFit" data-index-screening-v7><h3>どの上映方式で観る？</h3><p class="small" style="margin:0 0 12px">★は作品と上映方式の相性を示す参考値です。公式対応の有無と、作品の映像・音響・身体性・空間性を分けて扱います。</p><div class="experienceFitGrid">'+cards+'</div><p class="small" style="margin-top:9px">「公式版未確認」は非対応を意味しません。確認できた作品固有情報がない場合も、情報不足を理由に★1へ下げません。</p><a class="experienceTheaterLink" href="search.html?id='+encodeURIComponent(m.tmdbId||m.id||"")+'&search='+encodeURIComponent(m.title||"")+'">詳しい根拠を見る →</a></section>'
}
function festivalAwardOrg'''
ns,n=re.subn(pat,lambda _:rep,s,count=1,flags=re.S)
if n!=1: raise SystemExit(f'index renderer replace count={n}')
p.write_text(ns,encoding='utf-8')

# Search/detail page: preserve details interaction but remove hero/final verdict and blue directive label.
p=Path('search.html'); s=add_script(p.read_text(encoding='utf-8'))
pat=r'function screeningRecommendationV3Html\(m\)\{.*?\n\}'
rep='''function screeningRecommendationV3Html(m){
 window.__screeningCurrentMovie=m;
 const rows=window.ScreeningModelV7?window.ScreeningModelV7.scoreMovie(m,SCREENING_V3_EVIDENCE):[];
 const stars=n=>window.ScreeningModelV7.stars(n);
 return '<div class="section" data-screening-v3-host data-screening-v7-host><h3>どの上映方式で見る？</h3><div class="small" style="margin-bottom:10px">★は作品と上映方式の相性を示す参考値です。公式対応の有無と作品特性は分けて表示します。</div><div class="formatCompactGrid">'+rows.map(x=>'<details class="formatCompact" data-format-detail data-format-key="'+x.key+'"><summary><span class="formatCompactName">'+E(x.name)+'</span><span class="formatCompactStars">'+stars(x.score)+'</span></summary><div class="formatCompactBody">'+(x.subscores?'<div class="formatMetric"><b>映像 / 音響</b><span>映像 '+stars(x.subscores.picture)+'　音響 '+stars(x.subscores.audio)+'</span></div>':'')+'<div class="formatMetric"><b>作品との相性</b><span>'+E(x.reason)+'</span></div><div class="formatMetric"><b>作品固有情報</b><span>'+E(x.availability)+'</span></div>'+((x.sources||[]).length?'<div class="formatSources">'+x.sources.map(a=>'<a target="_blank" rel="noopener noreferrer" href="'+E(a.url)+'">'+E(a.label||"公式情報")+' ↗</a>').join('')+'</div>':'')+'</div></details>').join('')+'</div><div class="formatLegend">「公式版未確認」は非対応を意味しません。情報不足だけで低評価にはせず、通常上映は3〜4、特殊上映は原則2以上としています。</div><a class="formatLink" href="experience.html">上映方式の違いを見る →</a></div>'
}'''
ns,n=re.subn(pat,lambda _:rep,s,count=1,flags=re.S)
if n!=1: raise SystemExit(f'search renderer replace count={n}')
# This class only belonged to the removed final-verdict hero; avoid stale UI markers.
ns=ns.replace('.formatHeroTitle{','.screeningLegacyHeroTitle{')
p.write_text(ns,encoding='utf-8')
print('applied screening model v7 UI integration')
