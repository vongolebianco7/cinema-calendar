from pathlib import Path

def test_selected_movie_card_shows_poster_and_clears_on_edit():
    s=Path('experience.html').read_text(encoding='utf-8')
    assert 'id="formatSelectedMovie"' in s
    assert 'function renderSelectedMovie()' in s
    assert 'selectedMovieCard.innerHTML' in s
    assert 'candidatePoster(selectedMovie)' in s
    assert 'selectedMovieCard.hidden=false' in s
    assert 'selectedMovieCard.hidden=true' in s
