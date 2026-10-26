/* Cinelva subscription availability evidence gate.
 * Never treat release calendars or TMDB watch-provider search as complete catalogs.
 * Snapshot must explicitly attest full JP movie coverage and be fresh.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CinelvaStreamingAvailability = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_AGE_MS = 48 * 60 * 60 * 1000;
  const serviceKeys = ['Netflix','U-NEXT','Prime Video','Disney+','Hulu','Apple TV','Lemino','WOWOW'];
  function validateSnapshot(snapshot, service, now = Date.now()) {
    if (!serviceKeys.includes(service)) return {ok:false,reason:'unsupported-service'};
    if (!snapshot || snapshot.schema_version !== 1 || snapshot.country !== 'JP') return {ok:false,reason:'invalid-region-or-schema'};
    if (!snapshot.generated_at || !Number.isFinite(Date.parse(snapshot.generated_at))) return {ok:false,reason:'missing-update-time'};
    const stamp = Date.parse(snapshot.generated_at);
    if (stamp > now + 5*60*1000 || now - stamp > MAX_AGE_MS) return {ok:false,reason:'stale'};
    // The browser must reject feeds without recorded usage rights and independent
    // full-catalog verification, even if a caller bypassed the import command.
    if (!snapshot.license || snapshot.license.public_display_authorized !== true ||
        typeof snapshot.license.provider !== 'string' || !snapshot.license.provider.trim() ||
        typeof snapshot.license.agreement_reference !== 'string' || !snapshot.license.agreement_reference.trim())
      return {ok:false,reason:'unlicensed-feed'};
    if (!snapshot.coverage_audit || snapshot.coverage_audit.all_supported_services_verified !== true ||
        typeof snapshot.coverage_audit.auditor !== 'string' || !snapshot.coverage_audit.auditor.trim() ||
        typeof snapshot.coverage_audit.method !== 'string' || !snapshot.coverage_audit.method.trim())
      return {ok:false,reason:'unaudited-coverage'};
    const group = snapshot.services && snapshot.services[service];
    if (!group || group.coverage !== 'complete' || group.entitlement !== 'subscription') return {ok:false,reason:'unverified-coverage'};
    if (!group.source || !Array.isArray(group.source.urls) || !group.source.urls.length ||
        !group.source.urls.every(url=>typeof url==='string' && /^https:\/\//.test(url))) return {ok:false,reason:'missing-evidence'};
    if (!Array.isArray(group.movies)) return {ok:false,reason:'invalid-movies'};
    const seen = new Set();
    for (const movie of group.movies) {
      const id = Number(movie && movie.tmdb_id);
      if (!Number.isSafeInteger(id) || id <= 0 || seen.has(id) ||
          typeof movie.title !== 'string' || !movie.title.trim() ||
          movie.entitlement !== 'subscription') return {ok:false,reason:'invalid-title-or-duplicate'};
      seen.add(id);
    }
    return {ok:true,reason:null,movies:group.movies};
  }
  function matchBookmarkIds(validated, ids) {
    if (!validated || !validated.ok || !Array.isArray(ids)) return null;
    const wanted = new Set(ids.map(Number).filter(id=>Number.isSafeInteger(id)&&id>0));
    return validated.movies.filter(movie=>wanted.has(Number(movie.tmdb_id)));
  }
  function compareBookmarkAvailability(previous, next, ids) {
    const before=matchBookmarkIds(previous,ids),after=matchBookmarkIds(next,ids);
    if(before===null || after===null) return null;
    const previousIds=new Set(before.map(movie=>Number(movie.tmdb_id)));
    const nextIds=new Set(after.map(movie=>Number(movie.tmdb_id)));
    return {
      before,after,
      gained:after.filter(movie=>!previousIds.has(Number(movie.tmdb_id))),
      lost:before.filter(movie=>!nextIds.has(Number(movie.tmdb_id))),
      shared:after.filter(movie=>previousIds.has(Number(movie.tmdb_id)))
    };
  }
  return {serviceKeys,validateSnapshot,matchBookmarkIds,compareBookmarkAvailability};
});
