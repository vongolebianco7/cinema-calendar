const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const routes = [
  'preview/ocean/index.html', 'preview/ocean/ocean-demo.html',
  'preview/ocean/poc/index.html', 'preview/ocean/renderer/index.html',
  'preview/ocean/real-fish/index.html', 'preview/ocean/real-fish/ecosystem.html',
  'preview/ocean/real-fish/milestone-gallery.html',
  'preview/ocean/real-fish/ordinary-species-gallery.html',
];

for (const count of [0, 1, 1000]) {
  test(`legacy record URLs reach the record dashboard without touching ${count} saved records`, () => {
    const stored = new Map([['cinelva-library-records-v2', JSON.stringify(Object.fromEntries(
      Array.from({length: count}, (_, index) => [String(index + 900001), {
        id: String(index + 900001), title: `保存記録 ${index + 1}`, watched: true,
        rating: 0, watchedAt: index % 2 ? '2024' : null, custom: { preserve: true },
      }])
    ))], ['cinemap-viewing-records-v1', '{}']]);
    const before = [...stored];
    for (const route of routes) {
      const source = fs.readFileSync(route, 'utf8');
      const location = new URL(`https://cinelva.vercel.app/${route}?retirement-test=${count}#records`);
      let destination;
      location.replace = url => { destination = new URL(url); };
      vm.runInNewContext(source.match(/<script>([^]*?)<\/script>/)[1], {
        URL, location, localStorage: {
          getItem: key => stored.get(key) ?? null,
          setItem() { assert.fail('a redirect must not write saved data'); },
          removeItem() { assert.fail('a redirect must not delete saved data'); },
          clear() { assert.fail('a redirect must not clear saved data'); },
        },
      });
      assert.equal(destination.pathname, '/my-cinelva/', route);
      assert.equal(destination.search, location.search, route);
      assert.equal(destination.hash, location.hash, route);
      assert.equal(destination.origin, location.origin, route);
      assert.deepEqual([...stored], before);
      const fallback = source.match(/<a href="([^"]+)"/)[1];
      assert.equal(new URL(fallback, location).pathname, '/my-cinelva/', 'no-JavaScript fallback reaches records too');
    }
  });
}
