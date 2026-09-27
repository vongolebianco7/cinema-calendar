/* Adds one-tap recording to existing card layouts without changing navigation handlers. */
(function () {
  'use strict';
  const store = window.CinemapRecords;
  if (!store) return;
  const selector = '.rankCard[href], .awardCard, #grid .card, #cards .card, .tvMovie[data-record-id], .presetCard, .personFeatureCard, .conciergeMovie, #detail .directorWork, #detail .relatedWork';
  function movieFor(card) {
    const link = card.matches('a') ? card.getAttribute('href') : '';
    let linkedId = null;
    if (link) { try { linkedId = new URL(link, location.href).searchParams.get('id'); } catch {} }
    const id = card.dataset.recordId || card.dataset.id || card.dataset.popularId || card.dataset.personMovie || linkedId;
    if (!/^[1-9]\d*$/.test(String(id ?? '')) && !card.matches('.awardCard')) return null;
    const title = card.querySelector('.title, .tvMovieTitle, .awardTitle, .presetCardTitle, b')?.textContent?.trim() || '';
    const year = card.querySelector('.meta, .presetCardMeta, .small')?.textContent?.match(/(?:19|20)\d{2}/)?.[0];
    return { id, title, year, poster: card.querySelector('img')?.getAttribute('src') || '' };
  }
  function update(shell, movie) {
    const button = shell.querySelector(':scope > .recordToggle');
    if (!button) return;
    const active = !!store.get(movie)?.watched;
    const label = active ? '✓ 観た' : '＋ 観た';
    if (button.textContent !== label) button.textContent = label;
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', movie.title + (active ? 'の観た記録を解除' : 'を観たと記録'));
  }
  function enhance(card) {
    if (card.closest('.recordShell') || !card.parentNode) return;
    const movie = movieFor(card); if (!movie) return;
    const shell = document.createElement('div'); shell.className = 'recordShell';
    card.parentNode.insertBefore(shell, card); shell.appendChild(card);
    const button = document.createElement('button'); button.type = 'button'; button.className = 'recordToggle';
    shell.appendChild(button); update(shell, movie);
    button.addEventListener('click', async e => {
      e.preventDefault(); e.stopPropagation();
      let selected = movieFor(card);
      if (!store.movieId(selected) && card.matches('.awardCard')) {
        button.disabled = true; button.textContent = '確認中…';
        const resolved = await window.CinemapRecordResolveAward?.(card.dataset.awardFilm || selected.title);
        button.disabled = false;
        if (!resolved || !store.movieId(resolved)) { button.textContent = '特定できません'; return; }
        card.dataset.recordId = store.movieId(resolved);
        selected = { ...resolved, id: card.dataset.recordId };
      }
      store.toggleWatched(selected);
    });
  }
  let scheduled = false;
  function scan() { scheduled = false; document.querySelectorAll(selector).forEach(enhance); document.querySelectorAll('.recordShell').forEach(shell => {
    const card = shell.firstElementChild, movie = movieFor(card); if (movie) update(shell, movie);
  }); }
  const observer = new MutationObserver(() => { if (!scheduled) { scheduled = true; requestAnimationFrame(scan); } });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-record-id'] });
  store.subscribe(() => { if (!scheduled) { scheduled = true; requestAnimationFrame(scan); } });
  scan();
})();
