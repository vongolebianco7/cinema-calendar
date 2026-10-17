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
    }
  };
});
