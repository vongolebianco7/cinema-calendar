const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
test('legacy concierge redirects stay within their document roots despite base href', () => {
  for (const [file, expected] of [
    ['agent.html', '/discover.html?mode=concierge'],
    ['cinelva/agent.html', '/cinelva/discover.html?mode=concierge']
  ]) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const match = html.match(/location\\.replace\\(new URL\\("([^"]+)",location\\.href\\)\\.href\\)/);
    assert.ok(match, file + ' must resolve relative to the document URL');
    assert.equal(new URL(match[1], 'https://cinelva.example/' + file).pathname + '?mode=concierge', expected);
  }
});
