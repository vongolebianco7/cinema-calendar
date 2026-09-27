const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('revivals render confirmed items from the static editorial file without per-movie requests', async () => {
  const html = fs.readFileSync('revivals.html', 'utf8');
  const script = html.match(/<script>(const (?:API|E)=[\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, 'revivals page script exists');
  const nodes = { status: {}, grid: {} }, requests = [];
  const context = {
    document: { getElementById: id => nodes[id] },
    Date, encodeURIComponent,
    fetch: async url => {
      requests.push(url);
      if (!url.startsWith('data/revival_screenings.json')) throw Error('Unexpected external request');
      return { ok: true, json: async () => ({generated_at:'2026-09-26', screenings:[{title:'Verified film',date:'2026-10-23',venue:'Example Cinema',source_url:'https://example.org/official'}]}) };
    }
  };
  vm.runInNewContext(script, context);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.deepEqual(requests, ['data/revival_screenings.json']);
  assert.match(nodes.grid.innerHTML, /Verified film/);
  assert.match(nodes.grid.innerHTML, /https:\/\/example.org\/official/);
  assert.doesNotMatch(nodes.grid.innerHTML, /再上映候補/);
});
