(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.CinelvaDiscoveryShelves = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const INITIAL_VISIBLE = 16;
  return {
    hasMore(items) {
      return Array.isArray(items) && items.length > INITIAL_VISIBLE;
    },
    visibleItems(items, expanded) {
      const list = Array.isArray(items) ? items : [];
      return expanded ? list : list.slice(0, INITIAL_VISIBLE);
    },
    isTrueStoryCandidate(movie) {
      const text = [movie?.title, movie?.original_title, movie?.originalTitle, movie?.overview,
        ...(Array.isArray(movie?.genres) ? movie.genres : [])].join(" ").toLowerCase();
      return /実話|実在|史実|実録|伝記|実際の事件|実際の出来事|ドキュメンタリー|based on (a )?true story|true events|based on (real|actual) (events|people)|true account|biograph|documentary/i.test(text);
    }
  };
});
