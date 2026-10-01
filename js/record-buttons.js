/* A direct rating gesture on every major film card records the film. */
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
    const range = shell.querySelector(':scope > .recordScale input');
    if (!range || document.activeElement===range) return;
    const score=store.get(movie)?.rating ?? 0;
    if (Number(range.value)!==score) range.value=score;
    const output=shell.querySelector(':scope > .recordScale output');
    const text=score===0?'0 · 未鑑賞':Number(score).toFixed(1);
    if (output && output.textContent!==text) output.textContent=text;
    range.setAttribute('aria-label',(movie.title||'作品')+'の評価。0は未鑑賞、動かすと観た作品として記録');
  }
  function enhance(card) {
    if (card.closest('.recordShell') || !card.parentNode) return;
    const movie = movieFor(card); if (!movie) return;
    const shell = document.createElement('div'); shell.className = 'recordShell';
    card.parentNode.insertBefore(shell, card); shell.appendChild(card);
    const label=document.createElement('label');label.className='recordScale';
    label.innerHTML='<span>自分の評価 <output>0 · 未鑑賞</output></span><input type="range" min="0" max="5" step="0.1" value="0"><small>0 ───── 5.0</small>';
    shell.appendChild(label);update(shell,movie);
    const range=label.querySelector('input'),output=label.querySelector('output');
    range.addEventListener('input',()=>{output.textContent=Number(range.value)===0?'0 · 未鑑賞':Number(range.value).toFixed(1);});
    range.addEventListener('change', async e => {
      e.stopPropagation();
      let selected = movieFor(card);
      if (!store.movieId(selected) && card.matches('.awardCard')) {
        range.disabled=true;output.textContent='作品確認中…';
        const resolved = await window.CinemapRecordResolveAward?.(card.dataset.awardFilm || selected.title);
        range.disabled=false;
        if (!resolved || !store.movieId(resolved)) {range.value='0';output.textContent='作品を特定できません';return;}
        const id = store.movieId(resolved);
        document.querySelectorAll('.awardCard[data-award-film]').forEach(other => {
          if (other.dataset.awardFilm === card.dataset.awardFilm) other.dataset.recordId = id;
        });
        selected = { ...resolved, id };
      }
      store.rate(selected,Number(range.value));
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
