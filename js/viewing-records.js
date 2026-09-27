/* Local viewing records. Only this module knows where records are stored. */
(function (root) {
  'use strict';
  const KEY = 'cinemap-viewing-records-v1';
  let fallback = {};
  const listeners = new Set();
  const storage = () => { try { return root.localStorage; } catch { return null; } };
  const read = () => {
    try {
      const raw = storage()?.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : fallback;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch { return fallback; }
  };
  const emit = () => listeners.forEach(fn => fn(read()));
  const write = records => {
    fallback = records;
    try { storage()?.setItem(KEY, JSON.stringify(records)); } catch { /* private browsing fallback */ }
    emit();
  };
  const movieId = movie => {
    const id = movie?.tmdbId ?? movie?.id;
    return /^(?:[1-9]\d*)$/.test(String(id ?? '')) ? String(id) : null;
  };
  const get = movie => { const id = movieId(movie); return id ? read()[id] || null : null; };
  function setWatched(movie, watched) {
    const id = movieId(movie); if (!id) return false;
    const records = read();
    if (!watched) delete records[id];
    else {
      const old = records[id] || {};
      records[id] = {
        id, watched: true, resonated: !!old.resonated,
        updatedAt: new Date().toISOString(),
        title: String(movie.title || old.title || '').slice(0, 160),
        poster: String(movie.poster || old.poster || '').slice(0, 500),
        year: Number(movie.year || old.year) || null,
        genres: Array.isArray(movie.genres) ? movie.genres.slice(0, 6) : old.genres || [],
        region: String(movie.region || old.region || '').slice(0, 60),
        director: String(movie.director || old.director || '').slice(0, 120)
      };
    }
    write(records); return true;
  }
  function toggleWatched(movie) { return setWatched(movie, !get(movie)?.watched); }
  function toggleResonated(movie) {
    const id = movieId(movie), records = read();
    if (!id || !records[id]?.watched) return false;
    records[id] = { ...records[id], resonated: !records[id].resonated, updatedAt: new Date().toISOString() };
    write(records); return true;
  }
  function clear() { write({}); }
  root.CinemapRecords = { movieId, read, get, setWatched, toggleWatched, toggleResonated, clear,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); } };
})(typeof window === 'undefined' ? globalThis : window);
