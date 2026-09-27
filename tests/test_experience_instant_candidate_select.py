from pathlib import Path

s = Path('experience.html').read_text(encoding='utf-8')

assert 'この作品でおすすめを見る' not in s, 'confirmation button text still exists'
assert '押してください' not in s, 'post-selection instruction still exists'
assert "selectedMovie=candidates[i]" in s, 'candidate selection handler missing'
selection = s.split("selectedMovie=candidates[i]", 1)[1].split("data-candidate-more", 1)[0]
assert 'renderRecommendation()' in selection, 'candidate tap does not render recommendation immediately'
assert "confirmBtn.addEventListener('click',renderRecommendation)" not in s, 'obsolete confirm click handler still exists'
