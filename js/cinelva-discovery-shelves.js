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
    confidenceScore(movie) {
      const votes=Math.max(0,Number(movie?.votes??movie?.vote_count??0));
      const rating=Math.max(0,Math.min(10,Number(movie?.score??movie?.vote_average??0)));
      return (votes*rating+400*6.5)/(votes+400);
    },
    discoveryRank(movie,category) {
      const votes=Math.max(0,Number(movie?.votes??movie?.vote_count??0));
      const rating=this.confidenceScore(movie);
      const awards=Array.isArray(movie?.awards)?movie.awards.length:0;
      const awardBonus=Math.min(0.6,awards*0.12);
      if(category==="hidden")return rating+Math.max(0,1-Math.abs(Math.log10(Math.max(1,votes))-3)/2)*0.4+awardBonus;
      return rating+awardBonus;
    },
    isTrueStoryCandidate(movie) {
      const text=[movie?.title,movie?.original_title,movie?.originalTitle,movie?.overview].filter(Boolean).join(" ").toLowerCase();
      const tags=[...(Array.isArray(movie?.genres)?movie.genres:[]),...(Array.isArray(movie?.keywords)?movie.keywords:[])].map(x=>String(typeof x==="string"?x:x?.name||"").toLowerCase());
      const positive=/実話に基づ|実話を基に|実際の事件|実際の出来事|実在の人物|実録|伝記|based on (a )?true story|based on (true|real|actual) events|based on real (people|life)|biograph|true account/i;
      const negative=/実話ではない|実話ではありません|架空の物語|フィクションです|not based on (a )?true story|fictional story/i;
      if(negative.test(text))return false;
      if(positive.test(text))return true;
      return tags.some(x=>/^(based on a true story|based on true events|true story|biography|biographical|実話|実録|伝記|史実|実際の事件)$/.test(x));
    }
  };
});
