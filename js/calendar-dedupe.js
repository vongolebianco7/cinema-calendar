(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CinemapCalendarDedupe = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  function key(row) {
    const title = String(row.title || '').normalize('NFKC').toLowerCase().replace(/[\p{P}\p{Z}\s]/gu, '');
    return title && row.date ? [row.event || '', row.date, row.service || '', title].join('|') : null;
  }
  function movieId(row) {
    const value = row.tmdbId ?? row.tmdb_id ?? row.id;
    const number = Number(value);
    return /^\d+$/.test(String(value)) && Number.isSafeInteger(number) && number > 0 ? String(number) : null;
  }
  function quality(row) {
    return Number(!!movieId(row)) * 8 + Number(!!row.poster) * 4 + Number(!!row.source_url) * 2 + Number(!!row.overview);
  }
  function dedupe(rows) {
    const output = [], indices = new Map();
    for (const row of rows) {
      const identity = key(row);
      if (!identity || !indices.has(identity)) {
        if (identity) indices.set(identity, output.length);
        output.push(row); continue;
      }
      const index = indices.get(identity), previous = output[index];
      const previousId = movieId(previous);
      const currentId = movieId(row);
      if (previousId && currentId && String(previousId) !== String(currentId)) {
        output.push(row); continue;
      }
      const best = quality(row) > quality(previous) ? row : previous;
      const other = best === row ? previous : row;
      const combined = { ...best };
      for (const [field, value] of Object.entries(other)) {
        if ((combined[field] == null || combined[field] === '') && value != null) combined[field] = value;
      }
      output[index] = combined;
    }
    return output;
  }
  function inFirstVisibleWeek(row,weekStart,weekEnd,viewStart){
    if(!row?.date)return false;
    const first=row.date<viewStart?viewStart:row.date;
    return first>=weekStart&&first<=weekEnd&&(row.end_date||row.date)>=weekStart;
  }
  return { dedupe, inFirstVisibleWeek };
});
