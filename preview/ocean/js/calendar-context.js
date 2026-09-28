(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CinemapCalendarContext = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const modes = new Set(['streaming', 'theatrical', 'tv']);
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }
  function detailHref(movie) {
    const id = movie.tmdbId || movie.id;
    if (!id || !movie.title) return null;
    const p = new URLSearchParams({ id: String(id), search: String(movie.title) });
    if (validDate(movie.date) && modes.has(movie.event)) {
      p.set('from', 'calendar'); p.set('date', movie.date); p.set('event', movie.event);
      if (movie.service) p.set('service', String(movie.service).slice(0, 80));
    }
    return 'search.html?' + p.toString();
  }
  function read(params, movie) {
    if (params.get('from') !== 'calendar' || String(movie.tmdbId || movie.id || '') !== params.get('id')) return null;
    const date = params.get('date'), event = params.get('event');
    if (!validDate(date) || !modes.has(event)) return null;
    const service = (params.get('service') || '').slice(0, 80);
    return { date, event, service, backHref: 'index.html?' + new URLSearchParams({ date, mode:event }) };
  }
  function initialCalendar(params) {
    const date = params.get('date'), mode = params.get('mode');
    return validDate(date) && modes.has(mode) ? { date, mode } : null;
  }
  return { detailHref, read, initialCalendar };
});
