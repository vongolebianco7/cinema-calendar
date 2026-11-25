'use strict';

// Browser UI tests must not depend on the protected production Vercel API.
// Register this fallback before scenario-specific routes; later routes win.
module.exports = async function mockBackendApi(routeable) {
  await routeable.route(
    /^https:\/\/backend-one-gray-94\.vercel\.app\/api\//,
    async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      let body = {
        movies: [],
        external: [],
        results: [],
        people: [],
        ids: [],
        providers: [],
        theaters: [],
        events: [],
        tv: [],
        items: [],
      };
      if (pathname.endsWith('/movie-detail')) body = { movie: null };
      else if (pathname.endsWith('/people')) body = { people: [], ids: [] };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    },
  );
};
