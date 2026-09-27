from pathlib import Path
import re

p = Path('experience.html')
s = p.read_text(encoding='utf-8')
orig = s

# Remove the obsolete confirmation button from the markup.
s, n = re.subn(r'\s*<button\b[^>]*\bid=["\']formatConfirm["\'][^>]*>.*?</button>', '', s, count=1, flags=re.S)
assert n == 1, 'formatConfirm button markup not found exactly once'

old_init = "const input=document.getElementById('formatFilm'),confirmBtn=document.getElementById('formatConfirm'),candidateBox=document.getElementById('formatCandidates'),out=document.getElementById('formatResult');if(!input||!confirmBtn||!candidateBox||!out)return;"
new_init = "const input=document.getElementById('formatFilm'),candidateBox=document.getElementById('formatCandidates'),out=document.getElementById('formatResult');if(!input||!candidateBox||!out)return;"
assert old_init in s, 'decision initializer changed unexpectedly'
s = s.replace(old_init, new_init, 1)

old_select = "confirmBtn.disabled=false;confirmBtn.hidden=false;out.innerHTML='<div class=\"decisionNote\"><b>'+esc(searchLabel(selectedMovie)||input.value)+'</b>を選択しました。「この作品でおすすめを見る」を押してください。</div>'"
assert old_select in s, 'candidate confirmation step changed unexpectedly'
s = s.replace(old_select, 'renderRecommendation()', 1)

old_input = "input.addEventListener('input',()=>{selectedMovie=null;confirmBtn.disabled=true;confirmBtn.hidden=true;out.innerHTML='<div class=\"decisionNote\">候補から作品を選んでください。</div>';clearTimeout(candidateTimer);candidateTimer=setTimeout(loadCandidates,250)});"
new_input = "input.addEventListener('input',()=>{selectedMovie=null;out.innerHTML='<div class=\"decisionNote\">候補から作品を選んでください。</div>';clearTimeout(candidateTimer);candidateTimer=setTimeout(loadCandidates,250)});"
assert old_input in s, 'input reset handler changed unexpectedly'
s = s.replace(old_input, new_input, 1)

old_click = "confirmBtn.addEventListener('click',renderRecommendation)"
assert old_click in s, 'confirmation click handler missing unexpectedly'
s = s.replace(old_click, '', 1)

assert 'この作品でおすすめを見る' not in s
assert '押してください' not in s
assert "selectedMovie=candidates[i]" in s
assert 'renderRecommendation()' in s
assert "confirmBtn.addEventListener('click',renderRecommendation)" not in s
assert s != orig

p.write_text(s, encoding='utf-8')
