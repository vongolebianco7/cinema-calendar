from pathlib import Path
import re

p = Path('experience.html')
s = p.read_text(encoding='utf-8')

style = r'''<style id="experience-candidate-search-v2">
.filmCandidates{margin-top:10px;border:1px solid #2b2f35;border-radius:10px;overflow:hidden;background:#101216}
.filmCandidate{width:100%;display:grid;grid-template-columns:48px minmax(0,1fr);gap:10px;align-items:center;padding:8px 10px;border:0;border-top:1px solid #24282e;background:#101216;color:#f2f2f2;text-align:left;cursor:pointer}
.filmCandidate:first-child{border-top:0}.filmCandidate:active{background:#171a20}
.filmCandidatePoster{width:48px;aspect-ratio:2/3;border-radius:5px;object-fit:cover;background:#24272e;display:block}
.filmCandidatePosterFallback{width:48px;aspect-ratio:2/3;border-radius:5px;background:#24272e;display:grid;place-items:center;color:#70757f;font-size:9px;text-align:center;padding:3px}
.filmCandidateBody{min-width:0}.filmCandidateBody b{display:block;font-size:13px;line-height:1.3}.filmCandidateMeta{display:block;margin-top:3px;font-size:10px;color:#9ca3ad;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.candidateMore{width:100%;border:0;border-top:1px solid #2b2f35;background:#16191e;color:#ddd;padding:10px 12px;font-size:12px;font-weight:800;cursor:pointer}
.candidateState{padding:12px;color:#999;font-size:12px}
</style>
'''

