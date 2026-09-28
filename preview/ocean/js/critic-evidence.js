/* Editorial evidence only. No network access or inferred criticism. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CinemapCriticEvidence = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const HTTPS = /^https:\/\/[^\s/]+\.[^\s/]+/i;
  const clean = value => typeof value === "string" ? value.trim() : "";
  function usableSource(source) {
    if (!source || !clean(source.id) || !clean(source.name) || !HTTPS.test(clean(source.url))) return false;
    try { const url = new URL(source.url); return url.protocol === "https:" && !url.username && !url.password; }
    catch { return false; }
  }
  function normalize(entry) {
    const sources = (Array.isArray(entry?.sources) ? entry.sources : []).filter(usableSource);
    const unique = new Map(sources.map(source => [source.id, source]));
    const evidence = [...unique.values()];
    const allowed = new Set(unique.keys());
    const distinct = ids => [...new Set((Array.isArray(ids) ? ids : []).filter(id => allowed.has(id)))];
    const items = (rows, limit) => (Array.isArray(rows) ? rows : []).filter(row =>
      clean(row?.text) && distinct(row.sourceIds).length >= 2
    ).slice(0, limit).map(row => ({text: clean(row.text), sourceIds: distinct(row.sourceIds)}));
    const overview = evidence.length >= 3 && clean(entry?.overview?.text) &&
      distinct(entry.overview.sourceIds).length >= 3 ?
      {text: clean(entry.overview.text), sourceIds: distinct(entry.overview.sourceIds)} : null;
    const positive = items(entry?.positive, 3);
    const divided = items(entry?.divided, 3).filter(row => {
      const sides = (Array.isArray(entry?.divided) ? entry.divided : []).find(x => x.text === row.text);
      return distinct(sides?.positiveSourceIds).length >= 1 && distinct(sides?.negativeSourceIds).length >= 1 &&
        !distinct(sides?.positiveSourceIds).every(id => distinct(sides?.negativeSourceIds).includes(id));
    });
    // A small or unclassified sample cannot support a percentage. The denominator
    // includes only individually classified, distinct sources from this entry.
    const classified = (Array.isArray(entry?.stances) ? entry.stances : []).filter(x =>
      allowed.has(x?.sourceId) && ["positive", "negative", "mixed"].includes(x?.value));
    const bySource = new Map(classified.map(x => [x.sourceId, x.value]));
    const total = bySource.size;
    const positiveCount = [...bySource.values()].filter(x => x === "positive").length;
    return {sources: evidence, overview, positive, divided,
      ratio: total >= 10 ? {total, percent: Math.round(positiveCount / total * 100)} : null};
  }
  function forMovie(database, id) {
    const key = String(id ?? "");
    return normalize(key && database && database.films && Object.hasOwn(database.films, key) ? database.films[key] : null);
  }
  return {normalize, forMovie};
});
