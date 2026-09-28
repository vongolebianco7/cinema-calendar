/* Bootstrap for the local-only Ocean demo. Keep the page usable even if 3D fails. */
(function (root) {
  'use strict';
  const $ = id => document.getElementById(id);
  const recordsApi = root.CinemapRecords;
  const model = root.CinemapOceanModel;

  function records() { return recordsApi?.read?.() || {}; }
  function watchedValues(data) { return Object.values(data || {}).filter(r => r?.watched); }

  function renderSpecies(data) {
    const host = $('speciesCollection');
    if (!host || !model?.speciesFor) return;
    const seen = new Map();
    for (const film of watchedValues(data)) {
      const species = model.speciesFor(film);
      if (species) seen.set(species.id, { species, count: (seen.get(species.id)?.count || 0) + 1 });
    }
    $('speciesCount').textContent = seen.size ? `(${seen.size}種)` : '(まだ0種)';
    host.innerHTML = seen.size
      ? [...seen.values()].slice(0, 24).map(({species,count}) => `<div class="speciesTile"><strong>${species.name}</strong><br><small>${count}作品から誕生</small></div>`).join('')
      : '<p class="lead">映画を記録すると、この海に最初の生命が生まれます。</p>';
  }

  function render(data) {
    const values = watchedValues(data);
    $('dashboard').hidden = false;
    $('onboarding').hidden = true;
    $('dashboardCount').textContent = `${values.length}本記録済み`;
    $('watchedCount').textContent = String(values.length);
    $('resonatedCount').textContent = String(values.filter(r => Number.isFinite(Number(r.rating))).length);
    renderSpecies(data);
    if ($('trends')) $('trends').innerHTML = values.length ? '<span>記録が増えるほど海の多様性が育ちます</span>' : '<span>最初の映画を記録して海を育てよう</span>';
    if ($('coverage')) $('coverage').textContent = `${values.length}作品を記録中`;
    if ($('missing')) $('missing').innerHTML = '';
    if ($('entries')) $('entries').innerHTML = values.slice().reverse().slice(0, 30).map(r => `<div>${String(r.title || '記録した映画').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}${Number.isFinite(Number(r.rating)) ? ` · ${Number(r.rating).toFixed(1)}` : ''}</div>`).join('') || '<p class="lead">まだ記録はありません。</p>';

    try {
      root.CinemapOceanImmersive?.mount?.([], data);
    } catch (error) {
      console.error('[Ocean bootstrap]', error);
      $('loadError').textContent = '3D表示を開始できませんでした。記録と生き物の情報は引き続き利用できます。';
    }
  }

  $('reset')?.addEventListener('click', () => {
    if (root.confirm('すべての視聴記録を削除しますか？')) recordsApi?.clear?.();
  });
  recordsApi?.subscribe?.(render);
  render(records());
})(window);