new_script = r'''<script id="experience-decision-js-v2">(()=>{
const input=document.getElementById('formatFilm'),confirmBtn=document.getElementById('formatConfirm'),candidateBox=document.getElementById('formatCandidates'),out=document.getElementById('formatResult');if(!input||!confirmBtn||!candidateBox||!out)return;
let candidates=[],selectedMovie=null,candidateTimer=null,candidateRequest=null,visibleCandidateCount=5;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=n=>Math.max(1,Math.min(5,n));
function movieYear(m){const d=m.release_date||m.first_air_date||m.year||m.date||'';return String(d).slice(0,4)}
function genresOf(m){return (m.genres||m.genre_names||[]).map(x=>String(typeof x==='string'?x:(x&&x.name)||'').toLowerCase()).join(' ')}
function normalizeSearchText(v){return String(v||'').normalize('NFKC').toLowerCase().replace(/[\s\u3000・･·\.．,，:：;；!！?？'’"“”()（）\[\]【】「」『』\-‐‑‒–—―ー]/g,'')}
function searchLabel(m){return m.title||m.name||''}
function searchOriginal(m){return m.original_title||m.original_name||''}
function candidateRank(m,q){const nq=normalizeSearchText(q),nt=normalizeSearchText(searchLabel(m)),no=normalizeSearchText(searchOriginal(m));let rank=0;if(nt===nq||no===nq)rank=1000;else if(nt.startsWith(nq)||no.startsWith(nq))rank=800;else if(nt.includes(nq)||no.includes(nq))rank=600;else if(nq.includes(nt)||nq.includes(no))rank=350;const votes=Number(m.votes??m.vote_count??0),rating=Number(m.score??m.vote_average??0);return rank+Math.min(80,Math.log10(votes+1)*18)+Math.min(20,rating*2)}
function scoreMovie(m){const g=genresOf(m),s={'通常上映':4,'IMAX':3.5,'Dolby Cinema':3.5,'4DX / MX4D':2,'ScreenX':2};if(/action|アクション|adventure|アドベンチャー|science fiction|sf|fantasy|ファンタジー/.test(g)){s.IMAX+=1;s['Dolby Cinema']+=.5;s['4DX / MX4D']+=.8;s.ScreenX+=.4}if(/horror|ホラー|thriller|スリラー|crime|犯罪/.test(g)){s['Dolby Cinema']+=1;s.IMAX+=.3;s['4DX / MX4D']+=.3}if(/animation|アニメ/.test(g)){s.IMAX+=.6;s['Dolby Cinema']+=.5;s.ScreenX+=.2}if(/drama|ドラマ|romance|恋愛|documentary|ドキュメンタリー/.test(g)){s['通常上映']+=.5;s['Dolby Cinema']+=.2;s['4DX / MX4D']-=.8;s.ScreenX-=.5}Object.keys(s).forEach(k=>s[k]=clamp(s[k]));return s}
const stars=n=>'★'.repeat(Math.round(n))+'☆'.repeat(5-Math.round(n));
function summary(k){return k==='IMAX'?'大画面・スケール感を重視':k==='Dolby Cinema'?'黒・コントラストと立体音響を重視':k==='4DX / MX4D'?'座席の動きと環境効果を重視':k==='ScreenX'?'左右へ広がる視界を重視':'追加演出なしで作品に集中'}
function tabFor(k){return k==='IMAX'?'aspect':k==='Dolby Cinema'?'visual':k==='4DX / MX4D'||k==='ScreenX'?'special':null}
function tabLabel(k){return k==='IMAX'?'画角を詳しく見る':k==='Dolby Cinema'?'映像を詳しく見る':k==='4DX / MX4D'||k==='ScreenX'?'体感を詳しく見る':''}
function evidenceFor(m,k){const raw=[...(Array.isArray(m.formats)?m.formats:[]),...(Array.isArray(m.screening_formats)?m.screening_formats:[]),...(Array.isArray(m.special_formats)?m.special_formats:[])].map(String).join(' ').toLowerCase();if(k==='IMAX'&&(m.imax===true||raw.includes('imax')))return '作品データ上でIMAXに関する明示情報を確認できたため、IMAXを候補として評価しています。';if(k==='Dolby Cinema'&&(m.dolby_cinema===true||raw.includes('dolby cinema')))return '作品データ上でDolby Cinemaに関する明示情報を確認できたため、Dolby Cinemaを候補として評価しています。';if(k==='ScreenX'&&(m.screenx===true||raw.includes('screenx')))return '作品データ上でScreenXに関する明示情報を確認できたため、ScreenXを候補として評価しています。';if(k==='4DX / MX4D'&&(m.fourdx===true||m.mx4d===true||raw.includes('4dx')||raw.includes('mx4d')))return '作品データ上で4DX / MX4Dに関する明示情報を確認できたため、体感上映を候補として評価しています。';return ''}
function normalizePayload(d){const pools=[];if(Array.isArray(d))pools.push(d);if(Array.isArray(d?.movies))pools.push(d.movies);if(Array.isArray(d?.external))pools.push(d.external);if(Array.isArray(d?.results))pools.push(d.results);if(Array.isArray(d?.items))pools.push(d.items);return pools.flat()}
function mergeCandidates(rows,q){const seen=new Set(),out=[];for(const m of rows){if(!m||( !m.title&&!m.name))continue;const key=String(m.tmdbId||m.id||'')+'|'+normalizeSearchText(searchLabel(m))+'|'+movieYear(m);if(seen.has(key))continue;seen.add(key);out.push(m)}return out.sort((a,b)=>candidateRank(b,q)-candidateRank(a,q)).slice(0,20)}
function candidatePoster(m){return m.poster||m.posterUrl||m.poster_url||''}
function renderCandidates(){const shown=candidates.slice(0,visibleCandidateCount);candidateBox.innerHTML=shown.map((m,i)=>{const poster=candidatePoster(m),title=searchLabel(m)||'タイトル不明',original=searchOriginal(m),meta=[movieYear(m)||'年不明',original&&normalizeSearchText(original)!==normalizeSearchText(title)?original:''].filter(Boolean).join(' · ');return '<button type="button" class="filmCandidate" role="option" data-candidate-index="'+i+'">'+(poster?'<img class="filmCandidatePoster" src="'+esc(poster)+'" alt="" loading="lazy" decoding="async">':'<span class="filmCandidatePosterFallback">NO IMAGE</span>')+'<span class="filmCandidateBody"><b>'+esc(title)+'</b><span class="filmCandidateMeta">'+esc(meta)+'</span></span></button>'}).join('')+(candidates.length>visibleCandidateCount?'<button type="button" class="candidateMore" data-candidate-more>さらに見る（残り'+(candidates.length-visibleCandidateCount)+'件）</button>':'');candidateBox.hidden=!candidates.length;input.setAttribute('aria-expanded',candidates.length?'true':'false');candidateBox.querySelectorAll('[data-candidate-index]').forEach(el=>el.addEventListener('click',()=>{const i=Number(el.dataset.candidateIndex);selectedMovie=candidates[i];input.value=searchLabel(selectedMovie)||input.value;candidateBox.hidden=true;input.setAttribute('aria-expanded','false');confirmBtn.disabled=false;confirmBtn.hidden=false;out.innerHTML='<div class="decisionNote"><b>'+esc(searchLabel(selectedMovie)||input.value)+'</b>を選択しました。「この作品でおすすめを見る」を押してください。</div>'}));candidateBox.querySelector('[data-candidate-more]')?.addEventListener('click',()=>{visibleCandidateCount+=5;renderCandidates()})}
async function fetchCandidateQuery(q,signal){const r=await fetch('https://backend-one-gray-94.vercel.app/api/movies?q='+encodeURIComponent(q)+'&limit=20',{cache:'no-store',signal});if(!r.ok)throw new Error('HTTP '+r.status);return normalizePayload(await r.json())}
async function loadCandidates(){const q=input.value.trim();if(q.length<2){candidates=[];candidateBox.hidden=true;input.setAttribute('aria-expanded','false');return}if(candidateRequest)candidateRequest.abort();candidateRequest=new AbortController();candidateBox.hidden=false;candidateBox.innerHTML='<div class="candidateState">候補を検索中…</div>';input.setAttribute('aria-expanded','true');visibleCandidateCount=5;try{let rows=await fetchCandidateQuery(q,candidateRequest.signal);let merged=mergeCandidates(rows,q),nq=normalizeSearchText(q),strong=merged.some(m=>normalizeSearchText(searchLabel(m))===nq||normalizeSearchText(searchOriginal(m))===nq);if(!strong&&q.length>=3){const broad=q.slice(0,3);const extra=await fetchCandidateQuery(broad,candidateRequest.signal);rows=rows.concat(extra);merged=mergeCandidates(rows,q)}candidates=merged;if(!candidates.length){candidateBox.innerHTML='<div class="candidateState">候補が見つかりませんでした。</div>';return}renderCandidates()}catch(e){if(e.name==='AbortError')return;candidateBox.hidden=false;candidateBox.innerHTML='<div class="candidateState">候補を取得できませんでした。入力を変えてお試しください。</div>';input.setAttribute('aria-expanded','true')}}
function renderRecommendation(){if(!selectedMovie)return;candidateBox.hidden=true;input.setAttribute('aria-expanded','false');const scores=scoreMovie(selectedMovie),rows=[['通常上映',scores['通常上映']],...Object.entries(scores).filter(([k])=>k!=='通常上映').sort((a,b)=>b[1]-a[1])],title=searchLabel(selectedMovie)||input.value.trim();out.innerHTML='<div class="decisionNote"><b>'+esc(title)+'</b>の作品傾向からの目安</div>'+rows.map(([k,v])=>{const target=tabFor(k),tabLink=target?'<button type="button" class="formatScoreCta" data-go-tab="'+target+'">'+tabLabel(k)+' →</button>':'',evidence=evidenceFor(selectedMovie,k),evidenceHtml=evidence?'<span class="formatEvidence"><b>確認できた根拠</b><br>'+esc(evidence)+'</span>':'';return '<div class="formatScore"><b>'+k+'</b><strong>'+stars(v)+'</strong><span class="formatScoreMeta"><span>'+summary(k)+'</span><span class="formatScoreActions">'+tabLink+'</span>'+evidenceHtml+'</span></div>'}).join('')+'<div class="decisionNote">※星はジャンル等からの相性目安です。「理由」は確認できる作品固有の根拠がある場合のみ表示します。作品固有の上映仕様・上映有無は劇場公式情報を確認してください。</div>';out.querySelectorAll('[data-go-tab]').forEach(el=>el.addEventListener('click',()=>window.switchExperienceTab&&window.switchExperienceTab(el.dataset.goTab,true)))}
input.addEventListener('input',()=>{selectedMovie=null;confirmBtn.disabled=true;confirmBtn.hidden=true;out.innerHTML='<div class="decisionNote">候補から作品を選んでください。</div>';clearTimeout(candidateTimer);candidateTimer=setTimeout(loadCandidates,250)});input.addEventListener('focus',()=>{if(candidates.length&&!selectedMovie){candidateBox.hidden=false;input.setAttribute('aria-expanded','true')}});confirmBtn.addEventListener('click',renderRecommendation)
})();</script>'''

if 'experience-candidate-search-v2' not in s:
    anchor = '<script id="experience-decision-js-v1">'
    if anchor not in s:
        raise SystemExit('decision script anchor missing')
    s = s.replace(anchor, style + '\n' + anchor, 1)

pattern = re.compile(r'<script id="experience-decision-js-v1">.*?</script>', re.S)
if not pattern.search(s):
    # rerun-safe: replace v2 if script was partially applied
    pattern = re.compile(r'<script id="experience-decision-js-v2">.*?</script>', re.S)
if not pattern.search(s):
    raise SystemExit('decision script block missing')
s = pattern.sub(new_script, s, count=1)
p.write_text(s, encoding='utf-8')
